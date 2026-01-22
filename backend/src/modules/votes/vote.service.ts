import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { votes, Vote } from '@/db/schema/vote.table';
import { proposals } from '@/db/schema/proposal.table';
import { meals } from '@/db/schema/meal.table';
import { familyMembers } from '@/db/schema/family-member.table';
import { CreateVoteInput } from './vote.schema';
import { NotFoundError, ForbiddenError, ConflictError } from '@/shared/errors';

export class VoteService {
  /**
   * Cast a vote for a proposal
   */
  async castVote(userId: string, proposalId: string, data: CreateVoteInput): Promise<Vote> {
    // 1. Get proposal to check meal and family
    const [proposal] = await db
      .select({
        id: proposals.id,
        mealId: proposals.mealId,
        familyId: meals.familyId,
        mealStatus: meals.status,
      })
      .from(proposals)
      .innerJoin(meals, eq(proposals.mealId, meals.id))
      .where(eq(proposals.id, proposalId));

    if (!proposal) {
      throw new NotFoundError('Proposal not found');
    }

    // 2. Check permissions
    await this.checkFamilyMembership(proposal.familyId, userId);

    // 3. Check meal status
    if (proposal.mealStatus !== 'PLANNING') {
      throw new ForbiddenError('Voting is closed for this meal');
    }

    // 4. Check rank uniqueness for user in this meal
    const existingRankVote = await db
      .select({
        voteId: votes.id,
        proposalId: votes.proposalId,
      })
      .from(votes)
      .innerJoin(proposals, eq(votes.proposalId, proposals.id))
      .where(and(
        eq(votes.userId, userId),
        eq(proposals.mealId, proposal.mealId),
        eq(votes.rankPosition, data.rankPosition)
      ));
      
    if (existingRankVote.length > 0) {
      const conflict = existingRankVote.find(v => v.proposalId !== proposalId);
      if (conflict) {
        throw new ConflictError(`You have already assigned Rank ${data.rankPosition} to another proposal`);
      }
    }

    // 5. Upsert vote
    const [existingVote] = await db
      .select()
      .from(votes)
      .where(and(
        eq(votes.userId, userId),
        eq(votes.proposalId, proposalId)
      ));

    if (existingVote) {
      // Update
      const [updatedVote] = await db
        .update(votes)
        .set({
          rankPosition: data.rankPosition,
          updatedAt: new Date(),
        })
        .where(eq(votes.id, existingVote.id))
        .returning();
      
      if (!updatedVote) {
        throw new Error('Failed to update vote');
      }
      return updatedVote;
    } else {
      // Create
      const [newVote] = await db
        .insert(votes)
        .values({
          userId,
          proposalId,
          rankPosition: data.rankPosition,
        })
        .returning();
      
      if (!newVote) {
        throw new Error('Failed to create vote');
      }
      return newVote;
    }
  }

  /**
   * Remove a vote
   */
  async deleteVote(id: string, userId: string): Promise<void> {
    const [vote] = await db
      .select()
      .from(votes)
      .where(eq(votes.id, id));

    if (!vote) {
      throw new NotFoundError('Vote not found');
    }

    if (vote.userId !== userId) {
      throw new ForbiddenError('You can only delete your own votes');
    }

    // Check if voting is still open (optional, but good practice)
    // We need to fetch meal status via proposal
    const [proposal] = await db
      .select({
        mealStatus: meals.status
      })
      .from(proposals)
      .innerJoin(meals, eq(proposals.mealId, meals.id))
      .where(eq(proposals.id, vote.proposalId));

    if (proposal && proposal.mealStatus !== 'PLANNING') {
      throw new ForbiddenError('Cannot change votes for locked meals');
    }

    await db.delete(votes).where(eq(votes.id, id));
  }
  
  /**
   * Calculate results for a meal
   */
  async getMealVotes(mealId: string, userId: string): Promise<any[]> {
     // Check access via meal/family
     const [meal] = await db
       .select()
       .from(meals)
       .where(eq(meals.id, mealId));
       
     if (!meal) throw new NotFoundError('Meal not found');
     
     await this.checkFamilyMembership(meal.familyId, userId);

     return await db
       .select({
         proposalId: votes.proposalId,
         rank: votes.rankPosition,
         userId: votes.userId,
       })
       .from(votes)
       .innerJoin(proposals, eq(votes.proposalId, proposals.id))
       .where(eq(proposals.mealId, mealId));
  }

  /**
   * Calculate winning proposals using Borda count
   * Rank 1 = 10 points, Rank 2 = 9 points, ..., Rank 10 = 1 point
   */
  async calculateWinningProposals(mealId: string): Promise<string[]> {
    // Get all proposals for this meal
    const mealProposals = await db
      .select()
      .from(proposals)
      .where(eq(proposals.mealId, mealId));

    if (mealProposals.length === 0) {
      return [];
    }

    // Get all votes for this meal
    const allVotes = await db
      .select({
        proposalId: votes.proposalId,
        rankPosition: votes.rankPosition,
      })
      .from(votes)
      .innerJoin(proposals, eq(votes.proposalId, proposals.id))
      .where(eq(proposals.mealId, mealId));

    // Calculate scores using Borda count
    const scores: Record<string, number> = {};
    
    for (const proposal of mealProposals) {
      scores[proposal.id] = 0;
    }

    for (const vote of allVotes) {
      const proposalScore = scores[vote.proposalId];
      if (proposalScore !== undefined) {
        // Convert rank position to points (11 - rank = 10 points for rank 1)
        const points = 11 - vote.rankPosition;
        scores[vote.proposalId] = proposalScore + points;
      }
    }

    // Sort proposals by score (descending) and return IDs
    const sortedProposals = Object.entries(scores)
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .map(([proposalId]) => proposalId);

    // Return all proposals sorted by score (top winner first)
    // Admin can then choose from top-ranked
    return sortedProposals;
  }

  /**
   * Get vote summary with scores for a meal
   */
  async getVoteSummary(mealId: string, userId: string): Promise<{
    proposalId: string;
    dishName: string;
    voteCount: number;
    averageRank: number;
    totalScore: number;
    proposedBy: string;
  }[]> {
    // Check access
    const [meal] = await db
      .select()
      .from(meals)
      .where(eq(meals.id, mealId));
       
    if (!meal) throw new NotFoundError('Meal not found');
    await this.checkFamilyMembership(meal.familyId, userId);

    // Get all proposals with their votes
    const mealProposals = await db
      .select()
      .from(proposals)
      .where(eq(proposals.mealId, mealId));

    const results = [];

    for (const proposal of mealProposals) {
      const proposalVotes = await db
        .select()
        .from(votes)
        .where(eq(votes.proposalId, proposal.id));

      const voteCount = proposalVotes.length;
      const totalScore = proposalVotes.reduce((sum, vote) => {
        return sum + (11 - vote.rankPosition);
      }, 0);
      
      const averageRank = voteCount > 0
        ? proposalVotes.reduce((sum, vote) => sum + vote.rankPosition, 0) / voteCount
        : 0;

      results.push({
        proposalId: proposal.id,
        dishName: proposal.dishName,
        voteCount,
        averageRank: Math.round(averageRank * 10) / 10,
        totalScore,
        proposedBy: proposal.userId,
      });
    }

    // Sort by total score descending
    return results.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Helper: Check if user is a member of the family
   */
  private async checkFamilyMembership(familyId: string, userId: string): Promise<void> {
    const [membership] = await db
      .select()
      .from(familyMembers)
      .where(and(
        eq(familyMembers.familyId, familyId),
        eq(familyMembers.userId, userId)
      ));

    if (!membership) {
      throw new ForbiddenError('You are not a member of this family');
    }
  }
}

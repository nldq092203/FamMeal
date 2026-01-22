import { eq, desc, and, isNull, sql } from 'drizzle-orm';
import { db } from '@/db';
import { meals } from '@/db/schema/meal.table';
import { proposals } from '@/db/schema/proposal.table';
import { votes } from '@/db/schema/vote.table';
import { users } from '@/db/schema/user.table';
import { NotFoundError } from '@/shared/errors';
import { checkFamilyRole } from '@/middleware/rbac.middleware';

export class MealHistoryService {
  /**
   * Get family meal history
   */
  async getFamilyHistory(
    familyId: string,
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ) {
    // Check family membership
    await checkFamilyRole(userId, familyId, 'MEMBER');

    const { limit = 10, offset = 0 } = options;

    // Get past meals for this family
    const familyMeals = await db
      .select()
      .from(meals)
      .where(and(
        eq(meals.familyId, familyId),
        isNull(meals.deletedAt)
      ))
      .orderBy(desc(meals.scheduledFor))
      .limit(limit)
      .offset(offset);

    // For each meal, get basic stats
    const history = [];

    for (const meal of familyMeals) {
      const proposalCount = await db
        .select()
        .from(proposals)
        .where(eq(proposals.mealId, meal.id));

      const voteCount = await db
        .select()
        .from(votes)
        .innerJoin(proposals, eq(votes.proposalId, proposals.id))
        .where(eq(proposals.mealId, meal.id));

      history.push({
        id: meal.id,
        date: meal.scheduledFor,
        mealType: meal.mealType,
        status: meal.status,
        proposalCount: proposalCount.length,
        voteCount: voteCount.length,
        votingClosedAt: meal.votingClosedAt,
        finalizedAt: meal.finalizedAt,
        hasFinalDecision: !!meal.finalDecision,
      });
    }

    return history;
  }

  /**
   * Get comprehensive meal summary
   */
  async getMealSummary(mealId: string, userId: string) {
    // Get meal details
    const [meal] = await db
      .select()
      .from(meals)
      .where(and(eq(meals.id, mealId), isNull(meals.deletedAt)));

    if (!meal) {
      throw new NotFoundError('Meal not found');
    }

    // Check access
    await checkFamilyRole(userId, meal.familyId, 'MEMBER');

    const [mealProposals, voteAgg] = await Promise.all([
      // Get all proposals with proposer info
      db
        .select({
          id: proposals.id,
          dishName: proposals.dishName,
          ingredients: proposals.ingredients,
          notes: proposals.notes,
          extra: proposals.extra,
          userId: proposals.userId,
          userName: users.name,
          userUsername: users.username,
          createdAt: proposals.createdAt,
        })
        .from(proposals)
        .leftJoin(users, eq(proposals.userId, users.id))
        .where(and(eq(proposals.mealId, mealId), isNull(proposals.deletedAt))),
      // Aggregate vote stats in one query
      db
        .select({
          proposalId: votes.proposalId,
          voteCount: sql<number>`count(*)`.mapWith(Number),
          averageRank: sql<number>`avg(${votes.rankPosition})`.mapWith(Number),
          totalScore: sql<number>`sum(11 - ${votes.rankPosition})`.mapWith(Number),
        })
        .from(votes)
        .innerJoin(proposals, eq(votes.proposalId, proposals.id))
        .where(and(eq(proposals.mealId, mealId), isNull(proposals.deletedAt)))
        .groupBy(votes.proposalId),
    ]);

    const voteStatsByProposalId = new Map(
      voteAgg.map((v) => [
        v.proposalId,
        {
          voteCount: v.voteCount ?? 0,
          averageRank: v.averageRank ?? 0,
          totalScore: v.totalScore ?? 0,
        },
      ])
    );

    // Get final decision if exists
    const finalDecision = meal.finalDecision;

    const voteSummary = mealProposals
      .map((p) => {
        const stats = voteStatsByProposalId.get(p.id) ?? { voteCount: 0, averageRank: 0, totalScore: 0 };
        return {
          proposalId: p.id,
          dishName: p.dishName,
          voteCount: stats.voteCount,
          averageRank: Math.round(stats.averageRank * 10) / 10,
          totalScore: stats.totalScore,
          proposedBy: p.userId,
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore);

    return {
      meal: {
        id: meal.id,
        date: meal.scheduledFor,
        mealType: meal.mealType,
        status: meal.status,
        constraints: meal.constraints,
        votingClosedAt: meal.votingClosedAt,
        finalizedAt: meal.finalizedAt,
      },
      proposals: mealProposals.map(p => ({
        ...p,
        voteStats: voteStatsByProposalId.get(p.id) ?? { voteCount: 0, averageRank: 0, totalScore: 0 },
        isSelected: finalDecision?.selectedProposalId === p.id,
      })),
      voteSummary,
      finalDecision,
    };
  }
}

import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { proposals, Proposal } from '@/db/schema/proposal.table';
import { meals } from '@/db/schema/meal.table';
import { familyMembers } from '@/db/schema/family-member.table';
import { CreateProposalInput, UpdateProposalInput } from './proposal.schema';
import { NotFoundError, ForbiddenError } from '@/shared/errors';

export class ProposalService {
  /**
   * Create a new proposal for a meal
   */
  async createProposal(userId: string, mealId: string, data: CreateProposalInput): Promise<Proposal> {
    // 1. Get meal to check family access
    const [meal] = await db
      .select()
      .from(meals)
      .where(eq(meals.id, mealId));

    if (!meal) {
      throw new NotFoundError('Meal not found');
    }

    // 2. Check family membership
    await this.checkFamilyMembership(meal.familyId, userId);

    // 3. Check if meal is still in PLANNING phase
    if (meal.status !== 'PLANNING') {
      throw new ForbiddenError('Cannot submit proposals for locked or completed meals');
    }

    // 4. Create proposal
    const [newProposal] = await db
      .insert(proposals)
      .values({
        mealId,
        userId,
        dishName: data.dishName,
        ingredients: data.ingredients,
        notes: data.notes,
        extra: data.extra || { imageUrls: [] },
      })
      .returning();

    if (!newProposal) {
      throw new Error('Failed to create proposal');
    }

    return newProposal;
  }

  /**
   * Get all proposals for a meal
   */
  async getMealProposals(userId: string, mealId: string): Promise<Proposal[]> {
    // 1. Get meal to check family access
    const [meal] = await db
      .select()
      .from(meals)
      .where(eq(meals.id, mealId));

    if (!meal) {
      throw new NotFoundError('Meal not found');
    }

    // 2. Check access
    await this.checkFamilyMembership(meal.familyId, userId);

    // 3. List proposals
    return await db
      .select()
      .from(proposals)
      .where(eq(proposals.mealId, mealId));
  }

  /**
   * Get proposal by ID
   */
  async getProposalById(id: string, userId: string): Promise<Proposal> {
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, id));

    if (!proposal) {
      throw new NotFoundError('Proposal not found');
    }

    // Get meal to verify family access
    const [meal] = await db
      .select()
      .from(meals)
      .where(eq(meals.id, proposal.mealId));

    if (!meal) {
      throw new NotFoundError('Associated meal not found');
    }

    await this.checkFamilyMembership(meal.familyId, userId);

    return proposal;
  }

  /**
   * Update a proposal
   */
  async updateProposal(id: string, userId: string, data: UpdateProposalInput): Promise<Proposal> {
    const proposal = await this.getProposalById(id, userId);

    // Allow user to update ONLY their own proposal
    if (proposal.userId !== userId) {
      throw new ForbiddenError('You can only update your own proposals');
    }

    // Check meal status
    const [meal] = await db
      .select()
      .from(meals)
      .where(eq(meals.id, proposal.mealId));

    if (!meal || meal.status !== 'PLANNING') {
      throw new ForbiddenError('Cannot update proposals for locked meals');
    }

    const [updatedProposal] = await db
      .update(proposals)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, id))
      .returning();

    if (!updatedProposal) {
      throw new NotFoundError('Proposal not found');
    }

    return updatedProposal;
  }

  /**
   * Delete a proposal
   */
  async deleteProposal(id: string, userId: string): Promise<void> {
    const proposal = await this.getProposalById(id, userId);

    // Allow deletion if:
    // 1. User owns the proposal
    // 2. Meal is not locked
    // OR (future) Family Admin can delete any proposal

    if (proposal.userId !== userId) {
      throw new ForbiddenError('You can only delete your own proposals');
    }

    const [meal] = await db
      .select()
      .from(meals)
      .where(eq(meals.id, proposal.mealId));

    if (!meal || meal.status !== 'PLANNING') {
      throw new ForbiddenError('Cannot delete proposals for locked meals');
    }

    await db
      .update(proposals)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(proposals.id, id));
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

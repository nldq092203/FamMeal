import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { meals } from '@/db/schema/meal.table';
import { NotFoundError, ValidationError } from '@/shared/errors';
import { checkFamilyRole } from '@/middleware/rbac.middleware';

export class MealAdminService {
  /**
   * Close voting for a meal (lock it)
   */
  async closeVoting(mealId: string, userId: string): Promise<typeof meals.$inferSelect> {
    const [meal] = await db.select().from(meals).where(eq(meals.id, mealId));
    
    if (!meal) {
      throw new NotFoundError('Meal not found');
    }

    // Check admin role
    await checkFamilyRole(userId, meal.familyId, 'ADMIN');

    if (meal.status === 'COMPLETED') {
      throw new ValidationError('Cannot lock a completed meal');
    }

    const [updatedMeal] = await db
      .update(meals)
      .set({
        status: 'LOCKED',
        votingClosedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(meals.id, mealId))
      .returning();

    if (!updatedMeal) {
      throw new NotFoundError('Meal not found or could not be updated');
    }

    return updatedMeal;
  }

  /**
   * Reopen voting for a meal (unlock it)
   */
  async reopenVoting(mealId: string, userId: string): Promise<typeof meals.$inferSelect> {
    const [meal] = await db.select().from(meals).where(eq(meals.id, mealId));
    
    if (!meal) {
      throw new NotFoundError('Meal not found');
    }

    await checkFamilyRole(userId, meal.familyId, 'ADMIN');

    if (meal.status === 'COMPLETED') {
      throw new ValidationError('Cannot reopen voting for a completed meal');
    }

    const [updatedMeal] = await db
      .update(meals)
      .set({
        status: 'PLANNING',
        votingClosedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(meals.id, mealId))
      .returning();

    if (!updatedMeal) {
      throw new NotFoundError('Meal not found or could not be updated');
    }

    return updatedMeal;
  }

  /**
   * Finalize a meal with admin decision
   */
  async finalizeMeal(
    mealId: string, 
    userId: string, 
    decision: {
      selectedProposalId: string;
      reason?: string;
    }
  ): Promise<typeof meals.$inferSelect> {
    const [meal] = await db.select().from(meals).where(eq(meals.id, mealId));
    
    if (!meal) {
      throw new NotFoundError('Meal not found');
    }

    await checkFamilyRole(userId, meal.familyId, 'ADMIN');

    const finalDecision = {
      selectedProposalId: decision.selectedProposalId,
      decidedByUserId: userId,
      reason: decision.reason,
    };

    const [updatedMeal] = await db
      .update(meals)
      .set({
        status: 'COMPLETED',
        finalizedAt: new Date(),
        finalDecision,
        updatedAt: new Date(),
      })
      .where(eq(meals.id, mealId))
      .returning();

    if (!updatedMeal) {
      throw new NotFoundError('Meal not found or could not be updated');
    }

    return updatedMeal;
  }
}

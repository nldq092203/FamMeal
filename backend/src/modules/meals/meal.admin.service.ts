import { eq, and, isNull, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { meals } from '@/db/schema/meal.table';
import { proposals } from '@/db/schema/proposal.table';
import { NotFoundError, ValidationError } from '@/shared/errors';
import { checkFamilyRole } from '@/middleware/rbac.middleware';
import { familyMembers } from '@/db/schema/family-member.table';
import { NotificationService } from '@/modules/notifications/notification.service';
import { NotificationType } from '@/shared/notifications';

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

    if (meal.status !== 'PLANNING') {
      throw new ValidationError('Can only close voting for meals in PLANNING status');
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

    if (meal.status !== 'LOCKED') {
      throw new ValidationError('Can only reopen voting for meals in LOCKED status');
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
      selectedProposalIds: string[];
      cookUserId?: string;
      reason?: string;
    }
  ): Promise<typeof meals.$inferSelect> {
    return await db.transaction(async (tx) => {
      const [meal] = await tx.select().from(meals).where(eq(meals.id, mealId));

      if (!meal) {
        throw new NotFoundError('Meal not found');
      }

      await checkFamilyRole(userId, meal.familyId, 'ADMIN');

      if (meal.status !== 'LOCKED') {
        throw new ValidationError('Can only finalize meals in LOCKED status');
      }

      const selectedProposalIds = decision.selectedProposalIds;

      const proposalsInMeal = await tx
        .select({ id: proposals.id })
        .from(proposals)
        .where(and(
          inArray(proposals.id, selectedProposalIds),
          eq(proposals.mealId, mealId),
          isNull(proposals.deletedAt)
        ));

      if (proposalsInMeal.length !== selectedProposalIds.length) {
        throw new NotFoundError('One or more selected proposals were not found in this meal');
      }

      const finalDecision = {
        selectedProposalIds,
        decidedByUserId: userId,
        reason: decision.reason,
      };

      const cookUserId = decision.cookUserId ?? meal.cookUserId ?? userId;
      await checkFamilyRole(cookUserId, meal.familyId, 'MEMBER');

      const [updatedMeal] = await tx
        .update(meals)
        .set({
          status: 'COMPLETED',
          finalizedAt: new Date(),
          finalDecision,
          cookUserId,
          updatedAt: new Date(),
        })
        .where(eq(meals.id, mealId))
        .returning();

      if (!updatedMeal) {
        throw new NotFoundError('Meal not found or could not be updated');
      }

      const members = await tx
        .select({ userId: familyMembers.userId })
        .from(familyMembers)
        .where(eq(familyMembers.familyId, meal.familyId));

      const memberIds = members.map((m) => m.userId);

      const notificationService = new NotificationService(tx as unknown as typeof db);

      // Notify everyone that the meal is finalized
      if (memberIds.length) {
        await notificationService.createForUsers({
          users: memberIds,
          familyId: meal.familyId,
          type: NotificationType.MEAL_FINALIZED,
          refId: mealId,
        });
      }

      // Notify assigned cook
      await notificationService.createForUser({
        userId: cookUserId,
        familyId: meal.familyId,
        type: NotificationType.COOK_ASSIGNED,
        refId: mealId,
      });

      return updatedMeal;
    });
  }
}

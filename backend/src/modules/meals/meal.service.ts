import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { db } from '@/db';
import { meals, Meal } from '@/db/schema/meal.table';
import { familyMembers } from '@/db/schema/family-member.table';
import { CreateMealInput, UpdateMealInput, ListMealsQuery } from './meal.schema';
import { NotFoundError, ForbiddenError, ConflictError } from '@/shared/errors';

export class MealService {
  /**
   * Create a new meal plan
   */
  async createMeal(userId: string, data: CreateMealInput): Promise<Meal> {
    // 1. Check if user is member of the family
    await this.checkFamilyMembership(data.familyId, userId);

    // 2. Check for duplicates (same family, date, type)
    const [existingMeal] = await db
      .select()
      .from(meals)
      .where(and(
        eq(meals.familyId, data.familyId),
        eq(meals.scheduledFor, data.scheduledFor),
        eq(meals.mealType, data.mealType)
      ));

    if (existingMeal) {
      throw new ConflictError(
        `A ${data.mealType} is already planned for ${data.scheduledFor} for this family`
      );
    }

    // 3. Create meal
    const [newMeal] = await db
      .insert(meals)
      .values({
        familyId: data.familyId,
        scheduledFor: data.scheduledFor,
        mealType: data.mealType,
        constraints: data.constraints || {},
        status: 'PLANNING',
      })
      .returning();

    if (!newMeal) {
      throw new Error('Failed to create meal');
    }

    return newMeal;
  }

  /**
   * Get meal by ID
   */
  async getMealById(id: string, userId: string): Promise<Meal> {
    const [meal] = await db
      .select()
      .from(meals)
      .where(eq(meals.id, id));

    if (!meal) {
      throw new NotFoundError('Meal not found');
    }

    // Check access
    await this.checkFamilyMembership(meal.familyId, userId);

    return meal;
  }

  /**
   * List meals for a family with optional filters
   */
  async listMeals(userId: string, query: ListMealsQuery): Promise<Meal[]> {
    // Check access
    await this.checkFamilyMembership(query.familyId, userId);

    // Build query
    const conditions = [eq(meals.familyId, query.familyId)];

    if (query.startDate) {
      conditions.push(gte(meals.scheduledFor, query.startDate));
    }

    if (query.endDate) {
      conditions.push(lte(meals.scheduledFor, query.endDate));
    }

    if (query.status) {
      conditions.push(eq(meals.status, query.status));
    }

    const results = await db
      .select()
      .from(meals)
      .where(and(...conditions))
      .orderBy(desc(meals.scheduledFor));

    return results;
  }

  /**
   * Update meal details
   */
  async updateMeal(id: string, userId: string, data: UpdateMealInput): Promise<Meal> {
    const meal = await this.getMealById(id, userId);

    // Only allow updates if not COMPLETED (unless admin? for now simple rule)
    if (meal.status === 'COMPLETED') {
      throw new ForbiddenError('Cannot update a completed meal');
    }

    const [updatedMeal] = await db
      .update(meals)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(meals.id, id))
      .returning();

    if (!updatedMeal) {
      throw new NotFoundError('Meal not found');
    }

    return updatedMeal;
  }

  /**
   * Delete a meal
   */
  async deleteMeal(id: string, userId: string): Promise<void> {
    await this.getMealById(id, userId);

    // Soft delete
    await db
      .update(meals)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(meals.id, id));
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

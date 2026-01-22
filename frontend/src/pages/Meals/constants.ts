import type { MealType } from '@/types'

// Meal type display labels
export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  BREAKFAST: 'Breakfast',
  BRUNCH: 'Brunch',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snack',
  OTHER: 'Other',
}

// Default times for each meal type
export const MEAL_TYPE_TIMES: Record<MealType, string> = {
  BREAKFAST: '8:00 AM',
  BRUNCH: '10:30 AM',
  LUNCH: '12:00 PM',
  DINNER: '6:00 PM',
  SNACK: '3:00 PM',
  OTHER: '12:00 PM',
}

// Emoji icons for each meal type
export const MEAL_TYPE_ICONS: Record<MealType, string> = {
  BREAKFAST: '🍳',
  BRUNCH: '🥐',
  LUNCH: '🥗',
  DINNER: '🍝',
  SNACK: '🍿',
  OTHER: '🍽️',
}

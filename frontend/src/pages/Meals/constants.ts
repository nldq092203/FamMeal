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

// Default times for each meal type (in 24-hour format for form inputs)
export const MEAL_TYPE_TIMES: Record<MealType, string> = {
  BREAKFAST: '08:00',
  BRUNCH: '10:30',
  LUNCH: '12:00',
  DINNER: '18:00',
  SNACK: '15:00',
  OTHER: '12:00',
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

export const MEAL_TYPES: Array<{ value: MealType; label: string; emoji: string }> = (
  Object.keys(MEAL_TYPE_LABELS) as MealType[]
).map((value) => ({
  value,
  label: MEAL_TYPE_LABELS[value],
  emoji: MEAL_TYPE_ICONS[value],
}))

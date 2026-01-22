import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mealService } from '@/api/meal.service'
import { queryKeys } from '@/query/queryKeys'
import type { MealConstraints, MealType } from '@/types'

export function useCreateMealMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      familyId: string
      scheduledFor: string
      mealType: MealType
      constraints?: MealConstraints
    }) => mealService.createMeal(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.meals.all })
    },
  })
}


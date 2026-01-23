import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mealService } from '@/api/meal.service'
import { queryKeys } from '@/query/queryKeys'
import type { MealConstraints, MealType } from '@/types'

export function useUpdateMealMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      mealId: string
      scheduledFor?: string
      mealType?: MealType
      constraints?: MealConstraints
    }) => mealService.updateMeal(input.mealId, { scheduledFor: input.scheduledFor, mealType: input.mealType, constraints: input.constraints }),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.meals.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.mealSummary.byId(variables.mealId) }),
      ])
    },
  })
}


import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mealService } from '@/api/meal.service'
import { queryKeys } from '@/query/queryKeys'

export function useDeleteMealMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { mealId: string }) => mealService.deleteMeal(input.mealId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.meals.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.mealSummary.all })
    },
  })
}


import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mealService } from '@/api/meal.service'
import { queryKeys } from '@/query/queryKeys'

export function useDeleteMealMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { mealId: string }) => mealService.deleteMeal(input.mealId),
    onSuccess: async (_, variables) => {
      // Remove now-invalid per-meal caches immediately (deleted meal + cascaded votes).
      queryClient.removeQueries({ queryKey: queryKeys.mealSummary.byId(variables.mealId) })
      queryClient.removeQueries({ queryKey: queryKeys.mealVotes.myByMealId(variables.mealId) })

      // Reset queries to ensure deleted data is cleared from cache immediately
      // This forces a hard refetch when the list is viewed again
      await queryClient.resetQueries({ queryKey: queryKeys.meals.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.mealSummary.all })
    },
  })
}

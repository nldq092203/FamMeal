import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminMealService } from '@/api/meal.service'
import { queryKeys } from '@/query/queryKeys'

export function useFinalizeMealMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { mealId: string; selectedProposalIds: string[]; cookUserId: string; reason?: string }) => {
      return adminMealService.finalizeMeal(input.mealId, {
        selectedProposalIds: input.selectedProposalIds,
        cookUserId: input.cookUserId,
        reason: input.reason,
      })
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.mealSummary.byId(variables.mealId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.meals.all }),
      ])
    },
  })
}

export function useCloseVotingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (mealId: string) => adminMealService.closeVoting(mealId),
    onSuccess: async (_, mealId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.mealSummary.byId(mealId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.meals.all }),
      ])
    },
  })
}

export function useReopenVotingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (mealId: string) => adminMealService.reopenVoting(mealId),
    onSuccess: async (_, mealId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.mealSummary.byId(mealId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.meals.all }),
      ])
    },
  })
}

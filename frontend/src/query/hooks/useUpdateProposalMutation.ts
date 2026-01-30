import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mealService } from '@/api/meal.service'
import { queryKeys } from '@/query/queryKeys'

export function useUpdateProposalMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      proposalId: string
      mealId: string
      dishName?: string
      ingredients?: string
      notes?: string
      extra?: {
        imageUrls?: string[]
        restaurant?: { name: string; addressUrl?: string }
      }
    }) => {
      const { proposalId, mealId, ...patch } = input
      void mealId
      return mealService.updateProposal(proposalId, patch)
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.mealSummary.byId(variables.mealId) })
    },
  })
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mealService } from '@/api/meal.service'
import { queryKeys } from '@/query/queryKeys'

export function useDeleteProposalMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { proposalId: string; mealId: string }) => {
      await mealService.deleteProposal(input.proposalId)
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.mealSummary.byId(variables.mealId) }),
        queryClient.invalidateQueries({ queryKey: ['proposals'] }),
      ])
    },
  })
}

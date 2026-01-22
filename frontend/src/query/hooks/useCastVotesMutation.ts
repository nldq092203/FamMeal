import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mealService } from '@/api/meal.service'
import { queryKeys } from '@/query/queryKeys'

export function useCastVotesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { mealId: string; rankedProposalIds: string[] }) => {
      await Promise.all(input.rankedProposalIds.map((proposalId, index) => mealService.castVote(proposalId, index + 1)))
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.mealSummary.byId(variables.mealId) }),
      ])
    },
  })
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mealService } from '@/api/meal.service'
import { queryKeys } from '@/query/queryKeys'

export function useCastVotesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { mealId: string; rankedProposalIds: string[] }) => {
      await mealService.bulkCastVotes(
        input.mealId,
        input.rankedProposalIds.map((proposalId, index) => ({
          proposalId,
          rankPosition: index + 1,
        }))
      )
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.mealSummary.byId(variables.mealId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.mealVotes.myByMealId(variables.mealId) }),
      ])
    },
  })
}

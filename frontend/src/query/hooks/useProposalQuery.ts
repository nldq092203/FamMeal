import { useQuery } from '@tanstack/react-query'
import { mealService } from '@/api/meal.service'

export function useProposalQuery(proposalId: string | null | undefined) {
  return useQuery({
    queryKey: ['proposals', 'byId', proposalId] as const,
    enabled: Boolean(proposalId),
    queryFn: async () => {
      if (!proposalId) throw new Error('Missing proposalId')
      return mealService.getProposal(proposalId)
    },
  })
}


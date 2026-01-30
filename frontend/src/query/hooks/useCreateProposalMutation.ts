import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mealService } from '@/api/meal.service'
import { queryKeys } from '@/query/queryKeys'

export function useCreateProposalMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      mealId: string
      dishName: string
      ingredients?: string
      notes?: string
      extra?: {
        imageUrls?: string[]
        restaurant?: { name: string; addressUrl?: string }
      }
    }) => {
      return mealService.createProposal(input.mealId, {
        dishName: input.dishName,
        ingredients: input.ingredients,
        notes: input.notes,
        extra: input.extra,
      })
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.mealSummary.byId(variables.mealId) })
    },
  })
}

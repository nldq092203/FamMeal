import { useQuery } from '@tanstack/react-query'
import { mealService } from '@/api/meal.service'
import { queryKeys } from '@/query/queryKeys'
import type { MealMyVote } from '@/types'

export function useMyMealVotesQuery(mealId: string | null | undefined, enabled = true) {
  return useQuery<MealMyVote[]>({
    queryKey: mealId ? queryKeys.mealVotes.myByMealId(mealId) : queryKeys.mealVotes.all,
    enabled: Boolean(mealId) && enabled,
    staleTime: 60_000,
    queryFn: async () => {
      if (!mealId) throw new Error('Missing mealId')
      return mealService.getMyVotesForMeal(mealId)
    },
  })
}


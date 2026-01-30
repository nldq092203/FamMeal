import { useQuery } from '@tanstack/react-query'
import { mealService } from '@/api/meal.service'
import { queryKeys } from '@/query/queryKeys'

export function useMealSummaryQuery(mealId: string | null | undefined) {
  return useQuery({
    queryKey: mealId ? queryKeys.mealSummary.byId(mealId) : queryKeys.mealSummary.all,
    enabled: Boolean(mealId),
    staleTime: 60_000,
    queryFn: async () => {
      if (!mealId) throw new Error('Missing mealId')
      return mealService.getMealSummary(mealId)
    },
    retry: false, // Don't retry if it fails (e.g. 404 deleted)
  })
}

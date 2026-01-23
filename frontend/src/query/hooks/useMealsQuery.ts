import { useQuery } from '@tanstack/react-query'
import { mealService } from '@/api/meal.service'
import { queryKeys } from '@/query/queryKeys'

export function useMealsQuery(params: { familyId: string | null; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: params.familyId ? queryKeys.meals.list({ familyId: params.familyId, startDate: params.startDate, endDate: params.endDate }) : queryKeys.meals.all,
    enabled: Boolean(params.familyId),
    queryFn: async () => {
      if (!params.familyId) throw new Error('Missing familyId')
      const { meals } = await mealService.getMeals({
        familyId: params.familyId,
        startDate: params.startDate,
        endDate: params.endDate,
      })
      return meals
    },
  })
}


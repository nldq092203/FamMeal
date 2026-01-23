import { useQuery } from '@tanstack/react-query'
import { mealService } from '@/api/meal.service'
import { queryKeys } from '@/query/queryKeys'
import type { Meal } from '@/types'

export function useActiveMealQuery(familyId: string | null | undefined) {
  return useQuery({
    queryKey: familyId ? queryKeys.meals.active(familyId) : queryKeys.meals.all,
    enabled: Boolean(familyId),
    queryFn: async (): Promise<Meal | null> => {
      if (!familyId) throw new Error('Missing familyId')
      const { meals } = await mealService.getMeals({ familyId, page: 1, pageSize: 10 })
      return meals.find((m) => m.status === 'PLANNING') ?? meals[0] ?? null
    },
  })
}


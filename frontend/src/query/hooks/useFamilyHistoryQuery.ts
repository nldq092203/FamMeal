import { useQuery } from '@tanstack/react-query'
import { familyService } from '@/api/family.service'
import { queryKeys } from '@/query/queryKeys'

export function useFamilyHistoryQuery(familyId: string | null | undefined, params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: familyId ? queryKeys.families.history(familyId, params) : queryKeys.families.all,
    enabled: Boolean(familyId),
    queryFn: async () => {
      if (!familyId) throw new Error('Missing familyId')
      return familyService.getFamilyHistory(familyId, params)
    },
  })
}


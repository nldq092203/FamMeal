import { useQuery } from '@tanstack/react-query'
import { familyService } from '@/api/family.service'
import { queryKeys } from '@/query/queryKeys'

export function useFamilyQuery(familyId: string | null | undefined) {
  return useQuery({
    queryKey: familyId ? queryKeys.families.byId(familyId) : queryKeys.families.all,
    enabled: Boolean(familyId),
    queryFn: async () => {
      if (!familyId) throw new Error('Missing familyId')
      return familyService.getFamily(familyId)
    },
  })
}


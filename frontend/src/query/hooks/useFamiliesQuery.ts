import { useQuery } from '@tanstack/react-query'
import { familyService } from '@/api/family.service'
import { queryKeys } from '@/query/queryKeys'

export function useFamiliesQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.families.list(),
    enabled,
    queryFn: async () => familyService.getMyFamilies(),
  })
}

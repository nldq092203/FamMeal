import { useQuery } from '@tanstack/react-query'
import { userService } from '@/api/user.service'
import { queryKeys } from '@/query/queryKeys'

export function useUserSuggestionsQuery(query: string, options?: { minLength?: number }) {
  const minLength = options?.minLength ?? 2
  const trimmed = query.trim()

  return useQuery({
    queryKey: queryKeys.users.suggestions(trimmed),
    enabled: trimmed.length >= minLength,
    queryFn: async () => userService.suggestUsers(trimmed),
    staleTime: 60_000,
  })
}


import { useQuery } from '@tanstack/react-query'
import { userService, type UserSuggestion } from '@/api/user.service'
import { queryKeys } from '@/query/queryKeys'

export type UserLookupResult = {
  exists: boolean
  match: UserSuggestion | null
}

function findExactUserMatch(target: string, suggestions: UserSuggestion[]): UserSuggestion | null {
  const normalized = target.trim().toLowerCase()
  if (!normalized) return null

  const isEmail = normalized.includes('@')
  if (isEmail) {
    return suggestions.find((s) => (s.email ?? '').trim().toLowerCase() === normalized) ?? null
  }

  return suggestions.find((s) => s.username.trim().toLowerCase() === normalized) ?? null
}

export function useUserLookupQuery(target: string, options?: { enabled?: boolean }) {
  const trimmed = target.trim()
  const enabled = options?.enabled ?? false

  return useQuery({
    queryKey: queryKeys.users.lookup(trimmed),
    enabled: enabled && trimmed.length > 0,
    queryFn: async (): Promise<UserLookupResult> => {
      const suggestions = await userService.suggestUsers(trimmed)
      const match = findExactUserMatch(trimmed, suggestions)
      return { exists: Boolean(match), match }
    },
    staleTime: 0,
  })
}


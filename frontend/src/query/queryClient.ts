import { QueryClient } from '@tanstack/react-query'

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 15_000,
        gcTime: 5 * 60_000,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}


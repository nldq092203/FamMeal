import { useInfiniteQuery } from '@tanstack/react-query'
import { notificationService } from '@/api/notification.service'
import { queryKeys } from '@/query/queryKeys'

export function useNotificationsInfiniteQuery(
  familyId: string | null | undefined,
  params?: { limit?: number }
) {
  const limit = params?.limit ?? 20

  return useInfiniteQuery({
    queryKey: familyId ? queryKeys.notifications.list(familyId, { limit }) : queryKeys.notifications.all,
    enabled: Boolean(familyId),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      if (!familyId) throw new Error('Missing familyId')
      return notificationService.listNotifications(familyId, { limit, cursor: pageParam })
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })
}


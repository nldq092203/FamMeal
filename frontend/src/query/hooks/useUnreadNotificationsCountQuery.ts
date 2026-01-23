import { useQuery } from '@tanstack/react-query'
import { notificationService } from '@/api/notification.service'
import { queryKeys } from '@/query/queryKeys'

export function useUnreadNotificationsCountQuery(familyId: string | null | undefined) {
  return useQuery({
    queryKey: familyId ? queryKeys.notifications.unreadCount(familyId) : queryKeys.notifications.all,
    enabled: Boolean(familyId),
    queryFn: async () => {
      if (!familyId) throw new Error('Missing familyId')
      return notificationService.getUnreadCount(familyId)
    },
  })
}


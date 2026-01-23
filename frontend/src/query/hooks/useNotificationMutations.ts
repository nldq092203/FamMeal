import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { notificationService } from '@/api/notification.service'
import { queryKeys } from '@/query/queryKeys'
import type { NotificationsListResponse } from '@/types'

function markReadInInfiniteData(data: InfiniteData<NotificationsListResponse> | undefined, id: string, readAtIso: string) {
  if (!data) return data
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((item) => (item.id === id ? { ...item, isRead: true, readAt: item.readAt ?? readAtIso } : item)),
    })),
  }
}

function markAllReadInInfiniteData(data: InfiniteData<NotificationsListResponse> | undefined, readAtIso: string) {
  if (!data) return data
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((item) => ({ ...item, isRead: true, readAt: item.readAt ?? readAtIso })),
    })),
  }
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { familyId: string; id: string }) => notificationService.markRead(input.familyId, input.id),
    onMutate: async (input) => {
      const readAtIso = new Date().toISOString()

      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all })

      const previousUnread = queryClient.getQueryData<number>(queryKeys.notifications.unreadCount(input.familyId))
      const previousList = queryClient.getQueriesData<InfiniteData<NotificationsListResponse>>({
        queryKey: queryKeys.notifications.all,
      })

      const wasUnreadInCache = previousList.some(([key, data]) => {
        if (!Array.isArray(key)) return false
        if (key[0] !== 'notifications' || key[1] !== 'list' || key[2] !== input.familyId) return false
        const pages = data?.pages ?? []
        for (const page of pages) {
          const found = page.items.find((item) => item.id === input.id)
          if (found) return found.isRead === false
        }
        return false
      })

      if (typeof previousUnread === 'number' && previousUnread > 0 && wasUnreadInCache) {
        queryClient.setQueryData(queryKeys.notifications.unreadCount(input.familyId), previousUnread - 1)
      }

      for (const [key] of previousList) {
        if (!Array.isArray(key)) continue
        if (key[0] !== 'notifications' || key[1] !== 'list' || key[2] !== input.familyId) continue
        queryClient.setQueryData<InfiniteData<NotificationsListResponse>>(key, (data) => markReadInInfiniteData(data, input.id, readAtIso))
      }

      return { previousUnread, previousList }
    },
    onError: async (_error, input, ctx) => {
      if (!ctx) return
      if (typeof ctx.previousUnread === 'number') {
        queryClient.setQueryData(queryKeys.notifications.unreadCount(input.familyId), ctx.previousUnread)
      }
      for (const [key, data] of ctx.previousList ?? []) {
        queryClient.setQueryData(key, data)
      }
    },
    onSettled: async (_data, _error, input) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount(input.familyId) }),
      ])
    },
  })
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (familyId: string) => notificationService.markAllRead(familyId),
    onMutate: async (familyId) => {
      const readAtIso = new Date().toISOString()

      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all })

      const previousUnread = queryClient.getQueryData<number>(queryKeys.notifications.unreadCount(familyId))
      const previousList = queryClient.getQueriesData<InfiniteData<NotificationsListResponse>>({
        queryKey: queryKeys.notifications.all,
      })

      queryClient.setQueryData(queryKeys.notifications.unreadCount(familyId), 0)

      for (const [key] of previousList) {
        if (!Array.isArray(key)) continue
        if (key[0] !== 'notifications' || key[1] !== 'list' || key[2] !== familyId) continue
        queryClient.setQueryData<InfiniteData<NotificationsListResponse>>(key, (data) => markAllReadInInfiniteData(data, readAtIso))
      }

      return { previousUnread, previousList }
    },
    onError: async (_error, familyId, ctx) => {
      if (!ctx) return
      if (typeof ctx.previousUnread === 'number') {
        queryClient.setQueryData(queryKeys.notifications.unreadCount(familyId), ctx.previousUnread)
      }
      for (const [key, data] of ctx.previousList ?? []) {
        queryClient.setQueryData(key, data)
      }
    },
    onSettled: async (_data, _error, familyId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount(familyId) }),
      ])
    },
  })
}

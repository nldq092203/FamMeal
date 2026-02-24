import apiClient from './client'
import { unwrapApiResponse } from '@/api/unwrap'
import type {
  ApiResponse,
  FamilyNotification,
  MarkAllNotificationsReadResponse,
  NotificationsListResponse,
  UnreadNotificationsCountResponse,
} from '@/types'

function unwrapMaybeApiResponse<T>(data: unknown): T {
  if (data && typeof data === 'object' && 'success' in data) return unwrapApiResponse(data as ApiResponse<T>)
  return data as T
}

function normalizeNotificationsListResponse(data: unknown, opts?: { limit?: number }): NotificationsListResponse {
  const limit = opts?.limit

  if (Array.isArray(data)) {
    const items = data as FamilyNotification[]
    const nextCursor =
      typeof limit === 'number' && items.length >= limit ? (items[items.length - 1]?.createdAt ?? null) : null
    return { items, nextCursor }
  }

  if (data && typeof data === 'object') {
    const maybe = data as Partial<NotificationsListResponse>
    if (Array.isArray(maybe.items)) {
      return { items: maybe.items, nextCursor: maybe.nextCursor ?? null }
    }
  }

  throw new Error('Unexpected notifications response shape.')
}

export const notificationService = {
  async listNotifications(
    familyId: string,
    params?: { limit?: number; cursor?: string }
  ): Promise<NotificationsListResponse> {
    const response = await apiClient.get<NotificationsListResponse | ApiResponse<NotificationsListResponse>>(
      `/families/${familyId}/notifications`,
      { params }
    )
    return normalizeNotificationsListResponse(unwrapMaybeApiResponse<unknown>(response.data), { limit: params?.limit })
  },

  async getUnreadCount(familyId: string): Promise<number> {
    const response = await apiClient.get<UnreadNotificationsCountResponse | ApiResponse<UnreadNotificationsCountResponse>>(
      `/families/${familyId}/notifications/unread-count`
    )
    return unwrapMaybeApiResponse<UnreadNotificationsCountResponse>(response.data).count
  },

  async markRead(familyId: string, id: string): Promise<void> {
    await apiClient.post(`/families/${familyId}/notifications/${id}/read`)
  },

  async markAllRead(familyId: string): Promise<MarkAllNotificationsReadResponse> {
    const response = await apiClient.post<MarkAllNotificationsReadResponse | ApiResponse<MarkAllNotificationsReadResponse>>(
      `/families/${familyId}/notifications/read-all`
    )
    const data = unwrapMaybeApiResponse<unknown>(response.data)
    if (data && typeof data === 'object' && 'updated' in data) return data as MarkAllNotificationsReadResponse
    return { updated: 0 }
  },
}

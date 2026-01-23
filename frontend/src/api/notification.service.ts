import apiClient from './client'
import { unwrapApiResponse } from '@/api/unwrap'
import type {
  ApiResponse,
  MarkAllNotificationsReadResponse,
  NotificationsListResponse,
  UnreadNotificationsCountResponse,
} from '@/types'

function unwrapMaybeApiResponse<T>(data: unknown): T {
  if (data && typeof data === 'object' && 'success' in data) return unwrapApiResponse(data as ApiResponse<T>)
  return data as T
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
    return unwrapMaybeApiResponse<NotificationsListResponse>(response.data)
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
    return unwrapMaybeApiResponse<MarkAllNotificationsReadResponse>(response.data)
  },
}


import apiClient from './client'
import { unwrapApiResponse } from '@/api/unwrap'
import type { ApiResponse, UpdateUserRequest, User } from '@/types'

export interface UserSuggestion {
  id: string
  username: string
  displayName: string
  avatarId: string | null
  email?: string
}

export const userService = {
  async suggestUsers(query: string, limit: number = 8): Promise<UserSuggestion[]> {
    const response = await apiClient.get<ApiResponse<UserSuggestion[]>>('/users/suggest', {
      params: { q: query, limit }
    })
    return unwrapApiResponse(response.data)
  },

  async getUser(id: string): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`)
    return unwrapApiResponse(response.data)
  },

  async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
    const response = await apiClient.patch<ApiResponse<User>>(`/users/${id}`, data)
    return unwrapApiResponse(response.data)
  },
}

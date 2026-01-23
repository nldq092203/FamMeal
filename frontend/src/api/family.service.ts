import apiClient from './client';
import { unwrapApiResponse } from '@/api/unwrap';
import type {
  ApiResponse,
  CreateFamilyRequest,
  Family,
  FamilyListItem,
  FamilyMember,
  FamilyRole,
  FamilySettings,
  MealHistoryItem,
} from '@/types';

export const familyService = {
  async createFamily(data: CreateFamilyRequest): Promise<Family> {
    const response = await apiClient.post<ApiResponse<Family>>('/families', data);
    return unwrapApiResponse(response.data);
  },

  async getMyFamilies(): Promise<FamilyListItem[]> {
    const response = await apiClient.get<ApiResponse<FamilyListItem[]>>('/families');
    return unwrapApiResponse(response.data);
  },

  async getFamily(id: string): Promise<Family> {
    const response = await apiClient.get<ApiResponse<Family>>(`/families/${id}`);
    return unwrapApiResponse(response.data);
  },

  async getFamilyHistory(
    id: string,
    params?: { limit?: number; offset?: number }
  ): Promise<MealHistoryItem[]> {
    const response = await apiClient.get<ApiResponse<MealHistoryItem[]>>(
      `/families/${id}/history`,
      { params }
    );
    return unwrapApiResponse(response.data);
  },
};

export const adminFamilyService = {
  async updateFamily(id: string, data: { name?: string; settings?: FamilySettings }): Promise<Family> {
    const response = await apiClient.patch<ApiResponse<Family>>(`/admin/families/${id}`, data);
    return unwrapApiResponse(response.data);
  },

  async updateFamilyProfile(id: string, data: { name?: string; avatarId?: string }): Promise<Family> {
    const response = await apiClient.patch<ApiResponse<Family>>(`/admin/families/${id}/profile`, data);
    return unwrapApiResponse(response.data);
  },

  async updateFamilySettings(id: string, settings: FamilySettings): Promise<Family> {
    const response = await apiClient.patch<ApiResponse<Family>>(`/admin/families/${id}/settings`, { settings });
    return unwrapApiResponse(response.data);
  },

  async addMember(
    familyId: string,
    data: {
      username?: string;
      email?: string;
      role: FamilyRole;
    }
  ): Promise<FamilyMember> {
    const response = await apiClient.post<ApiResponse<FamilyMember>>(
      `/admin/families/${familyId}/members`,
      data
    );
    return unwrapApiResponse(response.data);
  },

  async removeMember(familyId: string, memberId: string): Promise<void> {
    await apiClient.delete(`/admin/families/${familyId}/members/${memberId}`);
  },
};

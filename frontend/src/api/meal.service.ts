import apiClient from './client';
import { unwrapApiResponse, unwrapPaginatedResponse } from '@/api/unwrap';
import type {
  ApiResponse,
  Meal,
  MealSummary,
  MealType,
  MealConstraints,
  Pagination,
  Proposal,
  Vote,
  MealMyVote,

} from '@/types';

export const mealService = {
  // Meal CRUD
  async createMeal(data: {
    familyId: string;
    scheduledFor: string;
    mealType: MealType;
    constraints?: MealConstraints;
  }): Promise<Meal> {
    const response = await apiClient.post<ApiResponse<Meal>>('/admin/meals', data);
    return unwrapApiResponse(response.data);
  },

  async getMeals(params: {
    familyId: string;
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<{ meals: Meal[]; pagination: Pagination }> {
    const response = await apiClient.get<ApiResponse<Meal[]>>('/meals', { params });
    const { data, pagination } = unwrapPaginatedResponse(response.data);
    return { meals: data, pagination: pagination! };
  },

  async getMeal(id: string): Promise<Meal> {
    const response = await apiClient.get<ApiResponse<Meal>>(`/meals/${id}`);
    return unwrapApiResponse(response.data);
  },

  async getMealSummary(id: string): Promise<MealSummary> {
    const response = await apiClient.get<ApiResponse<MealSummary>>(`/meals/${id}/summary`);
    return unwrapApiResponse(response.data);
  },

  async getMyVotesForMeal(mealId: string): Promise<MealMyVote[]> {
    const response = await apiClient.get<ApiResponse<MealMyVote[]>>(`/meals/${mealId}/votes/my-votes`);
    return unwrapApiResponse(response.data);
  },

  async updateMeal(
    id: string,
    data: {
      scheduledFor?: string; // ISO 8601 timestamp
      mealType?: MealType;
      constraints?: MealConstraints;
    }
  ): Promise<Meal> {
    const response = await apiClient.patch<ApiResponse<Meal>>(`/admin/meals/${id}`, data);
    return unwrapApiResponse(response.data);
  },

  async deleteMeal(id: string): Promise<void> {
    await apiClient.delete(`/admin/meals/${id}`);
  },

  // Proposals
  async createProposal(
    mealId: string,
    data: {
      dishName: string;
      ingredients?: string;
      notes?: string;
      extra?: {
        imageUrls?: string[];
        restaurant?: { name: string; addressUrl?: string };
      };
    }
  ): Promise<Proposal> {
    const response = await apiClient.post<ApiResponse<Proposal>>(
      `/meals/${mealId}/proposals`,
      data
    );
    return unwrapApiResponse(response.data);
  },

  async getProposals(mealId: string): Promise<Proposal[]> {
    const response = await apiClient.get<ApiResponse<Proposal[]>>(`/meals/${mealId}/proposals`);
    return unwrapApiResponse(response.data);
  },

  async updateProposal(
    id: string,
    data: {
      dishName?: string;
      ingredients?: string;
      notes?: string;
      extra?: {
        imageUrls?: string[];
        restaurant?: { name: string; addressUrl?: string };
      };
    }
  ): Promise<Proposal> {
    const response = await apiClient.patch<ApiResponse<Proposal>>(`/proposals/${id}`, data);
    return unwrapApiResponse(response.data);
  },

  async getProposal(id: string): Promise<Proposal> {
    const response = await apiClient.get<ApiResponse<Proposal>>(`/proposals/${id}`);
    return unwrapApiResponse(response.data);
  },

  async deleteProposal(id: string): Promise<void> {
    await apiClient.delete(`/proposals/${id}`);
  },

  // Voting
  async bulkCastVotes(
    mealId: string,
    votes: Array<{ proposalId: string; rankPosition: number }>
  ): Promise<Vote[]> {
    const response = await apiClient.post<ApiResponse<Vote[]>>(`/meals/${mealId}/votes/bulk`, { votes });
    return unwrapApiResponse(response.data);
  },

  async castVote(proposalId: string, rankPosition: number): Promise<Vote> {
    const response = await apiClient.post<ApiResponse<Vote>>(`/proposals/${proposalId}/votes`, {
      rankPosition,
    });
    return unwrapApiResponse(response.data);
  },

  async deleteVote(id: string): Promise<void> {
    await apiClient.delete(`/votes/${id}`);
  },
};

export const adminMealService = {
  async closeVoting(mealId: string): Promise<Meal> {
    const response = await apiClient.post<ApiResponse<Meal>>(`/admin/meals/${mealId}/close-voting`);
    return unwrapApiResponse(response.data);
  },

  async reopenVoting(mealId: string): Promise<Meal> {
    const response = await apiClient.post<ApiResponse<Meal>>(`/admin/meals/${mealId}/reopen-voting`);
    return unwrapApiResponse(response.data);
  },

  async finalizeMeal(
    mealId: string,
    data: {
      selectedProposalIds: string[];
      cookUserId: string;
      reason?: string;
    }
  ): Promise<Meal> {
    const response = await apiClient.post<ApiResponse<Meal>>(`/admin/meals/${mealId}/finalize`, data);
    return unwrapApiResponse(response.data);
  },
};

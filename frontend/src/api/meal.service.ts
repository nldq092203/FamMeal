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
  ProposalWithStats,
  VoteSummary,

} from '@/types';

function getSelectedProposalIds(finalDecision: unknown): string[] {
  if (!finalDecision || typeof finalDecision !== 'object') return []
  const fd = finalDecision as { selectedProposalIds?: unknown; selectedProposalId?: unknown }
  if (Array.isArray(fd.selectedProposalIds)) return fd.selectedProposalIds.filter((x): x is string => typeof x === 'string' && x.length > 0)
  if (typeof fd.selectedProposalId === 'string' && fd.selectedProposalId) return [fd.selectedProposalId]
  return []
}

function computeVoteStats(votes: unknown, proposalCount: number) {
  const safeVotes = Array.isArray(votes) ? votes : []
  const voteCount = safeVotes.length
  if (voteCount === 0) return { voteCount: 0, averageRank: 0, totalScore: 0 }

  const sumRank = safeVotes.reduce((sum, v) => {
    if (!v || typeof v !== 'object') return sum
    const rank = (v as { rankPosition?: unknown }).rankPosition
    return sum + (typeof rank === 'number' ? rank : 0)
  }, 0)
  const averageRank = sumRank / voteCount

  const totalScore = safeVotes.reduce((sum, v) => {
    if (!v || typeof v !== 'object') return sum
    const rank = (v as { rankPosition?: unknown }).rankPosition
    if (typeof rank !== 'number' || !rank) return sum
    const score = proposalCount - rank + 1
    return sum + (score > 0 ? score : 0)
  }, 0)

  return { voteCount, averageRank, totalScore }
}

function normalizeMealSummary(data: unknown): MealSummary {
  if (data && typeof data === 'object' && 'meal' in data) {
    return data as MealSummary
  }

  // Backward-compatible: backend previously returned a Meal with included proposals/votes.
  const meal = data as Partial<Meal> & { proposals?: unknown; finalDecision?: unknown }
  const proposalsRaw = Array.isArray(meal?.proposals) ? (meal.proposals as unknown[]) : []
  const proposalCount = proposalsRaw.length
  const selectedIds = new Set(getSelectedProposalIds(meal?.finalDecision))

  const proposals: ProposalWithStats[] = proposalsRaw.map((pUnknown) => {
    const p = pUnknown as {
      id: string
      mealId: string
      userId: string
      dishName: string
      ingredients?: string
      notes?: string
      extra?: Proposal['extra']
      createdAt?: string
      updatedAt?: string
      deletedAt?: string | null
      votes?: unknown
      user?: { name?: string; username?: string }
    }

    const votes = Array.isArray(p?.votes) ? (p.votes as unknown[]) : []
    const voteStats = computeVoteStats(votes, proposalCount)
    return {
      id: p.id,
      mealId: p.mealId,
      userId: p.userId,
      dishName: p.dishName,
      ingredients: p.ingredients,
      notes: p.notes,
      extra: p.extra,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      deletedAt: p.deletedAt,
      userName: p.user?.name ?? '',
      userUsername: p.user?.username ?? '',
      voteStats,
      isSelected: selectedIds.has(p.id),
    }
  })

  const voteSummary: VoteSummary[] = proposals.map((p) => ({
    proposalId: p.id,
    dishName: p.dishName,
    voteCount: p.voteStats.voteCount,
    averageRank: p.voteStats.averageRank,
    totalScore: p.voteStats.totalScore,
    proposedBy: p.userName || p.userUsername || 'Unknown',
  }))

  const mealOnly = { ...meal }
  delete (mealOnly as { proposals?: unknown }).proposals

  return {
    meal: mealOnly as Meal,
    proposals,
    voteSummary,
    ...(meal?.finalDecision ? { finalDecision: meal.finalDecision } : {}),
  }
}

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
  }): Promise<{ meals: Meal[]; pagination?: Pagination }> {
    const limit = params.pageSize ?? 20
    const page = params.page ?? 1
    const offset = Math.max(0, (page - 1) * limit)

    const requestParams: Record<string, unknown> = {
      familyId: params.familyId,
      status: params.status,
      from: params.startDate,
      to: params.endDate,
      limit,
      offset,
    }

    const response = await apiClient.get<ApiResponse<unknown>>('/meals', { params: requestParams });

    // Primary: wrapped array + optional pagination
    const { data, pagination } = unwrapPaginatedResponse(response.data as ApiResponse<unknown>)
    if (Array.isArray(data)) return { meals: data as Meal[], pagination }

    // Fallback: { meals: [...] }
    if (data && typeof data === 'object' && Array.isArray((data as { meals?: unknown }).meals)) {
      return { meals: (data as { meals: Meal[] }).meals, pagination }
    }

    // Final fallback: no pagination wrapper
    return { meals: unwrapApiResponse(response.data as ApiResponse<Meal[]>) }
  },

  async getMeal(id: string): Promise<Meal> {
    const response = await apiClient.get<ApiResponse<Meal>>(`/meals/${id}`);
    return unwrapApiResponse(response.data);
  },

  async getMealSummary(id: string): Promise<MealSummary> {
    const response = await apiClient.get<ApiResponse<unknown>>(`/meals/${id}/summary`);
    return normalizeMealSummary(unwrapApiResponse(response.data));
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

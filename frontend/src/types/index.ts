// Type Definitions for FamMeal API

export interface User {
  id: string;
  email?: string;
  username?: string;
  name?: string;
  avatarId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown[];
}

export interface ApiMeta {
  timestamp?: string;
}

export interface Family {
  id: string;
  name: string;
  avatarId?: string;
  settings?: FamilySettings;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  myRole?: FamilyRole;
  members?: Array<{
    userId: string;
    username: string;
    name: string;
    avatarId: string;
    role: FamilyRole;
    joinedAt: string;
  }>;
}

export type FamilyRole = 'ADMIN' | 'MEMBER';

export interface FamilySettings {
  defaultCuisinePreferences?: string[];
  defaultDietaryRestrictions?: string[];
  defaultMaxBudget?: number;
  defaultMaxPrepTime?: number;
}

export interface CreateFamilyMemberInvite {
  userId: string;
  role: FamilyRole;
  email?: string;
}

export interface CreateFamilyRequest {
  name: string;
  avatarId?: string;
  settings?: FamilySettings;
  members?: CreateFamilyMemberInvite[];
}

export interface FamilyListItem {
  id: string;
  name: string;
  role: FamilyRole;
  memberCount?: number;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  role: FamilyRole;
  joinedAt: string;
}

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'BRUNCH' | 'OTHER';
export type MealStatus = 'PLANNING' | 'LOCKED' | 'COMPLETED';

export interface MealConstraints {
  maxBudget?: number;
  maxPrepTime?: number;
  maxPrepTimeMinutes?: number;
  dietaryRestrictions?: string[];
  cuisinePreferences?: string[];
  servings?: number;
}

export interface FinalDecision {
  selectedProposalId: string;
  decidedByUserId: string;
  reason?: string;
}

export interface Meal {
  id: string;
  familyId: string;
  scheduledFor?: string;
  date?: string;
  mealType: MealType;
  status: MealStatus;
  constraints?: MealConstraints;
  finalDecision?: FinalDecision;
  votingClosedAt?: string;
  finalizedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface Proposal {
  id: string;
  mealId: string;
  userId: string;
  dishName: string;
  ingredients?: string;
  notes?: string;
  extra?: {
    imageUrls: string[];
  };
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface Vote {
  id: string;
  proposalId: string;
  userId: string;
  rankPosition: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

// Extended types for API responses

export interface VoteStats {
  voteCount: number;
  averageRank: number;
  totalScore: number;
}

export interface ProposalWithStats extends Proposal {
  userName: string;
  userUsername: string;
  voteStats: VoteStats;
  isSelected: boolean;
}

export interface VoteSummary {
  proposalId: string;
  dishName: string;
  voteCount: number;
  averageRank: number;
  totalScore: number;
  proposedBy: string;
}

export interface MealSummary {
  meal: Meal;
  proposals: ProposalWithStats[];
  voteSummary: VoteSummary[];
  finalDecision?: FinalDecision;
}

export interface MealHistoryItem {
  id: string;
  date: string;
  mealType: MealType;
  status: MealStatus;
  proposalCount: number;
  voteCount: number;
  votingClosedAt?: string;
  finalizedAt?: string;
  hasFinalDecision: boolean;
}

export interface Pagination {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  username: string;
  email: string;
  password: string;
  avatarId?: string;
}

export interface AuthApiData {
  userId: string;
  accessToken: string;
  refreshToken: string;
}

export interface MeApiData {
  userId: string;
  email?: string;
}

export interface UpdateUserRequest {
  email?: string;
  username?: string;
  name?: string;
  avatarId?: string | null;
  password?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// API Response wrapper
export type ApiResponse<T> =
  | { success: true; data: T; pagination?: Pagination }
  | { success: false; error: ApiError; meta?: ApiMeta };

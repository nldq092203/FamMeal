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
  userId?: string;
  username?: string;
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
  isDiningOut?: boolean;
  maxBudget?: number;
  maxPrepTime?: number;
  maxPrepTimeMinutes?: number;
  dietaryRestrictions?: string[];
  cuisinePreferences?: string[];
  servings?: number;
}

export interface FinalDecision {
  selectedProposalIds: string[];
  cookUserId?: string;
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
  cookUserId?: string;
}

export interface Proposal {
  id: string;
  mealId: string;
  userId: string;
  dishName: string;
  ingredients?: string;
  notes?: string;
  extra?: {
    imageUrls?: string[];
    restaurant?: {
      name: string;
      addressUrl?: string;
    };
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

export interface MealMyVote {
  voteId: string;
  proposalId: string;
  dishName: string;
  rankPosition: number;
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
  /**
   * Optional current-user vote info when provided by the API.
   * Not all endpoints include this field.
   */
  myVote?: Pick<Vote, 'id' | 'proposalId' | 'rankPosition'>;
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
  /**
   * Optional current-user votes when provided by the API.
   * Used to show/edit a user's ranking without refetching.
   */
  myVotes?: Vote[];
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
  cookUserId?: string;
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

// Notifications
export type NotificationTypeId = 1 | 2 | 3 | 4 | 5 | 6;

export const NotificationType = {
  MEAL_PROPOSAL: 1,
  MEAL_FINALIZED: 2,
  MEMBER_JOINED: 3,
  REMINDER: 4,
  COOK_ASSIGNED: 5,
  WELCOME_FAMILY: 6,
} as const satisfies Record<string, NotificationTypeId>;

export interface FamilyNotification {
  id: string;
  type: NotificationTypeId;
  refId: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationsListResponse {
  items: FamilyNotification[];
  nextCursor: string | null;
}

export interface UnreadNotificationsCountResponse {
  count: number;
}

export interface MarkAllNotificationsReadResponse {
  updated: number;
}

// API Response wrapper
export type ApiResponse<T> =
  | { success: true; data: T; pagination?: Pagination }
  | { success: false; error: ApiError; meta?: ApiMeta };

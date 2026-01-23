import apiClient from './client';
import { unwrapApiResponse } from '@/api/unwrap';
import type {
  ApiResponse,
  AuthApiData,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  MeApiData,
  User,
} from '@/types';

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {};
  return value as Record<string, unknown>;
}

function normalizeUser(input: unknown): User {
  if (!input || typeof input !== 'object') {
    return { id: '' };
  }
  const obj = asRecord(input);
  const id = (obj.id ?? obj.userId ?? '') as string;
  const email = obj.email as string | undefined;
  const username = obj.username as string | undefined;
  const name = obj.name as string | undefined;
  const avatarId = (obj.avatarId ?? null) as string | null;
  return { id, email, username, name, avatarId };
}

function normalizeAuthData(input: unknown): AuthResponse {
  const obj = asRecord(input);

  // Supported backend shapes:
  // 1) { userId, accessToken, refreshToken }
  // 2) { user: { ... }, accessToken, refreshToken }
  const accessToken = (obj.accessToken ?? '') as string;
  const refreshToken = (obj.refreshToken ?? '') as string;
  const user = obj.user ? normalizeUser(obj.user) : normalizeUser({ userId: obj.userId });

  return { user, accessToken, refreshToken };
}

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthApiData | AuthResponse>>('/auth/register', data);
    const payload = normalizeAuthData(unwrapApiResponse(response.data));
    localStorage.setItem('accessToken', payload.accessToken);
    localStorage.setItem('refreshToken', payload.refreshToken);
    localStorage.setItem('user', JSON.stringify(payload.user));
    return payload;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthApiData | AuthResponse>>('/auth/login', data);
    const payload = normalizeAuthData(unwrapApiResponse(response.data));
    localStorage.setItem('accessToken', payload.accessToken);
    localStorage.setItem('refreshToken', payload.refreshToken);
    localStorage.setItem('user', JSON.stringify(payload.user));
    return payload;
  },

  async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<ApiResponse<RefreshTokenResponse>>('/auth/refresh', data);
    const payload = unwrapApiResponse(response.data);
    localStorage.setItem('accessToken', payload.accessToken);
    localStorage.setItem('refreshToken', payload.refreshToken);
    return payload;
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiResponse<MeApiData | User>>('/auth/me');
    const payload = unwrapApiResponse(response.data);
    return normalizeUser(payload);
  },

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
};

import type { ApiResponse, Pagination } from '@/types';

export function unwrapApiResponse<T>(response: ApiResponse<T>): T {
  if (response.success) return response.data;
  throw new Error(response.error?.message || 'Request failed.');
}

export function unwrapPaginatedResponse<T>(
  response: ApiResponse<T>
): { data: T; pagination?: Pagination } {
  if (response.success) return { data: response.data, pagination: response.pagination };
  throw new Error(response.error?.message || 'Request failed.');
}


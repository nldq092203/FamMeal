import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

/**
 * Controller handler type
 */
export type ControllerHandler<TBody = unknown, TQuerystring = unknown> = (
  request: FastifyRequest<{
    Body: TBody;
    Querystring: TQuerystring;
  }>,
  reply: FastifyReply
) => Promise<void> | void;

/**
 * Route parameter types
 */
export interface RouteParams {
  id: string;
}

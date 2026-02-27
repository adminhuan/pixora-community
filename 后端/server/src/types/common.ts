import { Request } from 'express';

export type UserRole = 'user' | 'moderator' | 'admin';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
}

export interface RequestWithUser extends Request {
  user?: AuthUser;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StandardSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface StandardErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

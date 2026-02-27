import axios from 'axios';

interface PagedPayload<T> {
  data?: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const extractData = <T>(payload: unknown, fallback: T): T => {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }
  const value = (payload as { data?: T }).data;
  return value ?? fallback;
};

export const extractList = <T>(payload: unknown): T[] => {
  if (!payload || typeof payload !== 'object') {
    return [];
  }
  const data = (payload as PagedPayload<T>).data;
  if (!Array.isArray(data)) {
    return [];
  }
  return data;
};

export const extractPagination = (
  payload: unknown,
): {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
} | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const pagination = (payload as PagedPayload<unknown>).pagination;
  return pagination ?? null;
};

export const getErrorMessage = (error: unknown, fallback = '请求失败，请稍后重试') => {
  if (error instanceof Error) {
    return error.message;
  }
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as { error?: { message?: string }; message?: string } | undefined)?.error?.message ??
      (error.response?.data as { message?: string } | undefined)?.message ??
      error.message ??
      fallback
    );
  }
  return fallback;
};

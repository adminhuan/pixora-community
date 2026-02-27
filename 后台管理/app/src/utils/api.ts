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

  return ((payload as { data?: T }).data ?? fallback) as T;
};

export const extractList = <T>(payload: unknown): T[] => {
  const data = extractData<T[] | undefined>(payload, undefined);
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
  if (!pagination) {
    return null;
  }

  return pagination;
};

export const getErrorMessage = (error: unknown, fallback = '请求失败') => {
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

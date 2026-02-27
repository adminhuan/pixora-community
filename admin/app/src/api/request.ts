import axios from 'axios';
import { adminAuthStorage } from '../utils/auth';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
const csrfCookieName = String(import.meta.env.VITE_CSRF_COOKIE_NAME ?? 'apc_csrf_token').trim();
const csrfHeaderName = String(import.meta.env.VITE_CSRF_HEADER_NAME ?? 'x-csrf-token').trim();

const methodsNeedCsrf = new Set(['post', 'put', 'patch', 'delete']);

const readCookie = (name: string): string => {
  if (!name || typeof document === 'undefined') {
    return '';
  }

  const items = document.cookie ? document.cookie.split(';') : [];
  for (const item of items) {
    const [rawKey, ...rawValue] = item.trim().split('=');
    if (rawKey === name) {
      try {
        return decodeURIComponent(rawValue.join('='));
      } catch {
        return rawValue.join('=');
      }
    }
  }

  return '';
};

const resolveCsrfToken = (): string => {
  return readCookie(csrfCookieName);
};

export const request = axios.create({
  baseURL,
  timeout: 12000,
  withCredentials: true
});

request.interceptors.request.use((config) => {
  const token = adminAuthStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const method = String(config.method ?? 'get').toLowerCase();
  if (methodsNeedCsrf.has(method)) {
    const csrfToken = resolveCsrfToken();
    if (csrfToken) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>)[csrfHeaderName] = csrfToken;
    }
  }

  return config;
});

request.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const requestPath = String(originalRequest?.url ?? '');
    const skipRefresh = requestPath.includes('/auth/login') || requestPath.includes('/auth/refresh-token');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !skipRefresh) {
      originalRequest._retry = true;

      try {
        const csrfToken = resolveCsrfToken();
        const refreshHeaders = csrfToken ? { [csrfHeaderName]: csrfToken } : undefined;
        const response = await axios.post(
          `${baseURL}/auth/refresh-token`,
          {},
          {
            withCredentials: true,
            headers: refreshHeaders
          }
        );

        const nextToken = String(response.data?.data?.accessToken ?? '').trim();

        if (nextToken) {
          adminAuthStorage.setAccessToken(nextToken);
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${nextToken}`;

          const nextCsrfToken = String(response.data?.data?.csrfToken ?? '').trim();
          if (nextCsrfToken) {
            (originalRequest.headers as Record<string, string>)[csrfHeaderName] = nextCsrfToken;
          }

          return request(originalRequest);
        }
      } catch {
        adminAuthStorage.clear();
      }
    }

    const message =
      (error.response?.data as { error?: { message?: string }; message?: string } | undefined)?.error?.message ??
      (error.response?.data as { message?: string } | undefined)?.message ??
      error.message ??
      '请求失败';

    return Promise.reject(new Error(message));
  }
);

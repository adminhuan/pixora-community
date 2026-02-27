import { CorsOptions } from 'cors';
import { config } from './index';

const normalizeOrigin = (origin: string): string | null => {
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
};

const configuredOriginSet = new Set(
  config.corsOrigins
    .map((origin) => normalizeOrigin(origin) ?? origin.trim())
    .filter((origin): origin is string => Boolean(origin))
);

const isConfiguredOriginAllowed = (origin: string): boolean => {
  const normalized = normalizeOrigin(origin);
  if (!normalized) {
    return false;
  }
  return configuredOriginSet.has(normalized);
};

const isDevLoopbackOrigin = (origin: string): boolean => {
  const normalized = normalizeOrigin(origin);
  if (!normalized) {
    return false;
  }

  const hostname = new URL(normalized).hostname.toLowerCase();
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]';
};

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (config.env === 'development') {
      if (isConfiguredOriginAllowed(origin) || isDevLoopbackOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
      return;
    }

    if (configuredOriginSet.size === 0) {
      callback(new Error('CORS: 生产环境必须配置 CORS_ORIGINS 且请求必须包含 Origin'));
      return;
    }

    if (isConfiguredOriginAllowed(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-request-id', 'x-csrf-token']
};

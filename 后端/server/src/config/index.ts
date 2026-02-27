import dotenv from 'dotenv';

dotenv.config();

type SameSitePolicy = 'lax' | 'strict' | 'none';

const parseNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) {
    return fallback;
  }
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const parseCsv = (value: string | undefined): string[] => {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseSameSite = (value: string | undefined, fallback: SameSitePolicy): SameSitePolicy => {
  if (!value) {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'lax' || normalized === 'strict' || normalized === 'none') {
    return normalized;
  }
  return fallback;
};

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.length < 32) {
    throw new Error('生产环境必须设置 JWT_ACCESS_SECRET（至少32字符）');
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
    throw new Error('生产环境必须设置 JWT_REFRESH_SECRET（至少32字符）');
  }
}

const corsOrigins = parseCsv(process.env.CORS_ORIGINS ?? process.env.CORS_ORIGIN);
const baseUrl = process.env.BASE_URL ?? 'https://pixora.vip';
const apiPrefix = process.env.API_PREFIX ?? '/api/v1';
const env = process.env.NODE_ENV ?? 'development';

const refreshCookieSameSite = parseSameSite(process.env.AUTH_REFRESH_COOKIE_SAMESITE, 'lax');
const refreshCookieSecure =
  refreshCookieSameSite === 'none' ? true : parseBoolean(process.env.AUTH_REFRESH_COOKIE_SECURE, env === 'production');
const refreshCookieMaxAgeMs = parseNumber(process.env.AUTH_REFRESH_COOKIE_MAX_AGE_MS, 7 * 24 * 60 * 60 * 1000);

const csrfCookieSameSite = parseSameSite(process.env.AUTH_CSRF_COOKIE_SAMESITE, refreshCookieSameSite);
const csrfCookieSecure =
  csrfCookieSameSite === 'none' ? true : parseBoolean(process.env.AUTH_CSRF_COOKIE_SECURE, refreshCookieSecure);

export const config = {
  env,
  port: parseNumber(process.env.PORT, 3300),
  apiPrefix,
  baseUrl,
  databaseUrl:
    process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/ai_programming_community?schema=public',
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseNumber(process.env.REDIS_PORT, 6379),
    db: parseNumber(process.env.REDIS_DB, 0),
    password: process.env.REDIS_PASSWORD
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'replace_with_access_secret_please_change_me',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'replace_with_refresh_secret_please_change_me',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '2h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d'
  },
  oauth: {
    frontendCallbackUrl: process.env.OAUTH_FRONTEND_CALLBACK_URL ?? 'https://pixora.vip/auth/callback',
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
      redirectUri: process.env.GITHUB_REDIRECT_URI ?? `${baseUrl}${apiPrefix}/auth/github/callback`
    },
    wechat: {
      appId: process.env.WECHAT_APP_ID ?? '',
      appSecret: process.env.WECHAT_APP_SECRET ?? '',
      redirectUri: process.env.WECHAT_REDIRECT_URI ?? `${baseUrl}${apiPrefix}/auth/wechat/callback`
    }
  },
  auth: {
    refreshTokenCookieName: process.env.AUTH_REFRESH_COOKIE_NAME ?? 'apc_refresh_token',
    refreshCookiePath: process.env.AUTH_REFRESH_COOKIE_PATH ?? `${apiPrefix}/auth`,
    refreshCookieDomain: process.env.AUTH_REFRESH_COOKIE_DOMAIN,
    refreshCookieSameSite,
    refreshCookieSecure,
    refreshCookieMaxAgeMs,
    csrfCookieName: process.env.AUTH_CSRF_COOKIE_NAME ?? 'apc_csrf_token',
    csrfCookiePath: process.env.AUTH_CSRF_COOKIE_PATH ?? '/',
    csrfCookieDomain: process.env.AUTH_CSRF_COOKIE_DOMAIN ?? process.env.AUTH_REFRESH_COOKIE_DOMAIN,
    csrfCookieSameSite,
    csrfCookieSecure,
    csrfCookieMaxAgeMs: parseNumber(process.env.AUTH_CSRF_COOKIE_MAX_AGE_MS, refreshCookieMaxAgeMs),
    csrfHeaderName: process.env.AUTH_CSRF_HEADER_NAME ?? 'x-csrf-token'
  },
  corsOrigins,
  upload: {
    driver: process.env.UPLOAD_DRIVER ?? 'local',
    dir: process.env.UPLOAD_DIR ?? 'uploads'
  },
  security: {
    trustProxy: parseBoolean(process.env.TRUST_PROXY, false),
    enableHelmetCsp: parseBoolean(process.env.HELMET_ENABLE_CSP, false),
    hstsMaxAgeSeconds: parseNumber(process.env.HSTS_MAX_AGE_SECONDS, 15552000)
  },
  swaggerEnabled: parseBoolean(process.env.SWAGGER_ENABLED, true),
  rateLimitWindowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  rateLimitMax: parseNumber(process.env.RATE_LIMIT_MAX, 300)
};

export type AppConfig = typeof config;

import { resolveSafeRoutePath } from './safe-url';

const POST_LOGIN_REDIRECT_KEY = 'cp_post_login_redirect';

const normalizeTarget = (rawPath: string, fallback = '/'): string => {
  const safePath = resolveSafeRoutePath(rawPath, fallback);
  if (safePath.startsWith('/auth/')) {
    return fallback;
  }
  return safePath;
};

export const savePostLoginRedirect = (rawPath: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  const target = normalizeTarget(rawPath, '/');
  window.sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, target);
};

export const takePostLoginRedirect = (fallback = '/'): string => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const value = window.sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
  if (!value) {
    return fallback;
  }

  window.sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
  return normalizeTarget(value, fallback);
};

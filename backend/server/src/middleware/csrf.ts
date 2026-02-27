import { NextFunction, Request, Response } from 'express';
import { config } from '../config';
import { AppError } from '../utils/AppError';

const decodeCookieValue = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const getCookieValue = (cookieHeader: string | undefined, name: string): string | null => {
  if (!cookieHeader) {
    return null;
  }

  const items = cookieHeader.split(';');
  for (const item of items) {
    const [rawKey, ...rawValue] = item.trim().split('=');
    if (rawKey === name) {
      return decodeCookieValue(rawValue.join('='));
    }
  }

  return null;
};

const getHeaderValue = (req: Request, headerName: string): string => {
  const direct = req.headers[headerName.toLowerCase()];
  if (Array.isArray(direct)) {
    return String(direct[0] ?? '').trim();
  }
  if (typeof direct === 'string') {
    return direct.trim();
  }

  return '';
};

export const requireCsrfToken = (req: Request, _res: Response, next: NextFunction): void => {
  const headerToken = getHeaderValue(req, config.auth.csrfHeaderName);
  const cookieToken = String(getCookieValue(req.headers.cookie, config.auth.csrfCookieName) ?? '').trim();

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    throw new AppError('CSRF 校验失败，请刷新页面后重试', {
      statusCode: 403,
      code: 'CSRF_TOKEN_INVALID'
    });
  }

  next();
};

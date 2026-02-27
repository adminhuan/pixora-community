import { NextFunction, Request, Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { verifyAccessToken } from '../utils/jwt';

const extractBearerToken = (req: Request): string | null => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return null;
  }
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }
  return token;
};

export const auth = (req: Request, _res: Response, next: NextFunction): void => {
  resolveAuthUser(req)
    .then((user) => {
      if (!user) {
        throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
      }

      req.user = user;
      next();
    })
    .catch((error) => {
      next(error);
    });
};

const isUserBanned = (payload: { status: string; bannedUntil: Date | null }): boolean => {
  if (payload.status !== 'banned') {
    return false;
  }

  if (!payload.bannedUntil) {
    return true;
  }

  return payload.bannedUntil.getTime() > Date.now();
};

const resolveAuthUser = async (
  req: Request
): Promise<{ id: string; username: string; role: 'user' | 'moderator' | 'admin' } | null> => {
  const token = extractBearerToken(req);
  if (!token) {
    return null;
  }

  const claims = verifyAccessToken(token);
  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: {
      id: true,
      username: true,
      role: true,
      status: true,
      bannedUntil: true
    }
  });

  if (!user) {
    throw new AppError('用户不存在或会话已失效', { statusCode: 401, code: 'USER_NOT_FOUND' });
  }

  if (isUserBanned(user)) {
    throw new AppError('账号已被封禁', { statusCode: 403, code: 'ACCOUNT_BANNED' });
  }

  return {
    id: user.id,
    username: user.username,
    role: user.role
  };
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  resolveAuthUser(req)
    .then((user) => {
      req.user = user ?? undefined;
      next();
    })
    .catch(() => {
      req.user = undefined;
      next();
    });
};

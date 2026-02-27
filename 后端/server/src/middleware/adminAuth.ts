import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';

export const adminAuth = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new AppError('请先登录', {
      statusCode: 401,
      code: 'UNAUTHORIZED'
    });
  }

  if (!['admin', 'moderator'].includes(req.user.role)) {
    throw new AppError('权限不足', {
      statusCode: 403,
      code: 'FORBIDDEN'
    });
  }

  next();
};

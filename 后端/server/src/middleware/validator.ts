import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { sendError } from '../utils/response';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void | Response => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'VALIDATION_ERROR', '参数校验失败', 422, errors.array());
  }
  next();
};

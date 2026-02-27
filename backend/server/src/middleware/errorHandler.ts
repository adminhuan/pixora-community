import { NextFunction, Request, Response } from 'express';
import { ValidationError } from 'express-validator';
import multer from 'multer';
import { config } from '../config';
import { AppError } from '../utils/AppError';
import { getClientIp } from '../utils/client-ip';
import { logger } from '../utils/logger';
import { sanitizeForLog } from '../utils/log-sanitizer';
import { sendError } from '../utils/response';

export const notFoundHandler = (req: Request, res: Response): Response => {
  return sendError(res, 'NOT_FOUND', `接口不存在: ${req.method} ${req.originalUrl}`, 404);
};

export const errorHandler = (error: Error, req: Request, res: Response, _next: NextFunction): Response => {
  const clientIp = getClientIp(req);

  if (error instanceof AppError) {
    return sendError(res, error.code, error.message, error.statusCode, error.details);
  }

  if ((error as Error & { errors?: ValidationError[] }).errors) {
    return sendError(
      res,
      'VALIDATION_ERROR',
      '参数校验失败',
      422,
      (error as Error & { errors?: ValidationError[] }).errors
    );
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 'FILE_SIZE_EXCEEDED', '上传文件大小超限（最大 5MB）', 400);
    }
    if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
      return sendError(res, 'BATCH_FILE_COUNT_EXCEEDED', '单次上传文件过多', 400);
    }
    return sendError(res, 'UPLOAD_BAD_REQUEST', '上传参数不合法', 400);
  }

  logger.error(
    'Server error',
    sanitizeForLog({
      message: error.message,
      stack: config.env === 'production' ? undefined : error.stack,
      method: req.method,
      url: req.originalUrl,
      query: req.query,
      body: req.method === 'GET' ? undefined : req.body,
      ip: clientIp,
      userId: req.user?.id,
      userAgent: req.headers['user-agent'],
      requestId: req.headers['x-request-id'],
      referer: req.headers.referer,
      origin: req.headers.origin,
      authorization: req.headers.authorization,
      cookie: req.headers.cookie
    }) as Record<string, unknown>
  );

  return sendError(res, 'INTERNAL_SERVER_ERROR', '服务器内部错误', 500);
};

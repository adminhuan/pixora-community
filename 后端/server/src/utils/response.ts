import { Response } from 'express';
import { PaginationResult } from '../types/common';

export const sendSuccess = <T>(res: Response, data: T, message = '操作成功', statusCode = 200): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

export const sendPagedSuccess = <T>(
  res: Response,
  data: T[],
  pagination: PaginationResult<T>['pagination'],
  message = '操作成功',
  statusCode = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination
  });
};

export const sendError = (
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown
): Response => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details
    }
  });
};

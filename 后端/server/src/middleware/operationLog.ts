import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import prisma from '../config/database';
import { getClientIp } from '../utils/client-ip';
import { logger } from '../utils/logger';

export const operationLog = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const clientIp = getClientIp(req);
    const payload = {
      method: req.method,
      path: req.originalUrl,
      ip: clientIp,
      userAgent: req.headers['user-agent'],
      userId: req.user?.id,
      role: req.user?.role,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      requestId: req.headers['x-request-id'],
      body: req.method !== 'GET' ? req.body : undefined
    };

    logger.info('Admin operation', {
      ...payload
    });

    const bodyValue: Prisma.InputJsonValue | undefined =
      payload.body && typeof payload.body === 'object'
        ? (payload.body as Prisma.InputJsonValue)
        : payload.body === undefined
          ? undefined
          : ({ value: payload.body } as Prisma.InputJsonValue);

    const data: Prisma.AdminOperationLogUncheckedCreateInput = {
      method: payload.method,
      path: payload.path,
      ip: payload.ip ? String(payload.ip) : null,
      userAgent: payload.userAgent ? String(payload.userAgent) : null,
      userId: payload.userId ? String(payload.userId) : null,
      role: payload.role ? String(payload.role) : null,
      statusCode: payload.statusCode,
      durationMs: payload.durationMs,
      requestId: payload.requestId ? String(payload.requestId) : null,
      ...(bodyValue !== undefined ? { body: bodyValue } : {})
    };

    void prisma.adminOperationLog.create({ data }).catch((error: unknown) => {
      logger.warn('Persist admin operation log failed', {
        path: payload.path,
        method: payload.method,
        reason: error instanceof Error ? error.message : 'unknown'
      });
    });
  });

  next();
};

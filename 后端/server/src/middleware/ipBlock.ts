import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { ipBlacklistService } from '../services/admin/ipBlacklist.service';
import { ipWhitelistService } from '../services/admin/ipWhitelist.service';
import { getClientIp } from '../utils/client-ip';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

const persistIpAccessLog = (
  req: Request,
  ip: string,
  payload: {
    statusCode: number;
    result: 'allowed' | 'blocked';
    rule: 'whitelist' | 'blacklist';
    reason?: string;
  }
) => {
  void prisma.ipAccessLog
    .create({
      data: {
        ip: ip || null,
        method: req.method,
        path: req.originalUrl,
        statusCode: payload.statusCode,
        result: payload.result,
        rule: payload.rule,
        reason: payload.reason ?? null,
        userId: req.user?.id ?? null,
        requestId: req.headers['x-request-id'] ? String(req.headers['x-request-id']) : null,
        userAgent: req.headers['user-agent'] ? String(req.headers['user-agent']) : null
      }
    })
    .catch((error: unknown) => {
      logger.warn('Persist ip access log failed', {
        path: req.originalUrl,
        method: req.method,
        reason: error instanceof Error ? error.message : 'unknown'
      });
    });
};

export const ipBlock = (req: Request, res: Response, next: NextFunction) => {
  const ip = getClientIp(req);
  const whitelistEnforced = ip && ipWhitelistService.shouldEnforce();

  if (whitelistEnforced) {
    if (!ipWhitelistService.isAllowed(ip)) {
      persistIpAccessLog(req, ip, {
        statusCode: 403,
        result: 'blocked',
        rule: 'whitelist',
        reason: 'ip_not_in_whitelist'
      });
      sendError(res, 'IP_NOT_ALLOWED', '当前IP不在白名单中', 403);
      return;
    }
  }

  if (ip && ipBlacklistService.isBlocked(ip)) {
    persistIpAccessLog(req, ip, {
      statusCode: 403,
      result: 'blocked',
      rule: 'blacklist',
      reason: 'ip_in_blacklist'
    });
    sendError(res, 'IP_BLOCKED', '您的IP已被封禁', 403);
    return;
  }

  if (whitelistEnforced) {
    res.on('finish', () => {
      persistIpAccessLog(req, ip, {
        statusCode: res.statusCode,
        result: 'allowed',
        rule: 'whitelist',
        reason: 'whitelist_allowed'
      });
    });
  }

  next();
};

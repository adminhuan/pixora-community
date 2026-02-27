import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { sendError } from '../utils/response';

type LimiterOptions = {
  windowMs: number;
  max: number;
  message: string;
};

const createLimiter = ({ windowMs, max, message }: LimiterOptions) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    validate: {
      xForwardedForHeader: false
    },
    handler: (_req, res) => {
      sendError(res, 'TOO_MANY_REQUESTS', message, 429);
    }
  });

export const apiRateLimiter = createLimiter({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: '请求过于频繁，请稍后重试'
});

export const authRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: '认证请求过多，请稍后重试'
});

export const authTokenRateLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 40,
  message: 'Token 操作过于频繁，请稍后重试'
});

export const emailCodeRateLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 8,
  message: '邮箱验证码请求过于频繁，请稍后再试'
});

export const smsCodeRateLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 12,
  message: '短信验证码请求过于频繁，请稍后再试'
});

export const captchaRateLimiter = createLimiter({
  windowMs: 5 * 60 * 1000,
  max: 40,
  message: '图形验证码请求过于频繁，请稍后再试'
});

export const passwordResetRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: '密码找回请求过于频繁，请稍后再试'
});

export const uploadRateLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 40,
  message: '上传请求过于频繁，请稍后再试'
});

export const searchRateLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: '搜索请求过于频繁，请稍后再试'
});

export const messageSendRateLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: '私信发送过于频繁，请稍后再试'
});

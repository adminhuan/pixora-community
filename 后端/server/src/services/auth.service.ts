import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import svgCaptcha from 'svg-captcha';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import redis from '../config/redis';
import { AppError } from '../utils/AppError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { emailService } from './email.service';

const ALLOWED_EMAIL_DOMAINS = new Set([
  'qq.com',
  '163.com',
  '126.com',
  'yeah.net',
  'sina.com',
  'sohu.com',
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'foxmail.com',
  'icloud.com',
  'me.com',
  '139.com',
  '189.cn',
  'wo.cn'
]);

const BLOCKED_SEED_IDENTIFIERS = new Set(['admin@aicommunity.local', 'demo@aicommunity.local', 'admin', 'demo']);

const isBlockedSeedAccount = (payload: { email?: string | null; username?: string | null }): boolean => {
  const email = String(payload.email ?? '')
    .trim()
    .toLowerCase();
  const username = String(payload.username ?? '')
    .trim()
    .toLowerCase();

  if (!email && !username) {
    return false;
  }

  return BLOCKED_SEED_IDENTIFIERS.has(email) || BLOCKED_SEED_IDENTIFIERS.has(username);
};

const maskEmail = (email: string): string => {
  const [name = '', domain = ''] = email.split('@');
  if (!name || !domain) {
    return '***';
  }

  if (name.length <= 2) {
    return `${name[0] ?? '*'}***@${domain}`;
  }

  return `${name.slice(0, 2)}***@${domain}`;
};

const maskPhone = (phone: string): string => {
  const normalized = phone.replace(/\s+/g, '');
  if (normalized.length < 7) {
    return '***';
  }

  return `${normalized.slice(0, 3)}****${normalized.slice(-4)}`;
};

const getRefreshTokenTtlSeconds = (payload: { exp?: number }): number => {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const exp = Number(payload.exp ?? 0);

  if (Number.isFinite(exp) && exp > nowSeconds) {
    return Math.max(exp - nowSeconds, 1);
  }

  return 7 * 24 * 60 * 60;
};

const isAccountBanned = (payload: { status: string; bannedUntil: Date | null }): boolean => {
  if (payload.status !== 'banned') {
    return false;
  }

  if (!payload.bannedUntil) {
    return true;
  }

  return payload.bannedUntil.getTime() > Date.now();
};

const ensureAccountAvailable = (payload: { status: string; bannedUntil: Date | null }) => {
  if (isAccountBanned(payload)) {
    throw new AppError('账号已被封禁', { statusCode: 403, code: 'ACCOUNT_BANNED' });
  }
};

class AuthService {
  async register(payload: { username: string; email: string; password: string; emailCode: string }) {
    if (isBlockedSeedAccount({ email: payload.email, username: payload.username })) {
      throw new AppError('账号或密码错误', { statusCode: 401, code: 'INVALID_CREDENTIALS' });
    }

    const emailValid = await this.verifyEmailCode(payload.email, payload.emailCode);
    if (!emailValid) {
      throw new AppError('邮箱验证码错误或已过期', { statusCode: 400, code: 'EMAIL_CODE_INVALID' });
    }

    const [existingUsername, existingEmail] = await Promise.all([
      prisma.user.findUnique({ where: { username: payload.username }, select: { id: true } }),
      prisma.user.findUnique({ where: { email: payload.email }, select: { id: true } })
    ]);

    if (existingUsername) {
      throw new AppError('用户名已存在', { statusCode: 409, code: 'USERNAME_EXISTS' });
    }

    if (existingEmail) {
      throw new AppError('邮箱已注册', { statusCode: 409, code: 'EMAIL_EXISTS' });
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);
    const user = await prisma.user.create({
      data: {
        username: payload.username,
        email: payload.email,
        password: passwordHash,
        role: 'user',
        status: 'active',
        notificationSettings: {
          system: true,
          interaction: true
        }
      }
    });

    await emailService.sendWelcomeEmail(user.email, user.username);

    const authUser = {
      id: user.id,
      username: user.username,
      role: user.role
    } as const;

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      accessToken: signAccessToken(authUser),
      refreshToken: signRefreshToken(authUser)
    };
  }

  async login(payload: { identifier: string; password: string; ip?: string }) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: payload.identifier }, { username: payload.identifier }, { phone: payload.identifier }]
      }
    });

    if (!user) {
      throw new AppError('账号或密码错误', { statusCode: 401, code: 'INVALID_CREDENTIALS' });
    }

    if (isBlockedSeedAccount(user)) {
      logger.warn('Blocked built-in seed account login attempt', { identifier: payload.identifier });
      throw new AppError('账号或密码错误', { statusCode: 401, code: 'INVALID_CREDENTIALS' });
    }

    const matched = await bcrypt.compare(payload.password, user.password);
    if (!matched) {
      throw new AppError('账号或密码错误', { statusCode: 401, code: 'INVALID_CREDENTIALS' });
    }

    ensureAccountAvailable(user);

    const authUser = {
      id: user.id,
      username: user.username,
      role: user.role
    } as const;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        ...(payload.ip ? { lastLoginIp: payload.ip } : {})
      }
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      accessToken: signAccessToken(authUser),
      refreshToken: signRefreshToken(authUser)
    };
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return { ok: true };
    }

    try {
      const payload = verifyRefreshToken(refreshToken);
      const ttlSeconds = getRefreshTokenTtlSeconds(payload);
      await redis.set(`token:blacklist:${payload.sub}:${refreshToken}`, '1', 'EX', ttlSeconds);
    } catch {
      return { ok: true };
    }

    return { ok: true };
  }

  async refreshToken(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);

    const blacklistKey = `token:blacklist:${payload.sub}:${refreshToken}`;
    const blacklisted = await redis.get(blacklistKey);
    if (blacklisted) {
      throw new AppError('Refresh Token 已失效', { statusCode: 401, code: 'TOKEN_REVOKED' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new AppError('用户不存在', { statusCode: 404, code: 'USER_NOT_FOUND' });
    }

    ensureAccountAvailable(user);

    const authUser = {
      id: user.id,
      username: user.username,
      role: user.role
    } as const;

    const newAccessToken = signAccessToken(authUser);
    const newRefreshToken = signRefreshToken(authUser);
    const ttlSeconds = getRefreshTokenTtlSeconds(payload);

    await redis.set(blacklistKey, '1', 'EX', ttlSeconds);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { sent: true };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    await redis.set(`reset:${resetToken}`, user.id, 'EX', 15 * 60);
    await emailService.sendPasswordResetEmail(email, resetToken);

    return { sent: true };
  }

  async resetPassword(token: string, password: string) {
    const userId = await redis.get(`reset:${token}`);
    if (!userId) {
      throw new AppError('重置链接已失效', { statusCode: 400, code: 'RESET_TOKEN_INVALID' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: passwordHash
      }
    });

    await redis.del(`reset:${token}`);

    return { ok: true };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('用户不存在', { statusCode: 404, code: 'USER_NOT_FOUND' });
    }

    const matched = await bcrypt.compare(oldPassword, user.password);
    if (!matched) {
      throw new AppError('旧密码错误', { statusCode: 400, code: 'OLD_PASSWORD_INCORRECT' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: passwordHash
      }
    });

    return { ok: true };
  }

  async sendEmailCode(email: string, captchaId: string, captchaCode: string) {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain || !ALLOWED_EMAIL_DOMAINS.has(domain)) {
      throw new AppError('仅支持主流邮箱注册（QQ、163、Gmail、Outlook等）', {
        statusCode: 400,
        code: 'EMAIL_DOMAIN_NOT_ALLOWED'
      });
    }

    const captchaValid = await this.verifyCaptcha(captchaId, captchaCode);
    if (!captchaValid) {
      throw new AppError('图形验证码错误或已过期', { statusCode: 400, code: 'CAPTCHA_INVALID' });
    }

    const cooldownKey = `email_cooldown:${email}`;
    const cooldown = await redis.get(cooldownKey);
    if (cooldown) {
      throw new AppError('发送太频繁，请60秒后再试', { statusCode: 429, code: 'EMAIL_COOLDOWN' });
    }

    const code = crypto.randomInt(100000, 999999).toString();
    await redis.set(`email_verify:${email}`, code, 'EX', 30 * 60);
    await redis.set(cooldownKey, '1', 'EX', 60);
    await emailService.sendVerificationCode(email, code);

    logger.info('邮箱验证码发送成功', { email: maskEmail(email) });

    return { sent: true };
  }

  async verifyEmailCode(email: string, code: string) {
    const normalizedCode = String(code ?? '').trim();
    if (!normalizedCode) {
      return false;
    }

    const stored = await redis.get(`email_verify:${email}`);
    if (!stored) {
      return false;
    }

    await redis.del(`email_verify:${email}`);
    return stored === normalizedCode;
  }

  async sendSmsCode(phone: string) {
    const normalizedPhone = String(phone ?? '').trim();
    const cooldownKey = `sms_cooldown:${normalizedPhone}`;
    const cooldown = await redis.get(cooldownKey);
    if (cooldown) {
      throw new AppError('发送太频繁，请60秒后再试', { statusCode: 429, code: 'SMS_COOLDOWN' });
    }

    const code = crypto.randomInt(100000, 999999).toString();
    await redis.set(`sms:${normalizedPhone}`, code, 'EX', 5 * 60);
    await redis.set(cooldownKey, '1', 'EX', 60);

    logger.info('短信验证码发送成功', { phone: maskPhone(normalizedPhone) });

    return {
      sent: true,
      provider: 'mock_sms_provider'
    };
  }

  async verifySmsCode(phone: string, code: string): Promise<boolean> {
    const normalizedPhone = String(phone ?? '').trim();
    const normalizedCode = String(code ?? '').trim();
    if (!normalizedPhone || !normalizedCode) {
      return false;
    }

    const stored = await redis.get(`sms:${normalizedPhone}`);
    if (!stored) {
      return false;
    }

    await redis.del(`sms:${normalizedPhone}`);
    return stored === normalizedCode;
  }

  async checkUsername(username: string) {
    const count = await prisma.user.count({ where: { username } });
    return { available: count === 0 };
  }

  async checkEmail(email: string) {
    const count = await prisma.user.count({ where: { email } });
    return { available: count === 0 };
  }

  async getCaptcha() {
    const captcha = svgCaptcha.createMathExpr({
      mathOperator: '+-',
      noise: 2,
      color: true,
      background: '#f4f8ff'
    });

    const captchaId = uuidv4();
    await redis.set(`captcha:${captchaId}`, captcha.text.toLowerCase(), 'EX', 5 * 60);

    if (process.env.NODE_ENV === 'development') {
      logger.debug('图形验证码生成成功', { captchaId });
    }

    return {
      captchaId,
      svg: captcha.data
    };
  }

  async verifyCaptcha(captchaId: string, userInput: string): Promise<boolean> {
    const normalizedCaptchaId = String(captchaId ?? '').trim();
    const normalizedInput = String(userInput ?? '')
      .trim()
      .toLowerCase();
    if (!normalizedCaptchaId || !normalizedInput) {
      return false;
    }

    const stored = await redis.get(`captcha:${normalizedCaptchaId}`);
    if (!stored) {
      return false;
    }

    await redis.del(`captcha:${normalizedCaptchaId}`);
    return stored === normalizedInput;
  }
}

export const authService = new AuthService();

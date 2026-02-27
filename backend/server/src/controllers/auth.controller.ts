import crypto from 'crypto';
import { CookieOptions, Request, Response } from 'express';
import { config } from '../config';
import { authService } from '../services/auth.service';
import { oauthService } from '../services/oauth.service';
import { AppError } from '../utils/AppError';
import { getClientIp } from '../utils/client-ip';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { sendSuccess } from '../utils/response';

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

  const parts = cookieHeader.split(';');
  for (const item of parts) {
    const [rawKey, ...rawValue] = item.trim().split('=');
    if (rawKey === name) {
      return decodeCookieValue(rawValue.join('='));
    }
  }

  return null;
};

const buildRefreshCookieOptions = (): CookieOptions => {
  const options: CookieOptions = {
    httpOnly: true,
    secure: config.auth.refreshCookieSecure,
    sameSite: config.auth.refreshCookieSameSite,
    path: config.auth.refreshCookiePath,
    maxAge: config.auth.refreshCookieMaxAgeMs
  };

  if (config.auth.refreshCookieDomain) {
    options.domain = config.auth.refreshCookieDomain;
  }

  return options;
};

const buildCsrfCookieOptions = (): CookieOptions => {
  const options: CookieOptions = {
    httpOnly: false,
    secure: config.auth.csrfCookieSecure,
    sameSite: config.auth.csrfCookieSameSite,
    path: config.auth.csrfCookiePath,
    maxAge: config.auth.csrfCookieMaxAgeMs
  };

  if (config.auth.csrfCookieDomain) {
    options.domain = config.auth.csrfCookieDomain;
  }

  return options;
};

const getRefreshTokenFromRequest = (req: Request): string => {
  const bodyToken = String(req.body?.refreshToken ?? '').trim();
  if (bodyToken) {
    return bodyToken;
  }

  const cookieToken = getCookieValue(req.headers.cookie, config.auth.refreshTokenCookieName);
  return String(cookieToken ?? '').trim();
};

const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie(config.auth.refreshTokenCookieName, refreshToken, buildRefreshCookieOptions());
};

const clearRefreshTokenCookie = (res: Response) => {
  const options = buildRefreshCookieOptions();
  res.clearCookie(config.auth.refreshTokenCookieName, {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    path: options.path,
    domain: options.domain
  });
};

const issueCsrfToken = (res: Response): string => {
  const token = crypto.randomBytes(24).toString('hex');
  res.cookie(config.auth.csrfCookieName, token, buildCsrfCookieOptions());
  return token;
};

const clearCsrfCookie = (res: Response) => {
  const options = buildCsrfCookieOptions();
  res.clearCookie(config.auth.csrfCookieName, {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    path: options.path,
    domain: options.domain
  });
};

const maskIdentifier = (identifier: string): string => {
  const value = String(identifier ?? '').trim();
  if (!value) {
    return '***';
  }

  if (value.includes('@')) {
    const [name = '', domain = ''] = value.split('@');
    if (!name || !domain) {
      return '***';
    }
    if (name.length <= 2) {
      return `${name[0] ?? '*'}***@${domain}`;
    }
    return `${name.slice(0, 2)}***@${domain}`;
  }

  if (/^\+?[0-9]{6,20}$/.test(value)) {
    return `${value.slice(0, 3)}****${value.slice(-2)}`;
  }

  if (value.length <= 2) {
    return `${value[0] ?? '*'}***`;
  }

  return `${value.slice(0, 2)}***`;
};

export const authController = {
  async register(req: Request, res: Response) {
    const clientIp = getClientIp(req);
    const result = await authService.register(req.body);
    setRefreshTokenCookie(res, result.refreshToken);
    const csrfToken = issueCsrfToken(res);

    logger.info('Auth register success', {
      userId: result.user.id,
      username: result.user.username,
      ip: clientIp,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
        csrfToken
      },
      '注册成功',
      201
    );
  },

  async login(req: Request, res: Response) {
    const identifier = String(req.body?.identifier ?? '').trim();
    const clientIp = getClientIp(req);

    try {
      const result = await authService.login({ ...req.body, ip: clientIp });
      setRefreshTokenCookie(res, result.refreshToken);
      const csrfToken = issueCsrfToken(res);

      logger.info('Auth login success', {
        userId: result.user.id,
        username: result.user.username,
        ip: clientIp,
        userAgent: req.headers['user-agent']
      });

      return sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
          csrfToken
        },
        '登录成功'
      );
    } catch (error) {
      logger.warn('Auth login failed', {
        identifier: maskIdentifier(identifier),
        ip: clientIp,
        userAgent: req.headers['user-agent'],
        reason: error instanceof AppError ? error.code : 'UNKNOWN'
      });
      throw error;
    }
  },

  async logout(req: Request, res: Response) {
    const clientIp = getClientIp(req);
    const refreshToken = getRefreshTokenFromRequest(req);
    const result = await authService.logout(refreshToken || undefined);

    clearRefreshTokenCookie(res);
    clearCsrfCookie(res);

    logger.info('Auth logout', {
      hasRefreshToken: Boolean(refreshToken),
      ip: clientIp,
      userAgent: req.headers['user-agent'],
      userId: req.user?.id
    });

    return sendSuccess(res, result, '退出成功');
  },

  async refreshToken(req: Request, res: Response) {
    const clientIp = getClientIp(req);
    const refreshToken = getRefreshTokenFromRequest(req);
    if (!refreshToken) {
      throw new AppError('缺少 refreshToken', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    const result = await authService.refreshToken(refreshToken);
    setRefreshTokenCookie(res, result.refreshToken);
    const csrfToken = issueCsrfToken(res);

    logger.info('Auth token refreshed', {
      ip: clientIp,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(
      res,
      {
        accessToken: result.accessToken,
        csrfToken
      },
      'Token 刷新成功'
    );
  },

  async forgotPassword(req: Request, res: Response) {
    const result = await authService.forgotPassword(req.body?.email);
    return sendSuccess(res, result, '重置邮件已发送');
  },

  async resetPassword(req: Request, res: Response) {
    const result = await authService.resetPassword(req.body.token, req.body.password);
    return sendSuccess(res, result, '密码重置成功');
  },

  async changePassword(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    }
    const result = await authService.changePassword(req.user.id, req.body.oldPassword, req.body.newPassword);
    return sendSuccess(res, result, '密码修改成功');
  },

  async sendEmailCode(req: Request, res: Response) {
    const { email, captchaId, captchaCode } = req.body;
    const result = await authService.sendEmailCode(email, captchaId, captchaCode);
    return sendSuccess(res, result, '邮箱验证码已发送');
  },

  async sendSmsCode(req: Request, res: Response) {
    const result = await authService.sendSmsCode(req.body.phone);
    return sendSuccess(res, result, '短信验证码已发送');
  },

  async captcha(_req: Request, res: Response) {
    const result = await authService.getCaptcha();
    return sendSuccess(res, result, '获取验证码成功');
  },

  async github(req: Request, res: Response) {
    const frontendCallbackUrl = String(req.query.redirect ?? '').trim();
    const redirectUrl = await oauthService.getGithubRedirectUrl(frontendCallbackUrl);
    return sendSuccess(res, { redirectUrl }, '获取 GitHub 登录地址成功');
  },

  async githubCallback(req: Request, res: Response) {
    if (req.query.error) {
      throw new AppError(`GitHub 授权失败: ${String(req.query.error)}`, {
        statusCode: 400,
        code: 'OAUTH_FAILED'
      });
    }

    const code = String(req.query.code ?? '').trim();
    const state = String(req.query.state ?? '').trim();
    if (!code) {
      throw new AppError('缺少 GitHub OAuth code', { statusCode: 400, code: 'BAD_REQUEST' });
    }
    if (!state) {
      throw new AppError('缺少 GitHub OAuth state', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    const result = await oauthService.githubCallback(code, state);
    setRefreshTokenCookie(res, result.refreshToken);
    issueCsrfToken(res);
    return res.redirect(result.redirectUrl);
  },

  async wechat(req: Request, res: Response) {
    const frontendCallbackUrl = String(req.query.redirect ?? '').trim();
    const redirectUrl = await oauthService.getWechatRedirectUrl(frontendCallbackUrl);
    return sendSuccess(res, { redirectUrl }, '获取微信登录地址成功');
  },

  async wechatCallback(req: Request, res: Response) {
    if (req.query.error) {
      throw new AppError(`微信授权失败: ${String(req.query.error)}`, {
        statusCode: 400,
        code: 'OAUTH_FAILED'
      });
    }

    const code = String(req.query.code ?? '').trim();
    const state = String(req.query.state ?? '').trim();
    if (!code) {
      throw new AppError('缺少微信 OAuth code', { statusCode: 400, code: 'BAD_REQUEST' });
    }
    if (!state) {
      throw new AppError('缺少微信 OAuth state', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    const result = await oauthService.wechatCallback(code, state);
    setRefreshTokenCookie(res, result.refreshToken);
    issueCsrfToken(res);
    return res.redirect(result.redirectUrl);
  },

  async checkUsername(req: Request, res: Response) {
    const result = await authService.checkUsername(String(req.query.username ?? ''));
    return sendSuccess(res, result, '用户名检查完成');
  },

  async checkEmail(req: Request, res: Response) {
    const result = await authService.checkEmail(String(req.query.email ?? ''));
    return sendSuccess(res, result, '邮箱检查完成');
  },

  async exchangeToken(req: Request, res: Response) {
    const token = String(req.body?.token ?? '').trim();
    if (!token) {
      throw new AppError('缺少 token', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    const claims = verifyAccessToken(token);
    const csrfToken = issueCsrfToken(res);

    return sendSuccess(
      res,
      {
        user: {
          id: claims.sub,
          username: claims.username,
          role: claims.role
        },
        valid: true,
        csrfToken
      },
      'Token 验证成功'
    );
  }
};

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import https from 'https';
import { URL, URLSearchParams } from 'url';
import prisma from '../config/database';
import redis from '../config/redis';
import { config } from '../config';
import { AppError } from '../utils/AppError';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import { logger } from '../utils/logger';

interface OAuthProfile {
  provider: 'github' | 'wechat';
  providerId: string;
  username: string;
  email: string;
  avatar?: string;
}

interface OAuthAuthResult {
  user: {
    id: string;
    username: string;
    email: string;
    role: 'user' | 'moderator' | 'admin';
  };
  accessToken: string;
  refreshToken: string;
  redirectUrl: string;
}

interface OAuthStatePayload {
  frontendCallbackUrl?: string;
}

class OAuthService {
  private requestJson(
    urlString: string,
    options?: {
      method?: 'GET' | 'POST';
      headers?: Record<string, string>;
      body?: string;
    }
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const url = new URL(urlString);

      const request = https.request(
        {
          method: options?.method ?? 'GET',
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port ? Number(url.port) : undefined,
          path: `${url.pathname}${url.search}`,
          headers: options?.headers
        },
        (response) => {
          let responseBody = '';

          response.setEncoding('utf8');
          response.on('data', (chunk) => {
            responseBody += chunk;
          });

          response.on('end', () => {
            const statusCode = response.statusCode ?? 500;
            if (statusCode >= 400) {
              reject(
                new AppError('OAuth 服务请求失败', {
                  statusCode: 502,
                  code: 'OAUTH_REQUEST_FAILED',
                  details: {
                    statusCode,
                    url: urlString,
                    response: responseBody.slice(0, 500)
                  }
                })
              );
              return;
            }

            if (!responseBody.trim()) {
              resolve({});
              return;
            }

            try {
              resolve(JSON.parse(responseBody));
            } catch {
              reject(
                new AppError('OAuth 响应解析失败', {
                  statusCode: 502,
                  code: 'OAUTH_PARSE_FAILED',
                  details: {
                    url: urlString,
                    response: responseBody.slice(0, 500)
                  }
                })
              );
            }
          });
        }
      );

      request.on('error', (error) => {
        reject(
          new AppError('OAuth 网络请求失败', {
            statusCode: 502,
            code: 'OAUTH_NETWORK_FAILED',
            details: {
              url: urlString,
              message: error.message
            }
          })
        );
      });

      if (options?.body) {
        request.write(options.body);
      }

      request.end();
    });
  }

  private ensureGithubConfigured() {
    if (!config.oauth.github.clientId || !config.oauth.github.clientSecret) {
      throw new AppError('GitHub OAuth 未配置，请设置 GITHUB_CLIENT_ID 与 GITHUB_CLIENT_SECRET', {
        statusCode: 503,
        code: 'OAUTH_NOT_CONFIGURED'
      });
    }
  }

  private ensureWechatConfigured() {
    if (!config.oauth.wechat.appId || !config.oauth.wechat.appSecret) {
      throw new AppError('微信 OAuth 未配置，请设置 WECHAT_APP_ID 与 WECHAT_APP_SECRET', {
        statusCode: 503,
        code: 'OAUTH_NOT_CONFIGURED'
      });
    }
  }

  private normalizeUsername(raw: string, fallbackPrefix: string) {
    const normalized = raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 20);

    if (normalized) {
      return normalized;
    }

    return `${fallbackPrefix}_${crypto.randomBytes(3).toString('hex')}`;
  }

  private sanitizeProviderId(value: string) {
    const sanitized = value.replace(/[^a-zA-Z0-9]/g, '');
    return sanitized || crypto.randomBytes(6).toString('hex');
  }

  private async ensureUniqueUsername(baseName: string) {
    let candidate = baseName;

    for (let index = 0; index < 30; index += 1) {
      const exists = await prisma.user.findUnique({
        where: { username: candidate },
        select: { id: true }
      });

      if (!exists) {
        return candidate;
      }

      candidate = `${baseName.slice(0, 16)}_${index + 1}`;
    }

    return `${baseName.slice(0, 12)}_${crypto.randomBytes(3).toString('hex')}`;
  }

  private normalizeOrigin(raw: string): string | null {
    const input = String(raw ?? '').trim();
    if (!input) {
      return null;
    }

    try {
      const url = new URL(input);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        return null;
      }
      return `${url.protocol}//${url.host}`.toLowerCase();
    } catch {
      return null;
    }
  }

  private resolveFrontendCallbackUrl(raw: string): string | null {
    const input = String(raw ?? '').trim();
    if (!input) {
      return null;
    }

    let callbackUrl: URL;
    try {
      callbackUrl = new URL(input);
    } catch {
      return null;
    }

    if (callbackUrl.protocol !== 'https:' && callbackUrl.protocol !== 'http:') {
      return null;
    }

    const allowOrigins = new Set<string>();
    const configBaseOrigin = this.normalizeOrigin(config.baseUrl);
    const configCallbackOrigin = this.normalizeOrigin(config.oauth.frontendCallbackUrl);

    if (configBaseOrigin) {
      allowOrigins.add(configBaseOrigin);
    }
    if (configCallbackOrigin) {
      allowOrigins.add(configCallbackOrigin);
    }
    for (const item of config.corsOrigins) {
      const origin = this.normalizeOrigin(item);
      if (origin) {
        allowOrigins.add(origin);
      }
    }

    const currentOrigin = this.normalizeOrigin(callbackUrl.toString());
    if (!currentOrigin || !allowOrigins.has(currentOrigin)) {
      return null;
    }

    if (!callbackUrl.pathname.startsWith('/auth/callback')) {
      callbackUrl.pathname = '/auth/callback';
    }

    callbackUrl.search = '';
    callbackUrl.hash = '';
    return callbackUrl.toString();
  }

  private buildAuthResult(
    user: { id: string; username: string; email: string; role: 'user' | 'moderator' | 'admin' },
    options?: { frontendCallbackUrl?: string }
  ) {
    const accessToken = signAccessToken({
      id: user.id,
      username: user.username,
      role: user.role
    });

    const refreshToken = signRefreshToken({
      id: user.id,
      username: user.username,
      role: user.role
    });

    const redirectUrl = this.buildFrontendCallbackUrl(
      {
        accessToken
      },
      options?.frontendCallbackUrl
    );

    return {
      user,
      accessToken,
      refreshToken,
      redirectUrl
    };
  }

  private buildFrontendCallbackUrl(payload: { accessToken: string }, frontendCallbackUrl?: string) {
    const callbackUrl = new URL(frontendCallbackUrl ?? config.oauth.frontendCallbackUrl);
    const hashParams = new URLSearchParams();
    hashParams.set('accessToken', payload.accessToken);
    callbackUrl.hash = hashParams.toString();
    return callbackUrl.toString();
  }

  private async saveOAuthLogin(profile: OAuthProfile) {
    const existingProvider = await prisma.oAuthProvider.findUnique({
      where: {
        provider_providerId: {
          provider: profile.provider,
          providerId: profile.providerId
        }
      },
      include: {
        user: true
      }
    });

    if (existingProvider) {
      const user = await prisma.user.update({
        where: { id: existingProvider.userId },
        data: {
          lastLoginAt: new Date(),
          avatar: profile.avatar ?? existingProvider.user.avatar,
          nickname: existingProvider.user.nickname ?? profile.username
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true
        }
      });

      return user;
    }

    const userByEmail = await prisma.user.findUnique({
      where: { email: profile.email },
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    });

    if (userByEmail) {
      await prisma.oAuthProvider.create({
        data: {
          provider: profile.provider,
          providerId: profile.providerId,
          userId: userByEmail.id
        }
      });

      const updated = await prisma.user.update({
        where: { id: userByEmail.id },
        data: {
          lastLoginAt: new Date(),
          avatar: profile.avatar ?? undefined
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true
        }
      });

      return updated;
    }

    const username = await this.ensureUniqueUsername(this.normalizeUsername(profile.username, profile.provider));
    const randomPassword = crypto.randomBytes(24).toString('hex');
    const passwordHash = await bcrypt.hash(randomPassword, 12);

    const created = await prisma.user.create({
      data: {
        username,
        email: profile.email,
        password: passwordHash,
        avatar: profile.avatar,
        nickname: profile.username,
        role: 'user',
        status: 'active',
        lastLoginAt: new Date(),
        notificationSettings: {
          system: true,
          interaction: true
        },
        oauthProviders: {
          create: {
            provider: profile.provider,
            providerId: profile.providerId
          }
        }
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    });

    return created;
  }

  private async resolveGithubEmail(accessToken: string, userInfo: Record<string, unknown>) {
    const directEmail = String(userInfo.email ?? '').trim();
    if (directEmail) {
      return directEmail.toLowerCase();
    }

    const emailsData = await this.requestJson('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'ai-programming-community-oauth'
      }
    });

    if (Array.isArray(emailsData)) {
      const list = emailsData as Array<Record<string, unknown>>;
      const preferred =
        list.find((item) => item.primary === true && item.verified === true) ??
        list.find((item) => item.verified === true) ??
        list[0];

      const email = String(preferred?.email ?? '').trim();
      if (email) {
        return email.toLowerCase();
      }
    }

    const providerId = this.sanitizeProviderId(String(userInfo.id ?? crypto.randomUUID()));
    return `github_${providerId}@oauth.local`;
  }

  private async createOAuthState(provider: 'github' | 'wechat', payload: OAuthStatePayload = {}): Promise<string> {
    const state = crypto.randomBytes(24).toString('hex');
    await redis.set(`oauth:state:${provider}:${state}`, JSON.stringify(payload), 'EX', 10 * 60);
    return state;
  }

  private async consumeOAuthState(provider: 'github' | 'wechat', state: string): Promise<OAuthStatePayload | null> {
    const key = `oauth:state:${provider}:${state}`;
    const raw = await redis.get(key);
    if (!raw) {
      return null;
    }

    await redis.del(key);

    try {
      const parsed = JSON.parse(raw) as OAuthStatePayload;
      const frontendCallbackUrl = this.resolveFrontendCallbackUrl(String(parsed?.frontendCallbackUrl ?? ''));
      return frontendCallbackUrl ? { frontendCallbackUrl } : {};
    } catch {
      return {};
    }
  }

  async getGithubRedirectUrl(frontendCallbackUrl?: string): Promise<string> {
    this.ensureGithubConfigured();

    const safeFrontendCallbackUrl = this.resolveFrontendCallbackUrl(String(frontendCallbackUrl ?? ''));
    const state = await this.createOAuthState('github', {
      frontendCallbackUrl: safeFrontendCallbackUrl ?? undefined
    });
    const redirectUrl = new URL('https://github.com/login/oauth/authorize');
    redirectUrl.searchParams.set('client_id', config.oauth.github.clientId);
    redirectUrl.searchParams.set('redirect_uri', config.oauth.github.redirectUri);
    redirectUrl.searchParams.set('scope', 'read:user user:email');
    redirectUrl.searchParams.set('state', state);

    return redirectUrl.toString();
  }

  async getWechatRedirectUrl(frontendCallbackUrl?: string): Promise<string> {
    this.ensureWechatConfigured();

    const safeFrontendCallbackUrl = this.resolveFrontendCallbackUrl(String(frontendCallbackUrl ?? ''));
    const state = await this.createOAuthState('wechat', {
      frontendCallbackUrl: safeFrontendCallbackUrl ?? undefined
    });
    const redirectUrl = new URL('https://open.weixin.qq.com/connect/qrconnect');
    redirectUrl.searchParams.set('appid', config.oauth.wechat.appId);
    redirectUrl.searchParams.set('redirect_uri', config.oauth.wechat.redirectUri);
    redirectUrl.searchParams.set('response_type', 'code');
    redirectUrl.searchParams.set('scope', 'snsapi_login');
    redirectUrl.searchParams.set('state', state);

    return `${redirectUrl.toString()}#wechat_redirect`;
  }

  async githubCallback(code: string, state: string): Promise<OAuthAuthResult> {
    this.ensureGithubConfigured();

    const statePayload = await this.consumeOAuthState('github', state);
    if (!statePayload) {
      throw new AppError('GitHub OAuth state 无效或已过期', {
        statusCode: 400,
        code: 'OAUTH_STATE_INVALID'
      });
    }

    const tokenBody = new URLSearchParams({
      client_id: config.oauth.github.clientId,
      client_secret: config.oauth.github.clientSecret,
      code,
      redirect_uri: config.oauth.github.redirectUri
    }).toString();

    const tokenResponse = (await this.requestJson('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': String(Buffer.byteLength(tokenBody))
      },
      body: tokenBody
    })) as Record<string, unknown>;

    const accessToken = String(tokenResponse.access_token ?? '').trim();
    if (!accessToken) {
      throw new AppError('GitHub OAuth 换取 access_token 失败', {
        statusCode: 502,
        code: 'OAUTH_FAILED',
        details: tokenResponse
      });
    }

    const userInfo = (await this.requestJson('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'ai-programming-community-oauth'
      }
    })) as Record<string, unknown>;

    const providerId = String(userInfo.id ?? '').trim();
    if (!providerId) {
      throw new AppError('GitHub 用户信息缺少 id', {
        statusCode: 502,
        code: 'OAUTH_FAILED'
      });
    }

    const email = await this.resolveGithubEmail(accessToken, userInfo);
    const username = String(userInfo.login ?? userInfo.name ?? `github_${providerId}`);
    const avatar = String(userInfo.avatar_url ?? '').trim() || undefined;

    const user = await this.saveOAuthLogin({
      provider: 'github',
      providerId,
      username,
      email,
      avatar
    });

    logger.info('GitHub OAuth 登录成功', { userId: user.id, providerId });

    return this.buildAuthResult({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }, {
      frontendCallbackUrl: statePayload.frontendCallbackUrl
    });
  }

  async wechatCallback(code: string, state: string): Promise<OAuthAuthResult> {
    this.ensureWechatConfigured();

    const statePayload = await this.consumeOAuthState('wechat', state);
    if (!statePayload) {
      throw new AppError('微信 OAuth state 无效或已过期', {
        statusCode: 400,
        code: 'OAUTH_STATE_INVALID'
      });
    }

    const tokenUrl = new URL('https://api.weixin.qq.com/sns/oauth2/access_token');
    tokenUrl.searchParams.set('appid', config.oauth.wechat.appId);
    tokenUrl.searchParams.set('secret', config.oauth.wechat.appSecret);
    tokenUrl.searchParams.set('code', code);
    tokenUrl.searchParams.set('grant_type', 'authorization_code');

    const tokenResponse = (await this.requestJson(tokenUrl.toString())) as Record<string, unknown>;
    if (Number(tokenResponse.errcode ?? 0) !== 0) {
      throw new AppError('微信 OAuth 换取 access_token 失败', {
        statusCode: 502,
        code: 'OAUTH_FAILED',
        details: tokenResponse
      });
    }

    const accessToken = String(tokenResponse.access_token ?? '').trim();
    const openid = String(tokenResponse.openid ?? '').trim();

    if (!accessToken || !openid) {
      throw new AppError('微信 OAuth 返回参数不完整', {
        statusCode: 502,
        code: 'OAUTH_FAILED',
        details: tokenResponse
      });
    }

    const profileUrl = new URL('https://api.weixin.qq.com/sns/userinfo');
    profileUrl.searchParams.set('access_token', accessToken);
    profileUrl.searchParams.set('openid', openid);
    profileUrl.searchParams.set('lang', 'zh_CN');

    const profileResponse = (await this.requestJson(profileUrl.toString())) as Record<string, unknown>;
    if (Number(profileResponse.errcode ?? 0) !== 0) {
      throw new AppError('微信 OAuth 获取用户信息失败', {
        statusCode: 502,
        code: 'OAUTH_FAILED',
        details: profileResponse
      });
    }

    const providerId = this.sanitizeProviderId(String(profileResponse.unionid ?? tokenResponse.unionid ?? openid));
    const username = String(profileResponse.nickname ?? `wechat_${providerId.slice(-8)}`);
    const avatar = String(profileResponse.headimgurl ?? '').trim() || undefined;
    const email = `wechat_${providerId}@oauth.local`;

    const user = await this.saveOAuthLogin({
      provider: 'wechat',
      providerId,
      username,
      email,
      avatar
    });

    logger.info('微信 OAuth 登录成功', { userId: user.id, providerId });

    return this.buildAuthResult({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }, {
      frontendCallbackUrl: statePayload.frontendCallbackUrl
    });
  }
}

export const oauthService = new OAuthService();

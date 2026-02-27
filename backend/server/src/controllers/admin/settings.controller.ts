import { Request, Response } from 'express';
import { settingsService } from '../../services/admin/settings.service';
import { ipWhitelistService } from '../../services/admin/ipWhitelist.service';
import { moderationService } from '../../services/moderation.service';
import { AppError } from '../../utils/AppError';
import { getClientIp } from '../../utils/client-ip';
import { sendSuccess } from '../../utils/response';

const SETTINGS_WHITELIST: Record<string, string[]> = {
  site: [
    'siteName',
    'name',
    'title',
    'description',
    'keywords',
    'logo',
    'favicon',
    'icp',
    'contactEmail',
    'email',
    'copyright'
  ],
  feature: ['registerEnabled', 'postEnabled', 'blogEnabled', 'projectEnabled', 'qaEnabled'],
  content: ['postAudit', 'blogAudit', 'projectAudit', 'commentAudit', 'sensitiveWordFilter'],
  security: [
    'captchaEnabled',
    'emailVerifyEnabled',
    'smsVerifyEnabled',
    'maxLoginAttempts',
    'ipWhitelistEnabled',
    'ipAlertThreshold',
    'ipAlertNotifyEnabled',
    'ipAlertNotifyCooldownMinutes',
    'ipAlertNotifyEmail'
  ],
  email: ['host', 'port', 'username', 'password', 'from', 'secure'],
  storage: ['provider', 'bucket', 'region', 'accessKey', 'secretKey', 'cdnUrl'],
  content_moderation: ['preReviewEnabled', 'preReviewTypes', 'aiEnabled', 'aiEndpoint', 'aiAuthToken', 'aiModel', 'aiTimeoutMs']
};

export const adminSettingsController = {
  async get(req: Request, res: Response) {
    return sendSuccess(res, await settingsService.get(req.params.group), '获取配置成功');
  },

  async update(req: Request, res: Response) {
    const group = String(req.params.group ?? '');
    const allowedKeys = SETTINGS_WHITELIST[group];
    if (!allowedKeys) {
      throw new AppError('无效的设置分组', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    const payload = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};

    if (group === 'site') {
      const siteName = String(payload.siteName ?? '').trim();
      const name = String(payload.name ?? '').trim();
      if (siteName && !name) {
        payload.name = siteName;
      }

      const contactEmail = String(payload.contactEmail ?? '').trim();
      const email = String(payload.email ?? '').trim();
      if (contactEmail && !email) {
        payload.email = contactEmail;
      }
    }

    const filtered: Record<string, unknown> = {};

    allowedKeys.forEach((key) => {
      if (payload[key] !== undefined) {
        filtered[key] = payload[key];
      }
    });

    if (group === 'security' && filtered.ipWhitelistEnabled !== undefined) {
      const enabled = Boolean(filtered.ipWhitelistEnabled);
      filtered.ipWhitelistEnabled = enabled;

      if (enabled) {
        if (!ipWhitelistService.hasRules()) {
          throw new AppError('启用IP白名单前请先添加至少一个白名单IP', {
            statusCode: 400,
            code: 'IP_WHITELIST_EMPTY'
          });
        }

        const currentIp = getClientIp(req);
        if (currentIp && !ipWhitelistService.isAllowed(currentIp)) {
          throw new AppError('当前管理员IP不在白名单中，无法启用IP白名单拦截', {
            statusCode: 400,
            code: 'IP_WHITELIST_SELF_LOCK_RISK'
          });
        }
      }

      ipWhitelistService.setEnabled(enabled);
    }

    if (group === 'security') {
      if (filtered.ipAlertThreshold !== undefined) {
        const value = Number(filtered.ipAlertThreshold);
        filtered.ipAlertThreshold = Number.isFinite(value) ? Math.min(Math.max(Math.floor(value), 1), 100000) : 20;
      }

      if (filtered.ipAlertNotifyEnabled !== undefined) {
        filtered.ipAlertNotifyEnabled = Boolean(filtered.ipAlertNotifyEnabled);
      }

      if (filtered.ipAlertNotifyCooldownMinutes !== undefined) {
        const value = Number(filtered.ipAlertNotifyCooldownMinutes);
        filtered.ipAlertNotifyCooldownMinutes = Number.isFinite(value)
          ? Math.min(Math.max(Math.floor(value), 1), 1440)
          : 30;
      }

      if (filtered.ipAlertNotifyEmail !== undefined) {
        filtered.ipAlertNotifyEmail = String(filtered.ipAlertNotifyEmail ?? '').trim();
      }
    }

    return sendSuccess(res, await settingsService.update(group, filtered), '更新配置成功');
  },

  async testEmail(req: Request, res: Response) {
    return sendSuccess(res, await settingsService.testEmail(req.body ?? {}), '测试邮件发送成功');
  },

  async testStorage(req: Request, res: Response) {
    return sendSuccess(res, await settingsService.testStorage(req.body ?? {}), '测试存储连接成功');
  },

  async testAI(req: Request, res: Response) {
    const payload = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};
    const result = await moderationService.testAI(payload);
    return sendSuccess(res, result, result.ok ? 'AI 审核连接测试成功' : 'AI 审核连接测试失败');
  }
};

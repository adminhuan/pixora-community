import { Request, Response } from 'express';
import { settingsService } from '../services/admin/settings.service';
import { sendSuccess } from '../utils/response';

const DEFAULT_SITE_NAME = '社区';

export const settingsController = {
  async site(_req: Request, res: Response) {
    const raw = await settingsService.get('site');

    const siteName = String(raw.siteName ?? raw.name ?? '').trim() || DEFAULT_SITE_NAME;
    const contactEmail = String(raw.contactEmail ?? raw.email ?? '').trim();

    return sendSuccess(
      res,
      {
        siteName,
        name: siteName,
        title: String(raw.title ?? '').trim(),
        description: String(raw.description ?? '').trim(),
        keywords: String(raw.keywords ?? '').trim(),
        logo: String(raw.logo ?? '').trim(),
        favicon: String(raw.favicon ?? '').trim(),
        icp: String(raw.icp ?? '').trim(),
        contactEmail,
        email: contactEmail,
        contactPhone: String(raw.contactPhone ?? '').trim(),
        contactWechat: String(raw.contactWechat ?? '').trim(),
        contactWechatQR: String(raw.contactWechatQR ?? '').trim(),
        contactQQ: String(raw.contactQQ ?? '').trim(),
        contactQQQR: String(raw.contactQQQR ?? '').trim(),
        contactAddress: String(raw.contactAddress ?? '').trim()
      },
      '获取站点配置成功'
    );
  }
};

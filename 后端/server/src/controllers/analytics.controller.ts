import { Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { getClientIp } from '../utils/client-ip';
import { sendSuccess } from '../utils/response';
import { homeClickService } from '../services/homeClick.service';

export const analyticsController = {
  async trackHomeClick(req: Request, res: Response) {
    const clientIp = getClientIp(req);
    const module = String(req.body?.module ?? '').trim();
    if (!homeClickService.isValidModule(module)) {
      throw new AppError('首页埋点模块无效', {
        statusCode: 400,
        code: 'BAD_REQUEST'
      });
    }

    const result = await homeClickService.track({
      module,
      targetType: req.body?.targetType,
      targetId: req.body?.targetId,
      targetTitle: req.body?.targetTitle,
      action: req.body?.action,
      ip: clientIp,
      userAgent: String(req.headers['user-agent'] ?? ''),
      userId: req.user?.id,
      role: req.user?.role,
      requestId: String(req.headers['x-request-id'] ?? '')
    });

    return sendSuccess(res, result ?? {}, '首页点击埋点记录成功');
  }
};

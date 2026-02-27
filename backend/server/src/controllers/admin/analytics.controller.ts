import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import { analyticsService } from '../../services/admin/analytics.service';
import { AppError } from '../../utils/AppError';
import { homeClickService } from '../../services/homeClick.service';

export const adminAnalyticsController = {
  async users(_req: Request, res: Response) {
    return sendSuccess(res, await analyticsService.users(), '获取用户分析成功');
  },

  async content(_req: Request, res: Response) {
    return sendSuccess(res, await analyticsService.content(), '获取内容分析成功');
  },

  async interactions(_req: Request, res: Response) {
    return sendSuccess(res, await analyticsService.interactions(), '获取互动分析成功');
  },

  async traffic(_req: Request, res: Response) {
    return sendSuccess(res, await analyticsService.traffic(), '获取流量分析成功');
  },

  async retention(_req: Request, res: Response) {
    return sendSuccess(res, await analyticsService.retention(), '获取留存分析成功');
  },

  async funnel(_req: Request, res: Response) {
    return sendSuccess(res, await analyticsService.funnel(), '获取漏斗分析成功');
  },

  async moduleTraffic(_req: Request, res: Response) {
    return sendSuccess(res, await analyticsService.moduleTraffic(), '获取模块流量成功');
  },

  async regionTraffic(_req: Request, res: Response) {
    return sendSuccess(res, await analyticsService.regionTraffic(), '获取地区流量成功');
  },

  async privateMessages(req: Request, res: Response) {
    const days = Number(req.query.days ?? 7);
    return sendSuccess(res, await analyticsService.privateMessages(days), '获取私信监控数据成功');
  },

  async homeClicks(req: Request, res: Response) {
    const days = Number(req.query.days ?? 7);
    return sendSuccess(res, await homeClickService.stats(days), '获取首页点击统计成功');
  },

  async ipProtection(req: Request, res: Response) {
    const hours = Number(req.query.hours ?? 24);
    return sendSuccess(res, await analyticsService.ipProtection(hours), '获取IP防护数据成功');
  },

  async ipProtectionTrend(req: Request, res: Response) {
    const hours = Number(req.query.hours ?? 24);
    const bucket = String(req.query.bucket ?? '').trim().toLowerCase();
    const threshold = Number(req.query.threshold ?? 0);
    return sendSuccess(
      res,
      await analyticsService.ipProtectionTrend(hours, bucket || undefined, threshold),
      '获取IP防护趋势成功'
    );
  },

  async exportIpProtection(req: Request, res: Response) {
    const hours = Number(req.query.hours ?? 24);
    const format = String(req.query.format ?? 'csv')
      .trim()
      .toLowerCase();

    if (!['csv', 'json'].includes(format)) {
      throw new AppError('导出格式仅支持 csv 或 json', {
        statusCode: 400,
        code: 'BAD_REQUEST'
      });
    }

    const payload = await analyticsService.exportIpProtection(hours, format);
    res.setHeader('Content-Type', payload.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${payload.filename}"`);

    return res.status(200).send(payload.content);
  },

  async export(req: Request, res: Response) {
    return sendSuccess(res, await analyticsService.export(req.body ?? {}), '导出任务已创建');
  }
};

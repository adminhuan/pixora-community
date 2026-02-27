import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import { dashboardService } from '../../services/admin/dashboard.service';

export const adminDashboardController = {
  async stats(_req: Request, res: Response) {
    return sendSuccess(res, await dashboardService.stats(), '获取仪表盘概览成功');
  },

  async trends(_req: Request, res: Response) {
    return sendSuccess(res, await dashboardService.trends(), '获取趋势数据成功');
  },

  async activity(_req: Request, res: Response) {
    return sendSuccess(res, await dashboardService.activity(), '获取活跃度数据成功');
  },

  async pending(_req: Request, res: Response) {
    return sendSuccess(res, await dashboardService.pending(), '获取待处理数据成功');
  }
};

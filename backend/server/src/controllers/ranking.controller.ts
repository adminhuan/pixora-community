import { Request, Response } from 'express';
import { sendPagedSuccess, sendSuccess } from '../utils/response';
import { achievementService } from '../services/achievement.service';
import { pointsService } from '../services/points.service';
import { rankingService } from '../services/ranking.service';

export const rankingController = {
  async rankings(req: Request, res: Response) {
    const result = await rankingService.rankings({
      type: String(req.query.type ?? 'total'),
      period: String(req.query.period ?? 'all'),
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 20)
    });
    return sendPagedSuccess(res, result.data, result.pagination, '获取排行榜成功');
  },

  async points(req: Request, res: Response) {
    const data = await pointsService.getUserPoints(req.params.id, String(req.query.type ?? 'all'));
    return sendSuccess(res, data, '获取积分明细成功');
  },

  async level(req: Request, res: Response) {
    const data = await pointsService.getUserLevel(req.params.id);
    return sendSuccess(res, data, '获取等级信息成功');
  },

  async rules(_req: Request, res: Response) {
    const data = await pointsService.getRules();
    return sendSuccess(res, data, '获取积分规则成功');
  },

  async userAchievements(req: Request, res: Response) {
    const data = await achievementService.listUserAchievements(req.params.id);
    return sendSuccess(res, data, '获取用户成就成功');
  },

  async achievements(_req: Request, res: Response) {
    const data = await achievementService.listDefinitions();
    return sendSuccess(res, data, '获取成就定义成功');
  }
};

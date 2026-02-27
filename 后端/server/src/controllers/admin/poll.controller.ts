import { Request, Response } from 'express';
import { pollService } from '../../services/poll.service';
import { sendSuccess } from '../../utils/response';

export const adminPollController = {
  async detail(_req: Request, res: Response) {
    const data = await pollService.getAdminConfig();
    return sendSuccess(res, data, '获取投票配置成功');
  },

  async update(req: Request, res: Response) {
    const payload = (req.body ?? {}) as Record<string, unknown>;
    const data = await pollService.updateConfig(payload);
    return sendSuccess(res, data, '更新投票配置成功');
  }
};

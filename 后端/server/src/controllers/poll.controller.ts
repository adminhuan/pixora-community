import { Request, Response } from 'express';
import { pollService } from '../services/poll.service';
import { getClientIp } from '../utils/client-ip';
import { sendSuccess } from '../utils/response';

export const pollController = {
  async detail(req: Request, res: Response) {
    const ip = getClientIp(req);
    const data = await pollService.getPublicPoll(ip);
    return sendSuccess(res, data, '获取投票信息成功');
  },

  async vote(req: Request, res: Response) {
    const ip = getClientIp(req);
    const optionId = String(req.body?.optionId ?? '').trim();
    const data = await pollService.vote(optionId, ip);
    return sendSuccess(res, data, '投票成功', 201);
  }
};

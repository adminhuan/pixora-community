import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response';

export const healthController = {
  ping(req: Request, res: Response) {
    return sendSuccess(res, {
      status: 'ok',
      service: 'ai-programming-community-server',
      now: new Date().toISOString(),
      path: req.originalUrl
    });
  }
};

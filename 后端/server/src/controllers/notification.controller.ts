import { Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { sendSuccess } from '../utils/response';
import { notificationService } from '../services/notification.service';

export const notificationController = {
  async list(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    const list = await notificationService.listByUser(req.user.id);
    return sendSuccess(res, list, '获取通知列表成功');
  },

  async unreadCount(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    const count = await notificationService.unreadCount(req.user.id);
    return sendSuccess(res, { count }, '获取未读数量成功');
  },

  async markRead(req: Request, res: Response) {
    const item = await notificationService.markRead(req.params.id);
    if (!item) throw new AppError('通知不存在', { statusCode: 404, code: 'NOTIFICATION_NOT_FOUND' });
    return sendSuccess(res, item, '标记已读成功');
  },

  async markAllRead(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    const result = await notificationService.markAllRead(req.user.id);
    return sendSuccess(res, result, '全部标记已读成功');
  },

  async remove(req: Request, res: Response) {
    const removed = await notificationService.removeNotification(req.params.id);
    if (!removed) throw new AppError('通知不存在', { statusCode: 404, code: 'NOTIFICATION_NOT_FOUND' });
    return sendSuccess(res, { id: req.params.id }, '删除通知成功');
  },

  async getSettings(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    const settings = await notificationService.getSettings(req.user.id);
    return sendSuccess(res, settings, '获取通知设置成功');
  },

  async updateSettings(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    const settings = await notificationService.updateSettings(req.user.id, req.body ?? {});
    return sendSuccess(res, settings, '更新通知设置成功');
  }
};

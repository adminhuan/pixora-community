import { Request, Response } from 'express';
import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';
import { sendPagedSuccess, sendSuccess } from '../../utils/response';

const parsePagination = (req: Request) => {
  const page = Math.max(Number(req.query.page ?? 1) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit ?? 20) || 20, 1), 100);
  return { page, limit };
};

const parseIsRead = (value: unknown): boolean | undefined => {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();

  if (!normalized || normalized === 'all') {
    return undefined;
  }

  if (['1', 'true', 'yes', 'read'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'unread'].includes(normalized)) {
    return false;
  }

  return undefined;
};

export const adminNotificationController = {
  async list(req: Request, res: Response) {
    const { page, limit } = parsePagination(req);
    const skip = (page - 1) * limit;

    const targetType = String(req.query.targetType ?? '').trim();
    const isRead = parseIsRead(req.query.isRead);
    const keyword = String(req.query.keyword ?? '').trim();

    const where: Record<string, unknown> = {};
    if (targetType) {
      where.targetType = targetType;
    }
    if (typeof isRead === 'boolean') {
      where.isRead = isRead;
    }
    if (keyword) {
      where.OR = [
        { content: { contains: keyword, mode: 'insensitive' } },
        { targetType: { contains: keyword, mode: 'insensitive' } },
        { targetId: { contains: keyword, mode: 'insensitive' } }
      ];
    }

    const [total, records] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        include: {
          recipient: {
            select: { id: true, username: true, nickname: true }
          },
          sender: {
            select: { id: true, username: true, nickname: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ]);

    const data = records.map((item) => ({
      id: item.id,
      recipientId: item.recipientId,
      recipientName: String(item.recipient.nickname ?? '').trim() || item.recipient.username,
      senderId: item.senderId ?? '',
      senderName: item.sender ? String(item.sender.nickname ?? '').trim() || item.sender.username : 'system',
      type: item.type,
      targetType: String(item.targetType ?? ''),
      targetId: String(item.targetId ?? ''),
      content: String(item.content ?? ''),
      isRead: item.isRead,
      createdAt: item.createdAt.toISOString()
    }));

    return sendPagedSuccess(
      res,
      data,
      {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1)
      },
      '获取系统通知成功'
    );
  },

  async markRead(req: Request, res: Response) {
    const item = await prisma.notification.findUnique({
      where: { id: req.params.id },
      select: { id: true, isRead: true }
    });
    if (!item) {
      throw new AppError('通知不存在', { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (item.isRead) {
      return sendSuccess(res, item, '通知已是已读状态');
    }

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
      select: { id: true, isRead: true }
    });
    return sendSuccess(res, updated, '通知标记已读成功');
  },

  async markAllRead(_req: Request, res: Response) {
    const result = await prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true }
    });
    return sendSuccess(res, { updated: result.count }, '全部通知标记已读成功');
  },

  async remove(req: Request, res: Response) {
    const deleted = await prisma.notification.deleteMany({
      where: { id: req.params.id }
    });
    if (deleted.count === 0) {
      throw new AppError('通知不存在', { statusCode: 404, code: 'NOT_FOUND' });
    }
    return sendSuccess(res, { id: req.params.id }, '删除通知成功');
  }
};


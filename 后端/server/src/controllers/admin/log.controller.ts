import { Request, Response } from 'express';
import prisma from '../../config/database';
import { sendSuccess } from '../../utils/response';

const parsePagination = (req: Request) => {
  const page = Math.max(Number(req.query.page ?? 1) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit ?? 20) || 20, 1), 100);
  return { page, limit };
};

const normalizeIp = (value: string | null): string => {
  if (!value) {
    return '-';
  }

  return value.startsWith('::ffff:') ? value.slice(7) : value;
};

export const adminLogController = {
  async list(req: Request, res: Response) {
    const { page, limit } = parsePagination(req);
    const skip = (page - 1) * limit;
    const keyword = String(req.query.keyword ?? '').trim();

    const where = keyword
      ? {
          OR: [
            { path: { contains: keyword, mode: 'insensitive' as const } },
            { method: { contains: keyword, mode: 'insensitive' as const } },
            { userId: { contains: keyword, mode: 'insensitive' as const } }
          ]
        }
      : undefined;

    const [total, records] = await Promise.all([
      prisma.adminOperationLog.count({ where }),
      prisma.adminOperationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ]);

    const userIds = Array.from(new Set(records.map((item) => item.userId).filter((item): item is string => Boolean(item))));
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, username: true, nickname: true }
        })
      : [];
    const userMap = new Map(
      users.map((item) => [item.id, String(item.nickname ?? '').trim() || item.username])
    );

    const data = records.map((item) => ({
      id: item.id,
      operator: item.userId ? (userMap.get(item.userId) ?? item.userId) : 'system',
      operatorId: item.userId ?? '',
      action: item.method,
      target: item.path,
      method: item.method,
      path: item.path,
      statusCode: item.statusCode,
      durationMs: item.durationMs,
      ip: normalizeIp(item.ip),
      createdAt: item.createdAt.toISOString()
    }));

    return res.status(200).json({
      success: true,
      message: '获取操作日志成功',
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1)
      }
    });
  },

  async export(_req: Request, res: Response) {
    return sendSuccess(
      res,
      {
        taskId: `log_export_${Date.now()}`,
        status: 'queued'
      },
      '日志导出任务已创建'
    );
  }
};

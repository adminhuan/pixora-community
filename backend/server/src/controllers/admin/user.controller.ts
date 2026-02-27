import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Request, Response } from 'express';
import prisma from '../../config/database';
import { ipBlacklistService } from '../../services/admin/ipBlacklist.service';
import { ipWhitelistService } from '../../services/admin/ipWhitelist.service';
import { pointsService } from '../../services/points.service';
import { AppError } from '../../utils/AppError';
import { sendSuccess } from '../../utils/response';

const ALLOWED_ADMIN_UPDATE_FIELDS = ['nickname', 'bio', 'role', 'status', 'mutedUntil', 'bannedUntil'] as const;

export const adminUserController = {
  async list(_req: Request, res: Response) {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        nickname: true,
        avatar: true,
        points: true,
        level: true,
        lastLoginIp: true,
        createdAt: true,
        updatedAt: true
      }
    });
    return sendSuccess(res, users, '获取用户列表成功');
  },

  async detail(req: Request, res: Response) {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        avatar: true,
        coverImage: true,
        nickname: true,
        bio: true,
        signature: true,
        mutedUntil: true,
        bannedUntil: true,
        points: true,
        level: true,
        followersCount: true,
        followingCount: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) throw new AppError('用户不存在', { statusCode: 404, code: 'USER_NOT_FOUND' });
    return sendSuccess(res, user, '获取用户详情成功');
  },

  async update(req: Request, res: Response) {
    const updateData: Record<string, unknown> = {};
    for (const field of ALLOWED_ADMIN_UPDATE_FIELDS) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError('没有可更新字段', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    try {
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: updateData,
        select: {
          id: true,
          username: true,
          role: true,
          status: true,
          nickname: true,
          bio: true,
          mutedUntil: true,
          bannedUntil: true,
          updatedAt: true
        }
      });
      return sendSuccess(res, user, '更新用户成功');
    } catch {
      throw new AppError('用户不存在', { statusCode: 404, code: 'USER_NOT_FOUND' });
    }
  },

  async ban(req: Request, res: Response) {
    try {
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { status: 'banned' },
        select: { id: true, status: true }
      });
      return sendSuccess(res, user, '封禁成功');
    } catch {
      throw new AppError('用户不存在', { statusCode: 404, code: 'USER_NOT_FOUND' });
    }
  },

  async unban(req: Request, res: Response) {
    try {
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { status: 'active', bannedUntil: null },
        select: { id: true, status: true }
      });
      return sendSuccess(res, user, '解封成功');
    } catch {
      throw new AppError('用户不存在', { statusCode: 404, code: 'USER_NOT_FOUND' });
    }
  },

  async mute(req: Request, res: Response) {
    try {
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { status: 'muted' },
        select: { id: true, status: true }
      });
      return sendSuccess(res, user, '禁言成功');
    } catch {
      throw new AppError('用户不存在', { statusCode: 404, code: 'USER_NOT_FOUND' });
    }
  },

  async unmute(req: Request, res: Response) {
    try {
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { status: 'active', mutedUntil: null },
        select: { id: true, status: true }
      });
      return sendSuccess(res, user, '解除禁言成功');
    } catch {
      throw new AppError('用户不存在', { statusCode: 404, code: 'USER_NOT_FOUND' });
    }
  },

  async role(req: Request, res: Response) {
    const role = ['user', 'moderator', 'admin'].includes(String(req.body.role ?? '')) ? String(req.body.role) : 'user';

    try {
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { role: role as 'user' | 'moderator' | 'admin' },
        select: { id: true, role: true }
      });
      return sendSuccess(res, user, '修改角色成功');
    } catch {
      throw new AppError('用户不存在', { statusCode: 404, code: 'USER_NOT_FOUND' });
    }
  },

  async resetPwd(req: Request, res: Response) {
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!user) throw new AppError('用户不存在', { statusCode: 404, code: 'USER_NOT_FOUND' });

    const tempPassword = `Temp${crypto.randomBytes(4).toString('hex')}`;
    const hashed = await bcrypt.hash(tempPassword, 12);

    await prisma.user.update({
      where: { id: req.params.id },
      data: { password: hashed }
    });

    return sendSuccess(
      res,
      {
        userId: req.params.id,
        tempPassword
      },
      '重置密码成功'
    );
  },

  async points(req: Request, res: Response) {
    const result = await pointsService.adjustPoints(req.params.id, Number(req.body.points ?? 0));
    return sendSuccess(res, result, '调整积分成功');
  },

  async roles(_req: Request, res: Response) {
    return sendSuccess(
      res,
      [
        { id: 'user', name: '普通用户' },
        { id: 'moderator', name: '版主' },
        { id: 'admin', name: '管理员' }
      ],
      '获取角色列表成功'
    );
  },

  async updateRoleConfig(req: Request, res: Response) {
    return sendSuccess(res, { id: req.params.id, ...req.body }, '更新角色配置成功');
  },

  async ipBlacklistList(_req: Request, res: Response) {
    const list = await ipBlacklistService.list();
    const operatorIds = Array.from(
      new Set(
        list
          .map((item) => item.createdBy)
          .filter((item): item is string => Boolean(item))
      )
    );

    const operators = operatorIds.length
      ? await prisma.user.findMany({
          where: { id: { in: operatorIds } },
          select: { id: true, username: true, nickname: true }
        })
      : [];

    const operatorMap = new Map(
      operators.map((item) => [item.id, String(item.nickname ?? '').trim() || item.username])
    );

    const data = list.map((item) => ({
      ...item,
      createdByName: item.createdBy ? (operatorMap.get(item.createdBy) ?? item.createdBy) : '-'
    }));

    return sendSuccess(res, data, '获取IP黑名单成功');
  },

  async ipBlacklistAdd(req: Request, res: Response) {
    const { ip, reason } = req.body;
    if (!ip) throw new AppError('IP地址不能为空', { statusCode: 400, code: 'BAD_REQUEST' });
    const record = await ipBlacklistService.add(ip, reason, req.user?.id);
    return sendSuccess(res, record, 'IP已加入黑名单', 201);
  },

  async ipBlacklistRemove(req: Request, res: Response) {
    const record = await ipBlacklistService.remove(req.params.id);
    return sendSuccess(res, record, 'IP已从黑名单移除');
  },

  async ipWhitelistList(_req: Request, res: Response) {
    const list = await ipWhitelistService.list();
    const operatorIds = Array.from(
      new Set(
        list
          .map((item) => item.createdBy)
          .filter((item): item is string => Boolean(item))
      )
    );

    const operators = operatorIds.length
      ? await prisma.user.findMany({
          where: { id: { in: operatorIds } },
          select: { id: true, username: true, nickname: true }
        })
      : [];

    const operatorMap = new Map(
      operators.map((item) => [item.id, String(item.nickname ?? '').trim() || item.username])
    );

    const data = list.map((item) => ({
      ...item,
      createdByName: item.createdBy ? (operatorMap.get(item.createdBy) ?? item.createdBy) : '-'
    }));

    return sendSuccess(res, data, '获取IP白名单成功');
  },

  async ipWhitelistAdd(req: Request, res: Response) {
    const { ip, reason } = req.body;
    if (!ip) throw new AppError('IP地址不能为空', { statusCode: 400, code: 'BAD_REQUEST' });
    const record = await ipWhitelistService.add(ip, reason, req.user?.id);
    return sendSuccess(res, record, 'IP已加入白名单', 201);
  },

  async ipWhitelistRemove(req: Request, res: Response) {
    const record = await ipWhitelistService.remove(req.params.id);
    return sendSuccess(res, record, 'IP已从白名单移除');
  }
};

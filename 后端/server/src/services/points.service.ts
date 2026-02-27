import { POINTS_RULES, calculateLevel } from '../constants/points';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';

class PointsService {
  async getRules() {
    return POINTS_RULES;
  }

  async getUserPoints(userId: string, type: string) {
    return prisma.pointsLog.findMany({
      where: {
        userId,
        type: !type || type === 'all' ? undefined : (type as 'earn' | 'spend')
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getUserLevel(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        points: true,
        level: true
      }
    });

    if (!user) {
      throw new AppError('用户不存在', { statusCode: 404, code: 'USER_NOT_FOUND' });
    }

    const level = calculateLevel(user.points);
    await prisma.user.update({
      where: { id: userId },
      data: {
        level: level.level
      }
    });

    return {
      userId,
      points: user.points,
      level: level.level,
      title: level.title
    };
  }

  async adjustPoints(userId: string, points: number, action = 'admin_adjust', description = '管理员调整积分') {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new AppError('用户不存在', { statusCode: 404, code: 'USER_NOT_FOUND' });
      }

      const newPoints = Math.max(0, user.points + points);
      const level = calculateLevel(newPoints);

      await tx.user.update({
        where: { id: userId },
        data: {
          points: newPoints,
          level: level.level
        }
      });

      await tx.pointsLog.create({
        data: {
          userId,
          type: points >= 0 ? 'earn' : 'spend',
          action,
          points,
          balance: newPoints,
          description
        }
      });

      return {
        userId,
        points: newPoints,
        level: level.level,
        title: level.title
      };
    });
  }
}

export const pointsService = new PointsService();

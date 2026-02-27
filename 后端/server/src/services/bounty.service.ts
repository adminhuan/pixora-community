import prisma from '../config/database';
import { AppError } from '../utils/AppError';

class BountyService {
  async setBounty(questionId: string, userId: string, points: number, expiresInHours = 72) {
    return prisma.$transaction(async (tx) => {
      const question = await tx.question.findUnique({ where: { id: questionId } });
      if (!question) {
        throw new AppError('问题不存在', { statusCode: 404, code: 'QUESTION_NOT_FOUND' });
      }

      if (question.authorId !== userId) {
        throw new AppError('仅提问者可设置悬赏', { statusCode: 403, code: 'FORBIDDEN' });
      }

      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new AppError('用户不存在', { statusCode: 404, code: 'USER_NOT_FOUND' });
      }

      if (points <= 0) {
        throw new AppError('悬赏积分必须大于0', { statusCode: 400, code: 'INVALID_POINTS' });
      }

      if (user.points < points) {
        throw new AppError('积分不足', { statusCode: 400, code: 'INSUFFICIENT_POINTS' });
      }

      const balance = user.points - points;

      await tx.user.update({
        where: { id: userId },
        data: {
          points: balance
        }
      });

      await tx.pointsLog.create({
        data: {
          userId,
          type: 'spend',
          action: 'bounty',
          points: -points,
          balance,
          description: `问题 ${questionId} 设置悬赏`
        }
      });

      return tx.question.update({
        where: { id: questionId },
        data: {
          bounty: points,
          bountyExpiresAt: new Date(Date.now() + expiresInHours * 3600 * 1000)
        }
      });
    });
  }
}

export const bountyService = new BountyService();

import prisma from '../config/database';
import { AppError } from '../utils/AppError';

class FollowService {
  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new AppError('不能关注自己', { statusCode: 400, code: 'INVALID_OPERATION' });
    }

    await prisma.$transaction(async (tx) => {
      const follower = await tx.user.findUnique({ where: { id: followerId }, select: { id: true } });
      const following = await tx.user.findUnique({ where: { id: followingId }, select: { id: true } });
      if (!follower || !following) {
        throw new AppError('用户不存在', { statusCode: 404, code: 'USER_NOT_FOUND' });
      }

      const existing = await tx.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId
          }
        }
      });
      if (existing) {
        throw new AppError('已关注', { statusCode: 400, code: 'ALREADY_FOLLOWED' });
      }

      await tx.follow.create({
        data: {
          followerId,
          followingId
        }
      });

      await tx.user.update({
        where: { id: followerId },
        data: {
          followingCount: {
            increment: 1
          }
        }
      });
      await tx.user.update({
        where: { id: followingId },
        data: {
          followersCount: {
            increment: 1
          }
        }
      });
    });

    return {
      followed: true
    };
  }

  async unfollow(followerId: string, followingId: string) {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId
          }
        }
      });
      if (!existing) {
        throw new AppError('未关注', { statusCode: 400, code: 'NOT_FOLLOWED' });
      }

      await tx.follow.delete({ where: { id: existing.id } });
      await tx.user.update({
        where: { id: followerId },
        data: {
          followingCount: {
            decrement: 1
          }
        }
      });
      await tx.user.update({
        where: { id: followingId },
        data: {
          followersCount: {
            decrement: 1
          }
        }
      });
    });

    return {
      followed: false
    };
  }
}

export const followService = new FollowService();

import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { logger } from '../utils/logger';

class NotificationService {
  async listByUser(userId: string) {
    return prisma.notification.findMany({
      where: { recipientId: userId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async unreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        recipientId: userId,
        isRead: false
      }
    });
  }

  async markRead(id: string) {
    try {
      return await prisma.notification.update({
        where: { id },
        data: { isRead: true }
      });
    } catch (error) {
      logger.error('标记通知已读失败', {
        id,
        error: (error as Error).message
      });
      return null;
    }
  }

  async markAllRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: {
        recipientId: userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    return {
      updated: result.count
    };
  }

  async removeNotification(id: string) {
    const result = await prisma.notification.deleteMany({ where: { id } });
    return result.count > 0;
  }

  async getSettings(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        notificationSettings: true
      }
    });

    if (!user?.notificationSettings || typeof user.notificationSettings !== 'object') {
      return {
        comment: true,
        reply: true,
        like: true,
        follow: true,
        system: true
      };
    }

    return user.notificationSettings;
  }

  async updateSettings(userId: string, payload: Record<string, unknown>) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        notificationSettings: payload as Prisma.InputJsonValue
      },
      select: {
        notificationSettings: true
      }
    });

    return user.notificationSettings;
  }
}

export const notificationService = new NotificationService();

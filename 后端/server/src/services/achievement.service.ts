import prisma from '../config/database';

class AchievementService {
  async listDefinitions() {
    return prisma.achievement.findMany({
      orderBy: {
        name: 'asc'
      }
    });
  }

  async listUserAchievements(userId: string) {
    return prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true
      },
      orderBy: {
        unlockedAt: 'desc'
      }
    });
  }
}

export const achievementService = new AchievementService();

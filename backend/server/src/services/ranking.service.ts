import prisma from '../config/database';
import redis from '../config/redis';

type RankingType = 'total' | 'contribution' | 'creation' | 'project' | 'newstar';
type RankingPeriod = 'week' | 'month' | 'all';

const isRankingType = (value: string): value is RankingType => {
  return ['total', 'contribution', 'creation', 'project', 'newstar'].includes(value);
};

const isRankingPeriod = (value: string): value is RankingPeriod => {
  return ['week', 'month', 'all'].includes(value);
};

const resolvePeriodSince = (period: RankingPeriod): Date | undefined => {
  const now = Date.now();
  if (period === 'week') {
    return new Date(now - 7 * 24 * 3600 * 1000);
  }
  if (period === 'month') {
    return new Date(now - 30 * 24 * 3600 * 1000);
  }
  return undefined;
};

class RankingService {
  private async buildScoreMap(type: RankingType, period: RankingPeriod): Promise<Array<{ userId: string; score: number }>> {
    const since = resolvePeriodSince(period);
    const userList = await prisma.user.findMany({
      select: {
        id: true,
        points: true
      }
    });

    if (type === 'total') {
      return userList.map((item) => ({ userId: item.id, score: item.points }));
    }

    const map = new Map<string, number>();
    userList.forEach((item) => map.set(item.id, 0));

    if (type === 'contribution') {
      const [questionCounts, answerCounts] = await Promise.all([
        prisma.question.groupBy({
          by: ['authorId'],
          _count: { _all: true },
          ...(since ? { where: { createdAt: { gte: since } } } : {})
        }),
        prisma.answer.groupBy({
          by: ['authorId'],
          _count: { _all: true },
          ...(since ? { where: { createdAt: { gte: since } } } : {})
        })
      ]);

      questionCounts.forEach((item) => map.set(item.authorId, (map.get(item.authorId) ?? 0) + item._count._all));
      answerCounts.forEach((item) => map.set(item.authorId, (map.get(item.authorId) ?? 0) + item._count._all));
    }

    if (type === 'creation') {
      const [postCounts, blogCounts] = await Promise.all([
        prisma.post.groupBy({
          by: ['authorId'],
          _count: { _all: true },
          ...(since ? { where: { createdAt: { gte: since } } } : {})
        }),
        prisma.blog.groupBy({
          by: ['authorId'],
          _count: { _all: true },
          ...(since ? { where: { createdAt: { gte: since } } } : {})
        })
      ]);

      postCounts.forEach((item) => map.set(item.authorId, (map.get(item.authorId) ?? 0) + item._count._all));
      blogCounts.forEach((item) => map.set(item.authorId, (map.get(item.authorId) ?? 0) + item._count._all));
    }

    if (type === 'project') {
      const projectScores = await prisma.project.groupBy({
        by: ['authorId'],
        _sum: {
          likeCount: true,
          favoriteCount: true
        },
        ...(since ? { where: { createdAt: { gte: since } } } : {})
      });

      projectScores.forEach((item) => {
        const score = Number(item._sum.likeCount ?? 0) + Number(item._sum.favoriteCount ?? 0);
        map.set(item.authorId, score);
      });
    }

    if (type === 'newstar') {
      const newstarSince = since ?? new Date(Date.now() - 30 * 24 * 3600 * 1000);
      const points = await prisma.pointsLog.groupBy({
        by: ['userId'],
        _sum: {
          points: true
        },
        where: {
          createdAt: {
            gte: newstarSince
          }
        }
      });

      points.forEach((item) => {
        map.set(item.userId, Number(item._sum.points ?? 0));
      });
    }

    return Array.from(map.entries()).map(([userId, score]) => ({ userId, score }));
  }

  async rankings(params: { type?: string; period?: string; page?: number; limit?: number }) {
    const type = isRankingType(String(params.type ?? 'total')) ? (params.type as RankingType) : 'total';
    const period = isRankingPeriod(String(params.period ?? 'all')) ? (String(params.period) as RankingPeriod) : 'all';
    const page = Math.max(Number(params.page) || 1, 1);
    const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 100);

    const cacheKey = `ranking:${type}:${period}:${page}:${limit}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as {
        data: Array<{
          rank: number;
          userId: string;
          username?: string;
          avatar?: string | null;
          score: number;
          period: string;
          type: RankingType;
        }>;
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };
    }

    const list = await this.buildScoreMap(type, period);
    const sorted = list.sort((a, b) => b.score - a.score);

    const users = await prisma.user.findMany({
      where: {
        id: {
          in: sorted.map((item) => item.userId)
        }
      },
      select: {
        id: true,
        username: true,
        avatar: true
      }
    });
    const userMap = new Map(users.map((item) => [item.id, item]));

    const start = (page - 1) * limit;
    const data = sorted.slice(start, start + limit).map((item, index) => ({
      rank: start + index + 1,
      userId: item.userId,
      username: userMap.get(item.userId)?.username,
      avatar: userMap.get(item.userId)?.avatar,
      score: item.score,
      period,
      type
    }));

    const result = {
      data,
      pagination: {
        page,
        limit,
        total: sorted.length,
        totalPages: Math.max(Math.ceil(sorted.length / limit), 1)
      }
    };

    await redis.set(cacheKey, JSON.stringify(result), 'EX', 1800);
    return result;
  }
}

export const rankingService = new RankingService();

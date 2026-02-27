import prisma from '../../config/database';

class DashboardService {
  async stats() {
    const [totalUsers, totalPosts, totalBlogs, totalQuestions, todayNewUsers, todayNewContents] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.blog.count(),
      prisma.question.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: this.startOfToday()
          }
        }
      }),
      Promise.all([
        prisma.post.count({ where: { createdAt: { gte: this.startOfToday() } } }),
        prisma.blog.count({ where: { createdAt: { gte: this.startOfToday() } } }),
        prisma.question.count({ where: { createdAt: { gte: this.startOfToday() } } })
      ]).then((items) => items.reduce((sum, value) => sum + value, 0))
    ]);

    return {
      totalUsers,
      totalPosts,
      totalBlogs,
      totalQuestions,
      todayNewUsers,
      todayNewContents
    };
  }

  async trends() {
    const days = this.lastNDays(7);

    const [users, posts, blogs, questions] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: days[0] } },
        select: { createdAt: true }
      }),
      prisma.post.findMany({
        where: { createdAt: { gte: days[0] } },
        select: { createdAt: true }
      }),
      prisma.blog.findMany({
        where: { createdAt: { gte: days[0] } },
        select: { createdAt: true }
      }),
      prisma.question.findMany({
        where: { createdAt: { gte: days[0] } },
        select: { createdAt: true }
      })
    ]);

    const userSeries = days.map((day) => ({ day: day.toISOString().slice(0, 10), users: 0 }));
    const contentSeries = days.map((day) => ({ day: day.toISOString().slice(0, 10), contents: 0 }));

    users.forEach((item) => {
      const key = item.createdAt.toISOString().slice(0, 10);
      const target = userSeries.find((record) => record.day === key);
      if (target) {
        target.users += 1;
      }
    });

    [...posts, ...blogs, ...questions].forEach((item) => {
      const key = item.createdAt.toISOString().slice(0, 10);
      const target = contentSeries.find((record) => record.day === key);
      if (target) {
        target.contents += 1;
      }
    });

    return {
      users: userSeries,
      contents: contentSeries
    };
  }

  async activity() {
    const last24Hours = new Date(Date.now() - 24 * 3600 * 1000);
    const activeUsers = await prisma.user.findMany({
      where: {
        lastLoginAt: {
          gte: last24Hours
        }
      },
      select: {
        lastLoginAt: true
      }
    });

    const activeByHour = Array.from({ length: 24 }, (_unused, hour) => ({ hour, count: 0 }));
    activeUsers.forEach((item) => {
      if (item.lastLoginAt) {
        const hour = item.lastLoginAt.getHours();
        activeByHour[hour].count += 1;
      }
    });

    const topTags = await prisma.tag.findMany({
      orderBy: [{ usageCount: 'desc' }, { followersCount: 'desc' }],
      take: 10
    });

    return {
      activeByHour,
      topTags
    };
  }

  async pending() {
    const [pendingReports, pendingComments, pendingAudit] = await Promise.all([
      prisma.report.count({ where: { status: 'pending' } }),
      prisma.comment.count({ where: { status: 'hidden' } }),
      prisma.report.findMany({
        where: { status: 'pending' },
        take: 10,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return {
      pendingReports,
      pendingComments,
      pendingAudit
    };
  }

  private startOfToday(): Date {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }

  private lastNDays(days: number): Date[] {
    return Array.from({ length: days }, (_unused, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (days - 1 - index));
      return date;
    });
  }
}

export const dashboardService = new DashboardService();

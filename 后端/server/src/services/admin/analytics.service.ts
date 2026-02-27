import geoip from 'geoip-lite';
import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { emailService } from '../email.service';
import { logger } from '../../utils/logger';
import { ipWhitelistService } from './ipWhitelist.service';

const normalizeIp = (value: string | null): string => {
  if (!value) {
    return '-';
  }

  if (value === '::1') {
    return '127.0.0.1';
  }

  return value.startsWith('::ffff:') ? value.slice(7) : value;
};

const escapeCsvCell = (value: unknown): string => {
  const text = String(value ?? '');
  if (text.includes('"') || text.includes(',') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const parseBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['0', 'false', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }

  return fallback;
};

class AnalyticsService {
  private async readSecuritySettingsPayload(): Promise<Record<string, unknown>> {
    const row = await prisma.systemSetting.findUnique({
      where: { group: 'security' },
      select: { payload: true }
    });

    if (!row?.payload || typeof row.payload !== 'object' || Array.isArray(row.payload)) {
      return {};
    }

    return row.payload as Record<string, unknown>;
  }

  private async updateSecuritySettingsPayload(payload: Record<string, unknown>): Promise<void> {
    const current = await this.readSecuritySettingsPayload();
    const next = {
      ...current,
      ...payload
    };

    await prisma.systemSetting.upsert({
      where: { group: 'security' },
      create: {
        group: 'security',
        payload: next as Prisma.InputJsonValue
      },
      update: {
        payload: next as Prisma.InputJsonValue
      }
    });
  }

  private async resolveIpAlertSettings() {
    const payload = await this.readSecuritySettingsPayload();
    const thresholdRaw = Number(payload.ipAlertThreshold);
    const threshold = Number.isFinite(thresholdRaw) ? Math.min(Math.max(Math.floor(thresholdRaw), 1), 100000) : 20;

    const cooldownRaw = Number(payload.ipAlertNotifyCooldownMinutes);
    const cooldownMinutes = Number.isFinite(cooldownRaw)
      ? Math.min(Math.max(Math.floor(cooldownRaw), 1), 1440)
      : 30;

    const lastSentAt = String(payload.ipAlertLastSentAt ?? '').trim();

    return {
      threshold,
      notifyEnabled: parseBoolean(payload.ipAlertNotifyEnabled, false),
      notifyEmail: String(payload.ipAlertNotifyEmail ?? '').trim(),
      cooldownMinutes,
      lastSentAt
    };
  }

  private resolveHours(hours: number): number {
    return Math.min(Math.max(Number(hours) || 24, 1), 24 * 30);
  }

  private resolveDays(days: number): number {
    return Math.min(Math.max(Number(days) || 7, 1), 90);
  }

  private resolveAlertThreshold(threshold: number | undefined, blockedSeries: number[]): number {
    const parsed = Number(threshold);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.floor(parsed);
    }

    if (blockedSeries.length === 0) {
      return 10;
    }

    const sorted = [...blockedSeries].sort((a, b) => a - b);
    const p90 = sorted[Math.floor((sorted.length - 1) * 0.9)] ?? 0;
    return Math.max(10, Number(p90));
  }

  private async emitIpAlertIfNeeded(payload: {
    alerts: Array<{ label: string; blocked: number; whitelistBlocked: number; blacklistBlocked: number }>;
    alertThreshold: number;
    maxBlocked: number;
    hours: number;
    bucket: 'hour' | 'day';
    settings: {
      notifyEnabled: boolean;
      notifyEmail: string;
      cooldownMinutes: number;
      lastSentAt: string;
    };
  }): Promise<{ sent: boolean; reason?: string; lastSentAt?: string; cooldownMinutes: number }> {
    const { alerts, alertThreshold, maxBlocked, hours, bucket, settings } = payload;

    if (!settings.notifyEnabled) {
      return {
        sent: false,
        reason: 'NOTIFY_DISABLED',
        lastSentAt: settings.lastSentAt || undefined,
        cooldownMinutes: settings.cooldownMinutes
      };
    }

    if (alerts.length === 0) {
      return {
        sent: false,
        reason: 'NO_ALERTS',
        lastSentAt: settings.lastSentAt || undefined,
        cooldownMinutes: settings.cooldownMinutes
      };
    }

    const now = Date.now();
    const lastSentTimestamp = settings.lastSentAt ? new Date(settings.lastSentAt).getTime() : 0;
    if (lastSentTimestamp > 0 && now - lastSentTimestamp < settings.cooldownMinutes * 60 * 1000) {
      return {
        sent: false,
        reason: 'COOLDOWN',
        lastSentAt: settings.lastSentAt || undefined,
        cooldownMinutes: settings.cooldownMinutes
      };
    }

    const alertTimeList = alerts.slice(0, 5).map((item) => item.label);
    const content = `IP防护告警：近${hours}小时出现${alerts.length}个峰值，阈值${alertThreshold}，最高拦截${maxBlocked}，时段：${alertTimeList.join('、')}`;

    const admins = await prisma.user.findMany({
      where: { role: 'admin', status: 'active' },
      select: { id: true }
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((item) => ({
          recipientId: item.id,
          type: 'system',
          targetType: 'ip_protection_alert',
          content
        }))
      });
    }

    if (settings.notifyEmail) {
      await emailService
        .sendCustomEmail({
          to: settings.notifyEmail,
          subject: 'AI社区-IP防护告警',
          content: `${content}\n聚合粒度：${bucket === 'hour' ? '按小时' : '按天'}`
        })
        .catch((error: unknown) => {
          logger.warn('IP alert email send failed', {
            to: settings.notifyEmail,
            reason: error instanceof Error ? error.message : 'unknown'
          });
        });
    }

    const sentAt = new Date().toISOString();
    await this.updateSecuritySettingsPayload({
      ipAlertLastSentAt: sentAt
    });

    return {
      sent: true,
      lastSentAt: sentAt,
      cooldownMinutes: settings.cooldownMinutes
    };
  }

  private resolveTrendBucket(
    hours: number,
    bucket: string | undefined
  ): 'hour' | 'day' {
    const normalized = String(bucket ?? '')
      .trim()
      .toLowerCase();

    if (normalized === 'hour' || normalized === 'day') {
      return normalized;
    }

    return hours <= 72 ? 'hour' : 'day';
  }

  private floorToBucket(date: Date, bucket: 'hour' | 'day'): Date {
    const next = new Date(date);
    if (bucket === 'hour') {
      next.setUTCMinutes(0, 0, 0);
      return next;
    }

    next.setUTCHours(0, 0, 0, 0);
    return next;
  }

  private addBucket(date: Date, bucket: 'hour' | 'day', step = 1): Date {
    const next = new Date(date);
    if (bucket === 'hour') {
      next.setUTCHours(next.getUTCHours() + step);
      return next;
    }

    next.setUTCDate(next.getUTCDate() + step);
    return next;
  }

  private formatBucketLabel(date: Date, bucket: 'hour' | 'day'): string {
    if (bucket === 'hour') {
      return `${date.toISOString().slice(0, 13)}:00`;
    }

    return date.toISOString().slice(0, 10);
  }

  async users() {
    const [total, active, banned] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'active' } }),
      prisma.user.count({ where: { status: 'banned' } })
    ]);

    return {
      total,
      active,
      banned
    };
  }

  async content() {
    const [posts, blogs, questions, projects] = await Promise.all([
      prisma.post.count(),
      prisma.blog.count(),
      prisma.question.count(),
      prisma.project.count()
    ]);

    return {
      posts,
      blogs,
      questions,
      projects
    };
  }

  async interactions() {
    const [comments, likes] = await Promise.all([prisma.comment.count(), prisma.like.count()]);

    return {
      comments,
      likes
    };
  }

  async traffic() {
    const [postViews, blogViews, questionViews] = await Promise.all([
      prisma.post.aggregate({ _sum: { viewCount: true } }),
      prisma.blog.aggregate({ _sum: { viewCount: true } }),
      prisma.question.aggregate({ _sum: { viewCount: true } })
    ]);

    const pv =
      Number(postViews._sum.viewCount ?? 0) +
      Number(blogViews._sum.viewCount ?? 0) +
      Number(questionViews._sum.viewCount ?? 0);
    const uv = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: new Date(Date.now() - 24 * 3600 * 1000)
        }
      }
    });
    const bounceRate = pv === 0 ? 0 : Number(((1 - Math.min(uv / pv, 1)) * 100).toFixed(2));

    return {
      pv,
      uv,
      bounceRate
    };
  }

  async retention() {
    const totalUsers = await prisma.user.count();
    const periods = [1, 3, 7, 14, 30];

    const points = await Promise.all(
      periods.map(async (days) => {
        const retainedUsers = await prisma.user.count({
          where: {
            lastLoginAt: {
              gte: new Date(Date.now() - days * 24 * 3600 * 1000)
            }
          }
        });

        return {
          days,
          retainedUsers,
          retentionRate: totalUsers === 0 ? 0 : Number(((retainedUsers / totalUsers) * 100).toFixed(2))
        };
      })
    );

    return {
      totalUsers,
      points
    };
  }

  async funnel() {
    const [registered, activated, posters, answerers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { lastLoginAt: { not: null } } }),
      prisma.post.groupBy({ by: ['authorId'] }).then((rows) => rows.length),
      prisma.answer.groupBy({ by: ['authorId'] }).then((rows) => rows.length)
    ]);

    const stages = [
      { key: 'registered', name: '注册用户', value: registered },
      { key: 'activated', name: '活跃用户', value: activated },
      { key: 'posters', name: '发帖用户', value: posters },
      { key: 'answerers', name: '回答用户', value: answerers }
    ];

    return {
      stages,
      conversion: stages.map((stage, index) => {
        if (index === 0) {
          return {
            key: stage.key,
            rate: 100
          };
        }

        const previous = stages[index - 1].value;
        return {
          key: stage.key,
          rate: previous === 0 ? 0 : Number(((stage.value / previous) * 100).toFixed(2))
        };
      })
    };
  }

  async moduleTraffic() {
    const modules = [
      { key: 'forum', name: '论坛', prefixes: ['/posts', '/forum'] },
      { key: 'blog', name: '博客', prefixes: ['/blogs', '/blog'] },
      { key: 'qa', name: '问答', prefixes: ['/questions', '/answers', '/qa'] },
      { key: 'project', name: '项目', prefixes: ['/projects'] },
      { key: 'snippet', name: '组件广场', prefixes: ['/snippets', '/components'] }
    ];

    const logs = await prisma.adminOperationLog.findMany({
      select: { path: true }
    });

    const result = modules.map((mod) => {
      const count = logs.filter((log) =>
        mod.prefixes.some((prefix) => log.path.includes(prefix))
      ).length;
      return { key: mod.key, name: mod.name, count };
    });

    return result;
  }

  async regionTraffic() {
    const logs = await prisma.adminOperationLog.findMany({
      where: { ip: { not: null } },
      select: { ip: true },
      distinct: ['ip']
    });

    const countryMap: Record<string, number> = {};
    const provinceMap: Record<string, number> = {};

    for (const log of logs) {
      if (!log.ip) continue;
      const geo = geoip.lookup(log.ip);
      if (!geo) continue;

      const country = geo.country || 'Unknown';
      countryMap[country] = (countryMap[country] || 0) + 1;

      if (country === 'CN' && geo.region) {
        const province = geo.region;
        provinceMap[province] = (provinceMap[province] || 0) + 1;
      }
    }

    const countries = Object.entries(countryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const provinces = Object.entries(provinceMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { countries, provinces };
  }

  async privateMessages(days = 7) {
    const safeDays = this.resolveDays(days);
    const since = new Date(Date.now() - safeDays * 24 * 3600 * 1000);

    const [totalMessages, unreadMessages, totalConversations, senderGroups, receiverGroups, messageRows] = await Promise.all([
      prisma.privateMessage.count({
        where: { createdAt: { gte: since } }
      }),
      prisma.privateMessage.count({
        where: {
          createdAt: { gte: since },
          isRead: false
        }
      }),
      prisma.privateConversation.count(),
      prisma.privateMessage.groupBy({
        by: ['senderId'],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { senderId: 'desc' } },
        take: 10
      }),
      prisma.privateMessage.groupBy({
        by: ['receiverId'],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { receiverId: 'desc' } },
        take: 10
      }),
      prisma.privateMessage.findMany({
        where: { createdAt: { gte: since } },
        select: {
          createdAt: true,
          isRead: true
        }
      })
    ]);

    const activeUserIds = new Set<string>();
    senderGroups.forEach((item) => activeUserIds.add(item.senderId));
    receiverGroups.forEach((item) => activeUserIds.add(item.receiverId));

    const topSenderIds = senderGroups.map((item) => item.senderId);
    const topReceiverIds = receiverGroups.map((item) => item.receiverId);
    const unreadUserGroups = await prisma.privateMessage.groupBy({
      by: ['receiverId'],
      where: { isRead: false },
      _count: { _all: true },
      orderBy: { _count: { receiverId: 'desc' } },
      take: 10
    });
    const unreadUserIds = unreadUserGroups.map((item) => item.receiverId);

    const uniqueUserIds = Array.from(new Set([...topSenderIds, ...topReceiverIds, ...unreadUserIds]));
    const users = uniqueUserIds.length
      ? await prisma.user.findMany({
          where: { id: { in: uniqueUserIds } },
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true
          }
        })
      : [];

    const userMap = new Map(
      users.map((item) => [
        item.id,
        {
          userId: item.id,
          username: item.username,
          nickname: item.nickname,
          avatar: item.avatar
        }
      ])
    );

    const trendMap = new Map<string, { date: string; total: number; read: number; unread: number }>();
    for (let index = safeDays - 1; index >= 0; index -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - index);
      const label = date.toISOString().slice(0, 10);
      trendMap.set(label, { date: label, total: 0, read: 0, unread: 0 });
    }

    messageRows.forEach((item) => {
      const label = item.createdAt.toISOString().slice(0, 10);
      const bucket = trendMap.get(label);
      if (!bucket) {
        return;
      }

      bucket.total += 1;
      if (item.isRead) {
        bucket.read += 1;
        return;
      }
      bucket.unread += 1;
    });

    const busyConversationGroups = await prisma.privateMessage.groupBy({
      by: ['conversationId'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { conversationId: 'desc' } },
      take: 10
    });

    const busyConversationIds = busyConversationGroups.map((item) => item.conversationId);
    const [busyConversations, unreadConversationGroups] = await Promise.all([
      busyConversationIds.length
        ? prisma.privateConversation.findMany({
            where: { id: { in: busyConversationIds } },
            select: {
              id: true,
              userA: {
                select: {
                  id: true,
                  username: true,
                  nickname: true,
                  avatar: true
                }
              },
              userB: {
                select: {
                  id: true,
                  username: true,
                  nickname: true,
                  avatar: true
                }
              },
              lastMessageAt: true,
              lastMessageContent: true
            }
          })
        : [],
      busyConversationIds.length
        ? prisma.privateMessage.groupBy({
            by: ['conversationId'],
            where: {
              conversationId: { in: busyConversationIds },
              isRead: false
            },
            _count: { _all: true }
          })
        : []
    ]);

    const busyConversationMap = new Map(busyConversations.map((item) => [item.id, item]));
    const unreadConversationMap = new Map(
      unreadConversationGroups.map((item) => [item.conversationId, Number(item._count._all ?? 0)])
    );

    const topSenders = senderGroups.map((item) => ({
      ...(userMap.get(item.senderId) ?? {
        userId: item.senderId,
        username: '未知用户',
        nickname: null,
        avatar: null
      }),
      count: Number(item._count._all ?? 0)
    }));

    const topReceivers = receiverGroups.map((item) => ({
      ...(userMap.get(item.receiverId) ?? {
        userId: item.receiverId,
        username: '未知用户',
        nickname: null,
        avatar: null
      }),
      count: Number(item._count._all ?? 0)
    }));

    const unreadByUser = unreadUserGroups.map((item) => ({
      ...(userMap.get(item.receiverId) ?? {
        userId: item.receiverId,
        username: '未知用户',
        nickname: null,
        avatar: null
      }),
      count: Number(item._count._all ?? 0)
    }));

    const topConversations = busyConversationGroups.map((item) => {
      const conversation = busyConversationMap.get(item.conversationId);
      return {
        conversationId: item.conversationId,
        messageCount: Number(item._count._all ?? 0),
        unreadCount: unreadConversationMap.get(item.conversationId) ?? 0,
        lastMessageAt: conversation?.lastMessageAt?.toISOString() ?? '',
        lastMessageContent: conversation?.lastMessageContent ?? '',
        userA: conversation?.userA ?? null,
        userB: conversation?.userB ?? null
      };
    });

    const readRate = totalMessages === 0 ? 0 : Number((((totalMessages - unreadMessages) / totalMessages) * 100).toFixed(2));
    const avgMessagesPerConversation =
      totalConversations === 0 ? 0 : Number((totalMessages / totalConversations).toFixed(2));

    return {
      days: safeDays,
      since: since.toISOString(),
      summary: {
        totalMessages,
        unreadMessages,
        totalConversations,
        activeUsers: activeUserIds.size,
        readRate,
        avgMessagesPerConversation
      },
      dailyTrend: Array.from(trendMap.values()),
      topSenders,
      topReceivers,
      topConversations,
      unreadByUser
    };
  }

  async ipProtection(hours = 24) {
    const safeHours = this.resolveHours(hours);
    const since = new Date(Date.now() - safeHours * 3600 * 1000);

    const [grouped, blockedRows, recentBlockedRows] = await Promise.all([
      prisma.ipAccessLog.groupBy({
        by: ['rule', 'result'],
        where: { createdAt: { gte: since } },
        _count: { _all: true }
      }),
      prisma.ipAccessLog.findMany({
        where: {
          createdAt: { gte: since },
          result: 'blocked',
          ip: { not: null }
        },
        select: {
          ip: true,
          rule: true
        }
      }),
      prisma.ipAccessLog.findMany({
        where: {
          createdAt: { gte: since },
          result: 'blocked'
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          ip: true,
          method: true,
          path: true,
          statusCode: true,
          rule: true,
          reason: true,
          createdAt: true
        }
      })
    ]);

    const getCount = (rule: 'whitelist' | 'blacklist', result: 'allowed' | 'blocked') => {
      const row = grouped.find((item) => item.rule === rule && item.result === result);
      return Number(row?._count._all ?? 0);
    };

    const whitelistAllowed = getCount('whitelist', 'allowed');
    const whitelistBlocked = getCount('whitelist', 'blocked');
    const blacklistBlocked = getCount('blacklist', 'blocked');
    const blockedTotal = whitelistBlocked + blacklistBlocked;
    const allowedTotal = whitelistAllowed;
    const total = allowedTotal + blockedTotal;

    const blockedIpCounter = new Map<string, { ip: string; rule: 'whitelist' | 'blacklist'; count: number }>();
    blockedRows.forEach((item) => {
      const ip = normalizeIp(item.ip);
      if (ip === '-') {
        return;
      }

      const key = `${ip}:${item.rule}`;
      const current = blockedIpCounter.get(key);
      if (current) {
        current.count += 1;
        return;
      }

      blockedIpCounter.set(key, {
        ip,
        rule: item.rule,
        count: 1
      });
    });

    const topBlockedIps = Array.from(blockedIpCounter.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const uniqueBlockedIps = new Set(
      blockedRows
        .map((item) => normalizeIp(item.ip))
        .filter((ip) => ip !== '-')
    ).size;

    return {
      enabled: ipWhitelistService.isEnabled(),
      hours: safeHours,
      since: since.toISOString(),
      summary: {
        total,
        allowed: allowedTotal,
        blocked: blockedTotal,
        whitelistAllowed,
        whitelistBlocked,
        blacklistBlocked,
        uniqueBlockedIps
      },
      topBlockedIps,
      recentBlocked: recentBlockedRows.map((item) => ({
        id: item.id,
        ip: normalizeIp(item.ip),
        method: item.method,
        path: item.path,
        statusCode: item.statusCode,
        rule: item.rule,
        reason: item.reason ?? '',
        createdAt: item.createdAt.toISOString()
      }))
    };
  }

  async ipProtectionTrend(hours = 24, bucket?: string, threshold?: number) {
    const safeHours = this.resolveHours(hours);
    const trendBucket = this.resolveTrendBucket(safeHours, bucket);
    const settings = await this.resolveIpAlertSettings();
    const since = new Date(Date.now() - safeHours * 3600 * 1000);

    const start = this.floorToBucket(since, trendBucket);
    const end = this.floorToBucket(new Date(), trendBucket);

    const timeline = new Map<
      string,
      {
        label: string;
        total: number;
        allowed: number;
        blocked: number;
        whitelistBlocked: number;
        blacklistBlocked: number;
      }
    >();

    for (let cursor = new Date(start); cursor.getTime() <= end.getTime(); cursor = this.addBucket(cursor, trendBucket)) {
      const label = this.formatBucketLabel(cursor, trendBucket);
      timeline.set(label, {
        label,
        total: 0,
        allowed: 0,
        blocked: 0,
        whitelistBlocked: 0,
        blacklistBlocked: 0
      });
    }

    const rows = await prisma.ipAccessLog.findMany({
      where: { createdAt: { gte: start } },
      select: {
        createdAt: true,
        result: true,
        rule: true
      }
    });

    rows.forEach((item) => {
      const bucketDate = this.floorToBucket(item.createdAt, trendBucket);
      const label = this.formatBucketLabel(bucketDate, trendBucket);
      const slot = timeline.get(label);

      if (!slot) {
        return;
      }

      slot.total += 1;

      if (item.result === 'allowed') {
        slot.allowed += 1;
        return;
      }

      slot.blocked += 1;
      if (item.rule === 'whitelist') {
        slot.whitelistBlocked += 1;
        return;
      }

      slot.blacklistBlocked += 1;
    });

    const points = Array.from(timeline.values());
    const manualThreshold = Number(threshold);
    const thresholdCandidate = Number.isFinite(manualThreshold) && manualThreshold > 0 ? manualThreshold : settings.threshold;
    const alertThreshold = this.resolveAlertThreshold(
      thresholdCandidate,
      points.map((item) => item.blocked)
    );
    const alerts = points.filter((item) => item.blocked >= alertThreshold);
    const maxBlocked = points.reduce((max, item) => Math.max(max, item.blocked), 0);
    const notification = await this.emitIpAlertIfNeeded({
      alerts,
      alertThreshold,
      maxBlocked,
      hours: safeHours,
      bucket: trendBucket,
      settings
    });

    return {
      hours: safeHours,
      bucket: trendBucket,
      since: start.toISOString(),
      alertThreshold,
      maxBlocked,
      alertCount: alerts.length,
      points,
      alerts,
      notification
    };
  }

  async exportIpProtection(hours = 24, format = 'csv') {
    const safeHours = this.resolveHours(hours);
    const normalizedFormat = String(format || 'csv')
      .trim()
      .toLowerCase();
    const since = new Date(Date.now() - safeHours * 3600 * 1000);

    const rows = await prisma.ipAccessLog.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 5000,
      select: {
        createdAt: true,
        ip: true,
        method: true,
        path: true,
        statusCode: true,
        result: true,
        rule: true,
        reason: true,
        userId: true
      }
    });

    const payloadRows = rows.map((item) => ({
      createdAt: item.createdAt.toISOString(),
      ip: normalizeIp(item.ip),
      method: item.method,
      path: item.path,
      statusCode: item.statusCode,
      result: item.result,
      rule: item.rule,
      reason: item.reason ?? '',
      userId: item.userId ?? ''
    }));

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');

    if (normalizedFormat === 'json') {
      return {
        filename: `ip-protection-${safeHours}h-${stamp}.json`,
        mimeType: 'application/json; charset=utf-8',
        content: JSON.stringify(
          {
            hours: safeHours,
            since: since.toISOString(),
            total: payloadRows.length,
            rows: payloadRows
          },
          null,
          2
        )
      };
    }

    const headers = ['createdAt', 'ip', 'method', 'path', 'statusCode', 'result', 'rule', 'reason', 'userId'];
    const lines = [
      headers.join(','),
      ...payloadRows.map((row) =>
        headers
          .map((header) => escapeCsvCell(row[header as keyof typeof row]))
          .join(',')
      )
    ];

    return {
      filename: `ip-protection-${safeHours}h-${stamp}.csv`,
      mimeType: 'text/csv; charset=utf-8',
      content: lines.join('\n')
    };
  }

  async export(payload: Record<string, unknown>) {
    return {
      taskId: `export_${Date.now()}`,
      format: payload.format ?? 'csv',
      status: 'queued'
    };
  }
}

export const analyticsService = new AnalyticsService();

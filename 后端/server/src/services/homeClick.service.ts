import { Prisma } from '@prisma/client';
import prisma from '../config/database';

const HOME_CLICK_MODULE_LABEL_MAP = {
  hero_forum: '头图-进入论坛',
  hero_topic: '头图-查看专题',
  hot_posts: '热门帖子',
  latest_qa: '最新问答',
  hot_snippets: '热门组件',
  hot_tags: '热门标签',
  sidebar_ranking: '侧栏-活跃排行',
  sidebar_tags: '侧栏-热门标签',
  detail_view: '详情浏览',
  detail_interaction: '详情互动'
} as const;

type HomeClickModule = keyof typeof HOME_CLICK_MODULE_LABEL_MAP;

const HOME_ENTRY_MODULE_SET = new Set<HomeClickModule>([
  'hero_forum',
  'hero_topic',
  'hot_posts',
  'latest_qa',
  'hot_snippets',
  'hot_tags',
  'sidebar_ranking',
  'sidebar_tags'
]);

interface TrackHomeClickInput {
  module: string;
  targetType?: string;
  targetId?: string;
  targetTitle?: string;
  action?: string;
  ip?: string | null;
  userAgent?: string | null;
  userId?: string;
  role?: string;
  requestId?: string | null;
}

const normalizeIp = (value: string | null | undefined): string | null => {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return null;
  }

  if (raw === '::1') {
    return '127.0.0.1';
  }

  return raw.startsWith('::ffff:') ? raw.slice(7) : raw;
};

const normalizeText = (value: unknown, maxLength: number): string | undefined => {
  const text = String(value ?? '').trim();
  if (!text) {
    return undefined;
  }

  return text.slice(0, maxLength);
};

const parseBodyPayload = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
};

const parseModuleFromPath = (path: string): string => {
  const raw = String(path ?? '').trim();
  const prefix = '/home/click/';
  if (!raw.startsWith(prefix)) {
    return '';
  }

  return raw.slice(prefix.length).trim();
};

export class HomeClickService {
  isValidModule(value: string): value is HomeClickModule {
    return Object.prototype.hasOwnProperty.call(HOME_CLICK_MODULE_LABEL_MAP, value);
  }

  async track(input: TrackHomeClickInput) {
    const moduleKey = String(input.module ?? '').trim() as HomeClickModule;
    if (!this.isValidModule(moduleKey)) {
      return null;
    }

    const targetType = normalizeText(input.targetType, 64);
    const targetId = normalizeText(input.targetId, 128);
    const targetTitle = normalizeText(input.targetTitle, 200);

    const bodyPayload: Prisma.InputJsonValue = {
      source: 'home',
      module: moduleKey,
      ...(targetType ? { targetType } : {}),
      ...(targetId ? { targetId } : {}),
      ...(targetTitle ? { targetTitle } : {}),
      ...(normalizeText(input.action, 64) ? { action: normalizeText(input.action, 64) } : {})
    };

    await prisma.adminOperationLog.create({
      data: {
        method: 'CLICK',
        path: `/home/click/${moduleKey}`,
        ip: normalizeIp(input.ip) ?? undefined,
        userAgent: normalizeText(input.userAgent, 512),
        userId: normalizeText(input.userId, 64),
        role: normalizeText(input.role, 32),
        statusCode: 200,
        durationMs: 0,
        requestId: normalizeText(input.requestId, 128),
        body: bodyPayload
      }
    });

    return {
      module: moduleKey,
      moduleName: HOME_CLICK_MODULE_LABEL_MAP[moduleKey]
    };
  }

  async stats(days = 7) {
    const safeDays = Math.min(Math.max(Math.floor(Number(days) || 7), 1), 30);
    const since = new Date(Date.now() - safeDays * 24 * 3600 * 1000);

    const logs = await prisma.adminOperationLog.findMany({
      where: {
        createdAt: { gte: since },
        path: { startsWith: '/home/click/' }
      },
      select: {
        path: true,
        body: true,
        userId: true,
        ip: true,
        createdAt: true
      }
    });

    const moduleCounter = new Map<HomeClickModule, number>(
      (Object.keys(HOME_CLICK_MODULE_LABEL_MAP) as HomeClickModule[]).map((key) => [key, 0])
    );
    const trendCounter = new Map<string, number>();
    const targetCounter = new Map<
      string,
      {
        key: string;
        targetType: string;
        targetId: string;
        targetTitle: string;
        count: number;
      }
    >();
    const activeUserSet = new Set<string>();

    const resolveActorKey = (item: { userId: string | null; ip: string | null }): string => {
      if (item.userId) {
        return `user:${item.userId}`;
      }

      const ip = normalizeIp(item.ip);
      if (ip) {
        return `ip:${ip}`;
      }

      return '';
    };

    const entryActors = new Set<string>();
    const detailActors = new Set<string>();
    const interactionActors = new Set<string>();

    const stageByTargetType = new Map<
      string,
      {
        targetType: string;
        clicked: number;
        viewed: number;
        interacted: number;
      }
    >();

    logs.forEach((item) => {
      const body = parseBodyPayload(item.body);
      const bodyModule = String(body.module ?? '').trim();
      const pathModule = parseModuleFromPath(item.path);
      const moduleKey = (bodyModule || pathModule) as HomeClickModule;
      if (!this.isValidModule(moduleKey)) {
        return;
      }

      moduleCounter.set(moduleKey, (moduleCounter.get(moduleKey) ?? 0) + 1);

      if (item.userId) {
        activeUserSet.add(item.userId);
      }

      const dayKey = item.createdAt.toISOString().slice(0, 10);
      trendCounter.set(dayKey, (trendCounter.get(dayKey) ?? 0) + 1);

      const targetType = String(body.targetType ?? '').trim();
      const targetId = String(body.targetId ?? '').trim();
      const targetTitle = String(body.targetTitle ?? '').trim();
      const actorKey = resolveActorKey({ userId: item.userId, ip: item.ip });

      if (HOME_ENTRY_MODULE_SET.has(moduleKey)) {
        if (actorKey) {
          entryActors.add(actorKey);
        }
        if (targetType) {
          const current = stageByTargetType.get(targetType) ?? {
            targetType,
            clicked: 0,
            viewed: 0,
            interacted: 0
          };
          current.clicked += 1;
          stageByTargetType.set(targetType, current);
        }
      } else if (moduleKey === 'detail_view') {
        if (actorKey) {
          detailActors.add(actorKey);
        }
        if (targetType) {
          const current = stageByTargetType.get(targetType) ?? {
            targetType,
            clicked: 0,
            viewed: 0,
            interacted: 0
          };
          current.viewed += 1;
          stageByTargetType.set(targetType, current);
        }
      } else if (moduleKey === 'detail_interaction') {
        if (actorKey) {
          interactionActors.add(actorKey);
        }
        if (targetType) {
          const current = stageByTargetType.get(targetType) ?? {
            targetType,
            clicked: 0,
            viewed: 0,
            interacted: 0
          };
          current.interacted += 1;
          stageByTargetType.set(targetType, current);
        }
      }

      const uniqueKey = `${targetType}::${targetId}::${targetTitle}`;
      if (!uniqueKey.replace(/[:]/g, '').trim()) {
        return;
      }

      const current = targetCounter.get(uniqueKey);
      if (current) {
        current.count += 1;
        return;
      }

      targetCounter.set(uniqueKey, {
        key: uniqueKey,
        targetType,
        targetId,
        targetTitle,
        count: 1
      });
    });

    const moduleClicks = Array.from(moduleCounter.entries()).map(([key, count]) => ({
      key,
      name: HOME_CLICK_MODULE_LABEL_MAP[key],
      count
    }));

    const trend = Array.from(trendCounter.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const topTargets = Array.from(targetCounter.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const entryEvents = logs.filter((item) => {
      const body = parseBodyPayload(item.body);
      const bodyModule = String(body.module ?? '').trim();
      const pathModule = parseModuleFromPath(item.path);
      const moduleKey = (bodyModule || pathModule) as HomeClickModule;
      return this.isValidModule(moduleKey) && HOME_ENTRY_MODULE_SET.has(moduleKey);
    }).length;
    const detailViewEvents = logs.filter((item) => {
      const body = parseBodyPayload(item.body);
      const bodyModule = String(body.module ?? '').trim();
      const pathModule = parseModuleFromPath(item.path);
      return bodyModule === 'detail_view' || pathModule === 'detail_view';
    }).length;
    const interactionEvents = logs.filter((item) => {
      const body = parseBodyPayload(item.body);
      const bodyModule = String(body.module ?? '').trim();
      const pathModule = parseModuleFromPath(item.path);
      return bodyModule === 'detail_interaction' || pathModule === 'detail_interaction';
    }).length;

    const targetTypeFunnel = Array.from(stageByTargetType.values())
      .map((item) => ({
        ...item,
        viewRate: item.clicked > 0 ? Number(((item.viewed / item.clicked) * 100).toFixed(2)) : 0,
        interactionRate: item.viewed > 0 ? Number(((item.interacted / item.viewed) * 100).toFixed(2)) : 0
      }))
      .sort((a, b) => b.clicked - a.clicked);

    return {
      days: safeDays,
      since: since.toISOString(),
      totalClicks: logs.length,
      uniqueUsers: activeUserSet.size,
      moduleClicks,
      trend,
      topTargets,
      funnel: {
        entryEvents,
        detailViewEvents,
        interactionEvents,
        entryActors: entryActors.size,
        detailViewActors: detailActors.size,
        interactionActors: interactionActors.size,
        detailViewRate: entryEvents > 0 ? Number(((detailViewEvents / entryEvents) * 100).toFixed(2)) : 0,
        interactionRate: detailViewEvents > 0 ? Number(((interactionEvents / detailViewEvents) * 100).toFixed(2)) : 0
      },
      targetTypeFunnel
    };
  }
}

export const homeClickService = new HomeClickService();

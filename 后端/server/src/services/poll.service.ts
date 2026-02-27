import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';

const POLL_SETTING_GROUP = 'forum_poll_config';
const POLL_VOTE_RESOURCE = 'forum-poll-votes';
const DEFAULT_POLL_ID = 'forum_top_programming_tools';

const DEFAULT_POLL_TITLE = '目前世界前五编程工具投票';
const DEFAULT_POLL_DESCRIPTION = '每个 IP 仅可投票一次';

const DEFAULT_POLL_OPTIONS = ['Claude Code', 'Codex', 'Cursor', 'Trea', 'GitHub Copilot'];

interface PollOption {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
}

interface PollConfig {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  options: PollOption[];
}

interface PollResultOption extends PollOption {
  voteCount: number;
  votePercent: number;
}

interface PollResult {
  poll: {
    id: string;
    title: string;
    description: string;
    enabled: boolean;
  };
  options: PollResultOption[];
  totalVotes: number;
  hasVoted: boolean;
  votedOptionId?: string;
}

const toObject = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

const normalizeText = (value: unknown): string => String(value ?? '').trim();

const parseBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
  }
  return fallback;
};

const toJsonValue = (value: unknown): Prisma.InputJsonValue => {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
};

const makeOptionId = (label: string, index: number): string => {
  const normalized = label
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized ? `opt_${normalized}` : `opt_${index + 1}`;
};

const normalizeOptions = (input: unknown): PollOption[] => {
  const rows = Array.isArray(input) ? input : [];
  const rawOptions: Array<{ id?: string; label: string; enabled: boolean; order?: number }> = rows
    .map((item) => {
      if (typeof item === 'string') {
        return {
          label: normalizeText(item),
          enabled: true
        };
      }

      const source = toObject(item);
      return {
        id: normalizeText(source.id),
        label: normalizeText(source.label),
        enabled: parseBoolean(source.enabled, true),
        order: Number(source.order ?? 0)
      };
    })
    .filter((item) => item.label);

  const idSet = new Set<string>();
  const normalized = rawOptions.map((item, index) => {
    const baseId = item.id || makeOptionId(item.label, index);
    let nextId = baseId;
    let suffix = 1;
    while (idSet.has(nextId)) {
      nextId = `${baseId}_${suffix}`;
      suffix += 1;
    }
    idSet.add(nextId);

    const rawOrder = typeof item.order === 'number' ? item.order : 0;
    return {
      id: nextId,
      label: item.label,
      enabled: item.enabled,
      order: Number.isFinite(rawOrder) && rawOrder > 0 ? Math.floor(rawOrder) : index + 1
    };
  });

  return normalized.sort((left, right) => left.order - right.order);
};

const buildDefaultConfig = (): PollConfig => ({
  id: DEFAULT_POLL_ID,
  title: DEFAULT_POLL_TITLE,
  description: DEFAULT_POLL_DESCRIPTION,
  enabled: true,
  options: normalizeOptions(DEFAULT_POLL_OPTIONS)
});

const normalizeConfigPayload = (payload: unknown): PollConfig => {
  const source = toObject(payload);
  const fallback = buildDefaultConfig();
  const options = normalizeOptions(source.options);

  return {
    id: normalizeText(source.id) || fallback.id,
    title: normalizeText(source.title) || fallback.title,
    description: normalizeText(source.description) || fallback.description,
    enabled: parseBoolean(source.enabled, true),
    options: options.length > 0 ? options : fallback.options
  };
};

const voteIdPrefix = (pollId: string): string => `${POLL_VOTE_RESOURCE}_${pollId}_`;

const voteRecordId = (pollId: string, ipHash: string): string => `${voteIdPrefix(pollId)}${ipHash}`;

const hashIp = (ip: string): string => {
  return crypto.createHash('sha256').update(ip).digest('hex');
};

const parseOptionIdFromVotePayload = (payload: unknown): string => {
  const source = toObject(payload);
  return normalizeText(source.optionId);
};

class PollService {
  private async getConfigRecord() {
    return prisma.systemSetting.findUnique({
      where: { group: POLL_SETTING_GROUP },
      select: { payload: true }
    });
  }

  private async ensureConfig(): Promise<PollConfig> {
    const existing = await this.getConfigRecord();
    if (!existing) {
      const initial = buildDefaultConfig();
      await prisma.systemSetting.create({
        data: {
          group: POLL_SETTING_GROUP,
          payload: toJsonValue(initial)
        }
      });
      return initial;
    }

    const normalized = normalizeConfigPayload(existing.payload);
    return normalized;
  }

  private async listVotesByPoll(pollId: string): Promise<string[]> {
    const rows = await prisma.adminOperationResource.findMany({
      where: {
        resource: POLL_VOTE_RESOURCE,
        id: {
          startsWith: voteIdPrefix(pollId)
        }
      },
      select: {
        payload: true
      }
    });

    return rows.map((item) => parseOptionIdFromVotePayload(item.payload)).filter(Boolean);
  }

  private buildResult(config: PollConfig, votes: string[]): PollResult {
    const enabledOptions = config.options.filter((option) => option.enabled);
    const counter = new Map<string, number>();
    votes.forEach((optionId) => {
      counter.set(optionId, (counter.get(optionId) ?? 0) + 1);
    });

    const totalVotes = enabledOptions.reduce((sum, option) => sum + (counter.get(option.id) ?? 0), 0);

    const options: PollResultOption[] = enabledOptions.map((option) => {
      const voteCount = counter.get(option.id) ?? 0;
      const votePercent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 1000) / 10 : 0;

      return {
        ...option,
        voteCount,
        votePercent
      };
    });

    return {
      poll: {
        id: config.id,
        title: config.title,
        description: config.description,
        enabled: config.enabled
      },
      options,
      totalVotes,
      hasVoted: false
    };
  }

  private async resolveVoteStateByIp(pollId: string, ip: string): Promise<{ hasVoted: boolean; optionId?: string }> {
    if (!ip) {
      return { hasVoted: false };
    }

    const ipHash = hashIp(ip);
    const record = await prisma.adminOperationResource.findUnique({
      where: {
        id: voteRecordId(pollId, ipHash)
      },
      select: {
        payload: true
      }
    });

    if (!record) {
      return { hasVoted: false };
    }

    const optionId = parseOptionIdFromVotePayload(record.payload);
    return {
      hasVoted: true,
      ...(optionId ? { optionId } : {})
    };
  }

  async getPublicPoll(ip?: string): Promise<PollResult> {
    const config = await this.ensureConfig();
    const votes = await this.listVotesByPoll(config.id);
    const result = this.buildResult(config, votes);

    if (!ip) {
      return result;
    }

    const voteState = await this.resolveVoteStateByIp(config.id, ip);
    return {
      ...result,
      hasVoted: voteState.hasVoted,
      ...(voteState.optionId ? { votedOptionId: voteState.optionId } : {})
    };
  }

  async getAdminConfig() {
    const config = await this.ensureConfig();
    const votes = await this.listVotesByPoll(config.id);
    const counter = new Map<string, number>();
    votes.forEach((optionId) => {
      counter.set(optionId, (counter.get(optionId) ?? 0) + 1);
    });

    const options = config.options.map((option) => ({
      ...option,
      voteCount: counter.get(option.id) ?? 0
    }));

    return {
      ...config,
      options,
      totalVotes: options.reduce((sum, item) => sum + item.voteCount, 0)
    };
  }

  async updateConfig(payload: Record<string, unknown>) {
    const existing = await this.ensureConfig();
    const next = normalizeConfigPayload({
      ...payload,
      id: existing.id
    });

    await prisma.systemSetting.upsert({
      where: { group: POLL_SETTING_GROUP },
      update: {
        payload: toJsonValue(next)
      },
      create: {
        group: POLL_SETTING_GROUP,
        payload: toJsonValue(next)
      }
    });

    return this.getAdminConfig();
  }

  async vote(optionId: string, ip: string): Promise<PollResult> {
    const config = await this.ensureConfig();
    if (!config.enabled) {
      throw new AppError('投票暂未开启', {
        statusCode: 400,
        code: 'POLL_DISABLED'
      });
    }

    const normalizedOptionId = normalizeText(optionId);
    if (!normalizedOptionId) {
      throw new AppError('投票选项不能为空', {
        statusCode: 400,
        code: 'BAD_REQUEST'
      });
    }

    const option = config.options.find((item) => item.id === normalizedOptionId && item.enabled);
    if (!option) {
      throw new AppError('投票选项无效', {
        statusCode: 400,
        code: 'BAD_REQUEST'
      });
    }

    const normalizedIp = normalizeText(ip);
    if (!normalizedIp) {
      throw new AppError('无法识别客户端 IP', {
        statusCode: 400,
        code: 'IP_REQUIRED'
      });
    }

    const ipHash = hashIp(normalizedIp);
    const id = voteRecordId(config.id, ipHash);

    try {
      await prisma.adminOperationResource.create({
        data: {
          id,
          resource: POLL_VOTE_RESOURCE,
          payload: {
            pollId: config.id,
            optionId: option.id,
            optionLabel: option.label,
            ipHash
          } as Prisma.InputJsonValue
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('当前 IP 已投票，不能重复投票', {
          statusCode: 409,
          code: 'POLL_ALREADY_VOTED'
        });
      }
      throw error;
    }

    return this.getPublicPoll(normalizedIp);
  }
}

export const pollService = new PollService();

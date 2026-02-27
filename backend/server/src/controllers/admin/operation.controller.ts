import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import prisma from '../../config/database';
import { BackupRestoreType, backupService } from '../../services/backup.service';
import { emailService } from '../../services/email.service';
import { sensitiveWordService } from '../../services/sensitiveWord.service';
import { sendError, sendSuccess } from '../../utils/response';

type ResourceKey =
  | 'sensitive-words'
  | 'announcements'
  | 'banners'
  | 'logs'
  | 'blacklist'
  | 'recommendations'
  | 'email-history'
  | 'backups';

const isBackupRestoreType = (value: string): value is BackupRestoreType => {
  return value === 'pg_dump' || value === 'json_snapshot';
};

const normalizeIp = (value: string | null): string => {
  if (!value) {
    return '-';
  }

  return value.startsWith('::ffff:') ? value.slice(7) : value;
};

type OperationRecord = {
  id: string;
  payload: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
};

const makeId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const toObject = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

const toJsonPayload = (value: Record<string, unknown>): Prisma.InputJsonValue => {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
};

const DEFAULT_SENSITIVE_GROUP = 'custom';
const SENSITIVE_GROUP_SETTING = 'sensitive_word_groups';
const SENSITIVE_WHITELIST_SETTING = 'sensitive_word_whitelist';

const normalizeSensitiveWord = (value: unknown): string => String(value ?? '').trim().toLowerCase();

const normalizeSensitiveGroup = (value: unknown): string => {
  const text = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');
  return text || DEFAULT_SENSITIVE_GROUP;
};

const parseBooleanValue = (value: unknown, fallback = false): boolean => {
  if (value === undefined) {
    return fallback;
  }

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

const parseSensitiveWordsInput = (
  input: Record<string, unknown>
): {
  group: string;
  enabled: boolean;
  words: string[];
} => {
  const wordsFromArray = Array.isArray(input.words)
    ? input.words.map((item) => normalizeSensitiveWord(item)).filter(Boolean)
    : [];
  const wordsFromText =
    input.text !== undefined || input.content !== undefined
      ? String(input.text ?? input.content ?? '')
          .split(/[\n\r,，;；|]/)
          .map((item) => normalizeSensitiveWord(item))
          .filter(Boolean)
      : [];

  return {
    group: normalizeSensitiveGroup(input.group),
    enabled: parseBooleanValue(input.enabled, true),
    words: Array.from(new Set([...wordsFromArray, ...wordsFromText]))
  };
};

const parseSensitiveWhitelistInput = (input: Record<string, unknown>): string[] => {
  const wordsFromArray = Array.isArray(input.words)
    ? input.words.map((item) => normalizeSensitiveWord(item)).filter(Boolean)
    : [];
  const wordsFromText =
    input.text !== undefined || input.content !== undefined
      ? String(input.text ?? input.content ?? '')
          .split(/[\n\r,，;；|]/)
          .map((item) => normalizeSensitiveWord(item))
          .filter(Boolean)
      : [];

  return Array.from(new Set([...wordsFromArray, ...wordsFromText]));
};

const loadSensitiveWordSet = async (): Promise<Set<string>> => {
  const exists = await prisma.adminOperationResource.findMany({
    where: { resource: 'sensitive-words' }
  });

  return new Set(exists.map((item) => normalizeSensitiveWord(toObject(item.payload).word)).filter(Boolean));
};

const loadSensitiveGroupEnabledMap = async (): Promise<Record<string, boolean>> => {
  const row = await prisma.systemSetting.findUnique({
    where: { group: SENSITIVE_GROUP_SETTING },
    select: { payload: true }
  });

  const payload = toObject(row?.payload);
  const enabledMapRaw = toObject(payload.enabledMap);
  const enabledMap: Record<string, boolean> = {};

  Object.entries(enabledMapRaw).forEach(([group, enabled]) => {
    enabledMap[normalizeSensitiveGroup(group)] = parseBooleanValue(enabled);
  });

  return enabledMap;
};

const saveSensitiveGroupEnabledMap = async (enabledMap: Record<string, boolean>) => {
  await prisma.systemSetting.upsert({
    where: { group: SENSITIVE_GROUP_SETTING },
    update: {
      payload: toJsonPayload({ enabledMap })
    },
    create: {
      group: SENSITIVE_GROUP_SETTING,
      payload: toJsonPayload({ enabledMap })
    }
  });
};

const normalizeSensitiveWordEntity = (entity: Record<string, unknown>, groupEnabledMap: Record<string, boolean>) => {
  const group = normalizeSensitiveGroup(entity.group);
  const itemEnabled = parseBooleanValue(entity.enabled, true);
  const groupEnabled = groupEnabledMap[group] !== false;

  return {
    ...entity,
    word: normalizeSensitiveWord(entity.word),
    group,
    enabled: itemEnabled && groupEnabled,
    itemEnabled,
    groupEnabled
  };
};

const normalizeEntity = (record: OperationRecord): Record<string, unknown> => {
  const payload = toObject(record.payload);
  const entity: Record<string, unknown> = {
    id: record.id,
    ...payload
  };

  if (!entity.createdAt) {
    entity.createdAt = record.createdAt.toISOString();
  }

  if (!entity.updatedAt) {
    entity.updatedAt = record.updatedAt.toISOString();
  }

  return entity;
};

const normalizeCreatePayload = (resource: ResourceKey, input: unknown): Record<string, unknown> => {
  const source = toObject(input);
  const payload: Record<string, unknown> = {
    ...source
  };

  delete payload.id;

  if (resource === 'banners') {
    const nextOrder = Number(payload.order ?? 1);
    payload.order = Number.isFinite(nextOrder) ? nextOrder : 1;
  }

  if (resource === 'recommendations') {
    const nextOrder = Number(payload.order ?? 1);
    payload.order = Number.isFinite(nextOrder) ? nextOrder : 1;
  }

  return payload;
};

const normalizeRecommendations = (input: unknown): Array<Record<string, unknown>> => {
  const source = toObject(input);
  const list = Array.isArray(source.items) ? source.items : [];

  return list.map((item, index) => {
    const value = toObject(item);
    const type = String(value.type ?? 'post');
    const orderRaw = Number(value.order ?? index + 1);

    return {
      targetId: String(value.targetId ?? value.id ?? ''),
      type,
      title: String(value.title ?? '-'),
      order: Number.isFinite(orderRaw) ? orderRaw : index + 1
    };
  });
};

const listResource = async (resource: ResourceKey): Promise<Record<string, unknown>[]> => {
  const rows = await prisma.adminOperationResource.findMany({
    where: { resource }
  });

  const data = rows.map((record) =>
    normalizeEntity({
      id: record.id,
      payload: record.payload,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    })
  );

  if (resource === 'banners' || resource === 'recommendations') {
    return data.sort((left, right) => Number(left.order ?? 0) - Number(right.order ?? 0));
  }

  return data.sort(
    (left, right) => new Date(String(right.createdAt ?? 0)).getTime() - new Date(String(left.createdAt ?? 0)).getTime()
  );
};

export const adminOperationController = {
  async list(resource: ResourceKey, req: Request, res: Response) {
    const data = await listResource(resource);
    if (resource === 'sensitive-words') {
      const keyword = normalizeSensitiveWord(req.query.keyword);
      const group = req.query.group ? normalizeSensitiveGroup(req.query.group) : '';
      const enabledFilter = req.query.enabled === undefined ? undefined : parseBooleanValue(req.query.enabled);
      const groupEnabledMap = await loadSensitiveGroupEnabledMap();

      const normalized = data.map((item) => normalizeSensitiveWordEntity(item, groupEnabledMap));
      const filtered = normalized.filter((item) => {
        if (!item.word) return false;
        if (keyword && !String(item.word).includes(keyword)) return false;
        if (group && String(item.group) !== group) return false;
        if (enabledFilter !== undefined && Boolean(item.enabled) !== enabledFilter) return false;
        return true;
      });
      return sendSuccess(res, filtered, `获取${resource}列表成功`);
    }

    return sendSuccess(res, data, `获取${resource}列表成功`);
  },

  async create(resource: ResourceKey, req: Request, res: Response) {
    const payload = normalizeCreatePayload(resource, req.body);

    if (resource === 'sensitive-words') {
      const normalizedWord = normalizeSensitiveWord(payload.word);
      if (!normalizedWord) {
        return sendError(res, 'BAD_REQUEST', '敏感词不能为空', 400);
      }

      const existsSet = await loadSensitiveWordSet();
      if (existsSet.has(normalizedWord)) {
        return sendError(res, 'SENSITIVE_WORD_EXISTS', '敏感词已存在', 409);
      }

      payload.word = normalizedWord;
      payload.group = normalizeSensitiveGroup(payload.group);
      payload.enabled = parseBooleanValue(payload.enabled, true);
    }

    const created = await prisma.adminOperationResource.create({
      data: {
        resource,
        payload: toJsonPayload(payload)
      }
    });

    const data = normalizeEntity({
      id: created.id,
      payload: created.payload,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt
    });

    if (resource === 'sensitive-words') {
      await sensitiveWordService.reload();
    }

    return sendSuccess(res, data, `创建${resource}成功`, 201);
  },

  async update(resource: ResourceKey, req: Request, res: Response) {
    const target = await prisma.adminOperationResource.findUnique({
      where: { id: req.params.id }
    });

    if (!target || target.resource !== resource) {
      return sendError(res, 'NOT_FOUND', `未找到${resource}`, 404);
    }

    const current = toObject(target.payload);
    const patch = normalizeCreatePayload(resource, req.body);
    const merged = {
      ...current,
      ...patch
    };

    if (resource === 'sensitive-words') {
      const normalizedWord = normalizeSensitiveWord(merged.word);
      if (!normalizedWord) {
        return sendError(res, 'BAD_REQUEST', '敏感词不能为空', 400);
      }

      const exists = await prisma.adminOperationResource.findMany({
        where: { resource: 'sensitive-words' },
        select: { id: true, payload: true }
      });
      const duplicated = exists.find((item) => {
        if (item.id === target.id) {
          return false;
        }
        return normalizeSensitiveWord(toObject(item.payload).word) === normalizedWord;
      });
      if (duplicated) {
        return sendError(res, 'SENSITIVE_WORD_EXISTS', '敏感词已存在', 409);
      }

      merged.word = normalizedWord;
      merged.group = normalizeSensitiveGroup(merged.group);
      merged.enabled = parseBooleanValue(merged.enabled, true);
    }

    const updated = await prisma.adminOperationResource.update({
      where: { id: target.id },
      data: {
        payload: toJsonPayload(merged)
      }
    });

    const data = normalizeEntity({
      id: updated.id,
      payload: updated.payload,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    });

    if (resource === 'sensitive-words') {
      await sensitiveWordService.reload();
    }

    return sendSuccess(res, data, `更新${resource}成功`);
  },

  async remove(resource: ResourceKey, req: Request, res: Response) {
    const result = await prisma.adminOperationResource.deleteMany({
      where: {
        id: req.params.id,
        resource
      }
    });

    if (result.count === 0) {
      return sendError(res, 'NOT_FOUND', `未找到${resource}`, 404);
    }

    if (resource === 'sensitive-words') {
      await sensitiveWordService.reload();
    }

    return sendSuccess(res, { id: req.params.id }, `删除${resource}成功`);
  },

  async sortBanners(req: Request, res: Response) {
    const payload = req.body as { items?: Array<{ id?: string; order?: number }>; orderMap?: Record<string, number> };
    const items = Array.isArray(payload?.items) ? payload.items : [];
    const orderMap = toObject(payload?.orderMap);

    const banners = await prisma.adminOperationResource.findMany({
      where: { resource: 'banners' }
    });
    const bannerMap = new Map(banners.map((item) => [item.id, item]));
    const updates: Prisma.PrismaPromise<unknown>[] = [];

    items.forEach((item, index) => {
      const id = String(item.id ?? '').trim();
      const target = bannerMap.get(id);
      if (!target) {
        return;
      }

      const current = toObject(target.payload);
      const nextOrder = Number(item.order ?? index + 1);
      current.order = Number.isFinite(nextOrder) ? nextOrder : index + 1;

      updates.push(
        prisma.adminOperationResource.update({
          where: { id },
          data: { payload: toJsonPayload(current) }
        })
      );
    });

    Object.entries(orderMap).forEach(([id, order]) => {
      const target = bannerMap.get(id);
      if (!target) {
        return;
      }

      const current = toObject(target.payload);
      const nextOrder = Number(order);
      current.order = Number.isFinite(nextOrder) ? nextOrder : Number(current.order ?? 0);

      updates.push(
        prisma.adminOperationResource.update({
          where: { id },
          data: { payload: toJsonPayload(current) }
        })
      );
    });

    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }

    const data = await listResource('banners');
    return sendSuccess(res, data, 'Banner 排序更新成功');
  },

  async recommendations(_req: Request, res: Response) {
    const data = await listResource('recommendations');
    return sendSuccess(res, data, '获取推荐位成功');
  },

  async updateRecommendations(req: Request, res: Response) {
    const normalized = normalizeRecommendations(req.body);

    await prisma.$transaction([
      prisma.adminOperationResource.deleteMany({ where: { resource: 'recommendations' } }),
      ...normalized.map((item) =>
        prisma.adminOperationResource.create({
          data: {
            resource: 'recommendations',
            payload: toJsonPayload(item)
          }
        })
      )
    ]);

    const data = await listResource('recommendations');
    return sendSuccess(res, data, '更新推荐位成功');
  },

  async sendEmail(req: Request, res: Response) {
    const payload = toObject(req.body);
    const preview = Boolean(payload.preview);

    const record = {
      batchId: makeId(preview ? 'preview' : 'broadcast'),
      segment: String(payload.segment ?? 'all'),
      to: String(payload.to ?? ''),
      subject: String(payload.subject ?? ''),
      content: String(payload.content ?? ''),
      status: preview ? 'previewed' : 'queued',
      totalRecipients: preview ? 1 : Number(payload.totalRecipients ?? 0)
    };

    if (preview) {
      await emailService.sendCustomEmail({
        to: record.to,
        subject: record.subject,
        content: record.content
      });
    }

    const created = await prisma.adminOperationResource.create({
      data: {
        resource: 'email-history',
        payload: toJsonPayload(record)
      }
    });

    return sendSuccess(
      res,
      {
        id: created.id,
        batchId: record.batchId,
        status: record.status,
        preview
      },
      preview ? '预览邮件发送成功' : '群发任务已创建'
    );
  },

  async emailHistory(req: Request, res: Response) {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit ?? 20), 1), 100);
    const segment = String(req.query.segment ?? '').trim();

    const rows = await prisma.adminOperationResource.findMany({
      where: { resource: 'email-history' },
      orderBy: { createdAt: 'desc' }
    });

    const records = rows.map((row) =>
      normalizeEntity({
        id: row.id,
        payload: row.payload,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      })
    );

    const filtered = records.filter((item) => {
      if (!segment) {
        return true;
      }
      return String(item.segment ?? '') === segment;
    });

    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return sendSuccess(res, data, '获取邮件发送记录成功');
  },

  async createBackup(_req: Request, res: Response) {
    const backup = await backupService.createBackup();
    const created = await prisma.adminOperationResource.create({
      data: {
        resource: 'backups',
        payload: toJsonPayload(backup)
      }
    });

    const data = normalizeEntity({
      id: created.id,
      payload: created.payload,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt
    });

    return sendSuccess(
      res,
      {
        ...data,
        downloadUrl: `/api/v1/admin/backup/${created.id}/file`
      },
      '备份任务已创建',
      201
    );
  },

  async backupList(_req: Request, res: Response) {
    const rows = await prisma.adminOperationResource.findMany({
      where: { resource: 'backups' },
      orderBy: { createdAt: 'desc' }
    });

    const data = rows.map((row) => {
      const item = normalizeEntity({
        id: row.id,
        payload: row.payload,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      });

      return {
        ...item,
        downloadUrl: `/api/v1/admin/backup/${row.id}/file`
      };
    });

    return sendSuccess(res, data, '获取备份列表成功');
  },

  async downloadBackup(req: Request, res: Response) {
    const backup = await prisma.adminOperationResource.findFirst({
      where: {
        id: req.params.id,
        resource: 'backups'
      }
    });

    if (!backup) {
      return sendError(res, 'NOT_FOUND', '备份文件不存在', 404);
    }

    const data = normalizeEntity({
      id: backup.id,
      payload: backup.payload,
      createdAt: backup.createdAt,
      updatedAt: backup.updatedAt
    });

    const storageKey = String(data.storageKey ?? '').trim();
    if (!storageKey) {
      return sendError(res, 'BACKUP_FILE_NOT_FOUND', '备份文件不存在', 404);
    }

    await backupService.resolveBackupFilePath(storageKey);

    return sendSuccess(
      res,
      {
        ...data,
        url: `/api/v1/admin/backup/${backup.id}/file`,
        downloadedAt: new Date().toISOString()
      },
      '获取备份下载链接成功'
    );
  },

  async downloadBackupFile(req: Request, res: Response) {
    const backup = await prisma.adminOperationResource.findFirst({
      where: {
        id: req.params.id,
        resource: 'backups'
      }
    });

    if (!backup) {
      return sendError(res, 'NOT_FOUND', '备份文件不存在', 404);
    }

    const data = normalizeEntity({
      id: backup.id,
      payload: backup.payload,
      createdAt: backup.createdAt,
      updatedAt: backup.updatedAt
    });
    const storageKey = String(data.storageKey ?? '').trim();
    if (!storageKey) {
      return sendError(res, 'BACKUP_FILE_NOT_FOUND', '备份文件不存在', 404);
    }

    const filePath = await backupService.resolveBackupFilePath(storageKey);
    const fileName = String(data.name ?? `${backup.id}.gz`);
    return res.download(filePath, fileName);
  },

  async updateBackupSchedule(req: Request, res: Response) {
    const payload = toObject(req.body);
    const intervalHours = Number(payload.intervalHours ?? 24);

    const schedule = {
      enabled: payload.enabled !== false,
      intervalHours: Number.isFinite(intervalHours) && intervalHours > 0 ? Math.floor(intervalHours) : 24,
      updatedAt: new Date().toISOString()
    };

    await prisma.systemSetting.upsert({
      where: { group: 'backup_schedule' },
      update: {
        payload: toJsonPayload(schedule)
      },
      create: {
        group: 'backup_schedule',
        payload: toJsonPayload(schedule)
      }
    });

    return sendSuccess(res, schedule, '备份计划更新成功');
  },

  async restoreBackup(req: Request, res: Response) {
    const backup = await prisma.adminOperationResource.findFirst({
      where: {
        id: req.params.id,
        resource: 'backups'
      }
    });

    if (!backup) {
      return sendError(res, 'NOT_FOUND', '备份文件不存在', 404);
    }

    const data = normalizeEntity({
      id: backup.id,
      payload: backup.payload,
      createdAt: backup.createdAt,
      updatedAt: backup.updatedAt
    });

    const storageKey = String(data.storageKey ?? '').trim();
    if (!storageKey) {
      return sendError(res, 'BACKUP_FILE_NOT_FOUND', '备份文件不存在', 404);
    }

    const backupType = String(data.backupType ?? '').trim();
    if (!isBackupRestoreType(backupType)) {
      return sendError(res, 'BACKUP_TYPE_INVALID', '备份类型不支持恢复', 400);
    }

    const restoreResult = await backupService.restoreBackup({
      backupId: backup.id,
      backupType,
      storageKey
    });

    const currentPayload = toObject(backup.payload);
    currentPayload.lastRestore = {
      mode: restoreResult.mode,
      backupType: restoreResult.backupType,
      restoredAt: restoreResult.restoredAt,
      operatorId: req.user?.id ?? '',
      message: restoreResult.message
    };

    await prisma.adminOperationResource.update({
      where: { id: backup.id },
      data: {
        payload: toJsonPayload(currentPayload)
      }
    });

    const message = restoreResult.mode === 'full_restore' ? '备份恢复成功' : '备份校验完成（当前为校验模式）';
    return sendSuccess(res, restoreResult, message);
  },

  async exportLogs(_req: Request, res: Response) {
    const task = { taskId: makeId('logs_export'), status: 'queued' };
    return sendSuccess(res, task, '导出日志任务已创建');
  },

  async importSensitiveWords(req: Request, res: Response) {
    const payload = toObject(req.body);
    const { words, group, enabled } = parseSensitiveWordsInput(payload);

    if (words.length === 0) {
      return sendSuccess(
        res,
        {
          total: 0,
          created: 0,
          input: 0,
          skipped: 0
        },
        '导入敏感词成功'
      );
    }

    const existsSet = await loadSensitiveWordSet();

    const createList = words.filter((word) => !existsSet.has(word));

    if (createList.length > 0) {
      await prisma.$transaction(
        createList.map((word) =>
          prisma.adminOperationResource.create({
            data: {
              resource: 'sensitive-words',
              payload: toJsonPayload({ word, group, enabled })
            }
          })
        )
      );
    }

    if (createList.length > 0) {
      await sensitiveWordService.reload();
    }

    return sendSuccess(
      res,
      {
        total: createList.length,
        created: createList.length,
        input: words.length,
        skipped: words.length - createList.length,
        group,
        enabled
      },
      '导入敏感词成功'
    );
  },

  async sensitiveWordGroups(_req: Request, res: Response) {
    const [rows, groupEnabledMap] = await Promise.all([
      listResource('sensitive-words'),
      loadSensitiveGroupEnabledMap()
    ]);

    const summaryMap = new Map<
      string,
      {
        group: string;
        enabled: boolean;
        total: number;
        active: number;
      }
    >();

    rows.forEach((item) => {
      const normalized = normalizeSensitiveWordEntity(item, groupEnabledMap);
      const group = String(normalized.group);
      const current = summaryMap.get(group) ?? {
        group,
        enabled: groupEnabledMap[group] !== false,
        total: 0,
        active: 0
      };
      current.total += 1;
      if (Boolean(normalized.enabled)) {
        current.active += 1;
      }
      summaryMap.set(group, current);
    });

    const data = Array.from(summaryMap.values()).sort((left, right) => {
      if (right.total !== left.total) {
        return right.total - left.total;
      }
      return left.group.localeCompare(right.group);
    });

    return sendSuccess(res, data, '获取敏感词分组成功');
  },

  async toggleSensitiveWordGroup(req: Request, res: Response) {
    const group = normalizeSensitiveGroup(req.params.group);
    if (!group) {
      return sendError(res, 'BAD_REQUEST', '分组不能为空', 400);
    }

    const enabled = parseBooleanValue(req.body?.enabled, true);

    const rows = await listResource('sensitive-words');
    const exists = rows.some((item) => normalizeSensitiveGroup(item.group) === group);
    if (!exists) {
      return sendError(res, 'NOT_FOUND', '敏感词分组不存在', 404);
    }

    const enabledMap = await loadSensitiveGroupEnabledMap();
    enabledMap[group] = enabled;
    await saveSensitiveGroupEnabledMap(enabledMap);
    await sensitiveWordService.reload();

    return sendSuccess(
      res,
      {
        group,
        enabled
      },
      enabled ? '敏感词分组已启用' : '敏感词分组已停用'
    );
  },

  async sensitiveWordWhitelist(_req: Request, res: Response) {
    const row = await prisma.systemSetting.findUnique({
      where: { group: SENSITIVE_WHITELIST_SETTING },
      select: { payload: true }
    });
    const payload = toObject(row?.payload);
    const words = Array.isArray(payload.words)
      ? Array.from(new Set(payload.words.map((item) => normalizeSensitiveWord(item)).filter(Boolean)))
      : [];

    return sendSuccess(
      res,
      {
        words,
        total: words.length
      },
      '获取敏感词白名单成功'
    );
  },

  async updateSensitiveWordWhitelist(req: Request, res: Response) {
    const payload = toObject(req.body);
    const words = parseSensitiveWhitelistInput(payload);
    const saved = await sensitiveWordService.saveWhitelist(words);

    return sendSuccess(
      res,
      {
        words: saved,
        total: saved.length
      },
      '更新敏感词白名单成功'
    );
  },

  async recentLogs(_req: Request, res: Response) {
    const records = await prisma.adminOperationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const userIds = Array.from(new Set(records.map((item) => item.userId).filter((item): item is string => Boolean(item))));
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, username: true, nickname: true }
        })
      : [];
    const userMap = new Map(
      users.map((item) => [item.id, String(item.nickname ?? '').trim() || item.username])
    );

    const data = records.map((item) => ({
      id: item.id,
      operator: item.userId ? (userMap.get(item.userId) ?? item.userId) : 'system',
      operatorId: item.userId ?? '',
      action: item.method,
      target: item.path,
      statusCode: item.statusCode,
      durationMs: item.durationMs,
      ip: normalizeIp(item.ip),
      createdAt: item.createdAt.toISOString(),
      time: item.createdAt.toISOString()
    }));

    return sendSuccess(res, data, '获取近期操作日志成功');
  }
};

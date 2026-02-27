import prisma from '../config/database';
import { logger } from '../utils/logger';

const DEFAULT_SENSITIVE_GROUP = 'custom';
const SENSITIVE_GROUP_SETTING = 'sensitive_word_groups';
const SENSITIVE_WHITELIST_SETTING = 'sensitive_word_whitelist';

const toObject = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
};

const normalizeGroup = (value: unknown): string => {
  const text = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');
  return text || DEFAULT_SENSITIVE_GROUP;
};

const normalizeWord = (value: unknown): string => String(value ?? '').trim().toLowerCase();

const parseBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
  }
  return false;
};

class SensitiveWordService {
  private words = new Set<string>();
  private whitelist: string[] = [];

  private async loadGroupEnabledMap(): Promise<Record<string, boolean>> {
    const row = await prisma.systemSetting.findUnique({
      where: { group: SENSITIVE_GROUP_SETTING },
      select: { payload: true }
    });

    const payload = toObject(row?.payload);
    const enabledMap = toObject(payload.enabledMap);
    const result: Record<string, boolean> = {};

    Object.entries(enabledMap).forEach(([group, enabled]) => {
      result[normalizeGroup(group)] = parseBoolean(enabled);
    });

    return result;
  }

  async init() {
    await this.reload();
    logger.info(`敏感词缓存已加载，共 ${this.words.size} 个词`);
  }

  private async loadWhitelist(): Promise<string[]> {
    const row = await prisma.systemSetting.findUnique({
      where: { group: SENSITIVE_WHITELIST_SETTING },
      select: { payload: true }
    });

    const payload = toObject(row?.payload);
    const list = Array.isArray(payload.words) ? payload.words : [];
    const normalized = Array.from(
      new Set(
        list
          .map((item) => normalizeWord(item))
          .filter(Boolean)
      )
    );

    return normalized.sort((left, right) => right.length - left.length);
  }

  async reload() {
    const [records, groupEnabledMap, whitelist] = await Promise.all([
      prisma.adminOperationResource.findMany({
        where: { resource: 'sensitive-words' }
      }),
      this.loadGroupEnabledMap(),
      this.loadWhitelist()
    ]);

    const next = new Set<string>();
    for (const record of records) {
      const payload = toObject(record.payload);
      const word = normalizeWord(payload.word);
      if (!word) {
        continue;
      }

      const group = normalizeGroup(payload.group);
      const itemEnabled = payload.enabled === undefined ? true : parseBoolean(payload.enabled);
      const groupEnabled = groupEnabledMap[group] !== false;

      if (itemEnabled && groupEnabled) {
        next.add(word);
      }
    }

    this.words = next;
    this.whitelist = whitelist;
  }

  check(text: string): { hit: boolean; word?: string } {
    if (this.words.size === 0) {
      return { hit: false };
    }

    let normalized = text.toLowerCase();
    for (const whiteWord of this.whitelist) {
      if (!whiteWord) {
        continue;
      }

      if (normalized.includes(whiteWord)) {
        normalized = normalized.split(whiteWord).join(' ');
      }
    }

    for (const word of this.words) {
      if (normalized.includes(word)) {
        return { hit: true, word };
      }
    }

    return { hit: false };
  }

  checkFields(...fields: (string | undefined | null)[]): { hit: boolean; word?: string } {
    for (const field of fields) {
      if (!field) continue;
      const result = this.check(field);
      if (result.hit) {
        return result;
      }
    }
    return { hit: false };
  }

  async getWhitelist(): Promise<string[]> {
    return [...this.whitelist];
  }

  async saveWhitelist(words: string[]): Promise<string[]> {
    const normalized = Array.from(new Set(words.map((item) => normalizeWord(item)).filter(Boolean))).sort(
      (left, right) => right.length - left.length
    );

    await prisma.systemSetting.upsert({
      where: { group: SENSITIVE_WHITELIST_SETTING },
      update: {
        payload: {
          words: normalized
        }
      },
      create: {
        group: SENSITIVE_WHITELIST_SETTING,
        payload: {
          words: normalized
        }
      }
    });

    await this.reload();
    return normalized;
  }
}

export const sensitiveWordService = new SensitiveWordService();

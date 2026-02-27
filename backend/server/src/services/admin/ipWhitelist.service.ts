import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';

let whitelistedIps = new Set<string>();
let whitelistEnabled = false;

type WhitelistRecord = {
  id: string;
  ip: string;
  reason: string;
  createdBy: string;
  createdAt: string;
};

const normalizeIp = (value: string): string => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized) {
    return '';
  }

  if (normalized === '::1') {
    return '127.0.0.1';
  }

  return normalized.startsWith('::ffff:') ? normalized.slice(7) : normalized;
};

const parseBooleanValue = (value: unknown): boolean => {
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

const toWhitelistRecord = (row: {
  id: string;
  ip: string;
  reason: string | null;
  createdBy: string | null;
  createdAt: Date;
}): WhitelistRecord => {
  return {
    id: row.id,
    ip: normalizeIp(row.ip),
    reason: String(row.reason ?? ''),
    createdBy: String(row.createdBy ?? ''),
    createdAt: row.createdAt.toISOString()
  };
};

const isUniqueConflict = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

async function loadWhitelistedIps() {
  const rows = await prisma.ipWhitelist.findMany({
    select: { ip: true }
  });

  whitelistedIps = new Set(rows.map((item) => normalizeIp(item.ip)).filter(Boolean));
}

async function loadWhitelistEnabled() {
  const row = await prisma.systemSetting.findUnique({
    where: { group: 'security' },
    select: { payload: true }
  });

  const payload =
    row?.payload && typeof row.payload === 'object' && !Array.isArray(row.payload)
      ? (row.payload as Record<string, unknown>)
      : {};

  whitelistEnabled = parseBooleanValue(payload.ipWhitelistEnabled);
}

class IpWhitelistService {
  async init() {
    await Promise.all([loadWhitelistedIps(), loadWhitelistEnabled()]);
  }

  async list() {
    const rows = await prisma.ipWhitelist.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return rows.map((item) => toWhitelistRecord(item));
  }

  async add(ip: string, reason: string | undefined, createdBy: string | undefined) {
    const normalizedIp = normalizeIp(ip);
    if (!normalizedIp) {
      throw new AppError('IP地址不能为空', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    try {
      const created = await prisma.ipWhitelist.create({
        data: {
          ip: normalizedIp,
          reason: String(reason ?? '').trim() || null,
          createdBy: String(createdBy ?? '').trim() || null
        }
      });

      whitelistedIps.add(normalizedIp);
      return toWhitelistRecord(created);
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new AppError('IP已在白名单中', { statusCode: 409, code: 'IP_ALREADY_ALLOWED' });
      }

      throw error;
    }
  }

  async remove(id: string) {
    const current = await prisma.ipWhitelist.findUnique({ where: { id } });
    if (!current) {
      throw new AppError('白名单记录不存在', { statusCode: 404, code: 'NOT_FOUND' });
    }

    await prisma.ipWhitelist.delete({ where: { id } });
    const record = toWhitelistRecord(current);
    whitelistedIps.delete(record.ip);

    return record;
  }

  hasRules(): boolean {
    return whitelistedIps.size > 0;
  }

  setEnabled(enabled: boolean): void {
    whitelistEnabled = Boolean(enabled);
  }

  isEnabled(): boolean {
    return whitelistEnabled;
  }

  shouldEnforce(): boolean {
    return whitelistEnabled && whitelistedIps.size > 0;
  }

  isAllowed(ip: string): boolean {
    return whitelistedIps.has(normalizeIp(ip));
  }
}

export const ipWhitelistService = new IpWhitelistService();

import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';

let blockedIps = new Set<string>();

type BlacklistRecord = {
  id: string;
  ip: string;
  reason: string;
  createdBy: string;
  createdAt: string;
};

const normalizeIp = (value: string): string => {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized.startsWith('::ffff:') ? normalized.slice(7) : normalized;
};

const toBlacklistRecord = (row: {
  id: string;
  ip: string;
  reason: string | null;
  createdBy: string | null;
  createdAt: Date;
}): BlacklistRecord => {
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

async function loadBlockedIps() {
  const rows = await prisma.ipBlacklist.findMany({
    select: { ip: true }
  });

  blockedIps = new Set(rows.map((item) => normalizeIp(item.ip)).filter(Boolean));
}

class IpBlacklistService {
  async init() {
    await loadBlockedIps();
  }

  async list() {
    const rows = await prisma.ipBlacklist.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return rows.map((item) => toBlacklistRecord(item));
  }

  async add(ip: string, reason: string | undefined, createdBy: string | undefined) {
    const normalizedIp = normalizeIp(ip);
    if (!normalizedIp) {
      throw new AppError('IP地址不能为空', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    try {
      const created = await prisma.ipBlacklist.create({
        data: {
          ip: normalizedIp,
          reason: String(reason ?? '').trim() || null,
          createdBy: String(createdBy ?? '').trim() || null
        }
      });

      blockedIps.add(normalizedIp);
      return toBlacklistRecord(created);
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new AppError('IP已在黑名单中', { statusCode: 409, code: 'IP_ALREADY_BLOCKED' });
      }

      throw error;
    }
  }

  async remove(id: string) {
    const current = await prisma.ipBlacklist.findUnique({ where: { id } });
    if (!current) {
      throw new AppError('黑名单记录不存在', { statusCode: 404, code: 'NOT_FOUND' });
    }

    await prisma.ipBlacklist.delete({ where: { id } });
    const record = toBlacklistRecord(current);
    blockedIps.delete(record.ip);

    return record;
  }

  isBlocked(ip: string): boolean {
    return blockedIps.has(normalizeIp(ip));
  }
}

export const ipBlacklistService = new IpBlacklistService();

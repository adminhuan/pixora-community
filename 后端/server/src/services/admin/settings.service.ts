import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../utils/AppError';

class SettingsService {
  async get(group: string) {
    const record = await prisma.systemSetting.findUnique({
      where: { group }
    });

    if (!record) {
      return {};
    }

    if (record.payload && typeof record.payload === 'object' && !Array.isArray(record.payload)) {
      return record.payload as Record<string, unknown>;
    }

    return {};
  }

  async update(group: string, payload: Record<string, unknown>) {
    const current = await this.get(group);
    const next = {
      ...current,
      ...payload
    };

    await prisma.systemSetting.upsert({
      where: { group },
      create: {
        group,
        payload: next as Prisma.InputJsonValue
      },
      update: {
        payload: next as Prisma.InputJsonValue
      }
    });

    return next;
  }

  async testEmail(payload: Record<string, unknown>) {
    return {
      ok: true,
      to: payload.to,
      sentAt: new Date().toISOString()
    };
  }

  async testStorage(payload: Record<string, unknown>) {
    const provider = String(payload.provider ?? 'local');
    const accessKey = String(payload.accessKey ?? '').trim();
    const secretKey = String(payload.secretKey ?? '').trim();

    if (provider !== 'local' && (!accessKey || !secretKey)) {
      throw new AppError('非本地存储需提供 AccessKey 与 SecretKey', {
        statusCode: 400,
        code: 'BAD_REQUEST'
      });
    }

    return {
      ok: true,
      provider,
      cdnUrl: String(payload.cdnUrl ?? ''),
      checkedAt: new Date().toISOString()
    };
  }
}

export const settingsService = new SettingsService();

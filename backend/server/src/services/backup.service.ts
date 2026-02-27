import crypto from 'crypto';
import fsNode from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import zlib from 'zlib';
import prisma from '../config/database';
import { config } from '../config';
import { AppError } from '../utils/AppError';

type BackupResult = {
  name: string;
  size: string;
  sizeBytes: number;
  status: 'ready';
  backupType: 'pg_dump' | 'json_snapshot';
  storageKey: string;
  downloadUrl: string;
};

type BackupRestoreType = 'pg_dump' | 'json_snapshot';

type BackupRestoreResult = {
  backupId: string;
  backupType: BackupRestoreType;
  mode: 'full_restore' | 'validated_only';
  restoredAt: string;
  message: string;
};

type PgTableRow = {
  table_name: string;
};

const formatSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)}MB`;

const nowStamp = () =>
  new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 14);

const RESTORE_LOCK_FILE = '.restore.lock';
const RESTORE_LOCK_MAX_AGE_MS = 30 * 60 * 1000;

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

class BackupService {
  private resolveBackupDir() {
    return path.resolve(process.cwd(), 'storage', 'backups');
  }

  private async ensureBackupDir() {
    const dir = this.resolveBackupDir();
    await fs.mkdir(dir, { recursive: true });
    return dir;
  }

  private async hasPgDump() {
    return new Promise<boolean>((resolve) => {
      const child = spawn('pg_dump', ['--version']);
      child.once('error', () => resolve(false));
      child.once('close', (code) => resolve(code === 0));
    });
  }

  private async hasPsql() {
    return new Promise<boolean>((resolve) => {
      const child = spawn('psql', ['--version']);
      child.once('error', () => resolve(false));
      child.once('close', (code) => resolve(code === 0));
    });
  }

  private async withRestoreLock<T>(task: () => Promise<T>) {
    const dir = await this.ensureBackupDir();
    const lockPath = path.join(dir, RESTORE_LOCK_FILE);

    let staleRetry = false;

    while (true) {
      try {
        const handle = await fs.open(lockPath, 'wx');
        await handle.writeFile(JSON.stringify({ startedAt: new Date().toISOString() }), 'utf8');
        await handle.close();
        break;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code !== 'EEXIST') {
          throw error;
        }

        if (staleRetry) {
          throw new AppError('已有备份恢复任务执行中，请稍后重试', {
            statusCode: 409,
            code: 'BACKUP_RESTORE_CONFLICT'
          });
        }

        try {
          const stat = await fs.stat(lockPath);
          const lockAge = Date.now() - stat.mtimeMs;
          if (lockAge > RESTORE_LOCK_MAX_AGE_MS) {
            await fs.unlink(lockPath);
            staleRetry = true;
            continue;
          }
        } catch (statError) {
          if ((statError as NodeJS.ErrnoException).code === 'ENOENT') {
            staleRetry = true;
            continue;
          }
        }

        throw new AppError('已有备份恢复任务执行中，请稍后重试', {
          statusCode: 409,
          code: 'BACKUP_RESTORE_CONFLICT'
        });
      }
    }

    try {
      return await task();
    } finally {
      try {
        await fs.unlink(lockPath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
    }
  }

  private async createViaPgDump(targetPath: string) {
    return new Promise<void>((resolve, reject) => {
      const child = spawn('pg_dump', ['--no-owner', '--no-privileges', `--dbname=${config.databaseUrl}`], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      const gzip = zlib.createGzip({ level: zlib.constants.Z_BEST_SPEED });
      const out = fsNode.createWriteStream(targetPath);
      let errorMessage = '';

      child.stderr.on('data', (chunk: Buffer) => {
        errorMessage += chunk.toString('utf8');
      });

      child.stdout.pipe(gzip).pipe(out);

      child.on('error', (error) => {
        reject(error);
      });

      out.on('error', (error) => {
        reject(error);
      });

      out.on('finish', () => {
        resolve();
      });

      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(errorMessage.trim() || `pg_dump 失败，退出码 ${code}`));
        }
      });
    });
  }

  private async createViaJsonSnapshot(targetPath: string) {
    const tables = await prisma.$queryRaw<PgTableRow[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    const snapshot: Record<string, unknown> = {
      generatedAt: new Date().toISOString(),
      source: 'postgres-json-snapshot',
      tables: {}
    };

    const tableData: Record<string, unknown[]> = {};

    for (const table of tables) {
      const tableName = String(table.table_name ?? '').trim();
      if (!tableName) {
        continue;
      }

      const rows = await prisma.$queryRawUnsafe<unknown[]>(`SELECT * FROM "${tableName}"`);
      tableData[tableName] = rows;
    }

    snapshot.tables = tableData;
    const raw = Buffer.from(JSON.stringify(snapshot), 'utf8');
    const zipped = zlib.gzipSync(raw, { level: zlib.constants.Z_BEST_SPEED });
    await fs.writeFile(targetPath, zipped);
  }

  private async restoreViaPgDump(sourcePath: string) {
    const psqlAvailable = await this.hasPsql();
    if (!psqlAvailable) {
      throw new AppError('当前环境缺少 psql，无法执行 SQL 备份恢复', {
        statusCode: 400,
        code: 'BACKUP_RESTORE_TOOL_MISSING'
      });
    }

    await new Promise<void>((resolve, reject) => {
      const child = spawn('psql', ['--set', 'ON_ERROR_STOP=1', `--dbname=${config.databaseUrl}`], {
        stdio: ['pipe', 'ignore', 'pipe']
      });

      const input = fsNode.createReadStream(sourcePath);
      const unzip = zlib.createGunzip();
      let errorMessage = '';
      let settled = false;

      const done = (error?: Error) => {
        if (settled) {
          return;
        }
        settled = true;

        if (error) {
          reject(error);
          return;
        }

        resolve();
      };

      child.stderr.on('data', (chunk: Buffer) => {
        errorMessage += chunk.toString('utf8');
      });

      child.once('error', (error) => done(error));
      input.once('error', (error) => done(error));
      unzip.once('error', (error) => done(error));
      child.stdin.once('error', (error) => done(error));

      child.once('close', (code) => {
        if (code !== 0) {
          done(new Error(errorMessage.trim() || `psql 恢复失败，退出码 ${code}`));
          return;
        }
        done();
      });

      input.pipe(unzip).pipe(child.stdin);
    });
  }

  private async validateJsonSnapshot(sourcePath: string) {
    const zipped = await fs.readFile(sourcePath);
    let raw: Buffer;
    try {
      raw = zlib.gunzipSync(zipped);
    } catch {
      throw new AppError('备份文件格式错误，无法解压', {
        statusCode: 400,
        code: 'BACKUP_FILE_INVALID'
      });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(raw.toString('utf8'));
    } catch {
      throw new AppError('备份文件内容非法，无法解析', {
        statusCode: 400,
        code: 'BACKUP_FILE_INVALID'
      });
    }

    if (!isObjectRecord(payload) || !isObjectRecord(payload.tables)) {
      throw new AppError('备份文件缺少 tables 节点', {
        statusCode: 400,
        code: 'BACKUP_FILE_INVALID'
      });
    }

    const entries = Object.entries(payload.tables);
    let totalRows = 0;

    entries.forEach(([tableName, rows]) => {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
        throw new AppError('备份文件包含非法表名', {
          statusCode: 400,
          code: 'BACKUP_FILE_INVALID'
        });
      }

      if (!Array.isArray(rows)) {
        throw new AppError('备份文件表数据格式不合法', {
          statusCode: 400,
          code: 'BACKUP_FILE_INVALID'
        });
      }

      totalRows += rows.length;
    });

    return {
      tableCount: entries.length,
      rowCount: totalRows
    };
  }

  async createBackup(): Promise<BackupResult> {
    const dir = await this.ensureBackupDir();
    const stamp = nowStamp();
    const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 16);

    const pgDumpAvailable = await this.hasPgDump();
    const extension = pgDumpAvailable ? 'sql.gz' : 'json.gz';
    const fileName = `backup_${stamp}_${suffix}.${extension}`;
    const targetPath = path.join(dir, fileName);

    try {
      if (pgDumpAvailable) {
        await this.createViaPgDump(targetPath);
      } else {
        await this.createViaJsonSnapshot(targetPath);
      }
    } catch (error) {
      throw new AppError('创建数据库备份失败', {
        statusCode: 500,
        code: 'BACKUP_CREATE_FAILED',
        details: String((error as { message?: unknown })?.message ?? error ?? '')
      });
    }

    const stat = await fs.stat(targetPath);
    const storageKey = `backups/${fileName}`;

    return {
      name: fileName,
      size: formatSize(stat.size),
      sizeBytes: stat.size,
      status: 'ready',
      backupType: pgDumpAvailable ? 'pg_dump' : 'json_snapshot',
      storageKey,
      downloadUrl: ''
    };
  }

  async resolveBackupFilePath(storageKey: string) {
    const safeStorageKey = String(storageKey ?? '').replace(/\\/g, '/').replace(/^\/+/, '');
    if (!safeStorageKey.startsWith('backups/')) {
      throw new AppError('备份文件不存在', { statusCode: 404, code: 'BACKUP_FILE_NOT_FOUND' });
    }

    const relativeStorageKey = safeStorageKey.slice('backups/'.length);
    const roots = [this.resolveBackupDir(), path.resolve(process.cwd(), config.upload.dir, 'backups')];

    for (const root of roots) {
      const candidate = path.resolve(root, relativeStorageKey);
      const relativePath = path.relative(root, candidate);
      if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        continue;
      }

      try {
        await fs.access(candidate);
        return candidate;
      } catch {
        continue;
      }
    }

    throw new AppError('备份文件不存在', { statusCode: 404, code: 'BACKUP_FILE_NOT_FOUND' });
  }

  async restoreBackup(params: {
    backupId: string;
    backupType: BackupRestoreType;
    storageKey: string;
  }): Promise<BackupRestoreResult> {
    const { backupId, backupType, storageKey } = params;
    const filePath = await this.resolveBackupFilePath(storageKey);

    return this.withRestoreLock(async () => {
      if (backupType === 'pg_dump') {
        try {
          await this.restoreViaPgDump(filePath);
        } catch (error) {
          if (error instanceof AppError) {
            throw error;
          }
          throw new AppError('恢复数据库备份失败', {
            statusCode: 500,
            code: 'BACKUP_RESTORE_FAILED',
            details: String((error as { message?: unknown })?.message ?? error ?? '')
          });
        }

        return {
          backupId,
          backupType,
          mode: 'full_restore',
          restoredAt: new Date().toISOString(),
          message: '数据库已通过 SQL 备份恢复'
        };
      }

      const summary = await this.validateJsonSnapshot(filePath);
      return {
        backupId,
        backupType,
        mode: 'validated_only',
        restoredAt: new Date().toISOString(),
        message: `JSON 快照校验通过：${summary.tableCount} 张表，共 ${summary.rowCount} 行，当前为校验模式`
      };
    });
  }
}

export const backupService = new BackupService();
export type { BackupRestoreResult, BackupRestoreType };

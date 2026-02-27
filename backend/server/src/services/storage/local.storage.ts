import fs from 'fs/promises';
import path from 'path';
import { config } from '../../config';

export class LocalStorageService {
  private resolvePath(key: string): string {
    const uploadRoot = path.resolve(process.cwd(), config.upload.dir);
    const fullPath = path.resolve(uploadRoot, key);
    const relative = path.relative(uploadRoot, fullPath);

    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error('Unsafe storage key');
    }

    return fullPath;
  }

  async upload(file: Express.Multer.File, key: string): Promise<string> {
    const fullPath = this.resolvePath(key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, file.buffer);

    const normalizedBaseUrl = config.baseUrl.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl;
    return `${normalizedBaseUrl}/uploads/${key}`;
  }

  async remove(key: string): Promise<void> {
    const fullPath = this.resolvePath(key);
    await fs.unlink(fullPath).catch(() => undefined);
  }
}

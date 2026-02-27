import crypto from 'crypto';
import path from 'path';
import sharp from 'sharp';
import { storageService } from './storage';
import { processImage } from '../utils/imageProcessor';
import { AppError } from '../utils/AppError';

const allowedImageMimes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const allowedFileMimes = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/json',
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.rar',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
]);
const allowedFileExtensions = new Set([
  '.pdf',
  '.txt',
  '.md',
  '.json',
  '.zip',
  '.rar',
  '.7z',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx'
]);
const uploadKeyPattern = /^\d{4}\/\d{2}\/\d{2}\/[a-f0-9]{32}\.(webp|gif|pdf|txt|md|json|zip|rar|7z|doc|docx|xls|xlsx|ppt|pptx)$/i;
const MAX_IMAGE_WIDTH = 8192;
const MAX_IMAGE_HEIGHT = 8192;
const MAX_IMAGE_PIXELS = 40_000_000;
const MAX_IMAGE_FRAMES = 120;
const MAX_BATCH_FILES = 10;
const MAX_BATCH_TOTAL_BYTES = 20 * 1024 * 1024;
const MAX_BATCH_TOTAL_PIXELS = 80_000_000;
const MAX_FILE_BYTES = 20 * 1024 * 1024;

class UploadService {
  private normalizeStorageKey(rawKey: string) {
    const value = String(rawKey ?? '')
      .trim()
      .replaceAll('\\', '/');

    if (!value) {
      throw new AppError('文件标识无效', { statusCode: 400, code: 'INVALID_FILE_ID' });
    }

    if (value.includes('..') || value.startsWith('/')) {
      throw new AppError('文件标识无效', { statusCode: 400, code: 'INVALID_FILE_ID' });
    }

    if (!uploadKeyPattern.test(value)) {
      throw new AppError('文件标识无效', { statusCode: 400, code: 'INVALID_FILE_ID' });
    }

    return value;
  }

  private ensureImage(file: Express.Multer.File) {
    if (!allowedImageMimes.has(file.mimetype)) {
      throw new AppError('不支持的图片格式', { statusCode: 400, code: 'INVALID_FILE_TYPE' });
    }
  }

  private ensureFile(file: Express.Multer.File) {
    const extension = path.extname(String(file.originalname ?? '')).toLowerCase();
    if (!allowedFileExtensions.has(extension)) {
      throw new AppError('不支持的文件类型', { statusCode: 400, code: 'INVALID_FILE_TYPE' });
    }

    if (!allowedFileMimes.has(file.mimetype)) {
      throw new AppError('不支持的文件类型', { statusCode: 400, code: 'INVALID_FILE_TYPE' });
    }

    const size = Number(file.size ?? 0);
    if (!Number.isFinite(size) || size <= 0 || size > MAX_FILE_BYTES) {
      throw new AppError('文件大小超过限制', { statusCode: 400, code: 'FILE_SIZE_EXCEEDED' });
    }
  }

  private async ensureImageMetadata(file: Express.Multer.File) {
    let metadata: sharp.Metadata;
    try {
      metadata = await sharp(file.buffer, { animated: true, limitInputPixels: MAX_IMAGE_PIXELS }).metadata();
    } catch (error) {
      const message = String((error as { message?: unknown })?.message ?? '');
      if (message.toLowerCase().includes('pixel limit')) {
        throw new AppError('图片分辨率过大', { statusCode: 400, code: 'IMAGE_DIMENSION_EXCEEDED' });
      }
      throw new AppError('图片内容无效或已损坏', { statusCode: 400, code: 'INVALID_IMAGE_CONTENT' });
    }

    const width = Number(metadata.width ?? 0);
    const height = Number(metadata.height ?? 0);

    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new AppError('图片内容无效或已损坏', { statusCode: 400, code: 'INVALID_IMAGE_CONTENT' });
    }

    const pixels = width * height;
    if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT || pixels > MAX_IMAGE_PIXELS) {
      throw new AppError('图片分辨率过大', { statusCode: 400, code: 'IMAGE_DIMENSION_EXCEEDED' });
    }

    const frameCount = Number(metadata.pages ?? 1);
    if (Number.isFinite(frameCount) && frameCount > MAX_IMAGE_FRAMES) {
      throw new AppError('图片帧数过多', { statusCode: 400, code: 'IMAGE_FRAME_EXCEEDED' });
    }

    return {
      width,
      height,
      pixels,
      frameCount
    };
  }

  private buildImageKey(originalName: string) {
    const ext = path.extname(originalName).toLowerCase() || '.webp';
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hash = crypto.randomUUID().replace(/-/g, '');
    return `${yyyy}/${mm}/${dd}/${hash}${ext === '.gif' ? '.gif' : '.webp'}`;
  }

  private buildFileKey(originalName: string) {
    const ext = path.extname(originalName).toLowerCase();
    const safeExt = allowedFileExtensions.has(ext) ? ext : '.txt';
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hash = crypto.randomUUID().replace(/-/g, '');
    return `${yyyy}/${mm}/${dd}/${hash}${safeExt}`;
  }

  async uploadImage(file: Express.Multer.File, mode: 'avatar' | 'default' = 'default') {
    this.ensureImage(file);
    await this.ensureImageMetadata(file);

    let processedBuffer: Buffer;
    try {
      processedBuffer =
        mode === 'avatar' ? await processImage(file.buffer, 'avatar') : await processImage(file.buffer, 'default');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('图片内容无效或已损坏', { statusCode: 400, code: 'INVALID_IMAGE_CONTENT' });
    }

    const key = this.buildImageKey(file.originalname);
    const processedFile: Express.Multer.File = {
      ...file,
      buffer: processedBuffer,
      size: processedBuffer.length,
      mimetype: 'image/webp',
      originalname: key
    };
    const url = await storageService.upload(processedFile, key);
    return {
      fileId: key,
      url,
      size: processedBuffer.length
    };
  }

  async uploadImages(files: Express.Multer.File[]) {
    if (files.length > MAX_BATCH_FILES) {
      throw new AppError('单次上传文件过多', { statusCode: 400, code: 'BATCH_FILE_COUNT_EXCEEDED' });
    }

    const totalBytes = files.reduce((sum, file) => sum + Number(file.size ?? 0), 0);
    if (totalBytes > MAX_BATCH_TOTAL_BYTES) {
      throw new AppError('批量上传总大小超限', { statusCode: 400, code: 'BATCH_FILE_SIZE_EXCEEDED' });
    }

    let totalPixels = 0;
    for (const file of files) {
      this.ensureImage(file);
      const metadata = await this.ensureImageMetadata(file);
      totalPixels += metadata.pixels;
      if (totalPixels > MAX_BATCH_TOTAL_PIXELS) {
        throw new AppError('批量图片总分辨率过高', { statusCode: 400, code: 'BATCH_IMAGE_PIXEL_EXCEEDED' });
      }
    }

    const results: Array<{ fileId: string; url: string; size: number }> = [];
    for (const file of files) {
      results.push(await this.uploadImage(file, 'default'));
    }
    return results;
  }

  async uploadFile(file: Express.Multer.File) {
    this.ensureFile(file);
    const key = this.buildFileKey(file.originalname);
    const uploadedFile: Express.Multer.File = {
      ...file,
      originalname: key
    };
    const url = await storageService.upload(uploadedFile, key);
    return {
      fileId: key,
      url,
      size: Number(file.size ?? 0),
      name: path.basename(file.originalname),
      mime: file.mimetype
    };
  }

  async remove(fileId: string) {
    const safeKey = this.normalizeStorageKey(fileId);
    await storageService.remove(safeKey);
    return {
      deleted: true,
      fileId: safeKey
    };
  }
}

export const uploadService = new UploadService();

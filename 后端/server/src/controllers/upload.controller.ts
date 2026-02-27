import { Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { sendSuccess } from '../utils/response';
import { uploadService } from '../services/upload.service';

export const uploadController = {
  async image(req: Request, res: Response) {
    if (!req.file) {
      throw new AppError('缺少上传文件', { statusCode: 400, code: 'FILE_REQUIRED' });
    }
    const result = await uploadService.uploadImage(req.file, 'default');
    return sendSuccess(res, result, '上传图片成功', 201);
  },

  async avatar(req: Request, res: Response) {
    if (!req.file) {
      throw new AppError('缺少上传文件', { statusCode: 400, code: 'FILE_REQUIRED' });
    }
    const result = await uploadService.uploadImage(req.file, 'avatar');
    return sendSuccess(res, result, '上传头像成功', 201);
  },

  async images(req: Request, res: Response) {
    const files = (req.files as Express.Multer.File[]) ?? [];
    if (files.length === 0) {
      throw new AppError('缺少上传文件', { statusCode: 400, code: 'FILE_REQUIRED' });
    }
    const result = await uploadService.uploadImages(files);
    return sendSuccess(res, result, '批量上传成功', 201);
  },

  async file(req: Request, res: Response) {
    if (!req.file) {
      throw new AppError('缺少上传文件', { statusCode: 400, code: 'FILE_REQUIRED' });
    }
    const result = await uploadService.uploadFile(req.file);
    return sendSuccess(res, result, '上传文件成功', 201);
  },

  async remove(req: Request, res: Response) {
    const result = await uploadService.remove(req.params.fileId);
    return sendSuccess(res, result, '删除文件成功');
  }
};

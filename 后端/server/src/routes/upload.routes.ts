import { Router } from 'express';
import multer from 'multer';
import { uploadController } from '../controllers/upload.controller';
import { auth } from '../middleware/auth';
import { uploadRateLimiter } from '../middleware/rateLimiter';

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10
  }
});

const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 1
  }
});

export const uploadRoutes = Router();

uploadRoutes.post('/image', auth, uploadRateLimiter, imageUpload.single('file'), uploadController.image);
uploadRoutes.post('/avatar', auth, uploadRateLimiter, imageUpload.single('file'), uploadController.avatar);
uploadRoutes.post('/images', auth, uploadRateLimiter, imageUpload.array('files', 10), uploadController.images);
uploadRoutes.post('/file', auth, uploadRateLimiter, fileUpload.single('file'), uploadController.file);
uploadRoutes.delete('/:fileId', auth, uploadRateLimiter, uploadController.remove);

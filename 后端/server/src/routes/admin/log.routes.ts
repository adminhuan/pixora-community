import { Router } from 'express';
import { adminLogController } from '../../controllers/admin/log.controller';

export const adminLogRoutes = Router();

adminLogRoutes.get('/logs', adminLogController.list);
adminLogRoutes.post('/logs/export', adminLogController.export);

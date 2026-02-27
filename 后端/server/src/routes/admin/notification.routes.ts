import { Router } from 'express';
import { adminNotificationController } from '../../controllers/admin/notification.controller';

export const adminNotificationRoutes = Router();

adminNotificationRoutes.get('/notifications', adminNotificationController.list);
adminNotificationRoutes.put('/notifications/read-all', adminNotificationController.markAllRead);
adminNotificationRoutes.put('/notifications/:id/read', adminNotificationController.markRead);
adminNotificationRoutes.delete('/notifications/:id', adminNotificationController.remove);


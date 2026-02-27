import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { auth } from '../middleware/auth';

export const notificationRoutes = Router();

notificationRoutes.get('/', auth, notificationController.list);
notificationRoutes.get('/unread-count', auth, notificationController.unreadCount);
notificationRoutes.put('/read-all', auth, notificationController.markAllRead);
notificationRoutes.get('/settings', auth, notificationController.getSettings);
notificationRoutes.put('/settings', auth, notificationController.updateSettings);
notificationRoutes.put('/:id/read', auth, notificationController.markRead);
notificationRoutes.delete('/:id', auth, notificationController.remove);

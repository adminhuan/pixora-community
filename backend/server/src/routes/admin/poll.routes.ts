import { Router } from 'express';
import { adminPollController } from '../../controllers/admin/poll.controller';

export const adminPollRoutes = Router();

adminPollRoutes.get('/poll/config', adminPollController.detail);
adminPollRoutes.put('/poll/config', adminPollController.update);

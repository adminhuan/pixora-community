import { Router } from 'express';
import { adminDashboardController } from '../../controllers/admin/dashboard.controller';

export const adminDashboardRoutes = Router();

adminDashboardRoutes.get('/dashboard/stats', adminDashboardController.stats);
adminDashboardRoutes.get('/dashboard/trends', adminDashboardController.trends);
adminDashboardRoutes.get('/dashboard/activity', adminDashboardController.activity);
adminDashboardRoutes.get('/dashboard/pending', adminDashboardController.pending);

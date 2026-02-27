import { Router } from 'express';
import { adminAnalyticsController } from '../../controllers/admin/analytics.controller';

export const adminAnalyticsRoutes = Router();

adminAnalyticsRoutes.get('/analytics/users', adminAnalyticsController.users);
adminAnalyticsRoutes.get('/analytics/content', adminAnalyticsController.content);
adminAnalyticsRoutes.get('/analytics/interactions', adminAnalyticsController.interactions);
adminAnalyticsRoutes.get('/analytics/traffic', adminAnalyticsController.traffic);
adminAnalyticsRoutes.get('/analytics/retention', adminAnalyticsController.retention);
adminAnalyticsRoutes.get('/analytics/funnel', adminAnalyticsController.funnel);
adminAnalyticsRoutes.get('/analytics/module-traffic', adminAnalyticsController.moduleTraffic);
adminAnalyticsRoutes.get('/analytics/region-traffic', adminAnalyticsController.regionTraffic);
adminAnalyticsRoutes.get('/analytics/private-messages', adminAnalyticsController.privateMessages);
adminAnalyticsRoutes.get('/analytics/home-clicks', adminAnalyticsController.homeClicks);
adminAnalyticsRoutes.get('/analytics/ip-protection', adminAnalyticsController.ipProtection);
adminAnalyticsRoutes.get('/analytics/ip-protection/trend', adminAnalyticsController.ipProtectionTrend);
adminAnalyticsRoutes.get('/analytics/ip-protection/export', adminAnalyticsController.exportIpProtection);
adminAnalyticsRoutes.post('/analytics/export', adminAnalyticsController.export);

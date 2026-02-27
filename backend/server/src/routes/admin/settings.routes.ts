import { Router } from 'express';
import { adminSettingsController } from '../../controllers/admin/settings.controller';

export const adminSettingsRoutes = Router();

adminSettingsRoutes.post('/settings/email/test', adminSettingsController.testEmail);
adminSettingsRoutes.post('/settings/storage/test', adminSettingsController.testStorage);
adminSettingsRoutes.post('/settings/content_moderation/test-ai', adminSettingsController.testAI);
adminSettingsRoutes.get('/settings/:group', adminSettingsController.get);
adminSettingsRoutes.put('/settings/:group', adminSettingsController.update);

import { Router } from 'express';
import { adminOperationController } from '../../controllers/admin/operation.controller';

export const adminOperationRoutes = Router();

adminOperationRoutes.get('/sensitive-words', (req, res) => adminOperationController.list('sensitive-words', req, res));
adminOperationRoutes.post('/sensitive-words', (req, res) =>
  adminOperationController.create('sensitive-words', req, res)
);
adminOperationRoutes.get('/sensitive-words/groups', adminOperationController.sensitiveWordGroups);
adminOperationRoutes.put('/sensitive-words/groups/:group/toggle', adminOperationController.toggleSensitiveWordGroup);
adminOperationRoutes.get('/sensitive-words/whitelist', adminOperationController.sensitiveWordWhitelist);
adminOperationRoutes.put('/sensitive-words/whitelist', adminOperationController.updateSensitiveWordWhitelist);
adminOperationRoutes.delete('/sensitive-words/:id', (req, res) =>
  adminOperationController.remove('sensitive-words', req, res)
);
adminOperationRoutes.post('/sensitive-words/import', adminOperationController.importSensitiveWords);

adminOperationRoutes.get('/announcements', (req, res) => adminOperationController.list('announcements', req, res));
adminOperationRoutes.post('/announcements', (req, res) => adminOperationController.create('announcements', req, res));
adminOperationRoutes.put('/announcements/:id', (req, res) =>
  adminOperationController.update('announcements', req, res)
);
adminOperationRoutes.delete('/announcements/:id', (req, res) =>
  adminOperationController.remove('announcements', req, res)
);

adminOperationRoutes.get('/banners', (req, res) => adminOperationController.list('banners', req, res));
adminOperationRoutes.post('/banners', (req, res) => adminOperationController.create('banners', req, res));
adminOperationRoutes.put('/banners/sort', adminOperationController.sortBanners);
adminOperationRoutes.put('/banners/:id', (req, res) => adminOperationController.update('banners', req, res));
adminOperationRoutes.delete('/banners/:id', (req, res) => adminOperationController.remove('banners', req, res));

adminOperationRoutes.get('/recommendations', adminOperationController.recommendations);
adminOperationRoutes.put('/recommendations', adminOperationController.updateRecommendations);

adminOperationRoutes.post('/email/send', adminOperationController.sendEmail);
adminOperationRoutes.get('/email/history', adminOperationController.emailHistory);

adminOperationRoutes.post('/backup', adminOperationController.createBackup);
adminOperationRoutes.get('/backup/list', adminOperationController.backupList);
adminOperationRoutes.get('/backup/:id/download', adminOperationController.downloadBackup);
adminOperationRoutes.get('/backup/:id/file', adminOperationController.downloadBackupFile);
adminOperationRoutes.post('/backup/:id/restore', adminOperationController.restoreBackup);
adminOperationRoutes.put('/backup/schedule', adminOperationController.updateBackupSchedule);

adminOperationRoutes.get('/blacklist', (req, res) => adminOperationController.list('blacklist', req, res));
adminOperationRoutes.post('/blacklist', (req, res) => adminOperationController.create('blacklist', req, res));
adminOperationRoutes.delete('/blacklist/:id', (req, res) => adminOperationController.remove('blacklist', req, res));

adminOperationRoutes.get('/logs/recent', adminOperationController.recentLogs);

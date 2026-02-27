import { Router } from 'express';
import { adminAuditController } from '../../controllers/admin/audit.controller';

export const adminAuditRoutes = Router();

adminAuditRoutes.get('/audit/queue', adminAuditController.queue);
adminAuditRoutes.post('/audit/:id/approve', adminAuditController.approve);
adminAuditRoutes.post('/audit/:id/reject', adminAuditController.reject);
adminAuditRoutes.post('/audit/batch', adminAuditController.batch);
adminAuditRoutes.get('/audit/history', adminAuditController.history);

// Content moderation pending queue
adminAuditRoutes.get('/audit/pending', adminAuditController.pendingQueue);
adminAuditRoutes.post('/audit/pending/:contentType/:id/approve', adminAuditController.approvePending);
adminAuditRoutes.post('/audit/pending/:contentType/:id/reject', adminAuditController.rejectPending);
adminAuditRoutes.post('/audit/pending/batch', adminAuditController.batchPending);

import { Router } from 'express';
import { adminReportController } from '../../controllers/admin/report.controller';

export const adminReportRoutes = Router();

adminReportRoutes.get('/comments', adminReportController.comments);
adminReportRoutes.delete('/comments/:id', adminReportController.deleteComment);
adminReportRoutes.post('/comments/batch-delete', adminReportController.batchDeleteComments);
adminReportRoutes.get('/reports', adminReportController.reports);
adminReportRoutes.put('/reports/:id/handle', adminReportController.handleReport);
adminReportRoutes.get('/reports/stats', adminReportController.stats);

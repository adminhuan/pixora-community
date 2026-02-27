import { Router } from 'express';
import { tagController } from '../../controllers/tag.controller';

export const adminTagRoutes = Router();

adminTagRoutes.get('/tags', tagController.adminList);
adminTagRoutes.post('/tags', tagController.adminCreate);
adminTagRoutes.put('/tags/:id', tagController.adminUpdate);
adminTagRoutes.delete('/tags/:id', tagController.adminDelete);
adminTagRoutes.post('/tags/merge', tagController.adminMerge);

adminTagRoutes.get('/categories', tagController.categories);
adminTagRoutes.get('/categories/applications', tagController.adminCategoryApplications);
adminTagRoutes.put('/categories/applications/:id/review', tagController.adminReviewCategoryApplication);
adminTagRoutes.put('/categories/sort', tagController.adminSortCategories);
adminTagRoutes.post('/categories', tagController.adminCreateCategory);
adminTagRoutes.put('/categories/:id', tagController.adminUpdateCategory);
adminTagRoutes.delete('/categories/:id', tagController.adminDeleteCategory);

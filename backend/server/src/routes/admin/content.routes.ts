import { Router } from 'express';
import { adminContentController } from '../../controllers/admin/content.controller';

export const adminContentRoutes = Router();

adminContentRoutes.get('/posts', adminContentController.list);
adminContentRoutes.get('/posts/:id', adminContentController.detail);
adminContentRoutes.put('/posts/:id/pin', adminContentController.action);
adminContentRoutes.put('/posts/:id/feature', adminContentController.action);
adminContentRoutes.put('/posts/:id/lock', adminContentController.action);
adminContentRoutes.put('/posts/:id/move', adminContentController.action);
adminContentRoutes.delete('/posts/:id', adminContentController.remove);
adminContentRoutes.post('/posts/:id/restore', adminContentController.restore);

adminContentRoutes.get('/blogs', adminContentController.list);
adminContentRoutes.put('/blogs/:id/recommend', adminContentController.action);
adminContentRoutes.put('/blogs/:id/banner', adminContentController.action);
adminContentRoutes.delete('/blogs/:id', adminContentController.remove);

adminContentRoutes.get('/blog-series', adminContentController.blogSeries);
adminContentRoutes.put('/blog-series/:id', adminContentController.updateBlogSeries);
adminContentRoutes.delete('/blog-series/:id', adminContentController.deleteBlogSeries);

adminContentRoutes.get('/blog-categories', adminContentController.blogCategories);
adminContentRoutes.post('/blog-categories', adminContentController.createBlogCategory);
adminContentRoutes.put('/blog-categories/:id', adminContentController.updateBlogCategory);
adminContentRoutes.delete('/blog-categories/:id', adminContentController.deleteBlogCategory);

adminContentRoutes.get('/projects', adminContentController.list);
adminContentRoutes.put('/projects/:id/recommend', adminContentController.action);
adminContentRoutes.put('/projects/:id/feature', adminContentController.action);
adminContentRoutes.put('/projects/:id/status', adminContentController.updateProjectStatus);
adminContentRoutes.delete('/projects/:id', adminContentController.remove);

adminContentRoutes.get('/project-categories', adminContentController.projectCategories);
adminContentRoutes.post('/project-categories', adminContentController.createProjectCategory);
adminContentRoutes.put('/project-categories/:id', adminContentController.updateProjectCategory);
adminContentRoutes.delete('/project-categories/:id', adminContentController.deleteProjectCategory);

adminContentRoutes.get('/questions', adminContentController.list);
adminContentRoutes.put('/questions/:id/close', adminContentController.action);
adminContentRoutes.put('/questions/:id/duplicate', adminContentController.action);
adminContentRoutes.delete('/questions/:id', adminContentController.remove);

adminContentRoutes.delete('/answers/:id', adminContentController.remove);
adminContentRoutes.put('/answers/:id/accept', adminContentController.action);

adminContentRoutes.get('/bounties', adminContentController.bounties);
adminContentRoutes.post('/bounties/:id/settle', adminContentController.settleBounty);

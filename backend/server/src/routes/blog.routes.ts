import { Router } from 'express';
import { blogController } from '../controllers/blog.controller';
import { auth, optionalAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';
import { createBlogValidator, seriesValidator, updateBlogValidator } from '../validators/blog.validator';

export const blogRoutes = Router();

blogRoutes.get('/', optionalAuth, blogController.list);
blogRoutes.get('/drafts', auth, blogController.draftList);
blogRoutes.post('/drafts', auth, createBlogValidator, validateRequest, blogController.createDraft);
blogRoutes.put('/drafts/:id', auth, updateBlogValidator, validateRequest, blogController.updateDraft);
blogRoutes.delete('/drafts/:id', auth, blogController.deleteDraft);
blogRoutes.post('/drafts/:id/publish', auth, blogController.publishDraft);

blogRoutes.get('/:id', optionalAuth, blogController.detail);
blogRoutes.post('/', auth, createBlogValidator, validateRequest, blogController.create);
blogRoutes.put('/:id', auth, updateBlogValidator, validateRequest, blogController.update);
blogRoutes.delete('/:id', auth, blogController.remove);
blogRoutes.post('/:id/like', auth, blogController.like);
blogRoutes.post('/:id/favorite', auth, blogController.favorite);

blogRoutes.get('/series/list', optionalAuth, blogController.listSeries);
blogRoutes.post('/series', auth, seriesValidator, validateRequest, blogController.createSeries);
blogRoutes.get('/series/:id', optionalAuth, blogController.detailSeries);
blogRoutes.put('/series/:id', auth, blogController.updateSeries);
blogRoutes.delete('/series/:id', auth, blogController.deleteSeries);
blogRoutes.post('/series/:id/follow', auth, blogController.followSeries);
blogRoutes.put('/series/:id/order', auth, blogController.reorderSeries);

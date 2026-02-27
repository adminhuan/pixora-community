import { Router } from 'express';
import { blogController } from '../controllers/blog.controller';
import { auth, optionalAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';
import { seriesValidator } from '../validators/blog.validator';

export const seriesRoutes = Router();

seriesRoutes.get('/', optionalAuth, blogController.listSeries);
seriesRoutes.post('/', auth, seriesValidator, validateRequest, blogController.createSeries);
seriesRoutes.get('/:id', optionalAuth, blogController.detailSeries);
seriesRoutes.put('/:id', auth, blogController.updateSeries);
seriesRoutes.delete('/:id', auth, blogController.deleteSeries);
seriesRoutes.post('/:id/follow', auth, blogController.followSeries);
seriesRoutes.put('/:id/order', auth, blogController.reorderSeries);

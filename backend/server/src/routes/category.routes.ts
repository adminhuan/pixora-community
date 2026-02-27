import { Router } from 'express';
import { tagController } from '../controllers/tag.controller';
import { auth, optionalAuth } from '../middleware/auth';

export const categoryRoutes = Router();

categoryRoutes.get('/', optionalAuth, tagController.categories);
categoryRoutes.post('/apply', auth, tagController.applyCategory);
categoryRoutes.get('/applications/me', auth, tagController.myCategoryApplications);
categoryRoutes.get('/:id/contents', optionalAuth, tagController.categoryContents);

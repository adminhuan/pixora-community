import { Router } from 'express';
import { tagController } from '../controllers/tag.controller';
import { auth, optionalAuth } from '../middleware/auth';

export const tagRoutes = Router();

tagRoutes.get('/', optionalAuth, tagController.list);
tagRoutes.get('/hot', optionalAuth, tagController.hot);
tagRoutes.get('/:id', optionalAuth, tagController.detail);
tagRoutes.get('/:id/contents', optionalAuth, tagController.contents);
tagRoutes.post('/:id/follow', auth, tagController.follow);
tagRoutes.delete('/:id/follow', auth, tagController.unfollow);

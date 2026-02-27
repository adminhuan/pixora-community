import { Router } from 'express';
import { postController } from '../controllers/post.controller';
import { auth, optionalAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';
import { createPostValidator, updatePostValidator } from '../validators/post.validator';

export const postRoutes = Router();

postRoutes.get('/', optionalAuth, postController.list);
postRoutes.get('/:id', optionalAuth, postController.detail);
postRoutes.post('/', auth, createPostValidator, validateRequest, postController.create);
postRoutes.put('/:id', auth, updatePostValidator, validateRequest, postController.update);
postRoutes.delete('/:id', auth, postController.remove);
postRoutes.post('/:id/like', auth, postController.like);
postRoutes.post('/:id/favorite', auth, postController.favorite);
postRoutes.get('/:id/related', optionalAuth, postController.related);

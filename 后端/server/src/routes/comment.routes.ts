import { Router } from 'express';
import { commentController } from '../controllers/comment.controller';
import { auth, optionalAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';
import { createCommentValidator, reportCommentValidator, updateCommentValidator } from '../validators/comment.validator';

export const commentRoutes = Router();

commentRoutes.get('/', optionalAuth, commentController.list);
commentRoutes.post('/', auth, createCommentValidator, validateRequest, commentController.create);
commentRoutes.put('/:id', auth, updateCommentValidator, validateRequest, commentController.update);
commentRoutes.delete('/:id', auth, commentController.remove);
commentRoutes.post('/:id/like', auth, commentController.like);
commentRoutes.get('/:id/replies', optionalAuth, commentController.replies);
commentRoutes.post('/:id/report', auth, reportCommentValidator, validateRequest, commentController.report);
commentRoutes.post('/:id/pin', auth, commentController.pin);

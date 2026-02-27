import { Router } from 'express';
import { questionController } from '../controllers/question.controller';
import { auth, optionalAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';
import {
  answerValidator,
  createQuestionValidator,
  updateQuestionValidator,
  voteValidator
} from '../validators/question.validator';

export const questionRoutes = Router();

questionRoutes.get('/', optionalAuth, questionController.list);
questionRoutes.get('/similar', optionalAuth, questionController.similar);
questionRoutes.get('/:id', optionalAuth, questionController.detail);
questionRoutes.post('/', auth, createQuestionValidator, validateRequest, questionController.create);
questionRoutes.put('/:id', auth, updateQuestionValidator, validateRequest, questionController.update);
questionRoutes.delete('/:id', auth, questionController.remove);
questionRoutes.post('/:id/vote', auth, voteValidator, validateRequest, questionController.vote);
questionRoutes.post('/:id/follow', auth, questionController.follow);
questionRoutes.post('/:id/bounty', auth, questionController.bounty);
questionRoutes.get('/:id/answers', optionalAuth, questionController.answers);
questionRoutes.post('/:id/answers', auth, answerValidator, validateRequest, questionController.createAnswer);

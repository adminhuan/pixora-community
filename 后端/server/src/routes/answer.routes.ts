import { Router } from 'express';
import { answerController } from '../controllers/answer.controller';
import { auth } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';
import { answerValidator, voteValidator } from '../validators/question.validator';

export const answerRoutes = Router();

answerRoutes.put('/:id', auth, answerValidator, validateRequest, answerController.update);
answerRoutes.delete('/:id', auth, answerController.remove);
answerRoutes.post('/:id/vote', auth, voteValidator, validateRequest, answerController.vote);
answerRoutes.post('/:id/accept', auth, answerController.accept);

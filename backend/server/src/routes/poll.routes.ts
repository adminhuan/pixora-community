import { Router } from 'express';
import { pollController } from '../controllers/poll.controller';
import { validateRequest } from '../middleware/validator';
import { votePollValidator } from '../validators/poll.validator';

export const pollRoutes = Router();

pollRoutes.get('/', pollController.detail);
pollRoutes.post('/vote', votePollValidator, validateRequest, pollController.vote);

import { Router } from 'express';
import { rankingController } from '../controllers/ranking.controller';
import { validateRequest } from '../middleware/validator';
import { rankingQueryValidator } from '../validators/ranking.validator';

export const rankingRoutes = Router();

rankingRoutes.get('/', rankingQueryValidator, validateRequest, rankingController.rankings);
rankingRoutes.get('/points/rules', rankingController.rules);
rankingRoutes.get('/achievements', rankingController.achievements);
rankingRoutes.get('/:id/points', rankingController.points);
rankingRoutes.get('/:id/level', rankingController.level);
rankingRoutes.get('/:id/achievements', rankingController.userAchievements);

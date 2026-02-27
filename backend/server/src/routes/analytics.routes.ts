import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { optionalAuth } from '../middleware/auth';

export const analyticsRoutes = Router();

analyticsRoutes.post('/home-click', optionalAuth, analyticsController.trackHomeClick);

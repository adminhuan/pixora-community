import { Router } from 'express';
import { searchController } from '../controllers/search.controller';
import { searchRateLimiter } from '../middleware/rateLimiter';

export const searchRoutes = Router();

searchRoutes.get('/', searchRateLimiter, searchController.search);
searchRoutes.get('/suggestions', searchRateLimiter, searchController.suggestions);
searchRoutes.get('/hot', searchRateLimiter, searchController.hot);

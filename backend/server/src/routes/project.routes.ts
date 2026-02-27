import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { auth, optionalAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';
import { createProjectValidator, updateProjectValidator } from '../validators/project.validator';

export const projectRoutes = Router();

projectRoutes.get('/', optionalAuth, projectController.list);
projectRoutes.get('/:id', optionalAuth, projectController.detail);
projectRoutes.post('/', auth, createProjectValidator, validateRequest, projectController.create);
projectRoutes.put('/:id', auth, updateProjectValidator, validateRequest, projectController.update);
projectRoutes.delete('/:id', auth, projectController.remove);
projectRoutes.post('/:id/like', auth, projectController.like);
projectRoutes.post('/:id/favorite', auth, projectController.favorite);
projectRoutes.post('/:id/rate', auth, projectController.rate);
projectRoutes.get('/:id/ratings', optionalAuth, projectController.ratings);
projectRoutes.get('/:id/related', optionalAuth, projectController.related);

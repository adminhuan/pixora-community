import { Router } from 'express';
import { snippetController } from '../controllers/snippet.controller';
import { auth, optionalAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';
import { createSnippetValidator, updateSnippetValidator } from '../validators/snippet.validator';

export const snippetRoutes = Router();

snippetRoutes.get('/', optionalAuth, snippetController.list);
snippetRoutes.get('/:id', optionalAuth, snippetController.detail);
snippetRoutes.post('/', auth, createSnippetValidator, validateRequest, snippetController.create);
snippetRoutes.put('/:id', auth, updateSnippetValidator, validateRequest, snippetController.update);
snippetRoutes.delete('/:id', auth, snippetController.remove);
snippetRoutes.post('/:id/fork', auth, snippetController.fork);
snippetRoutes.post('/:id/like', auth, snippetController.like);
snippetRoutes.post('/:id/favorite', auth, snippetController.favorite);
snippetRoutes.get('/:id/versions', optionalAuth, snippetController.versions);
snippetRoutes.get('/:id/raw/:file', optionalAuth, snippetController.rawFile);

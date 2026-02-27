import { Router } from 'express';
import { adminSnippetController } from '../../controllers/admin/snippet.controller';

export const adminSnippetRoutes = Router();

adminSnippetRoutes.get('/snippets', adminSnippetController.list);
adminSnippetRoutes.put('/snippets/:id/recommend', adminSnippetController.toggleRecommend);
adminSnippetRoutes.put('/snippets/:id/feature', adminSnippetController.toggleFeature);
adminSnippetRoutes.delete('/snippets/:id', adminSnippetController.remove);

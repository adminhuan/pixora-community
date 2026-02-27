import { Request, Response } from 'express';
import { snippetService } from '../../services/snippet.service';
import { AppError } from '../../utils/AppError';
import { sendPagedSuccess, sendSuccess } from '../../utils/response';

export const adminSnippetController = {
  async list(req: Request, res: Response) {
    const result = await snippetService.list(req.query as Record<string, string>);
    return sendPagedSuccess(res, result.data, result.pagination, '获取组件列表成功');
  },

  async toggleRecommend(req: Request, res: Response) {
    const snippet = await snippetService.toggleRecommended(req.params.id);
    if (!snippet) {
      throw new AppError('组件不存在', { statusCode: 404, code: 'SNIPPET_NOT_FOUND' });
    }
    return sendSuccess(res, snippet, snippet.isRecommended ? '已设为推荐' : '已取消推荐');
  },

  async toggleFeature(req: Request, res: Response) {
    const snippet = await snippetService.toggleFeatured(req.params.id);
    if (!snippet) {
      throw new AppError('组件不存在', { statusCode: 404, code: 'SNIPPET_NOT_FOUND' });
    }
    return sendSuccess(res, snippet, snippet.isFeatured ? '已设为精选' : '已取消精选');
  },

  async remove(req: Request, res: Response) {
    const removed = await snippetService.remove(req.params.id);
    if (!removed) {
      throw new AppError('组件不存在', { statusCode: 404, code: 'SNIPPET_NOT_FOUND' });
    }
    return sendSuccess(res, { id: req.params.id }, '删除组件成功');
  }
};

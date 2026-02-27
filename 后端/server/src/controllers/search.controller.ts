import { Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { sendPagedSuccess, sendSuccess } from '../utils/response';
import { searchService } from '../services/search.service';

const searchTypeSet = new Set(['all', 'post', 'blog', 'question', 'snippet', 'project', 'tag']);

export const searchController = {
  async search(req: Request, res: Response) {
    const keyword = String(req.query.q ?? req.query.keyword ?? '').trim();
    const type = String(req.query.type ?? 'all')
      .trim()
      .toLowerCase();

    if (keyword.length > 120) {
      throw new AppError('搜索关键词过长', { statusCode: 400, code: 'KEYWORD_TOO_LONG' });
    }

    if (!searchTypeSet.has(type)) {
      throw new AppError('搜索类型无效', { statusCode: 400, code: 'INVALID_SEARCH_TYPE' });
    }

    const result = await searchService.search({
      q: keyword,
      type,
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 20)
    });
    return sendPagedSuccess(res, result.data, result.pagination, '搜索成功');
  },

  async suggestions(req: Request, res: Response) {
    const keyword = String(req.query.q ?? req.query.keyword ?? '').trim();
    if (keyword.length > 120) {
      throw new AppError('搜索关键词过长', { statusCode: 400, code: 'KEYWORD_TOO_LONG' });
    }

    const data = await searchService.suggestions(keyword);
    return sendSuccess(res, data, '获取搜索建议成功');
  },

  async hot(_req: Request, res: Response) {
    const data = await searchService.hotKeywords();
    return sendSuccess(res, data, '获取热门搜索成功');
  }
};

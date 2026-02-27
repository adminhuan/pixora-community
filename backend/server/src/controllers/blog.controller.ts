import { Request, Response } from 'express';
import { blogService } from '../services/blog.service';
import { AppError } from '../utils/AppError';
import { sendPagedSuccess, sendSuccess } from '../utils/response';

const ensureBlogWritable = async (id: string, userId: string, role: string) => {
  const blog = await blogService.findById(id);
  if (!blog) {
    throw new AppError('博客不存在', { statusCode: 404, code: 'BLOG_NOT_FOUND' });
  }
  if (blog.authorId !== userId && role !== 'admin') {
    throw new AppError('无权操作', { statusCode: 403, code: 'FORBIDDEN' });
  }
  return blog;
};

const ensureSeriesWritable = async (id: string, userId: string, role: string) => {
  const series = await blogService.detailSeries(id);
  if (!series) {
    throw new AppError('系列不存在', { statusCode: 404, code: 'SERIES_NOT_FOUND' });
  }
  if (series.authorId !== userId && role !== 'admin') {
    throw new AppError('无权操作', { statusCode: 403, code: 'FORBIDDEN' });
  }
  return series;
};

export const blogController = {
  async list(req: Request, res: Response) {
    const result = await blogService.list(req.query as Record<string, string>, req.user);
    return sendPagedSuccess(res, result.data, result.pagination, '获取博客列表成功');
  },

  async detail(req: Request, res: Response) {
    const blog = await blogService.detail(req.params.id, req.user);
    if (!blog) throw new AppError('博客不存在', { statusCode: 404, code: 'BLOG_NOT_FOUND' });
    return sendSuccess(res, blog, '获取博客详情成功');
  },

  async create(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    const blog = await blogService.createBlog(req.body, req.user.id, 'published');
    return sendSuccess(res, blog, '发布博客成功', 201);
  },

  async update(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    await ensureBlogWritable(req.params.id, req.user.id, req.user.role);

    const blog = await blogService.updateBlog(req.params.id, req.body);
    if (!blog) throw new AppError('博客不存在', { statusCode: 404, code: 'BLOG_NOT_FOUND' });
    return sendSuccess(res, blog, '更新博客成功');
  },

  async remove(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    await ensureBlogWritable(req.params.id, req.user.id, req.user.role);

    const removed = await blogService.remove(req.params.id);
    if (!removed) throw new AppError('博客不存在', { statusCode: 404, code: 'BLOG_NOT_FOUND' });
    return sendSuccess(res, { id: req.params.id }, '删除博客成功');
  },

  async like(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });

    const readable = await blogService.detail(req.params.id, req.user);
    if (!readable) throw new AppError('博客不存在', { statusCode: 404, code: 'BLOG_NOT_FOUND' });

    const result = await blogService.like(req.params.id, req.user.id);
    if (!result.blog) throw new AppError('博客不存在', { statusCode: 404, code: 'BLOG_NOT_FOUND' });
    return sendSuccess(res, result, '点赞状态更新成功');
  },

  async favorite(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });

    const readable = await blogService.detail(req.params.id, req.user);
    if (!readable) throw new AppError('博客不存在', { statusCode: 404, code: 'BLOG_NOT_FOUND' });

    const result = await blogService.favorite(req.params.id, req.user.id);
    if (!result.blog) throw new AppError('博客不存在', { statusCode: 404, code: 'BLOG_NOT_FOUND' });
    return sendSuccess(res, result, '收藏状态更新成功');
  },

  async draftList(req: Request, res: Response) {
    const list = await blogService.listDrafts(req.user?.id);
    return sendSuccess(res, list, '获取草稿列表成功');
  },

  async createDraft(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    const draft = await blogService.createBlog(req.body, req.user.id, 'draft');
    return sendSuccess(res, draft, '保存草稿成功', 201);
  },

  async updateDraft(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    await ensureBlogWritable(req.params.id, req.user.id, req.user.role);

    const draft = await blogService.updateBlog(req.params.id, req.body);
    if (!draft) throw new AppError('草稿不存在', { statusCode: 404, code: 'DRAFT_NOT_FOUND' });
    return sendSuccess(res, draft, '更新草稿成功');
  },

  async deleteDraft(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    await ensureBlogWritable(req.params.id, req.user.id, req.user.role);

    const removed = await blogService.remove(req.params.id);
    if (!removed) throw new AppError('草稿不存在', { statusCode: 404, code: 'DRAFT_NOT_FOUND' });
    return sendSuccess(res, { id: req.params.id }, '删除草稿成功');
  },

  async publishDraft(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    await ensureBlogWritable(req.params.id, req.user.id, req.user.role);

    const blog = await blogService.publishDraft(req.params.id);
    if (!blog) throw new AppError('草稿不存在', { statusCode: 404, code: 'DRAFT_NOT_FOUND' });
    return sendSuccess(res, blog, '发布草稿成功');
  },

  async listSeries(_req: Request, res: Response) {
    const list = await blogService.listSeries();
    return sendSuccess(res, list, '获取系列列表成功');
  },

  async createSeries(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    const item = await blogService.createSeries(req.body, req.user.id);
    return sendSuccess(res, item, '创建系列成功', 201);
  },

  async updateSeries(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    await ensureSeriesWritable(req.params.id, req.user.id, req.user.role);

    const item = await blogService.updateSeries(req.params.id, req.body);
    if (!item) throw new AppError('系列不存在', { statusCode: 404, code: 'SERIES_NOT_FOUND' });
    return sendSuccess(res, item, '更新系列成功');
  },

  async deleteSeries(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    await ensureSeriesWritable(req.params.id, req.user.id, req.user.role);

    const removed = await blogService.deleteSeries(req.params.id);
    if (!removed) throw new AppError('系列不存在', { statusCode: 404, code: 'SERIES_NOT_FOUND' });
    return sendSuccess(res, { id: req.params.id }, '删除系列成功');
  },

  async detailSeries(req: Request, res: Response) {
    const item = await blogService.detailSeries(req.params.id);
    if (!item) throw new AppError('系列不存在', { statusCode: 404, code: 'SERIES_NOT_FOUND' });
    return sendSuccess(res, item, '获取系列详情成功');
  },

  async followSeries(req: Request, res: Response) {
    const item = await blogService.followSeries(req.params.id);
    if (!item) throw new AppError('系列不存在', { statusCode: 404, code: 'SERIES_NOT_FOUND' });
    return sendSuccess(res, item, '关注系列成功');
  },

  async reorderSeries(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    await ensureSeriesWritable(req.params.id, req.user.id, req.user.role);

    const order: Array<{ blogId: string; seriesOrder: number }> = Array.isArray(req.body.order)
      ? req.body.order.map((item: Record<string, unknown>) => ({
          blogId: String(item.blogId ?? ''),
          seriesOrder: Number(item.seriesOrder ?? 0)
        }))
      : [];

    const hasInvalid = order.some(
      (item) => !item.blogId || !Number.isInteger(item.seriesOrder) || item.seriesOrder < 1
    );
    if (hasInvalid) {
      throw new AppError('排序参数不合法', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    const result = await blogService.reorderSeries(req.params.id, order);
    return sendSuccess(res, result, '排序已更新');
  }
};

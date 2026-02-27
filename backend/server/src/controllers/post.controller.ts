import { Request, Response } from 'express';
import { postService } from '../services/post.service';
import { AppError } from '../utils/AppError';
import { sendPagedSuccess, sendSuccess } from '../utils/response';

export const postController = {
  async list(req: Request, res: Response) {
    const result = await postService.list(req.query as Record<string, string>, req.user);
    return sendPagedSuccess(res, result.data, result.pagination, '获取帖子列表成功');
  },

  async detail(req: Request, res: Response) {
    const post = await postService.detail(req.params.id, req.user);
    if (!post) {
      throw new AppError('帖子不存在', { statusCode: 404, code: 'POST_NOT_FOUND' });
    }

    await postService.incrementView(post.id);
    return sendSuccess(res, post, '获取帖子详情成功');
  },

  async create(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    }
    const post = await postService.createPost(req.body, req.user.id);
    return sendSuccess(res, post, '创建帖子成功', 201);
  },

  async update(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    const resource = await postService.findById(req.params.id);
    if (!resource) {
      throw new AppError('帖子不存在', { statusCode: 404, code: 'POST_NOT_FOUND' });
    }

    if (resource.authorId !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('无权操作', { statusCode: 403, code: 'FORBIDDEN' });
    }

    const post = await postService.updatePost(req.params.id, req.body);
    if (!post) {
      throw new AppError('帖子不存在', { statusCode: 404, code: 'POST_NOT_FOUND' });
    }
    return sendSuccess(res, post, '更新帖子成功');
  },

  async remove(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    const resource = await postService.findById(req.params.id);
    if (!resource) {
      throw new AppError('帖子不存在', { statusCode: 404, code: 'POST_NOT_FOUND' });
    }

    if (resource.authorId !== req.user.id && req.user.role !== 'admin') {
      throw new AppError('无权操作', { statusCode: 403, code: 'FORBIDDEN' });
    }

    const removed = await postService.remove(req.params.id);
    if (!removed) {
      throw new AppError('帖子不存在', { statusCode: 404, code: 'POST_NOT_FOUND' });
    }
    return sendSuccess(res, { id: req.params.id }, '删除帖子成功');
  },

  async like(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    const readable = await postService.detail(req.params.id, req.user);
    if (!readable) {
      throw new AppError('帖子不存在', { statusCode: 404, code: 'POST_NOT_FOUND' });
    }

    const result = await postService.like(req.params.id, req.user.id);
    if (!result.post) {
      throw new AppError('帖子不存在', { statusCode: 404, code: 'POST_NOT_FOUND' });
    }
    return sendSuccess(res, result, '点赞状态更新成功');
  },

  async favorite(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    const readable = await postService.detail(req.params.id, req.user);
    if (!readable) {
      throw new AppError('帖子不存在', { statusCode: 404, code: 'POST_NOT_FOUND' });
    }

    const result = await postService.favorite(req.params.id, req.user.id);
    if (!result.post) {
      throw new AppError('帖子不存在', { statusCode: 404, code: 'POST_NOT_FOUND' });
    }
    return sendSuccess(res, result, '收藏状态更新成功');
  },

  async related(req: Request, res: Response) {
    const relatedPosts = await postService.getRelatedPosts(req.params.id);
    return sendSuccess(res, relatedPosts, '获取相关帖子成功');
  }
};

import { Request, Response } from 'express';
import { commentService } from '../services/comment.service';
import { AppError } from '../utils/AppError';
import { sendPagedSuccess, sendSuccess } from '../utils/response';

const ensureCommentWritable = async (id: string, userId: string, role: string) => {
  const comment = await commentService.findById(id);
  if (!comment) {
    throw new AppError('评论不存在', { statusCode: 404, code: 'COMMENT_NOT_FOUND' });
  }
  if (comment.authorId !== userId && role !== 'admin') {
    throw new AppError('无权操作', { statusCode: 403, code: 'FORBIDDEN' });
  }
  return comment;
};

export const commentController = {
  async list(req: Request, res: Response) {
    const result = await commentService.list(req.query as Record<string, string>, req.user);
    return sendPagedSuccess(res, result.data, result.pagination, '获取评论列表成功');
  },

  async create(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    const comment = await commentService.createComment(req.body, req.user);
    return sendSuccess(res, comment, '发表评论成功', 201);
  },

  async update(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    await ensureCommentWritable(req.params.id, req.user.id, req.user.role);

    const comment = await commentService.updateComment(req.params.id, req.body.content);
    if (!comment) throw new AppError('评论不存在', { statusCode: 404, code: 'COMMENT_NOT_FOUND' });
    return sendSuccess(res, comment, '更新评论成功');
  },

  async remove(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    await ensureCommentWritable(req.params.id, req.user.id, req.user.role);

    const removed = await commentService.remove(req.params.id);
    if (!removed) throw new AppError('评论不存在', { statusCode: 404, code: 'COMMENT_NOT_FOUND' });
    return sendSuccess(res, { id: req.params.id }, '删除评论成功');
  },

  async like(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });

    const result = await commentService.like(req.params.id, req.user);
    if (!result.comment) {
      throw new AppError('评论不存在', { statusCode: 404, code: 'COMMENT_NOT_FOUND' });
    }
    return sendSuccess(res, result, '评论点赞状态更新成功');
  },

  async replies(req: Request, res: Response) {
    const list = await commentService.replies(req.params.id, req.user);
    return sendSuccess(res, list, '获取回复列表成功');
  },

  async report(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    const result = await commentService.report(req.params.id, req.user, req.body.reason ?? 'other', req.body.description);
    return sendSuccess(res, result, '举报成功', 201);
  },

  async pin(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });

    const comment = await commentService.detail(req.params.id, req.user);
    if (!comment) {
      throw new AppError('评论不存在', { statusCode: 404, code: 'COMMENT_NOT_FOUND' });
    }

    const isContentAuthor = await commentService.isContentAuthor(comment.targetType, comment.targetId, req.user.id);
    if (!isContentAuthor && req.user.role !== 'admin') {
      throw new AppError('无权操作', { statusCode: 403, code: 'FORBIDDEN' });
    }

    const pinned = await commentService.pin(req.params.id, req.user, Boolean(req.body.pinned ?? true));
    if (!pinned) throw new AppError('评论不存在', { statusCode: 404, code: 'COMMENT_NOT_FOUND' });

    return sendSuccess(res, pinned, '置顶状态更新成功');
  }
};

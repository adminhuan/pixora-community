import { Request, Response } from 'express';
import { snippetService } from '../services/snippet.service';
import { AppError } from '../utils/AppError';
import { sendPagedSuccess, sendSuccess } from '../utils/response';

const ensureSnippetWritable = async (id: string, userId: string, role: string) => {
  const snippet = await snippetService.findById(id);
  if (!snippet) {
    throw new AppError('代码片段不存在', { statusCode: 404, code: 'SNIPPET_NOT_FOUND' });
  }
  if (snippet.authorId !== userId && role !== 'admin') {
    throw new AppError('无权操作', { statusCode: 403, code: 'FORBIDDEN' });
  }
  return snippet;
};

export const snippetController = {
  async list(req: Request, res: Response) {
    const result = await snippetService.list(req.query as Record<string, string>, req.user);
    return sendPagedSuccess(res, result.data, result.pagination, '获取代码列表成功');
  },

  async detail(req: Request, res: Response) {
    const snippet = await snippetService.detail(req.params.id, req.user);
    if (!snippet) {
      throw new AppError('代码片段不存在', { statusCode: 404, code: 'SNIPPET_NOT_FOUND' });
    }
    await snippetService.incrementView(req.params.id);
    return sendSuccess(res, snippet, '获取代码详情成功');
  },

  async create(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    }
    const snippet = await snippetService.createSnippet(req.body, req.user.id);
    return sendSuccess(res, snippet, '创建代码分享成功', 201);
  },

  async update(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    }
    await ensureSnippetWritable(req.params.id, req.user.id, req.user.role);

    const snippet = await snippetService.updateSnippet(req.params.id, req.body);
    if (!snippet) {
      throw new AppError('代码片段不存在', { statusCode: 404, code: 'SNIPPET_NOT_FOUND' });
    }
    return sendSuccess(res, snippet, '更新代码分享成功');
  },

  async remove(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    }
    await ensureSnippetWritable(req.params.id, req.user.id, req.user.role);

    const removed = await snippetService.remove(req.params.id);
    if (!removed) {
      throw new AppError('代码片段不存在', { statusCode: 404, code: 'SNIPPET_NOT_FOUND' });
    }
    return sendSuccess(res, { id: req.params.id }, '删除代码分享成功');
  },

  async fork(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    }
    const forked = await snippetService.forkSnippet(req.params.id, req.user);
    if (!forked) {
      throw new AppError('代码片段不存在', { statusCode: 404, code: 'SNIPPET_NOT_FOUND' });
    }
    return sendSuccess(res, forked, 'Fork 成功', 201);
  },

  async like(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    const result = await snippetService.like(req.params.id, req.user);
    if (!result.snippet) {
      throw new AppError('代码片段不存在', { statusCode: 404, code: 'SNIPPET_NOT_FOUND' });
    }
    return sendSuccess(res, result, '点赞状态更新成功');
  },

  async favorite(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    const result = await snippetService.favorite(req.params.id, req.user);
    if (!result.snippet) {
      throw new AppError('代码片段不存在', { statusCode: 404, code: 'SNIPPET_NOT_FOUND' });
    }
    return sendSuccess(res, result, '收藏状态更新成功');
  },

  async versions(req: Request, res: Response) {
    const versions = await snippetService.getVersions(req.params.id, req.user);
    return sendSuccess(res, versions, '获取版本历史成功');
  },

  async rawFile(req: Request, res: Response) {
    const file = await snippetService.getRawFile(req.params.id, req.params.file, req.user);
    if (!file) {
      throw new AppError('文件不存在', { statusCode: 404, code: 'FILE_NOT_FOUND' });
    }
    return res.type('text/plain').status(200).send(file.content);
  }
};

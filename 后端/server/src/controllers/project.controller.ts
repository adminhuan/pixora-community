import { Request, Response } from 'express';
import { projectService } from '../services/project.service';
import { AppError } from '../utils/AppError';
import { sendPagedSuccess, sendSuccess } from '../utils/response';

const ensureProjectWritable = async (id: string, userId: string, role: string) => {
  const project = await projectService.findById(id);
  if (!project) {
    throw new AppError('项目不存在', { statusCode: 404, code: 'PROJECT_NOT_FOUND' });
  }
  if (project.authorId !== userId && role !== 'admin') {
    throw new AppError('无权操作', { statusCode: 403, code: 'FORBIDDEN' });
  }
  return project;
};

export const projectController = {
  async list(req: Request, res: Response) {
    const result = await projectService.list(req.query as Record<string, string>);
    return sendPagedSuccess(res, result.data, result.pagination, '获取项目列表成功');
  },

  async detail(req: Request, res: Response) {
    const project = await projectService.detail(req.params.id);
    if (!project) throw new AppError('项目不存在', { statusCode: 404, code: 'PROJECT_NOT_FOUND' });
    return sendSuccess(res, project, '获取项目详情成功');
  },

  async create(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    const project = await projectService.createProject(req.body, req.user.id);
    return sendSuccess(res, project, '创建项目成功', 201);
  },

  async update(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    await ensureProjectWritable(req.params.id, req.user.id, req.user.role);

    const project = await projectService.updateProject(req.params.id, req.body);
    if (!project) throw new AppError('项目不存在', { statusCode: 404, code: 'PROJECT_NOT_FOUND' });
    return sendSuccess(res, project, '更新项目成功');
  },

  async remove(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    await ensureProjectWritable(req.params.id, req.user.id, req.user.role);

    const removed = await projectService.remove(req.params.id);
    if (!removed) throw new AppError('项目不存在', { statusCode: 404, code: 'PROJECT_NOT_FOUND' });
    return sendSuccess(res, { id: req.params.id }, '删除项目成功');
  },

  async like(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });

    const result = await projectService.like(req.params.id, req.user.id);
    if (!result.project) throw new AppError('项目不存在', { statusCode: 404, code: 'PROJECT_NOT_FOUND' });
    return sendSuccess(res, result, '点赞状态更新成功');
  },

  async favorite(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });

    const result = await projectService.favorite(req.params.id, req.user.id);
    if (!result.project) throw new AppError('项目不存在', { statusCode: 404, code: 'PROJECT_NOT_FOUND' });
    return sendSuccess(res, result, '收藏状态更新成功');
  },

  async rate(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    const score = Number(req.body.score ?? req.body.rating ?? 0);
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      throw new AppError('评分必须为 1-5', { statusCode: 400, code: 'INVALID_SCORE' });
    }

    const project = await projectService.rateProject(req.params.id, req.user.id, score);
    if (!project) throw new AppError('项目不存在', { statusCode: 404, code: 'PROJECT_NOT_FOUND' });
    return sendSuccess(res, project, '评分成功');
  },

  async ratings(req: Request, res: Response) {
    const data = await projectService.listRatings(req.params.id);
    return sendSuccess(res, data, '获取评分列表成功');
  },

  async related(req: Request, res: Response) {
    const data = await projectService.related(req.params.id);
    return sendSuccess(res, data, '获取相关项目成功');
  }
};

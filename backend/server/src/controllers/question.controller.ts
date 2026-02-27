import { Request, Response } from 'express';
import { bountyService } from '../services/bounty.service';
import { questionService } from '../services/question.service';
import { AppError } from '../utils/AppError';
import { sendPagedSuccess, sendSuccess } from '../utils/response';

const ensureQuestionWritable = async (id: string, userId: string, role: string) => {
  const question = await questionService.findById(id);
  if (!question) {
    throw new AppError('问题不存在', { statusCode: 404, code: 'QUESTION_NOT_FOUND' });
  }
  if (question.authorId !== userId && role !== 'admin') {
    throw new AppError('无权操作', { statusCode: 403, code: 'FORBIDDEN' });
  }
  return question;
};

export const questionController = {
  async list(req: Request, res: Response) {
    const result = await questionService.list(req.query as Record<string, string>);
    return sendPagedSuccess(res, result.data, result.pagination, '获取问题列表成功');
  },

  async detail(req: Request, res: Response) {
    const question = await questionService.detail(req.params.id);
    if (!question) {
      throw new AppError('问题不存在', { statusCode: 404, code: 'QUESTION_NOT_FOUND' });
    }
    await questionService.incrementView(question.id);
    return sendSuccess(res, question, '获取问题详情成功');
  },

  async create(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    const question = await questionService.createQuestion(req.body, req.user.id);
    return sendSuccess(res, question, '创建问题成功', 201);
  },

  async update(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    await ensureQuestionWritable(req.params.id, req.user.id, req.user.role);

    const question = await questionService.updateQuestion(req.params.id, req.body);
    if (!question) throw new AppError('问题不存在', { statusCode: 404, code: 'QUESTION_NOT_FOUND' });
    return sendSuccess(res, question, '更新问题成功');
  },

  async remove(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    await ensureQuestionWritable(req.params.id, req.user.id, req.user.role);

    const removed = await questionService.remove(req.params.id);
    if (!removed) throw new AppError('问题不存在', { statusCode: 404, code: 'QUESTION_NOT_FOUND' });
    return sendSuccess(res, { id: req.params.id }, '删除问题成功');
  },

  async vote(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    const question = await questionService.voteQuestion(req.params.id, req.user.id, req.body.value);
    return sendSuccess(res, question, '投票成功');
  },

  async follow(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    const result = await questionService.followQuestion(req.params.id, req.user.id);
    return sendSuccess(res, result, '关注问题成功');
  },

  async bounty(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    const question = await bountyService.setBounty(req.params.id, req.user.id, Number(req.body.points ?? 0));
    return sendSuccess(res, question, '设置悬赏成功');
  },

  async similar(req: Request, res: Response) {
    const list = await questionService.findSimilar(String(req.query.keyword ?? req.query.q ?? ''));
    return sendSuccess(res, list, '获取相似问题成功');
  },

  async answers(req: Request, res: Response) {
    const list = await questionService.listAnswers(req.params.id);
    return sendSuccess(res, list, '获取回答列表成功');
  },

  async createAnswer(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    const answer = await questionService.createAnswer(req.params.id, req.user.id, req.body.content);
    return sendSuccess(res, answer, '提交回答成功', 201);
  }
};

import { Request, Response } from 'express';
import { answerService } from '../services/answer.service';
import { AppError } from '../utils/AppError';
import { sendSuccess } from '../utils/response';

const ensureAnswerWritable = async (id: string, userId: string, role: string) => {
  const answer = await answerService.findById(id);
  if (!answer) {
    throw new AppError('回答不存在', { statusCode: 404, code: 'ANSWER_NOT_FOUND' });
  }
  if (answer.authorId !== userId && role !== 'admin') {
    throw new AppError('无权操作', { statusCode: 403, code: 'FORBIDDEN' });
  }
  return answer;
};

export const answerController = {
  async update(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    await ensureAnswerWritable(req.params.id, req.user.id, req.user.role);

    const answer = await answerService.updateAnswer(req.params.id, req.body.content);
    if (!answer) throw new AppError('回答不存在', { statusCode: 404, code: 'ANSWER_NOT_FOUND' });
    return sendSuccess(res, answer, '更新回答成功');
  },

  async remove(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    }

    await ensureAnswerWritable(req.params.id, req.user.id, req.user.role);

    const removed = await answerService.deleteAnswer(req.params.id);
    if (!removed) throw new AppError('回答不存在', { statusCode: 404, code: 'ANSWER_NOT_FOUND' });
    return sendSuccess(res, { id: req.params.id }, '删除回答成功');
  },

  async vote(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    const answer = await answerService.voteAnswer(req.params.id, req.user.id, req.body.value);
    return sendSuccess(res, answer, '回答投票成功');
  },

  async accept(req: Request, res: Response) {
    if (!req.user) throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
    const result = await answerService.acceptAnswer(req.params.id, req.user.id);
    return sendSuccess(res, result, '采纳成功');
  }
};

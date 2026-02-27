import { Request, Response } from 'express';
import { messageService } from '../services/message.service';
import { AppError } from '../utils/AppError';
import { sendPagedSuccess, sendSuccess } from '../utils/response';

const ensureAuthUserId = (req: Request): string => {
  if (!req.user) {
    throw new AppError('请先登录', { statusCode: 401, code: 'UNAUTHORIZED' });
  }
  return req.user.id;
};

export const messageController = {
  async conversations(req: Request, res: Response) {
    const userId = ensureAuthUserId(req);
    const result = await messageService.listConversations(userId, req.query as { page?: string; limit?: string });
    return sendPagedSuccess(res, result.data, result.pagination, '获取会话列表成功');
  },

  async openConversation(req: Request, res: Response) {
    const userId = ensureAuthUserId(req);
    const targetUserId = String(req.body.userId ?? '').trim();
    if (!targetUserId) {
      throw new AppError('目标用户不能为空', { statusCode: 400, code: 'BAD_REQUEST' });
    }

    const result = await messageService.openConversation(userId, targetUserId);
    return sendSuccess(res, result, '打开会话成功');
  },

  async messages(req: Request, res: Response) {
    const userId = ensureAuthUserId(req);
    const conversationId = String(req.params.id ?? '').trim();
    const result = await messageService.listMessages(userId, conversationId, req.query as { page?: string; limit?: string });
    return sendSuccess(res, result, '获取私信列表成功');
  },

  async send(req: Request, res: Response) {
    const userId = ensureAuthUserId(req);
    const payload = {
      content: String(req.body.content ?? ''),
      toUserId: req.body.toUserId !== undefined ? String(req.body.toUserId ?? '') : undefined,
      conversationId: req.body.conversationId !== undefined ? String(req.body.conversationId ?? '') : undefined,
      attachments: req.body.attachments,
    };
    const result = await messageService.sendMessage(userId, payload);
    return sendSuccess(res, result, '发送私信成功', 201);
  },

  async recall(req: Request, res: Response) {
    const userId = ensureAuthUserId(req);
    const messageId = String(req.params.id ?? '').trim();
    const result = await messageService.recallMessage(userId, messageId);
    return sendSuccess(res, result, '消息撤回成功');
  },

  async unreadCount(req: Request, res: Response) {
    const userId = ensureAuthUserId(req);
    const count = await messageService.unreadCount(userId);
    return sendSuccess(res, { count }, '获取私信未读数量成功');
  },

  async markConversationRead(req: Request, res: Response) {
    const userId = ensureAuthUserId(req);
    const conversationId = String(req.params.id ?? '').trim();
    const result = await messageService.markConversationRead(userId, conversationId);
    return sendSuccess(res, result, '会话已标记已读');
  },

  async blockUser(req: Request, res: Response) {
    const userId = ensureAuthUserId(req);
    const targetUserId = String(req.params.userId ?? '').trim();
    const reason = req.body.reason !== undefined ? String(req.body.reason ?? '') : undefined;
    const result = await messageService.blockUser(userId, targetUserId, reason);
    return sendSuccess(res, result, '屏蔽用户成功');
  },

  async unblockUser(req: Request, res: Response) {
    const userId = ensureAuthUserId(req);
    const targetUserId = String(req.params.userId ?? '').trim();
    const result = await messageService.unblockUser(userId, targetUserId);
    return sendSuccess(res, result, '取消屏蔽成功');
  },

  async blockStatus(req: Request, res: Response) {
    const userId = ensureAuthUserId(req);
    const targetUserId = String(req.params.userId ?? '').trim();
    const result = await messageService.blockStatus(userId, targetUserId);
    return sendSuccess(res, result, '获取屏蔽状态成功');
  },
};

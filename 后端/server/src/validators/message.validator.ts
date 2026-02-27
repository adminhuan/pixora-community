import { body, param } from 'express-validator';

export const openConversationValidator = [body('userId').isString().isLength({ min: 6, max: 64 })];

export const sendMessageValidator = [
  body('content').optional({ nullable: true }).isString().isLength({ max: 5000 }),
  body('toUserId').optional().isString().isLength({ min: 6, max: 64 }),
  body('conversationId').optional().isString().isLength({ min: 6, max: 64 }),
  body('attachments').optional({ nullable: true }).isArray({ max: 6 }),
  body('attachments.*.url').optional().isString().isLength({ min: 1, max: 500 }),
  body('attachments.*.type').optional().isIn(['image', 'file']),
  body('attachments.*.fileId').optional().isString().isLength({ max: 255 }),
  body('attachments.*.name').optional().isString().isLength({ max: 120 }),
  body('attachments.*.size').optional().isInt({ min: 1, max: 20 * 1024 * 1024 }),
  body('attachments.*.mime').optional().isString().isLength({ max: 100 }),
  body().custom((value) => {
    const payload = value as { content?: unknown; toUserId?: unknown; conversationId?: unknown; attachments?: unknown };
    const content = typeof payload.content === 'string' ? payload.content.trim() : '';
    const hasToUser = typeof payload.toUserId === 'string' && payload.toUserId.trim().length > 0;
    const hasConversation = typeof payload.conversationId === 'string' && payload.conversationId.trim().length > 0;
    const hasAttachments = Array.isArray(payload.attachments) && payload.attachments.length > 0;
    if (!hasToUser && !hasConversation) {
      throw new Error('toUserId 与 conversationId 不能同时为空');
    }
    if (!content && !hasAttachments) {
      throw new Error('content 与 attachments 不能同时为空');
    }
    return true;
  }),
];

export const recallMessageValidator = [param('id').isString().isLength({ min: 6, max: 64 })];

export const blockUserValidator = [
  param('userId').isString().isLength({ min: 6, max: 64 }),
  body('reason').optional({ nullable: true }).isString().isLength({ max: 200 }),
];

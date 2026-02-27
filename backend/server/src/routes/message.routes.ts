import { Router } from 'express';
import { messageController } from '../controllers/message.controller';
import { auth } from '../middleware/auth';
import { messageSendRateLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validator';
import {
  blockUserValidator,
  openConversationValidator,
  recallMessageValidator,
  sendMessageValidator,
} from '../validators/message.validator';

export const messageRoutes = Router();

messageRoutes.get('/conversations', auth, messageController.conversations);
messageRoutes.post(
  '/conversations/open',
  auth,
  openConversationValidator,
  validateRequest,
  messageController.openConversation,
);
messageRoutes.get('/conversations/:id/messages', auth, messageController.messages);
messageRoutes.post('/send', auth, messageSendRateLimiter, sendMessageValidator, validateRequest, messageController.send);
messageRoutes.post('/:id/recall', auth, recallMessageValidator, validateRequest, messageController.recall);
messageRoutes.put('/conversations/:id/read', auth, messageController.markConversationRead);
messageRoutes.get('/unread-count', auth, messageController.unreadCount);
messageRoutes.get('/block/:userId/status', auth, blockUserValidator, validateRequest, messageController.blockStatus);
messageRoutes.post('/block/:userId', auth, blockUserValidator, validateRequest, messageController.blockUser);
messageRoutes.delete('/block/:userId', auth, blockUserValidator, validateRequest, messageController.unblockUser);

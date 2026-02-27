import { request } from './request';

export interface MessageAttachmentPayload {
  url: string;
  type?: 'image' | 'file';
  fileId?: string;
  name?: string;
  size?: number;
  mime?: string;
}

export const messageApi = {
  listConversations: (params?: Record<string, unknown>) => request.get('/messages/conversations', { params }),
  openConversation: (payload: { userId: string }) => request.post('/messages/conversations/open', payload),
  listMessages: (conversationId: string, params?: Record<string, unknown>) =>
    request.get(`/messages/conversations/${conversationId}/messages`, { params }),
  send: (payload: {
    content?: string;
    toUserId?: string;
    conversationId?: string;
    attachments?: MessageAttachmentPayload[];
  }) => request.post('/messages/send', payload),
  recall: (messageId: string) => request.post(`/messages/${messageId}/recall`),
  markConversationRead: (conversationId: string) => request.put(`/messages/conversations/${conversationId}/read`),
  unreadCount: () => request.get('/messages/unread-count'),
  blockUser: (userId: string, payload?: { reason?: string }) => request.post(`/messages/block/${userId}`, payload ?? {}),
  unblockUser: (userId: string) => request.delete(`/messages/block/${userId}`),
  blockStatus: (userId: string) => request.get(`/messages/block/${userId}/status`),
  uploadImage: (payload: FormData) =>
    request.post('/upload/image', payload, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadFile: (payload: FormData) =>
    request.post('/upload/file', payload, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

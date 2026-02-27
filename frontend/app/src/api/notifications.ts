import { request } from './request';

export const notificationApi = {
  list: (params?: Record<string, unknown>) => request.get('/notifications', { params }),
  unreadCount: () => request.get('/notifications/unread-count'),
  read: (id: string) => request.put(`/notifications/${id}/read`),
  readAll: () => request.put('/notifications/read-all'),
  remove: (id: string) => request.delete(`/notifications/${id}`),
  updateSettings: (payload: Record<string, unknown>) => request.put('/notifications/settings', payload),
};

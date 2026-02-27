import { request } from './request';

export const commentApi = {
  list: (targetType: string, targetId: string) =>
    request.get('/comments', { params: { targetType, targetId } }),
  create: (payload: Record<string, unknown>) => request.post('/comments', payload),
  update: (id: string, payload: Record<string, unknown>) => request.put(`/comments/${id}`, payload),
  remove: (id: string) => request.delete(`/comments/${id}`),
  like: (id: string) => request.post(`/comments/${id}/like`),
  report: (id: string, reason: string, description?: string) =>
    request.post(`/comments/${id}/report`, { reason, description }),
  pin: (id: string) => request.post(`/comments/${id}/pin`),
};

import { request } from './request';

export const commentApi = {
  list: (targetType: string, targetId: string, params?: Record<string, unknown>) =>
    request.get('/comments', { params: { targetType, targetId, ...params } }),
  create: (payload: Record<string, unknown>) => request.post('/comments', payload),
  remove: (id: string) => request.delete(`/comments/${id}`),
  like: (id: string) => request.post(`/comments/${id}/like`),
};

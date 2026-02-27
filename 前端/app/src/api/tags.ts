import { request } from './request';

export const tagApi = {
  list: (params?: Record<string, unknown>) => request.get('/tags', { params }),
  detail: (id: string) => request.get(`/tags/${id}`),
  contents: (id: string) => request.get(`/tags/${id}/contents`),
  hot: () => request.get('/tags/hot'),
  follow: (id: string) => request.post(`/tags/${id}/follow`),
  unfollow: (id: string) => request.delete(`/tags/${id}/follow`),
};

export const categoryApi = {
  list: () => request.get('/categories'),
  contents: (id: string) => request.get(`/categories/${id}/contents`),
  apply: (payload: { name: string; type?: 'post' | 'blog' | 'project'; reason?: string }) =>
    request.post('/categories/apply', payload),
  myApplications: () => request.get('/categories/applications/me'),
};

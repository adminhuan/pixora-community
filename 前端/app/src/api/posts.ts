import { request } from './request';
import type { PaginationParams } from '../types/common';

export const postApi = {
  list: (params?: PaginationParams) => request.get('/posts', { params }),
  detail: (id: string) => request.get(`/posts/${id}`),
  create: (payload: Record<string, unknown>) => request.post('/posts', payload),
  update: (id: string, payload: Record<string, unknown>) => request.put(`/posts/${id}`, payload),
  remove: (id: string) => request.delete(`/posts/${id}`),
  like: (id: string) => request.post(`/posts/${id}/like`),
  favorite: (id: string) => request.post(`/posts/${id}/favorite`),
  related: (id: string) => request.get(`/posts/${id}/related`),
  uploadImage: (payload: FormData) =>
    request.post('/upload/image', payload, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

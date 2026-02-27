import { request } from './request';
import type { PaginationParams } from '../types/common';

export const snippetApi = {
  list: (params?: PaginationParams) => request.get('/snippets', { params }),
  detail: (id: string) => request.get(`/snippets/${id}`),
  create: (payload: Record<string, unknown>) => request.post('/snippets', payload),
  update: (id: string, payload: Record<string, unknown>) => request.put(`/snippets/${id}`, payload),
  remove: (id: string) => request.delete(`/snippets/${id}`),
  fork: (id: string) => request.post(`/snippets/${id}/fork`),
  like: (id: string) => request.post(`/snippets/${id}/like`),
  favorite: (id: string) => request.post(`/snippets/${id}/favorite`),
  versions: (id: string) => request.get(`/snippets/${id}/versions`),
};

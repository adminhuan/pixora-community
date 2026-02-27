import { request } from './request';
import type { PaginationParams } from '../types/common';

export const projectApi = {
  list: (params?: PaginationParams) => request.get('/projects', { params }),
  detail: (id: string) => request.get(`/projects/${id}`),
  create: (payload: Record<string, unknown>) => request.post('/projects', payload),
  update: (id: string, payload: Record<string, unknown>) => request.put(`/projects/${id}`, payload),
  remove: (id: string) => request.delete(`/projects/${id}`),
  like: (id: string) => request.post(`/projects/${id}/like`),
  favorite: (id: string) => request.post(`/projects/${id}/favorite`),
  rate: (id: string, score: number, comment?: string) => request.post(`/projects/${id}/rate`, { score, comment }),
  ratings: (id: string) => request.get(`/projects/${id}/ratings`),
  related: (id: string) => request.get(`/projects/${id}/related`),
};

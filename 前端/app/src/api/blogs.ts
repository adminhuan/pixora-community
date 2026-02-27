import { request } from './request';
import type { PaginationParams } from '../types/common';

export const blogApi = {
  list: (params?: PaginationParams) => request.get('/blogs', { params }),
  detail: (id: string) => request.get(`/blogs/${id}`),
  create: (payload: Record<string, unknown>) => request.post('/blogs', payload),
  update: (id: string, payload: Record<string, unknown>) => request.put(`/blogs/${id}`, payload),
  remove: (id: string) => request.delete(`/blogs/${id}`),
  drafts: () => request.get('/blogs/drafts'),
  saveDraft: (payload: Record<string, unknown>) => request.post('/blogs/drafts', payload),
  updateDraft: (id: string, payload: Record<string, unknown>) => request.put(`/blogs/drafts/${id}`, payload),
  deleteDraft: (id: string) => request.delete(`/blogs/drafts/${id}`),
  publishDraft: (id: string) => request.post(`/blogs/drafts/${id}/publish`),
  like: (id: string) => request.post(`/blogs/${id}/like`),
  favorite: (id: string) => request.post(`/blogs/${id}/favorite`),
};

export const seriesApi = {
  list: () => request.get('/series'),
  create: (payload: Record<string, unknown>) => request.post('/series', payload),
  detail: (id: string) => request.get(`/series/${id}`),
  update: (id: string, payload: Record<string, unknown>) => request.put(`/series/${id}`, payload),
  remove: (id: string) => request.delete(`/series/${id}`),
  reorder: (id: string, payload: Record<string, unknown>) => request.put(`/series/${id}/order`, payload),
  follow: (id: string) => request.post(`/series/${id}/follow`),
};

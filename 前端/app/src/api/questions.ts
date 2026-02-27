import { request } from './request';
import type { PaginationParams } from '../types/common';

export const questionApi = {
  list: (params?: PaginationParams) => request.get('/questions', { params }),
  detail: (id: string) => request.get(`/questions/${id}`),
  answers: (id: string) => request.get(`/questions/${id}/answers`),
  create: (payload: Record<string, unknown>) => request.post('/questions', payload),
  update: (id: string, payload: Record<string, unknown>) => request.put(`/questions/${id}`, payload),
  remove: (id: string) => request.delete(`/questions/${id}`),
  vote: (id: string, vote: number) => request.post(`/questions/${id}/vote`, { vote }),
  answer: (id: string, payload: Record<string, unknown>) => request.post(`/questions/${id}/answers`, payload),
  setBounty: (id: string, payload: Record<string, unknown>) => request.post(`/questions/${id}/bounty`, payload),
  similar: (title: string) => request.get('/questions/similar', { params: { title } }),
};

export const answerApi = {
  update: (id: string, payload: Record<string, unknown>) => request.put(`/answers/${id}`, payload),
  accept: (id: string) => request.post(`/answers/${id}/accept`),
  vote: (id: string, vote: number) => request.post(`/answers/${id}/vote`, { vote }),
};

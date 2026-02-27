import { request } from './request';

export const searchApi = {
  search: (params: { q: string; type?: string; page?: number; [key: string]: unknown }) =>
    request.get('/search', { params }),
  suggestions: (q: string) => request.get('/search/suggestions', { params: { q } }),
  hot: () => request.get('/search/hot'),
};

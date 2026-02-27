import { request } from './request';

export const rankingApi = {
  list: (params: { type?: string; period?: string; page?: number; limit?: number }) =>
    request.get('/rankings', { params }),
};

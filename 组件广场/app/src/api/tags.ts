import { request } from './request';

export const tagApi = {
  list: (params?: Record<string, unknown>) => request.get('/tags', { params }),
};

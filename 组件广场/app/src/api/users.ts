import { request } from './request';

export const userApi = {
  profile: (id: string) => request.get(`/users/${id}`),
  me: () => request.get('/users/me'),
};

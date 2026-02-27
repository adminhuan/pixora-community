import { request } from './request';

export type AdminMeResponse = {
  id?: string;
  username?: string;
  role?: string;
  email?: string;
};

export const adminAuthApi = {
  login: (identifier: string, password: string) => request.post('/auth/login', { identifier, password }),
  refreshToken: () => request.post('/auth/refresh-token', {}),
  logout: () => request.post('/auth/logout', {}),
  me: () => request.get('/users/me'),
  updateProfile: (payload: { username: string; email: string }) => request.put('/users/profile', payload),
  changePassword: (oldPassword: string, newPassword: string) =>
    request.put('/auth/change-password', { oldPassword, newPassword })
};

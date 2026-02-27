import { request } from './request';

export interface LoginPayload {
  identifier: string;
  password: string;
  captchaId?: string;
  captchaCode?: string;
  remember?: boolean;
}

export const authApi = {
  register: (payload: Record<string, unknown>) => request.post('/auth/register', payload),
  login: (payload: LoginPayload) => request.post('/auth/login', payload),
  logout: () => request.post('/auth/logout'),
  refreshToken: () => request.post('/auth/refresh-token'),
  sendEmailCode: (payload: { email: string; captchaId: string; captchaCode: string }) =>
    request.post('/auth/send-email-code', payload),
  getCaptcha: () => request.get('/auth/captcha'),
  exchangeToken: (token: string) => request.post('/auth/exchange-token', { token }),
  checkUsername: (username: string) => request.get('/auth/check-username', { params: { username } }),
  checkEmail: (email: string) => request.get('/auth/check-email', { params: { email } }),
  getGithubLoginRedirect: (redirect?: string) =>
    request.get('/auth/github', { params: redirect ? { redirect } : undefined })
};

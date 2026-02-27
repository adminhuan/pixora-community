import { request } from './request';

export const siteApi = {
  settings: () => request.get('/settings/site')
};

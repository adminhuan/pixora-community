import { request } from './request';

export const adminSiteApi = {
  settings: () => request.get('/settings/site')
};

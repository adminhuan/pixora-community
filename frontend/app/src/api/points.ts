import { request } from './request';

export const pointsApi = {
  rules: () => request.get('/rankings/points/rules'),
};

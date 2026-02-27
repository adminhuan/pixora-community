import { request } from './request';

export const pollApi = {
  detail: () => request.get('/poll'),
  vote: (optionId: string) => request.post('/poll/vote', { optionId })
};

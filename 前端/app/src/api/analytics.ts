import { request } from './request';

export const analyticsApi = {
  trackHomeClick: (payload: {
    module: string;
    targetType?: string;
    targetId?: string;
    targetTitle?: string;
    action?: string;
  }) => request.post('/analytics/home-click', payload)
};

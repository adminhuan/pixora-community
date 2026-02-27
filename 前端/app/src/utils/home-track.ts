import { analyticsApi } from '../api';

interface HomeTrackPayload {
  module: string;
  targetType?: string;
  targetId?: string;
  targetTitle?: string;
  action?: string;
}

export const trackHomeClick = (payload: HomeTrackPayload) => {
  if (!payload.module) {
    return;
  }

  void analyticsApi.trackHomeClick(payload).catch(() => undefined);
};

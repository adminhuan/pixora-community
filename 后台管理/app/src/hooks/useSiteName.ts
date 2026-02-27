import { useCallback, useEffect, useState } from 'react';
import { adminSiteApi } from '../api/site';
import { extractData } from '../utils/api';

const DEFAULT_SITE_NAME = '社区';
const SITE_SETTINGS_UPDATED_EVENT = 'admin-site-settings-updated';
const REFRESH_INTERVAL_MS = 60_000;

const resolveSiteName = (input: unknown): string => {
  const value = String(input ?? '').trim();
  return value || DEFAULT_SITE_NAME;
};

export const notifyAdminSiteSettingsUpdated = () => {
  window.dispatchEvent(new Event(SITE_SETTINGS_UPDATED_EVENT));
};

export const useSiteName = () => {
  const [siteName, setSiteName] = useState(DEFAULT_SITE_NAME);

  const refreshSiteName = useCallback(async () => {
    try {
      const response = await adminSiteApi.settings();
      const data = extractData<Record<string, unknown>>(response, {});
      setSiteName(resolveSiteName(data.siteName ?? data.name));
    } catch {
      setSiteName((prev) => resolveSiteName(prev));
    }
  }, []);

  useEffect(() => {
    void refreshSiteName();

    const handleWindowFocus = () => {
      void refreshSiteName();
    };

    const handleSettingsUpdated = () => {
      void refreshSiteName();
    };

    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener(SITE_SETTINGS_UPDATED_EVENT, handleSettingsUpdated);

    const timerId = window.setInterval(() => {
      void refreshSiteName();
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener(SITE_SETTINGS_UPDATED_EVENT, handleSettingsUpdated);
      window.clearInterval(timerId);
    };
  }, [refreshSiteName]);

  return { siteName, refreshSiteName };
};

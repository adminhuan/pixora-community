import { useEffect } from 'react';
import { useSiteStore } from '../store/siteStore';

const SETTINGS_REFRESH_INTERVAL_MS = 60_000;

const updateFavicon = (url: string) => {
  if (!url) return;
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = url;
};

export const useSiteSettings = () => {
  const siteName = useSiteStore((state) => state.siteName);
  const logo = useSiteStore((state) => state.logo);
  const favicon = useSiteStore((state) => state.favicon);
  const contactEmail = useSiteStore((state) => state.contactEmail);
  const contactPhone = useSiteStore((state) => state.contactPhone);
  const contactWechat = useSiteStore((state) => state.contactWechat);
  const contactWechatQR = useSiteStore((state) => state.contactWechatQR);
  const contactQQ = useSiteStore((state) => state.contactQQ);
  const contactQQQR = useSiteStore((state) => state.contactQQQR);
  const contactAddress = useSiteStore((state) => state.contactAddress);
  const icp = useSiteStore((state) => state.icp);
  const loading = useSiteStore((state) => state.loading);
  const loaded = useSiteStore((state) => state.loaded);
  const loadSiteSettings = useSiteStore((state) => state.loadSiteSettings);

  useEffect(() => {
    if (!loading) {
      void loadSiteSettings();
    }

    const handleWindowFocus = () => {
      void loadSiteSettings(true);
    };

    window.addEventListener('focus', handleWindowFocus);

    const timerId = window.setInterval(() => {
      void loadSiteSettings(true);
    }, SETTINGS_REFRESH_INTERVAL_MS);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      window.clearInterval(timerId);
    };
  }, [loading, loadSiteSettings]);

  // 动态更新标签页标题和图标
  useEffect(() => {
    if (loaded && siteName) {
      document.title = siteName;
    }
  }, [loaded, siteName]);

  useEffect(() => {
    if (loaded && favicon) {
      updateFavicon(favicon);
    }
  }, [loaded, favicon]);

  return { siteName, logo, favicon, contactEmail, contactPhone, contactWechat, contactWechatQR, contactQQ, contactQQQR, contactAddress, icp, loading, loaded };
};

import { create } from 'zustand';
import { siteApi } from '../api/site';
import { extractData } from '../utils';

const DEFAULT_SITE_NAME = '社区';

interface SiteState {
  siteName: string;
  logo: string;
  favicon: string;
  contactEmail: string;
  contactPhone: string;
  contactWechat: string;
  contactWechatQR: string;
  contactQQ: string;
  contactQQQR: string;
  contactAddress: string;
  icp: string;
  loading: boolean;
  loaded: boolean;
  loadedAt: number;
  loadSiteSettings: (force?: boolean) => Promise<void>;
}

let pendingRequest: Promise<void> | null = null;
const SETTINGS_CACHE_TTL_MS = 60_000;

export const useSiteStore = create<SiteState>()((set, get) => ({
  siteName: DEFAULT_SITE_NAME,
  logo: '',
  favicon: '',
  contactEmail: '',
  contactPhone: '',
  contactWechat: '',
  contactWechatQR: '',
  contactQQ: '',
  contactQQQR: '',
  contactAddress: '',
  icp: '',
  loading: false,
  loaded: false,
  loadedAt: 0,
  loadSiteSettings: async (force = false) => {
    const now = Date.now();
    if (!force && get().loaded && now - get().loadedAt < SETTINGS_CACHE_TTL_MS) {
      return;
    }

    if (pendingRequest) {
      await pendingRequest;
      return;
    }

    pendingRequest = (async () => {
      set({ loading: true });

      try {
        const response = await siteApi.settings();
        const data = extractData<Record<string, unknown>>(response, {});
        const siteName = String(data.siteName ?? data.name ?? '').trim() || DEFAULT_SITE_NAME;

        set({
          siteName,
          logo: String(data.logo ?? '').trim(),
          favicon: String(data.favicon ?? '').trim(),
          contactEmail: String(data.contactEmail ?? '').trim(),
          contactPhone: String(data.contactPhone ?? '').trim(),
          contactWechat: String(data.contactWechat ?? '').trim(),
          contactWechatQR: String(data.contactWechatQR ?? '').trim(),
          contactQQ: String(data.contactQQ ?? '').trim(),
          contactQQQR: String(data.contactQQQR ?? '').trim(),
          contactAddress: String(data.contactAddress ?? '').trim(),
          icp: String(data.icp ?? '').trim(),
          loaded: true,
          loading: false,
          loadedAt: Date.now(),
        });
      } catch {
        set({ loading: false, loaded: true, loadedAt: Date.now() });
      } finally {
        pendingRequest = null;
      }
    })();

    await pendingRequest;
  }
}));

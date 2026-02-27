import { useCallback, useEffect, useState } from 'react';

type ThemeMode = 'dark' | 'light';
const STORAGE_KEY = 'cp_theme_mode';

export const useDarkMode = () => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch { /* noop */ }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* noop */ }
  }, [mode]);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { mode, setMode, toggleMode } as const;
};

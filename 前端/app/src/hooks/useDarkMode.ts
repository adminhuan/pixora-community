import { useCallback } from 'react';
import { applyThemeVariables, type ThemeMode } from '../styles/theme';
import { useLocalStorage } from './useLocalStorage';

export const useDarkMode = () => {
  const [mode, setMode] = useLocalStorage<ThemeMode>('apc_theme_mode', 'light');

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, [setMode]);

  const applyMode = useCallback((currentMode: ThemeMode) => {
    applyThemeVariables(currentMode);
  }, []);

  return { mode, setMode, toggleMode, applyMode };
};

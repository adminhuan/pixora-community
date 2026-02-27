export const LIGHT_THEME = {
  colors: {
    primary: '#1570EF',
    primaryLight: '#2E90FA',
    primaryLighter: '#53B1FD',
    primaryBg: '#EFF8FF',
    primaryDark: '#175CD3',
    primaryDarker: '#1849A9',
    cta: '#1570EF',
    text: '#0C0D0F',
    textSecondary: '#5F6676',
    background: '#F5F6F8',
    surface: '#FFFFFF',
    border: '#E3E5EA',
    success: '#12B76A',
    warning: '#F79009',
    error: '#F04438',
  },
};

export const DARK_THEME = {
  colors: {
    primary: '#2E90FA',
    primaryLight: '#53B1FD',
    primaryLighter: '#84CAFF',
    primaryBg: 'rgba(46, 144, 250, 0.1)',
    primaryDark: '#1570EF',
    primaryDarker: '#175CD3',
    cta: '#2E90FA',
    text: '#FAFAFA',
    textSecondary: '#A1A1AA',
    background: '#09090B',
    surface: '#18181B',
    border: '#27272A',
    success: '#32D583',
    warning: '#FDB022',
    error: '#F97066',
  },
};

export type ThemeMode = 'light' | 'dark';

export const applyThemeVariables = (mode: ThemeMode): void => {
  const palette = mode === 'light' ? LIGHT_THEME.colors : DARK_THEME.colors;
  const root = document.documentElement;

  Object.entries(palette).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });

  root.dataset.theme = mode;
};

import type { Theme } from '@microapps/theme';

const spacing = (multiplier: number) => multiplier * 4;
const radii: Theme['radii'] = { sm: 6, md: 12, lg: 20, full: 9999 };
const typography: Theme['typography'] = {
  fontFamily: { regular: 'System', medium: 'System', bold: 'System' },
  size: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24, xxl: 32 },
  lineHeight: { xs: 16, sm: 20, md: 24, lg: 28, xl: 32, xxl: 40 },
};

export const petcareLightTheme: Theme = {
  colors: {
    background: '#FAFAF8',
    surface: '#FFFFFF',
    surfaceAlt: '#F0F4EC',
    text: '#1A1A1A',
    textMuted: '#6B7280',
    border: '#E5E7EB',
    primary: '#4CAF50',
    primaryText: '#FFFFFF',
    secondary: '#FF9800',
    secondaryText: '#FFFFFF',
    success: '#2E7D32',
    warning: '#E65100',
    danger: '#C62828',
    info: '#1565C0',
  },
  typography,
  spacing,
  radii,
  icons: {},
  branding: { appName: 'Pet Care' },
};

export const petcareDarkTheme: Theme = {
  colors: {
    background: '#111816',
    surface: '#1E2520',
    surfaceAlt: '#263028',
    text: '#F0F4EC',
    textMuted: '#9CA3AF',
    border: '#374151',
    primary: '#66BB6A',
    primaryText: '#0D1F0F',
    secondary: '#FFB74D',
    secondaryText: '#1A0F00',
    success: '#66BB6A',
    warning: '#FFB74D',
    danger: '#EF5350',
    info: '#64B5F6',
  },
  typography,
  spacing,
  radii,
  icons: {},
  branding: { appName: 'Pet Care' },
};

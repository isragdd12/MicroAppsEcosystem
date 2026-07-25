import type { Theme } from './tokens';

const BASE_SPACING_UNIT = 4;

function spacing(multiplier: number): number {
  return multiplier * BASE_SPACING_UNIT;
}

const typography: Theme['typography'] = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  size: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24, xxl: 32 },
  lineHeight: { xs: 16, sm: 20, md: 24, lg: 28, xl: 32, xxl: 40 },
};

const radii: Theme['radii'] = { sm: 4, md: 8, lg: 16, full: 9999 };

/**
 * A complete, valid, neutral theme — used as a fallback when no
 * ThemeProvider is present, and as the fixture theme for packages/ui's
 * own tests. Real apps supply their own light/dark themes (see
 * docs/THEME_SYSTEM.md) rather than using this one in production.
 */
export const defaultLightTheme: Theme = {
  colors: {
    background: '#FFFFFF',
    surface: '#F5F5F5',
    surfaceAlt: '#EBEBEB',
    text: '#111111',
    textMuted: '#6B6B6B',
    border: '#DADADA',
    primary: '#3366FF',
    primaryText: '#FFFFFF',
    secondary: '#6B6B6B',
    secondaryText: '#FFFFFF',
    success: '#2E7D32',
    warning: '#B26A00',
    danger: '#C62828',
    info: '#1565C0',
  },
  typography,
  spacing,
  radii,
  icons: {},
  branding: { appName: 'MicroApps' },
};

export const defaultDarkTheme: Theme = {
  colors: {
    background: '#121212',
    surface: '#1E1E1E',
    surfaceAlt: '#2A2A2A',
    text: '#F2F2F2',
    textMuted: '#A3A3A3',
    border: '#3A3A3A',
    primary: '#6E8CFF',
    primaryText: '#0B0F1A',
    secondary: '#A3A3A3',
    secondaryText: '#0B0F1A',
    success: '#66BB6A',
    warning: '#FFB74D',
    danger: '#EF5350',
    info: '#64B5F6',
  },
  typography,
  spacing,
  radii,
  icons: {},
  branding: { appName: 'MicroApps' },
};

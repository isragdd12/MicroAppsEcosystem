import type { Theme } from '@microapps/core';

const spacing = (multiplier: number) => multiplier * 4;
const radii: Theme['radii'] = { sm: 6, md: 12, lg: 20, full: 9999 };
const typography: Theme['typography'] = {
  fontFamily: { regular: 'System', medium: 'System', bold: 'System' },
  size: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24, xxl: 32 },
  lineHeight: { xs: 16, sm: 20, md: 24, lg: 28, xl: 32, xxl: 40 },
};

export const baseballLightTheme: Theme = {
  colors: {
    background: '#FBF5E6',
    surface: '#FFFFFF',
    surfaceAlt: '#F5E6C8',
    text: '#2C1810',
    textMuted: '#7A6652',
    border: '#DDD0BB',
    primary: '#D4A017',
    primaryText: '#2C1810',
    secondary: '#1B3A6B',
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
  branding: { appName: 'Baseball Quest Arena' },
};

export const baseballDarkTheme: Theme = {
  colors: {
    background: '#1A1208',
    surface: '#2C1F0E',
    surfaceAlt: '#3D2C18',
    text: '#F5E6C8',
    textMuted: '#B8A080',
    border: '#5A4020',
    primary: '#F0B820',
    primaryText: '#1A1208',
    secondary: '#4A7FCB',
    secondaryText: '#FFFFFF',
    success: '#66BB6A',
    warning: '#FFB74D',
    danger: '#EF5350',
    info: '#64B5F6',
  },
  typography,
  spacing,
  radii,
  icons: {},
  branding: { appName: 'Baseball Quest Arena' },
};

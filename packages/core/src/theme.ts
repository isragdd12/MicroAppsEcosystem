import React, { createContext, useContext, useMemo } from 'react';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryText: string;
  secondary: string;
  secondaryText: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

export interface ThemeTypography {
  fontFamily: { regular: string; medium: string; bold: string };
  size: { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number };
  lineHeight: { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number };
}

export interface ThemeRadii {
  sm: number;
  md: number;
  lg: number;
  full: number;
}

export interface Theme {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: (multiplier: number) => number;
  radii: ThemeRadii;
  icons: Record<string, unknown>;
  branding: { appName: string; logo?: unknown };
}

const BASE = 4;
const spacing = (m: number) => m * BASE;

const typography: Theme['typography'] = {
  fontFamily: { regular: 'System', medium: 'System', bold: 'System' },
  size: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24, xxl: 32 },
  lineHeight: { xs: 16, sm: 20, md: 24, lg: 28, xl: 32, xxl: 40 },
};

const radii: Theme['radii'] = { sm: 4, md: 8, lg: 16, full: 9999 };

export const defaultLightTheme: Theme = {
  colors: {
    background: '#FFFFFF', surface: '#F5F5F5', surfaceAlt: '#EBEBEB',
    text: '#111111', textMuted: '#6B6B6B', border: '#DADADA',
    primary: '#3366FF', primaryText: '#FFFFFF',
    secondary: '#6B6B6B', secondaryText: '#FFFFFF',
    success: '#2E7D32', warning: '#B26A00', danger: '#C62828', info: '#1565C0',
  },
  typography, spacing, radii, icons: {}, branding: { appName: 'MicroApps' },
};

export const defaultDarkTheme: Theme = {
  colors: {
    background: '#121212', surface: '#1E1E1E', surfaceAlt: '#2A2A2A',
    text: '#F2F2F2', textMuted: '#A3A3A3', border: '#3A3A3A',
    primary: '#6E8CFF', primaryText: '#0B0F1A',
    secondary: '#A3A3A3', secondaryText: '#0B0F1A',
    success: '#66BB6A', warning: '#FFB74D', danger: '#EF5350', info: '#64B5F6',
  },
  typography, spacing, radii, icons: {}, branding: { appName: 'MicroApps' },
};

const ThemeContext = createContext<Theme>(defaultLightTheme);

export interface ThemeProviderProps {
  theme: Theme;
  children: React.ReactNode;
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  const value = useMemo(() => theme, [theme]);
  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

import React, { createContext, useMemo } from 'react';

import { defaultLightTheme } from './defaultTheme';
import type { Theme } from './tokens';

export const ThemeContext = createContext<Theme>(defaultLightTheme);

export interface ThemeProviderProps {
  theme: Theme;
  children: React.ReactNode;
}

/**
 * Provides a Theme to packages/ui components and app code alike — see
 * docs/THEME_SYSTEM.md. An app supplies its own light/dark Theme object
 * (already resolved for the current color scheme) as the `theme` prop;
 * OS color-scheme following and the user override toggle are an
 * app-layer concern (built on top of this), not this provider's job —
 * this component only ever renders the theme it's given.
 */
export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  const value = useMemo(() => theme, [theme]);
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

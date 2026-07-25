import { useContext } from 'react';

import { ThemeContext } from './ThemeProvider';
import type { Theme } from './tokens';

/**
 * The only way packages/ui components and app code should read theme
 * values — see docs/THEME_SYSTEM.md. Falls back to the default theme
 * (rather than throwing) when no ThemeProvider is present, so components
 * remain renderable in isolation (e.g. quick manual smoke checks) — see
 * docs/THEME_SYSTEM.md's "Testing a theme" note.
 */
export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/**
 * The theme token contract — see docs/THEME_SYSTEM.md. This defines the
 * SHAPE of a theme only; no app's actual color values live here. Every
 * app supplies a light and dark Theme object conforming to this type.
 *
 * Tokens are semantic ("primary", "surface"), never literal or
 * component-specific ("petCardBackground") — see THEME_SYSTEM.md's
 * rationale.
 */
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
  fontFamily: {
    regular: string;
    medium: string;
    bold: string;
  };
  size: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  lineHeight: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
}

export interface ThemeRadii {
  sm: number;
  md: number;
  lg: number;
  full: number;
}

/**
 * Semantic icon names -> concrete icon components. Kept as `unknown`
 * here (rather than importing a specific icon library's component type)
 * so packages/theme has zero dependency on which icon library an app
 * chooses — packages/ui consumers cast to their icon component type at
 * the point of use. See docs/THEME_SYSTEM.md's "Icons" section.
 */
export type IconSet = Record<string, unknown>;

export interface ThemeBranding {
  appName: string;
  logo?: unknown;
}

export interface Theme {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: (multiplier: number) => number;
  radii: ThemeRadii;
  icons: IconSet;
  branding: ThemeBranding;
}

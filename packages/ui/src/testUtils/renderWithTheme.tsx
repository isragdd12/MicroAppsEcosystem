import { render } from '@testing-library/react-native';
import React from 'react';
import { defaultLightTheme, ThemeProvider } from '@microapps/theme';

export function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={defaultLightTheme}>{ui}</ThemeProvider>);
}

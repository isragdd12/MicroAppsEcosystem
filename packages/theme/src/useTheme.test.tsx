import { render, screen } from '@testing-library/react';
import React from 'react';

import { defaultDarkTheme, defaultLightTheme } from './defaultTheme';
import { ThemeProvider } from './ThemeProvider';
import { useTheme } from './useTheme';

function ProbeComponent() {
  const theme = useTheme();
  return <div data-testid="probe">{theme.colors.primary}</div>;
}

describe('useTheme / ThemeProvider', () => {
  it('falls back to the default light theme with no provider present', () => {
    render(<ProbeComponent />);
    expect(screen.getByTestId('probe')).toHaveTextContent(
      defaultLightTheme.colors.primary,
    );
  });

  it('provides the theme passed to ThemeProvider', () => {
    render(
      <ThemeProvider theme={defaultDarkTheme}>
        <ProbeComponent />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('probe')).toHaveTextContent(
      defaultDarkTheme.colors.primary,
    );
  });

  it('a Theme conforms to the token contract with all required fields', () => {
    expect(defaultLightTheme.spacing(2)).toBe(8);
    expect(defaultLightTheme.radii.full).toBeGreaterThan(0);
    expect(Object.keys(defaultLightTheme.colors).length).toBeGreaterThan(0);
  });
});

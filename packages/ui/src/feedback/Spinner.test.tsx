import { render } from '@testing-library/react-native';
import React from 'react';
import { defaultLightTheme, ThemeProvider } from '@microapps/core';

import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(
      <ThemeProvider theme={defaultLightTheme}>
        <Spinner />
      </ThemeProvider>,
    );

    expect(toJSON()).not.toBeNull();
  });
});

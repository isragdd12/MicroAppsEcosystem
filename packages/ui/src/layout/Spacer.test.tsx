import { render } from '@testing-library/react-native';
import React from 'react';
import { View } from 'react-native';
import { defaultLightTheme, ThemeProvider } from '@microapps/theme';

import { Spacer } from './Spacer';

describe('Spacer', () => {
  it('renders without crashing in both directions', () => {
    const { toJSON } = render(
      <ThemeProvider theme={defaultLightTheme}>
        <View>
          <Spacer size={2} />
          <Spacer size={2} direction="horizontal" />
        </View>
      </ThemeProvider>,
    );

    expect(toJSON()).not.toBeNull();
  });
});

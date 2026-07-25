import { screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { renderWithTheme } from '../testUtils/renderWithTheme';

import { Screen } from './Screen';

describe('Screen', () => {
  it('renders children in the default (non-scrolling) mode', () => {
    renderWithTheme(
      <Screen>
        <Text>Content</Text>
      </Screen>,
    );

    expect(screen.getByText('Content')).toBeTruthy();
  });

  it('renders children inside a ScrollView when scroll is true', () => {
    renderWithTheme(
      <Screen scroll>
        <Text>Scrollable content</Text>
      </Screen>,
    );

    expect(screen.getByText('Scrollable content')).toBeTruthy();
  });
});

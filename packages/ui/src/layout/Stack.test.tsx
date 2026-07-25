import { screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { renderWithTheme } from '../testUtils/renderWithTheme';

import { Stack } from './Stack';

describe('Stack', () => {
  it('renders its children', () => {
    renderWithTheme(
      <Stack gap={2}>
        <Text>First</Text>
        <Text>Second</Text>
      </Stack>,
    );

    expect(screen.getByText('First')).toBeTruthy();
    expect(screen.getByText('Second')).toBeTruthy();
  });
});

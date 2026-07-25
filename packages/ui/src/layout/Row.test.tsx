import { screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { renderWithTheme } from '../testUtils/renderWithTheme';

import { Row } from './Row';

describe('Row', () => {
  it('renders its children', () => {
    renderWithTheme(
      <Row gap={2} align="center" justify="space-between">
        <Text>Left</Text>
        <Text>Right</Text>
      </Row>,
    );

    expect(screen.getByText('Left')).toBeTruthy();
    expect(screen.getByText('Right')).toBeTruthy();
  });
});

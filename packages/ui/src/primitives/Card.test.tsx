import { screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { renderWithTheme } from '../testUtils/renderWithTheme';

import { Card } from './Card';

describe('Card', () => {
  it('renders arbitrary children', () => {
    renderWithTheme(
      <Card>
        <Text>Pet details</Text>
      </Card>,
    );

    expect(screen.getByText('Pet details')).toBeTruthy();
  });
});

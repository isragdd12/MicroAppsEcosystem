import { screen } from '@testing-library/react-native';
import React from 'react';

import { renderWithTheme } from '../testUtils/renderWithTheme';

import { Toast } from './Toast';

describe('Toast', () => {
  it('renders the message', () => {
    renderWithTheme(<Toast message="Saved successfully" variant="success" />);

    expect(screen.getByText('Saved successfully')).toBeTruthy();
  });
});

import { fireEvent, screen } from '@testing-library/react-native';
import React from 'react';

import { renderWithTheme } from '../testUtils/renderWithTheme';

import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('renders a default title with no props', () => {
    renderWithTheme(<ErrorState />);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });

  it('calls onRetry when the retry button is pressed', () => {
    const onRetry = jest.fn();
    renderWithTheme(<ErrorState onRetry={onRetry} />);

    fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render a retry button when onRetry is missing', () => {
    renderWithTheme(<ErrorState />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

import { fireEvent, screen } from '@testing-library/react-native';
import React from 'react';

import { renderWithTheme } from '../testUtils/renderWithTheme';

import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders title and message', () => {
    renderWithTheme(
      <EmptyState
        title="No pets yet"
        message="Add your first pet to get started"
      />,
    );

    expect(screen.getByText('No pets yet')).toBeTruthy();
    expect(screen.getByText('Add your first pet to get started')).toBeTruthy();
  });

  it('renders and fires the action button only when both actionLabel and onAction are given', () => {
    const onAction = jest.fn();
    renderWithTheme(
      <EmptyState
        title="No pets yet"
        actionLabel="Add Pet"
        onAction={onAction}
      />,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Add Pet' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('does not render an action button when onAction is missing', () => {
    renderWithTheme(<EmptyState title="No pets yet" actionLabel="Add Pet" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

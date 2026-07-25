import { fireEvent, screen } from '@testing-library/react-native';
import React from 'react';

import { renderWithTheme } from '../testUtils/renderWithTheme';

import { Button } from './Button';

describe('Button', () => {
  it('renders its label and calls onPress when tapped', () => {
    const onPress = jest.fn();
    renderWithTheme(<Button label="Save" onPress={onPress} />);

    const button = screen.getByRole('button', { name: 'Save' });
    fireEvent.press(button);

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    renderWithTheme(<Button label="Save" onPress={onPress} disabled />);

    fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a loading indicator instead of the label when loading', () => {
    renderWithTheme(<Button label="Save" onPress={jest.fn()} loading />);

    expect(screen.queryByText('Save')).toBeNull();
  });

  it('uses accessibilityLabel override when provided', () => {
    renderWithTheme(
      <Button
        label="Save"
        onPress={jest.fn()}
        accessibilityLabel="Save pet profile"
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Save pet profile' }),
    ).toBeTruthy();
  });
});

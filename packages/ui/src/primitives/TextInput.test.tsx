import { fireEvent, screen } from '@testing-library/react-native';
import React from 'react';

import { renderWithTheme } from '../testUtils/renderWithTheme';

import { TextInput } from './TextInput';

describe('TextInput', () => {
  it('renders the label and calls onChangeText as the user types', () => {
    const onChangeText = jest.fn();
    renderWithTheme(
      <TextInput label="Pet name" value="" onChangeText={onChangeText} />,
    );

    expect(screen.getByText('Pet name')).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText('Pet name'), 'Max');
    expect(onChangeText).toHaveBeenCalledWith('Max');
  });

  it('renders an error message when error is provided', () => {
    renderWithTheme(
      <TextInput
        label="Pet name"
        value=""
        onChangeText={jest.fn()}
        error="Name is required"
      />,
    );

    expect(screen.getByText('Name is required')).toBeTruthy();
  });
});

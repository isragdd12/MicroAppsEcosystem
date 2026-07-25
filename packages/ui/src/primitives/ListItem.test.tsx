import { fireEvent, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { renderWithTheme } from '../testUtils/renderWithTheme';

import { ListItem } from './ListItem';

describe('ListItem', () => {
  it('renders title and subtitle', () => {
    renderWithTheme(<ListItem title="Max" subtitle="Golden Retriever" />);

    expect(screen.getByText('Max')).toBeTruthy();
    expect(screen.getByText('Golden Retriever')).toBeTruthy();
  });

  it('calls onPress when tapped, and is not a button when onPress is absent', () => {
    const onPress = jest.fn();
    renderWithTheme(<ListItem title="Max" onPress={onPress} />);

    fireEvent.press(screen.getByRole('button', { name: 'Max' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders leading and trailing slots', () => {
    renderWithTheme(
      <ListItem
        title="Max"
        leading={<Text>🐾</Text>}
        trailing={<Text>Fed 2h ago</Text>}
      />,
    );

    expect(screen.getByText('🐾')).toBeTruthy();
    expect(screen.getByText('Fed 2h ago')).toBeTruthy();
  });
});

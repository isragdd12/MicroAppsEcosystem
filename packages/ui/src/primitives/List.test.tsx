import { screen } from '@testing-library/react-native';
import React from 'react';

import { renderWithTheme } from '../testUtils/renderWithTheme';

import { List } from './List';
import { ListItem } from './ListItem';

interface Widget {
  id: string;
  name: string;
}

describe('List', () => {
  it('renders one row per item via renderItem, generic over item shape', () => {
    const widgets: Widget[] = [
      { id: '1', name: 'Gadget' },
      { id: '2', name: 'Gizmo' },
    ];

    renderWithTheme(
      <List
        data={widgets}
        keyExtractor={(item) => item.id}
        renderItem={(item) => <ListItem title={item.name} />}
      />,
    );

    expect(screen.getByText('Gadget')).toBeTruthy();
    expect(screen.getByText('Gizmo')).toBeTruthy();
  });
});

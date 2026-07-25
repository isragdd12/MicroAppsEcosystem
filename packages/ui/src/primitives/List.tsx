import React from 'react';
import { FlatList, type FlatListProps } from 'react-native';

export interface ListProps<TItem> extends Omit<
  FlatListProps<TItem>,
  'data' | 'renderItem'
> {
  data: TItem[];
  renderItem: (item: TItem) => React.ReactElement;
  keyExtractor: (item: TItem) => string;
}

/**
 * A thin, themed wrapper over FlatList — see docs/UI_SYSTEM.md. Generic
 * over any item shape; a feature composes it with ListItem (or a
 * feature-specific row component) via `renderItem`. Contains no domain
 * knowledge of what TItem is.
 */
export function List<TItem>({
  data,
  renderItem,
  keyExtractor,
  ...rest
}: ListProps<TItem>) {
  return (
    <FlatList
      data={data}
      renderItem={({ item }) => renderItem(item)}
      keyExtractor={keyExtractor}
      {...rest}
    />
  );
}

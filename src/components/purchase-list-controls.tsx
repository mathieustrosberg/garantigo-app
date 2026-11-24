import { SearchField, Tabs } from 'heroui-native';
import { Text, View } from 'react-native';

import type { PurchaseSortKey } from '@/purchases/purchase-sort';

type PurchaseListControlsProps = {
  query: string;
  onQueryChange: (query: string) => void;
  sortKey: PurchaseSortKey;
  onSortKeyChange: (sortKey: PurchaseSortKey) => void;
};

/** Search field and sort choice shown above the list of purchases. */
export function PurchaseListControls({
  query,
  onQueryChange,
  sortKey,
  onSortKeyChange,
}: PurchaseListControlsProps) {
  return (
    <View className="gap-3">
      <SearchField value={query} onChange={onQueryChange}>
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input
            placeholder="Rechercher un achat"
            accessibilityLabel="Rechercher un achat"
            returnKeyType="search"
          />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>

      <View className="gap-1.5">
        <Text className="text-sm text-muted">Trier par</Text>
        <Tabs value={sortKey} onValueChange={(value) => onSortKeyChange(toSortKey(value))}>
          <Tabs.List>
            <Tabs.Indicator />
            <Tabs.Trigger value="purchaseDate">
              <Tabs.Label>Date d’achat</Tabs.Label>
            </Tabs.Trigger>
            <Tabs.Trigger value="warrantyEnd">
              <Tabs.Label>Fin de garantie</Tabs.Label>
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs>
      </View>
    </View>
  );
}

/** The tabs give back plain text: turn it into one of the two known sort keys. */
function toSortKey(value: string): PurchaseSortKey {
  return value === 'warrantyEnd' ? 'warrantyEnd' : 'purchaseDate';
}

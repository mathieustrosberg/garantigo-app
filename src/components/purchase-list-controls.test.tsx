import { fireEvent, render, screen } from '@testing-library/react-native';
import { HeroUINativeProvider } from 'heroui-native';

import type { PurchaseSortKey } from '@/purchases/purchase-sort';

import { PurchaseListControls } from './purchase-list-controls';

type RenderOptions = {
  query?: string;
  sortKey?: PurchaseSortKey;
  onQueryChange?: (query: string) => void;
  onSortKeyChange?: (sortKey: PurchaseSortKey) => void;
};

async function renderControls(options: RenderOptions = {}) {
  await render(
    <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
      <PurchaseListControls
        query={options.query ?? ''}
        onQueryChange={options.onQueryChange ?? (() => {})}
        sortKey={options.sortKey ?? 'purchaseDate'}
        onSortKeyChange={options.onSortKeyChange ?? (() => {})}
      />
    </HeroUINativeProvider>,
  );
}

describe('PurchaseListControls', () => {
  it('shows the search field and the two sort choices', async () => {
    await renderControls();

    expect(screen.getByPlaceholderText('Rechercher un achat')).toBeTruthy();
    expect(screen.getByText('Date d’achat')).toBeTruthy();
    expect(screen.getByText('Fin de garantie')).toBeTruthy();
  });

  it('shows the current search text', async () => {
    await renderControls({ query: 'casque' });

    expect(screen.getByDisplayValue('casque')).toBeTruthy();
  });

  it('reports the text typed in the search field', async () => {
    const onQueryChange = jest.fn();
    await renderControls({ onQueryChange });

    await fireEvent.changeText(screen.getByPlaceholderText('Rechercher un achat'), 'café');

    expect(onQueryChange).toHaveBeenCalledWith('café');
  });

  it('reports the sort choice pressed by the user', async () => {
    const onSortKeyChange = jest.fn();
    await renderControls({ onSortKeyChange });

    await fireEvent.press(screen.getByText('Fin de garantie'));

    expect(onSortKeyChange).toHaveBeenCalledWith('warrantyEnd');
  });

  it('lets the user come back to the sort by purchase date', async () => {
    const onSortKeyChange = jest.fn();
    await renderControls({ sortKey: 'warrantyEnd', onSortKeyChange });

    await fireEvent.press(screen.getByText('Date d’achat'));

    expect(onSortKeyChange).toHaveBeenCalledWith('purchaseDate');
  });
});

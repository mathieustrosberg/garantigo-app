import { fireEvent, render, screen } from '@testing-library/react-native';
import { HeroUINativeProvider } from 'heroui-native';

import { TabBar } from './tab-bar';

const ROUTES = [
  { key: 'index-key', name: 'index' },
  { key: 'warranties-key', name: 'warranties' },
];

type RenderOptions = {
  activeIndex?: number;
  onOpenTab?: (routeKey: string) => void;
  onAddPurchase?: () => void;
};

async function renderTabBar(options: RenderOptions = {}) {
  await render(
    <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
      <TabBar
        routes={ROUTES}
        activeIndex={options.activeIndex ?? 0}
        bottomInset={0}
        onOpenTab={options.onOpenTab ?? (() => {})}
        onAddPurchase={options.onAddPurchase ?? (() => {})}
      />
    </HeroUINativeProvider>,
  );
}

describe('TabBar', () => {
  it('shows the two tabs and the add button', async () => {
    await renderTabBar();

    expect(screen.getByText('Mes achats')).toBeTruthy();
    expect(screen.getByText('Mes garanties')).toBeTruthy();
    expect(screen.getByLabelText('Ajouter un achat')).toBeTruthy();
  });

  it('marks the tab currently shown as selected', async () => {
    await renderTabBar({ activeIndex: 1 });

    expect(screen.getByRole('tab', { name: 'Mes garanties', selected: true })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Mes achats', selected: false })).toBeTruthy();
  });

  it('opens a tab when it is pressed', async () => {
    const onOpenTab = jest.fn();
    await renderTabBar({ onOpenTab });

    await fireEvent.press(screen.getByText('Mes garanties'));

    expect(onOpenTab).toHaveBeenCalledWith('warranties-key');
  });

  it('opens the form from the add button', async () => {
    const onAddPurchase = jest.fn();
    await renderTabBar({ onAddPurchase });

    await fireEvent.press(screen.getByLabelText('Ajouter un achat'));

    expect(onAddPurchase).toHaveBeenCalledTimes(1);
  });
});

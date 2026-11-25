import { fireEvent, render, screen } from '@testing-library/react-native';
import { HeroUINativeProvider } from 'heroui-native';

import type { Purchase } from '@/purchases/purchase';
import { getWarranty } from '@/purchases/warranty';

import { PurchaseCard } from './purchase-card';

// Fixed reference date: the tests never depend on the day they run.
const TODAY = '2026-11-24';

const headphones: Purchase = {
  id: 'headphones',
  name: 'Casque audio',
  purchaseDate: '2026-11-18',
  warrantyMonths: 24,
  category: 'high-tech',
};

async function renderCard(purchase: Purchase, onPress: () => void = () => {}) {
  await render(
    <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
      <PurchaseCard purchase={purchase} warranty={getWarranty(purchase, TODAY)} onPress={onPress} />
    </HeroUINativeProvider>,
  );
}

describe('PurchaseCard', () => {
  it('shows the name, the end of the warranty, the days left and the status', async () => {
    await renderCard(headphones);

    expect(screen.getByText('Casque audio')).toBeTruthy();
    expect(screen.getByText('Fin le 18 novembre 2028')).toBeTruthy();
    expect(screen.getByText('725 jours restants')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('shows the icon of the category of the purchase', async () => {
    await renderCard(headphones);

    expect(
      screen.getByTestId('category-icon-high-tech', { includeHiddenElements: true }),
    ).toBeTruthy();
  });

  it('shows the icon of the "other" category when the purchase has no category', async () => {
    await renderCard({ ...headphones, category: undefined });

    expect(screen.getByTestId('category-icon-other', { includeHiddenElements: true })).toBeTruthy();
  });

  it('describes the purchase to screen readers in one sentence', async () => {
    await renderCard(headphones);

    expect(screen.getByLabelText('Casque audio, Active, 725 jours restants')).toBeTruthy();
  });

  it('writes the days since the end of an expired warranty', async () => {
    await renderCard({ ...headphones, purchaseDate: '2023-04-10' });

    expect(screen.getByText('Expirée depuis 593 jours')).toBeTruthy();
  });

  it('says that it is the last day of the warranty', async () => {
    await renderCard({ ...headphones, purchaseDate: '2024-11-24' });

    expect(screen.getByText('Dernier jour de garantie')).toBeTruthy();
  });

  it('calls onPress when the card is pressed', async () => {
    const onPress = jest.fn();
    await renderCard(headphones, onPress);

    await fireEvent.press(screen.getByText('Casque audio'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

import { fireEvent, render, screen } from '@testing-library/react-native';
import { HeroUINativeProvider } from 'heroui-native';

import type { Purchase } from '@/purchases/purchase';
import { getWarranty } from '@/purchases/warranty';
import type { PurchaseWithWarranty } from '@/purchases/warranty-groups';

import { NextWarrantyCard } from './next-warranty-card';

// Fixed reference date: the tests never depend on the day they run.
const TODAY = '2026-11-24';

const coffeeMachine: Purchase = {
  id: 'coffee-machine',
  name: 'Machine à café',
  purchaseDate: '2024-12-12',
  warrantyMonths: 24,
};

function withWarranty(purchase: Purchase): PurchaseWithWarranty {
  return { purchase, warranty: getWarranty(purchase, TODAY) };
}

async function renderCard(
  next: PurchaseWithWarranty | undefined,
  onOpenPurchase: (purchaseId: string) => void = () => {},
) {
  await render(
    <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
      <NextWarrantyCard next={next} onOpenPurchase={onOpenPurchase} />
    </HeroUINativeProvider>,
  );
}

describe('NextWarrantyCard', () => {
  it('shows the purchase, the days left and the end of its warranty', async () => {
    await renderCard(withWarranty(coffeeMachine));

    expect(screen.getByText('Prochaine échéance')).toBeTruthy();
    expect(screen.getByText('18')).toBeTruthy();
    expect(screen.getByText('jours restants')).toBeTruthy();
    expect(screen.getByText('Garantie de Machine à café')).toBeTruthy();
    expect(screen.getByText('Jusqu’au 12 décembre 2026')).toBeTruthy();
  });

  it('uses the singular for the last days', async () => {
    await renderCard(withWarranty({ ...coffeeMachine, purchaseDate: '2024-11-25' }));

    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('jour restant')).toBeTruthy();
  });

  it('describes the next end to screen readers in one sentence', async () => {
    await renderCard(withWarranty(coffeeMachine));

    expect(
      screen.getByLabelText('Prochaine échéance : Machine à café, 18 jours restants'),
    ).toBeTruthy();
  });

  it('opens the purchase when the card is pressed', async () => {
    const onOpenPurchase = jest.fn();
    await renderCard(withWarranty(coffeeMachine), onOpenPurchase);

    await fireEvent.press(screen.getByText('Garantie de Machine à café'));

    expect(onOpenPurchase).toHaveBeenCalledWith('coffee-machine');
  });

  it('says when every warranty has expired', async () => {
    await renderCard(undefined);

    expect(screen.getByText('Aucune garantie en cours : elles sont toutes expirées.')).toBeTruthy();
  });
});

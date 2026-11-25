import { render, screen } from '@testing-library/react-native';
import { HeroUINativeProvider } from 'heroui-native';

import type { WarrantyCounts } from '@/purchases/warranty-groups';

import { PurchaseOverview } from './purchase-overview';

async function renderOverview(totalCount: number, counts: WarrantyCounts) {
  await render(
    <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
      <PurchaseOverview totalCount={totalCount} counts={counts} />
    </HeroUINativeProvider>,
  );
}

describe('PurchaseOverview', () => {
  it('counts the saved purchases', async () => {
    await renderOverview(7, { active: 5, expiringSoon: 1, expired: 1 });

    expect(screen.getByLabelText('7 achats enregistrés')).toBeTruthy();
    expect(screen.getByText('Achats enregistrés')).toBeTruthy();
  });

  it('counts the warranties that still cover a purchase, expiring soon or not', async () => {
    await renderOverview(7, { active: 5, expiringSoon: 1, expired: 1 });

    expect(screen.getByLabelText('6 garanties en cours')).toBeTruthy();
  });

  it('uses the singular for a single purchase and a single warranty', async () => {
    await renderOverview(1, { active: 1, expiringSoon: 0, expired: 0 });

    expect(screen.getByLabelText('1 achat enregistré')).toBeTruthy();
    expect(screen.getByLabelText('1 garantie en cours')).toBeTruthy();
  });

  it('says how many warranties expire soon', async () => {
    await renderOverview(7, { active: 3, expiringSoon: 2, expired: 2 });

    expect(screen.getByText('2 garanties expirent bientôt.')).toBeTruthy();
  });

  it('says when no warranty expires soon', async () => {
    await renderOverview(2, { active: 1, expiringSoon: 0, expired: 1 });

    expect(screen.getByText('Aucune garantie n’expire bientôt.')).toBeTruthy();
  });
});

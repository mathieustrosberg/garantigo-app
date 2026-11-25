import { fireEvent, render, screen } from '@testing-library/react-native';
import { HeroUINativeProvider } from 'heroui-native';

import type { Purchase } from '@/purchases/purchase';
import { groupPurchasesByWarrantyStatus } from '@/purchases/warranty-groups';

import { WarrantyList } from './warranty-list';

// Fixed reference date: the tests never depend on the day they run.
const TODAY = '2026-11-24';

const headphones: Purchase = {
  id: 'headphones',
  name: 'Casque audio',
  purchaseDate: '2026-11-18',
  warrantyMonths: 24,
};

const coffeeMachine: Purchase = {
  id: 'coffee-machine',
  name: 'Machine à café',
  purchaseDate: '2024-12-12',
  warrantyMonths: 24,
};

const vacuum: Purchase = {
  id: 'vacuum',
  name: 'Aspirateur',
  purchaseDate: '2023-04-10',
  warrantyMonths: 24,
};

type RenderOptions = {
  onOpenPurchase?: (purchaseId: string) => void;
  onAddPurchase?: () => void;
};

async function renderList(purchases: Purchase[], options: RenderOptions = {}) {
  await render(
    <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
      <WarrantyList
        groups={groupPurchasesByWarrantyStatus(purchases, TODAY)}
        onOpenPurchase={options.onOpenPurchase ?? (() => {})}
        onAddPurchase={options.onAddPurchase ?? (() => {})}
      />
    </HeroUINativeProvider>,
  );
}

describe('WarrantyList', () => {
  it('counts the purchases of each group next to its title', async () => {
    await renderList([headphones, coffeeMachine, vacuum]);

    expect(screen.getAllByText('1 élément')).toHaveLength(3);
  });

  it('only unfolds the warranties that expire soon', async () => {
    await renderList([headphones, coffeeMachine, vacuum]);

    expect(screen.getByText('Machine à café')).toBeTruthy();
    expect(screen.queryByText('Casque audio')).toBeNull();
    expect(screen.queryByText('Aspirateur')).toBeNull();
  });

  it('shows each purchase with the end of its warranty and the days left', async () => {
    await renderList([headphones, coffeeMachine, vacuum]);
    await fireEvent.press(screen.getByText('Garanties actives'));
    await fireEvent.press(screen.getByText('Garanties expirées'));

    expect(screen.getByText('Machine à café')).toBeTruthy();
    expect(screen.getByText('Fin le 12 décembre 2026')).toBeTruthy();
    expect(screen.getByText('18 jours restants')).toBeTruthy();

    expect(screen.getByText('Casque audio')).toBeTruthy();
    expect(screen.getByText('725 jours restants')).toBeTruthy();

    expect(screen.getByText('Aspirateur')).toBeTruthy();
    expect(screen.getByText('Fin le 10 avril 2025')).toBeTruthy();
  });

  it('puts first the warranty that ends first', async () => {
    await renderList([headphones, coffeeMachine, vacuum]);

    expect(screen.getByText('Garantie de Machine à café')).toBeTruthy();
  });

  it('falls back on the active warranties when none expires soon', async () => {
    await renderList([headphones, vacuum]);

    expect(screen.getByText('Garantie de Casque audio')).toBeTruthy();
  });

  it('says when every warranty has expired', async () => {
    await renderList([vacuum]);

    expect(screen.getByText('Aucune garantie en cours : elles sont toutes expirées.')).toBeTruthy();
  });

  it('names the three groups', async () => {
    await renderList([headphones, coffeeMachine, vacuum]);

    expect(screen.getByText('Expirent bientôt')).toBeTruthy();
    expect(screen.getByText('Garanties actives')).toBeTruthy();
    expect(screen.getByText('Garanties expirées')).toBeTruthy();
  });

  it('explains when a group has no purchase', async () => {
    await renderList([headphones]);
    await fireEvent.press(screen.getByText('Garanties actives'));
    await fireEvent.press(screen.getByText('Garanties expirées'));

    expect(screen.getByText('Aucune garantie n’arrive à échéance dans les 30 jours.')).toBeTruthy();
    expect(screen.getByText('Aucune garantie expirée.')).toBeTruthy();
    expect(screen.queryByText('Aucune garantie active.')).toBeNull();
  });

  it('opens a purchase when its card is pressed', async () => {
    const onOpenPurchase = jest.fn();
    await renderList([headphones, coffeeMachine], { onOpenPurchase });

    await fireEvent.press(screen.getByText('Machine à café'));

    expect(onOpenPurchase).toHaveBeenCalledWith('coffee-machine');
  });

  it('invites the user to add a purchase when there is none', async () => {
    const onAddPurchase = jest.fn();
    await renderList([], { onAddPurchase });

    expect(screen.getByText('Aucune garantie à suivre')).toBeTruthy();
    expect(screen.queryByText('Garanties actives')).toBeNull();

    await fireEvent.press(screen.getByText('Ajouter un achat'));

    expect(onAddPurchase).toHaveBeenCalledTimes(1);
  });
});

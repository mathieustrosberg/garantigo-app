import { fireEvent, render, screen } from '@testing-library/react-native';
import { HeroUINativeProvider } from 'heroui-native';
import type { ReactNode } from 'react';
import { Text } from 'react-native';

import type { Purchase } from '@/purchases/purchase';

import { PurchaseList } from './purchase-list';

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
  totalCount?: number;
  controls?: ReactNode;
  onOpenPurchase?: (purchaseId: string) => void;
  onAddPurchase?: () => void;
};

async function renderList(purchases: Purchase[], options: RenderOptions = {}) {
  await render(
    <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
      <PurchaseList
        purchases={purchases}
        totalCount={options.totalCount}
        today={TODAY}
        controls={options.controls}
        onOpenPurchase={options.onOpenPurchase ?? (() => {})}
        onAddPurchase={options.onAddPurchase ?? (() => {})}
      />
    </HeroUINativeProvider>,
  );
}

describe('PurchaseList', () => {
  it('shows each purchase with the end of its warranty and the days left', async () => {
    await renderList([headphones, coffeeMachine, vacuum]);

    expect(screen.getByText('Casque audio')).toBeTruthy();
    expect(screen.getByText('Fin le 18 novembre 2028')).toBeTruthy();
    expect(screen.getByText('725 jours restants')).toBeTruthy();

    expect(screen.getByText('Machine à café')).toBeTruthy();
    expect(screen.getByText('18 jours restants')).toBeTruthy();

    expect(screen.getByText('Aspirateur')).toBeTruthy();
    expect(screen.getByText('Fin le 10 avril 2025')).toBeTruthy();
  });

  it('shows the warranty status of each purchase', async () => {
    await renderList([headphones, coffeeMachine, vacuum]);

    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText('Expire bientôt')).toBeTruthy();
    expect(screen.getByText('Expirée')).toBeTruthy();
  });

  it('keeps the order it is given', async () => {
    await renderList([vacuum, headphones, coffeeMachine]);

    const names = screen
      .getAllByText(/^(Casque audio|Machine à café|Aspirateur)$/)
      .map((element) => element.props.children);

    expect(names).toEqual(['Aspirateur', 'Casque audio', 'Machine à café']);
  });

  it('counts the purchases', async () => {
    await renderList([headphones, coffeeMachine, vacuum]);

    expect(screen.getByLabelText('3 achats enregistrés')).toBeTruthy();
  });

  it('uses the singular for a single purchase', async () => {
    await renderList([headphones]);

    expect(screen.getByLabelText('1 achat enregistré')).toBeTruthy();
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

    expect(screen.getByText('Aucun achat')).toBeTruthy();
    expect(screen.queryByLabelText(/achats? enregistrés?/)).toBeNull();

    await fireEvent.press(screen.getByText('Ajouter un achat'));

    expect(onAddPurchase).toHaveBeenCalledTimes(1);
  });

  it('shows the search and sort controls above the purchases', async () => {
    await renderList([headphones], { controls: <Text>Contrôles de recherche</Text> });

    expect(screen.getByText('Contrôles de recherche')).toBeTruthy();
    expect(screen.getByText('Casque audio')).toBeTruthy();
  });

  it('counts the saved purchases, not only the ones found by the search', async () => {
    await renderList([headphones], { totalCount: 3 });

    expect(screen.getByLabelText('3 achats enregistrés')).toBeTruthy();
  });

  it('says how many purchases are listed', async () => {
    await renderList([headphones, coffeeMachine, vacuum]);

    expect(screen.getByText('Tous les achats')).toBeTruthy();
    expect(screen.getByText('3 éléments')).toBeTruthy();
  });

  it('says how many purchases the search found', async () => {
    await renderList([headphones], { totalCount: 3 });

    expect(screen.getByText('Résultats')).toBeTruthy();
    expect(screen.getByText('1 élément')).toBeTruthy();
  });

  it('explains that the search found nothing, and keeps the controls visible', async () => {
    const onAddPurchase = jest.fn();
    await renderList([], {
      totalCount: 3,
      controls: <Text>Contrôles de recherche</Text>,
      onAddPurchase,
    });

    expect(screen.getByText('Aucun résultat')).toBeTruthy();
    expect(screen.getByText('Aucun achat ne correspond à votre recherche.')).toBeTruthy();
    expect(screen.getByText('Contrôles de recherche')).toBeTruthy();
    expect(screen.queryByText('Aucun achat')).toBeNull();
  });
});

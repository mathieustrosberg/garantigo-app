import { fireEvent, render, screen } from '@testing-library/react-native';
import { HeroUINativeProvider } from 'heroui-native';
import type { ReactElement } from 'react';

import { AccountProvider } from '@/account/account-context';
import PurchasesScreen from '@/app/(tabs)/index';
import WarrantiesScreen from '@/app/(tabs)/warranties';
import type { Purchase } from '@/purchases/purchase';
import { createInMemoryPurchaseStorage } from '@/storage/in-memory-purchase-storage';
import { PurchasesProvider } from '@/storage/purchases-context';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: mockPush }),
}));

// Fixed reference date: the tests never depend on the day they run.
jest.mock('@/purchases/purchase-date', () => ({
  ...jest.requireActual('@/purchases/purchase-date'),
  getToday: () => '2026-11-24',
}));

// Bought last, with the longest warranty.
const headphones: Purchase = {
  id: 'headphones',
  name: 'Casque audio',
  purchaseDate: '2026-11-18',
  warrantyMonths: 24,
};

// Warranty ends on 2026-12-12: it expires soon.
const coffeeMachine: Purchase = {
  id: 'coffee-machine',
  name: 'Machine à café',
  purchaseDate: '2024-12-12',
  warrantyMonths: 24,
};

// Bought first, warranty already expired.
const vacuum: Purchase = {
  id: 'vacuum',
  name: 'Aspirateur',
  purchaseDate: '2023-04-10',
  warrantyMonths: 24,
};

const PURCHASE_NAMES = /^(Casque audio|Machine à café|Aspirateur)$/;

async function renderScreen(screenElement: ReactElement, purchases: Purchase[]) {
  await render(
    <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
      {/* No online service in these tests: the screens work on the phone only. */}
      <AccountProvider client={null}>
        <PurchasesProvider storage={createInMemoryPurchaseStorage(purchases)}>
          {screenElement}
        </PurchasesProvider>
      </AccountProvider>
    </HeroUINativeProvider>,
  );
}

function getShownNames(): string[] {
  return screen.getAllByText(PURCHASE_NAMES).map((element) => String(element.props.children));
}

beforeEach(() => {
  mockPush.mockClear();
});

describe('PurchasesScreen', () => {
  it('shows the purchases, the most recent first', async () => {
    await renderScreen(<PurchasesScreen />, [vacuum, headphones, coffeeMachine]);
    await screen.findByLabelText('3 achats enregistrés');

    expect(getShownNames()).toEqual(['Casque audio', 'Machine à café', 'Aspirateur']);
  });

  it('counts the warranties that expire soon, whatever the search', async () => {
    await renderScreen(<PurchasesScreen />, [vacuum, headphones, coffeeMachine]);
    expect(await screen.findByText('1 garantie expire bientôt.')).toBeTruthy();

    await fireEvent.changeText(screen.getByPlaceholderText('Rechercher un achat'), 'casque');

    expect(screen.getByText('1 garantie expire bientôt.')).toBeTruthy();
  });

  it('says when no warranty expires soon', async () => {
    await renderScreen(<PurchasesScreen />, [vacuum, headphones]);

    expect(await screen.findByText('Aucune garantie n’expire bientôt.')).toBeTruthy();
  });

  it('sorts by warranty end when the user asks for it', async () => {
    await renderScreen(<PurchasesScreen />, [vacuum, headphones, coffeeMachine]);
    await screen.findByLabelText('3 achats enregistrés');

    await fireEvent.press(screen.getByText('Fin de garantie'));

    expect(getShownNames()).toEqual(['Aspirateur', 'Machine à café', 'Casque audio']);
  });

  it('only keeps the purchases found by the search, whatever the accents', async () => {
    await renderScreen(<PurchasesScreen />, [vacuum, headphones, coffeeMachine]);

    await fireEvent.changeText(await screen.findByPlaceholderText('Rechercher un achat'), 'cafe');

    expect(getShownNames()).toEqual(['Machine à café']);
    expect(screen.getByLabelText('3 achats enregistrés')).toBeTruthy();
  });

  it('says that the search found nothing and keeps the search field', async () => {
    await renderScreen(<PurchasesScreen />, [vacuum, headphones, coffeeMachine]);

    await fireEvent.changeText(await screen.findByPlaceholderText('Rechercher un achat'), 'vélo');

    expect(screen.getByText('Aucun résultat')).toBeTruthy();
    expect(screen.getByDisplayValue('vélo')).toBeTruthy();
    expect(screen.queryByText(PURCHASE_NAMES)).toBeNull();
  });

  it('opens the detail of a purchase', async () => {
    await renderScreen(<PurchasesScreen />, [vacuum, headphones, coffeeMachine]);

    await fireEvent.press(await screen.findByText('Machine à café'));

    expect(mockPush).toHaveBeenCalledWith('/purchases/coffee-machine');
  });

  it('invites the user to add a first purchase, without search field', async () => {
    await renderScreen(<PurchasesScreen />, []);

    expect(await screen.findByText('Aucun achat')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Rechercher un achat')).toBeNull();
  });
});

describe('WarrantiesScreen', () => {
  it('groups the purchases by warranty status at the current date', async () => {
    await renderScreen(<WarrantiesScreen />, [vacuum, headphones, coffeeMachine]);

    expect(
      await screen.findByLabelText('Prochaine échéance : Machine à café, 18 jours restants'),
    ).toBeTruthy();
    expect(screen.getAllByText('1 élément')).toHaveLength(3);
    expect(screen.getByText('18 jours restants')).toBeTruthy();
  });

  it('opens the detail of a purchase and the form to add one', async () => {
    await renderScreen(<WarrantiesScreen />, [coffeeMachine]);

    await fireEvent.press(await screen.findByText('Fin le 12 décembre 2026'));

    expect(mockPush).toHaveBeenCalledWith('/purchases/coffee-machine');
  });

  it('invites the user to add a purchase when there is none', async () => {
    await renderScreen(<WarrantiesScreen />, []);

    await fireEvent.press(await screen.findByText('Ajouter un achat'));

    expect(mockPush).toHaveBeenCalledWith('/purchases/new');
  });
});

import { fireEvent, render, screen } from '@testing-library/react-native';
import { HeroUINativeProvider } from 'heroui-native';

import type { Purchase } from '@/purchases/purchase';

import { PurchaseDetail } from './purchase-detail';

// Fixed reference date: the tests never depend on the day they run.
const TODAY = '2026-11-24';

const headphones: Purchase = {
  id: 'headphones',
  name: 'Casque audio',
  purchaseDate: '2026-11-18',
  warrantyMonths: 24,
  price: 349.99,
  category: 'high-tech',
};

async function renderDetail(purchase: Purchase, onEdit: () => void = () => {}) {
  await render(
    <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
      <PurchaseDetail purchase={purchase} today={TODAY} onEdit={onEdit} />
    </HeroUINativeProvider>,
  );
}

describe('PurchaseDetail', () => {
  it('shows the end of the warranty, the days left and the status', async () => {
    await renderDetail(headphones);

    expect(screen.getByText('Casque audio')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText('18 novembre 2028')).toBeTruthy();
    expect(screen.getByText('725 jours restants')).toBeTruthy();
  });

  it('shows every piece of information of the purchase', async () => {
    await renderDetail(headphones);

    expect(screen.getByLabelText('Date d’achat : 18 novembre 2026')).toBeTruthy();
    expect(screen.getByLabelText('Durée de garantie : 24 mois')).toBeTruthy();
    expect(screen.getByLabelText(/^Prix : 349,99\s€$/)).toBeTruthy();
    expect(screen.getByLabelText('Catégorie : High-tech')).toBeTruthy();
  });

  it('says when the price and the category are missing', async () => {
    await renderDetail({
      id: 'lamp',
      name: 'Lampe',
      purchaseDate: '2026-11-18',
      warrantyMonths: 12,
    });

    expect(screen.getByLabelText('Prix : Non renseigné')).toBeTruthy();
    expect(screen.getByLabelText('Catégorie : Non renseignée')).toBeTruthy();
  });

  it('still shows the days when the warranty has expired', async () => {
    await renderDetail({ ...headphones, purchaseDate: '2023-04-10' });

    expect(screen.getByText('Expirée')).toBeTruthy();
    expect(screen.getByText('10 avril 2025')).toBeTruthy();
    expect(screen.getByText('Expirée depuis 593 jours')).toBeTruthy();
  });

  it('warns on the last day of the warranty', async () => {
    await renderDetail({ ...headphones, purchaseDate: '2024-11-24' });

    expect(screen.getByText('Expire bientôt')).toBeTruthy();
    expect(screen.getByText('Dernier jour de garantie')).toBeTruthy();
  });

  it('opens the form from the edit button', async () => {
    const onEdit = jest.fn();
    await renderDetail(headphones, onEdit);

    await fireEvent.press(screen.getByText('Modifier'));

    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});

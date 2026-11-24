import type { Purchase } from './purchase';
import { searchPurchases } from './purchase-search';

function createPurchase(name: string): Purchase {
  return { id: name, name, purchaseDate: '2026-11-18', warrantyMonths: 24 };
}

const headphones = createPurchase('Casque Sony WH-1000XM5');
const coffeeMachine = createPurchase('Machine à café');
const laptop = createPurchase('Ordinateur portable');
const purchases = [headphones, coffeeMachine, laptop];

describe('searchPurchases', () => {
  it.each(['', '   '])('keeps every purchase when the search is empty ("%s")', (query) => {
    expect(searchPurchases(purchases, query)).toEqual(purchases);
  });

  it('keeps the purchases whose name contains the searched text', () => {
    expect(searchPurchases(purchases, 'Sony')).toEqual([headphones]);
    expect(searchPurchases(purchases, 'port')).toEqual([laptop]);
  });

  it('ignores upper and lower case', () => {
    expect(searchPurchases(purchases, 'CASQUE')).toEqual([headphones]);
    expect(searchPurchases(purchases, 'machine')).toEqual([coffeeMachine]);
  });

  it('ignores accents, in the search and in the names', () => {
    expect(searchPurchases(purchases, 'cafe')).toEqual([coffeeMachine]);
    expect(searchPurchases(purchases, 'CAFÉ')).toEqual([coffeeMachine]);
    expect(searchPurchases(purchases, 'ordinatéur')).toEqual([laptop]);
  });

  it('ignores the spaces around the searched text', () => {
    expect(searchPurchases(purchases, '  casque  ')).toEqual([headphones]);
  });

  it('can find several purchases, in their original order', () => {
    expect(searchPurchases(purchases, 'a')).toEqual([headphones, coffeeMachine, laptop]);
    expect(searchPurchases(purchases, 'ma')).toEqual([coffeeMachine]);
  });

  it('returns an empty list when nothing matches', () => {
    expect(searchPurchases(purchases, 'vélo')).toEqual([]);
  });
});

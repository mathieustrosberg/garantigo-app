import type { SupabaseClient } from '@supabase/supabase-js';
import { act, render, screen } from '@testing-library/react-native';
import { HeroUINativeProvider } from 'heroui-native';
import { Text } from 'react-native';

import { AccountProvider } from '@/account/account-context';

import { AccountGate } from './account-gate';

type Session = { user: { id: string; email?: string } } | null;

/** A stand-in for the online service: the test decides when someone signs in or out. */
function createFakeClient() {
  let listener: (event: string, session: Session) => void = () => {};
  const client = {
    auth: {
      onAuthStateChange(newListener: typeof listener) {
        listener = newListener;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      },
    },
  } as unknown as SupabaseClient;

  return { client, emit: (session: Session) => listener('SIGNED_IN', session) };
}

async function renderGate(client: SupabaseClient | null) {
  await render(
    <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
      <AccountProvider client={client}>
        <AccountGate>
          <Text>Mes achats</Text>
        </AccountGate>
      </AccountProvider>
    </HeroUINativeProvider>,
  );
}

describe('AccountGate', () => {
  it('shows neither the purchases nor the welcome while the saved session is read', async () => {
    const { client } = createFakeClient();

    await renderGate(client);

    expect(screen.queryByText('Mes achats')).toBeNull();
    expect(screen.queryByText('Créer un compte')).toBeNull();
  });

  it('asks to sign in or to create an account when nobody is signed in', async () => {
    const { client, emit } = createFakeClient();
    await renderGate(client);

    await act(async () => emit(null));

    expect(screen.getByText('Créer un compte')).toBeTruthy();
    expect(screen.getByText('J’ai déjà un compte')).toBeTruthy();
    expect(screen.queryByText('Mes achats')).toBeNull();
  });

  it('shows the purchases to a signed-in account', async () => {
    const { client, emit } = createFakeClient();
    await renderGate(client);

    await act(async () => emit({ user: { id: 'account-1', email: 'marie@example.com' } }));

    expect(screen.getByText('Mes achats')).toBeTruthy();
  });

  it('hides the purchases again after a sign-out', async () => {
    const { client, emit } = createFakeClient();
    await renderGate(client);
    await act(async () => emit({ user: { id: 'account-1' } }));

    await act(async () => emit(null));

    expect(screen.queryByText('Mes achats')).toBeNull();
    expect(screen.getByText('Créer un compte')).toBeTruthy();
  });

  it('asks for no account when the online service is not set up', async () => {
    await renderGate(null);

    expect(screen.getByText('Mes achats')).toBeTruthy();
  });
});

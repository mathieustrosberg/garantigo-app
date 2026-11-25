import type { SupabaseClient } from '@supabase/supabase-js';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { AccountProvider, useAccount } from './account-context';

type Session = { user: { id: string; email?: string } } | null;

/** A stand-in for the online service: the test decides when someone signs in or out. */
function createFakeClient() {
  let listener: (event: string, session: Session) => void = () => {};
  const unsubscribe = jest.fn();
  const auth = {
    onAuthStateChange(newListener: typeof listener) {
      listener = newListener;
      return { data: { subscription: { unsubscribe } } };
    },
    signInWithPassword: jest.fn(async () => ({ error: null })),
    signUp: jest.fn(async () => ({ data: { session: {} }, error: null })),
    signOut: jest.fn(async () => ({ error: null })),
  };

  return {
    client: { auth } as unknown as SupabaseClient,
    auth,
    unsubscribe,
    emit: (session: Session) => listener('SIGNED_IN', session),
  };
}

const CREDENTIALS = { email: 'marie@example.com', password: 'secret' };

function Probe() {
  const { status, account, signIn, signUp, signOut } = useAccount();

  return (
    <>
      <Text>{`${status} : ${account?.email ?? 'nobody'}`}</Text>
      <Pressable onPress={() => signIn(CREDENTIALS)}>
        <Text>Connexion</Text>
      </Pressable>
      <Pressable onPress={() => signUp(CREDENTIALS)}>
        <Text>Inscription</Text>
      </Pressable>
      <Pressable onPress={() => signOut()}>
        <Text>Déconnexion</Text>
      </Pressable>
    </>
  );
}

async function renderProbe(client: SupabaseClient | null) {
  return render(
    <AccountProvider client={client}>
      <Probe />
    </AccountProvider>,
  );
}

describe('AccountProvider', () => {
  it('says the online service is unavailable when it is not set up', async () => {
    await renderProbe(null);

    expect(screen.getByText('unavailable : nobody')).toBeTruthy();
  });

  it('waits for the session saved on the phone before saying nobody is signed in', async () => {
    const { client, emit } = createFakeClient();
    await renderProbe(client);
    expect(screen.getByText('loading : nobody')).toBeTruthy();

    await act(async () => emit(null));

    expect(screen.getByText('signedOut : nobody')).toBeTruthy();
  });

  it('follows the sign-ins and the sign-outs', async () => {
    const { client, emit } = createFakeClient();
    await renderProbe(client);

    await act(async () => emit({ user: { id: 'account-1', email: 'marie@example.com' } }));
    expect(screen.getByText('signedIn : marie@example.com')).toBeTruthy();

    await act(async () => emit(null));
    expect(screen.getByText('signedOut : nobody')).toBeTruthy();
  });

  it('signs in, signs up and signs out through the online service', async () => {
    const { client, auth } = createFakeClient();
    await renderProbe(client);

    await fireEvent.press(screen.getByText('Connexion'));
    await fireEvent.press(screen.getByText('Inscription'));
    await fireEvent.press(screen.getByText('Déconnexion'));

    expect(auth.signInWithPassword).toHaveBeenCalledWith(CREDENTIALS);
    expect(auth.signUp).toHaveBeenCalledWith(CREDENTIALS);
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('stops listening when it goes away', async () => {
    const { client, unsubscribe } = createFakeClient();
    const view = await renderProbe(client);

    await view.unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});

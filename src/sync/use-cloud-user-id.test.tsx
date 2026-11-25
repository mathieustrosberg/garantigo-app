import type { SupabaseClient } from '@supabase/supabase-js';
import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { useCloudUserId } from './use-cloud-user-id';

type Session = { user: { id: string } } | null;

/** A stand-in for the online service: the test decides when someone signs in or out. */
function createFakeClient() {
  let listener: (event: string, session: Session) => void = () => {};
  const unsubscribe = jest.fn();

  const client = {
    auth: {
      onAuthStateChange(newListener: typeof listener) {
        listener = newListener;
        return { data: { subscription: { unsubscribe } } };
      },
    },
  } as unknown as SupabaseClient;

  return { client, unsubscribe, emit: (session: Session) => listener('SIGNED_IN', session) };
}

function Probe({ client }: { client: SupabaseClient | null }) {
  const userId = useCloudUserId(client);
  return <Text>{userId ?? 'nobody'}</Text>;
}

describe('useCloudUserId', () => {
  it('says nobody is signed in when the online service is not set up', async () => {
    await render(<Probe client={null} />);

    expect(screen.getByText('nobody')).toBeTruthy();
  });

  it('follows the sign-ins and the sign-outs', async () => {
    const { client, emit } = createFakeClient();
    await render(<Probe client={client} />);
    expect(screen.getByText('nobody')).toBeTruthy();

    await act(async () => emit({ user: { id: 'account-1' } }));
    expect(screen.getByText('account-1')).toBeTruthy();

    await act(async () => emit(null));
    expect(screen.getByText('nobody')).toBeTruthy();
  });

  it('stops listening when the screen goes away', async () => {
    const { client, unsubscribe } = createFakeClient();
    const view = await render(<Probe client={client} />);

    await view.unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});

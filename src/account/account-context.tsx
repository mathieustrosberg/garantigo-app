import type { SupabaseClient } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { Credentials } from './account-validation';
import { ACCOUNT_ERROR_MESSAGES, AccountError, signIn, signOut, signUp } from './cloud-account';

/** The account signed in on this phone. */
export type CloudAccount = {
  id: string;
  email: string;
};

/**
 * - 'unavailable': the online service is not set up, the application works on the phone only.
 * - 'loading': the session saved on the phone is being read.
 * - 'signedOut': nobody is signed in.
 * - 'signedIn': `account` is the signed-in account.
 */
export type AccountStatus = 'unavailable' | 'loading' | 'signedOut' | 'signedIn';

type AccountContextValue = {
  status: AccountStatus;
  account: CloudAccount | null;
  /** The three functions below reject with an AccountError, whose message is written for the user. */
  signIn: (credentials: Credentials) => Promise<void>;
  signUp: (credentials: Credentials) => Promise<void>;
  signOut: () => Promise<void>;
};

const AccountContext = createContext<AccountContextValue | null>(null);

type AccountProviderProps = {
  /** The connection to the online service, or null when it is not set up. */
  client: SupabaseClient | null;
  children: ReactNode;
};

/** Follows who is signed in on this phone, and shares it with every screen. */
export function AccountProvider({ client, children }: AccountProviderProps) {
  const [account, setAccount] = useState<CloudAccount | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (client === null) return;

    // Called once at launch with the session saved on the phone, then at each sign-in and sign-out.
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setAccount(
        session === null ? null : { id: session.user.id, email: session.user.email ?? '' },
      );
      setIsLoaded(true);
    });

    return () => data.subscription.unsubscribe();
  }, [client]);

  function requireClient(): SupabaseClient {
    if (client === null) throw new AccountError(ACCOUNT_ERROR_MESSAGES.unknown);
    return client;
  }

  const value: AccountContextValue = {
    status: getStatus(client, isLoaded, account),
    account,
    signIn: async (credentials) => signIn(requireClient(), credentials),
    signUp: async (credentials) => signUp(requireClient(), credentials),
    signOut: async () => signOut(requireClient()),
  };

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

function getStatus(
  client: SupabaseClient | null,
  isLoaded: boolean,
  account: CloudAccount | null,
): AccountStatus {
  if (client === null) return 'unavailable';
  if (!isLoaded) return 'loading';
  return account === null ? 'signedOut' : 'signedIn';
}

export function useAccount(): AccountContextValue {
  const context = useContext(AccountContext);
  if (context === null) {
    throw new Error('useAccount must be used inside an AccountProvider');
  }
  return context;
}

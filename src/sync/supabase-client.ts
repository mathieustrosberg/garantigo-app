import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type CloudClientOptions = {
  /**
   * The function that sends the requests. Left out in the application.
   * The test against the real service gives its own: the one of the test environment sends nothing.
   */
  fetch?: typeof fetch;
};

/**
 * Creates the connection to the online service that keeps the accounts and a copy of the purchases.
 * Returns null when the address or the key is missing: the application then stays on the phone only.
 */
export function createCloudClient(
  url: string | undefined,
  publishableKey: string | undefined,
  options: CloudClientOptions = {},
): SupabaseClient | null {
  if (!url || !publishableKey) return null;

  return createClient(url, publishableKey, {
    global: { fetch: options.fetch },
    auth: {
      // The session is kept on the phone, so the user stays signed in after a restart.
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      // There is no web page to come back to after signing in: nothing to read in a URL.
      detectSessionInUrl: false,
    },
  });
}

/**
 * The connection used by the whole application. Its address and its key come from the `.env` file.
 * The key is the publishable one: it is meant to be public, the access rules of the database
 * are what keeps each account private.
 */
export const cloudClient = createCloudClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_KEY,
);

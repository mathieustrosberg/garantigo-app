import type { SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

/**
 * Id of the signed-in account, or null when nobody is signed in.
 * It follows the sign-ins and sign-outs, and the session found on the phone at launch.
 */
export function useCloudUserId(client: SupabaseClient | null): string | null {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (client === null) return;

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, [client]);

  return userId;
}

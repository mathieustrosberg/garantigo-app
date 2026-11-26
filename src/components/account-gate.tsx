import { Button, Spinner } from 'heroui-native';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useAccount } from '@/account/account-context';
import { READ_ERROR_MESSAGE } from '@/storage/storage-error-message';
import { useSync } from '@/sync/sync-context';

import { AuthScreen } from './auth-screen';

type AccountGateProps = {
  children: ReactNode;
};

/**
 * Shows the screens only to a signed-in account, and only its own purchases:
 * nobody sees purchases without signing in, nor those of the account signed in before.
 * When the online service is not set up, the application works on the phone only, without account.
 */
export function AccountGate({ children }: AccountGateProps) {
  const { status, signIn, signUp } = useAccount();
  const { phoneCopyStatus, syncNow } = useSync();

  if (status === 'signedOut') {
    return <AuthScreen onSignIn={signIn} onSignUp={signUp} />;
  }

  // Reading the saved session is quick: this avoids a flash of the welcome screen at launch.
  // Right after a sign-in, the phone may still hold the purchases of another account:
  // they stay hidden until the phone copy is checked.
  if (status === 'loading' || phoneCopyStatus === 'checking') {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner />
      </View>
    );
  }

  if (phoneCopyStatus === 'failed') {
    return (
      <View className="flex-1 justify-center gap-4 bg-background p-6">
        <Text className="text-2xl font-bold text-foreground">Chargement impossible</Text>
        <Text className="text-base text-muted">{READ_ERROR_MESSAGE}</Text>
        <Button onPress={syncNow}>Réessayer</Button>
      </View>
    );
  }

  return children;
}

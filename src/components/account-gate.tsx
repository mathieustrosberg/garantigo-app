import { Spinner } from 'heroui-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useAccount } from '@/account/account-context';

import { AuthScreen } from './auth-screen';

type AccountGateProps = {
  children: ReactNode;
};

/**
 * Shows the screens only to a signed-in account: nobody sees purchases without signing in.
 * When the online service is not set up, the application works on the phone only, without account.
 */
export function AccountGate({ children }: AccountGateProps) {
  const { status, signIn, signUp } = useAccount();

  // Reading the saved session is quick: this avoids a flash of the welcome screen at launch.
  if (status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner />
      </View>
    );
  }

  if (status === 'signedOut') {
    return <AuthScreen onSignIn={signIn} onSignUp={signUp} />;
  }

  return children;
}

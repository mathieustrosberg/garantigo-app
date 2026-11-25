import { Text, View } from 'react-native';

import { useAccount } from '@/account/account-context';
import { AccountPanel } from '@/components/account-panel';
import { useSync } from '@/sync/sync-context';

export default function AccountScreen() {
  const { account, signOut } = useAccount();
  const { status, syncNow } = useSync();

  // Only reachable when the online service is not set up: there is no account to show.
  if (account === null) {
    return (
      <View className="flex-1 justify-center bg-background p-6">
        <Text className="text-center text-base text-muted">
          La synchronisation n’est pas configurée sur cette installation.
        </Text>
      </View>
    );
  }

  return (
    <AccountPanel
      email={account.email}
      syncStatus={status}
      onSignOut={signOut}
      onSyncNow={syncNow}
    />
  );
}

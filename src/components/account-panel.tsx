import { Button, Card } from 'heroui-native';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { ACCOUNT_ERROR_MESSAGES, AccountError } from '@/account/cloud-account';
import type { SyncStatus } from '@/sync/sync-context';

const SYNC_LABELS: Record<SyncStatus, string> = {
  signedOut: 'Vos achats restent sur ce téléphone.',
  syncing: 'Synchronisation en cours…',
  synced: 'Vos achats sont synchronisés.',
  failed:
    'Synchronisation impossible pour le moment. Vos achats restent sur ce téléphone et seront envoyés dès que possible.',
};

type AccountPanelProps = {
  /** E-mail of the signed-in account. */
  email: string;
  syncStatus: SyncStatus;
  /** Rejects with an AccountError: its message is shown above the button. */
  onSignOut: () => Promise<void>;
  onSyncNow: () => void;
};

/** Content of the account screen: who is signed in, the state of the synchronisation, the sign-out. */
export function AccountPanel({ email, syncStatus, onSignOut, onSyncNow }: AccountPanelProps) {
  const [signOutError, setSignOutError] = useState<string | undefined>(undefined);

  async function signOut() {
    setSignOutError(undefined);
    try {
      await onSignOut();
    } catch (error) {
      setSignOutError(
        error instanceof AccountError ? error.message : ACCOUNT_ERROR_MESSAGES.unknown,
      );
    }
  }

  function confirmSignOut() {
    Alert.alert(
      'Se déconnecter ?',
      'Vos achats restent enregistrés sur votre compte. Reconnectez-vous pour les retrouver.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se déconnecter', style: 'destructive', onPress: signOut },
      ],
    );
  }

  // "automatic" makes iOS start the content below the navigation header instead of under it.
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-background"
      contentContainerClassName="gap-5 p-6"
    >
      <Card className="gap-1 border border-border">
        <Text className="text-sm text-muted">Connecté avec</Text>
        <Text className="text-lg font-semibold text-foreground">{email}</Text>
      </Card>

      <Card className="gap-4 border border-border">
        <View className="gap-1">
          <Text className="text-sm font-semibold text-muted">Synchronisation</Text>
          <Text className="text-base text-foreground">{SYNC_LABELS[syncStatus]}</Text>
        </View>
        <Button variant="secondary" onPress={onSyncNow} isDisabled={syncStatus === 'syncing'}>
          Synchroniser maintenant
        </Button>
      </Card>

      {signOutError !== undefined && <Text className="text-base text-danger">{signOutError}</Text>}

      <Button variant="danger-soft" onPress={confirmSignOut}>
        Se déconnecter
      </Button>
    </ScrollView>
  );
}

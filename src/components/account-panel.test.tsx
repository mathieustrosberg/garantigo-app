import { fireEvent, render, screen } from '@testing-library/react-native';
import { HeroUINativeProvider } from 'heroui-native';
import { Alert, type AlertButton } from 'react-native';

import { ACCOUNT_ERROR_MESSAGES, AccountError } from '@/account/cloud-account';
import type { SyncStatus } from '@/sync/sync-context';

import { AccountPanel } from './account-panel';

type RenderOptions = {
  syncStatus?: SyncStatus;
  onSignOut?: () => Promise<void>;
  onSyncNow?: () => void;
};

async function renderPanel(options: RenderOptions = {}) {
  await render(
    <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
      <AccountPanel
        email="marie@example.com"
        syncStatus={options.syncStatus ?? 'synced'}
        onSignOut={options.onSignOut ?? (async () => {})}
        onSyncNow={options.onSyncNow ?? (() => {})}
      />
    </HeroUINativeProvider>,
  );
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('AccountPanel', () => {
  it('shows the e-mail of the signed-in account', async () => {
    await renderPanel();

    expect(screen.getByText('marie@example.com')).toBeTruthy();
  });

  it.each([
    ['syncing', 'Synchronisation en cours…'],
    ['synced', 'Vos achats sont synchronisés.'],
    ['failed', /^Synchronisation impossible pour le moment\./],
  ] as const)('says where the synchronisation stands: %s', async (syncStatus, label) => {
    await renderPanel({ syncStatus });

    expect(screen.getByText(label)).toBeTruthy();
  });

  it('synchronises when asked', async () => {
    const onSyncNow = jest.fn();
    await renderPanel({ syncStatus: 'failed', onSyncNow });

    await fireEvent.press(screen.getByText('Synchroniser maintenant'));

    expect(onSyncNow).toHaveBeenCalledTimes(1);
  });

  describe('signing out', () => {
    let alert: jest.SpyInstance;

    beforeEach(() => {
      alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    });

    /** Presses one of the buttons of the confirmation shown by Alert.alert. */
    async function pressAlertButton(text: string) {
      const buttons: AlertButton[] = alert.mock.calls[0][2];
      await buttons.find((button) => button.text === text)?.onPress?.();
    }

    it('asks for a confirmation and says that the purchases stay on the account', async () => {
      const onSignOut = jest.fn(async () => {});
      await renderPanel({ onSignOut });

      await fireEvent.press(screen.getByText('Se déconnecter'));

      expect(alert).toHaveBeenCalledWith(
        'Se déconnecter ?',
        'Vos achats restent enregistrés sur votre compte. Reconnectez-vous pour les retrouver.',
        expect.any(Array),
      );
      expect(onSignOut).not.toHaveBeenCalled();
    });

    it('signs out once confirmed', async () => {
      const onSignOut = jest.fn(async () => {});
      await renderPanel({ onSignOut });

      await fireEvent.press(screen.getByText('Se déconnecter'));
      await pressAlertButton('Se déconnecter');

      expect(onSignOut).toHaveBeenCalledTimes(1);
    });

    it('stays signed in when the confirmation is cancelled', async () => {
      const onSignOut = jest.fn(async () => {});
      await renderPanel({ onSignOut });

      await fireEvent.press(screen.getByText('Se déconnecter'));
      await pressAlertButton('Annuler');

      expect(onSignOut).not.toHaveBeenCalled();
    });

    it('explains why the sign-out failed', async () => {
      const onSignOut = jest.fn(async () => {
        throw new AccountError(ACCOUNT_ERROR_MESSAGES.offline);
      });
      await renderPanel({ onSignOut });

      await fireEvent.press(screen.getByText('Se déconnecter'));
      await pressAlertButton('Se déconnecter');

      expect(await screen.findByText(ACCOUNT_ERROR_MESSAGES.offline)).toBeTruthy();
    });
  });
});

import { fireEvent, render, screen } from '@testing-library/react-native';
import { HeroUINativeProvider } from 'heroui-native';

import type { Credentials } from '@/account/account-validation';
import { ACCOUNT_ERROR_MESSAGES, AccountError } from '@/account/cloud-account';

import { AuthScreen } from './auth-screen';

type Handler = (credentials: Credentials) => Promise<void>;

async function renderScreen(handlers: { onSignIn?: Handler; onSignUp?: Handler } = {}) {
  await render(
    <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
      <AuthScreen
        onSignIn={handlers.onSignIn ?? (async () => {})}
        onSignUp={handlers.onSignUp ?? (async () => {})}
      />
    </HeroUINativeProvider>,
  );
}

async function type(placeholder: string, text: string) {
  await fireEvent.changeText(screen.getByPlaceholderText(placeholder), text);
}

const EMAIL = 'Ex. marie@exemple.fr';
const PASSWORD = '6 caractères au minimum';
const CONFIRMATION = 'Le même mot de passe';

describe('AuthScreen', () => {
  it('welcomes the user and offers to create an account or to sign in', async () => {
    await renderScreen();

    expect(screen.getByText('GarantiGo')).toBeTruthy();
    expect(screen.getByText('Créer un compte')).toBeTruthy();
    expect(screen.getByText('J’ai déjà un compte')).toBeTruthy();
    expect(screen.queryByPlaceholderText(EMAIL)).toBeNull();
  });

  it('signs in with the e-mail and the password typed', async () => {
    const onSignIn = jest.fn(async () => {});
    await renderScreen({ onSignIn });

    await fireEvent.press(screen.getByText('J’ai déjà un compte'));
    await type(EMAIL, 'marie@example.com');
    await type(PASSWORD, 'secret');
    await fireEvent.press(screen.getByText('Me connecter'));

    expect(onSignIn).toHaveBeenCalledWith({ email: 'marie@example.com', password: 'secret' });
  });

  it('does not ask to confirm the password when signing in', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByText('J’ai déjà un compte'));

    expect(screen.queryByPlaceholderText(CONFIRMATION)).toBeNull();
  });

  it('creates an account once the password is typed twice', async () => {
    const onSignIn = jest.fn(async () => {});
    const onSignUp = jest.fn(async () => {});
    await renderScreen({ onSignIn, onSignUp });

    await fireEvent.press(screen.getByText('Créer un compte'));
    await type(EMAIL, 'marie@example.com');
    await type(PASSWORD, 'secret');
    await type(CONFIRMATION, 'secret');
    await fireEvent.press(screen.getByText('Créer mon compte'));

    expect(onSignUp).toHaveBeenCalledWith({ email: 'marie@example.com', password: 'secret' });
    expect(onSignIn).not.toHaveBeenCalled();
  });

  it('creates no account when the two passwords differ', async () => {
    const onSignUp = jest.fn(async () => {});
    await renderScreen({ onSignUp });

    await fireEvent.press(screen.getByText('Créer un compte'));
    await type(EMAIL, 'marie@example.com');
    await type(PASSWORD, 'secret');
    await type(CONFIRMATION, 'secrte');
    await fireEvent.press(screen.getByText('Créer mon compte'));

    expect(screen.getByText('Les deux mots de passe ne sont pas identiques.')).toBeTruthy();
    expect(onSignUp).not.toHaveBeenCalled();
  });

  it('shows an error under each field and sends nothing when the form is wrong', async () => {
    const onSignIn = jest.fn(async () => {});
    await renderScreen({ onSignIn });

    await fireEvent.press(screen.getByText('J’ai déjà un compte'));
    await type(EMAIL, 'marie');
    await type(PASSWORD, '123');
    await fireEvent.press(screen.getByText('Me connecter'));

    expect(screen.getByText('Cette adresse e-mail n’est pas valide.')).toBeTruthy();
    expect(screen.getByText('Le mot de passe doit contenir au moins 6 caractères.')).toBeTruthy();
    expect(onSignIn).not.toHaveBeenCalled();
  });

  it('explains why the sign-in failed and keeps what was typed', async () => {
    const onSignIn = jest.fn(async () => {
      throw new AccountError(ACCOUNT_ERROR_MESSAGES.wrongCredentials);
    });
    await renderScreen({ onSignIn });

    await fireEvent.press(screen.getByText('J’ai déjà un compte'));
    await type(EMAIL, 'marie@example.com');
    await type(PASSWORD, 'secret');
    await fireEvent.press(screen.getByText('Me connecter'));

    expect(await screen.findByText('E-mail ou mot de passe incorrect.')).toBeTruthy();
    expect(screen.getByDisplayValue('marie@example.com')).toBeTruthy();
    expect(screen.getByText('Me connecter')).toBeTruthy();
  });

  it('hides the passwords while they are typed', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByText('Créer un compte'));

    expect(screen.getByPlaceholderText(PASSWORD).props.secureTextEntry).toBe(true);
    expect(screen.getByPlaceholderText(CONFIRMATION).props.secureTextEntry).toBe(true);
  });

  it('switches from signing in to creating an account, with an empty form', async () => {
    await renderScreen();
    await fireEvent.press(screen.getByText('J’ai déjà un compte'));
    await type(EMAIL, 'marie@example.com');

    await fireEvent.press(screen.getByText('Pas encore de compte ? Créer un compte'));

    expect(screen.getByText('Créer votre compte')).toBeTruthy();
    expect(screen.queryByDisplayValue('marie@example.com')).toBeNull();
  });

  it('goes back to the welcome', async () => {
    await renderScreen();
    await fireEvent.press(screen.getByText('Créer un compte'));

    await fireEvent.press(screen.getByText('Retour'));

    expect(screen.getByText('J’ai déjà un compte')).toBeTruthy();
  });
});

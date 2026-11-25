import type { SupabaseClient } from '@supabase/supabase-js';

import {
  ACCOUNT_ERROR_MESSAGES,
  AccountError,
  getAccountErrorMessage,
  signIn,
  signOut,
  signUp,
} from './cloud-account';

const CREDENTIALS = { email: 'marie@example.com', password: 'secret' };

type Answer = { data?: { session: object | null }; error: object | null };

/** A stand-in for the online service: it answers what the test says. */
function createFakeClient(answer: Answer) {
  const auth = {
    signInWithPassword: jest.fn(async () => answer),
    signUp: jest.fn(async () => answer),
    signOut: jest.fn(async () => answer),
  };
  return { client: { auth } as unknown as SupabaseClient, auth };
}

describe('signIn', () => {
  it('sends the e-mail and the password to the online service', async () => {
    const { client, auth } = createFakeClient({ error: null });

    await signIn(client, CREDENTIALS);

    expect(auth.signInWithPassword).toHaveBeenCalledWith(CREDENTIALS);
  });

  it('explains that the e-mail or the password is wrong', async () => {
    const { client } = createFakeClient({ error: { code: 'invalid_credentials' } });

    await expect(signIn(client, CREDENTIALS)).rejects.toEqual(
      new AccountError(ACCOUNT_ERROR_MESSAGES.wrongCredentials),
    );
  });
});

describe('signUp', () => {
  it('creates the account', async () => {
    const { client, auth } = createFakeClient({ data: { session: {} }, error: null });

    await signUp(client, CREDENTIALS);

    expect(auth.signUp).toHaveBeenCalledWith(CREDENTIALS);
  });

  it('explains that the e-mail already has an account', async () => {
    const { client } = createFakeClient({ error: { code: 'user_already_exists' } });

    await expect(signUp(client, CREDENTIALS)).rejects.toEqual(
      new AccountError(ACCOUNT_ERROR_MESSAGES.emailAlreadyUsed),
    );
  });

  it('asks to confirm the e-mail when the service does not sign in right away', async () => {
    const { client } = createFakeClient({ data: { session: null }, error: null });

    await expect(signUp(client, CREDENTIALS)).rejects.toEqual(
      new AccountError(ACCOUNT_ERROR_MESSAGES.emailToConfirm),
    );
  });
});

describe('signOut', () => {
  it('signs out of this phone only', async () => {
    const { client, auth } = createFakeClient({ error: null });

    await signOut(client);

    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });
});

describe('getAccountErrorMessage', () => {
  it.each([
    ['invalid_credentials', ACCOUNT_ERROR_MESSAGES.wrongCredentials],
    ['user_already_exists', ACCOUNT_ERROR_MESSAGES.emailAlreadyUsed],
    ['email_exists', ACCOUNT_ERROR_MESSAGES.emailAlreadyUsed],
    ['email_address_invalid', ACCOUNT_ERROR_MESSAGES.invalidEmail],
    ['weak_password', ACCOUNT_ERROR_MESSAGES.weakPassword],
    ['over_request_rate_limit', ACCOUNT_ERROR_MESSAGES.tooManyAttempts],
  ])('explains the code "%s"', (code, message) => {
    expect(getAccountErrorMessage({ code })).toBe(message);
  });

  it('says there is no connection when the service cannot be reached', () => {
    expect(getAccountErrorMessage({ name: 'AuthRetryableFetchError', status: 0 })).toBe(
      ACCOUNT_ERROR_MESSAGES.offline,
    );
  });

  it('gives a general message for an unknown failure', () => {
    expect(getAccountErrorMessage({ code: 'something_new' })).toBe(ACCOUNT_ERROR_MESSAGES.unknown);
  });
});

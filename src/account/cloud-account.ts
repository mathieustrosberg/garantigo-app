import type { SupabaseClient } from '@supabase/supabase-js';

import type { Credentials } from './account-validation';

/** A sign-in, sign-up or sign-out that failed. Its message is written for the user, in French. */
export class AccountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccountError';
  }
}

export const ACCOUNT_ERROR_MESSAGES = {
  wrongCredentials: 'E-mail ou mot de passe incorrect.',
  emailAlreadyUsed: 'Un compte existe déjà avec cette adresse e-mail. Connectez-vous.',
  invalidEmail: 'Cette adresse e-mail n’est pas acceptée.',
  weakPassword: 'Ce mot de passe est trop simple. Choisissez-en un plus long.',
  tooManyAttempts: 'Trop de tentatives. Réessayez dans quelques minutes.',
  offline: 'Pas de connexion. Vérifiez le réseau, puis réessayez.',
  emailToConfirm: 'Compte créé. Confirmez votre adresse e-mail, puis connectez-vous.',
  unknown: 'La connexion au compte a échoué. Réessayez dans un instant.',
} as const;

/** What the online service says about a failure: a code, or nothing when the network failed. */
type ServiceError = {
  code?: string;
  status?: number;
  name?: string;
};

/** Rejects with an AccountError when the e-mail or the password is wrong. */
export async function signIn(client: SupabaseClient, credentials: Credentials): Promise<void> {
  const { error } = await client.auth.signInWithPassword(credentials);
  if (error) throw new AccountError(getAccountErrorMessage(error));
}

/** Creates the account and signs in. Rejects with an AccountError when it cannot. */
export async function signUp(client: SupabaseClient, credentials: Credentials): Promise<void> {
  const { data, error } = await client.auth.signUp(credentials);
  if (error) throw new AccountError(getAccountErrorMessage(error));

  // Without a session, the service is waiting for the e-mail to be confirmed.
  if (data.session === null) throw new AccountError(ACCOUNT_ERROR_MESSAGES.emailToConfirm);
}

/**
 * Signs out of this phone only: the other phones of the account stay signed in.
 * The purchases stay on the phone.
 */
export async function signOut(client: SupabaseClient): Promise<void> {
  const { error } = await client.auth.signOut({ scope: 'local' });
  if (error) throw new AccountError(getAccountErrorMessage(error));
}

export function getAccountErrorMessage(error: ServiceError): string {
  switch (error.code) {
    case 'invalid_credentials':
      return ACCOUNT_ERROR_MESSAGES.wrongCredentials;
    case 'user_already_exists':
    case 'email_exists':
      return ACCOUNT_ERROR_MESSAGES.emailAlreadyUsed;
    case 'email_address_invalid':
    case 'validation_failed':
      return ACCOUNT_ERROR_MESSAGES.invalidEmail;
    case 'weak_password':
      return ACCOUNT_ERROR_MESSAGES.weakPassword;
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return ACCOUNT_ERROR_MESSAGES.tooManyAttempts;
  }

  // The service could not be reached at all: there is no code to read.
  if (error.name === 'AuthRetryableFetchError' || error.status === 0) {
    return ACCOUNT_ERROR_MESSAGES.offline;
  }

  return ACCOUNT_ERROR_MESSAGES.unknown;
}

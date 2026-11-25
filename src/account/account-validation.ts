/** What the user typed in the account form. */
export type AccountFormValues = {
  email: string;
  password: string;
  /** The password typed a second time. Only asked when creating an account. */
  passwordConfirmation?: string;
};

export type Credentials = {
  email: string;
  password: string;
};

export type AccountFormErrors = Partial<
  Record<'email' | 'password' | 'passwordConfirmation', string>
>;

export type AccountFormResult =
  { isValid: true; credentials: Credentials } | { isValid: false; errors: AccountFormErrors };

/** Smallest password the online service accepts. */
export const MIN_PASSWORD_LENGTH = 6;

// Something, an @, something, a dot, something: enough to catch a typing mistake.
const EMAIL_FORMAT = /^\S+@\S+\.\S+$/;

export function validateAccountForm(values: AccountFormValues): AccountFormResult {
  const email = values.email.trim().toLowerCase();
  const errors: AccountFormErrors = {};

  if (email === '') {
    errors.email = 'Indiquez votre adresse e-mail.';
  } else if (!EMAIL_FORMAT.test(email)) {
    errors.email = 'Cette adresse e-mail n’est pas valide.';
  }

  if (values.password === '') {
    errors.password = 'Indiquez votre mot de passe.';
  } else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`;
  }

  if (
    values.passwordConfirmation !== undefined &&
    values.passwordConfirmation !== values.password
  ) {
    errors.passwordConfirmation = 'Les deux mots de passe ne sont pas identiques.';
  }

  if (Object.keys(errors).length > 0) return { isValid: false, errors };

  // The password is kept as typed: a space in it is part of it.
  return { isValid: true, credentials: { email, password: values.password } };
}

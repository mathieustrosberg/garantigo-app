import { validateAccountForm } from './account-validation';

describe('validateAccountForm', () => {
  it('accepts an e-mail and a password of six characters', () => {
    expect(validateAccountForm({ email: 'marie@example.com', password: 'secret' })).toEqual({
      isValid: true,
      credentials: { email: 'marie@example.com', password: 'secret' },
    });
  });

  it('cleans the e-mail: no space around it, no capital letter', () => {
    const result = validateAccountForm({ email: '  Marie@Example.com ', password: 'secret' });

    expect(result).toEqual({
      isValid: true,
      credentials: { email: 'marie@example.com', password: 'secret' },
    });
  });

  it('keeps the password exactly as typed', () => {
    const result = validateAccountForm({ email: 'marie@example.com', password: ' Secret 1 ' });

    expect(result.isValid && result.credentials.password).toBe(' Secret 1 ');
  });

  it('asks for the e-mail and the password when they are missing', () => {
    expect(validateAccountForm({ email: ' ', password: '' })).toEqual({
      isValid: false,
      errors: {
        email: 'Indiquez votre adresse e-mail.',
        password: 'Indiquez votre mot de passe.',
      },
    });
  });

  it.each(['marie', 'marie@example', 'marie example@mail.com', '@example.com'])(
    'refuses the e-mail "%s"',
    (email) => {
      expect(validateAccountForm({ email, password: 'secret' })).toEqual({
        isValid: false,
        errors: { email: 'Cette adresse e-mail n’est pas valide.' },
      });
    },
  );

  it('refuses a password of five characters', () => {
    expect(validateAccountForm({ email: 'marie@example.com', password: '12345' })).toEqual({
      isValid: false,
      errors: { password: 'Le mot de passe doit contenir au moins 6 caractères.' },
    });
  });

  it('refuses a confirmation that differs from the password', () => {
    const result = validateAccountForm({
      email: 'marie@example.com',
      password: 'secret',
      passwordConfirmation: 'secrte',
    });

    expect(result).toEqual({
      isValid: false,
      errors: { passwordConfirmation: 'Les deux mots de passe ne sont pas identiques.' },
    });
  });

  it('accepts a confirmation identical to the password', () => {
    const result = validateAccountForm({
      email: 'marie@example.com',
      password: 'secret',
      passwordConfirmation: 'secret',
    });

    expect(result.isValid).toBe(true);
  });
});

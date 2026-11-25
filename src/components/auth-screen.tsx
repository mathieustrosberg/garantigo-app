import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Button, FieldError, Input, Label, TextField } from 'heroui-native';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  validateAccountForm,
  type AccountFormErrors,
  type Credentials,
} from '@/account/account-validation';
import { ACCOUNT_ERROR_MESSAGES, AccountError } from '@/account/cloud-account';
import { useOnBrandColor } from '@/theme/brand-colors';

import { SymbolTile } from './symbol-tile';

type Step = 'welcome' | 'signIn' | 'signUp';

type AuthScreenProps = {
  /** Both functions reject with an AccountError: its message is shown under the form. */
  onSignIn: (credentials: Credentials) => Promise<void>;
  onSignUp: (credentials: Credentials) => Promise<void>;
};

/**
 * First screen of the application when nobody is signed in:
 * a welcome, then the form to sign in or to create an account.
 */
export function AuthScreen({ onSignIn, onSignUp }: AuthScreenProps) {
  const [step, setStep] = useState<Step>('welcome');

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-6 p-6"
        >
          {step === 'welcome' ? (
            <Welcome onChoose={setStep} />
          ) : (
            // The key empties the form when the user switches between the two.
            <AccountForm
              key={step}
              mode={step}
              onSubmit={step === 'signIn' ? onSignIn : onSignUp}
              onChoose={setStep}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

type Benefit = {
  symbol: SymbolViewProps['name'];
  text: string;
};

const BENEFITS: Benefit[] = [
  {
    symbol: { ios: 'arrow.triangle.2.circlepath', android: 'sync' },
    text: 'Retrouvez vos achats sur tous vos téléphones.',
  },
  {
    symbol: { ios: 'camera.fill', android: 'photo_camera' },
    text: 'Gardez la photo de chaque ticket de caisse.',
  },
  {
    symbol: { ios: 'clock', android: 'schedule' },
    text: 'Sachez quelle garantie se termine bientôt.',
  },
];

function Welcome({ onChoose }: { onChoose: (step: Step) => void }) {
  const onBrandColor = useOnBrandColor();

  return (
    <>
      <View className="mt-4 gap-4">
        <View className="size-16 items-center justify-center rounded-3xl bg-accent">
          <SymbolView
            name={{ ios: 'checkmark.shield', android: 'verified_user' }}
            size={32}
            tintColor={onBrandColor}
          />
        </View>
        <View className="gap-1">
          <Text accessibilityRole="header" className="text-4xl font-bold text-foreground">
            GarantiGo
          </Text>
          <Text className="text-base text-muted">
            Vos achats, vos tickets et vos garanties, toujours avec vous.
          </Text>
        </View>
      </View>

      <View className="gap-3">
        {BENEFITS.map((benefit) => (
          <View key={benefit.text} className="flex-row items-center gap-3">
            <SymbolTile name={benefit.symbol} />
            <Text className="flex-1 text-base text-foreground">{benefit.text}</Text>
          </View>
        ))}
      </View>

      <View className="gap-3">
        <Button onPress={() => onChoose('signUp')}>Créer un compte</Button>
        <Button variant="secondary" onPress={() => onChoose('signIn')}>
          J’ai déjà un compte
        </Button>
      </View>
    </>
  );
}

const FORM_TEXTS = {
  signIn: {
    title: 'Bon retour',
    subtitle: 'Connectez-vous pour retrouver vos achats.',
    submit: 'Me connecter',
    submitting: 'Connexion…',
    switchLabel: 'Pas encore de compte ? Créer un compte',
  },
  signUp: {
    title: 'Créer votre compte',
    subtitle: 'Vos achats seront sauvegardés en ligne et disponibles sur tous vos téléphones.',
    submit: 'Créer mon compte',
    submitting: 'Création du compte…',
    switchLabel: 'Déjà un compte ? Se connecter',
  },
} as const;

type AccountFormProps = {
  mode: 'signIn' | 'signUp';
  onSubmit: (credentials: Credentials) => Promise<void>;
  onChoose: (step: Step) => void;
};

function AccountForm({ mode, onSubmit, onChoose }: AccountFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<AccountFormErrors>({});
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const texts = FORM_TEXTS[mode];
  const isSignUp = mode === 'signUp';

  async function handleSubmit() {
    const result = validateAccountForm({
      email,
      password,
      // The confirmation is only checked when the account is being created.
      passwordConfirmation: isSignUp ? passwordConfirmation : undefined,
    });
    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setSubmitError(undefined);
    setIsSubmitting(true);
    try {
      // On success the whole screen goes away: there is nothing left to update here.
      await onSubmit(result.credentials);
    } catch (error) {
      setSubmitError(
        error instanceof AccountError ? error.message : ACCOUNT_ERROR_MESSAGES.unknown,
      );
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <View className="flex-row">
        <Button variant="ghost" size="sm" onPress={() => onChoose('welcome')}>
          Retour
        </Button>
      </View>

      <View className="gap-1">
        <Text accessibilityRole="header" className="text-3xl font-bold text-foreground">
          {texts.title}
        </Text>
        <Text className="text-base text-muted">{texts.subtitle}</Text>
      </View>

      <TextField isRequired isInvalid={errors.email !== undefined}>
        <Label>Adresse e-mail</Label>
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="Ex. marie@exemple.fr"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="username"
        />
        <FieldError>{errors.email}</FieldError>
      </TextField>

      <TextField isRequired isInvalid={errors.password !== undefined}>
        <Label>Mot de passe</Label>
        <Input
          value={password}
          onChangeText={setPassword}
          placeholder="6 caractères au minimum"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          textContentType={isSignUp ? 'newPassword' : 'password'}
        />
        <FieldError>{errors.password}</FieldError>
      </TextField>

      {isSignUp && (
        <TextField isRequired isInvalid={errors.passwordConfirmation !== undefined}>
          <Label>Confirmer le mot de passe</Label>
          <Input
            value={passwordConfirmation}
            onChangeText={setPasswordConfirmation}
            placeholder="Le même mot de passe"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
          />
          <FieldError>{errors.passwordConfirmation}</FieldError>
        </TextField>
      )}

      {submitError !== undefined && <Text className="text-base text-danger">{submitError}</Text>}

      <View className="gap-3">
        <Button onPress={handleSubmit} isDisabled={isSubmitting}>
          {isSubmitting ? texts.submitting : texts.submit}
        </Button>
        <Button
          variant="ghost"
          onPress={() => onChoose(isSignUp ? 'signIn' : 'signUp')}
          isDisabled={isSubmitting}
        >
          {texts.switchLabel}
        </Button>
      </View>
    </>
  );
}

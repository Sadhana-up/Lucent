import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  AuthFooter, AuthShell, Button, Divider, ErrorNote, Field, GoogleMark,
} from '../../components/lucent/ui';
import { useBallNav } from '../../components/lucent/transition';
import { C, F } from '../../components/lucent/theme';
import { authClient } from '../../lib/auth-client';

const STRENGTH = ['', 'WEAK', 'FAIR', 'GOOD', 'STRONG'];
const STRENGTH_COLOR = ['', C.danger, '#D9A441', C.sageLt, C.sage];

function StrengthMeter({ score }: { score: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= score ? STRENGTH_COLOR[score] : C.line }}
        />
      ))}
      <Text style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 1.4, color: C.ink2, width: 56, textAlign: 'right' }}>
        {STRENGTH[score]}
      </Text>
    </View>
  );
}

export default function SignUp() {
  const nav = useBallNav();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  const score = password.length === 0 ? 0 : Math.max(1,
    (password.length >= 8 ? 1 : 0) + (/\d/.test(password) ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) + (password.length >= 12 ? 1 : 0));

  const submit = async () => {
    setError('');
    if (name.trim().length < 2 || !emailOk || password.length < 8) {
      setError('Enter your name, a valid email and a password of at least 8 characters.');
      return;
    }

    setLoading(true);
    const { error } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      setError(error.message ?? 'Something went wrong. Please try again.');
      return;
    }
    nav.replace('/(app)/onboarding', { dir: 1 });
  };

  const google = async () => {
    setError('');
    setLoading(true);
    const { error } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: 'lucent://',
    });
    setLoading(false);

    if (error) {
      setError(error.message ?? 'Google sign-up failed. Please try again.');
      return;
    }
    nav.replace('/(app)/home', { dir: 1 });
  };

  return (
    <AuthShell
      eyebrow="LUCENT  /  JOIN"
      title="Create your" italic="account."
      subtitle="A few details and your skin journey begins."
      footer={
        <AuthFooter
          lead="Already a member?" action="Sign in"
          onPress={(e) => nav.replace('/(auth)/sign-in', { dir: -1, y: e.nativeEvent.pageY })}
        />
      }
    >
      <Field
        label="Full name" icon="user" value={name} onChangeText={setName} placeholder="Your name"
        autoComplete="name" textContentType="name" valid={name.trim().length > 1}
      />
      <Field
        label="Email" icon="mail" value={email} onChangeText={setEmail} placeholder="you@example.com" valid={emailOk}
        keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress"
      />
      <View style={{ gap: 12 }}>
        <Field
          label="Password" icon="lock" secure value={password} onChangeText={setPassword}
          placeholder="At least 8 characters" autoCapitalize="none" textContentType="newPassword"
        />
        {password.length > 0 && <StrengthMeter score={score} />}
      </View>

      {!!error && <ErrorNote text={error} />}

      <View style={{ gap: 18 }}>
        <Button label="Create account" arrow loading={loading} onPress={submit} />
        <Divider text="OR" />
        <Button label="Continue with Google" variant="outline" icon={<GoogleMark />} onPress={google} />
        <Text style={s.terms}>By continuing you agree to Lucent’s Terms and Privacy Policy.</Text>
      </View>
    </AuthShell>
  );
}

const s = StyleSheet.create({
  terms: { fontFamily: F.sansRegular, fontSize: 12, lineHeight: 18, color: C.muted, textAlign: 'center', paddingHorizontal: 8 },
});

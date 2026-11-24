import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  AuthFooter, AuthShell, Button, Divider, ErrorNote, Field, GoogleMark,
} from '../../components/lucent/ui';
import { useBallNav } from '../../components/lucent/transition';
import { C, F } from '../../components/lucent/theme';
import { authClient } from '../../lib/auth-client';

export default function SignIn() {
  const nav = useBallNav();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());

  const submit = async () => {
    setError('');
    if (!emailOk || !password) {
      setError('Enter a valid email and your password.');
      return;
    }

    setLoading(true);
    const { error } = await authClient.signIn.email({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      setError(error.message ?? 'Invalid email or password');
      return;
    }
    nav.replace('/(app)/home', { dir: 1 });
  };

  const google = async () => {
    setError('');
    setLoading(true);
    const { error } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/',
    });
    setLoading(false);

    if (error) {
      setError(error.message ?? 'Google sign-in failed. Please try again.');
      return;
    }
    // On native, signIn.social does not navigate for you.
    nav.replace('/(app)/home', { dir: 1 });
  };

  return (
    <AuthShell
      eyebrow="LUCENT  /  SIGN IN"
      title="Welcome" italic="back."
      subtitle="Sign in to pick up your routine where you left off."
      footer={
        <AuthFooter
          lead="New to Lucent?" action="Create an account"
          onPress={(e) => nav.replace('/(auth)/sign-up', { dir: 1, y: e.nativeEvent.pageY })}
        />
      }
    >
      <Field
        label="Email" icon="mail" value={email} onChangeText={setEmail} placeholder="you@example.com" valid={emailOk}
        keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress"
      />
      <View>
        <Field
          label="Password" icon="lock" secure value={password} onChangeText={setPassword}
          placeholder="Your password" autoCapitalize="none" autoComplete="password" textContentType="password"
        />
        <Pressable
          onPress={(e) => nav.push('/(auth)/forgot-password', { dir: 1, y: e.nativeEvent.pageY })}
          hitSlop={10} style={{ alignSelf: 'flex-end', marginTop: 14 }}
        >
          <Text style={{ fontFamily: F.sans, fontSize: 13, color: C.sage }}>Forgot password?</Text>
        </Pressable>
      </View>

      {!!error && <ErrorNote text={error} />}

      <View style={{ gap: 18 }}>
        <Button label="Sign in" arrow loading={loading} onPress={submit} />
        <Divider text="OR" />
        <Button label="Continue with Google" variant="outline" icon={<GoogleMark />} onPress={google} />
      </View>
    </AuthShell>
  );
}
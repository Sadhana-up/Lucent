import { useState } from 'react';
import { Text } from 'react-native';
import { AuthShell, Button, ErrorNote, Field } from '../../components/lucent/ui';
import { useBallNav } from '../../components/lucent/transition';
import { C, F } from '../../components/lucent/theme';
import { authClient } from '../../lib/auth-client';

/**
 * In-app password reset via the email OTP plugin that is already enabled on
 * the Next.js server. No deep link or web reset page required.
 */
export default function ForgotPassword() {
  const nav = useBallNav();
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());

  const sendCode = async () => {
    setError('');
    if (!emailOk) {
      setError('Enter the email address you signed up with.');
      return;
    }

    setLoading(true);
    const { error } = await authClient.emailOtp.requestPasswordReset({ email: email.trim() });
    setLoading(false);

    if (error) {
      setError(error.message ?? 'Could not send the code. Please try again.');
      return;
    }
    setStep('reset');
  };

  const reset = async () => {
    setError('');
    if (code.trim().length < 6 || password.length < 8) {
      setError('Enter the 6-digit code and a password of at least 8 characters.');
      return;
    }

    setLoading(true);
    const { error } = await authClient.emailOtp.resetPassword({
      email: email.trim(),
      otp: code.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      setError(error.message ?? 'Invalid or expired code. Please try again.');
      return;
    }
    setStep('done');
  };

  if (step === 'done') {
    return (
      <AuthShell
        title="Password"
        italic="updated."
        subtitle="Your password has been changed. Sign in with the new one."
      >
        <Text style={{ fontFamily: F.sansRegular, fontSize: 14, color: C.ink2 }}>
          All other sessions were signed out for your security.
        </Text>
        <Button label="Back to sign in" arrow onPress={() => nav.replace('/(auth)/sign-in', { dir: -1 })} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your"
      italic="password"
      subtitle={
        step === 'email'
          ? 'We will email you a 6-digit code to reset your password.'
          : `Enter the code we sent to ${email.trim()}.`
      }
    >
      {step === 'email' ? (
        <>
          <Field
            label="Email" icon="mail" value={email} onChangeText={setEmail} placeholder="you@example.com" valid={emailOk}
            keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress"
          />
          {!!error && <ErrorNote text={error} />}
          <Button label="Send code" arrow loading={loading} onPress={sendCode} />
        </>
      ) : (
        <>
          <Field
            label="Reset code" icon="key" value={code} onChangeText={setCode} placeholder="123456"
            keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={6}
          />
          <Field
            label="New password" icon="lock" secure value={password} onChangeText={setPassword}
            placeholder="At least 8 characters" autoCapitalize="none" textContentType="newPassword"
          />
          {!!error && <ErrorNote text={error} />}
          <Button label="Reset password" arrow loading={loading} onPress={reset} />
        </>
      )}
    </AuthShell>
  );
}

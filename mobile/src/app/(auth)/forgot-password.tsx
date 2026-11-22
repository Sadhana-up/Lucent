import { AuthShell, Button } from '../../components/lucent/ui';

/** Placeholder so the sign-in link has a working destination until auth is wired. */
export default function ForgotPassword() {
  return (
    <AuthShell title="Reset your" italic="password" subtitle="Password reset will be available once authentication is connected.">
      <Button label="Back to sign in" variant="outline" />
    </AuthShell>
  );
}

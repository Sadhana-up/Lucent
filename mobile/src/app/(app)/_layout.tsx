import { Redirect, Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { colors } from '../../theme/tokens';
import { authClient } from '../../lib/auth-client';
import { ImpersonationBanner } from '../../components/lucent/impersonation-banner';

/** Guards the entire (app) tree. Enforces:
 *  - Signed-in session (redirects to sign-in if not)
 *  - Onboarding for customers (redirects to onboarding if not completed)
 *  - Banned users (redirects back to sign-in)
 */
export default function AppLayout() {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending || !data) return;

    const user = data.user as any;
    const role = (user?.role || 'customer').toLowerCase();

    // If the account is banned, sign out and redirect
    if (user?.banned) {
      void authClient.signOut().then(() => {
        router.replace('/(auth)/sign-in');
      });
      return;
    }

    // Customers who haven't completed onboarding get redirected
    if (role === 'customer' && user?.onboardingCompleted === false) {
      router.replace('/(app)/onboarding');
    }
  }, [data, isPending, router]);

  if (isPending) return <View style={{ flex: 1, backgroundColor: colors.cream }} />;
  if (!data) return <Redirect href="/(auth)/sign-in" />;

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.cream },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="wishlist" options={{ headerShown: false }} />
        <Stack.Screen name="routine" options={{ headerShown: false }} />
        <Stack.Screen name="product/[slug]" options={{ headerShown: false }} />
        <Stack.Screen name="shop/[slug]" options={{ headerShown: false }} />
        <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="seller/new-product" options={{ headerShown: false }} />
        <Stack.Screen name="seller/edit-product" options={{ headerShown: false }} />
        <Stack.Screen name="seller/orders" options={{ headerShown: false }} />
        <Stack.Screen name="seller/profile" options={{ headerShown: false }} />
        <Stack.Screen name="admin/index" options={{ headerShown: false }} />
      </Stack>
      <ImpersonationBanner />
    </View>
  );
}

import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';
import { colors } from '../../theme/tokens';
import { authClient } from '../../lib/auth-client';

/** Only signed-in users may reach anything inside (app). */
export default function AppLayout() {
  const { data, isPending } = authClient.useSession();

  if (isPending) return <View style={{ flex: 1, backgroundColor: colors.cream }} />;
  if (!data) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.cream },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="product/[slug]" options={{ headerShown: false }} />
      <Stack.Screen name="shop/[slug]" options={{ headerShown: false }} />
      <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="seller/new-product" options={{ headerShown: false }} />
    </Stack>
  );
}

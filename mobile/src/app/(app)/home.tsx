import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button, Icon, Logo } from '../../components/lucent/ui';
import { C, F } from '../../components/lucent/theme';
import { authClient } from '../../lib/auth-client';

const ROLE_LABEL: Record<string, string> = {
  customer: 'Customer',
  seller: 'Seller',
  admin: 'Admin',
};

export default function Home() {
  const { top, bottom } = useSafeAreaInsets();
  const { data } = authClient.useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const user = data?.user;
  const role = ROLE_LABEL[user?.role ?? ''] ?? 'Member';
  const initial = (user?.name?.trim()?.[0] ?? user?.email?.[0] ?? 'L').toUpperCase();

  const signOut = async () => {
    setError('');
    setBusy(true);
    const { error } = await authClient.signOut();
    setBusy(false);
    // The (app) layout redirects to sign-in once the session clears.
    if (error) setError(error.message ?? 'Could not sign out. Please try again.');
  };

  return (
    <View style={s.root}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: top + 16, paddingBottom: bottom + 32, paddingHorizontal: 22 }}
      >
        <View style={s.header}>
          <Logo />
        </View>

        <Animated.View entering={FadeInDown.duration(600)} style={s.hero}>
          <View style={s.eyebrowRow}>
            <View style={s.dot} />
            <Text style={s.eyebrow}>SIGNED IN</Text>
          </View>
          <Text style={s.title}>Hello,</Text>
          <Text style={[s.title, s.titleItalic]}>{user?.name?.split(' ')[0] ?? 'there'}.</Text>
          <Text style={s.sub}>Your session lives on the Lucent server and is kept securely on this device.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(600)} style={s.card}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initial}</Text>
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={s.name} numberOfLines={1}>{user?.name ?? 'Lucent member'}</Text>
            <Text style={s.email} numberOfLines={1}>{user?.email}</Text>
          </View>
          <View style={s.chip}>
            <Text style={s.chipText}>{role.toUpperCase()}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(220).duration(600)} style={s.card}>
          <View style={s.row}>
            <Icon name="shield" size={19} color={C.sage} />
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>Secure session</Text>
              <Text style={s.rowNote}>Cookies are stored in the device keychain and sent to the Next.js backend (the single auth server for web and mobile).</Text>
            </View>
          </View>
        </Animated.View>

        {!!error && <Text style={s.error}>{error}</Text>}

        <View style={{ marginTop: 28 }}>
          <Button label="Sign out" variant="outline" loading={busy} onPress={signOut} />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  hero: { marginTop: 38, marginBottom: 26 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.sageLt },
  eyebrow: { fontFamily: F.mono, fontSize: 10.5, letterSpacing: 2, color: C.ink2 },
  title: { fontFamily: F.serif, fontSize: 46, lineHeight: 48, color: C.ink, letterSpacing: -0.8 },
  titleItalic: { fontFamily: F.serifItalic, color: C.sage },
  sub: { fontFamily: F.sansRegular, fontSize: 14, lineHeight: 21, color: C.ink2, marginTop: 14, maxWidth: 320 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: '#fff', marginBottom: 14,
    shadowColor: C.sageDk, shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 3,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.sageGhost, borderWidth: 1, borderColor: C.line,
  },
  avatarText: { fontFamily: F.serifBold, fontSize: 24, color: C.sage },
  name: { fontFamily: F.sans, fontSize: 16, color: C.ink },
  email: { fontFamily: F.sansRegular, fontSize: 13, color: C.ink2 },
  chip: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999, backgroundColor: C.sageGhost },
  chipText: { fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1.2, color: C.sage },

  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  rowTitle: { fontFamily: F.sans, fontSize: 14.5, color: C.ink, marginBottom: 3 },
  rowNote: { fontFamily: F.sansRegular, fontSize: 13, lineHeight: 19, color: C.ink2 },

  error: { fontFamily: F.sansRegular, fontSize: 13, color: C.danger, marginTop: 4 },
});

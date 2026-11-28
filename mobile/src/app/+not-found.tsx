import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { C, F, R } from '../components/lucent/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotFoundScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={s.iconBox}>
        <Feather name="compass" size={40} color={C.sage} />
      </View>
      <Text style={s.code}>404</Text>
      <Text style={s.title}>Page Not Found</Text>
      <Text style={s.sub}>
        This page doesn't exist or has been moved. Let's get you back on track.
      </Text>
      <Pressable style={s.btn} onPress={() => router.replace('/(app)/(tabs)')}>
        <Feather name="home" size={16} color="#fff" />
        <Text style={s.btnText}>Go to Shop</Text>
      </Pressable>
      <Pressable style={s.linkBtn} onPress={() => router.back()}>
        <Text style={s.linkText}>← Go Back</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFAF8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EDF5EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  code: {
    fontFamily: F.mono,
    fontSize: 13,
    letterSpacing: 3,
    color: C.muted,
    marginBottom: 8,
  },
  title: {
    fontFamily: F.serifBold,
    fontSize: 28,
    color: C.ink,
    textAlign: 'center',
    marginBottom: 10,
  },
  sub: {
    fontFamily: F.sansRegular,
    fontSize: 14,
    color: C.ink2,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.sage,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: R.pill,
    marginBottom: 14,
  },
  btnText: {
    fontFamily: F.sans,
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  linkBtn: { paddingVertical: 8 },
  linkText: {
    fontFamily: F.sans,
    fontSize: 13,
    color: C.sage,
  },
});

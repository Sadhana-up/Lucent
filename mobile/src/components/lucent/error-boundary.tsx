import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { C, F, R } from './theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ErrorProps = { error: Error; retry?: () => void };

export default function ErrorBoundary({ error, retry }: ErrorProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={s.iconBox}>
        <Feather name="alert-triangle" size={36} color={C.danger} />
      </View>
      <Text style={s.title}>Something went wrong</Text>
      <Text style={s.msg} numberOfLines={4}>
        {error.message || 'An unexpected error occurred. Please try again.'}
      </Text>
      {retry && (
        <Pressable style={s.btn} onPress={retry}>
          <Feather name="refresh-cw" size={16} color="#fff" />
          <Text style={s.btnText}>Try Again</Text>
        </Pressable>
      )}
      <Pressable style={s.linkBtn} onPress={() => router.replace('/(app)/(tabs)')}>
        <Text style={s.linkText}>Go to Shop</Text>
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
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: F.serifBold,
    fontSize: 24,
    color: C.ink,
    textAlign: 'center',
    marginBottom: 10,
  },
  msg: {
    fontFamily: F.sansRegular,
    fontSize: 13,
    color: C.ink2,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.sage,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: R.pill,
    marginBottom: 12,
  },
  btnText: { fontFamily: F.sans, fontSize: 14, color: '#fff', fontWeight: '600' },
  linkBtn: { paddingVertical: 8 },
  linkText: { fontFamily: F.sans, fontSize: 13, color: C.sage },
});

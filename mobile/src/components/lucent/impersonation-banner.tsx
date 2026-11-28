import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { authClient } from '../../lib/auth-client';
import { F, R } from './theme';

/** Floating banner shown while an admin is impersonating another user. */
export function ImpersonationBanner() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: session, refetch } = authClient.useSession();
  const [stopping, setStopping] = useState(false);

  const impersonatedBy = (session?.session as { impersonatedBy?: string | null } | null)
    ?.impersonatedBy;

  if (!impersonatedBy) return null;

  const handleStop = async () => {
    setStopping(true);
    try {
      const { error } = await authClient.admin.stopImpersonating();
      if (error) {
        Alert.alert('Could not stop impersonating', error.message);
        return;
      }
      await refetch();
      router.replace('/(app)/(tabs)/dashboard');
    } catch {
      Alert.alert('Could not stop impersonating', 'Please try again.');
    } finally {
      setStopping(false);
    }
  };

  return (
    <View style={[s.wrap, { bottom: insets.bottom + 72 }]}>
      <Feather name="eye" size={15} color="#92400E" />
      <View style={s.textBox}>
        <Text style={s.title} numberOfLines={1}>
          Impersonating {session?.user?.name || 'user'}
        </Text>
        <Text style={s.sub} numberOfLines={1}>
          {session?.user?.email}
        </Text>
      </View>
      <Pressable style={s.stopBtn} disabled={stopping} onPress={handleStop}>
        {stopping ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Feather name="log-out" size={12} color="#FFFFFF" />
            <Text style={s.stopText}>Stop</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  textBox: { flex: 1, minWidth: 0 },
  title: { fontFamily: F.sans, fontSize: 12.5, color: '#92400E', fontWeight: '700' },
  sub: { fontFamily: F.sansRegular, fontSize: 10.5, color: '#B45309', marginTop: 1 },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#92400E',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: R.pill,
    minWidth: 66,
    justifyContent: 'center',
  },
  stopText: { fontFamily: F.sans, fontSize: 11.5, color: '#FFFFFF', fontWeight: '700' },
});

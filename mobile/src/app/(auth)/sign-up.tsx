import { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  AuthFooter, AuthShell, Button, Divider, ErrorNote, Field, GoogleMark, Icon,
} from '../../components/lucent/ui';
import type { IconName } from '../../components/lucent/ui';
import { useBallNav } from '../../components/lucent/transition';
import { C, F } from '../../components/lucent/theme';

type Role = 'customer' | 'seller';
const ROLES: { key: Role; title: string; note: string; icon: IconName }[] = [
  { key: 'customer', title: 'Customer', note: 'Get a routine made for your skin.', icon: 'user' },
  { key: 'seller', title: 'Seller', note: 'List your products on Lucent.', icon: 'shopping-bag' },
];
const STRENGTH = ['', 'WEAK', 'FAIR', 'GOOD', 'STRONG'];
const STRENGTH_COLOR = ['', C.danger, '#D9A441', C.sageLt, C.sage];

/** Segmented control with a thumb that springs between the two options. */
function RoleSwitch({ value, onChange }: { value: Role; onChange: (r: Role) => void }) {
  const idx = value === 'customer' ? 0 : 1;
  const [w, setW] = useState(0);
  const pos = useSharedValue(idx);

  useEffect(() => {
    pos.value = withSpring(idx, { damping: 18, stiffness: 240 });
  }, [idx, pos]);

  const half = Math.max(0, (w - 8) / 2);
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: pos.value * half }] }));

  return (
    <View style={{ gap: 10 }}>
      <View style={s.seg} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}>
        {w > 0 && <Animated.View style={[s.thumb, { width: half }, thumb]} />}
        {ROLES.map((r) => {
          const on = r.key === value;
          return (
            <Pressable
              key={r.key}
              style={s.segItem}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => {
                if (!on) void Haptics.selectionAsync().catch(() => {});
                onChange(r.key);
              }}
            >
              <Icon name={r.icon} size={17} color={on ? C.sage : C.muted} />
              <Text style={[s.segText, { color: on ? C.ink : C.ink2 }]}>{r.title}</Text>
            </Pressable>
          );
        })}
      </View>
      <Animated.Text key={value} entering={FadeIn.duration(240)} style={s.roleNote}>
        {ROLES[idx].note}
      </Animated.Text>
    </View>
  );
}

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
  const [role, setRole] = useState<Role>('customer');
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
    setError(''); setLoading(true);
    // const { error } = await authClient.signUp.email({ name, email, password, initialRole: role } as any);
    // if (error) setError(error.message ?? 'Something went wrong. Please try again.');
    setLoading(false);
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
      <View style={{ gap: 8 }}>
        <Text style={s.label}>I’M JOINING AS</Text>
        <RoleSwitch value={role} onChange={setRole} />
      </View>

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
        <Button label="Continue with Google" variant="outline" icon={<GoogleMark />} />
        <Text style={s.terms}>By continuing you agree to Lucent’s Terms and Privacy Policy.</Text>
      </View>
    </AuthShell>
  );
}

const s = StyleSheet.create({
  label: { fontFamily: F.mono, fontSize: 10.5, color: C.ink2, letterSpacing: 1.5 },
  seg: {
    flexDirection: 'row', height: 54, padding: 4, borderRadius: 27, backgroundColor: 'rgba(26,29,33,0.05)',
  },
  thumb: {
    position: 'absolute', left: 4, top: 4, height: 46, borderRadius: 23, backgroundColor: '#fff',
    shadowColor: '#1A1D21', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  segItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  segText: { fontFamily: F.sans, fontSize: 14.5 },
  roleNote: { fontFamily: F.sansRegular, fontSize: 13, color: C.ink2, paddingLeft: 4 },
  terms: { fontFamily: F.sansRegular, fontSize: 12, lineHeight: 18, color: C.muted, textAlign: 'center', paddingHorizontal: 8 },
});
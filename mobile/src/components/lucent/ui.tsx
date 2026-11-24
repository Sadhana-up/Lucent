import { Children, ComponentProps, isValidElement, ReactNode, useEffect, useState } from 'react';
import {
  ActivityIndicator, GestureResponderEvent, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, TextInputProps, View,
} from 'react-native';
import Animated, {
  Easing, FadeIn, FadeInDown, interpolate, useAnimatedStyle, useSharedValue,
  withDelay, withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { C, F, R } from './theme';
import { Drift, Glow, Sphere, SunMark } from './decor';
import { useBallNav } from './transition';

export { SunMark };

/* ───────────────────────── Icons ───────────────────────── */

export type IconName = ComponentProps<typeof Feather>['name'];

export function Icon({ name, size = 20, color = C.ink }: { name: IconName; size?: number; color?: string }) {
  return <Feather name={name} size={size} color={color} />;
}

/** Full-colour Google "G". */
export function GoogleMark({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <Path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <Path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <Path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </Svg>
  );
}

/* ───────────────────────── Brand ───────────────────────── */

export function Logo({ light, size = 34 }: { light?: boolean; size?: number }) {
  return (
    <View style={s.logoRow}>
      <Image
        source={require('../../../assets/logo-transparent.png')}
        style={{ width: size, height: size, resizeMode: 'contain' }}
        accessibilityLabel="Lucent logo"
      />
      <Text style={[s.logoText, light && { color: '#fff' }]}>Lucent</Text>
    </View>
  );
}

/* ───────────────────────── Button ───────────────────────── */

const AP = Animated.createAnimatedComponent(Pressable);

function usePress() {
  const v = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: v.value }] }));
  return {
    style,
    onPressIn: () => { v.value = withSpring(0.97, { damping: 18, stiffness: 320 }); },
    onPressOut: () => { v.value = withSpring(1, { damping: 14, stiffness: 260 }); },
  };
}

/** A soft diagonal glint that sweeps across the primary button every few seconds. */
function Shine({ width }: { width: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(
      withSequence(
        withDelay(2400, withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) })),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [t]);
  const st = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(t.value, [0, 1], [-90, width + 40]) }, { rotate: '16deg' }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[s.shine, st]}>
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

type BtnProps = {
  label: string; onPress?: (e: GestureResponderEvent) => void; loading?: boolean;
  variant?: 'primary' | 'outline'; icon?: ReactNode; arrow?: boolean;
};

export function Button({ label, onPress, loading, variant = 'primary', icon, arrow }: BtnProps) {
  const p = usePress();
  const primary = variant === 'primary';
  const [w, setW] = useState(0);
  return (
    <AP
      {...p}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      onPress={(e) => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.(e);
      }}
      style={[p.style, s.btn, primary ? s.btnPrimary : s.btnOutline]}
    >
      <View style={s.btnClip}>
        {primary && (
          <LinearGradient
            colors={[C.sageLt, C.sage, C.sageDk]} locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}
          />
        )}
        {primary && w > 0 && !loading && <Shine width={w} />}
        {loading ? (
          <ActivityIndicator color={primary ? '#fff' : C.sage} />
        ) : (
          <>
            {icon}
            <Text style={[s.btnText, { color: primary ? '#fff' : C.ink }]}>{label}</Text>
            {arrow && (
              <View style={s.btnArrow}>
                <Icon name="arrow-right" size={18} color="#fff" />
              </View>
            )}
          </>
        )}
      </View>
    </AP>
  );
}

/* ───────────────────────── Form ───────────────────────── */

type FieldProps = TextInputProps & { label: string; icon: IconName; secure?: boolean; valid?: boolean };

export function Field({ label, icon, secure, valid, ...rest }: FieldProps) {
  const [focus, setFocus] = useState(false);
  const [hide, setHide] = useState(!!secure);
  return (
    <View style={{ gap: 8 }}>
      <Text style={[s.label, focus && { color: C.sage }]}>{label.toUpperCase()}</Text>
      <View style={[s.ring, focus && s.ringOn]}>
        <View style={[s.field, focus && s.fieldOn]}>
          <Icon name={icon} size={19} color={focus ? C.sage : C.muted} />
          <TextInput
            {...rest}
            secureTextEntry={hide}
            placeholderTextColor="#B5B0A8"
            selectionColor={C.sage}
            onFocus={(e) => { setFocus(true); rest.onFocus?.(e); }}
            onBlur={(e) => { setFocus(false); rest.onBlur?.(e); }}
            style={s.input}
          />
          {valid && (
            <Animated.View entering={FadeIn.duration(220)}>
              <Icon name="check-circle" size={18} color={C.sageLt} />
            </Animated.View>
          )}
          {secure && (
            <Pressable hitSlop={14} onPress={() => setHide((h) => !h)} accessibilityLabel={hide ? 'Show password' : 'Hide password'}>
              <Icon name={hide ? 'eye-off' : 'eye'} size={19} color={C.muted} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

export function Divider({ text }: { text: string }) {
  return (
    <View style={s.divider}>
      <View style={s.dividerLine} />
      <Text style={s.dividerText}>{text}</Text>
      <View style={s.dividerLine} />
    </View>
  );
}

export function ErrorNote({ text }: { text: string }) {
  return (
    <Animated.View entering={FadeInDown.duration(260)} style={s.error}>
      <Icon name="alert-circle" size={17} color={C.danger} />
      <Text style={s.errorText}>{text}</Text>
    </Animated.View>
  );
}

/** "New to Lucent?  Create an account →" row that sits under the card. */
export function AuthFooter({
  lead, action, onPress,
}: { lead: string; action: string; onPress: (e: GestureResponderEvent) => void }) {
  return (
    <Animated.View entering={FadeIn.delay(760).duration(500)} style={s.footer}>
      <Text style={s.footerLead}>{lead}</Text>
      <Pressable onPress={onPress} hitSlop={10} accessibilityRole="link" style={s.footerPill}>
        <Text style={s.footerAction}>{action}</Text>
        <Icon name="arrow-right" size={14} color={C.sage} />
      </Pressable>
    </Animated.View>
  );
}

/* ───────────────────────── Auth frame ───────────────────────── */

function CornerSphere() {
  const spin = useSharedValue(0);
  useEffect(() => {
    spin.value = withRepeat(withTiming(360, { duration: 26000, easing: Easing.linear }), -1, false);
  }, [spin]);
  return (
    <Drift style={{ position: 'absolute', top: -92, right: -70 }} dx={4} dy={9} scale={0.02} duration={4800}>
      <Sphere size={210} spin={spin} />
    </Drift>
  );
}

function Backdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#F1ECFA', '#F9EBE8', C.cream]} locations={[0, 0.38, 0.8]} style={StyleSheet.absoluteFill}
      />
      <Drift style={{ position: 'absolute', left: -170, top: -120 }} dx={18} dy={14} duration={8000}>
        <Glow size={420} color="#F2B9BF" peak={0.55} />
      </Drift>
      <Drift style={{ position: 'absolute', right: -220, top: 40 }} dx={16} dy={18} duration={9500} delay={800}>
        <Glow size={440} color="#B9A9F2" peak={0.5} />
      </Drift>
      <Drift style={{ position: 'absolute', left: -140, bottom: -250 }} dx={20} dy={14} duration={10500}>
        <Glow size={520} color="#8FC3A0" peak={0.38} />
      </Drift>
      <CornerSphere />
    </View>
  );
}

/**
 * Frame for sign-in / sign-up / forgot-password:
 * aurora backdrop, a floating sphere in the corner, glass form card, rolling-ball back button.
 * Children are placed in the card and fade in one after another.
 */
export function AuthShell({
  eyebrow, title, italic, subtitle, children, footer,
}: {
  eyebrow?: string; title: string; italic: string; subtitle: string; children: ReactNode; footer?: ReactNode;
}) {
  const { top, bottom } = useSafeAreaInsets();
  const nav = useBallNav();
  const items = Children.toArray(children);

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>
      <Backdrop />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: top + 10, paddingBottom: bottom + 32, paddingHorizontal: 22 }}
        >
          <Animated.View entering={FadeIn.delay(260).duration(500)}>
            <Pressable
              onPress={(e) => nav.back({ dir: -1, y: e.nativeEvent.pageY })}
              hitSlop={10} style={s.back} accessibilityRole="button" accessibilityLabel="Go back"
            >
              <Icon name="arrow-left" size={21} color={C.ink} />
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(220).duration(650)} style={{ marginTop: 30, marginBottom: 26 }}>
            {!!eyebrow && (
              <View style={s.eyebrowRow}>
                <View style={s.eyebrowDot} />
                <Text style={s.eyebrow}>{eyebrow}</Text>
              </View>
            )}
            <Text style={s.h1}>{title}</Text>
            <Text style={[s.h1, s.h1i]}>{italic}</Text>
            <Text style={s.sub}>{subtitle}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(650)} style={s.card}>
            {items.map((child, i) => (
              <Animated.View
                key={isValidElement(child) && child.key != null ? child.key : i}
                entering={FadeIn.delay(420 + i * 70).duration(500)}
              >
                {child}
              </Animated.View>
            ))}
          </Animated.View>

          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logoText: { fontFamily: F.serifBold, fontSize: 27, color: C.ink, letterSpacing: 0.2, marginTop: -2 },

  btn: { height: 60, borderRadius: R.pill },
  btnPrimary: {
    backgroundColor: C.sage,
    shadowColor: C.sageDk, shadowOpacity: 0.34, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 9,
  },
  btnOutline: { backgroundColor: 'rgba(255,255,255,0.8)', borderWidth: 1, borderColor: C.line },
  btnClip: {
    flex: 1, borderRadius: R.pill, overflow: 'hidden', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  btnText: { fontFamily: F.sans, fontSize: 16, letterSpacing: 0.1 },
  btnArrow: {
    position: 'absolute', right: 8, width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center',
  },
  shine: { position: 'absolute', top: -20, left: 0, width: 56, height: 100 },

  label: { fontFamily: F.mono, fontSize: 10.5, color: C.ink2, letterSpacing: 1.5 },
  ring: { padding: 3, borderRadius: 24, backgroundColor: 'transparent', margin: -3 },
  ringOn: { backgroundColor: 'rgba(45,90,61,0.10)' },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 13, height: 58, paddingHorizontal: 18,
    borderRadius: 21, backgroundColor: '#FBF8F3', borderWidth: 1, borderColor: C.line,
  },
  fieldOn: { borderColor: C.sage, backgroundColor: '#fff' },
  input: { flex: 1, height: '100%', fontFamily: F.sansRegular, fontSize: 16, color: C.ink },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.line },
  dividerText: { fontFamily: F.mono, fontSize: 10.5, letterSpacing: 1.6, color: C.muted },

  error: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16,
    backgroundColor: 'rgba(181,74,74,0.08)',
  },
  errorText: { flex: 1, fontFamily: F.sansRegular, fontSize: 13.5, color: C.danger },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 22 },
  footerLead: { fontFamily: F.sansRegular, fontSize: 14, color: C.ink2 },
  footerPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: R.pill, backgroundColor: C.sageGhost,
  },
  footerAction: { fontFamily: F.sans, fontSize: 14, color: C.sage },

  back: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center',
  },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  eyebrowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.sageLt },
  eyebrow: { fontFamily: F.mono, fontSize: 10.5, letterSpacing: 2, color: C.ink2 },
  h1: { fontFamily: F.serif, fontSize: 52, lineHeight: 54, color: C.ink, letterSpacing: -1 },
  h1i: { fontFamily: F.serifItalic, color: C.sage },
  sub: { fontFamily: F.sansRegular, fontSize: 15, lineHeight: 23, color: C.ink2, marginTop: 14, maxWidth: 320 },

  card: {
    borderRadius: 32, padding: 20, gap: 18, backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1, borderColor: '#fff',
    shadowColor: C.sageDk, shadowOpacity: 0.1, shadowRadius: 36, shadowOffset: { width: 0, height: 16 }, elevation: 4,
  },
});
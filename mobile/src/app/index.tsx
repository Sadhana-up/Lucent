import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Line, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation, FadeIn, FadeInDown, SharedValue, interpolate, interpolateColor, runOnJS,
  useAnimatedScrollHandler, useAnimatedStyle, useSharedValue,
} from 'react-native-reanimated';
import { Bubbles, Drift, Glow } from '../components/lucent/decor';
import { Button, Icon, Logo } from '../components/lucent/ui';
import { useBallNav } from '../components/lucent/transition';
import { C, F } from '../components/lucent/theme';
import { useSplashDone } from '../features/splash/splashState';
import { authClient } from '../lib/auth-client';

/**
 * Welcome: a pH instrument you can play with.
 * Slide the ruler → the dial's knob sweeps its arc, the aurora behind it changes colour,
 * and Lucent says what that reading means. Healthy skin sits at 4.5 – 5.8.
 */

const TICK = 10;               // px per 0.1 pH
const COUNT = 141;             // 0.0 → 14.0
const PER_PH = TICK * 10;
const MAXX = (COUNT - 1) * TICK;
const START = 5.5;
const LO = 4.5;
const HI = 5.8;

const STOPS = [2, LO, HI, 6.4, 9].map((v) => v * PER_PH);
const BG = ['#F6D9D4', C.cream, C.cream, '#ECE7F7', '#DDD5F5'];
const INK = ['#B5574E', C.sage, C.sage, '#6A58D6', '#6A58D6'];

const COPY = {
  acid: { label: 'Too acidic', note: 'Skin stings and reddens. Lucent finds what is over-exfoliating it.' },
  balanced: { label: 'Balanced', note: 'Where healthy skin lives. Lucent helps you stay here.' },
  alkaline: { label: 'Too alkaline', note: 'The barrier weakens and dryness follows. Lucent brings it back.' },
} as const;
type Zone = keyof typeof COPY;

/* ───────────────────────── Ruler (the input) ───────────────────────── */

const RULER_H = 92;

const Ruler = memo(function Ruler({
  x, onPh, width,
}: { x: SharedValue<number>; onPh: (v: number) => void; width: number }) {
  const ref = useRef<Animated.ScrollView>(null);
  const last = useSharedValue(Math.round(START * 10));
  const dragged = useSharedValue(false);
  const touched = useRef(false);
  const pad = (width - TICK) / 2;

  const markTouched = useCallback(() => { touched.current = true; }, []);
  const haptic = useCallback(() => { void Haptics.selectionAsync().catch(() => {}); }, []);

  const handler = useAnimatedScrollHandler({
    onBeginDrag: () => { dragged.value = true; runOnJS(markTouched)(); },
    onScroll: (e) => {
      x.value = e.contentOffset.x;
      const step = Math.max(0, Math.min(COUNT - 1, Math.round(e.contentOffset.x / TICK)));
      if (step !== last.value) {
        last.value = step;
        runOnJS(onPh)(step / 10);
        if (dragged.value) runOnJS(haptic)();
      }
    },
  });

  // One gentle nudge so people discover it slides.
  useEffect(() => {
    const t1 = setTimeout(() => {
      if (!touched.current) ref.current?.scrollTo({ x: 6.3 * PER_PH, animated: true });
    }, 2300);
    const t2 = setTimeout(() => {
      if (!touched.current) ref.current?.scrollTo({ x: START * PER_PH, animated: true });
    }, 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <View style={{ height: RULER_H }}>
      <Animated.ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={TICK}
        snapToAlignment="start"
        bounces={false}
        overScrollMode="never"
        scrollEventThrottle={16}
        onScroll={handler}
        onLayout={() => ref.current?.scrollTo({ x: START * PER_PH, animated: false })}
        contentContainerStyle={{ paddingHorizontal: pad }}
      >
        <View style={{ flexDirection: 'row', height: RULER_H }}>
          <View style={[s.band, { left: LO * 10 * TICK + TICK / 2, width: (HI - LO) * 10 * TICK }]}>
            <Text style={s.bandText}>HEALTHY</Text>
          </View>
          {Array.from({ length: COUNT }, (_, i) => {
            const major = i % 10 === 0;
            const mid = i % 5 === 0;
            return (
              <View key={i} style={{ width: TICK, alignItems: 'center' }}>
                <View
                  style={{
                    marginTop: 26, width: major ? 1.6 : 1, borderRadius: 1,
                    height: major ? 34 : mid ? 24 : 14,
                    backgroundColor: major ? 'rgba(26,29,33,0.85)' : mid ? 'rgba(26,29,33,0.45)' : 'rgba(26,29,33,0.22)',
                  }}
                />
                {major && <Text style={s.tickNum}>{i / 10}</Text>}
              </View>
            );
          })}
        </View>
      </Animated.ScrollView>

      <View style={[s.needle, { left: width / 2 - 1 }]} pointerEvents="none">
        <View style={s.needleDot} />
        <View style={s.needleLine} />
      </View>
    </View>
  );
});

/* ───────────────────────── Dial (the readout) ───────────────────────── */

const A0 = 150;      // arc starts bottom-left …
const SWEEP = 240;   // … sweeps 240° clockwise over the top to bottom-right
const KNOB = 40;

function polar(c: number, r: number, f: number) {
  const a = ((A0 + f * SWEEP) * Math.PI) / 180;
  return { x: c + r * Math.cos(a), y: c + r * Math.sin(a) };
}
function arc(c: number, r: number, f0: number, f1: number) {
  const p0 = polar(c, r, f0);
  const p1 = polar(c, r, f1);
  const large = (f1 - f0) * SWEEP > 180 ? 1 : 0;
  return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
}

/** Everything that never re-renders while sliding: glows, orb, arc, ticks. Only the knob is animated. */
const DialStatic = memo(function DialStatic({ size, x }: { size: number; x: SharedValue<number> }) {
  const c = size / 2;
  const r = size / 2 - 30;
  const orb = (r - 20) * 2;
  const g = size * 1.75;
  const p0 = polar(c, r, 0);
  const p1 = polar(c, r, 1);

  const gAcid = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [STOPS[0], STOPS[1]], [1, 0], Extrapolation.CLAMP),
  }));
  const gOk = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [STOPS[0], STOPS[1], STOPS[2], STOPS[3]], [0, 1, 1, 0], Extrapolation.CLAMP),
  }));
  const gAlk = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [STOPS[2], STOPS[3]], [0, 1], Extrapolation.CLAMP),
  }));

  const knob = useAnimatedStyle(() => {
    const f = Math.min(1, Math.max(0, x.value / MAXX));
    const a = ((A0 + f * SWEEP) * Math.PI) / 180;
    return {
      transform: [
        { translateX: c + r * Math.cos(a) - KNOB / 2 },
        { translateY: c + r * Math.sin(a) - KNOB / 2 },
      ],
    };
  });
  const halo = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(x.value, STOPS, INK) }));
  const dot = useAnimatedStyle(() => ({ borderColor: interpolateColor(x.value, STOPS, INK) }));

  const glowBox = { position: 'absolute' as const, left: c - g / 2, top: c - g / 2, width: g, height: g };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Drift style={glowBox} dx={10} dy={8} scale={0.05} duration={6500}>
        <Animated.View style={gAcid}><Glow size={g} color="#F0A79E" peak={0.75} /></Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, gOk]}><Glow size={g} color="#8FD0A6" peak={0.62} /></Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, gAlk]}><Glow size={g} color="#A99AF2" peak={0.75} /></Animated.View>
      </Drift>

      <View
        style={[s.orb, { width: orb, height: orb, borderRadius: orb / 2, left: c - orb / 2, top: c - orb / 2 }]}
      />

      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGradient id="okArc" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={C.sageLt} />
            <Stop offset="1" stopColor={C.sage} />
          </SvgGradient>
        </Defs>
        <Path d={arc(c, r, 0, 1)} stroke="rgba(26,29,33,0.07)" strokeWidth={10} strokeLinecap="round" fill="none" />
        <Path d={arc(c, r, 0, LO / 14)} stroke="#E9B3AD" strokeOpacity={0.85} strokeWidth={10} strokeLinecap="round" fill="none" />
        <Path d={arc(c, r, HI / 14, 1)} stroke="#B9AEF2" strokeOpacity={0.85} strokeWidth={10} strokeLinecap="round" fill="none" />
        <Path d={arc(c, r, LO / 14, HI / 14)} stroke="url(#okArc)" strokeWidth={12} strokeLinecap="round" fill="none" />
        {Array.from({ length: 15 }, (_, i) => {
          const f = i / 14;
          const a = polar(c, r + 14, f);
          const b = polar(c, r + (i % 7 === 0 ? 24 : 19), f);
          return (
            <Line
              key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="rgba(26,29,33,0.28)" strokeWidth={i % 7 === 0 ? 1.6 : 1} strokeLinecap="round"
            />
          );
        })}
      </Svg>

      <Text style={[s.endLabel, { left: p0.x - 35, top: p0.y + 14 }]}>ACID</Text>
      <Text style={[s.endLabel, { left: p1.x - 35, top: p1.y + 14 }]}>ALKALINE</Text>

      <Animated.View style={[s.knobWrap, knob]}>
        <Animated.View style={[s.knobHalo, halo]} />
        <Animated.View style={[s.knobDot, dot]} />
      </Animated.View>
    </View>
  );
});

function Readout({
  ph, size, x, zone,
}: { ph: number; size: number; x: SharedValue<number>; zone: Zone }) {
  const numColor = useAnimatedStyle(() => ({ color: interpolateColor(x.value, STOPS, INK) }));
  const dotColor = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(x.value, STOPS, INK) }));
  const fs = Math.round(size * 0.3);
  return (
    <View style={[StyleSheet.absoluteFill, s.readout]} pointerEvents="none">
      <Text style={s.unit}>pH</Text>
      <Animated.Text style={[s.num, numColor, { fontSize: fs, lineHeight: fs * 1.04 }]} allowFontScaling={false}>
        {ph.toFixed(1)}
      </Animated.Text>
      <Animated.View key={zone} entering={FadeIn.duration(260)} style={s.chip}>
        <Animated.View style={[s.dot, dotColor]} />
        <Text style={s.chipText}>{COPY[zone].label.toUpperCase()}</Text>
      </Animated.View>
    </View>
  );
}

/* ───────────────────────── Screen ───────────────────────── */

export default function Welcome() {
  const { top, bottom } = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const splashDone = useSplashDone();
  const nav = useBallNav();
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (splashDone && session) nav.replace('/(app)/home', { dir: 1 });
  }, [splashDone, session, nav]);

  const x = useSharedValue(START * PER_PH);
  const [ph, setPh] = useState(START);
  const onPh = useCallback((v: number) => setPh(v), []);

  const bg = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(x.value, STOPS, BG) }));

  // Mount visuals only once the splash has fully left so every entrance plays on hand-off.
  if (!splashDone) return null;

  const zone: Zone = ph < LO ? 'acid' : ph <= HI ? 'balanced' : 'alkaline';
  const compact = height < 700;
  const chrome = 410 + top + bottom - (compact ? 22 : 0);
  const dial = Math.round(Math.max(200, Math.min(width - 56, 312, height - chrome - 64)));

  return (
    <Animated.View style={[s.root, bg]}>
      <StatusBar style="dark" />
      <Bubbles width={width} height={height} />

      <Animated.View entering={FadeIn.delay(150).duration(700)} style={{ paddingTop: top + 12, paddingHorizontal: 24 }}>
        <Logo />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(800)} style={{ paddingHorizontal: 24, marginTop: 18 }}>
        {!compact && (
          <View style={s.eyebrowRow}>
            <View style={s.eyebrowDot} />
            <Text style={s.eyebrow}>SKIN, MEASURED</Text>
          </View>
        )}
        <Text style={s.h1} numberOfLines={1} adjustsFontSizeToFit>Know your skin.</Text>
        <Text style={[s.h1, s.h1i]} numberOfLines={1} adjustsFontSizeToFit>Then care for it.</Text>
      </Animated.View>

      <View style={s.mid}>
        <Animated.View entering={FadeIn.delay(650).duration(900)} style={{ alignItems: 'center' }}>
          <View style={{ width: dial, height: dial }}>
            <DialStatic size={dial} x={x} />
            <Readout ph={ph} size={dial} x={x} zone={zone} />
          </View>
          <Animated.View key={zone} entering={FadeIn.duration(260)} style={s.noteBox}>
            <Text style={s.note}>{COPY[zone].note}</Text>
          </Animated.View>
        </Animated.View>
      </View>

      <Animated.View entering={FadeIn.delay(900).duration(900)} style={s.rulerCard}>
        <Ruler x={x} onPh={onPh} width={width - 40} />
        <LinearGradient
          pointerEvents="none" colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.fade, { left: 0 }]}
        />
        <LinearGradient
          pointerEvents="none" colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.fade, { right: 0 }]}
        />
        <View style={s.hint}>
          <Icon name="chevron-left" size={13} color={C.muted} />
          <Text style={s.hintText}>SLIDE TO MEASURE</Text>
          <Icon name="chevron-right" size={13} color={C.muted} />
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(1100).duration(800)}
        style={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: bottom + 10, gap: 4 }}
      >
        <Button
          label="Get started" arrow
          onPress={(e) => nav.push('/(auth)/sign-up', { dir: 1, y: e.nativeEvent.pageY })}
        />
        <Pressable
          onPress={(e) => nav.push('/(auth)/sign-in', { dir: 1, y: e.nativeEvent.pageY })}
          hitSlop={8} style={s.signin} accessibilityRole="button"
        >
          <Text style={s.signinText}>
            Already a member?{'  '}<Text style={s.signinLink}>Sign in</Text>
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  h1: { fontFamily: F.serif, fontSize: 42, lineHeight: 45, color: C.ink, letterSpacing: -0.8 },
  h1i: { fontFamily: F.serifItalic, color: C.sage },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  eyebrowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.sageLt },
  eyebrow: { fontFamily: F.mono, fontSize: 10.5, letterSpacing: 2, color: C.ink2 },

  mid: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orb: {
    position: 'absolute', backgroundColor: 'rgba(255,255,255,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#1A1D21', shadowOpacity: 0.07, shadowRadius: 28, shadowOffset: { width: 0, height: 12 }, elevation: 3,
  },
  endLabel: {
    position: 'absolute', width: 70, textAlign: 'center', fontFamily: F.mono, fontSize: 9, letterSpacing: 1.4, color: C.muted,
  },
  knobWrap: {
    position: 'absolute', left: 0, top: 0, width: KNOB, height: KNOB, alignItems: 'center', justifyContent: 'center',
  },
  knobHalo: { position: 'absolute', width: KNOB, height: KNOB, borderRadius: KNOB / 2, opacity: 0.2 },
  knobDot: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', borderWidth: 4,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },

  readout: { alignItems: 'center', justifyContent: 'center' },
  unit: { fontFamily: F.mono, fontSize: 11, letterSpacing: 2.4, color: C.muted, marginBottom: -2 },
  num: { fontFamily: F.serif, letterSpacing: -3, includeFontPadding: false },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6, paddingVertical: 5, paddingHorizontal: 11,
    borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.85)',
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  chipText: { fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1.4, color: C.ink },

  noteBox: { marginTop: 10, minHeight: 44, paddingHorizontal: 32 },
  note: { fontFamily: F.sansRegular, fontSize: 14, lineHeight: 21, color: C.ink2, textAlign: 'center', maxWidth: 300 },

  rulerCard: {
    marginHorizontal: 20, borderRadius: 28, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.95)',
  },
  fade: { position: 'absolute', top: 0, width: 46, height: RULER_H },
  band: {
    position: 'absolute', top: 20, height: 46, borderRadius: 8,
    backgroundColor: 'rgba(45,90,61,0.10)', justifyContent: 'flex-start', paddingLeft: 7, paddingTop: 4,
  },
  bandText: { fontFamily: F.mono, fontSize: 8.5, letterSpacing: 1.4, color: C.sage },
  tickNum: {
    position: 'absolute', top: 68, width: 30, left: (TICK - 30) / 2, textAlign: 'center',
    fontFamily: F.mono, fontSize: 11, color: C.ink2,
  },
  needle: { position: 'absolute', top: 0, width: 2, alignItems: 'center' },
  needleDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.sage },
  needleLine: { width: 2, height: 58, backgroundColor: C.sage, borderRadius: 1, marginTop: -1 },

  hint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingBottom: 12 },
  hintText: { fontFamily: F.mono, fontSize: 10, letterSpacing: 2, color: C.muted },

  signin: { height: 46, alignItems: 'center', justifyContent: 'center' },
  signinText: { fontFamily: F.sansRegular, fontSize: 14, color: C.ink2 },
  signinLink: { fontFamily: F.sans, color: C.sage },
});
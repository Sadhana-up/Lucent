import { memo, ReactNode, useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing, interpolate, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming,
} from 'react-native-reanimated';
import { C } from './theme';

/* ───────────────────────── Brand mark ───────────────────────── */

export function SunMark({ size = 22 }: { size?: number }) {
  return (
    <LinearGradient
      colors={['#FFEFF1', '#F6D0D4', '#D3B1E8', C.violetLt]} locations={[0, 0.4, 0.75, 1]}
      start={{ x: 0.2, y: 0.1 }} end={{ x: 0.9, y: 1 }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
    />
  );
}

/* ───────────────────────── Soft radial glow ─────────────────────────
 * Static SVG (stays crisp). To animate it, wrap it in an Animated.View / <Drift>. */

export const Glow = memo(function Glow({
  size, color, peak = 0.8,
}: { size: number; color: string; peak?: number }) {
  const id = `glow${color.replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <View pointerEvents="none" style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={peak} />
            <Stop offset="0.35" stopColor={color} stopOpacity={peak * 0.62} />
            <Stop offset="0.65" stopColor={color} stopOpacity={peak * 0.22} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={size} height={size} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
});

/* ───────────────────────── Slow ambient drift ───────────────────────── */

export function Drift({
  children, dx = 12, dy = 10, scale = 0.05, duration = 7000, delay = 0, style,
}: {
  children: ReactNode; dx?: number; dy?: number; scale?: number;
  duration?: number; delay?: number; style?: StyleProp<ViewStyle>;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [t, delay, duration]);

  const a = useAnimatedStyle(() => ({
    transform: [
      { translateX: (t.value - 0.5) * 2 * dx },
      { translateY: (0.5 - t.value) * 2 * dy },
      { scale: 1 + (t.value - 0.5) * 2 * scale },
    ],
  }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

/* ───────────────────────── Rising serum bubbles ───────────────────────── */

const BUBBLES = [
  { x: 0.08, s: 8, d: 0, t: 11000 },
  { x: 0.24, s: 14, d: 3200, t: 14000 },
  { x: 0.41, s: 6, d: 1500, t: 10000 },
  { x: 0.57, s: 11, d: 5200, t: 13000 },
  { x: 0.72, s: 7, d: 800, t: 12000 },
  { x: 0.86, s: 16, d: 4200, t: 15000 },
  { x: 0.94, s: 9, d: 7000, t: 11500 },
];

function Bubble({
  left, size, delay, duration, rise,
}: { left: number; size: number; delay: number; duration: number; rise: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false));
  }, [t, delay, duration]);

  const st = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.15, 0.75, 1], [0, 0.85, 0.6, 0]),
    transform: [
      { translateY: -t.value * rise },
      { translateX: Math.sin(t.value * Math.PI * 4) * 10 },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute', left, bottom: -size, width: size, height: size, borderRadius: size / 2,
          backgroundColor: 'rgba(255,255,255,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
        },
        st,
      ]}
    />
  );
}

export const Bubbles = memo(function Bubbles({ width, height }: { width: number; height: number }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {BUBBLES.map((b, i) => (
        <Bubble key={i} left={b.x * width} size={b.s} delay={b.d} duration={b.t} rise={height * 0.95} />
      ))}
    </View>
  );
});

/* ───────────────────────── The ball ─────────────────────────
 * Glossy sage sphere. `spin` rotates only the surface pattern (stripes + dots) while the
 * lighting stays put, so a rolling ball actually reads as rolling.
 * Used for the screen transition AND as the corner ornament on the auth screens. */

const STRIPES = [0, 60, 120];
// [radius (fraction of size), angle (deg), diameter (fraction of size), alpha]
const DOTS: ReadonlyArray<readonly [number, number, number, number]> = [
  [0.3, 25, 0.14, 0.13],
  [0.37, 115, 0.09, 0.1],
  [0.24, 205, 0.12, 0.11],
  [0.35, 295, 0.07, 0.09],
  [0.1, 70, 0.05, 0.08],
];

export function Sphere({ size, spin }: { size: number; spin?: { readonly value: number } }) {
  const pattern = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin ? spin.value : 0}deg` }],
  }));
  const half = size / 2;

  return (
    <View style={{ width: size, height: size, borderRadius: half, overflow: 'hidden' }}>
      <LinearGradient
        colors={[C.sageLt, C.sage, C.sageDk]} locations={[0, 0.55, 1]}
        start={{ x: 0.15, y: 0.05 }} end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[StyleSheet.absoluteFill, pattern]}>
        {STRIPES.map((deg) => (
          <View
            key={deg}
            style={{
              position: 'absolute', left: half - size * 0.09, top: -size * 0.25,
              width: size * 0.18, height: size * 1.5,
              backgroundColor: 'rgba(255,255,255,0.07)', transform: [{ rotate: `${deg}deg` }],
            }}
          />
        ))}
        {DOTS.map(([rf, deg, df, alpha], i) => {
          const d = size * df;
          const a = (deg * Math.PI) / 180;
          return (
            <View
              key={i}
              style={{
                position: 'absolute', width: d, height: d, borderRadius: d / 2,
                left: half + Math.cos(a) * rf * size - d / 2,
                top: half + Math.sin(a) * rf * size - d / 2,
                backgroundColor: `rgba(255,255,255,${alpha})`,
              }}
            />
          );
        })}
      </Animated.View>

      {/* fixed lighting: top-left sheen, bottom-right shade, specular glint */}
      <LinearGradient
        colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.22)']} locations={[0, 0.45, 1]}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={{
          position: 'absolute', left: size * 0.2, top: size * 0.13, width: size * 0.26, height: size * 0.16,
          borderRadius: size * 0.13, backgroundColor: 'rgba(255,255,255,0.22)', transform: [{ rotate: '-28deg' }],
        }}
      />
    </View>
  );
}
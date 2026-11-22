import {
  createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { AccessibilityInfo, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router, type Href } from 'expo-router';
import Animated, {
  Extrapolation, interpolate, runOnJS, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming, Easing,
} from 'react-native-reanimated';
import { Sphere, SunMark } from './decor';
import { F } from './theme';

/**
 * Rolling-ball screen transition.
 *
 * A glossy green ball rolls in from one edge (at the height of the thumb), grows until it
 * swallows the screen, the route changes while the Lucent mark shows, then the ball keeps
 * rolling out the other side and shrinks away to reveal the new screen.
 *
 *   const nav = useBallNav();
 *   nav.push('/(auth)/sign-up', { dir: 1, y: e.nativeEvent.pageY });
 *   nav.replace('/(auth)/sign-in', { dir: -1 });
 *   nav.back({ dir: -1 });
 *
 * dir:  1 → ball rolls left → right (forward)   -1 → right → left (back)
 * y:    screen-space Y where the ball enters (pass the press event's pageY)
 */

const D0 = 120;          // ball diameter at scale 1
const S_IN = 0.8;        // scale while rolling in
const S_OUT = 0.55;      // scale while rolling out
const COVER_MS = 600;
const HOLD_MS = 200;
const REVEAL_MS = 640;
const EASE = Easing.bezier(0.65, 0, 0.35, 1);

export type BallOpts = { dir?: 1 | -1; y?: number };

type BallNav = {
  push: (href: Href, o?: BallOpts) => void;
  replace: (href: Href, o?: BallOpts) => void;
  back: (o?: BallOpts) => void;
};

const goBack = () => {
  if (router.canGoBack()) router.back();
  else router.replace('/');
};

// Fallback (no provider mounted): plain navigation.
const Ctx = createContext<BallNav>({
  push: (h) => router.push(h),
  replace: (h) => router.replace(h),
  back: () => goBack(),
});

export const useBallNav = () => useContext(Ctx);

export function BallTransitionProvider({ children }: { children: ReactNode }) {
  const { width: W, height: H } = useWindowDimensions();
  const prog = useSharedValue(0);      // 0 → 1 cover, 1 → 2 reveal
  const dirSV = useSharedValue(1);
  const ySV = useSharedValue(H * 0.72);

  const [active, setActive] = useState(false);
  const busy = useRef(false);
  const action = useRef<(() => void) | null>(null);
  const reduce = useRef(false);
  const guard = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((v) => { reduce.current = v; }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => { reduce.current = v; });
    return () => sub.remove();
  }, []);

  const finish = useCallback(() => {
    if (guard.current) clearTimeout(guard.current);
    guard.current = null;
    prog.value = 0;
    setActive(false);
    busy.current = false;
  }, [prog]);

  const reveal = useCallback(() => {
    prog.value = withTiming(2, { duration: REVEAL_MS, easing: EASE }, (done) => {
      if (done) runOnJS(finish)();
    });
  }, [prog, finish]);

  const covered = useCallback(() => {
    const fn = action.current;
    action.current = null;
    try { fn?.(); } catch { /* navigation errors shouldn't strand the overlay */ }
    setTimeout(reveal, HOLD_MS);
  }, [reveal]);

  const run = useCallback((fn: () => void, o?: BallOpts) => {
    if (busy.current) return;
    if (reduce.current) { fn(); return; }       // respect "Reduce Motion"
    busy.current = true;
    action.current = fn;
    dirSV.value = o?.dir ?? 1;
    ySV.value = o?.y ?? H * 0.72;
    prog.value = 0;
    setActive(true);
    guard.current = setTimeout(finish, 4000);   // never leave the screen blocked
    prog.value = withTiming(1, { duration: COVER_MS, easing: EASE }, (done) => {
      if (done) runOnJS(covered)();
    });
  }, [H, prog, dirSV, ySV, covered, finish]);

  const api = useMemo<BallNav>(() => ({
    push: (href, o) => run(() => router.push(href), o),
    replace: (href, o) => run(() => router.replace(href), o),
    back: (o) => run(goBack, o),
  }), [run]);

  const S_FULL = (Math.hypot(W, H) * 1.08) / D0;

  const ballStyle = useAnimatedStyle(() => {
    const p = prog.value;
    const dir = dirSV.value;
    const inX = dir > 0 ? -D0 * S_IN * 0.25 : W + D0 * S_IN * 0.25;
    const outX = dir > 0 ? W + D0 * S_OUT * 0.8 : -D0 * S_OUT * 0.8;

    let cx: number;
    let cy: number;
    let sc: number;
    if (p <= 1) {
      const pp = Math.min(1, p / 0.9);                         // centre arrives a touch early
      cx = interpolate(pp, [0, 1], [inX, W / 2]);
      cy = interpolate(pp, [0, 1], [ySV.value, H / 2]);
      sc = S_IN * Math.pow(S_FULL / S_IN, p);                  // exponential growth reads as constant zoom
    } else {
      const q = p - 1;
      const qp = Math.min(1, q * 1.1);                         // centre leaves first, radius lags
      cx = interpolate(qp, [0, 1], [W / 2, outX]);
      cy = interpolate(qp, [0, 1], [H / 2, H * 0.56]);
      sc = S_FULL * Math.pow(S_OUT / S_FULL, Math.pow(q, 1.5));
    }
    return {
      opacity: p > 0 && p < 2 ? 1 : 0,
      transform: [{ translateX: cx - D0 / 2 }, { translateY: cy - D0 / 2 }, { scale: sc }],
    };
  });

  // Surface pattern turns with the roll (sign follows direction).
  const spin = useDerivedValue(() => dirSV.value * interpolate(prog.value, [0, 1, 2], [0, 300, 620]));

  const brandStyle = useAnimatedStyle(() => {
    const p = prog.value;
    return {
      opacity: interpolate(p, [0.82, 1, 1.18], [0, 1, 0], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(p, [0.82, 1, 1.18], [0.92, 1, 1.05], Extrapolation.CLAMP) }],
    };
  });

  return (
    <Ctx.Provider value={api}>
      {children}
      <View pointerEvents={active ? 'auto' : 'none'} style={s.overlay}>
        <Animated.View pointerEvents="none" style={[s.ball, ballStyle]}>
          <Sphere size={D0} spin={spin} />
        </Animated.View>
        <Animated.View pointerEvents="none" style={[s.brand, brandStyle]}>
          <SunMark size={34} />
          <Text style={s.brandText}>Lucent</Text>
        </Animated.View>
      </View>
    </Ctx.Provider>
  );
}

const s = StyleSheet.create({
  overlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 999, elevation: 999 },
  ball: { position: 'absolute', left: 0, top: 0, width: D0, height: D0 },
  brand: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', gap: 14,
  },
  brandText: { fontFamily: F.serifBold, fontSize: 38, color: '#fff', letterSpacing: 0.4 },
});
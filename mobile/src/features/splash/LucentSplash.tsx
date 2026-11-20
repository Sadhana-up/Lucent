import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SceneContext } from './context';
import { T } from './constants';
import { clamp01, smoothstep } from './easing';
import { useMasterClock } from './useMasterClock';
import { useParallax } from './useParallax';
import { useReducedMotion } from './useReducedMotion';
import { useSceneLayout } from './useSceneLayout';
import { useSharedValue } from 'react-native-reanimated';
import { colors } from '../../theme/tokens';
import { SplashCanvas } from './components/SplashCanvas';
import { Overlay } from './components/Overlay';
import { PhCapsule } from './components/PhCapsule';
import { DebugOverlay } from './components/DebugOverlay';

export interface LucentSplashProps {
  /** Hold the exit (and the pH capsule at 94%) until app data is loaded. */
  ready?: boolean;
  /** Earliest time the exit may start, in ms. Default 5600. */
  minDuration?: number;
  /** Tap after 1.5s to skip to the exit. Default true. */
  skippable?: boolean;
  onDone?: () => void;
  /** Force the static reduced-motion composition (otherwise read from the OS). */
  reduceMotion?: boolean;
}

export function LucentSplash({
  ready = true,
  minDuration = 5600,
  skippable = true,
  onDone,
  reduceMotion,
}: LucentSplashProps) {
  const layout = useSceneLayout();
  const reduced = useReducedMotion(reduceMotion);
  const clock = useMasterClock();
  const { px, py } = useParallax(clock, reduced);

  const leaveT = useSharedValue(Infinity);
  const liteOut = useSharedValue(0);
  const readySV = useSharedValue(ready);

  const leaving = useRef(false);
  const finished = useRef(false);
  const minDone = useRef(false);
  const readyRef = useRef(ready);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }, []);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onDone?.();
  }, [onDone]);

  const leave = useCallback((lite = false) => {
    if (leaving.current) return;
    leaving.current = true;
    if (lite) {
      liteOut.value = withTiming(1, { duration: 450 });
      later(finish, 470);
    } else {
      leaveT.value = clock.t.value;
      later(finish, T.floodDur * 1000 + 60);
    }
  }, [clock.t, leaveT, liteOut, later, finish]);

  /* Static finished composition for reduced motion, then a plain fade. */
  useEffect(() => {
    if (!reduced) return;
    clock.setStatic(99);
    const id = later(() => leave(true), 900);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  /* One light haptic at the moment of impact. */
  useEffect(() => {
    if (reduced) return;
    const id = later(() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); }, T.impact * 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  /* Earliest exit: minDuration elapsed AND the app says ready. */
  useEffect(() => {
    if (reduced) return;
    const id = later(() => {
      minDone.current = true;
      if (readyRef.current) leave();
    }, minDuration);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minDuration, reduced]);

  useEffect(() => {
    readyRef.current = ready;
    readySV.value = ready;
    if (ready && minDone.current && !reduced) leave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, reduced]);

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const onSkip = useCallback(() => {
    if (!skippable || reduced || leaving.current) return;
    if (clock.t.value * 1000 >= 1500) leave();
  }, [skippable, reduced, clock.t, leave]);

  const creamOverlay = useAnimatedStyle(() => {
    if (reduced) return { opacity: liteOut.value };
    const p = leaveT.value === Infinity ? 0 : clamp01((clock.t.value - leaveT.value) / T.floodDur);
    return { opacity: smoothstep((p - 0.72) / 0.28) };
  }, [liteOut, leaveT, clock.t, reduced]);

  return (
    <SceneContext.Provider value={{ t: clock.t, px, py, layout, reduced, leaveT, liteOut, ready: readySV }}>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Lucent is loading"
        accessibilityValue={{ min: 0, max: 100, now: 0 }}
        style={styles.root}
        onTouchEnd={onSkip}
      >
        <View style={styles.canvasHost} accessible={false} importantForAccessibility="no-hide-descendants">
          <SplashCanvas />
        </View>
        <Overlay />
        <PhCapsule />
        <Animated.View pointerEvents="none" style={[styles.cream, creamOverlay]} />
        {__DEV__ && <DebugOverlay clock={clock} onExit={() => leave(reduced)} />}
      </View>
    </SceneContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', inset: 0, backgroundColor: colors.night, overflow: 'hidden' },
  canvasHost: { position: 'absolute', inset: 0 },
  cream: { position: 'absolute', inset: 0, backgroundColor: colors.cream },
});

export default LucentSplash;

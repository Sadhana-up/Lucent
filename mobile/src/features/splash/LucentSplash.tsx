import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SceneContext } from './context';
import { T } from './constants';
import { clamp01, easePush, easeThump, lerp, smoothstep } from './easing';
import { useMasterClock } from './useMasterClock';
import { useParallax } from './useParallax';
import { useReducedMotion } from './useReducedMotion';
import { useSceneLayout } from './useSceneLayout';
import { colors } from '../../theme/tokens';
import { SplashCanvas } from './components/SplashCanvas';
import { PhCapsule } from './components/PhCapsule';
import { DebugOverlay } from './components/DebugOverlay';

export interface LucentSplashProps {
  ready?: boolean;
  minDuration?: number;
  skippable?: boolean;
  onDone?: () => void;
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
  const [nightGone, setNightGone] = useState(false);

  // Camera push + impact thump — shared by the canvas AND the pH capsule.
  const camScale = useDerivedValue(() => {
    if (reduced) return 1;
    const push = lerp(1, T.pushTo, easePush(clamp01(clock.t.value / T.pushDur)));
    const u = clamp01((clock.t.value - T.impact) / T.thumpDur);
    const pk = T.thumpPeak;
    const thump = u < pk
      ? lerp(1, T.thumpTo, easeThump(u / pk))
      : lerp(T.thumpTo, 1, easeThump((u - pk) / (1 - pk)));
    return push * thump;
  }, [clock.t, reduced]);

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

  // Defined on the RN runtime so runOnJS can schedule it by reference.
  const hapticImpact = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const leave = useCallback((lite = false) => {
    if (leaving.current) return;
    leaving.current = true;
    if (lite) {
      liteOut.value = withTiming(1, { duration: 450 });
      later(finish, 470);
    } else {
      leaveT.value = clock.t.value;
    }
  }, [clock.t, leaveT, liteOut, later, finish]);

  /* Clock-synced haptic at impact (H5). */
  useAnimatedReaction(
    () => !reduced && clock.t.value >= T.impact,
    (now, prev) => {
      if (now && !prev) runOnJS(hapticImpact)();
    },
    [reduced, hapticImpact],
  );

  /* Clock-synced exit completion (H5). */
  useAnimatedReaction(
    () => leaveT.value !== Infinity && clock.t.value - leaveT.value >= T.floodDur,
    (now, prev) => { if (now && !prev) runOnJS(finish)(); },
    [finish],
  );

  /* Stop drawing the night world once the dawn wipe covers it (I2). */
  useAnimatedReaction(
    () => clock.t.value > T.nightHide,
    (now, prev) => { if (now && !prev) runOnJS(setNightGone)(true); },
    [],
  );

  useEffect(() => {
    if (!reduced) return;
    clock.setStatic(99);
    const id = later(() => leave(true), 900);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

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

  const camStyle = useAnimatedStyle(
    () => ({ transform: [{ scale: camScale.value }] }),
    [camScale],
  );

  return (
    <SceneContext.Provider value={{ t: clock.t, px, py, layout, reduced, leaveT, liteOut, ready: readySV, camScale, nightGone }}>
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
        <Animated.View pointerEvents="none" style={[styles.capsuleCam, { transformOrigin: `50% ${layout.sunY}px` }, camStyle]}>
          <PhCapsule />
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.cream, creamOverlay]} />
        {__DEV__ && <DebugOverlay clock={clock} onExit={() => leave(reduced)} reduced={reduced} />}
      </View>
    </SceneContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', inset: 0, backgroundColor: colors.night, overflow: 'hidden' },
  canvasHost: { position: 'absolute', inset: 0 },
  capsuleCam: { position: 'absolute', inset: 0 },
  cream: { position: 'absolute', inset: 0, backgroundColor: colors.cream },
});

export default LucentSplash;

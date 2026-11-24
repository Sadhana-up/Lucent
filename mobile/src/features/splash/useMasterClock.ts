import { useCallback } from 'react';
import { useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';

export interface MasterClock {
  /** The single source of truth: seconds since the scene started. */
  t: SharedValue<number>;
  paused: SharedValue<boolean>;
  seek(seconds: number): void;
  resume(): void;
  replay(): void;
  /** Freeze the clock at the finished composition (reduced motion). */
  setStatic(seconds: number): void;
}

/**
 * One Reanimated shared value driven by the display link. Clamping the frame
 * delta keeps the clock continuous when the app is backgrounded and resumed.
 */
export function useMasterClock(): MasterClock {
  const t = useSharedValue(0);
  const paused = useSharedValue(false);

  useFrameCallback((frame) => {
    if (paused.value) return;
    const dt = frame.timeSincePreviousFrame;
    if (dt == null) return;
    t.value += Math.min(dt, 34) / 1000;
  });

  const seek = useCallback(
    (seconds: number) => {
      paused.value = true;
      t.value = Math.max(0, seconds);
    },
    [paused, t],
  );
  const resume = useCallback(() => {
    paused.value = false;
  }, [paused]);
  const replay = useCallback(() => {
    t.value = 0;
    paused.value = false;
  }, [paused, t]);
  const setStatic = useCallback(
    (seconds: number) => {
      paused.value = true;
      t.value = seconds;
    },
    [paused, t],
  );

  return { t, paused, seek, resume, replay, setStatic };
}

import { useEffect } from 'react';
import { DeviceMotion } from 'expo-sensors';
import { useDerivedValue, useSharedValue, type DerivedValue } from 'react-native-reanimated';
import type { MasterClock } from './useMasterClock';

/**
 * Slow autonomous sway from the engine (sin/cos of t) plus optional device tilt.
 * The sensor listener is low-pass filtered and clamped; no worklet work is added
 * to the frame loop beyond reading two shared values.
 */
export function useParallax(clock: MasterClock, reduced: boolean) {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    let alive = true;
    let x = 0;
    let y = 0;
    DeviceMotion.setUpdateInterval(60);
    const sub = DeviceMotion.addListener((data) => {
      const gx = data.accelerationIncludingGravity?.x ?? data.rotation?.beta ?? 0;
      const gy = data.accelerationIncludingGravity?.y ?? data.rotation?.gamma ?? 0;
      const tx = Math.max(-1, Math.min(1, gx / 6));
      const ty = Math.max(-1, Math.min(1, gy / 6));
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      if (alive) {
        tiltX.value = x;
        tiltY.value = y;
      }
    });
    return () => {
      alive = false;
      sub.remove();
      tiltX.value = 0;
      tiltY.value = 0;
    };
  }, [reduced, tiltX, tiltY]);

  const px: DerivedValue<number> = useDerivedValue(
    () => (reduced ? 0 : Math.sin(clock.t.value * 0.42) * 0.5 + tiltX.value * 0.8),
    [reduced, clock.t, tiltX],
  );
  const py: DerivedValue<number> = useDerivedValue(
    () => (reduced ? 0 : Math.cos(clock.t.value * 0.31) * 0.3 + tiltY.value * 0.8),
    [reduced, clock.t, tiltY],
  );

  return { px, py };
}

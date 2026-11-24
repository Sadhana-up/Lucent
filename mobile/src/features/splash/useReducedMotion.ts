import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Follows the OS "reduce motion" setting, with an initial async read. */
export function useReducedMotion(force?: boolean): boolean {
  const [reduced, setReduced] = useState(force ?? false);

  useEffect(() => {
    if (force !== undefined) {
      setReduced(force);
      return;
    }
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (alive) setReduced(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
      if (alive) setReduced(v);
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, [force]);

  return reduced;
}

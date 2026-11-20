import { createContext, useContext } from 'react';
import type { DerivedValue, SharedValue } from 'react-native-reanimated';
import type { SceneLayout } from './useSceneLayout';

export interface SceneContextValue {
  t: SharedValue<number>;
  px: DerivedValue<number>;
  py: DerivedValue<number>;
  layout: SceneLayout;
  reduced: boolean;
  /** t at which the exit flood started (Infinity while still playing). */
  leaveT: SharedValue<number>;
  /** 0..1 for the reduced-motion fade-to-app. */
  liteOut: SharedValue<number>;
  ready: SharedValue<boolean>;
}

export const SceneContext = createContext<SceneContextValue | null>(null);

export function useScene(): SceneContextValue {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error('useScene must be used inside <SceneContext.Provider>');
  return ctx;
}

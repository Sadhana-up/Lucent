import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface SceneLayout {
  width: number;
  height: number;
  sunY: number;
  sunR: number;
  vmax: number;
  vmin: number;
  short: boolean;
  safeTop: number;
  safeBottom: number;
  safeLeft: number;
  safeRight: number;
  ridgeHeight: number;
  mapScale: number;
  mapX: number;
  mapY: number;
  parallaxScale: number;
  wordFontSize: number;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** All size math derived once per layout — nothing here runs per frame. */
export function useSceneLayout(): SceneLayout {
  const { width, height } = useWindowDimensions();
  const inset = useSafeAreaInsets();

  return useMemo(() => {
    const short = height < 500;
    const vmax = Math.max(width, height) / 100;
    const vmin = Math.min(width, height) / 100;
    const sunFrac = short ? 0.7 : 0.66;
    const sunY = height * sunFrac;
    const sunSize = clamp(0.27 * vmin, 150, 320);
    const ridgeHeight = height * 0.62;
    const mapScale = Math.max(width / 1600, ridgeHeight / 560);
    return {
      width,
      height,
      sunY,
      sunR: sunSize / 2,
      vmax,
      vmin,
      short,
      safeTop: inset.top,
      safeBottom: inset.bottom,
      safeLeft: inset.left,
      safeRight: inset.right,
      ridgeHeight,
      mapScale,
      mapX: (width - 1600 * mapScale) / 2,
      mapY: height - 560 * mapScale,
      parallaxScale: Math.min(1, width / 1000),
      wordFontSize: clamp(Math.min(0.21 * height, 0.26 * width), 64, 200),
    };
  }, [width, height, inset.top, inset.bottom, inset.left, inset.right]);
}

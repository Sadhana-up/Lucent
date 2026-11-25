import { useMemo } from 'react';
import { Platform } from 'react-native';
import {
  Canvas,
  Circle,
  FractalNoise,
  Group,
  LinearGradient,
  Path,
  Picture,
  RadialGradient,
  Rect,
  Shadow,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { T } from '../constants';
import { clamp01, easeBloom, easeEase, easeFlood, easeReveal, easeRing, easeScan, lerp, smoothstep } from '../easing';
import { DROP_PATH } from '../geometry';
import { GRAIN, MOTES, SPARKS } from '../noise';
import { useScene } from '../context';
import { colors } from '../../../theme/tokens';
import { transparentOf } from '../utils';
import { WorldLayer } from './WorldLayer';
import { SkiaContent } from './SkiaContent';

const EMPTY_PIC = null;
const SPARK_RGB = [0xffffff, 0xf3c9cd, 0xaa9bff];

export function SplashCanvas() {
  const scene = useScene();
  const { t, layout, reduced, leaveT, camScale } = scene;
  const { width: w, height: h, sunY, vmax, vmin } = layout;
  const c = w / 2;

  const camera = useDerivedValue(() => [{ scale: camScale.value }], [camScale]);

  const dawnClip = useDerivedValue(() => {
    const p = easeReveal(clamp01((t.value - T.dawnStart) / T.dawnDur));
    return Skia.Path.Circle(c, sunY, Math.max(0.01, p * 80 * vmax));
  }, [t, c, sunY, vmax]);

  /* ---- drop: LINEAR fall, squash about its centre, double drop-shadow (H1) ---- */
  const dropTransform = useDerivedValue(() => {
    const p = clamp01((t.value - T.dropStart) / T.dropDur);
    const y = -0.7 * h * (1 - clamp01(p / 0.9));
    return [{ translateX: c - 13 }, { translateY: sunY - 20 + y }];
  }, [t, h, c, sunY]);
  const dropOpacity = useDerivedValue(() => {
    if (reduced) return 0;
    const p = clamp01((t.value - T.dropStart) / T.dropDur);
    return p < 0.06 ? p / 0.06 : p > 0.9 ? (1 - p) / 0.1 : 1;
  }, [t, reduced]);
  const dropSquash = useDerivedValue(() => {
    const p = clamp01((t.value - T.dropStart) / T.dropDur);
    const q = p > 0.9 ? (p - 0.9) / 0.1 : 0;
    return [{ scaleX: 1 + 1.2 * q }, { scaleY: 1.25 - 1.05 * q }];
  }, [t]);

  const bloomTransform = useDerivedValue(() => [
    { scale: 0.05 + 0.95 * easeBloom(clamp01((t.value - T.impact) / T.bloomDur)) },
  ], [t]);
  const bloomOpacity = useDerivedValue(() => {
    if (reduced) return 0;
    const p = clamp01((t.value - T.impact) / T.bloomDur);
    return p < 0.14 ? easeBloom(p / 0.14) : 1 - easeBloom((p - 0.14) / 0.86);
  }, [t, reduced]);

  const ringTransforms = T.ringDelays.map((delay) =>
    useDerivedValue(() => [{ scale: 0.1 + 6.9 * easeRing(clamp01((t.value - delay) / T.ringDur)) }], [t, delay]));
  const ringOpacities = T.ringDelays.map((delay) =>
    useDerivedValue(() => {
      if (reduced) return 0;
      const p = clamp01((t.value - delay) / T.ringDur);
      return p >= 1 ? 0 : 0.9 * (1 - easeRing(p));
    }, [t, reduced, delay]));

  const streak = useDerivedValue(() => {
    const p = clamp01((t.value - T.impact) / T.streakDur);
    return {
      sx: p < 0.38 ? easeBloom(p / 0.38) : 1 + 0.3 * easeBloom((p - 0.38) / 0.62),
      op: p < 0.1 ? easeBloom(p / 0.1) : 1 - easeBloom((p - 0.1) / 0.9),
    };
  }, [t]);
  const streakTransform = useDerivedValue(() => [{ scaleX: streak.value.sx }], [streak]);
  const streakOpacity = useDerivedValue(() => (reduced ? 0 : streak.value.op), [streak, reduced]);

  const frontTransform = useDerivedValue(() => [{ scale: easeReveal(clamp01((t.value - T.dawnStart) / T.frontDur)) }], [t]);
  const frontOpacity = useDerivedValue(() => {
    if (reduced) return 0;
    const p = clamp01((t.value - T.dawnStart) / T.frontDur);
    return p >= 0.8 ? (1 - p) / 0.2 : 1;
  }, [t, reduced]);

  /* ---- motes + sparks: verbatim engine physics in one Picture each (E2/E3) ---- */
  const paint = useMemo(() => Skia.Paint(), []);
  const motesPicture = useDerivedValue(() => {
    const rec = Skia.PictureRecorder();
    const cv = rec.beginRecording(Skia.XYWHRect(0, 0, w, h));
    if (reduced) return rec.finishRecordingAsPicture();
    const d = smoothstep((t.value - 2.5) / 1.3);
    const fade = smoothstep((t.value - 0.4) / 1.5);
    const r0 = Math.round(255 - 131 * d), g0 = Math.round(232 - 125 * d), b0 = Math.round(236 - 2 * d);
    paint.setColor(Skia.Color(0xff000000 | (r0 << 16) | (g0 << 8) | b0));
    for (const m of MOTES) {
      const y = (((m.y - m.v * t.value) % 1) + 1) % 1;
      const x = m.x + Math.sin(t.value * m.w + m.p) * 0.012;
      const a = m.a * fade;
      paint.setAlphaf(a * 0.25);
      cv.drawCircle(x * w, y * h, m.r * 3, paint);
      paint.setAlphaf(a);
      cv.drawCircle(x * w, y * h, m.r, paint);
    }
    return rec.finishRecordingAsPicture();
  }, [t, reduced, w, h, paint]);

  const sparksPicture = useDerivedValue(() => {
    const rec = Skia.PictureRecorder();
    const cv = rec.beginRecording(Skia.XYWHRect(0, 0, w, h));
    const tau = t.value - T.impact;
    const k = Math.min(w, h) / 800;
    if (reduced || tau <= 0 || tau >= 2) return rec.finishRecordingAsPicture();
    const palette = SPARK_RGB.map((c) => Skia.Color(0xff000000 | c));
    for (const s of SPARKS) {
      const u = tau / s.life;
      if (u >= 1) continue;
      const x = w / 2 + Math.cos(s.ang) * s.sp * k * tau;
      const y = sunY + Math.sin(s.ang) * s.sp * k * tau + 0.5 * 520 * k * tau * tau;
      const a = Math.pow(1 - u, 1.4);
      paint.setColor(palette[s.mix < 0.4 ? 0 : s.mix < 0.75 ? 1 : 2]);
      paint.setAlphaf(a * 0.28);
      cv.drawCircle(x, y, s.size * 3.2, paint);
      paint.setAlphaf(a);
      cv.drawCircle(x, y, s.size * (1 - 0.4 * u), paint);
    }
    return rec.finishRecordingAsPicture();
  }, [t, reduced, w, h, sunY, paint]);

  /* grain: 6-step offset jumps, fractal noise, opacity .055 (E5) */
  const grainTransform = useDerivedValue(() => {
    if (reduced) return [{ translateX: 0 }, { translateY: 0 }];
    const step = Math.floor(t.value / 0.15) % 6;
    const off = [[0, 0], [-18, 12], [14, -24], [-30, -10], [22, 26], [-12, 18]];
    return [{ translateX: off[step][0] }, { translateY: off[step][1] }];
  }, [t, reduced]);

  const scan = useDerivedValue(() => {
    const p = easeScan(clamp01((t.value - T.scanStart) / T.scanDur));
    return {
      y: -0.24 * h + p * 1.5 * h,
      op: p <= 0 || p >= 1 ? 0 : p < 0.12 ? p / 0.12 : p > 0.85 ? (1 - p) / 0.15 : 1,
    };
  }, [t, h]);
  const scanTransform = useDerivedValue(() => [{ translateY: scan.value.y }], [scan]);
  const scanOpacity = useDerivedValue(() => (reduced ? 0 : scan.value.op), [scan, reduced]);

  const floodProgress = useDerivedValue(() => leaveT.value === Infinity ? 0 : clamp01((t.value - leaveT.value) / T.floodDur), [t, leaveT]);
  const floodTransform = useDerivedValue(() => [{ scale: 0.09 + 0.91 * easeFlood(floodProgress.value) }], [floodProgress]);
  const floodOpacity = useDerivedValue(
    () => (leaveT.value === Infinity ? 0 : easeFlood(clamp01(floodProgress.value / 0.16))), [floodProgress, leaveT]);

  if (Platform.OS === 'web') return null;

  return (
    <Canvas style={{ position: 'absolute', inset: 0 }}>
      <Group origin={vec(c, sunY)} transform={camera}>
        <WorldLayer name="night" scene={scene} />
        <Group clip={dawnClip}><WorldLayer name="dawn" scene={scene} /></Group>

        {/* front growing ring */}
        <Group origin={vec(c, sunY)} transform={frontTransform} opacity={frontOpacity}>
          <Circle c={vec(c, sunY)} r={80 * vmax}>
            <RadialGradient c={vec(c, sunY)} r={80 * vmax} colors={['rgba(255,240,235,0)', 'rgba(255,240,235,0)', 'rgba(255,240,235,.5)', 'rgba(255,240,235,0)']} positions={[0, 0.93, 0.984, 1]} />
          </Circle>
        </Group>

        {/* bloom */}
        <Group origin={vec(c, sunY)} transform={bloomTransform} opacity={bloomOpacity}>
          <Circle c={vec(c, sunY)} r={30 * vmax}>
            <RadialGradient c={vec(c, sunY)} r={30 * vmax} colors={['rgba(255,255,255,.95)', 'rgba(232,180,184,.6)', 'rgba(155,141,240,.28)', 'rgba(255,255,255,0)']} positions={[0, 0.14, 0.34, 0.62]} />
          </Circle>
        </Group>

        {/* anamorphic streak + glow */}
        <Group origin={vec(c, sunY)} transform={streakTransform} opacity={streakOpacity}>
          <Rect x={c - 46 * vmin} y={sunY - 1} width={92 * vmin} height={2}>
            <LinearGradient start={vec(c - 46 * vmin, 0)} end={vec(c + 46 * vmin, 0)} colors={['rgba(255,236,240,0)', 'rgba(255,255,255,.95)', 'rgba(255,236,240,0)']} positions={[0, 0.5, 1]} />
            <Shadow dx={0} dy={0} blur={26} color="rgba(155,141,240,.55)" />
          </Rect>
        </Group>

        {T.ringDelays.map((_, i) => (
          <Group key={'ring' + i} origin={vec(c, sunY)} transform={ringTransforms[i]} opacity={ringOpacities[i]}>
            <Circle c={vec(c, sunY)} r={layout.sunR} color="rgba(165,150,255,.75)" style="stroke" strokeWidth={1.5} />
          </Group>
        ))}

        {/* drop */}
        <Group transform={dropTransform} opacity={dropOpacity}>
          <Rect x={11} y={15.2 - 0.22 * h} width={2} height={0.22 * h}>
            <LinearGradient start={vec(0, 0)} end={vec(0, -0.22 * h)} colors={['rgba(255,255,255,.8)', 'rgba(155,141,240,.35)', 'rgba(155,141,240,0)']} positions={[0, 0.4, 1]} />
          </Rect>
          <Group origin={vec(13, 20)} transform={dropSquash}>
            {DROP_PATH && (
              <Path path={DROP_PATH}>
                <LinearGradient start={vec(12, 0)} end={vec(12, 38)} colors={['#FFFFFF', '#F3C9CD', '#9B8DF0']} positions={[0, 0.55, 1]} />
                <Shadow dx={0} dy={0} blur={14} color="rgba(155,141,240,.95)" />
                <Shadow dx={0} dy={0} blur={4} color="#FFFFFF" />
              </Path>
            )}
          </Group>
        </Group>

        <Picture picture={motesPicture} />
        <Picture picture={sparksPicture} />

        {/* film grain */}
        <Group transform={grainTransform} opacity={0.055}>
          <Rect x={-60} y={-60} width={w + 120} height={h + 120}>
            <FractalNoise freqX={0.9} freqY={0.9} octaves={2} seed={0} />
          </Rect>
        </Group>

        {/* violet scan */}
        <Group transform={scanTransform} opacity={scanOpacity}>
          <Rect x={0} y={0} width={w} height={0.24 * h}>
            <LinearGradient start={vec(0, 0)} end={vec(0, 0.24 * h)} colors={['rgba(124,107,234,0)', 'rgba(155,141,240,.1)', 'rgba(190,176,255,.3)']} positions={[0, 0.7, 1]} />
          </Rect>
          <Rect x={0} y={0.24 * h - 1} width={w} height={1}>
            <LinearGradient start={vec(0, 0)} end={vec(w, 0)} colors={['rgba(255,255,255,0)', 'rgba(255,255,255,.95)', '#FFFFFF', 'rgba(255,255,255,.95)', 'rgba(255,255,255,0)']} positions={[0, 0.2, 0.5, 0.8, 1]} />
            <Shadow dx={0} dy={0} blur={22} color="rgba(124,107,234,.5)" />
          </Rect>
        </Group>

        {/* text inside the camera (A6) */}
        <SkiaContent scene={scene} />

        {/* exit flood */}
        <Group origin={vec(c, sunY)} transform={floodTransform} opacity={floodOpacity}>
          <Circle c={vec(c, sunY)} r={95 * vmax}>
            <RadialGradient c={vec(c, sunY)} r={95 * vmax} colors={['#FFFFFF', '#FFF9F6', colors.cream, transparentOf(colors.cream)]} positions={[0, 0.36, 0.76, 1]} />
          </Circle>
        </Group>
      </Group>
    </Canvas>
  );
}

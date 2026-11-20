import { useMemo } from 'react';
import {
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Path,
  Points,
  RadialGradient,
  Rect,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { T } from '../constants';
import {
  clamp01,
  easeBloom,
  easeFall,
  easeFlood,
  easeReveal,
  easeRing,
  easeScan,
  lerp,
  smoothstep,
} from '../easing';
import { DROP_PATH } from '../geometry';
import { GRAIN, MOTES, SPARKS } from '../noise';
import { useScene } from '../context';
import { colors } from '../../../theme/tokens';
import { WorldLayer } from './WorldLayer';

const EMPTY_POINTS: ReturnType<typeof vec>[] = [];

export function SplashCanvas() {
  const { t, layout, reduced, leaveT } = useScene();
  const { width: w, height: h, sunY, vmax, vmin } = layout;
  const c = w / 2;

  /* Camera push (1 -> 1.045 over 8s) + impact thump, wrapping the entire scene. */
  const camera = useDerivedValue(() => {
    if (reduced) return [{ scale: 1 }];
    const push = lerp(1, T.pushTo, smoothstep(t.value / T.pushDur));
    const u = clamp01((t.value - T.impact) / T.thumpDur);
    const peak = T.thumpPeak;
    const thump = u < peak
      ? lerp(1, T.thumpTo, smoothstep(u / peak))
      : lerp(T.thumpTo, 1, smoothstep((u - peak) / (1 - peak)));
    return [{ scale: push * thump }];
  }, [t, reduced]);

  /* Dawn wipe: a circular clip centred on the sun. One SkPath per frame. */
  const dawnClip = useDerivedValue(() => {
    const p = easeReveal(clamp01((t.value - T.dawnStart) / T.dawnDur));
    return Skia.Path.Circle(c, sunY, Math.max(0.01, p * 80 * vmax));
  }, [t, c, sunY, vmax]);

  /* ---- impact drop ---- */
  const dropTransform = useDerivedValue(() => {
    if (reduced) return [{ translateX: 0 }, { translateY: 0 }];
    const p = clamp01((t.value - T.dropStart) / T.dropDur);
    const y = lerp(-0.7 * h, 0, easeFall(p));
    let sx = 1;
    let sy = 1.25;
    let opacity = 1;
    if (p < 0.06) opacity = p / 0.06;
    else if (p > 0.9) {
      const q = (p - 0.9) / 0.1;
      sx = 1 + 1.2 * q;
      sy = 1.25 - 1.05 * q;
      opacity = 1 - q;
    }
    return [
      { translateX: c - 13 },
      { translateY: sunY - 20 + y },
      { scaleX: sx },
      { scaleY: sy },
    ];
  }, [t, reduced, c, sunY, h]);
  const dropOpacity = useDerivedValue(() => {
    if (reduced) return 0;
    const p = clamp01((t.value - T.dropStart) / T.dropDur);
    return p < 0.06 ? p / 0.06 : p > 0.9 ? (1 - p) / 0.1 : 1;
  }, [t, reduced]);

  /* ---- bloom / rings / streak / front ---- */
  const bloomTransform = useDerivedValue(() => [
    { scale: 0.05 + 0.95 * easeBloom(clamp01((t.value - T.impact) / T.bloomDur)) },
  ], [t]);
  const bloomOpacity = useDerivedValue(() => {
    if (reduced) return 0;
    const p = clamp01((t.value - T.impact) / T.bloomDur);
    return p < 0.14 ? p / 0.14 : Math.max(0, 1 - (p - 0.14) / 0.86);
  }, [t, reduced]);

  const ringTransforms = T.ringDelays.map((delay) =>
    useDerivedValue(() => {
      const p = clamp01((t.value - delay) / T.ringDur);
      return [{ scale: 0.1 + 6.9 * easeRing(p) }];
    }, [t, delay]),
  );
  const ringOpacities = T.ringDelays.map((delay) =>
    useDerivedValue(() => {
      if (reduced) return 0;
      const p = clamp01((t.value - delay) / T.ringDur);
      return p >= 1 ? 0 : 0.9 * (1 - p);
    }, [t, reduced, delay]),
  );

  const streakTransform = useDerivedValue(() => [
    { scaleX: 0.02 + 1.28 * easeBloom(clamp01((t.value - T.impact) / T.streakDur)) },
  ], [t]);
  const streakOpacity = useDerivedValue(() => {
    if (reduced) return 0;
    const p = clamp01((t.value - T.impact) / T.streakDur);
    return p < 0.1 ? p / 0.1 : Math.max(0, 1 - (p - 0.1) / 0.9);
  }, [t, reduced]);

  const frontTransform = useDerivedValue(() => [
    { scale: easeReveal(clamp01((t.value - T.dawnStart) / T.frontDur)) },
  ], [t]);
  const frontOpacity = useDerivedValue(() => {
    if (reduced) return 0;
    const p = clamp01((t.value - T.dawnStart) / T.frontDur);
    return p >= 0.8 ? (1 - p) / 0.2 : 1;
  }, [t, reduced]);

  /* ---- motes (2 batched point layers) ---- */
  const motePoints = useDerivedValue(() => {
    if (reduced) return EMPTY_POINTS;
    const pts: ReturnType<typeof vec>[] = [];
    for (const m of MOTES) {
      const y = (((m.y - m.v * t.value) % 1) + 1) % 1;
      const x = m.x + Math.sin(t.value * m.w + m.p) * 0.012;
      pts.push(vec(x * w, y * h));
    }
    return pts;
  }, [t, reduced, w, h]);
  const moteGlowColor = useDerivedValue(() => {
    const d = smoothstep((t.value - 2.5) / 1.3);
    return `rgba(${Math.round(255 - 131 * d)},${Math.round(232 - 125 * d)},${Math.round(236 - 2 * d)},0.25)`;
  }, [t]);
  const moteCoreColor = useDerivedValue(() => {
    const d = smoothstep((t.value - 2.5) / 1.3);
    return `rgba(${Math.round(255 - 131 * d)},${Math.round(232 - 125 * d)},${Math.round(236 - 2 * d)},0.8)`;
  }, [t]);
  const moteFade = useDerivedValue(() => smoothstep((t.value - 0.4) / 1.5), [t]);

  /* ---- sparks (3 colour buckets) ---- */
  const sparkBuckets = useMemo(() => {
    const buckets: number[][] = [[], [], []];
    for (let i = 0; i < SPARKS.length; i++) buckets[SPARKS[i].mix < 0.4 ? 0 : SPARKS[i].mix < 0.75 ? 1 : 2].push(i);
    return buckets;
  }, []);
  const sparkPoints = [0, 1, 2].map((bucket) =>
    useDerivedValue(() => {
      if (reduced) return EMPTY_POINTS;
      const tau = t.value - T.impact;
      if (tau <= 0 || tau >= 2) return EMPTY_POINTS;
      const k = Math.min(w, h) / 800;
      const pts: ReturnType<typeof vec>[] = [];
      for (const i of sparkBuckets[bucket]) {
        const s = SPARKS[i];
        const u = tau / s.life;
        if (u >= 1) continue;
        pts.push(vec(
          w / 2 + Math.cos(s.ang) * s.sp * k * tau,
          sunY + Math.sin(s.ang) * s.sp * k * tau + 0.5 * 520 * k * tau * tau,
        ));
      }
      return pts;
    }, [t, reduced, w, h, sunY, bucket, sparkBuckets]),
  );
  const sparkColors = ['255,255,255', '243,201,205', '170,155,255'];
  const sparkColorValues = sparkColors.map((rgb) =>
    useDerivedValue(() => {
      const tau = t.value - T.impact;
      const a = tau > 0 && tau < 2 ? Math.pow(1 - clamp01(tau / 2), 1.4) : 0;
      return `rgba(${rgb},${a})`;
    }, [t, rgb]),
  );

  /* ---- grain ---- */
  const grainPoints = useMemo(
    () => GRAIN.map((g) => vec((g.x - 0.1) * w, (g.y - 0.1) * h)),
    [w, h],
  );
  const grainTransform = useDerivedValue(() => {
    if (reduced) return [{ translateX: 0 }, { translateY: 0 }];
    const step = Math.floor(t.value / 0.15) % 6;
    const offsets = [[0, 0], [-18, 12], [14, -24], [-30, -10], [22, 26], [-12, 18]];
    return [{ translateX: offsets[step][0] }, { translateY: offsets[step][1] }];
  }, [t, reduced]);

  /* ---- scan line ---- */
  const scanTransform = useDerivedValue(() => {
    const p = easeScan(clamp01((t.value - T.scanStart) / T.scanDur));
    return [{ translateY: -0.24 * h + p * 1.5 * h }];
  }, [t, h]);
  /* soft white bloom behind the wordmark (the CSS .content::before) */
  const wordGlowOpacity = useDerivedValue(
    () => (reduced ? 1 : smoothstep((t.value - T.wordStart) / 1.6) * 0.62),
    [t, reduced],
  );

  const scanOpacity = useDerivedValue(() => {
    if (reduced) return 0;
    const p = clamp01((t.value - T.scanStart) / T.scanDur);
    return p <= 0 || p >= 1 ? 0 : p < 0.12 ? p / 0.12 : p > 0.85 ? (1 - p) / 0.15 : 1;
  }, [t, reduced]);

  /* ---- exit flood ---- */
  const floodProgress = useDerivedValue(() =>
    leaveT.value === Infinity ? 0 : clamp01((t.value - leaveT.value) / T.floodDur),
  [t, leaveT]);
  const floodTransform = useDerivedValue(() => [
    { scale: 0.09 + 0.91 * easeFlood(floodProgress.value) },
  ], [floodProgress]);
  const floodOpacity = useDerivedValue(
    () => (leaveT.value === Infinity ? 0 : smoothstep(floodProgress.value / 0.16)),
    [floodProgress, leaveT],
  );

  return (
    <Canvas style={{ position: 'absolute', inset: 0 }} >
      <Group origin={vec(c, sunY)} transform={camera}>
        <WorldLayer name="night" />
        <Group clip={dawnClip}>
          <WorldLayer name="dawn" />
        </Group>

        {/* impact: front ring, bloom, streak, shock rings, falling drop */}
        <Group origin={vec(c, sunY)} transform={frontTransform} opacity={frontOpacity}>
          <Circle c={vec(c, sunY)} r={80 * vmax}>
            <RadialGradient
              c={vec(c, sunY)}
              r={80 * vmax}
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(255,240,235,.5)', 'rgba(0,0,0,0)']}
              positions={[0, 0.93, 0.984, 1]}
            />
          </Circle>
        </Group>

        <Group origin={vec(c, sunY)} transform={bloomTransform} opacity={bloomOpacity}>
          <Circle c={vec(c, sunY)} r={30 * vmax}>
            <RadialGradient
              c={vec(c, sunY)}
              r={30 * vmax}
              colors={['rgba(255,255,255,.95)', 'rgba(232,180,184,.6)', 'rgba(155,141,240,.28)', 'rgba(0,0,0,0)']}
              positions={[0, 0.14, 0.34, 0.62]}
            />
          </Circle>
        </Group>

        <Group origin={vec(c, sunY)} transform={streakTransform} opacity={streakOpacity}>
          <Rect x={c - 46 * vmin} y={sunY - 1} width={92 * vmin} height={2}>
            <LinearGradient
              start={vec(c - 46 * vmin, 0)}
              end={vec(c + 46 * vmin, 0)}
              colors={['rgba(0,0,0,0)', 'rgba(255,255,255,.95)', 'rgba(0,0,0,0)']}
              positions={[0, 0.5, 1]}
            />
          </Rect>
        </Group>

        {T.ringDelays.map((_, i) => (
          <Group key={'ring' + i} origin={vec(c, sunY)} transform={ringTransforms[i]} opacity={ringOpacities[i]}>
            <Circle c={vec(c, sunY)} r={layout.sunR} color="rgba(165,150,255,.75)" style="stroke" strokeWidth={1.5} />
          </Group>
        ))}

        <Group transform={dropTransform} opacity={dropOpacity}>
          <Rect x={11} y={-0.22 * h} width={2} height={0.22 * h}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, -0.22 * h)}
              colors={['rgba(255,255,255,.8)', 'rgba(155,141,240,.35)', 'rgba(0,0,0,0)']}
              positions={[0, 0.4, 1]}
            />
          </Rect>
          <Group transform={[{ scaleX: 26 / 24 }, { scaleY: 40 / 38 }]}>
            {DROP_PATH && <Path path={DROP_PATH}>
              <LinearGradient start={vec(12, 0)} end={vec(12, 38)} colors={['#FFFFFF', '#F3C9CD', '#9B8DF0']} positions={[0, 0.55, 1]} />
            </Path>}
          </Group>
        </Group>

        {/* floating motes then impact sparks */}
        <Points points={motePoints} color={moteGlowColor} opacity={moteFade} style="stroke" strokeWidth={7} />
        <Points points={motePoints} color={moteCoreColor} opacity={moteFade} style="stroke" strokeWidth={3} />
        {sparkColors.map((_, i) => (
          <Points
            key={'sparks' + i}
            points={sparkPoints[i]}
            color={sparkColorValues[i]}
            style="stroke"
            strokeWidth={4}
          />
        ))}

        {/* film grain */}
        <Points points={grainPoints} color="#FFFFFF" opacity={0.055} style="stroke" strokeWidth={1.2} transform={grainTransform} />

        {/* soft bloom behind the wordmark */}
        <Circle c={vec(c, layout.safeTop + (layout.short ? 0.05 : 0.11) * h + 0.1 * h)} r={Math.min(w * 0.65, 480)} opacity={wordGlowOpacity}>
          <RadialGradient
            c={vec(c, layout.safeTop + (layout.short ? 0.05 : 0.11) * h + 0.1 * h)}
            r={Math.min(w * 0.65, 480)}
            colors={['rgba(255,255,255,.85)', 'rgba(255,255,255,0)']}
            positions={[0, 1]}
          />
        </Circle>

        {/* violet scan */}
        <Group transform={scanTransform} opacity={scanOpacity}>
          <Rect x={0} y={0} width={w} height={0.24 * h}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, 0.24 * h)}
              colors={['rgba(124,107,234,0)', 'rgba(155,141,240,.1)', 'rgba(190,176,255,.3)']}
              positions={[0, 0.7, 1]}
            />
          </Rect>
          <Rect x={0} y={0.24 * h - 1} width={w} height={1}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(w, 0)}
              colors={['rgba(255,255,255,0)', '#fff', 'rgba(255,255,255,0)']}
              positions={[0, 0.5, 1]}
            />
          </Rect>
        </Group>

        {/* exit flood — lands on exactly #FAF6F0 */}
        <Group origin={vec(c, sunY)} transform={floodTransform} opacity={floodOpacity}>
          <Circle c={vec(c, sunY)} r={95 * vmax}>
            <RadialGradient
              c={vec(c, sunY)}
              r={95 * vmax}
              colors={['#FFFFFF', '#FFF9F6', colors.cream, 'rgba(250,246,240,0)']}
              positions={[0, 0.36, 0.76, 1]}
            />
          </Circle>
        </Group>
      </Group>
    </Canvas>
  );
}

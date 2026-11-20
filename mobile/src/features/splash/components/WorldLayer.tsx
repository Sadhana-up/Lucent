import { useMemo } from 'react';
import {
  Circle,
  Group,
  Path,
  Rect,
  RadialGradient,
  LinearGradient,
  SweepGradient,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { T, TONES, WORLD, RIDGES } from '../constants';
import {
  clamp01,
  easeDolly,
  easeSmooth,
  lerp,
  smoothstep,
  TAU,
} from '../easing';
import { makeRayStops, RIDGE_GEOMETRY } from '../geometry';
import { STARS } from '../noise';
import { useScene } from '../context';
import { colors } from '../../../theme/tokens';

type WorldName = 'night' | 'dawn';

const STAR_COLOURS = ['255,255,255', '255,226,232', '200,190,255'];
const STAR_PHASES = [
  { s: 1.3, p: 0.4 },
  { s: 0.9, p: 2.1 },
  { s: 1.7, p: 4.3 },
];

export function WorldLayer({ name }: { name: WorldName }) {
  const { t, px, py, layout, reduced } = useScene();
  const c = layout.width / 2;
  const { sunY, sunR, vmax, height: h, width: w } = layout;
  const tone = TONES[name];
  const world = WORLD[name];
  const night = name === 'night';
  const rays = useMemo(
    () => makeRayStops(world.rA, world.rAlpha, world.rSeed),
    [world.rA, world.rAlpha, world.rSeed],
  );

  const sceneOpacity = useDerivedValue(
    () => (reduced ? 1 : smoothstep(t.value / T.sceneFade)),
    [t, reduced],
  );
  const worldOpacity = useDerivedValue(
    () => (night && !reduced && t.value > T.nightHide ? 0 : 1),
    [t, reduced, night],
  );

  /* ---- orbs ---- */
  const orbs = useMemo(
    () => [
      { cx: 17 * vmax, cy: 15 * vmax, r: 31 * vmax, d: 0.12, dur: 14, color: night ? 'rgba(124,107,234,.30)' : 'rgba(124,107,234,.16)' },
      { cx: w - 13 * vmax, cy: sunY - 16 * vmax + 29 * vmax, r: 29 * vmax, d: 0.18, dur: 17, color: night ? 'rgba(61,122,82,.42)' : 'rgba(232,180,184,.44)' },
      { cx: w * 0.18 + 20 * vmax, cy: h * 0.86 - 20 * vmax, r: 20 * vmax, d: 0.1, dur: 12, color: night ? 'rgba(232,180,184,.15)' : 'rgba(61,122,82,.12)' },
    ],
    [vmax, w, h, sunY, night],
  );
  const orbTransforms = orbs.map((o) =>
    useDerivedValue(() => {
      if (reduced) return [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }];
      const f = 0.5 - 0.5 * Math.cos((t.value * Math.PI) / o.dur);
      return [
        { translateX: -px.value * 22 * layout.parallaxScale * o.d + 4 * vmax * f },
        { translateY: -py.value * 8 * layout.parallaxScale * o.d + 3 * vmax * f },
        { scale: 1 + 0.12 * f },
      ];
    }, [t, px, py, reduced, o.d, o.dur, vmax, layout.parallaxScale]),
  );

  /* ---- stars (3 batched paths, grouped twinkle) ---- */
  const starPaths = useMemo(() => {
    const builders = [Skia.PathBuilder.Make(), Skia.PathBuilder.Make(), Skia.PathBuilder.Make()];
    for (const s of STARS) builders[s.group].addCircle(s.x * w, s.y * h, s.r);
    return builders.map((b) => b.build());
  }, [w, h]);
  const starOpacities = STAR_PHASES.map((ph, i) =>
    useDerivedValue(() => {
      if (!night || reduced || t.value > T.starsStop) return 0;
      const fade = smoothstep(t.value / 1.2);
      return (0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t.value * ph.s + ph.p))) * fade * (i === 0 ? 1 : 0.55);
    }, [t, night, reduced, ph.s, ph.p, i]),
  );

  /* ---- rays ---- */
  const rayOpacity = useDerivedValue(
    () => (reduced ? 1 : smoothstep((t.value - T.raysStart) / T.raysDur)),
    [t, reduced],
  );
  const rayTransform = useDerivedValue(
    () => [{ rotate: reduced ? 0 : (t.value * TAU) / 150 }],
    [t, reduced],
  );

  /* ---- sun ---- */
  const sunOpacity = useDerivedValue(
    () => (reduced ? 1 : easeSmooth(clamp01((t.value - T.sunStart) / T.sunDur))),
    [t, reduced],
  );
  const sunTransform = useDerivedValue(() => {
    if (reduced) return [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }];
    const p = easeSmooth(clamp01((t.value - T.sunStart) / T.sunDur));
    return [
      { translateX: -px.value * 22 * layout.parallaxScale * 0.3 },
      { translateY: -py.value * 8 * layout.parallaxScale * 0.3 + (1 - p) * 0.07 * h },
      { scale: 0.12 + 0.88 * p },
    ];
  }, [t, px, py, reduced, h, layout.parallaxScale]);
  const haloOpacity = useDerivedValue(
    () => (reduced ? 0.95 : 0.85 + 0.15 * (0.5 + 0.5 * Math.sin((t.value - 3) * TAU / 5))),
    [t, reduced],
  );
  const haloTransform = useDerivedValue(
    () => [{ scale: reduced ? 1 : 1 + 0.05 * (0.5 + 0.5 * Math.sin((t.value - 3) * TAU / 5)) }],
    [t, reduced],
  );
  const sheenTransform = useDerivedValue(
    () => [{ rotate: reduced ? 0 : (t.value * TAU) / 14 }],
    [t, reduced],
  );
  const orbitATransform = useDerivedValue(
    () => [{ rotate: reduced ? 0 : (t.value * TAU) / 90 }],
    [t, reduced],
  );
  const orbitBTransform = useDerivedValue(
    () => [{ rotate: reduced ? 0 : -(t.value * TAU) / 140 }],
    [t, reduced],
  );
  const orbitOpacity = useDerivedValue(
    () => (reduced ? 1 : smoothstep((t.value - 2.2) / 1.4)),
    [t, reduced],
  );

  /* ---- vignette ---- */
  const vignetteColors = ['rgba(0,0,0,0)', 'rgba(0,0,0,0)', world.vignette];
  const vignettePositions = [0, world.vigInner, 1];

  return (
    <Group opacity={sceneOpacity}>
      <Group opacity={worldOpacity}>
        {/* sky */}
          <Rect x={0} y={0} width={w} height={h}>
            {night ? (
              <RadialGradient
                c={vec(c, sunY)}
                r={Math.max(w * 1.2, h * 0.7)}
                colors={['#265039', '#142B1E', colors.night]}
                positions={[0, 0.42, 1]}
              />
            ) : (
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, h)}
                colors={['#F6F4FB', colors.cream, '#F4E4DE']}
                positions={[0, 0.52, 1]}
              />
            )}
          </Rect>
          {!night && (
            <Rect x={0} y={0} width={w} height={h}>
              <RadialGradient
                c={vec(c, sunY)}
                r={Math.max(w * 0.9, h * 0.6)}
                colors={['rgba(232,180,184,.55)', 'rgba(232,180,184,0)']}
                positions={[0, 0.7]}
              />
            </Rect>
          )}

          {/* orbs */}
          {orbs.map((o, i) => (
            <Group key={'orb' + i} origin={vec(o.cx, o.cy)} transform={orbTransforms[i]}>
              <Circle c={vec(o.cx, o.cy)} r={o.r}>
                <RadialGradient c={vec(o.cx, o.cy)} r={o.r} colors={[o.color, 'rgba(0,0,0,0)']} />
              </Circle>
            </Group>
          ))}

          {/* Milky Way + stars (night only) */}
          {night && (
            <>
              <Group origin={vec(c, h * 0.27)} transform={[{ rotate: (-22 * Math.PI) / 180 }]}>
                <Rect x={-0.25 * w} y={0.12 * h} width={1.5 * w} height={0.3 * h}>
                  <RadialGradient
                    c={vec(c, h * 0.27)}
                    r={0.45 * w}
                    colors={['rgba(205,195,255,.22)', 'rgba(232,180,184,.09)', 'rgba(0,0,0,0)']}
                    positions={[0, 0.55, 1]}
                  />
                </Rect>
              </Group>
              {starPaths.map((path, i) =>
                path ? <Path key={'stars' + i} path={path} color={`rgb(${STAR_COLOURS[i]})`} opacity={starOpacities[i]} /> : null,
              )}
            </>
          )}

          {/* god rays */}
          <Group origin={vec(c, sunY)} transform={rayTransform} opacity={rayOpacity}>
            <Circle c={vec(c, sunY)} r={50 * vmax}>
              <SweepGradient c={vec(c, sunY)} colors={rays.colors} positions={rays.positions} />
            </Circle>
          </Group>

          {/* sun */}
          <Group origin={vec(c, sunY)} transform={sunTransform} opacity={sunOpacity}>
            <Group origin={vec(c, sunY)} transform={haloTransform} opacity={haloOpacity}>
              <Circle c={vec(c, sunY)} r={sunR * 1.95}>
                <RadialGradient
                  c={vec(c, sunY)}
                  r={sunR * 1.95}
                  colors={[world.haloA, world.haloB, 'rgba(0,0,0,0)']}
                  positions={[0, 0.32, 0.68]}
                />
              </Circle>
            </Group>

            <Group origin={vec(c, sunY)} transform={orbitATransform} opacity={orbitOpacity}>
              <Circle c={vec(c, sunY)} r={sunR * 0.96} color={world.ring} style="stroke" strokeWidth={0.6} />
              <Circle c={vec(c, sunY)} r={sunR * 0.88} color={world.ring} style="stroke" strokeWidth={1.6} />
              <Circle c={vec(c, sunY - sunR * 0.96)} r={2.2} color={world.sat} />
            </Group>
            <Group origin={vec(c, sunY)} transform={orbitBTransform} opacity={orbitOpacity}>
              <Circle c={vec(c, sunY)} r={sunR} color={world.ring} style="stroke" strokeWidth={0.6} />
            </Group>

            <Circle c={vec(c, sunY)} r={sunR}>
              <RadialGradient
                c={vec(c, sunY)}
                r={sunR}
                colors={['#FFEFF1', '#F6D0D4', '#D3B1E8', '#9B8DF0']}
                positions={[0, 0.42, 0.72, 1]}
              />
            </Circle>
            <Circle c={vec(c - sunR * 0.19, sunY - sunR * 0.25)} r={sunR * 0.66}>
              <RadialGradient c={vec(c - sunR * 0.19, sunY - sunR * 0.25)} r={sunR * 0.66} colors={['rgba(255,255,255,.95)', 'rgba(255,255,255,0)']} positions={[0, 1]} />
            </Circle>
            <Circle c={vec(c + sunR * 0.2, sunY + sunR * 0.3)} r={sunR * 0.55}>
              <RadialGradient c={vec(c + sunR * 0.2, sunY + sunR * 0.3)} r={sunR * 0.55} colors={['rgba(124,107,234,.55)', 'rgba(124,107,234,0)']} positions={[0, 1]} />
            </Circle>
            <Circle c={vec(c, sunY)} r={sunR * 0.86} color="rgba(255,255,255,.38)" style="stroke" strokeWidth={1} />
            <Group origin={vec(c, sunY)} transform={sheenTransform}>
              <Circle c={vec(c, sunY)} r={sunR} opacity={0.35}>
                <SweepGradient
                  c={vec(c, sunY)}
                  colors={['rgba(255,255,255,0)', 'rgba(255,255,255,.5)', 'rgba(255,255,255,0)', 'rgba(124,107,234,.4)', 'rgba(255,255,255,0)']}
                  positions={[0, 0.12, 0.4, 0.7, 1]}
                />
              </Circle>
            </Group>
          </Group>

          {/* ridges + mist */}
          {RIDGES.map((_, i) => (
            <Ridge key={'ridge' + i} index={i} world={name} />
          ))}

          {/* vignette */}
          <Rect x={0} y={0} width={w} height={h}>
            <RadialGradient
              c={vec(c, h * 0.48)}
              r={Math.max(w * 1.2, h * 0.9)}
              colors={vignetteColors}
              positions={vignettePositions}
            />
          </Rect>
      </Group>
    </Group>
  );
}

function Ridge({ index, world }: { index: number; world: WorldName }) {
  const { t, px, py, layout, reduced } = useScene();
  const { width: w, height: h, mapScale, mapX, mapY } = layout;
  const spec = RIDGES[index];
  const geo = RIDGE_GEOMETRY[index];
  const tone = TONES[world][index];
  const shade = hexToRgba(tone.shade, tone.sh);

  const transform = useDerivedValue(() => {
    if (reduced) {
      return [{ translateX: 0 }, { translateY: 0 }, { scale: spec.k }];
    }
    const rise = easeSmooth(clamp01((t.value - spec.delay) / T.ridgeRiseDur));
    const riseY = (1 - rise) * 0.7 * h;
    const dolly = lerp(1, spec.k, easeDolly(clamp01((t.value - T.dollyStart) / T.dollyDur)));
    return [
      { translateX: -px.value * 22 * layout.parallaxScale * spec.d },
      { translateY: -py.value * 8 * layout.parallaxScale * spec.d + riseY },
      { scale: dolly },
    ];
  }, [t, px, py, reduced, spec.delay, spec.d, spec.k, h, layout.parallaxScale]);

  const mistOpacity = useDerivedValue(() => {
    if (!spec.mist || reduced) return 0;
    return smoothstep((t.value - spec.mist.delay) / 2);
  }, [t, spec.mist, reduced]);
  const mistTransform = useDerivedValue(
    () => [{ translateX: reduced ? 0 : Math.sin(t.value * TAU / 18) * 0.06 * w }],
    [t, reduced, w],
  );

  return (
    <>
      <Group origin={vec(w / 2, h)} transform={transform}>
        <Group transform={[{ translateX: mapX }, { translateY: mapY }, { scale: mapScale }]}>
          {geo.fill && (
            <Path path={geo.fill}>
              <LinearGradient start={vec(0, geo.minY)} end={vec(0, 560)} colors={[tone.a, tone.b]} />
            </Path>
          )}
          {geo.fill && (
            <Path path={geo.fill}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(1600, 0)}
                colors={[shade, 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', shade]}
                positions={[0, 0.4, 0.6, 1]}
              />
            </Path>
          )}
          {geo.snow && tone.snow && (
            <Path path={geo.snow} opacity={tone.sa ?? 1}>
              <LinearGradient
                start={vec(0, geo.minY)}
                end={vec(0, (spec.snowY || 0) + 44)}
                colors={[tone.snow, withAlpha(tone.snow, (tone.sa ?? 1) * 0.6)]}
              />
            </Path>
          )}
          {geo.line && (
            <Path path={geo.line} color={tone.rim} style="stroke" strokeWidth={1.2} />
          )}
        </Group>
      </Group>
      {spec.mist && (
        <Group transform={mistTransform} opacity={mistOpacity}>
          <Rect
            x={-0.25 * w}
            y={h - (spec.mist.y + 18) * (h / 100)}
            width={1.5 * w}
            height={18 * (h / 100)}
          >
            <RadialGradient
              c={vec(w / 2, h - (spec.mist.y + 9) * (h / 100))}
              r={0.5 * w}
              colors={[WORLD[world].mist, 'rgba(0,0,0,0)']}
              positions={[0, 1]}
            />
          </Rect>
        </Group>
      )}
    </>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
function withAlpha(hex: string, a: number): string {
  return hexToRgba(hex, a);
}

import { useMemo } from 'react';
import {
  Blur,
  Circle,
  DashPathEffect,
  Group,
  Image,
  Picture,
  Path,
  Rect,
  RadialGradient,
  LinearGradient,
  SweepGradient,
  Shadow,
  Skia,
  TileMode,
  BlendMode,
  vec,
} from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { T, TONES, WORLD, RIDGES } from '../constants';
import { clamp01, easeDolly, easeEase, easeInOutCss, easeSmooth, lerp, smoothstep, pingPong, TAU } from '../easing';
import { makeRayStops, RIDGE_GEOMETRY } from '../geometry';
import { STARS } from '../noise';
import type { SceneContextValue } from '../context';
import { colors } from '../../../theme/tokens';
import { EllipseFill, transparentOf } from '../utils';

type WorldName = 'night' | 'dawn';
type Scene = SceneContextValue;

const STAR_COLOURS = ['rgb(255,255,255)', 'rgb(255,226,232)', 'rgb(200,190,255)'];
const ORB = [
  { dur: 14, off: 0, rev: false },
  { dur: 17, off: 4, rev: true },
  { dur: 12, off: 7, rev: false },
];

export function WorldLayer({ name, scene }: { name: WorldName; scene: Scene }) {
  const { t, px, py, layout, reduced, nightGone } = scene;
  const c = layout.width / 2;
  const { sunY, sunR, vmax, height: h, width: w } = layout;
  const tone = TONES[name];
  const world = WORLD[name];
  const night = name === 'night';
  const rays = useMemo(() => makeRayStops(world.rA, world.rAlpha, world.rSeed), [world.rA, world.rAlpha, world.rSeed]);

  const sceneOpacity = useDerivedValue(() => (reduced ? 1 : easeEase(clamp01(t.value / T.sceneFade))), [t, reduced]);
  const milkyOpacity = useDerivedValue(() => (reduced ? 1 : easeEase(clamp01((t.value - T.milkyStart) / T.milkyDur))), [t, reduced]);
  const worldOpacity = useDerivedValue(() => (night && !reduced && t.value > T.nightHide ? 0 : 1), [t, reduced, night]);

  /* Stars recorded into a Picture — per-star phase, no batching artefacts. */
  const paint = useMemo(() => Skia.Paint(), []);
  const starColors = useMemo(() => STAR_COLOURS.map((x) => Skia.Color(x)), []);
  const starPicture = useDerivedValue(() => {
    const rec = Skia.PictureRecorder();
    const cv = rec.beginRecording(Skia.XYWHRect(0, 0, w, h));
    if (!reduced && t.value < T.starsStop) {
      const fade = smoothstep(t.value / 1.2);
      for (const s of STARS) {
        paint.setColor(starColors[s.group]);
        paint.setAlphaf((0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t.value * s.s + s.p))) * fade * s.a);
        // the engine draws stars as 2r squares, not circles — cheaper and exact
        cv.drawRect(Skia.XYWHRect(s.x * w - s.r, s.y * h - s.r, s.r * 2, s.r * 2), paint);
      }
    }
    return rec.finishRecordingAsPicture();
  }, [t, reduced, w, h, paint, starColors]);

  /* Orbs (F4/F5). */
  const orbTransforms = ORB.map((o, i) => useDerivedValue(() => {
    const e = reduced ? 0 : easeInOutCss(pingPong((t.value + o.off) / o.dur));
    const f = o.rev ? 1 - e : e;
    const d = [0.12, 0.18, 0.1][i];
    return [
      { translateX: -px.value * 22 * layout.parallaxScale * d + 4 * vmax * f },
      { translateY: -py.value * 8 * layout.parallaxScale * d + 3 * vmax * f },
      { scale: 1 + 0.12 * f },
    ];
  }, [t, px, py, reduced, o, vmax, layout.parallaxScale]));
  const orbs = [
    { cx: 17 * vmax, cy: 15 * vmax, r: 31 * vmax, color: night ? 'rgba(124,107,234,.30)' : 'rgba(124,107,234,.16)' },
    { cx: w - 13 * vmax, cy: 33 * vmax, r: 29 * vmax, color: night ? 'rgba(61,122,82,.42)' : 'rgba(232,180,184,.44)' },
    { cx: w * 0.18 + 20 * vmax, cy: h * 0.86 - 20 * vmax, r: 20 * vmax, color: night ? 'rgba(232,180,184,.15)' : 'rgba(61,122,82,.12)' },
  ];

  /* Rays: masked, parallax d=.3, CSS ease (D1). */
  const rayOpacity = useDerivedValue(() => (reduced ? 1 : easeEase(clamp01((t.value - T.raysStart) / T.raysDur))), [t, reduced]);
  const rayTransform = useDerivedValue(() => {
    const rot = reduced ? 0 : (t.value * TAU) / 150;
    return [
      { translateX: -px.value * 22 * layout.parallaxScale * 0.3 },
      { translateY: -py.value * 8 * layout.parallaxScale * 0.3 },
      { rotate: rot },
    ];
  }, [t, px, py, reduced, layout.parallaxScale]);

  /* The fan is a conic gradient cut by a radial mask. Expressing that as a
     `<Group layer>` costs one full-screen offscreen every frame, so it is baked
     into a single image once; only its rotation changes. Soft gradients survive
     the low-res texture. */
  const rayR = 70 * vmax;
  const rayImage = useMemo(() => {
    const px = 640;
    const surface = Skia.Surface.Make(px, px);
    if (!surface) return null;
    const cv = surface.getCanvas();
    const k = px / (2 * rayR);
    cv.scale(k, k);
    cv.translate(rayR, rayR);
    cv.saveLayer();
    const fan = Skia.Paint();
    fan.setShader(Skia.Shader.MakeSweepGradient(
      0, 0, rays.colors.map((x) => Skia.Color(x)), rays.positions, TileMode.Clamp));
    cv.drawCircle(0, 0, rayR, fan);
    const mask = Skia.Paint();
    mask.setShader(Skia.Shader.MakeRadialGradient(
      vec(0, 0), rayR,
      [Skia.Color('rgba(0,0,0,1)'), Skia.Color('rgba(0,0,0,.6)'), Skia.Color('rgba(0,0,0,0)')],
      [0, 0.24, 1], TileMode.Clamp));
    mask.setBlendMode(BlendMode.DstIn);
    cv.drawCircle(0, 0, rayR, mask);
    cv.restore();
    return surface.makeImageSnapshot();
  }, [rayR, rays]);

  /* Sun. */
  const sunOpacity = useDerivedValue(() => (reduced ? 1 : easeSmooth(clamp01((t.value - T.sunStart) / T.sunDur))), [t, reduced]);
  const sunTransform = useDerivedValue(() => {
    if (reduced) return [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }];
    const p = easeSmooth(clamp01((t.value - T.sunStart) / T.sunDur));
    return [
      { translateX: -px.value * 22 * layout.parallaxScale * 0.3 },
      { translateY: -py.value * 8 * layout.parallaxScale * 0.3 + (1 - p) * 0.07 * h },
      { scale: 0.12 + 0.88 * p },
    ];
  }, [t, px, py, reduced, h, layout.parallaxScale]);
  const haloState = useDerivedValue(() => {
    if (reduced) return { s: 1, o: 1 };
    // `breathe` has a 3s delay with fill:both — it holds the from-state until then.
    const x = t.value < 3 ? 0 : easeInOutCss(pingPong((t.value - 3) / 5));
    return { s: 1 + 0.1 * x, o: 0.85 + 0.15 * x };
  }, [t, reduced]);
  const haloTransform = useDerivedValue(() => [{ scale: haloState.value.s }], [haloState]);
  const haloOpacity = useDerivedValue(() => haloState.value.o, [haloState]);
  const sheenTransform = useDerivedValue(() => [{ rotate: reduced ? 0 : (t.value * TAU) / 14 }], [t, reduced]);
  const orbitA = useDerivedValue(() => [{ rotate: reduced ? 0 : (t.value * TAU) / 90 }], [t, reduced]);
  const orbitB = useDerivedValue(() => [{ rotate: reduced ? 0 : -(t.value * TAU) / 140 }], [t, reduced]);
  const orbitAOp = useDerivedValue(() => (reduced ? 1 : easeEase(clamp01((t.value - 2.2) / 1.4))), [t, reduced]);
  const orbitBOp = useDerivedValue(() => (reduced ? 1 : easeEase(clamp01((t.value - 2.4) / 1.4))), [t, reduced]);
  const u = sunR * 0.0168;
  const glowR = sunR + 14 + 105;
  const glowStop = (sunR + 14) / glowR;
  const discClip = useMemo(() => Skia.Path.Circle(c, sunY, sunR), [c, sunY, sunR]);

  // All hooks above must run unconditionally; skip drawing only after that.
  if (night && nightGone) return null;

  return (
    <Group opacity={sceneOpacity}>
      <Group opacity={worldOpacity}>
        {/* sky */}
        {night ? (
          <EllipseFill cx={c} cy={sunY} rx={1.2 * w} ry={0.7 * h} w={w} h={h} colors={['#265039', '#142B1E', colors.night]} positions={[0, 0.42, 1]} />
        ) : (
          <>
            <Rect x={0} y={0} width={w} height={h}>
              <LinearGradient start={vec(0, 0)} end={vec(0, h)} colors={['#F6F4FB', colors.cream, '#F4E4DE']} positions={[0, 0.52, 1]} />
            </Rect>
            <EllipseFill cx={c} cy={sunY} rx={0.9 * w} ry={0.6 * h} w={w} h={h} colors={['rgba(232,180,184,.55)', 'rgba(232,180,184,0)']} positions={[0, 0.7]} />
          </>
        )}

        {/* orbs */}
        {orbs.map((o, i) => (
          <Group key={'orb' + i} origin={vec(o.cx, o.cy)} transform={orbTransforms[i]}>
            <Circle c={vec(o.cx, o.cy)} r={o.r}>
              <RadialGradient c={vec(o.cx, o.cy)} r={o.r} colors={[o.color, transparentOf(o.color)]} />
            </Circle>
          </Group>
        ))}

        {/* Milky Way + stars */}
        {night && (
          <>
            <Group origin={vec(c, h * 0.27)} transform={[{ rotate: (-22 * Math.PI) / 180 }]} opacity={milkyOpacity}>
              <EllipseFill cx={c} cy={h * 0.27} rx={0.75 * w} ry={0.15 * h} w={w} h={h} colors={['rgba(205,195,255,.22)', 'rgba(232,180,184,.09)', 'rgba(232,180,184,0)']} positions={[0, 0.55, 1]} />
            </Group>
            <Picture picture={starPicture} />
          </>
        )}

        {/* soft god-rays (pre-baked, rotated per frame) */}
        <Group origin={vec(c, sunY)} transform={rayTransform} opacity={rayOpacity}>
          {rayImage ? (
            <Image image={rayImage} x={c - rayR} y={sunY - rayR} width={rayR * 2} height={rayR * 2} fit="fill" />
          ) : (
            <Group layer>
              <Circle c={vec(c, sunY)} r={rayR}>
                <SweepGradient c={vec(c, sunY)} colors={rays.colors} positions={rays.positions} />
              </Circle>
              <Circle c={vec(c, sunY)} r={rayR} blendMode="dstIn">
                <RadialGradient c={vec(c, sunY)} r={rayR} colors={['rgba(0,0,0,1)', 'rgba(0,0,0,.6)', 'rgba(0,0,0,0)']} positions={[0, 0.24, 1]} />
              </Circle>
            </Group>
          )}
        </Group>

        {/* sun */}
        <Group origin={vec(c, sunY)} transform={sunTransform} opacity={sunOpacity}>
          <Group origin={vec(c, sunY)} transform={haloTransform} opacity={haloOpacity}>
            <Circle c={vec(c, sunY)} r={sunR * 4.1}>
              <RadialGradient c={vec(c, sunY)} r={sunR * 4.1} colors={[world.haloA, world.haloB, transparentOf(world.haloB)]} positions={[0, 0.32, 0.68]} />
            </Circle>
          </Group>

          {/* outer glow under the disc — CSS box-shadow 0 0 70px 14px, as a gradient ring */}
          <Circle c={vec(c, sunY)} r={glowR}>
            <RadialGradient
              c={vec(c, sunY)}
              r={glowR}
              colors={['rgba(232,180,184,.5)', 'rgba(232,180,184,.5)', 'rgba(232,180,184,.18)', transparentOf('rgba(232,180,184,.5)')]}
              positions={[0, glowStop, glowStop + (1 - glowStop) * 0.5, 1]}
            />
          </Circle>

          <Group clip={discClip}>
            <Circle c={vec(c, sunY)} r={sunR * Math.SQRT2}>
              <RadialGradient c={vec(c, sunY)} r={sunR * Math.SQRT2} colors={['#FFEFF1', '#F6D0D4', '#D3B1E8', '#9B8DF0']} positions={[0, 0.42, 0.72, 1]} />
            </Circle>
            <Circle c={vec(c - sunR * 0.38, sunY - sunR * 0.5)} r={sunR * 0.67}>
              <RadialGradient c={vec(c - sunR * 0.38, sunY - sunR * 0.5)} r={sunR * 0.67} colors={['rgba(255,255,255,.95)', 'rgba(255,255,255,0)']} positions={[0, 1]} />
            </Circle>
            <Circle c={vec(c + sunR * 0.4, sunY + sunR * 0.6)} r={sunR * 1.17}>
              <RadialGradient c={vec(c + sunR * 0.4, sunY + sunR * 0.6)} r={sunR * 1.17} colors={['rgba(124,107,234,.55)', 'rgba(124,107,234,0)']} positions={[0, 1]} />
            </Circle>
            <Circle c={vec(c, sunY)} r={sunR} color={transparentOf('rgba(91,75,199,.42)')}>
              <Shadow inner dx={-16} dy={-20} blur={23} color="rgba(91,75,199,.42)" />
              <Shadow inner dx={10} dy={12} blur={14} color="rgba(255,255,255,.75)" />
            </Circle>
            <Circle c={vec(c, sunY)} r={sunR * 0.86} color="rgba(255,255,255,.38)" style="stroke" strokeWidth={1} />
            <Group origin={vec(c, sunY)} transform={sheenTransform} blendMode="softLight">
              <Circle c={vec(c, sunY)} r={sunR}>
                <Blur blur={8} />
                <SweepGradient c={vec(c, sunY)} colors={['rgba(255,255,255,0)', 'rgba(255,255,255,.5)', 'rgba(255,255,255,0)', 'rgba(124,107,234,.4)', 'rgba(255,255,255,0)']} positions={[0, 0.2, 0.4, 0.7, 1]} />
              </Circle>
            </Group>
          </Group>

          <Group origin={vec(c, sunY)} transform={orbitA} opacity={orbitAOp}>
            <Circle c={vec(c, sunY)} r={96 * u} color={world.ring} style="stroke" strokeWidth={0.4 * u} />
            <Circle c={vec(c, sunY)} r={88 * u} color={world.ring} style="stroke" strokeWidth={1.6 * u} strokeCap="round">
              <DashPathEffect intervals={[0.6 * u, 4.4 * u]} />
            </Circle>
            <Circle c={vec(c, sunY - 96 * u)} r={2.2 * u} color={world.sat} />
          </Group>
          <Group origin={vec(c, sunY)} transform={orbitB} opacity={orbitBOp}>
            <Circle c={vec(c, sunY)} r={100 * u} color={world.ring} style="stroke" strokeWidth={0.6 * u} strokeCap="round">
              <DashPathEffect intervals={[46 * u, 190 * u]} />
            </Circle>
          </Group>
        </Group>

        {/* ridges + mist */}
        {RIDGES.map((_, i) => <Ridge key={'ridge' + i} index={i} world={name} scene={scene} />)}

        {/* vignette */}
        {night ? (
          <EllipseFill cx={c} cy={0.48 * h} rx={1.2 * w} ry={0.9 * h} w={w} h={h} colors={[transparentOf(world.vignette), transparentOf(world.vignette), world.vignette]} positions={[0, 0.52, 1]} />
        ) : (
          <EllipseFill cx={c} cy={0.46 * h} rx={1.3 * w} ry={1.0 * h} w={w} h={h} colors={[transparentOf(world.vignette), transparentOf(world.vignette), world.vignette]} positions={[0, 0.58, 1]} />
        )}
      </Group>
    </Group>
  );
}

function Ridge({ index, world, scene }: { index: number; world: WorldName; scene: Scene }) {
  const { t, px, py, layout, reduced } = scene;
  const { width: w, height: h, mapScale, mapX, mapY } = layout;
  const spec = RIDGES[index];
  const geo = RIDGE_GEOMETRY[index];
  const tone = TONES[world][index];

  const transform = useDerivedValue(() => {
    if (reduced) return [{ translateX: 0 }, { translateY: 0 }, { scale: spec.k }];
    const rise = easeSmooth(clamp01((t.value - spec.delay) / T.ridgeRiseDur));
    const riseY = (1 - rise) * 0.7 * h;
    const dolly = lerp(1, spec.k, easeDolly(clamp01((t.value - T.dollyStart) / T.dollyDur)));
    return [
      { translateX: -px.value * 22 * layout.parallaxScale * spec.d },
      { translateY: -py.value * 8 * layout.parallaxScale * spec.d + riseY },
      { scale: dolly },
    ];
  }, [t, px, py, reduced, spec, h, layout.parallaxScale]);

  const mistOpacity = useDerivedValue(
    () => (!spec.mist || reduced ? 0 : easeEase(clamp01((t.value - spec.mist.delay) / 2))),
    [t, spec.mist, reduced],
  );
  const mistTransform = useDerivedValue(() => [
    { translateX: reduced ? 0 : lerp(-0.09 * w, 0.09 * w, easeInOutCss(pingPong(t.value / 18))) },
  ], [t, reduced, w]);

  if (!geo) return null;
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
                start={vec(-320, 0)}
                end={vec(1920, 0)}
                colors={[withAlpha(tone.shade, tone.sh), transparentOf(tone.shade), transparentOf(tone.shade), withAlpha(tone.shade, tone.sh)]}
                positions={[0, 0.4, 0.6, 1]}
              />
            </Path>
          )}
          {geo.snow && tone.snow && (
            <Path path={geo.snow}>
              <LinearGradient
                start={vec(0, geo.minY)}
                end={vec(0, (spec.snowY || 0) + 44)}
                colors={[withAlpha(tone.snow, tone.sa ?? 1), withAlpha(tone.snow, (tone.sa ?? 1) * 0.6)]}
              />
            </Path>
          )}
          {geo.line && <Path path={geo.line} color={tone.rim} style="stroke" strokeWidth={1.2} />}
        </Group>
      </Group>
      {spec.mist && (
        <Group transform={mistTransform} opacity={mistOpacity}>
          <EllipseFill
            cx={w / 2}
            cy={h - spec.mist.y * (h / 100) - 9 * (h / 100)}
            rx={0.75 * w}
            ry={9 * (h / 100)}
            w={w}
            h={h}
            colors={[WORLD[world].mist, transparentOf(WORLD[world].mist)]}
            positions={[0, 1]}
          />
        </Group>
      )}
    </>
  );
}

function withAlpha(hex: string, a: number): string {
  const h0 = hex.replace('#', '');
  const h = h0.length === 3 ? h0.split('').map((x) => x + x).join('') : h0;
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
}

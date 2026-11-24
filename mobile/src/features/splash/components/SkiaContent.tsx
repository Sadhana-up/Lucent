import { useMemo } from 'react';
import {
  Group,
  LinearGradient,
  Rect,
  Text as SkText,
  useFont,
  vec,
} from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { T } from '../constants';
import { clamp01, easeContentOut, easeEase, easeInOutCss, easeSmooth, lerp } from '../easing';
import { colors } from '../../../theme/tokens';
import type { SceneContextValue } from '../context';
import { EllipseFill, transparentOf } from '../utils';

const WORD = 'Lucent';
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** All splash typography, drawn inside Skia's camera group. */
export function SkiaContent({ scene }: { scene: SceneContextValue }) {
  const { t, layout, reduced, leaveT } = scene;
  const { width: w, height: h, vmin, safeTop, short, wordFontSize: fs } = layout;
  const tagSize = clamp(2.6 * vmin, 18, 26);
  const serif = useFont(require('@expo-google-fonts/cormorant-garamond/300Light/CormorantGaramond_300Light.ttf'), fs);
  const italic = useFont(require('@expo-google-fonts/cormorant-garamond/300Light_Italic/CormorantGaramond_300Light_Italic.ttf'), tagSize);
  const sans = useFont(require('@expo-google-fonts/plus-jakarta-sans/600SemiBold/PlusJakartaSans_600SemiBold.ttf'), 12);
  const mono = useFont(require('@expo-google-fonts/geist-mono/400Regular/GeistMono_400Regular.ttf'), 11);

  const top = safeTop + (short ? 0.05 : 0.11) * h;
  const widths = useMemo(
    () => (serif ? [...WORD].map((ch) => serif.getGlyphWidths(serif.getGlyphIDs(ch))[0] ?? fs * 0.5) : []),
    [serif, fs],
  );

  /* Same box model as the CSS: each line's block top, then its baseline from
     the font metrics inside a line box of `size * lh`. */
  const baselineFor = (font: typeof serif, blockTop: number, size: number, lh: number) => {
    if (!font) return blockTop + size * lh * 0.78;
    const m = font.getMetrics();
    return blockTop + (lh * size - (m.descent - m.ascent)) / 2 - m.ascent;
  };

  const ruleGap = clamp(2.2 * vmin, 10, 22);
  const rowTop = top + fs * 0.92 + ruleGap;
  const lineY = rowTop + 6;
  const coordTop = rowTop + 12 + 16;
  const tagTop = coordTop + 11 + 14;
  const baseline = baselineFor(serif, top, fs, 0.92);
  const labelY = baselineFor(sans, rowTop, 12, 1);
  const coordY = baselineFor(mono, coordTop, 11, 1);
  const tagY = baselineFor(italic, tagTop, tagSize, 1.2);
  const lineW = clamp(9 * vmin, 32, 84);

  const glowOpacity = useDerivedValue(
    () => (reduced ? 1 : easeEase(clamp01((t.value - T.wordStart) / 1.6))),
    [t, reduced],
  );

  /* `.leave .content` — the copy lifts, blurs and fades behind the flood. */
  const out = useDerivedValue(() => {
    if (reduced || leaveT.value === Infinity) return 0;
    return easeContentOut(clamp01((t.value - leaveT.value - T.contentOutDelay) / T.contentOutDur));
  }, [t, reduced, leaveT]);
  const contentOpacity = useDerivedValue(() => 1 - out.value, [out]);
  const contentTransform = useDerivedValue(() => [
    { translateY: -0.03 * h * out.value },
    { scale: 1 + 0.06 * out.value },
  ], [out, h]);

  return (
    <Group
      origin={vec(w / 2, top + 0.12 * h)}
      opacity={contentOpacity}
      transform={contentTransform}
    >
      {/* .content::before — elliptical white bloom (draw order: scan, glow, text) */}
      <Group opacity={glowOpacity}>
        <EllipseFill
          cx={w / 2}
          cy={top + 0.15 * h}
          rx={Math.min(w * 0.65, 480)}
          ry={0.23 * h}
          w={w}
          h={h}
          colors={['rgba(255,255,255,.62)', transparentOf('rgba(255,255,255,.62)')]}
          positions={[0, 1]}
        />
      </Group>

      {serif && widths.length === WORD.length && (
        <Wordmark scene={scene} font={serif} widths={widths} fs={fs} baseline={baseline} />
      )}
      {sans && <RuleRow scene={scene} font={sans} lineY={lineY} labelY={labelY} lineW={lineW} />}
      {mono && !short && <SoftLine scene={scene} font={mono} text="27.7172° N · 85.3240° E" x={w / 2} y={coordY} start={T.coordStart} spacing={1.54} color={colors.ink2} />}
      {italic && !short && <SoftLine scene={scene} font={italic} text="Skin, in its best light." x={w / 2} y={tagY} start={T.tagStart} spacing={0} color={colors.sage} />}
    </Group>
  );
}

function Wordmark({ scene, font, widths, fs, baseline }: {
  scene: SceneContextValue;
  font: ReturnType<typeof useFont>;
  widths: number[];
  fs: number;
  baseline: number;
}) {
  const { t, layout, reduced } = scene;
  const total = widths.reduce((a, b) => a + b, 0);
  let acc = 0;
  return (
    <>
      {[...WORD].map((ch, i) => {
        const before = acc;
        acc += widths[i];
        return (
          <WordLetter
            key={i}
            ch={ch}
            i={i}
            width={widths[i]}
            before={before}
            total={total}
            fs={fs}
            baseline={baseline}
            scene={scene}
            font={font!}
          />
        );
      })}
    </>
  );
}

function WordLetter({ ch, i, width, before, total, fs, baseline, scene, font }: {
  ch: string; i: number; width: number; before: number; total: number;
  fs: number; baseline: number; scene: SceneContextValue; font: NonNullable<ReturnType<typeof useFont>>;
}) {
  const { t, layout, reduced } = scene;
  const spacing = useDerivedValue(
    () => (reduced ? 0.012 : lerp(0.15, 0.012, easeSmooth(clamp01((t.value - T.wordStart) / T.trackDur)))) * fs,
    [t, reduced, fs],
  );
  const p = useDerivedValue(
    () => (reduced ? 1 : easeSmooth(clamp01((t.value - (T.wordStart + i * T.letterStagger)) / T.letterDur))),
    [t, reduced, i],
  );
  const shine = useDerivedValue(
    () => (reduced ? 1 : easeInOutCss(clamp01((t.value - (T.shineStart + i * T.shineStagger)) / T.shineDur))),
    [t, reduced, i],
  );
  const transform = useDerivedValue(() => {
    const sp = spacing.value;
    const x = layout.width / 2 - (total + WORD.length * sp) / 2 + before + i * sp;
    return [{ translateX: x }, { translateY: baseline + (1 - p.value) * 0.5 * fs }];
  }, [spacing, p, before, i, total, baseline, fs, layout.width]);
  const gStart = useDerivedValue(
    () => vec(-2 * width * (1 - shine.value), 0),
    [shine, width],
  );
  const gEnd = useDerivedValue(
    () => vec(-2 * width * (1 - shine.value) + 3 * width, 0),
    [shine, width],
  );

  return (
    <Group transform={transform} opacity={p}>
      <SkText x={0} y={0} text={ch} font={font}>
        <LinearGradient
          start={gStart}
          end={gEnd}
          colors={[colors.sageDark, colors.sageDark, colors.violetLight, colors.sageDark, colors.sageDark]}
          positions={[0, 0.42, 0.5, 0.58, 1]}
        />
      </SkText>
    </Group>
  );
}

function RuleRow({ scene, font, lineY, labelY, lineW }: { scene: SceneContextValue; font: NonNullable<ReturnType<typeof useFont>>; lineY: number; labelY: number; lineW: number }) {
  const { t, layout, reduced } = scene;
  const text = 'NEPAL';
  const gap = 16;
  const labelW = useMemo(() => font.getGlyphWidths(font.getGlyphIDs(text)).reduce((a, b) => a + b, 0) + (text.length - 1) * 7.2, [font]);
  const labelX = layout.width / 2 - labelW / 2;
  const leftX = labelX - gap - lineW;
  const rightX = labelX + labelW + gap;
  const labelP = useDerivedValue(
    () => (reduced ? 1 : easeSmooth(clamp01((t.value - T.nepStart) / T.ruleDur))),
    [t, reduced],
  );
  const lineP = useDerivedValue(
    () => (reduced ? 1 : easeSmooth(clamp01((t.value - T.ruleStart) / T.ruleDur))),
    [t, reduced],
  );
  const labelTransform = useDerivedValue(
    () => [{ translateX: labelX }, { translateY: labelY + (1 - labelP.value) * 8 }],
    [labelP, labelX, labelY],
  );
  const lineTransform = useDerivedValue(() => [{ scaleX: lineP.value }], [lineP]);

  return (
    <>
      <Group origin={vec(leftX + lineW, lineY)} transform={lineTransform}>
        <Rect x={leftX} y={lineY} width={lineW} height={1}>
          <LinearGradient start={vec(leftX, 0)} end={vec(leftX + lineW, 0)} colors={[transparentOf(colors.sage), colors.sage]} positions={[0, 1]} />
        </Rect>
      </Group>
      <Group origin={vec(rightX, lineY)} transform={lineTransform}>
        <Rect x={rightX} y={lineY} width={lineW} height={1}>
          <LinearGradient start={vec(rightX, 0)} end={vec(rightX + lineW, 0)} colors={[colors.sage, transparentOf(colors.sage)]} positions={[0, 1]} />
        </Rect>
      </Group>
      <Group transform={labelTransform} opacity={labelP}>
        {[...text].map((ch, i) => {
          const glyphW = font.getGlyphWidths(font.getGlyphIDs(ch))[0] ?? 8;
          const x = [...text].slice(0, i).reduce((a, c) => a + (font.getGlyphWidths(font.getGlyphIDs(c))[0] ?? 8) + 7.2, 0);
          return <SkText key={i} x={x} y={0} text={ch} font={font} color={colors.sage} />;
        })}
      </Group>
    </>
  );
}

function SoftLine({ scene, font, text, x, y, start, spacing, color }: {
  scene: SceneContextValue;
  font: NonNullable<ReturnType<typeof useFont>>;
  text: string;
  x: number;
  y: number;
  start: number;
  spacing: number;
  color: string;
}) {
  const { t, reduced } = scene;
  const glyphs = useMemo(
    () => [...text].map((ch) => ({ ch, w: font.getGlyphWidths(font.getGlyphIDs(ch))[0] ?? 8 })),
    [font, text],
  );
  const total = glyphs.reduce((a, g) => a + g.w, 0) + (glyphs.length - 1) * spacing;
  const p = useDerivedValue(
    () => (reduced ? 1 : easeSmooth(clamp01((t.value - start) / T.softDur))),
    [t, reduced, start],
  );
  const transform = useDerivedValue(
    () => [{ translateX: x - total / 2 }, { translateY: y + (1 - p.value) * 8 }],
    [p, x, y, total],
  );
  let acc = 0;
  return (
    <Group transform={transform} opacity={p}>
      {glyphs.map((g, i) => {
        const gx = acc;
        acc += g.w + spacing;
        return <SkText key={i} x={gx} y={0} text={g.ch} font={font} color={color} />;
      })}
    </Group>
  );
}

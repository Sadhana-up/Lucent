import { Group, RadialGradient, Rect, vec } from '@shopify/react-native-skia';

/** CSS `transparent` is premultiplied; Skia is not. Fade to the SAME hue at alpha 0. */
export function transparentOf(c: string): string {
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const [r, g, b] = m[1].split(',').map((s) => s.trim());
    return `rgba(${r},${g},${b},0)`;
  }
  const h = c.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},0)`;
}

/** A CSS elliptical radial gradient (two radii / closest-side on a non-square box). */
export function EllipseFill({
  cx, cy, rx, ry, w, h, colors, positions,
}: {
  cx: number; cy: number; rx: number; ry: number; w: number; h: number;
  colors: string[]; positions?: number[];
}) {
  const k = ry / rx;
  return (
    <Group transform={[{ translateX: cx }, { translateY: cy }, { scaleY: k }]}>
      <Rect x={-w * 2} y={(-h * 2) / k} width={w * 4} height={(h * 4) / k}>
        <RadialGradient c={vec(0, 0)} r={rx} colors={colors} positions={positions} />
      </Rect>
    </Group>
  );
}

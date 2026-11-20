import { Skia } from '@shopify/react-native-skia';
import { RIDGES } from './constants';
import { lerp, smoothstep, TAU } from './easing';

/** Deterministic RNG — identical to lucent-splash-engine.js. */
export function rng(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fx1 = (v: number) => Math.round(v * 10) / 10;

/** Midpoint displacement: anchors set the silhouette, subdivision adds rock. */
function displace(anchors: number[][], rough: number, seed: number, depth: number): number[][] {
  const r = rng(seed);
  let pts = anchors;
  let amp = rough;
  for (let k = 0; k < depth; k++) {
    const next: number[][] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      next.push(a, [
        (a[0] + b[0]) / 2 + (r() - 0.5) * amp * 0.35,
        (a[1] + b[1]) / 2 + (r() - 0.5) * amp,
      ]);
    }
    next.push(pts[pts.length - 1]);
    pts = next;
    amp *= 0.55;
  }
  return pts;
}

/** Snow only where rock rises above a jagged snowline. */
function snowPath(pts: number[][], snowY: number, seed: number): string {
  const r = rng(seed + 99);
  const n = pts.length;
  const line = new Array<number>(n);
  const knots: number[] = [];
  for (let i = 0; i < 90; i++) knots.push(r());
  const x0 = pts[0][0];
  for (let i = 0; i < n; i++) {
    const u = (pts[i][0] - x0) / 44;
    const i0 = Math.floor(u) % 90;
    const i1 = (i0 + 1) % 90;
    const k = smoothstep(u - Math.floor(u));
    line[i] = snowY + (lerp(knots[i0], knots[i1], k) - 0.5) * 74 + Math.sin(pts[i][0] * 0.017) * 16;
  }
  const out: string[] = [];
  let run: number[] = [];
  const flush = () => {
    if (run.length > 2) {
      const top = run.map((i) => pts[i]);
      const bot = run.slice().reverse().map((i) => [pts[i][0], Math.max(line[i], pts[i][1] + 2)]);
      out.push('M' + top.concat(bot).map((p) => fx1(p[0]) + ',' + fx1(p[1])).join(' L') + 'Z');
    }
    run = [];
  };
  for (let i = 0; i < n; i++) {
    if (pts[i][1] < line[i]) run.push(i);
    else flush();
  }
  flush();
  return out.join(' ');
}

export interface RidgeGeometry {
  fill: ReturnType<typeof Skia.Path.MakeFromSVGString>;
  line: ReturnType<typeof Skia.Path.MakeFromSVGString>;
  snow: ReturnType<typeof Skia.Path.MakeFromSVGString>;
  minY: number;
}

/** Computed once at module load. Paths are immutable SkPaths — never rebuilt per frame. */
export const RIDGE_GEOMETRY: RidgeGeometry[] = RIDGES.map((spec) => {
  const pts = displace(spec.pts, spec.rough, spec.seed, spec.depth);
  const line = 'M' + pts.map((p) => fx1(p[0]) + ',' + fx1(p[1])).join(' L');
  let minY = 1e9;
  for (const p of pts) if (p[1] < minY) minY = p[1];
  return {
    fill: Skia.Path.MakeFromSVGString(line + ' L1920,720 L-320,720 Z'),
    line: Skia.Path.MakeFromSVGString(line),
    snow: spec.snowY ? Skia.Path.MakeFromSVGString(snowPath(pts, spec.snowY, spec.seed)) : null,
    minY: fx1(minY),
  };
});

/** The teardrop silhouette from the engine's inline SVG. */
export const DROP_PATH = Skia.Path.MakeFromSVGString(
  'M12 1 C12 1 23 16 23 26 A11 11 0 0 1 1 26 C1 16 12 1 12 1 Z',
)!;

/** Precomputed god-ray stops (one conic-gradient, 22 wedges). */
export function makeRayStops(rgb: string, alpha: number, seed: number) {
  const r = rng(seed);
  const n = 22;
  const colors: string[] = [];
  const positions: number[] = [];
  let previous = 0;
  for (let i = 0; i < n; i++) {
    const c = ((i + r() * 0.6) / n) * 360;
    const w = 2.2 + r() * 5.5;
    const a = alpha * (0.35 + r() * 0.65);
    const push = (deg: number, col: string) => {
      // Adjacent wedges can overlap; Skia gradients need monotonic stops.
      previous = Math.max(previous, Math.min(1, deg / 360));
      positions.push(previous);
      colors.push(col);
    };
    push(c - w, `rgba(${rgb},0)`);
    push(c, `rgba(${rgb},${a.toFixed(3)})`);
    push(c + w, `rgba(${rgb},0)`);
  }
  return { colors, positions };
}

export const TAU_CONST = TAU;

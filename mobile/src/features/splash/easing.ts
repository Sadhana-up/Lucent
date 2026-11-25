/* Worklet-safe maths + the exact cubic-bezier curves used by lucent-splash.css.
   Every function here is pure and marked 'worklet' so it can run on the UI thread. */

export const TAU = Math.PI * 2;

export function clamp(v: number, min: number, max: number): number {
  'worklet';
  return v < min ? min : v > max ? max : v;
}

export function clamp01(v: number): number {
  'worklet';
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function lerp(a: number, b: number, k: number): number {
  'worklet';
  return a + (b - a) * k;
}

export function smoothstep(v: number): number {
  'worklet';
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
}

function bezierA(a1: number, a2: number): number {
  'worklet';
  return 1 - 3 * a2 + 3 * a1;
}
function bezierB(a1: number, a2: number): number {
  'worklet';
  return 3 * a2 - 6 * a1;
}
function bezierC(a1: number): number {
  'worklet';
  return 3 * a1;
}
function calcBezier(t: number, a1: number, a2: number): number {
  'worklet';
  return ((bezierA(a1, a2) * t + bezierB(a1, a2)) * t + bezierC(a1)) * t;
}
function slope(t: number, a1: number, a2: number): number {
  'worklet';
  return 3 * bezierA(a1, a2) * t * t + 2 * bezierB(a1, a2) * t + bezierC(a1);
}

/** Solve x(t) for t, then return y(t). Newton-Raphson with a bisection fallback. */
function solve(x: number, x1: number, y1: number, x2: number, y2: number): number {
  'worklet';
  const p = clamp01(x);
  if (x1 === y1 && x2 === y2) return p;

  let t = p;
  for (let i = 0; i < 8; i++) {
    const err = calcBezier(t, x1, x2) - p;
    const d = slope(t, x1, x2);
    if (Math.abs(err) < 1e-5 || d === 0) break;
    t -= err / d;
  }
  if (t < 0 || t > 1) {
    let lo = 0;
    let hi = 1;
    t = p;
    for (let i = 0; i < 14; i++) {
      const v = calcBezier(t, x1, x2);
      if (Math.abs(v - p) < 1e-5) break;
      if (v < p) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
  }
  return calcBezier(clamp01(t), y1, y2);
}

export function cubicBezier(
  x: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  'worklet';
  return solve(x, x1, y1, x2, y2);
}

/* Named curves from the CSS. */
export function easeSmooth(x: number): number {
  'worklet';
  return solve(x, 0.16, 1, 0.3, 1);
}
export function easeSpringy(x: number): number {
  'worklet';
  return solve(x, 0.34, 1.56, 0.64, 1);
}
export function easePush(x: number): number {
  'worklet';
  return solve(x, 0.2, 0.6, 0.2, 1);
}
export function easeThump(x: number): number {
  'worklet';
  return solve(x, 0.2, 0.8, 0.2, 1);
}
export function easeReveal(x: number): number {
  'worklet';
  return solve(x, 0.65, 0, 0.2, 1);
}
export function easeDolly(x: number): number {
  'worklet';
  return solve(x, 0.25, 0.5, 0.25, 1);
}
export function easeFall(x: number): number {
  'worklet';
  return solve(x, 0.5, 0, 0.9, 0.55);
}
export function easeBloom(x: number): number {
  'worklet';
  return solve(x, 0.2, 0.7, 0.2, 1);
}
export function easeRing(x: number): number {
  'worklet';
  return solve(x, 0.1, 0.6, 0.2, 1);
}
export function easeScan(x: number): number {
  'worklet';
  return solve(x, 0.45, 0.05, 0.3, 1);
}
export function easeFlood(x: number): number {
  'worklet';
  return solve(x, 0.7, 0, 0.2, 1);
}
export function easeContentOut(x: number): number {
  'worklet';
  return solve(x, 0.5, 0, 0.2, 1);
}
export function easeEase(x: number): number {
  'worklet';
  return solve(x, 0.25, 0.1, 0.25, 1);
}

/** CSS ease-in-out — distinct from easeEase (which is CSS `ease`). */
export function easeInOutCss(x: number): number {
  'worklet';
  return solve(x, 0.42, 0, 0.58, 1);
}

/** Triangle wave 0→1→0 for infinite alternate CSS animations. */
export function pingPong(x: number): number {
  'worklet';
  const m = ((x % 2) + 2) % 2;
  return m < 1 ? m : 2 - m;
}

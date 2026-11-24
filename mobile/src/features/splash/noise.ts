import { TAU } from './easing';
import { rng } from './geometry';

export interface Star {
  x: number; y: number; r: number; a: number; p: number; s: number; group: number;
}
export interface Mote {
  x: number; y: number; r: number; v: number; a: number; p: number; w: number;
}
export interface Spark {
  ang: number; sp: number; life: number; size: number; mix: number;
}

/* Stars: 150 scattered + 430 along the tilted Milky Way band. Normalised to
   width/height=1; the layout multiplies x/y by the real pixel size. Same rng
   (seed 101) and draw order as createFx().layout() in the web engine. */
const rs = rng(101);
export const STARS: Star[] = [];

function addStar(x: number, y: number, r: number, a: number) {
  const group = (rs() * 3) | 0;
  STARS.push({ x, y, r, a, p: rs() * TAU, s: 0.6 + rs() * 1.8, group });
}

for (let i = 0; i < 150; i++) {
  addStar(rs(), rs() * 0.5, 0.35 + rs() * 1.1, 1);
}
{
  const cx = 0.5;
  const cy = 0.27;
  const ang = (-22 * Math.PI) / 180;
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  for (let i = 0; i < 430; i++) {
    const along = ((rs() + rs() + rs() - 1.5) / 1.5) * 0.62;
    const perp = ((rs() + rs() + rs() - 1.5) / 1.5) * 0.075;
    addStar(cx + along * ca - perp * sa, cy + along * sa + perp * ca, 0.3 + rs() * 0.65, 0.55);
  }
}

/* Floating motes — seed 202. */
const rm = rng(202);
export const MOTES: Mote[] = [];
for (let i = 0; i < 56; i++) {
  MOTES.push({
    x: rm(), y: rm(), r: 1 + rm() * 3.2, v: 0.012 + rm() * 0.03,
    a: 0.18 + rm() * 0.35, p: rm() * TAU, w: 0.4 + rm(),
  });
}

/* Impact sparks — seed 303. */
const rp = rng(303);
export const SPARKS: Spark[] = [];
for (let i = 0; i < 110; i++) {
  SPARKS.push({
    ang: -Math.PI + 0.15 + rp() * (Math.PI - 0.3),
    sp: 110 + Math.pow(rp(), 1.6) * 560,
    life: 0.7 + rp() * 1.1,
    size: 0.8 + rp() * 2.4,
    mix: rp(),
  });
}

/* Grain: a static speck field used instead of CSS feTurbulence. */
const rg = rng(404);
export const GRAIN: { x: number; y: number; r: number; a: number }[] = [];
for (let i = 0; i < 950; i++) {
  GRAIN.push({ x: rg(), y: rg(), r: 0.35 + rg() * 0.6, a: 0.25 + rg() * 0.75 });
}

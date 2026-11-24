/* Ported from lucent-splash-engine.js — the single source of truth for geometry,
   tones and the timeline. Times are seconds; the whole scene is a function of t. */

export interface RidgeSpec {
  seed: number;
  rough: number;
  depth: number;
  snowY: number;
  delay: number;
  k: number;
  d: number;
  pts: number[][];
  mist?: { y: number; delay: number };
}

export const RIDGES: RidgeSpec[] = [
  {
    seed: 7, rough: 20, depth: 3, snowY: 196, delay: 1.55, k: 1.02, d: 0.5,
    pts: [[-320,255],[-190,205],[-70,150],[30,175],[120,110],[230,55],[300,115],[370,150],[430,118],[480,150],[515,118],[555,86],[610,140],[680,235],[750,310],[800,335],[850,312],[920,238],[990,140],[1040,64],[1080,108],[1120,92],[1160,130],[1230,100],[1300,128],[1360,90],[1430,140],[1510,175],[1600,215],[1720,240],[1830,225],[1920,260]],
  },
  {
    seed: 19, rough: 26, depth: 3, snowY: 262, delay: 1.7, k: 1.035, d: 0.7, mist: { y: 21, delay: 2.1 },
    pts: [[-320,330],[-200,290],[-90,250],[40,215],[150,255],[260,230],[380,285],[470,300],[560,262],[640,285],[720,335],[800,362],[880,340],[960,290],[1040,255],[1110,225],[1190,250],[1290,205],[1380,250],[1480,230],[1580,275],[1700,300],[1820,285],[1920,330]],
  },
  {
    seed: 31, rough: 26, depth: 3, snowY: 0, delay: 1.85, k: 1.055, d: 0.95, mist: { y: 13, delay: 2.3 },
    pts: [[-320,400],[-170,350],[-20,330],[120,370],[260,340],[400,385],[540,410],[680,425],[800,430],[920,420],[1060,398],[1180,370],[1300,335],[1420,372],[1560,350],[1700,385],[1920,400]],
  },
  {
    seed: 43, rough: 22, depth: 3, snowY: 0, delay: 2.0, k: 1.085, d: 1.25, mist: { y: 6, delay: 2.5 },
    pts: [[-320,470],[-120,440],[80,420],[240,450],[420,430],[600,462],[800,478],[1000,458],[1200,430],[1380,448],[1560,425],[1740,450],[1920,470]],
  },
  {
    seed: 5, rough: 12, depth: 3, snowY: 0, delay: 2.15, k: 1.12, d: 1.6,
    pts: [[-320,520],[-100,508],[150,520],[400,500],[650,522],[900,512],[1150,525],[1400,505],[1650,520],[1920,510]],
  },
];

export interface RidgeTone {
  a: string;
  b: string;
  snow?: string;
  sa?: number;
  rim: string;
  shade: string;
  sh: number;
}

export const TONES: Record<'night' | 'dawn', RidgeTone[]> = {
  night: [
    { a: '#35564A', b: '#1B3326', snow: '#B9B2F2', sa: 0.3, rim: 'rgba(232,180,184,.5)', shade: '#04100A', sh: 0.34 },
    { a: '#274638', b: '#17302A', rim: 'rgba(155,141,240,.38)', shade: '#04100A', sh: 0.3 },
    { a: '#1B382B', b: '#11261C', rim: 'rgba(232,180,184,.18)', shade: '#04100A', sh: 0.26 },
    { a: '#142C20', b: '#0D1E15', rim: 'rgba(255,255,255,.08)', shade: '#02080A', sh: 0.22 },
    { a: '#0D1F15', b: '#07120C', rim: 'rgba(255,255,255,.05)', shade: '#000', sh: 0.2 },
  ],
  dawn: [
    { a: '#9DB5AE', b: '#CBD8D0', snow: '#FFFFFF', sa: 0.98, rim: 'rgba(255,255,255,.95)', shade: '#3A5A66', sh: 0.2 },
    { a: '#7FA38F', b: '#AAC3B4', snow: '#FFFFFF', sa: 0.8, rim: 'rgba(255,255,255,.7)', shade: '#2D5A3D', sh: 0.2 },
    { a: '#5E8E73', b: '#82AA94', rim: 'rgba(255,255,255,.4)', shade: '#1E3D2A', sh: 0.2 },
    { a: '#3A6B4A', b: '#2D5A3D', rim: 'rgba(255,255,255,.2)', shade: '#0F2418', sh: 0.22 },
    { a: '#1E3D2A', b: '#142E20', rim: 'rgba(255,255,255,.1)', shade: '#000', sh: 0.2 },
  ],
};

/** Timeline in seconds, matching the CSS animation delays/durations. */
export const T = {
  sceneFade: 1.4,
  milkyStart: 0.2,
  milkyDur: 2.4,
  dropStart: 0.5,
  dropDur: 0.95,
  impact: 1.45,
  bloomDur: 1.4,
  ringDur: 2,
  ringDelays: [1.45, 1.65, 1.85],
  streakDur: 1.9,
  sunStart: 1.55,
  sunDur: 1.5,
  raysStart: 1.9,
  raysDur: 2.2,
  ridgeRiseDur: 1.7,
  dollyStart: 1.55,
  dollyDur: 8,
  dawnStart: 2.5,
  dawnDur: 1.35,
  nightHide: 3.95,
  starsStop: 4,
  frontDur: 1.35,
  phStart: 2.9,
  phDur: 2.4,
  wordStart: 3.3,
  letterDur: 1.3,
  letterStagger: 0.08,
  trackDur: 2.8,
  shineStart: 4.2,
  shineStagger: 0.09,
  shineDur: 1.6,
  ruleStart: 3.9,
  ruleDur: 1.1,
  nepStart: 3.95,
  coordStart: 4.3,
  tagStart: 4.5,
  softDur: 1.1,
  scanStart: 4.3,
  scanDur: 1.5,
  earliestExit: 5.6,
  floodDur: 1.25,
  contentOutDelay: 0.15,
  contentOutDur: 0.8,
  hudOutDur: 0.45,
  pushDur: 8,
  pushTo: 1.045,
  thumpDur: 1,
  thumpTo: 1.022,
  thumpPeak: 0.22,
} as const;

/** World-specific palette (the CSS custom properties on .night / .dawn). */
export const WORLD = {
  night: {
    haloA: 'rgba(232,180,184,.5)',
    haloB: 'rgba(124,107,234,.26)',
    ring: 'rgba(255,232,236,.5)',
    sat: '#fff',
    mist: 'rgba(159,196,174,.2)',
    rA: '255,226,232',
    rAlpha: 0.16,
    rSeed: 11,
    vignette: 'rgba(4,10,7,.5)',
    vigInner: 0.52,
  },
  dawn: {
    haloA: 'rgba(232,180,184,.72)',
    haloB: 'rgba(155,141,240,.22)',
    ring: 'rgba(124,107,234,.55)',
    sat: '#7C6BEA',
    mist: 'rgba(255,255,255,.62)',
    rA: '232,180,184',
    rAlpha: 0.34,
    rSeed: 23,
    vignette: 'rgba(45,90,61,.13)',
    vigInner: 0.58,
  },
} as const;

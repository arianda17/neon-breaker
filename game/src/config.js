// Every tuning number, colour and level layout in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below depends
// on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const PADDLE = {
  width: 112,
  wideWidth: 176,
  height: 18,
  y: 668,
  speed: 700,
  wideSeconds: 12,
};

export const BALL = {
  radius: 9,
  baseSpeed: 440,
  speedPerLevel: 34,
  speedPerBrick: 2,
  maxBonusSpeed: 110,
  slowFactor: 0.62,
  slowSeconds: 9,
  maxBalls: 5,
};

export const BRICK = {
  cols: 10,
  width: 104,
  height: 28,
  gapX: 8,
  gapY: 10,
  topY: 108,
  /** Points by brick toughness (before the combo multiplier). */
  points: { 1: 50, 2: 100, 3: 150 },
  /** How many of a broken brick's hits the combo counts before the multiplier grows. */
  comboStep: 4,
  maxMultiplier: 5,
};

export const POWERUP = {
  size: 26,
  fallSpeed: 190,
  /** Chance a broken brick drops a capsule. */
  dropChance: 0.16,
  /** Weights when a drop happens: M multi-ball, W wide paddle, S slow ball, L extra life. */
  weights: { M: 34, W: 30, S: 26, L: 10 },
  label: { M: 'MULTI-BALL', W: 'WIDE PADDLE', S: 'SLOW BALL', L: 'EXTRA LIFE' },
  color: { M: '#ff2fb3', W: '#22d3ee', S: '#a3e635', L: '#ffd166' },
};

export const LIVES = 3;
export const MAX_LIVES = 5;

/** Seconds a level-clear banner holds the game before the next level builds. */
export const CLEAR_HOLD = 1.6;

/** Neon row colours, top row first. */
export const ROW_COLORS = ['#ff2fb3', '#ff7a18', '#ffd166', '#a3e635', '#22d3ee', '#7c5cff', '#ff5c5c'];

/**
 * Six levels. Each pattern is an array of rows, 10 characters wide:
 * '.' is empty, '1' a one-hit brick, '2' two hits, '3' three hits.
 */
export const LEVELS = [
  {
    name: 'FIRST LIGHT',
    speed: 440,
    pattern: [
      '1111111111',
      '1111111111',
      '1111111111',
      '1111111111',
    ],
  },
  {
    name: 'CHECKERBOARD',
    speed: 470,
    pattern: [
      '1212121212',
      '2121212121',
      '1212121212',
      '2121212121',
      '1111111111',
    ],
  },
  {
    name: 'DIAMOND',
    speed: 500,
    pattern: [
      '....11....',
      '...1111...',
      '..122221..',
      '.12222221.',
      '..122221..',
      '...1111...',
    ],
  },
  {
    name: 'PYRAMID',
    speed: 530,
    pattern: [
      '....11....',
      '...1111...',
      '..111111..',
      '.11111111.',
      '1111111111',
      '2222222222',
    ],
  },
  {
    name: 'FORTRESS',
    speed: 560,
    pattern: [
      '2211111122',
      '2111111112',
      '1112222111',
      '1112332111',
      '1112222111',
      '2111111112',
      '2211111122',
    ],
  },
  {
    name: 'NEON CORE',
    speed: 595,
    pattern: [
      '2333333332',
      '3222222223',
      '2211111122',
      '2112332112',
      '2211111122',
      '3222222223',
      '2333333332',
    ],
  },
];

export const PALETTE = {
  backdrop: '#070312',
  backdropTop: '#12082e',
  grid: 'rgba(124, 92, 255, 0.10)',
  rail: '#7c5cff',
  paddle: '#22d3ee',
  paddleCore: '#e8fbff',
  ball: '#ffffff',
  ballGlow: '#22d3ee',
  text: '#f4f6ff',
  muted: '#9aa3c7',
  gold: '#ffd166',
  danger: '#ff5c5c',
  panel: 'rgba(10, 6, 28, 0.82)',
  panelEdge: '#7c5cff',
};

export const FONT = '"Segoe UI", system-ui, -apple-system, sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'neon-breaker.best';

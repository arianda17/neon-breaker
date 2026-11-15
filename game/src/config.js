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
  /** Seconds a caught fireball capsule makes every ball pierce bricks. */
  fireSeconds: 8,
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
  /** Weights when a drop happens: M multi-ball, W wide paddle, S slow ball,
   *  L extra life, F fireball (pierces bricks for a few seconds). */
  weights: { M: 30, W: 26, S: 22, L: 8, F: 14 },
  label: { M: 'MULTI-BALL', W: 'WIDE PADDLE', S: 'SLOW BALL', L: 'EXTRA LIFE', F: 'FIREBALL' },
  color: { M: '#ff2fb3', W: '#22d3ee', S: '#a3e635', L: '#ffd166', F: '#ff7a18' },
};

export const LIVES = 3;
export const MAX_LIVES = 5;

/** Seconds a level-clear banner holds the game before the next level builds. */
export const CLEAR_HOLD = 1.6;

/** Seconds the level-intro banner ("LEVEL 2 — CHECKERBOARD") stays on screen. */
export const BANNER_SECONDS = 1.8;

/** Steel bricks never break: they bounce the ball and shield what is behind them. */
export const STEEL = { color: '#9aa3b2', edge: '#5b6472', rivet: '#e8ecf4' };

/** A moving row slides side to side as one piece: amplitude in px, angular
 *  speed in radians per fixed step (a full swing takes ~5 seconds). */
export const MOVE = { amp: 36, omega: 0.02 };

/** Neon row colours, top row first. */
export const ROW_COLORS = ['#ff2fb3', '#ff7a18', '#ffd166', '#a3e635', '#22d3ee', '#7c5cff', '#ff5c5c'];

/**
 * Six levels. Each pattern is an array of rows, 10 characters wide:
 * '.' is empty, '1' a one-hit brick, '2' two hits, '3' three hits,
 * 'S' a steel brick that never breaks. Steel never forms a full row, so
 * every breakable brick stays reachable from the side once its neighbours
 * fall. Each level has its own neon theme (backdrop, rails, paddle) and
 * its own row colours, top row first.
 */
export const LEVELS = [
  {
    name: 'FIRST LIGHT',
    speed: 440,
    theme: {
      backdrop: '#070312', backdropTop: '#12082e',
      grid: 'rgba(124, 92, 255, 0.10)', rail: '#7c5cff',
      paddle: '#22d3ee', paddleEdge: '#0e7490',
    },
    rows: ['#ff2fb3', '#ff7a18', '#ffd166', '#a3e635', '#22d3ee', '#7c5cff', '#ff5c5c'],
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
    theme: {
      backdrop: '#120309', backdropTop: '#2a0a20',
      grid: 'rgba(255, 47, 179, 0.10)', rail: '#ff2fb3',
      paddle: '#ffd166', paddleEdge: '#92600a',
    },
    rows: ['#ff2fb3', '#c084fc', '#f472b6', '#e879f9', '#a855f7', '#ff7a18', '#ffd166'],
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
    theme: {
      backdrop: '#02120b', backdropTop: '#062a1a',
      grid: 'rgba(52, 211, 153, 0.10)', rail: '#34d399',
      paddle: '#a3e635', paddleEdge: '#4d7c0f',
    },
    rows: ['#34d399', '#2dd4bf', '#a3e635', '#4ade80', '#22d3ee', '#84cc16', '#facc15'],
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
    theme: {
      backdrop: '#120a02', backdropTop: '#2e1a06',
      grid: 'rgba(255, 122, 24, 0.10)', rail: '#ff7a18',
      paddle: '#ffd166', paddleEdge: '#92600a',
    },
    rows: ['#ff7a18', '#fb923c', '#facc15', '#f87171', '#ef4444', '#ffd166', '#ff2fb3'],
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
    theme: {
      backdrop: '#020a12', backdropTop: '#062032',
      grid: 'rgba(56, 189, 248, 0.10)', rail: '#38bdf8',
      paddle: '#7dd3fc', paddleEdge: '#075985',
    },
    rows: ['#38bdf8', '#60a5fa', '#818cf8', '#22d3ee', '#93c5fd', '#e0f2fe', '#7dd3fc'],
    pattern: [
      '2211111122',
      '2111111112',
      '11S222211S',
      '1112332111',
      '11S222211S',
      '2111111112',
      '2211111122',
    ],
  },
  {
    name: 'NEON CORE',
    speed: 595,
    /** The middle row slides side to side as one piece (see MOVE). */
    movingRow: 2,
    theme: {
      backdrop: '#0d0212', backdropTop: '#2a0636',
      grid: 'rgba(192, 132, 252, 0.12)', rail: '#c084fc',
      paddle: '#e879f9', paddleEdge: '#86198f',
    },
    rows: ['#c084fc', '#e879f9', '#ff2fb3', '#a855f7', '#f472b6', '#d8b4fe', '#ffd166'],
    pattern: [
      '2333333332',
      '3222222223',
      '22S1111S22',
      '2112332112',
      '22S1111S22',
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

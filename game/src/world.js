// The game itself: paddle, balls, bricks, falling power-ups, particles and floating
// score text. One fixed step advances everything; the step returns a bitmask of events
// so the shell can play sounds and announce them. All randomness comes from the seeded
// generator the world was built with.

import {
  BALL, BANNER_SECONDS, BRICK, CLEAR_HOLD, FIELD, LEVELS, LIVES, MAX_LIVES, MOVE, PADDLE, POWERUP, ROW_COLORS, STEEL,
} from './config.js';
import { randomPick, randomRange } from './random.js';

export const EVENT_BRICK_HIT = 1;
export const EVENT_BRICK = 2;
export const EVENT_PADDLE = 4;
export const EVENT_POWERUP = 8;
export const EVENT_LIFE_LOST = 16;
export const EVENT_LEVEL_CLEAR = 32;
export const EVENT_WIN = 64;
export const EVENT_OVER = 128;
export const EVENT_LAUNCH = 256;
export const EVENT_WALL = 512;

const POWERUP_TYPES = ['M', 'W', 'S', 'L', 'F'];

/** Where a ball will be horizontally when it reaches `targetY`, folding off the walls. */
export function predictBallX(ball, targetY) {
  if (ball.vy <= 0) return ball.x;
  const time = (targetY - ball.y) / ball.vy;
  const span = FIELD.width - 2 * BALL.radius;
  const period = 2 * span;
  let folded = (ball.x - BALL.radius + ball.vx * time) % period;
  if (folded < 0) folded += period;
  if (folded > span) folded = period - folded;
  return BALL.radius + folded;
}

function pickDrop(rng) {
  const roll = rng() * 100;
  let total = 0;
  for (const type of POWERUP_TYPES) {
    total += POWERUP.weights[type];
    if (roll < total) return type;
  }
  return 'M';
}

export function createWorld(rng) {
  const state = {
    paddle: { x: 0, y: PADDLE.y, w: PADDLE.width, h: PADDLE.height, wideTimer: 0 },
    balls: [],
    bricks: [],
    powerups: [],
    particles: [],
    texts: [],
    stars: [],
    score: 0,
    lives: LIVES,
    level: 0,
    combo: 0,
    speedBonus: 0,
    slowTimer: 0,
    fireTimer: 0,
    serving: true,
    clearing: 0,
    banner: null,
    won: false,
    over: false,
    frame: 0,
    shake: 0,
    bricksLeft: 0,
  };

  function levelSpeed() {
    return LEVELS[state.level].speed + state.speedBonus;
  }

  function comboMultiplier() {
    return Math.min(1 + Math.floor(state.combo / BRICK.comboStep), BRICK.maxMultiplier);
  }

  function resetBall() {
    const speed = levelSpeed();
    state.balls = [{
      x: state.paddle.x + state.paddle.w / 2,
      y: PADDLE.y - BALL.radius - 1,
      vx: 0,
      vy: 0,
      r: BALL.radius,
      active: true,
      speed,
    }];
    state.serving = true;
  }

  function buildLevel(index) {
    const level = LEVELS[index];
    const rows = level.rows || ROW_COLORS;
    const gridWidth = BRICK.cols * BRICK.width + (BRICK.cols - 1) * BRICK.gapX;
    const startX = (FIELD.width - gridWidth) / 2;
    state.bricks = [];
    level.pattern.forEach((row, rowIndex) => {
      for (let col = 0; col < row.length; col += 1) {
        const cell = row.charAt(col);
        const brickX = startX + col * (BRICK.width + BRICK.gapX);
        const brickY = BRICK.topY + rowIndex * (BRICK.height + BRICK.gapY);
        if (cell === 'S') {
          const steelBrick = {
            x: brickX,
            y: brickY,
            w: BRICK.width,
            h: BRICK.height,
            hp: 99,
            maxHp: 0,
            steel: true,
            color: STEEL.color,
            alive: true,
          };
          // A level's moving row slides as one piece (NEON CORE): every brick
          // in it, steel included, rides the same offset from its home slot.
          if (level.movingRow === rowIndex) {
            steelBrick.moving = true;
            steelBrick.baseX = brickX;
          }
          state.bricks.push(steelBrick);
          continue;
        }
        const hp = cell.charCodeAt(0) - 48;
        if (hp < 1 || hp > 3) continue;
        const brick = {
          x: brickX,
          y: brickY,
          w: BRICK.width,
          h: BRICK.height,
          hp,
          maxHp: hp,
          color: rows[rowIndex % rows.length],
          alive: true,
        };
        if (level.movingRow === rowIndex) {
          brick.moving = true;
          brick.baseX = brickX;
        }
        state.bricks.push(brick);
      }
    });
    // Steel never breaks, so it never counts toward clearing the level.
    state.bricksLeft = state.bricks.filter((brick) => !brick.steel).length;
    state.banner = { text: `LEVEL ${index + 1}`, name: level.name, timer: BANNER_SECONDS };
  }

  function burst(x, y, color, count, speed) {
    for (let index = 0; index < count; index += 1) {
      if (state.particles.length > 240) return;
      const angle = randomRange(rng, 0, Math.PI * 2);
      const velocity = randomRange(rng, speed * 0.3, speed);
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 60,
        life: randomRange(rng, 0.35, 0.7),
        maxLife: 0.7,
        color,
        size: randomRange(rng, 2, 5),
      });
    }
  }

  function addText(x, y, text, color) {
    if (state.texts.length > 24) state.texts.shift();
    state.texts.push({ x, y, life: 0.9, maxLife: 0.9, text, color });
  }

  function reset() {
    state.score = 0;
    state.lives = LIVES;
    state.level = 0;
    state.combo = 0;
    state.speedBonus = 0;
    state.slowTimer = 0;
    state.fireTimer = 0;
    state.clearing = 0;
    state.banner = null;
    state.won = false;
    state.over = false;
    state.frame = 0;
    state.shake = 0;
    state.powerups = [];
    state.particles = [];
    state.texts = [];
    state.stars = [];
    for (let index = 0; index < 90; index += 1) {
      state.stars.push({
        x: rng() * FIELD.width,
        y: rng() * FIELD.height,
        r: 0.5 + rng() * 1.6,
        phase: rng() * Math.PI * 2,
      });
    }
    state.paddle.x = (FIELD.width - PADDLE.width) / 2;
    state.paddle.w = PADDLE.width;
    state.paddle.wideTimer = 0;
    buildLevel(0);
    resetBall();
  }

  function launch() {
    if (!state.serving || state.balls.length === 0) return false;
    const ball = state.balls[0];
    const speed = levelSpeed();
    const angle = randomRange(rng, -0.38, 0.38);
    ball.vx = Math.sin(angle) * speed;
    ball.vy = -Math.cos(angle) * speed;
    ball.speed = speed;
    state.serving = false;
    return true;
  }

  function addBall() {
    const active = state.balls.filter((ball) => ball.active);
    if (active.length === 0 || active.length >= BALL.maxBalls) return false;
    const source = active[0];
    const speed = Math.hypot(source.vx, source.vy) || levelSpeed();
    for (const tilt of [-0.55, 0.55]) {
      if (state.balls.filter((ball) => ball.active).length >= BALL.maxBalls) break;
      const angle = Math.atan2(source.vy, source.vx) + tilt;
      state.balls.push({
        x: source.x, y: source.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: BALL.radius, active: true, speed,
      });
    }
    return true;
  }

  function spawnPowerup(type, x, y) {
    if (state.powerups.length >= 6) return;
    state.powerups.push({ x, y, vy: POWERUP.fallSpeed, type, active: true });
  }

  function applyPowerup(type) {
    if (type === 'M') addBall();
    else if (type === 'W') state.paddle.wideTimer = PADDLE.wideSeconds;
    else if (type === 'S') state.slowTimer = BALL.slowSeconds;
    else if (type === 'F') state.fireTimer = BALL.fireSeconds;
    else if (type === 'L') state.lives = Math.min(MAX_LIVES, state.lives + 1);
  }

  function damageBrick(brick, attract) {
    if (brick.steel) {
      // Steel never breaks and gives no points: just a spark and a clank.
      burst(brick.x + brick.w / 2, brick.y + brick.h / 2, STEEL.color, 4, 160);
      return EVENT_BRICK_HIT;
    }
    brick.hp -= 1;
    if (brick.hp > 0) {
      burst(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.color, 4, 160);
      return EVENT_BRICK_HIT;
    }
    brick.alive = false;
    state.bricksLeft -= 1;
    burst(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.color, 14, 320);
    if (!attract) {
      const points = BRICK.points[brick.maxHp] * comboMultiplier();
      state.score += points;
      state.combo += 1;
      state.speedBonus = Math.min(BALL.maxBonusSpeed, state.speedBonus + BALL.speedPerBrick);
      addText(brick.x + brick.w / 2, brick.y, `+${points}`, brick.color);
      if (rng() < POWERUP.dropChance) {
        spawnPowerup(pickDrop(rng), brick.x + brick.w / 2, brick.y + brick.h / 2);
      }
    }
    return EVENT_BRICK;
  }

  function movePaddle(dt, dir, attract, mouseX) {
    const paddle = state.paddle;
    if (attract) {
      const active = state.balls.filter((ball) => ball.active);
      if (active.length > 0) {
        let lowest = active[0];
        for (const ball of active) if (ball.y > lowest.y) lowest = ball;
        const target = predictBallX(lowest, PADDLE.y);
        const centre = paddle.x + paddle.w / 2;
        dir = target > centre + 6 ? 1 : target < centre - 6 ? -1 : 0;
      } else dir = 0;
    } else if (mouseX !== null && mouseX !== undefined) {
      const centre = paddle.x + paddle.w / 2;
      const diff = mouseX - centre;
      const maxStep = PADDLE.speed * 2.2 * dt;
      paddle.x += Math.max(-maxStep, Math.min(maxStep, diff));
      paddle.x = Math.max(0, Math.min(FIELD.width - paddle.w, paddle.x));
      return;
    }
    paddle.x += dir * PADDLE.speed * dt;
    paddle.x = Math.max(0, Math.min(FIELD.width - paddle.w, paddle.x));
  }

  function stepBall(ball, dt, attract) {
    let events = 0;
    const factor = state.slowTimer > 0 ? BALL.slowFactor : 1;
    ball.x += ball.vx * dt * factor;
    ball.y += ball.vy * dt * factor;

    if (ball.x < ball.r) {
      ball.x = ball.r;
      ball.vx = Math.abs(ball.vx);
      events |= EVENT_WALL;
    } else if (ball.x > FIELD.width - ball.r) {
      ball.x = FIELD.width - ball.r;
      ball.vx = -Math.abs(ball.vx);
      events |= EVENT_WALL;
    }
    if (ball.y < ball.r) {
      ball.y = ball.r;
      ball.vy = Math.abs(ball.vy);
      events |= EVENT_WALL;
    }
    if (ball.y - ball.r > FIELD.height) {
      ball.active = false;
      return events;
    }

    const paddle = state.paddle;
    if (ball.vy > 0 && ball.y + ball.r >= paddle.y && ball.y - ball.r <= paddle.y + paddle.h
      && ball.x >= paddle.x - ball.r && ball.x <= paddle.x + paddle.w + ball.r) {
      const speed = Math.hypot(ball.vx, ball.vy);
      const offset = Math.max(-1, Math.min(1, (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2)));
      const angle = offset * 1.05;
      ball.vx = Math.sin(angle) * speed;
      ball.vy = -Math.cos(angle) * speed;
      ball.y = paddle.y - ball.r - 0.5;
      if (!attract) state.combo = 0;
      events |= EVENT_PADDLE;
    }

    for (const brick of state.bricks) {
      if (!brick.alive) continue;
      const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.w));
      const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.h));
      const dx = ball.x - closestX;
      const dy = ball.y - closestY;
      if (dx * dx + dy * dy > ball.r * ball.r) continue;
      // A live fireball ploughs straight through breakable bricks instead of
      // bouncing: it keeps its velocity and damages every brick it crosses.
      // Steel still bounces it — steel never breaks.
      if (state.fireTimer > 0 && !brick.steel) {
        events |= damageBrick(brick, attract);
        break;
      }
      const centreX = brick.x + brick.w / 2;
      const centreY = brick.y + brick.h / 2;
      const overlapX = (brick.w / 2 + ball.r) - Math.abs(ball.x - centreX);
      const overlapY = (brick.h / 2 + ball.r) - Math.abs(ball.y - centreY);
      if (overlapX < overlapY) {
        ball.vx = ball.x < centreX ? -Math.abs(ball.vx) : Math.abs(ball.vx);
        ball.x += ball.x < centreX ? -overlapX : overlapX;
      } else {
        ball.vy = ball.y < centreY ? -Math.abs(ball.vy) : Math.abs(ball.vy);
        ball.y += ball.y < centreY ? -overlapY : overlapY;
      }
      const speed = Math.hypot(ball.vx, ball.vy);
      if (Math.abs(ball.vy) < 0.35 * speed) {
        ball.vy = (ball.vy < 0 ? -1 : 1) * 0.35 * speed;
        ball.vx = Math.sign(ball.vx || 1) * Math.sqrt(Math.max(0, speed * speed - ball.vy * ball.vy));
      }
      events |= damageBrick(brick, attract);
      break;
    }
    return events;
  }

  function step(dt, dir, attract, mouseX) {
    let events = 0;
    state.frame += 1;
    state.shake = Math.max(0, state.shake - dt * 1.4);
    if (state.banner && state.banner.timer > 0) state.banner.timer -= dt;

    // A moving row rides one shared sine offset from its home slots, so it
    // slides as a piece and never leaves the field or overlaps its neighbours.
    for (const brick of state.bricks) {
      if (brick.moving) brick.x = brick.baseX + MOVE.amp * Math.sin(state.frame * MOVE.omega);
    }

    for (let index = state.particles.length - 1; index >= 0; index -= 1) {
      const particle = state.particles[index];
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 260 * dt;
      particle.life -= dt;
      if (particle.life <= 0) state.particles.splice(index, 1);
    }
    for (let index = state.texts.length - 1; index >= 0; index -= 1) {
      const text = state.texts[index];
      text.y -= 42 * dt;
      text.life -= dt;
      if (text.life <= 0) state.texts.splice(index, 1);
    }

    if (state.paddle.wideTimer > 0) state.paddle.wideTimer -= dt;
    if (state.slowTimer > 0) state.slowTimer -= dt;
    if (state.fireTimer > 0) state.fireTimer -= dt;
    state.paddle.w = state.paddle.wideTimer > 0 ? PADDLE.wideWidth : PADDLE.width;
    state.paddle.x = Math.max(0, Math.min(FIELD.width - state.paddle.w, state.paddle.x));

    if (state.won || state.over) return events;

    if (state.clearing > 0) {
      state.clearing -= dt;
      if (state.clearing <= 0) {
        state.clearing = 0;
        state.level += 1;
        state.speedBonus = 0;
        buildLevel(state.level);
        resetBall();
      }
      return events;
    }

    movePaddle(dt, dir, attract, mouseX);

    if (state.serving) {
      const ball = state.balls[0];
      if (ball) {
        ball.x = state.paddle.x + state.paddle.w / 2;
        ball.y = PADDLE.y - BALL.radius - 1;
      }
      if (attract) {
        if (launch()) events |= EVENT_LAUNCH;
      }
      return events;
    }

    for (const ball of state.balls) {
      if (ball.active) events |= stepBall(ball, dt, attract);
    }

    for (let index = state.powerups.length - 1; index >= 0; index -= 1) {
      const powerup = state.powerups[index];
      powerup.y += powerup.vy * dt;
      const paddle = state.paddle;
      if (powerup.y + POWERUP.size / 2 >= paddle.y && powerup.y - POWERUP.size / 2 <= paddle.y + paddle.h
        && powerup.x >= paddle.x - POWERUP.size / 2 && powerup.x <= paddle.x + paddle.w + POWERUP.size / 2) {
        applyPowerup(powerup.type);
        addText(paddle.x + paddle.w / 2, paddle.y - 34, POWERUP.label[powerup.type], POWERUP.color[powerup.type]);
        burst(powerup.x, powerup.y, POWERUP.color[powerup.type], 10, 200);
        state.powerups.splice(index, 1);
        events |= EVENT_POWERUP;
      } else if (powerup.y > FIELD.height + 40) {
        state.powerups.splice(index, 1);
      }
    }

    if (state.balls.every((ball) => !ball.active)) {
      if (attract) {
        resetBall();
        return events;
      }
      state.lives -= 1;
      state.combo = 0;
      state.shake = 1;
      state.paddle.wideTimer = 0;
      state.slowTimer = 0;
      state.fireTimer = 0;
      burst(state.paddle.x + state.paddle.w / 2, PADDLE.y, '#ff5c5c', 22, 380);
      events |= EVENT_LIFE_LOST;
      if (state.lives <= 0) {
        state.over = true;
        events |= EVENT_OVER;
      } else {
        resetBall();
      }
      return events;
    }

    if (state.bricksLeft === 0) {
      if (state.level >= LEVELS.length - 1) {
        if (attract) {
          state.level = 0;
          state.speedBonus = 0;
          buildLevel(0);
          resetBall();
        } else {
          state.won = true;
          state.score += 1000;
          events |= EVENT_WIN;
        }
      } else {
        if (!attract) {
          state.score += 500 + state.level * 250;
          addText(FIELD.width / 2, 360, `LEVEL BONUS +${500 + state.level * 250}`, '#ffd166');
        }
        state.clearing = CLEAR_HOLD;
        events |= EVENT_LEVEL_CLEAR;
      }
    }
    return events;
  }

  reset();

  return {
    state,
    reset,
    step,
    launch,
    addBall,
    spawnPowerup,
    burst,
    predictBallX,
    randomPick: (items) => randomPick(rng, items),
  };
}

// Everything on screen: the neon playfield, the HUD, and the title, pause, game-over
// and victory screens. The canvas is scaled from the fixed 1280x720 logical field to
// whatever window it fills.

import { FIELD, FONT, LEVELS, PALETTE, PADDLE, POWERUP } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

function rr(ctx, x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function glowText(ctx, text, x, y, font, color, glow, align) {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = glow;
  ctx.shadowBlur = 22;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function panel(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = PALETTE.panel;
  rr(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 2;
  ctx.shadowColor = PALETTE.panelEdge;
  ctx.shadowBlur = 16;
  ctx.stroke();
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
  }
  window.addEventListener('resize', resize);
  resize();

  function drawBackground(state) {
    const gradient = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    gradient.addColorStop(0, PALETTE.backdropTop);
    gradient.addColorStop(1, PALETTE.backdrop);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    for (const star of state.stars) {
      const alpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(state.frame * 0.05 + star.phase));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#cfe8ff';
      ctx.fillRect(star.x, star.y, star.r, star.r);
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = PALETTE.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 64; x < FIELD.width; x += 64) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, FIELD.height);
    }
    for (let y = 64; y < FIELD.height; y += 64) {
      ctx.moveTo(0, y);
      ctx.lineTo(FIELD.width, y);
    }
    ctx.stroke();

    ctx.save();
    ctx.shadowColor = PALETTE.rail;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = PALETTE.rail;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(6, FIELD.height);
    ctx.moveTo(FIELD.width - 6, 0);
    ctx.lineTo(FIELD.width - 6, FIELD.height);
    ctx.stroke();
    ctx.restore();
  }

  function drawBricks(state) {
    for (const brick of state.bricks) {
      if (!brick.alive) continue;
      ctx.save();
      ctx.shadowColor = brick.color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = brick.color;
      rr(ctx, brick.x, brick.y, brick.w, brick.h, 6);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      rr(ctx, brick.x + 3, brick.y + 3, brick.w - 6, 9, 4);
      ctx.fill();
      if (brick.maxHp > 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        for (let dot = 0; dot < brick.hp; dot += 1) {
          ctx.beginPath();
          ctx.arc(brick.x + brick.w / 2 + (dot - (brick.hp - 1) / 2) * 16, brick.y + brick.h / 2 + 4, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  }

  function drawPowerups(state) {
    for (const powerup of state.powerups) {
      const color = POWERUP.color[powerup.type];
      const bob = Math.sin(state.frame * 0.12 + powerup.x) * 2;
      const size = POWERUP.size;
      ctx.save();
      ctx.translate(powerup.x, powerup.y + bob);
      ctx.shadowColor = color;
      ctx.shadowBlur = 16;
      ctx.fillStyle = 'rgba(10,6,28,0.9)';
      rr(ctx, -size / 2, -size / 2, size, size, 8);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = color;
      ctx.font = `bold 17px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(powerup.type, 0, 1);
      ctx.restore();
    }
  }

  function drawPaddle(state) {
    const paddle = state.paddle;
    const gradient = ctx.createLinearGradient(paddle.x, 0, paddle.x + paddle.w, 0);
    gradient.addColorStop(0, '#0e7490');
    gradient.addColorStop(0.5, PALETTE.paddle);
    gradient.addColorStop(1, '#0e7490');
    ctx.save();
    ctx.shadowColor = PALETTE.paddle;
    ctx.shadowBlur = 20;
    ctx.fillStyle = gradient;
    rr(ctx, paddle.x, paddle.y, paddle.w, paddle.h, 9);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = PALETTE.paddleCore;
    rr(ctx, paddle.x + 8, paddle.y + 4, paddle.w - 16, 4, 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBalls(state) {
    for (const ball of state.balls) {
      if (!ball.active) continue;
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = PALETTE.ballGlow;
      ctx.beginPath();
      ctx.arc(ball.x - ball.vx * 0.03, ball.y - ball.vy * 0.03, ball.r * 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowColor = PALETTE.ballGlow;
      ctx.shadowBlur = 18;
      ctx.fillStyle = PALETTE.ball;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawParticles(state) {
    for (const particle of state.particles) {
      ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
    }
    ctx.globalAlpha = 1;
  }

  function drawTexts(state) {
    ctx.save();
    ctx.font = `bold 20px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const text of state.texts) {
      ctx.globalAlpha = Math.max(0, text.life / text.maxLife);
      ctx.fillStyle = text.color;
      ctx.fillText(text.text, text.x, text.y);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawHud(state, best) {
    ctx.save();
    ctx.font = `bold 26px ${FONT}`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = PALETTE.muted;
    ctx.textAlign = 'left';
    ctx.fillText('SCORE', 28, 30);
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(String(state.score).padStart(6, '0'), 118, 30);

    const levelName = LEVELS[state.level] ? LEVELS[state.level].name : '';
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText('LEVEL', FIELD.width / 2 - 110, 30);
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText(`${state.level + 1}  ${levelName}`, FIELD.width / 2 + 30, 30);

    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText('BEST', FIELD.width - 210, 30);
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(String(Math.max(best, state.score)).padStart(6, '0'), FIELD.width - 28, 30);

    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText('LIVES', 28, 66);
    for (let index = 0; index < 5; index += 1) {
      ctx.fillStyle = index < state.lives ? '#ff2fb3' : 'rgba(154,163,199,0.25)';
      ctx.font = '24px sans-serif';
      ctx.fillText('♥', 108 + index * 30, 67);
    }
    ctx.font = `bold 26px ${FONT}`;

    if (state.combo >= 2) {
      const mult = 1 + Math.floor(state.combo / 4);
      ctx.fillStyle = '#ff7a18';
      ctx.fillText(`COMBO x${Math.min(mult, 5)}  (${state.combo})`, 300, 66);
    }

    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `15px ${FONT}`;
    if (state.paddle.wideTimer > 0) ctx.fillText(`WIDE ${Math.ceil(state.paddle.wideTimer)}s`, FIELD.width - 28, 62);
    if (state.slowTimer > 0) ctx.fillText(`SLOW ${Math.ceil(state.slowTimer)}s`, FIELD.width - 28, 82);
    ctx.restore();
  }

  function drawTitle(state, best) {
    ctx.save();
    ctx.fillStyle = 'rgba(7,3,18,0.55)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    panel(ctx, 240, 118, 800, 484);
    glowText(ctx, 'NEON', 640, 208, `900 96px ${FONT}`, '#22d3ee', '#22d3ee');
    glowText(ctx, 'BREAKER', 640, 296, `900 96px ${FONT}`, '#ff2fb3', '#ff2fb3');
    ctx.font = `600 24px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.fillText('SMASH EVERY BRICK. CLEAR ALL 6 LEVELS.', 640, 378);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `20px ${FONT}`;
    ctx.fillText('Move:  ← →  or  A / D  or mouse      Launch ball:  Space / click', 640, 428);
    ctx.fillText('Catch falling capsules for power-ups      Pause:  P / Esc', 640, 460);
    ctx.fillText('M multi-ball   •   W wide paddle   •   S slow ball   •   L extra life', 640, 492);
    glowText(ctx, 'PRESS SPACE OR CLICK TO START', 640, 552, `bold 26px ${FONT}`, '#ffd166', '#ffd166');
    if (best > 0) {
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `18px ${FONT}`;
      ctx.fillText(`BEST SCORE  ${best}`, 640, 586);
    }
    ctx.restore();
  }

  function drawPaused() {
    ctx.save();
    ctx.fillStyle = 'rgba(7,3,18,0.66)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    glowText(ctx, 'PAUSED', 640, 330, `900 72px ${FONT}`, '#22d3ee', '#22d3ee');
    ctx.font = `22px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.fillText('Press P or Esc to resume', 640, 404);
    ctx.restore();
  }

  function drawOver(state, best) {
    ctx.save();
    ctx.fillStyle = 'rgba(7,3,18,0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    panel(ctx, 320, 168, 640, 384);
    glowText(ctx, 'GAME OVER', 640, 248, `900 64px ${FONT}`, '#ff5c5c', '#ff5c5c');
    ctx.font = `26px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(`FINAL SCORE   ${state.score}`, 640, 330);
    ctx.fillText(`LEVEL REACHED   ${state.level + 1} / ${LEVELS.length}`, 640, 372);
    ctx.fillStyle = state.score >= best && state.score > 0 ? PALETTE.gold : PALETTE.muted;
    ctx.fillText(state.score >= best && state.score > 0 ? '★ NEW BEST SCORE ★' : `BEST   ${best}`, 640, 414);
    glowText(ctx, 'PRESS R OR CLICK TO PLAY AGAIN', 640, 492, `bold 24px ${FONT}`, '#ffd166', '#ffd166');
    ctx.restore();
  }

  function drawWin(state, best) {
    ctx.save();
    ctx.fillStyle = 'rgba(7,3,18,0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    panel(ctx, 280, 148, 720, 424);
    glowText(ctx, 'YOU WIN!', 640, 228, `900 72px ${FONT}`, '#a3e635', '#a3e635');
    ctx.font = `26px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.fillText('ALL 6 LEVELS CLEARED', 640, 300);
    ctx.fillText(`FINAL SCORE   ${state.score}`, 640, 346);
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText(`BEST   ${Math.max(best, state.score)}`, 640, 388);
    glowText(ctx, 'PRESS R OR CLICK TO PLAY AGAIN', 640, 502, `bold 24px ${FONT}`, '#ffd166', '#ffd166');
    ctx.restore();
  }

  function draw(state, screen, best) {
    const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    const offsetX = (canvas.width - FIELD.width * scale) / 2;
    const offsetY = (canvas.height - FIELD.height * scale) / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const shakeX = state.shake > 0 ? state.shake * state.shake * 12 * Math.sin(state.frame * 0.9) : 0;
    const shakeY = state.shake > 0 ? state.shake * state.shake * 9 * Math.cos(state.frame * 1.3) : 0;
    ctx.setTransform(scale, 0, 0, scale, offsetX + shakeX * scale, offsetY + shakeY * scale);

    drawBackground(state);
    drawBricks(state);
    drawPowerups(state);
    drawPaddle(state);
    drawBalls(state);
    drawParticles(state);
    drawTexts(state);
    drawHud(state, best);

    if (state.clearing > 0 && screen === SCREEN_PLAY) {
      glowText(ctx, 'LEVEL CLEAR!', 640, 330, `900 64px ${FONT}`, '#a3e635', '#a3e635');
      glowText(ctx, `BONUS +${500 + state.level * 250}`, 640, 396, `bold 30px ${FONT}`, '#ffd166', '#ffd166');
    }
    if (state.serving && screen === SCREEN_PLAY) {
      ctx.font = `bold 22px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = PALETTE.text;
      ctx.fillText('SPACE / CLICK TO LAUNCH', 640, 610);
    }

    if (screen === SCREEN_TITLE) drawTitle(state, best);
    else if (screen === SCREEN_PAUSED) drawPaused();
    else if (screen === SCREEN_OVER) drawOver(state, best);
    else if (screen === SCREEN_WIN) drawWin(state, best);
  }

  return { draw };
}

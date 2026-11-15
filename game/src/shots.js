// The screenshot scenes behind ?shot=start|play|power|end. Each one plays the real
// rules forward from a fresh world for a fixed number of steps, steered by a simple
// autopilot (predict where the lowest ball will cross the paddle line and move there),
// so the frame is what a real game looks like and the same seed always gives the same
// frame. The end scene plays well first, then stops moving the paddle, so it loses all
// three lives for real.

import { FIELD, PADDLE, STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 45;
const POWER_SECONDS = 24;
const END_PLAY_SECONDS = 20;
const END_LIMIT_SECONDS = 300;
const POWER_HOLD_SECONDS = 2;

function pilotDirection(world) {
  const state = world.state;
  const active = state.balls.filter((ball) => ball.active);
  if (active.length === 0) return 0;
  let lowest = active[0];
  for (const ball of active) if (ball.y > lowest.y) lowest = ball;
  // Aim the paddle a touch off-centre, on the side the ball is already travelling
  // toward, so it leaves at an angle and sweeps across the brick field instead of
  // bouncing straight up the same gap forever.
  const sign = lowest.vx >= 0 ? 1 : -1;
  const target = world.predictBallX(lowest, PADDLE.y) - sign * 24;
  const centre = state.paddle.x + state.paddle.w / 2;
  if (target > centre + 6) return 1;
  if (target < centre - 6) return -1;
  return 0;
}

function stepPilot(world, seconds, pilot) {
  for (let index = 0; index < seconds / STEP; index += 1) {
    if (world.state.serving) world.launch();
    const events = world.step(STEP, pilot(world), false, null);
    if (world.state.over || world.state.won) return events;
  }
  return 0;
}

/**
 * Set `world` to the named scene and return the screen to draw over it and the best
 * score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'play') {
    stepPilot(world, PLAY_SECONDS, pilotDirection);
    return { screen: world.state.over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'power') {
    stepPilot(world, POWER_SECONDS, pilotDirection);
    world.addBall();
    world.addBall();
    world.spawnPowerup('M', FIELD.width / 2 + 60, 220);
    world.spawnPowerup('W', FIELD.width / 2 - 180, 150);
    world.burst(FIELD.width / 2, 300, '#ff2fb3', 26, 340);
    world.burst(FIELD.width / 2 - 220, 260, '#22d3ee', 18, 280);
    stepPilot(world, POWER_HOLD_SECONDS, pilotDirection);
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'end') {
    stepPilot(world, END_PLAY_SECONDS, pilotDirection);
    const limit = END_LIMIT_SECONDS / STEP;
    for (let index = 0; index < limit; index += 1) {
      if (world.state.serving) world.launch();
      world.step(STEP, 0, false, null);
      if (world.state.over) break;
    }
    return { screen: SCREEN_OVER, best: world.state.score };
  }
  for (let index = 0; index < START_SECONDS / STEP; index += 1) world.step(STEP, 0, true, null);
  return { screen: SCREEN_TITLE, best: 0 };
}

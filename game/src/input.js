// Keyboard and mouse, read once a frame. Keys set a held direction; Space, Enter or a
// click is a confirm (start, launch, restart); P or Escape pauses; R restarts from an
// end screen. The mouse steers the paddle directly when it has moved.

import { FIELD } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RESTART = 4;

export function createInput(canvas) {
  const keys = new Set();
  let queued = 0;
  let mouseX = null;
  let mouseSeen = false;

  function keyName(event) {
    return event.key.length === 1 ? event.key.toLowerCase() : event.key;
  }

  window.addEventListener('keydown', (event) => {
    const key = keyName(event);
    if (key === ' ' || key === 'ArrowLeft' || key === 'ArrowRight') event.preventDefault();
    if (event.repeat) return;
    keys.add(key);
    if (key === ' ' || key === 'Enter') queued |= ACTION_CONFIRM;
    if (key === 'p' || key === 'P' || key === 'Escape') queued |= ACTION_PAUSE;
    if (key === 'r' || key === 'R') queued |= ACTION_RESTART;
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(keyName(event));
  });
  window.addEventListener('blur', () => keys.clear());

  function readMouse(event) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0) return;
    mouseX = ((event.clientX - rect.left) / rect.width) * FIELD.width;
    mouseSeen = true;
  }
  canvas.addEventListener('mousemove', readMouse);
  canvas.addEventListener('pointerdown', (event) => {
    readMouse(event);
    queued |= ACTION_CONFIRM;
  });

  return {
    /** -1 left, 1 right, 0 still, from the held keys. */
    direction() {
      const left = keys.has('ArrowLeft') || keys.has('a') || keys.has('A');
      const right = keys.has('ArrowRight') || keys.has('d') || keys.has('D');
      if (left && !right) return -1;
      if (right && !left) return 1;
      return 0;
    },
    /** Logical x the mouse last pointed at, or null until the mouse moves. */
    mouseX() {
      return mouseSeen ? mouseX : null;
    },
    /** Actions pressed since the last read; reading clears them. */
    takeActions() {
      const actions = queued;
      queued = 0;
      return actions;
    },
  };
}

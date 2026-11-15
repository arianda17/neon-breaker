// Seeded random numbers (mulberry32). Every roll in the game comes from here, so the
// same seed always plays the same game: no Math.random, no Date.now in game logic.

/** Make a generator seeded with a 32-bit integer; returns floats in [0, 1). */
export function createRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [min, max] from a generator. */
export function randomInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Pick one element of an array from a generator. */
export function randomPick(rng, items) {
  return items[Math.floor(rng() * items.length)];
}

/** Float in [min, max) from a generator. */
export function randomRange(rng, min, max) {
  return min + rng() * (max - min);
}

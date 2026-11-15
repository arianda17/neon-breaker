// All sound is synthesised with WebAudio: short oscillator blips and a noise burst, no
// audio files. The context is created on the first user gesture, so loading the page
// (and the screenshot scenes) stays silent.

function tone(context, frequency, endFrequency, duration, type, volume, delay) {
  const start = context.currentTime + (delay || 0);
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (endFrequency !== frequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(endFrequency, 1), start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

function noiseBurst(context, duration, volume) {
  const length = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) data[index] = (index / length - 0.5) * 2 * (1 - index / length);
  const source = context.createBufferSource();
  source.buffer = buffer;
  const gain = context.createGain();
  gain.gain.value = volume;
  source.connect(gain).connect(context.destination);
  source.start();
}

export function createAudio() {
  let context = null;

  function ensure() {
    if (context) {
      if (context.state === 'suspended') context.resume();
      return context;
    }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
    } catch {
      context = null;
    }
    return context;
  }

  return {
    /** Call from any user gesture so later sounds are allowed to play. */
    unlock() {
      ensure();
    },
    paddle() {
      const ctx = ensure();
      if (!ctx) return;
      tone(ctx, 240, 170, 0.07, 'square', 0.10);
    },
    wall() {
      const ctx = ensure();
      if (!ctx) return;
      tone(ctx, 180, 150, 0.05, 'square', 0.05);
    },
    brick() {
      const ctx = ensure();
      if (!ctx) return;
      tone(ctx, 540, 190, 0.09, 'sawtooth', 0.10);
      noiseBurst(ctx, 0.06, 0.08);
    },
    brickHard() {
      const ctx = ensure();
      if (!ctx) return;
      tone(ctx, 320, 240, 0.06, 'square', 0.08);
    },
    powerup() {
      const ctx = ensure();
      if (!ctx) return;
      tone(ctx, 523, 523, 0.09, 'sine', 0.12);
      tone(ctx, 659, 659, 0.09, 'sine', 0.12, 0.08);
      tone(ctx, 784, 784, 0.14, 'sine', 0.12, 0.16);
    },
    launch() {
      const ctx = ensure();
      if (!ctx) return;
      tone(ctx, 330, 520, 0.08, 'sine', 0.09);
    },
    lifeLost() {
      const ctx = ensure();
      if (!ctx) return;
      tone(ctx, 300, 55, 0.45, 'sawtooth', 0.14);
      tone(ctx, 150, 40, 0.45, 'square', 0.08, 0.05);
    },
    levelClear() {
      const ctx = ensure();
      if (!ctx) return;
      const notes = [523, 659, 784, 1047];
      notes.forEach((note, index) => tone(ctx, note, note, 0.16, 'triangle', 0.12, index * 0.09));
    },
    win() {
      const ctx = ensure();
      if (!ctx) return;
      const notes = [523, 659, 784, 1047, 784, 1047, 1319];
      notes.forEach((note, index) => tone(ctx, note, note, 0.18, 'triangle', 0.12, index * 0.11));
    },
  };
}

# Neon Breaker

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/arianda17/neon-breaker/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/arianda17/neon-breaker/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

An original neon Breakout-style arcade game. Bounce the ball off your paddle,
smash every brick, catch falling power-up capsules, and clear all 6 levels
without losing your 3 lives. Steel bricks (levels 5-6) never break: bounce the
ball around them. Each level has its own neon theme.

## How to play

- **Move the paddle:** `←` `→` or `A` / `D`, or move the mouse.
- **Launch the ball:** `Space` or click.
- **Pause:** `P` or `Esc`.
- **Restart after game over / victory:** `R` or click.

Bricks take 1–3 hits. Breaking bricks in a row builds a combo that multiplies
your score. Broken bricks sometimes drop capsules:

- **M** — multi-ball
- **W** — wide paddle (12 s)
- **S** — slow ball (9 s)
- **L** — extra life

Each level is faster and its brick pattern is tougher. Clear all 6 to win.
Your best score is kept in the browser.

## How to run

```sh
node serve.ts            # serves game/ on http://localhost:8080
```

Open the page in a desktop browser and play. No network requests, no external
assets: all art is drawn on canvas and all sounds are synthesised with WebAudio.

## Screenshots

The four staged scenes (`?shot=start|fortress|power|win&seed=1`; `?shot=end` stages a
loss instead) are listed in `shots.json`. Every scene is deterministic: the same
seed always stages the same frame.

## Files

- `game/index.html` — page shell
- `game/src/config.js` — constants and the 6 level layouts
- `game/src/random.js` — seeded RNG (mulberry32)
- `game/src/input.js` — keyboard + mouse
- `game/src/audio.js` — WebAudio synth sounds
- `game/src/world.js` — paddle, balls, bricks, power-ups, particles, rules
- `game/src/render.js` — canvas drawing, HUD, title/pause/end screens
- `game/src/shots.js` — deterministic staged screenshot scenes
- `game/src/main.js` — boot, fixed-step loop, screen flow

## License

MIT — see `LICENSE`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=4hnkatg5&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>

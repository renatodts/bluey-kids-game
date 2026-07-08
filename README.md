# Hora de Guardar!

A little 3D tidy-up game with a Bluey theme, made for a small child (4 years old). The camera is never controlled by the child — it follows the action on its own (drag, success, celebration) and returns to the living-room diorama. The goal is simple: drag each toy to the right box.

Personal/private project — not distributed or published, since it contains official Bluey art (see [LICENSES.md](./LICENSES.md)).

## Stack

- [Vite](https://vitejs.dev/) — build and dev server
- [Three.js](https://threejs.org/) — 3D scene, camera, materials and procedural animation
- [camera-controls](https://github.com/yomotsu/camera-controls) — living-camera easing (AD-007)
- [Vitest](https://vitest.dev/) — unit tests for the pure game logic
- Playwright MCP — prompt-driven end-to-end scenarios (`e2e/scenarios/*.md`)

No UI framework: a static page served by Vite, plain JavaScript in `src/`.

## How to run

```bash
npm install
npm run dev       # development server
npm run build     # production build in dist/
npm run preview   # serve the production build locally
npm test          # run the Vitest suite
```

Open the address printed by Vite and click to play (audio only unlocks after the user's first gesture).

## Project structure

```
src/            game logic and scene (game.js is pure/testable; the rest is rendering)
assets/         Bluey art and 3D model (private use, see LICENSES.md)
e2e/scenarios/  end-to-end scenarios in natural language, run via Playwright MCP
.specs/         feature specs, architecture decisions (STATE.md) and lessons learned
```

## Tests

- **Unit** (`npm test`): cover the pure game logic (`game.js`, `hud.js`, `transitions.js`, `bluey.js`), without depending on WebGL.
- **End-to-end**: scenarios described in `e2e/scenarios/*.md`, run by an agent with Playwright MCP against `vite preview`, using the deterministic `window.__game` hook for assertions (the WebGL canvas is opaque to traditional DOM assertions).

## Licenses and credits

This project uses official Bluey art and a third-party 3D model. See [LICENSES.md](./LICENSES.md) before reusing, redistributing, or publishing any part of this repository.

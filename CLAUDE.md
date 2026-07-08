# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Hora de Guardar!" — a 3D tidy-up game with a Bluey theme, built for a 4-year-old. Drag toys into the matching box; the camera follows the action on its own (drag/success/celebration) and the child never controls it directly. Private/personal project — see `LICENSES.md` before reusing or publishing anything (official Bluey art + a CC-BY 3D model are used under private-use-only terms).

## Commands

```bash
npm install
npm run dev       # dev server (Vite)
npm run build     # production build to dist/
npm run preview   # serve the production build locally
npm test          # vitest run --passWithNoTests
```

Run a single test file: `npx vitest run src/game.test.js`
Run a single test by name: `npx vitest run -t "nome do teste"`

There is no lint script configured.

## Architecture

### Pure logic vs. rendering split (AD-004)

`src/game.js` is the entire game state machine — pure, no Three.js, no DOM — and is the only module covered by real unit tests (`game.test.js`, `hud.test.js`, `transitions.test.js`, `bluey.test.js`). Everything else under `src/` is rendering/DOM glue and is validated manually or via the Playwright-driven E2E scenarios, not Vitest, because jsdom can't exercise WebGL or Web Audio.

`createGame(storage)` in `game.js` owns: toy spawning per round (`toyCountForRound`: 6/9/12), a seedable RNG (`seed(n)`, mulberry32) for deterministic rounds in tests/E2E, toy state transitions (`idle → dragging → stored/idle`), round/victory phase (`playing → celebrating/won`), and round persistence to `localStorage` (tolerant of private-mode/storage failures — always falls back to round 1 rather than throwing).

### Composition root

`src/main.js` wires everything together and owns the render loop. Read it first when tracing how a user action turns into visual/audio feedback — it's the map of the whole system:

- `scene.js` builds the Three.js scene/camera/renderer/room.
- `camera-controls.js` wraps the `camera-controls` library for the "living camera" (AD-007): gesture-driven orbit/pan/zoom during play, but the child never gets a raw orbit control — an intro tween (in `main.js`) racks the camera from a close-up on Bluey out to the play view before handing off to the library.
- `drag.js` implements custom Pointer-Event dragging against an invisible ground plane raycast (AD-003) — deliberately not `DragControls`, because free-depth dragging is unusable for a small child. It disables camera gestures for the duration of a drag and is blocked during transitions/camera intro.
- `boxes.js` / `toys.js` build box and toy meshes; `nearestBox()` in `main.js` does a two-pass hit test (world-space snap radius first, then a screen-space projection fallback) because in portrait orientation the camera distance creates parallax between the finger position and the toy's ground projection.
- `feedback.js` handles all visual/audio juice: stored/rejected/settle animations, round-complete/victory celebrations, and the entire audio layer.
- `bluey.js` builds/animates the Bluey character: prefers a fan-made GLTF (`assets/bluey/bluey.glb`) if present, otherwise falls back to a procedural low-poly Bluey (AD-008) — never a 2D billboard. Bluey's head/body track the currently-dragged toy.
- `transitions.js` drives the iris open/close DOM overlay (`#transition-overlay`) used between rounds and on replay; while transitioning, drag input is ignored.
- `hud.js` renders progress purely from `game.getProgress()` (stars per completed round, bar fill for the current round).

### No text in the UI

The game deliberately has no in-game text (target audience can't read yet). The one exception is a plain adult-facing WebGL-unavailable error message in `main.js`. Keep this constraint in mind when touching UI/feedback code — prefer icons/animation/audio over labels.

### Audio (`feedback.js`)

All music and sound effects are synthesized in real time via the Web Audio API — no external audio files are loaded. This was a deliberate choice (see `.specs/lessons.json` L-003) to avoid licensing/network dependencies for a handful of simple effects. Background music loops at low volume and ducks automatically whenever a game effect (chime/oops/fanfare/victory) plays. Audio only unlocks on the user's first pointer gesture (browsers block autoplay); if unlocking fails, the game stays silent but fully functional — this must never throw.

### E2E test hook

`window.__game` (defined at the bottom of `main.js`) is the only interface E2E scenarios assert against — the WebGL canvas is opaque to accessibility snapshots. It exposes `state()` (full round/camera/audio/theme state), `screenPos(id)` (project a toy or box to screen coordinates for synthetic Pointer Events), and `seed(n)` (deterministic round respawn). Scenarios live in `e2e/scenarios/*.md` as natural-language steps executed by an agent via the Playwright MCP against `vite preview`/`npm run dev` — there is no Playwright test-runner config in this repo.

### Specs workflow (`.specs/`)

Features are planned/tracked spec-driven-development style: `.specs/features/<name>/` holds `spec.md`/`design.md`/`tasks.md`/`validation.md` per feature, `.specs/STATE.md` is the running architectural-decision log (AD-001..AD-008) and handoff notes, and `.specs/LESSONS.md`/`lessons.json` is a machine-maintained (don't hand-edit) log of recurring spec/design pitfalls. Check `STATE.md` for the current set of active decisions before making architectural changes — several (no orbit-only camera, custom drag instead of `DragControls`, synthesized audio, private-use-only assets) are load-bearing constraints, not just history.

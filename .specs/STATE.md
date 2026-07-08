# STATE

## Decisions

| ID | Decision | Rationale | Status |
|----|---------|-----------|--------|
| AD-001 | Stack: Vite + Three.js in plain JavaScript, static page (no framework) | Small project, one dev, simple deploy (local/static network); decided during brainstorming | active |
| AD-002 | Fixed camera on the diorama — no orbit/zoom/parallax | 4-year-old audience gets lost with camera controls | superseded by AD-007 |
| AD-003 | Custom drag via raycasting against an invisible plane at floor height (Pointer Events); do NOT use `DragControls` | DragControls drags at free depth, bad for a child; Pointer Events unifies touch and mouse | active |
| AD-004 | Pure game logic in `game.js`, with no renderer dependency, tested with Vitest; rendering code validated manually/Playwright | Allows an automated gate on what's testable without headless WebGL | active |
| AD-005 | Official Bluey assets for private family use only; publishing requires swapping the art or licensing | IP limit documented in `docs/references.md` | active |
| AD-006 | Prompt-driven E2E via Playwright MCP: scenarios in `e2e/scenarios/*.md` executed by the agent with the MCP's tools, backed by the deterministic `window.__game` hook | User request; the WebGL canvas is opaque to DOM asserts — asserts via the hook's state, screenshots as evidence | active |
| AD-007 | Automatic living camera: follows the action (drag/hit/celebration) with easing and returns to the diorama; the child NEVER controls the camera directly | Supersedes AD-002 while preserving its spirit (no camera control by the child); user's request for "environment moving" resolved without manual orbit/pan (discuss 2026-07-08) | active |
| AD-008 | Bluey character: fan-made GLTF if an asset with an OK license for private use exists; fallback is to build a procedural low-poly own version (never a 2D billboard) | Explicit user choice during discuss; consistent with AD-005 (private use) and the project's fallback pattern | active |

## Handoff

- **Feature `hora-de-guardar`: DONE on 2026-07-08.** 14/14 tasks (commits `5d12769..61947ac`), Verifier PASS (17/17 ACs, sensor 3/3 mutants killed, gates exit 0) — report at `.specs/features/hora-de-guardar/validation.md`.
- **Feature `visual-bluey`: DONE on 2026-07-08.** 11/11 tasks (commits `5c77f0f..8f616d8`), Verifier PASS (16/16 P1 ACs, sensor 3/3 mutants killed, gates exit 0, E2E scenarios 02/04 green via Playwright MCP against `vite preview`) — report at `.specs/features/visual-bluey/validation.md`. VIS-08 (P2 celebration) and VIS-09 (P3 Bingo) out of this delivery, Pending in the spec.
- Known pending items (non-blocking): candidate lessons L-001..L-005; 1 SPEC_DEVIATION documented in `index.html` (z-index of `#transition-overlay`: 5 instead of the design's 30, to stay below the start-overlay/WebGL error).
- **Feature `mobile-camera`: Tasks ready, NOT started.** spec.md + context.md + design.md + tasks.md in `.specs/features/mobile-camera/`. Next step: Execute (note: `cameraDirector` must be a pure, testable module, per the `visual-bluey` design).
- **User pending item:** manually download the "Bluey Heeler's Family" model (Sketchfab, CC-BY) and save it to `assets/bluey/bluey.glb` — instructions in `docs/references.md`. Without the file, the game uses the procedural Bluey (automatic fallback, validated); with the file, revalidate the `'gltf'` branch of E2E scenario 04 (note in T7/validation.md).
- **Feature `musica-e-sons`: DONE on 2026-07-08.** 6/6 ACs (MUS-01..04.1) implemented in `src/feedback.js`: synthesized looping background music (WebAudio, no download — consistent with AD-005/L-003), automatic ducking on effects, a lighthearted sound on mistakes (wrong box and dropped outside a box) — amendment to GUARD-03/GUARD-09 in `.specs/features/hora-de-guardar/spec.md`. No unit tests (WebAudio isn't testable in jsdom, same exception from AD-004 already applied to chime/fanfare/victoryTune); validated via the Vitest suite with no regression + clean build + manual check still pending from the user (listen with `npm run dev`).
- Game playable with `npm run dev`; production build validated via `npm run build` + `vite preview`.

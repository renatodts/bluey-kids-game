# Scenario 04 — Bluey theme, 3D character and fallback (GUARD-08, VIS-03, VIS-04)

Executed by an agent via Playwright MCP. Conventions from previous scenarios.
The hook exposes `state().theme = { framesLoaded, plaquesLoaded }` and
`state().bluey = { source, mode }` (`source: 'gltf' | 'procedural'`,
`mode: 'idle' | 'cheer' | 'dance'`).

Official assets live in `assets/bluey/` (see `assets/bluey/README.md`;
AD-005: private use). Served under `/bluey/*`. The solid-color fallback is
the initial state of the panels — the artwork only replaces it once the
texture loads successfully. The 3D Bluey character tries to load
`/bluey/bluey.glb` (fan-made GLTF, downloaded manually — see
`docs/references.md`); without the file, it uses the low-poly procedural
model (AD-008) — the game never ends up without the character.

---

## Part A — Theme present (viewport 1280×800)

1. Navigate with `localStorage` cleared; tap play; wait for the opening
   transition to finish (`transition === 'none'`), the camera pull-back
   (`camera.intro === false`, ~3s) and ~1s for the textures to load.
   **Assert (GUARD-08.3)**: `theme.framesLoaded === 3` (frames on the wall)
   and `theme.plaquesLoaded === 3` (Bluey/Bingo/Chilli plaques).
   **Assert (VIS-04)**: `bluey.source === 'gltf'` if `assets/bluey/bluey.glb`
   exists; otherwise `bluey.source === 'procedural'` (automatic fallback). In
   both cases `bluey.mode === 'idle'`.
2. **VIS-03 (Bluey celebrates a success)**: `seed(606)`; drag a toy to the
   correct box and release.
   **Assert**: toy `'stored'`; right after the success `bluey.mode === 'cheer'`;
   after ~2.5s `bluey.mode === 'idle'` (celebration ends on its own).
3. Evidence screenshot with the theme: `e2e-04-tema.jpeg` (frames + plaques +
   Bluey character in the corner all visible).

## Part B — Asset failure → functional fallback (GUARD-08.4, VIS-04)

4. Simulate failure: rename `assets/bluey` to `assets/bluey-off` (outside the
   browser) and reload the page with `localStorage` cleared; tap play; wait
   ~1s.
   **Assert**: `theme.framesLoaded === 0`, `theme.plaquesLoaded === 0`;
   `bluey.source === 'procedural'` (GLTF unavailable → own model);
   `console.warn` about unavailable artwork/model present (handled failure,
   not a fatal error).
5. Game remains playable: `seed(707)`; drag a toy to the correct box.
   **Assert**: toy `'stored'`; `phase` coherent; the procedural Bluey still
   celebrates (`bluey.mode === 'cheer'` right after the success).
6. Evidence screenshot of the fallback: `e2e-04-fallback.jpeg`.
7. Restore: rename `assets/bluey-off` back to `assets/bluey`.

## Green when

- Part A and Part B with all assertions confirmed.
- No console errors other than a favicon 404 and the 404s/warnings expected
  from the assets removed in Part B.
- Screenshots captured.

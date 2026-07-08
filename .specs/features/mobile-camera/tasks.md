# Mobile Camera & Fullscreen Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/mobile-camera/design.md`
**Status**: Draft

**Prerequisite**: the `visual-bluey` feature must be implemented and merged before starting this one — both touch `src/scene.js` (see Risks & Concerns in design.md); running them in series avoids a merge conflict within the same session.

---

## Test Coverage Matrix

> Generated from codebase sampling (`src/game.js` + `src/game.test.js`, precedent from `hora-de-guardar/tasks.md` and `visual-bluey/tasks.md`). Guidelines found: no `AGENTS.md`/`CLAUDE.md`/`CONTRIBUTING.md` in the repo — convention inferred from existing code (AD-004: pure logic tested, rendering/browser API validated manually/e2e).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------- | ---------------------- | ------------------ | ------------- |
| Camera logic (`src/cameraFraming.js`, `src/cameraDirector.js`) — no `three`, no DOM | unit (Vitest) | All branches; 1:1 with AC MOB-04..07 (state transitions, framing invariant, re-entrancy, dt clamp) | `src/*.test.js` | `npm test` |
| Rendering/browser API modules (`src/scene.js`, `src/fullscreen.js`, `src/drag.js` changes, `src/main.js`) | none | — (build gate; behavior covered by E2E flows, same pattern as `hora-de-guardar`/`visual-bluey`) | — | `npm run build` |
| Integrated flows (fullscreen, portrait, camera follow) | e2e (Playwright MCP, prompt-guided, AD-006) | Scenarios covering AC MOB-01..08 via the `window.__game` hook (`camera.mode`) + screenshots | `e2e/scenarios/*.md` | Run via Playwright MCP against `vite preview` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tasks with unit tests (`cameraFraming.js`, `cameraDirector.js`) | `npm test` |
| Build | Rendering/config-only tasks | `npm run build && npm test` |
| Full | Integrated-flow tasks | `npm run build && npm test` + run the task's E2E scenario(s) via Playwright MCP |

---

## Execution Plan

### Phase 1: Camera — pure logic

```
T1 → T2
```

### Phase 2: Wiring the camera into the game

```
T3 → T4 → T5
```

### Phase 3: Fullscreen and portrait

```
T6 → T7
```

### Phase 4: Docs and E2E review

```
T8 → T9
```

---

## Task Breakdown

### T1: Create `cameraFraming.js` (pure framing math)

**What**: `frameDistance(points, fov, aspect, margin)` — minimum camera distance to fit a set of points inside the frustum; `dioramaPose(aspect)` — pure refactor of the formula currently in `scene.js:100-110` (`onResize`).
**Where**: `src/cameraFraming.js`
**Depends on**: None
**Reuses**: The `widen`/distance formula from `src/scene.js:106` (generalized to N points instead of a single aspect)
**Requirement**: MOB-04, MOB-07

**Tools**:
- MCP: `context7` (check Three.js FOV/frustum formulas, even without depending on `three` in the code)
- Skill: NONE

**Done when**:
- [ ] Tests cover: 1 point, N scattered points, extreme aspects (narrow portrait and wide landscape), `margin` applied correctly
- [ ] `dioramaPose(aspect)` produces the same numeric pose as the current `onResize` for the aspects tested in `hora-de-guardar` (zero visual regression)
- [ ] Gate passes: `npm test`
- [ ] Test count: 6+ tests pass (no silent deletion)

**Tests**: unit
**Gate**: quick
**Commit**: `feat(camera): add pure frustum-fit framing math`

---

### T2: Create `cameraDirector.js` (state machine)

**What**: `createCameraDirector({dioramaPose, roomBounds})` with states `idle/follow/emphasis/celebrate/return`, exponential damping, and `update(dt)` returning `{position, lookAt, mode}`.
**Where**: `src/cameraDirector.js`
**Depends on**: T1
**Reuses**: `frameDistance`/`dioramaPose` (T1); the testable pure-module pattern from `game.js` (AD-004)
**Requirement**: MOB-04, MOB-05, MOB-06, MOB-07

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Tests cover each state-machine transition: `idle→follow→return→idle`; `follow→emphasis→(new follow cancels)`; `celebrate` only accepted from `idle`/`return`; large `dt` (tab was asleep) doesn't produce `NaN`/jump
- [ ] Framing in `follow`/`emphasis` keeps the 3 boxes + target inside the frustum (test with fixed points from `boxes.js`)
- [ ] Gate passes: `npm test`
- [ ] Test count: 10+ tests pass (no silent deletion)

**Tests**: unit
**Gate**: quick
**Commit**: `feat(camera): add camera director state machine`

---

### T3: Refactor `scene.js` — `onResize` stops touching the camera directly

**What**: `onResize()` recalculates `renderer.setSize`/`camera.aspect`/`updateProjectionMatrix` and returns the new `dioramaPose(aspect)` (T1) instead of setting `camera.position`/`lookAt` directly.
**Where**: `src/scene.js` (modify)
**Depends on**: T1
**Reuses**: `dioramaPose` (T1)
**Requirement**: MOB-07 (mitigation for the "onResize fights cameraDirector" risk)

**Tools**:
- MCP: NONE
- Skill: `threejs-fundamentals`

**Done when**:
- [ ] `onResize()` no longer sets `camera.position`/`camera.lookAt`; it returns the computed pose
- [ ] `npm run build` passes (visually identical to the previous state until T5 wires up the director)

**Tests**: none
**Gate**: build
**Commit**: `refactor(camera): decouple onResize from direct camera positioning`

---

### T4: Extend `drag.js` — `onDragMove` and `isBlocked`

**What**: `createDrag` receives `onDragMove(toyId, pos)` (fired at the end of `onPointerMove`) and `isBlocked` (checked at the start of `onPointerDown`) — both optional, additive.
**Where**: `src/drag.js` (modify)
**Depends on**: None
**Reuses**: Existing callback structure (`onPick`/`onDrop`)
**Requirement**: MOB-06

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Calling without the new parameters still works (backward compatible — `hora-de-guardar` and `visual-bluey` don't break)
- [ ] `npm run build && npm test` passes

**Tests**: none
**Gate**: build
**Commit**: `feat(drag): add optional onDragMove and isBlocked hooks`

---

### T5: Integrate `cameraDirector` into `main.js`

**What**: Creates `cameraDirector` with the initial `dioramaPose`; the animation loop calls `update(dt)` and applies the pose to `camera.position`/`camera.lookAt` before `renderer.render`; `onPick`→`follow`, `onDragMove`→`follow`, `handleDrop` (stored)→`emphasize`→`release`, (rejected/outside)→`release`; `roundComplete`→`celebrate`; the hook gains `window.__game.state().camera.mode`; the `window`'s `onResize` now calls `cameraDirector.setIdlePose(scene.onResize())`.
**Where**: `src/main.js` (modify)
**Depends on**: T2, T3, T4
**Reuses**: `cameraDirector.js` (T2); existing `handleDrop`/`spawnRound` structure
**Requirement**: MOB-04, MOB-05, MOB-06, MOB-07

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Dragging a toy smoothly pulls the camera closer (checked in `npm run dev`); releasing returns to the diorama
- [ ] Completing a round triggers the celebration fly-around and returns to the diorama once the new round is interactive
- [ ] `window.__game.state().camera.mode` reflects the current state
- [ ] `npm run build && npm test` passes

**Tests**: none (flow covered in T9's E2E)
**Gate**: build
**Commit**: `feat(camera): wire live camera director into gameplay`

---

### T6: Create `fullscreen.js` (fullscreen + orientation lock + portrait guard)

**What**: `requestGameFullscreen(canvas)` (feature-detected, silent on failure); `createPortraitGuard({overlayEl, onBlock, onUnblock})` listening to `resize`/`orientationchange`.
**Where**: `src/fullscreen.js`
**Depends on**: None
**Reuses**: The feature-detection pattern from `main.js:15-23` (`webglAvailable`)
**Requirement**: MOB-01, MOB-02, MOB-03

**Tools**:
- MCP: `context7` (current Fullscreen API / Screen Orientation API)
- Skill: NONE

**Done when**:
- [ ] `requestGameFullscreen` doesn't throw an unhandled error in a browser without support (checked via a manual `#nowebgl`-like flag or DevTools)
- [ ] `PortraitGuard.isPortrait()` reflects `window.innerWidth < window.innerHeight`
- [ ] `npm run build` passes

**Tests**: none
**Gate**: build
**Commit**: `feat(mobile): add fullscreen request and portrait guard`

---

### T7: Integrate fullscreen + portrait overlay into `main.js`/`index.html`

**What**: The play button calls `requestGameFullscreen(canvas)` in the same gesture; new `<div id="portrait-overlay">` in `index.html`; `createPortraitGuard` pauses the game (`isBlocked` combined with the one from `transitions.js` in the `visual-bluey` feature, or an `Array.some()` of blockers) and settles any actively dragged toy in place (reuse of `settle`) when the portrait overlay appears.
**Where**: `src/main.js` (modify), `index.html` (modify)
**Depends on**: T6, T5
**Reuses**: `fullscreen.js` (T6); existing `feedback.settle`; `isBlocked` mechanism from `drag.js` (T4)
**Requirement**: MOB-01, MOB-02, MOB-03

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Tapping play in a simulated landscape viewport enters fullscreen (or degrades silently if the API is missing)
- [ ] Rotating to portrait shows the overlay and pauses input; rotating back removes the overlay and resumes
- [ ] An active drag when entering portrait settles the toy in place (no state loss)
- [ ] `npm run build && npm test` passes

**Tests**: none (flow covered in T9's E2E)
**Gate**: build
**Commit**: `feat(mobile): wire fullscreen and portrait overlay into gameplay`

---

### T8: Document local network (LAN) access

**What**: `README.md` (or a section in `docs/`) documenting `npm run dev -- --host` and `npm run preview -- --host`, noting that no game functionality depends on a secure context.
**Where**: `README.md` (create if it doesn't exist) or `docs/lan.md`
**Depends on**: None
**Reuses**: Vite's native support (`--host`), no new code
**Requirement**: MOB-03

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Instructions tested manually: `npm run dev -- --host` exposes a local network IP reachable from another device
- [ ] `npm run build` passes

**Tests**: none
**Gate**: build
**Commit**: `docs: document LAN access via vite --host`

---

### T9: Rewrite E2E scenario 05 (portrait) + new live-camera scenario

**What**: Rewrite `e2e/scenarios/05-robustez.md` for the new portrait contract (overlay + pause, no longer "pull camera back"); create `e2e/scenarios/06-camera-viva.md` covering follow during a drag, return to idle, and the celebration fly-around, via `window.__game.state().camera.mode`.
**Where**: `e2e/scenarios/05-robustez.md` (modify), `e2e/scenarios/06-camera-viva.md` (new)
**Depends on**: T7
**Reuses**: Existing prompt-guided scenario structure (AD-006)
**Requirement**: MOB-01, MOB-02, MOB-04, MOB-05

**Tools**:
- MCP: `plugin_playwright_playwright` (via Playwright MCP)
- Skill: NONE

**Done when**:
- [ ] Scenario 05 passes with the new portrait behavior (overlay+pause)
- [ ] Scenario 06 passes: `camera.mode` cycles through `idle→follow→emphasis→return→idle` on a successful drop, and goes through `celebrate` on a completed round
- [ ] `npm run build && npm test` passes

**Tests**: e2e
**Gate**: full
**Commit**: `test(e2e): update portrait scenario, add live camera scenario`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4

Phase 1:  T1 ──→ T2
Phase 2:  T3 ──→ T4 ──→ T5
Phase 3:  T6 ──→ T7
Phase 4:  T8 ──→ T9
```

**Suggested batching for Execute** (9 tasks > ~8, sub-agent offer will be made): Batch 1 = Phase 1 + Phase 2 (5 tasks), Batch 2 = Phase 3 + Phase 4 (4 tasks).

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: `cameraFraming.js` | 1 module (2 pure functions) | ✅ Granular |
| T2: `cameraDirector.js` | 1 module (1 state machine) | ✅ Granular |
| T3: Refactor `onResize` | 1 file, 1 function | ✅ Granular |
| T4: Extend `drag.js` | 1 file, 2 optional parameters | ✅ Granular |
| T5: Integrate director into `main.js` | 1 file, 1 cohesive concept (camera wiring) | ✅ Granular |
| T6: `fullscreen.js` | 1 module (2 functions) | ✅ Granular |
| T7: Integrate fullscreen+portrait | 2 files, 1 cohesive concept | ✅ Granular |
| T8: LAN docs | 1 file | ✅ Granular |
| T9: E2E review | 2 scenario files, 1 concept | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ----------------------- | -------------- | ------ |
| T1 | None | (start of Phase 1) | ✅ Match |
| T2 | T1 | T1→T2 | ✅ Match |
| T3 | T1 | (start of Phase 2, depends on T1 from the previous phase) | ✅ Match |
| T4 | None | T3→T4 (sequential within the phase) | ✅ Match |
| T5 | T2, T3, T4 | T4→T5 (+ depends on T2, previous phase) | ✅ Match |
| T6 | None | (start of Phase 3) | ✅ Match |
| T7 | T6, T5 | T6→T7 (+ depends on T5, previous phase) | ✅ Match |
| T8 | None | (start of Phase 4) | ✅ Match |
| T9 | T7 | T8→T9 (sequential within the phase; real dependency is T7, previous phase) | ✅ Match |

No dependency points to a later phase — all point backward or within the same phase.

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | ----------------------------- | ------------------ | ----------- | ------ |
| T1 | Camera logic (`cameraFraming.js`) | unit | unit | ✅ OK |
| T2 | Camera logic (`cameraDirector.js`) | unit | unit | ✅ OK |
| T3 | Rendering (`scene.js`) | none | none | ✅ OK |
| T4 | Rendering (`drag.js`) | none | none | ✅ OK |
| T5 | Rendering (`main.js`) | none | none | ✅ OK |
| T6 | Rendering/browser API (`fullscreen.js`) | none | none | ✅ OK |
| T7 | Rendering (`main.js`, `index.html`) | none | none | ✅ OK |
| T8 | Docs | none | none | ✅ OK |
| T9 | Integrated flow (E2E) | e2e | e2e | ✅ OK |

No violations — the only two unit-testable layers (`cameraFraming.js`, `cameraDirector.js`) have their tests co-located in T1/T2 themselves.

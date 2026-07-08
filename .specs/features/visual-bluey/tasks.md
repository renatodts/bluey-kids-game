# Visual Bluey Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/visual-bluey/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase sampling (`src/game.js` + `src/game.test.js`, precedent from `hora-de-guardar/tasks.md`). Guidelines found: no `AGENTS.md`/`CLAUDE.md`/`CONTRIBUTING.md` in the repo — convention inferred from existing code (AD-004: pure logic tested, rendering validated manually/e2e).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------- | ---------------------- | ------------------ | ------------- |
| Transition logic (`src/transitions.js`) — injected DOM, no `three` | unit (Vitest) | All branches; 1:1 with AC VIS-06/07 (`open`/`close`/`state`/`isBlocking`/no-overlap); overlay mocked (object with a `.animate()` stub), no jsdom | `src/*.test.js` | `npm test` |
| Rendering modules (`src/materials.js`, `src/room.js`, `src/scene.js`, `src/boxes.js`, `src/toys.js`, `src/bluey.js`, `src/feedback.js`) | none | — (build gate; behavior covered by E2E flows, same pattern as `hora-de-guardar`) | — | `npm run build` |
| Integrated flows (opening, Bluey reacting, transition between rounds) | e2e (Playwright MCP, prompt-guided, AD-006) | Scenarios covering AC VIS-01..07 via the `window.__game` hook (`bluey.source`, `bluey.mode`, `transition`) + screenshots | `e2e/scenarios/*.md` | Run the scenario via Playwright MCP against `vite preview` |

## Gate Check Commands

> Reuses the pattern already validated in `hora-de-guardar/tasks.md`.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tasks with unit tests (`transitions.js`) | `npm test` |
| Build | Rendering/config-only tasks | `npm run build && npm test` |
| Full | Integrated-flow tasks | `npm run build && npm test` + run the task's E2E scenario(s) via Playwright MCP |

---

## Execution Plan

### Phase 1: Stage — materials, room, light and shadow

```
T1 → T2 → T3 → T4 → T5
```

### Phase 2: Bluey — 3D character

```
T6 → T7 → T8
```

### Phase 3: Cartoon-style transitions

```
T9 → T10
```

### Phase 4: E2E review

```
T11
```

---

## Task Breakdown

### T1: Create `materials.js` (toon material factory)

**What**: Module with `GRADIENT_MAP` (3-band DataTexture) and `toonMaterial(color, extra)` shared across the whole project.
**Where**: `src/materials.js`
**Depends on**: None
**Reuses**: None (new base) — follows the simple factory pattern of `toys.js`
**Requirement**: VIS-01

**Tools**:
- MCP: `context7` (verify the current `MeshToonMaterial`/`DataTexture` API before coding)
- Skill: `threejs-materials`

**Done when**:
- [x] `toonMaterial()` returns a `MeshToonMaterial` with a 3-band `gradientMap`
- [x] `npm run build` passes

**Tests**: none
**Gate**: build
**Commit**: `feat(visual): add shared toon material factory`

---

### T2: Create `room.js` (Heeler living room furniture)

**What**: Group with sofa, rug, window and sunny backyard (composed primitives, `toys.js` style), using `toonMaterial`; exports `ROOM_CLEARANCE`.
**Where**: `src/room.js`
**Depends on**: T1
**Reuses**: `materials.js` (T1); composition pattern from `toys.js`/`boxes.js`
**Requirement**: VIS-01

**Tools**:
- MCP: `context7`
- Skill: `threejs-geometry`, `threejs-materials`

**Done when**:
- [x] `createRoom()` returns a `THREE.Group` with at least a sofa, rug, window+backyard
- [x] Exported `ROOM_CLEARANCE` does not collide with `FLOOR_BOUNDS` from `game.js` (manual visual check)
- [x] `npm run build` passes

**Tests**: none
**Gate**: build
**Commit**: `feat(visual): add stylized Heeler living room`

---

### T3: Integrate room + shadows + warm light into `scene.js`

**What**: `scene.js` calls `createRoom()`, converts floor/wall/frames to `toonMaterial`, enables `renderer.shadowMap` (PCFSoftShadowMap), adds a warm directional light with `castShadow` and a frustum fitted to `ROOM`.
**Where**: `src/scene.js` (modified)
**Depends on**: T2
**Reuses**: `applyArtTexture`/`themeStatus` (art fallback unchanged); `room.js` (T2)
**Requirement**: VIS-01, VIS-02

**Tools**:
- MCP: `context7`
- Skill: `threejs-lighting`, `threejs-materials`

**Done when**:
- [x] Heeler living room visible in `npm run dev` with soft shadows and warm light
- [x] Frames/plaques still fall back to solid color if the texture fails (zero regression of GUARD-08.4)
- [x] `npm run build` passes

**Tests**: none
**Gate**: build
**Commit**: `feat(visual): shadows, warm light and room integration in scene.js`

---

### T4: Migrate `boxes.js` to toon material

**What**: Replace `MeshLambertMaterial` with `toonMaterial()` on the basket/chest/bed; keep `castShadow`/`receiveShadow` consistent.
**Where**: `src/boxes.js` (modified)
**Depends on**: T1
**Reuses**: `materials.js` (T1)
**Requirement**: VIS-01

**Tools**:
- MCP: NONE
- Skill: `threejs-materials`

**Done when**:
- [x] Boxes use `toonMaterial`; no change to position/`snapRadius`/`userData.boxType` (mechanic intact)
- [x] `npm run build` passes

**Tests**: none
**Gate**: build
**Commit**: `feat(visual): toon-shade storage boxes`

---

### T5: Migrate `toys.js` to toon material

**What**: Replace `MeshLambertMaterial` with `toonMaterial()` on ball/block/plush.
**Where**: `src/toys.js` (modified)
**Depends on**: T1
**Reuses**: `materials.js` (T1)
**Requirement**: VIS-01

**Tools**:
- MCP: NONE
- Skill: `threejs-materials`

**Done when**:
- [x] Toys use `toonMaterial`; `userData.type`/`userData.toyId` unchanged (mechanic intact)
- [x] `npm run build` passes

**Tests**: none
**Gate**: build
**Commit**: `feat(visual): toon-shade toys`

---

### T6: Create `bluey.js` — procedural Bluey (fallback, AD-008)

**What**: `createBluey({scene, cornerPosition, centerPosition})` with a procedural low-poly model (composition of primitives, `toys.js` style) and an idle/cheer/dance state machine (own tween, `feedback.js` pattern); `source: 'procedural'` fixed in this task.
**Where**: `src/bluey.js`
**Depends on**: T1
**Reuses**: `materials.js` (T1); tween pattern from `feedback.js` (`addTween`/`cancel`); composition pattern from `toys.js`
**Requirement**: VIS-03, VIS-05

**Tools**:
- MCP: `context7`
- Skill: `threejs-geometry`, `threejs-animation`, `threejs-materials`

**Done when**:
- [x] `bluey.cheer()` restarts correctly when called during an in-progress cheer (AC VIS-03.6, checked manually by firing it twice in a row)
- [x] `bluey.danceAt(pos, duration)` moves to the center and `returnToCorner()` returns to the original position
- [x] Bluey is never added to the drag raycast's `toys` array (AC VIS-03.5 — code check)
- [x] `npm run build` passes

**Tests**: none
**Gate**: build
**Commit**: `feat(visual): add procedural Bluey character with idle/cheer/dance states`

---

### T7: Add GLTF loading with fallback in `bluey.js`

**What**: `loadBlueyModel()` tries `GLTFLoader` on `/bluey/bluey.glb`; success → replaces the procedural build, `source: 'gltf'`; failure/absence → keeps the procedural build (T6), `source: 'procedural'`; animation is always procedural (bob/squash) regardless of the GLTF's clips (spec edge case).
**Where**: `src/bluey.js` (modified)
**Depends on**: T6
**Reuses**: Fallback pattern from `applyArtTexture` (`scene.js:23`), adapted for a 3D model (see skill `threejs-loaders`)
**Requirement**: VIS-04

**Tools**:
- MCP: `context7`
- Skill: `threejs-loaders`

**Done when**:
- [x] With `assets/bluey/bluey.glb` absent: `bluey.source === 'procedural'`, game functional, `console.warn` (GUARD-08.4 pattern)
- [x] If the `assets/bluey/bluey.glb` file is already present (manually downloaded by the user — see `docs/references.md`): `bluey.source === 'gltf'` and the model appears in the scene
- [x] `npm run build` passes
- [x] **Execution note**: if `assets/bluey/bluey.glb` doesn't yet exist at the time of this task, the GLTF path is implemented and tested only via the fallback branch; validate the success branch as soon as the file arrives (does not block the following tasks)

**Tests**: none
**Gate**: build
**Commit**: `feat(visual): load fan-made Bluey GLTF with procedural fallback`

---

### T8: Integrate Bluey into `main.js` (hook + triggers) and remove the old 2D cheer

**What**: `main.js` creates `bluey`; `feedback.stored()` calls `bluey.cheer()` instead of `showCheer()`; `roundComplete` calls `bluey.danceAt(center, 3)`; removes `createCheer`/`showCheer`/`cheer` from `feedback.js` and `themeStatus.cheerLoaded`/`cheerVisible` from `scene.js`; the `window.__game.state()` hook gains `bluey: {source, mode}`.
**Where**: `src/main.js`, `src/feedback.js`, `src/scene.js` (modified)
**Depends on**: T7
**Reuses**: Existing composition structure of `main.js`; `createFeedback` extended via an injected `bluey` parameter (same injection pattern as `floorY`)
**Requirement**: VIS-03, VIS-04

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Getting a toy right triggers `bluey.cheer()` (checked in `npm run dev`)
- [x] Completing a round triggers `bluey.danceAt()` alongside the existing confetti rain
- [x] `window.__game.state().bluey` returns a consistent `{source, mode}`
- [x] `themeStatus.cheerLoaded`/`cheerVisible` removed without breaking `framesLoaded`/`plaquesLoaded`
- [x] `npm run build && npm test` passes

**Tests**: none (flow covered by the E2E in T11)
**Gate**: build
**Commit**: `feat(visual): wire Bluey reactions into gameplay, retire 2D cheer billboard`

---

### T9: Create `transitions.js` (DOM iris) + overlay in `index.html`

**What**: `createTransitions(overlayEl)` with `open()`/`close()`/`state`/`isBlocking()`; uses `Element.animate()` (Web Animations API) for the iris effect via `clip-path`; non-overlap guard (a call made during an active transition returns the in-progress Promise). New `<div id="transition-overlay">` in `index.html`.
**Where**: `src/transitions.js`, `index.html` (modified)
**Depends on**: None (parallel to Phases 1-2, but sequenced here to keep phase order)
**Reuses**: No 3D component — pure DOM, explicit design decision
**Requirement**: VIS-06, VIS-07

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Unit tests cover: `open()`/`close()` resolve and change `state` correctly; a repeated call during an active transition does not start a second animation (AC VIS-07.5); `isBlocking()` reflects `state !== 'none'`
- [x] Gate passes: `npm test`
- [x] Test count: 4+ tests pass (no silent deletion)

**Tests**: unit
**Gate**: quick
**Commit**: `feat(visual): add DOM iris transition controller`

---

### T10: Integrate transitions into `main.js` + input gate in `drag.js`

**What**: The play button calls `transitions.open()` after removing the initial overlay; round completion does `transitions.close()` → `spawnRound()` → `transitions.open()`; `createDrag` receives `isBlocked: () => transitions.isBlocking()`; the hook gains `window.__game.state().transition`.
**Where**: `src/main.js` (modified), `src/drag.js` (modified — optional `isBlocked` parameter)
**Depends on**: T9, T8
**Reuses**: `transitions.js` (T9); existing `handleDrop`/`spawnRound` structure
**Requirement**: VIS-06, VIS-07

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [x] Tapping play shows the opening transition before the game becomes interactive
- [x] Completing a round shows the iris close/open between removing the old toys and spawning the new ones
- [x] Dragging during a transition moves nothing (`isBlocked()` active)
- [x] `npm run build && npm test` passes

**Tests**: none (flow covered by the E2E in T11)
**Gate**: build
**Commit**: `feat(visual): wire opening and round transitions into gameplay`

---

### T11: Review affected E2E scenarios (04 and 02)

**What**: Rewrite `e2e/scenarios/04-tema-e-fallback.md` to assert `bluey.source`/`bluey.mode` instead of `theme.cheerLoaded/cheerVisible` (removed in T8); add to `e2e/scenarios/02-rodada-completa.md` the `transition` asserts (opens/closes between rounds) and `bluey.mode === 'dance'` during the celebration.
**Where**: `e2e/scenarios/04-tema-e-fallback.md`, `e2e/scenarios/02-rodada-completa.md` (modified)
**Depends on**: T10
**Reuses**: Existing prompt-guided scenario structure (AD-006)
**Requirement**: VIS-03, VIS-04, VIS-06, VIS-07

**Tools**:
- MCP: `plugin_playwright_playwright` (via Playwright MCP)
- Skill: NONE

**Done when**:
- [x] Scenario 04 green: `bluey.source` is `'gltf'` or `'procedural'` depending on asset availability; frame/plaque fallback still covered (run 2026-07-08 against `vite preview`; no `bluey.glb` → `'procedural'` per AD-008; note: against preview, the failure simulation renames `dist/bluey`, not `assets/bluey`)
- [x] Scenario 02 green: `transition` toggles `'closing'`→`'opening'`→`'none'` between rounds (sequence recorded via rAF); `bluey.mode === 'dance'` observed during the celebration; input gate confirmed (no `dragging` during the iris)
- [x] `npm run build && npm test` passes (28/28)

**Tests**: e2e
**Gate**: full
**Commit**: `test(e2e): update scenario 04 for Bluey character, extend scenario 02 for transitions`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4

Phase 1:  T1 ──→ T2 ──→ T3 ──→ T4 ──→ T5
Phase 2:  T6 ──→ T7 ──→ T8
Phase 3:  T9 ──→ T10
Phase 4:  T11
```

Execution is strictly sequential within each phase. T9 doesn't technically depend on T1-T8, but it is sequenced after Phase 2 to keep the phase order simple (one workstream at a time).

**Suggested batching for Execute** (11 tasks > ~8, sub-agent offer will be made): Batch 1 = Phase 1 + Phase 2 (8 tasks), Batch 2 = Phase 3 + Phase 4 (3 tasks).

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: `materials.js` | 1 module (2 exports) | ✅ Granular |
| T2: `room.js` | 1 module (1 export + const) | ✅ Granular |
| T3: Integrate room+shadow+light into `scene.js` | 1 file, 1 cohesive concept (stage) | ✅ Granular |
| T4: `boxes.js` → toon | 1 file, material swap | ✅ Granular |
| T5: `toys.js` → toon | 1 file, material swap | ✅ Granular |
| T6: Procedural Bluey | 1 new module, 1 concept (character+states) | ✅ Granular |
| T7: Bluey GLTF+fallback | 1 file, 1 function (`loadBlueyModel`) | ✅ Granular |
| T8: Integration + removal of 2D cheer | 3 files, 1 cohesive concept (wiring reactions) | ✅ Granular |
| T9: `transitions.js` + overlay | 2 files, 1 cohesive concept (transition controller) | ✅ Granular |
| T10: Integrate transitions + input gate | 2 files, 1 cohesive concept (wiring transitions) | ✅ Granular |
| T11: E2E review | 2 scenario files, 1 concept (post-visual-change asserts) | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ----------------------- | -------------- | ------ |
| T1 | None | (start of Phase 1) | ✅ Match |
| T2 | T1 | T1→T2 | ✅ Match |
| T3 | T2 | T2→T3 | ✅ Match |
| T4 | T1 | T1→T2→T3→T4 (sequential within phase) | ✅ Match |
| T5 | T1 | T4→T5 (sequential within phase) | ✅ Match |
| T6 | T1 | (start of Phase 2) | ✅ Match |
| T7 | T6 | T6→T7 | ✅ Match |
| T8 | T7 | T7→T8 | ✅ Match |
| T9 | None | (start of Phase 3) | ✅ Match |
| T10 | T9, T8 | T9→T10 (+ depends on T8, previous phase) | ✅ Match |
| T11 | T10 | T10→T11 | ✅ Match |

No dependency points to a later phase — all point backward or within the same phase.

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | ----------------------------- | ------------------ | ----------- | ------ |
| T1 | Rendering (`materials.js`) | none | none | ✅ OK |
| T2 | Rendering (`room.js`) | none | none | ✅ OK |
| T3 | Rendering (`scene.js`) | none | none | ✅ OK |
| T4 | Rendering (`boxes.js`) | none | none | ✅ OK |
| T5 | Rendering (`toys.js`) | none | none | ✅ OK |
| T6 | Rendering (`bluey.js`) | none | none | ✅ OK |
| T7 | Rendering (`bluey.js`) | none | none | ✅ OK |
| T8 | Rendering (`main.js`, `feedback.js`, `scene.js`) | none | none | ✅ OK |
| T9 | Transition logic (`transitions.js`) | unit | unit | ✅ OK |
| T10 | Rendering (`main.js`, `drag.js`) | none | none | ✅ OK |
| T11 | Integrated flow (E2E) | e2e | e2e | ✅ OK |

No violations — all "rendering" layer tasks use `Tests: none` per the matrix; the only unit-testable layer (`transitions.js`) has its tests co-located in T9 itself.

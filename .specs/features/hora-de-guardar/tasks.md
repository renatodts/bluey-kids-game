# "Hora de Guardar!" Tasks

## Execution Protocol (MANDATORY — do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its
Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill
is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy
review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/hora-de-guardar/design.md`
**Status**: Done (2026-07-08 — 14/14 tasks, Verifier PASS: `.specs/features/hora-de-guardar/validation.md`)

---

## Test Coverage Matrix

> Generated from spec + user decision (prompt-guided E2E via Playwright MCP — AD-006).
> Guidelines found: none in the repo — strong defaults applied. Confirm before Execute.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
|---|---|---|---|---|
| Game logic (`src/game.js`) | unit (Vitest) | All branches; 1:1 with ACs GUARD-02/03/04/05/06; all listed edge cases (broken storage, states) | `src/*.test.js` | `npm test` |
| Rendering modules (`src/scene.js`, `src/toys.js`, `src/boxes.js`, `src/feedback.js`, `src/drag.js`) | none | — (build gate; behavior covered by E2E flows) | — | `npm run build` |
| Integrated flows (`src/main.js` + `window.__game` hook) | e2e (prompt-guided, Playwright MCP) | Every user flow from the spec: happy + edge + failure (GUARD-01/02/03/05/07/08/09), desktop and mobile-touch viewport | `e2e/scenarios/*.md` | agent runs the scenario via Playwright MCP against `npm run dev` |

**E2E scenarios (prompt-guided):** Markdown files with numbered steps + asserts on
`window.__game.state()` + evidence screenshot. The agent executes them with the MCP tools
(`browser_navigate`, `browser_evaluate` firing Pointer Events at coordinates from
`__game.screenPos()`, `browser_resize`, `browser_take_screenshot`).

## Gate Check Commands

> Generated from the chosen stack — confirm before Execute.

| Gate Level | When to Use | Command |
|---|---|---|
| Quick | Tasks with unit tests | `npm test` |
| Build | Rendering/config-only tasks | `npm run build && npm test` |
| Full | Integrated-flow tasks | `npm run build && npm test` + run the task's E2E scenarios via Playwright MCP |

---

## Execution Plan

Ordered phases; tasks in order within each phase.

### Phase 1: Foundation (pure logic)
```
T1 → T2 → T3
```
### Phase 2: Scene
```
T4 → T5 → T6
```
### Phase 3: Integrated interaction
```
T7 → T8
```
### Phase 4: Feedback, theme and sound
```
T9 → T10 → T11 → T12
```
### Phase 5: Polish and full E2E
```
T13 → T14
```

---

## Task Breakdown

### T1: Project scaffold

**What**: Working Vite + three + vitest project: `package.json` (`dev`/`build`/`test` scripts), `index.html` (canvas + start-screen overlay), `src/main.js` stub, `.gitignore`.
**Where**: root, `index.html`, `src/main.js`
**Depends on**: None | **Reuses**: — | **Requirement**: GUARD-07 (base)
**Tools**: MCP: NONE | Skill: NONE
**Done when**:
- [x] `npm run dev` serves the page; `npm run build` passes; `npm test` runs (0 tests) with no error
**Tests**: none | **Gate**: build
**Commit**: `chore: scaffold vite + three + vitest`

### T2: game.js — round, matching and states

**What**: `createGame`, `startRound` (6/9/12, balanced types, seedable RNG for color/position), `tryStore` (stored/rejected), `isRoundComplete`, toy/round state machine. Unit tests 1:1 with GUARD-02/03/04 + transitions.
**Where**: `src/game.js`, `src/game.test.js`
**Depends on**: T1 | **Reuses**: — | **Requirement**: GUARD-02, GUARD-03, GUARD-04
**Tools**: MCP: NONE | Skill: NONE
**Done when**:
- [x] Matching and generation ACs covered by tests derived from the spec (not from the implementation)
- [x] Gate passes: `npm test`; test count recorded in the commit
**Tests**: unit | **Gate**: quick
**Commit**: `feat(game): round generation, matching and state machine`

### T3: game.js — progression and persistence

**What**: `advanceRound` (6→9→12, then repeats 12), exception-tolerant storage wrapper, resuming the saved round, round-1 fallback. Tests with a storage stub and a storage that throws.
**Where**: `src/game.js`, `src/game.test.js`
**Depends on**: T2 | **Reuses**: T2 | **Requirement**: GUARD-05 (logic), GUARD-06
**Tools**: MCP: NONE | Skill: NONE
**Done when**:
- [x] ACs GUARD-06.1–.4 and progression GUARD-04.1 covered; `npm test` passes
**Tests**: unit | **Gate**: quick
**Commit**: `feat(game): round progression and tolerant persistence`

### T4: scene.js — stage with fixed camera

**What**: Renderer, fixed `PerspectiveCamera`, lights, floor + wall, placeholder frames (solid color), responsive resize that keeps the scene visible.
**Where**: `src/scene.js` (+ used in `src/main.js`)
**Depends on**: T1 | **Reuses**: resize pattern from the Three.js examples | **Requirement**: GUARD-07
**Tools**: MCP: `context7` (current three API) | Skill: NONE
**Done when**:
- [x] Diorama visible in `npm run dev`; no camera controls; `npm run build` passes
**Tests**: none | **Gate**: build
**Commit**: `feat(scene): fixed-camera diorama room`

### T5: toys.js — toy factory

**What**: `createToyMesh(type, color)` for `ball`/`block`/`plush` with composed primitives, `userData` with id/type.
**Where**: `src/toys.js`
**Depends on**: T4 | **Reuses**: three primitives | **Requirement**: GUARD-04 (visual)
**Tools**: MCP: `context7` | Skill: NONE
**Done when**:
- [x] 3 types visually distinguishable in a test scene; build passes
**Tests**: none | **Gate**: build
**Commit**: `feat(toys): low-poly toy factory`

### T6: boxes.js — basket, chest and bed

**What**: `createBoxes()` with mesh, `type`, generous `snapRadius` and placeholder plaques with solid-color fallback (structure ready to receive art in T12).
**Where**: `src/boxes.js`
**Depends on**: T4 | **Reuses**: T4 | **Requirement**: GUARD-02/03 (targets), GUARD-08 (structure)
**Tools**: MCP: `context7` | Skill: NONE
**Done when**:
- [x] 3 boxes positioned at the front of the diorama; texture fallback works; build passes
**Tests**: none | **Gate**: build
**Commit**: `feat(boxes): three target boxes with plaque slots`

### T7: drag.js — floor-plane dragging

**What**: Pointer Events (`pointerdown/move/up/cancel`, `setPointerCapture`), raycast to pick up a toy (closest hit), drag constrained to the floor plane with clamping to the room area, lift on pickup, 1 pointer at a time, `onDrop(toyId, posXZ)`.
**Where**: `src/drag.js`
**Depends on**: T4, T5 | **Reuses**: raycast/plane pattern (Context7) | **Requirement**: GUARD-01
**Tools**: MCP: `context7` | Skill: NONE
**Done when**:
- [x] Dragging works with the mouse in `npm run dev`; build passes (full behavior is gated in T8)
**Tests**: none (flow covered in T8's E2E) | **Gate**: build
**Commit**: `feat(drag): floor-plane pointer dragging`

### T8: Game↔scene integration + test hook + E2E scenario 01

**What**: `main.js` wires drag→game→scene: dropping near the right box → disappears (immediate placeholder), wrong box → returns to spawn, outside → settles. Exposes `window.__game` (`state()`, `screenPos()`, `seed()`). Writes and runs `e2e/scenarios/01-arrastar-e-guardar.md` (happy + wrong + outside + multi-touch, desktop and mobile-touch).
**Where**: `src/main.js`, `e2e/scenarios/01-arrastar-e-guardar.md`
**Depends on**: T2, T3, T6, T7 | **Reuses**: everything prior | **Requirement**: GUARD-01, GUARD-02, GUARD-03
**Tools**: MCP: `playwright` | Skill: NONE
**Done when**:
- [x] Scenario 01 run via Playwright MCP with all `__game.state()` asserts green + evidence screenshots
- [x] `npm run build && npm test` passes
**Tests**: e2e | **Gate**: full
**Commit**: `feat(main): wire drag to game logic with test hook + e2e scenario 01`

### T9: feedback.js — success/error tweens

**What**: Mini-tween (lerp+easing): fly to the box with a jump, bounce back, shake the box; replaces T8's placeholders.
**Where**: `src/feedback.js` (+ integration in `main.js`)
**Depends on**: T8 | **Reuses**: T8 | **Requirement**: GUARD-02, GUARD-03
**Tools**: MCP: NONE | Skill: NONE
**Done when**:
- [x] Animations visible and don't block the next drag; build passes; scenario 01 still green (re-run)
**Tests**: none (covered by the scenario 01 re-run) | **Gate**: full
**Commit**: `feat(feedback): store/reject tweens`

### T10: Round celebration + auto-advance + E2E scenario 02

**What**: Particle confetti (limited pool), big celebration on round completion, automatic advance ~4s, integration with persistence. Writes and runs `e2e/scenarios/02-rodada-completa.md` (completes a round with `seed()`, checks the celebration, 6→9 advance and resumption after reload).
**Where**: `src/feedback.js`, `src/main.js`, `e2e/scenarios/02-rodada-completa.md`
**Depends on**: T9 | **Reuses**: T3, T9 | **Requirement**: GUARD-04, GUARD-05, GUARD-06
**Tools**: MCP: `playwright` | Skill: NONE
**Done when**:
- [x] Scenario 02 green (including reload/persistence); `npm run build && npm test` passes
**Tests**: e2e | **Gate**: full
**Commit**: `feat(feedback): round celebration, auto-advance + e2e scenario 02`

### T11: Sound + start screen + E2E scenario 03

**What**: WebAudio with unlock on the start screen's play button, success sound and fanfare (free assets from kenney/freesound in `assets/sounds/`), tolerant silent mode. Writes and runs `e2e/scenarios/03-audio.md` (unlock, audio flag in `__game.state()`, game functional with audio blocked).
**Where**: `src/feedback.js`, `src/main.js`, `index.html`, `assets/sounds/`, `e2e/scenarios/03-audio.md`
**Depends on**: T10 | **Reuses**: T10 | **Requirement**: GUARD-09
**Tools**: MCP: `playwright`; WebSearch/WebFetch (download free sounds) | Skill: NONE
**Done when**:
- [x] Scenario 03 green; sounds play after play; no error when audio is blocked
**Tests**: e2e | **Gate**: full
**Commit**: `feat(audio): unlockable webaudio + start screen + e2e scenario 03`

### T12: Bluey assets + E2E scenario 04

**What**: Download and process (≤1024px) key art/characters from the media hub (`docs/references.md`) into `assets/bluey/`; apply them to the frames, plaques (Bluey/Bingo/Chilli) and Bluey's celebrating appearance (~2s per success). Writes and runs `e2e/scenarios/04-tema-e-fallback.md` (theme present; rename an asset → color fallback and game still functional).
**Where**: `assets/bluey/`, `src/scene.js`, `src/boxes.js`, `src/feedback.js`, `e2e/scenarios/04-tema-e-fallback.md`
**Depends on**: T10 | **Reuses**: T4/T6 fallbacks | **Requirement**: GUARD-08
**Tools**: MCP: `playwright`; WebFetch (media hub) | Skill: NONE
**Done when**:
- [x] Scenario 04 green in both modes (with assets and with fallback); AD-005 respected (assets kept out of any publication)
**Tests**: e2e | **Gate**: full
**Commit**: `feat(theme): official bluey art with solid-color fallback + e2e scenario 04`

### T13: Viewport robustness and edge cases + E2E scenario 05

**What**: Resize/rotation during a drag, working portrait mode, `pointercancel`/window exit, missing-WebGL detection with a static message. Writes and runs `e2e/scenarios/05-robustez.md` (resize mid-drag, portrait, pointercancel).
**Where**: `src/scene.js`, `src/drag.js`, `src/main.js`, `e2e/scenarios/05-robustez.md`
**Depends on**: T8 | **Reuses**: T4/T7 | **Requirement**: GUARD-07 + spec edge cases
**Tools**: MCP: `playwright` | Skill: NONE
**Done when**:
- [x] Scenario 05 green on desktop and mobile viewport; `npm run build && npm test` passes
**Tests**: e2e | **Gate**: full
**Commit**: `fix(viewport): resilient resize, cancel and portrait handling + e2e scenario 05`

### T14: Full E2E pass

**What**: Run ALL scenarios (01–05) in sequence, desktop and mobile-touch viewport, on a production build (`vite preview`); fix whatever breaks; record evidence (screenshots) and counts in the task report.
**Where**: `e2e/scenarios/*`, targeted fixes
**Depends on**: T11, T12, T13 | **Reuses**: everything | **Requirement**: all (GUARD-01..09)
**Tools**: MCP: `playwright` | Skill: NONE
**Done when**:
- [x] 5 scenarios green against `vite preview`; `npm run build && npm test` passes
**Tests**: e2e | **Gate**: full
**Commit**: `test(e2e): full prompt-guided pass on production build`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

Phase 1:  T1 ──→ T2 ──→ T3
Phase 2:  T4 ──→ T5 ──→ T6
Phase 3:  T7 ──→ T8
Phase 4:  T9 ──→ T10 ──→ T11 ──→ T12
Phase 5:  T13 ──→ T14
```

14 tasks → packaged into batches (~7 tasks, whole phases): **Batch 1** = P1+P2 (6 tasks),
**Batch 2** = P3+P4 (6 tasks), **Batch 3** = P5 (2 tasks) → offer of 3 sub-agents at Execute
(mandatory offer above 8 tasks; user decides). Automatic Verifier after T14.

---

## Task Granularity Check

| Task | Scope | Status |
|---|---|---|
| T1 | scaffold (1 coherent config set) | ✅ |
| T2 | 1 logic module + co-located tests | ✅ |
| T3 | extension of the same module + tests | ✅ |
| T4–T7 | 1 module each | ✅ |
| T8 | 1 composition file + 1 E2E scenario | ✅ (cohesive: integration is indivisible) |
| T9 | 1 module | ✅ |
| T10–T13 | 1 flow + 1 E2E scenario each | ✅ |
| T14 | suite run + fixes | ✅ |

## Diagram-Definition Cross-Check

| Task | Depends On (body) | Diagram | Status |
|---|---|---|---|
| T1 | None | P1 start | ✅ |
| T2 | T1 | T1→T2 | ✅ |
| T3 | T2 | T2→T3 | ✅ |
| T4 | T1 | P1→P2 (T4 is first in the phase) | ✅ |
| T5 | T4 | T4→T5 | ✅ |
| T6 | T4 | T5→T6 (phase order; real dependency T4, phase precedes T6's execution) | ✅ |
| T7 | T4, T5 | P2→P3 | ✅ |
| T8 | T2,T3,T6,T7 | T7→T8 (others in earlier phases) | ✅ |
| T9 | T8 | P3→P4 | ✅ |
| T10 | T9 | T9→T10 | ✅ |
| T11 | T10 | T10→T11 | ✅ |
| T12 | T10 | T11→T12 (phase order; real dependency T10) | ✅ |
| T13 | T8 | P4→P5 | ✅ |
| T14 | T11,T12,T13 | T13→T14 | ✅ |

No dependency points to a later phase. ✅

## Test Co-location Validation

| Task | Layer | Matrix requires | Task states | Status |
|---|---|---|---|---|
| T1 | config/scaffold | none | none | ✅ |
| T2 | game logic | unit | unit | ✅ |
| T3 | game logic | unit | unit | ✅ |
| T4–T6 | rendering | none | none | ✅ |
| T7 | rendering/input (module) | none | none (flow covered in T8's E2E, same batch/immediately following phase — forward merge allowed) | ✅ |
| T8 | integrated flow | e2e | e2e (scenario 01) | ✅ |
| T9 | rendering | none | none + re-run scenario 01 | ✅ |
| T10 | integrated flow | e2e | e2e (scenario 02) | ✅ |
| T11 | integrated flow | e2e | e2e (scenario 03) | ✅ |
| T12 | integrated flow | e2e | e2e (scenario 04) | ✅ |
| T13 | integrated flow | e2e | e2e (scenario 05) | ✅ |
| T14 | E2E suite | e2e | e2e (all) | ✅ |

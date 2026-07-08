# Camera Gestos Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.**

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: inline (Medium — architecture decisions recorded in the spec: `camera-controls`/yomotsu library, gesture map, opening handoff)
**Status**: In Progress

---

## Test Coverage Matrix

> Generated from codebase — guidelines found: **none** (no CLAUDE.md/AGENTS.md/CONTRIBUTING.md); patterns inferred from AD-004 (pure logic → Vitest; render → e2e) and AD-006 (prompt-driven e2e via Playwright MCP + `window.__game` hook).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Pure game logic (`game.js`, `transitions.js`) | unit | No changes in this feature; existing suite stays green | `src/*.test.js` | `npm test` |
| Render/camera code (`camera-controls.js`, `main.js`, `scene.js`) | e2e | Each spec AC becomes a step with an assert via `window.__game.state().camera`; happy path + edges listed | `e2e/scenarios/*.md` | Agent via Playwright MCP against `npm run dev` |
| Config / dependencies (`package.json`) | none | — (build gate only) | — | `npm run build` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tasks with unit only | `npm test` |
| Full | Tasks with e2e | `npm test` + e2e scenario via Playwright MCP (dev server) |
| Build | End of phase / tasks with no tests | `npm run build && npm test` |

---

## Execution Plan

### Phase 1: Base

```
T1 → T2
```

### Phase 2: Rebuild

```
T3 → T4
```

### Phase 3: Verification and memory

```
T5 → T6
```

---

## Task Breakdown

### T1: Commit the ad-hoc baseline (v1)

**What**: Commit the uncommitted working-tree work (v1 controls, toy glow/hit-area, opening with pull-back, updated e2e scenarios) as a baseline, so the feature's diff stays atomic.
**Where**: entire working tree (already-modified files)
**Depends on**: None
**Requirement**: — (history-hygiene prerequisite)
**Done when**:
- [ ] `git status` clean after commit
- [ ] Build gate passes: `npm run build && npm test`

**Tests**: none | **Gate**: build
**Commit**: `feat(game): baseline ad-hoc — v1 camera controls, toy glow/hit-area, opening with pull-back`

---

### T2: Add `camera-controls` dependency

**What**: `npm install camera-controls` (runtime dependency).
**Where**: `package.json`, `package-lock.json`
**Depends on**: T1
**Requirement**: CAMG-01
**Done when**:
- [ ] Dependency installed and lockfile updated
- [ ] `npm run build && npm test` passes

**Tests**: none | **Gate**: build
**Commit**: `build(camera): add camera-controls dependency`

---

### T3: Rewrite `src/camera-controls.js` on top of the library

**What**: Replace the custom implementation with a `CameraControls` (yomotsu) wrapper: `install({THREE})`, `touches.one/two/three` = ROTATE / DOLLY_TRUCK / TRUCK, `mouseButtons` left/right/middle = ROTATE / TRUCK / DOLLY, `dollyToCursor`, v1's distance/polar limits, `setBoundary` with the room's box, `draggingSmoothTime`/`smoothTime`. Exposed API: `{ enabled (get/set — set false kills the gesture), update(dt), setPose(position, target), getState() }`.
**Where**: `src/camera-controls.js` (full rewrite)
**Depends on**: T2
**Reuses**: v1's limit/bounds constants
**Requirement**: CAMG-01, CAMG-02, CAMG-03, CAMG-05 (gesture kill)
**Done when**:
- [ ] Zero custom gesture math in the file (all delegated to the library)
- [ ] Limits and boundary configured with v1's values
- [ ] `npm run build && npm test` passes

**Tests**: e2e (covered in T5 — render-coupled code; see matrix) | **Gate**: build
**Commit**: `feat(camera): rebuild controls on camera-controls lib (gestures by finger count + damping)`

---

### T4: Reintegrate into `main.js` + observable hook

**What**: `controls.update(dt)` in the animation loop; opening handoff (at the end of the lerp, `setPose` with the final pose and enable); interop with drag preserved (disable on pick, enable on drop); the `state().camera` hook now exposes `{ intro, gesturesEnabled, position, target, distance }` (2 decimal places).
**Where**: `src/main.js`
**Depends on**: T3
**Requirement**: CAMG-04, CAMG-05, CAMG-06
**Done when**:
- [ ] Opening ends with no visible camera jump (pose synced)
- [ ] Picking a toy disables gestures; drop re-enables them (outside the opening)
- [ ] Hook exposes the 5 fields
- [ ] `npm run build && npm test` passes

**Tests**: e2e (covered in T5) | **Gate**: build
**Commit**: `feat(camera): wire lib controls into game loop, intro handoff and test hook`

---

### T5: E2E scenario 06 + execution via Playwright MCP

**What**: New `e2e/scenarios/06-controles-camera.md` covering each AC (1-finger orbit, 2-finger pinch+pan, 3-finger pan, post-gesture settling, limits, mouse left/right/wheel, drag priority, opening handoff, gesture kill) with numeric asserts via `state().camera`; run the scenario against `npm run dev` with Playwright MCP and record the result.
**Where**: `e2e/scenarios/06-controles-camera.md`
**Depends on**: T4
**Requirement**: CAMG-01..CAMG-06
**Done when**:
- [ ] Each spec AC mapped to ≥1 step with a numeric assert
- [ ] Scenario run green via Playwright MCP (desktop 1280×800 + touch 390×844... landscape 844×390 if applicable)
- [ ] Full gate: `npm test` green + scenario green

**Tests**: e2e | **Gate**: full
**Commit**: `test(e2e): add camera gesture scenario 06 (touch by finger count + mouse)`

---

### T6: Traceability + STATE.md

**What**: spec.md → Verified status on the CAMG items; STATE.md: new decision AD-009 (manual gestural controls via `camera-controls`, supersedes AD-007 on the "child never controls the camera" part; the fullscreen part of `mobile-camera` remains pending) + updated Handoff.
**Where**: `.specs/features/camera-gestos/spec.md`, `.specs/STATE.md`
**Depends on**: T5
**Requirement**: — (memory)
**Done when**:
- [ ] Traceability updated; AD-009 recorded; Handoff reflects the delivery

**Tests**: none | **Gate**: none (docs)
**Commit**: `docs(specs): camera-gestos — traceability, AD-009, handoff`

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | 1 hygiene commit | ✅ Granular |
| T2 | 1 dependency | ✅ Granular |
| T3 | 1 file (rewrite) | ✅ Granular |
| T4 | 1 file (wiring) | ✅ Granular |
| T5 | 1 scenario + execution | ✅ Granular |
| T6 | 2 docs | ✅ Granular (cohesive) |

## Diagram-Definition Cross-Check

| Task | Depends On (body) | Diagram Shows | Status |
| ---- | ----------------- | ------------- | ------ |
| T1 | None | start | ✅ Match |
| T2 | T1 | T1→T2 | ✅ Match |
| T3 | T2 | T2→T3 | ✅ Match |
| T4 | T3 | T3→T4 | ✅ Match |
| T5 | T4 | T4→T5 | ✅ Match |
| T6 | T5 | T5→T6 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
| ---- | ---------- | --------------- | --------- | ------ |
| T1 | baseline (mixed, already written) | — | none/build | ✅ OK |
| T2 | config/deps | none | none/build | ✅ OK |
| T3 | render/camera | e2e | e2e via T5* | ✅ OK* |
| T4 | render/camera | e2e | e2e via T5* | ✅ OK* |
| T5 | e2e | e2e | e2e | ✅ OK |
| T6 | docs | — | none | ✅ OK |

\* Legitimate forward merge (skill's compile-dependency rule): T3/T4's e2e is only executable once wiring is complete + the scenario exists; T5 is the earliest task where the tests run, and T3/T4 are not marked Verified until T5 passes. There is no unit layer for render-coupled code (AD-004).

**Tools per task**: MCP `context7` (research completed), MCP `playwright` (T5); Skills: `tlc-spec-driven` (all), `threejs-interaction` if needed in T3.

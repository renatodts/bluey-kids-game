# "Hora de Guardar!" Validation

**Date**: 2026-07-08
**Spec**: `.specs/features/hora-de-guardar/spec.md`
**Diff range**: `5d12769..HEAD` (`61947ac`) — feature = entire repository post-scaffold
**Verifier**: independent sub-agent (author ≠ verifier); coverage re-derived from the spec, evidence-or-zero
**Method**: independent reading of code/tests + real re-execution of the gates + live E2E spot-check via Playwright MCP (own dev server, port 5199) + 3 discrimination-sensor mutations on disposable state (reverted with `git restore`)

---

## Task Completion

| Task | Status | Notes |
|---|---|---|
| T1–T14 | ✅ Done | tasks.md marks all "Done when" items as [x]; commits match 1:1 with the messages planned in the `5d12769..61947ac` range |

---

## Spec-Anchored Acceptance Criteria

Unit evidence = `src/game.test.js` (file:line + assert). Flow evidence = E2E scenario (file/step) **+ live re-execution by the Verifier** (observed values noted). All state fields were asserted on VALUE (round, per-type counts, phase, audio/theme flags), not just on being called.

### P1: Drag and put away (GUARD-01/02/03)

| Criterion | Spec-defined outcome | Evidence | Result |
|---|---|---|---|
| GUARD-01.1 touch a toy → lifts and follows the pointer on the floor plane | toy `dragging`, follows the pointer | `e2e/scenarios/01`:step 4; **live**: mid-drag `state === 'dragging'` (t1, ball); code `src/drag.js:44-68` (raycast + plane + `DRAG_LIFT`) | ✅ PASS |
| GUARD-01.5 second finger during a drag is ignored | 2nd toy stays `idle`; 1st stays `dragging` | unit `src/game.test.js:107-109` — `expect(game.pickToy(toys[1].id)).toBe(false)` + state `'idle'`; `e2e/01`:steps 5 and 12; **live**: 2nd pointerdown (pointerId 2, touch) → `{other:'idle', dragged:'dragging'}` | ✅ PASS |
| GUARD-02 dropped on box of the SAME type → absorbed with jump animation | returns `'stored'`, toy `stored` | unit `src/game.test.js:72-74` — `expect(game.tryStore(ball.id,'ball')).toBe('stored')` + `after.state === 'stored'`; `e2e/01`:steps 6/11; **live**: ball → basket = `stored`, others `idle`. Animation (jump tween): `src/feedback.js:242-265`, visual evidence (screenshot) — the state outcome is the assert | ✅ PASS |
| GUARD-03 box of a DIFFERENT type → shakes the box, returns bouncing, no negative sound | returns `'rejected'`, toy goes back to `idle`, returns to spawn | unit `src/game.test.js:85-87` — `expect(game.tryStore(ball.id,'block')).toBe('rejected')` + `'idle'`; `e2e/01`:step 7 (spawn ±10px); **live**: block → basket = `idle`, `returnedToSpawn = 0px`. No negative sound: the only sound trigger is success/fanfare (`src/feedback.js:147-158`) | ✅ PASS |
| GUARD-03 outside any box → settles gently where dropped | toy `idle`, position ≈ drop point (not spawn) | unit `src/game.test.js:90-99` — `dropToy` `dragging → idle`; `e2e/01`:step 8 (±25px); **live**: plush dropped in empty space = `idle`, `distFromDropPoint = 18px`, `distFromSpawn = 602px` | ✅ PASS |

### P1: Rounds and progression (GUARD-04/05/06)

| Criterion | Spec-defined outcome | Evidence | Result |
|---|---|---|---|
| GUARD-04 round scatters N (1→6, 2→9, 3+→12) in equal amounts, varied color/position | exact counts 6/9/12, balanced by type | unit `src/game.test.js:14-15` — `toHaveLength(6)` + `toEqual({ball:2,block:2,plush:2})`; `:19-24` — `toyCountForRound(1..50)` = 6/9/12/12/12/12; `:43-57` — matching seeds reproduce, different seeds vary; **live**: round 1 = 6 (2/2/2), round 2 = 9 (3/3/3) | ✅ PASS |
| GUARD-04 "scatter" (positions) | spec defines no numeric bounds | unit `src/game.test.js:34-39` asserts against `FLOOR_BOUNDS` (same area as the drag clamp) — precision gap already flagged in a comment within the test itself (`:34-35`) | ⚠️ Spec-precision gap (flagged, mitigated) |
| GUARD-05 last toy put away → big celebration + automatic next round ~4s | `phase === 'celebrating'`; after ~4s round+1 starts `playing` | unit `src/game.test.js:147-160` — second-to-last: `phase === 'playing'`, last: `'celebrating'`; `src/main.js:150-156` — `setTimeout(…, 4000)`; `e2e/02`:steps 3-4; **live**: 6/6 `stored` → `phase 'celebrating'`; after 4.5s → `round 2`, 9 toys, all `idle`, `phase 'playing'` | ✅ PASS |
| GUARD-06 round end persists next round to localStorage | key `hora-de-guardar:round` = `'2'`, `'3'`… | unit `src/game.test.js:219-222` — `expect(storage.getItem('hora-de-guardar:round')).toBe('2')` and `'3'`; **live**: `localStorage['hora-de-guardar:round'] === '2'` after round 1 | ✅ PASS |
| GUARD-06 opens with saved progress → starts at the saved round; unavailable/invalid storage → round 1 | `currentRound === 2` (saved); invalid → 1 | unit `src/game.test.js:225-232` (saved `'2'` → round 2, 9 toys); `:239-244` (`'abc','','0','-3','2.5','NaN'` → 1); `:246-250` (getItem throws → 1, plays normally); `:252-257` (setItem throws → advances without breaking); `:234-237`, `:259-262` (no storage); **live**: reload without clearing → `round 2`, 9 toys | ✅ PASS |

### P1: Touch-first diorama (GUARD-07)

| Criterion | Spec-defined outcome | Evidence | Result |
|---|---|---|---|
| GUARD-07.1 diorama with fixed camera, no orbit/zoom | scene visible; no camera controls | `src/scene.js:67-114` — `PerspectiveCamera` positioned in `onResize()`, no OrbitControls in the repo (`grep` clean); evidence screenshot | ✅ PASS |
| GUARD-07.2 resize/orientation → readjusts renderer/camera, in-progress drag keeps working | mid-resize toy stays `dragging`; final drop `stored` | `e2e/05`:step 2; **live**: pointerdown+3 moves → `browser_resize` 1280×800→900×900 with an active drag → `midResize: 'dragging'` → continues with `screenPos` recalculated → `final: 'stored'` | ✅ PASS |
| GUARD-07.3 touch and mouse with the same behavior (Pointer Events) | same `stored` flow in both | `src/drag.js:95-99` — single `pointer*` listeners; `e2e/01` Part A (mouse) / Part B (touch); **live**: portrait 390×844 `pointerType:'touch'` → `stored` | ✅ PASS |

### P2: Festive feedback and Bluey theme (GUARD-08)

| Criterion | Spec-defined outcome | Evidence | Result |
|---|---|---|---|
| GUARD-08.1 success → confetti at the box + Bluey celebrates ~2s | `cheerVisible` true right after, false after ~2s | `src/feedback.js:262-284` — `confetti.burst` + `showCheer` (2.2s tween); `e2e/04`:step 2; **live**: post-success `cheerVisible === true`, after 2.5s `=== false` | ✅ PASS |
| GUARD-08.2 round end → big celebration: characters, confetti rain and fanfare | confetti + fanfare + visible character | `src/feedback.js:288-292` — `rain(3)` + box pulse + `fanfare()`; **live**: `soundsPlayed` 6→7 at round end (6 chimes + 1 fanfare); Bluey from the last success visible during the celebration. "Characters" (plural) has no dedicated appearance beyond the cheer Bluey — spec doesn't define which/how many | ⚠️ Spec-precision gap (flagged) |
| GUARD-08.3 scene sets up with key art in frames + plaques per box | `framesLoaded === 3`, `plaquesLoaded === 3`, `cheerLoaded === true` | `src/scene.js:39-65` (frames), `src/boxes.js` (plaques), `src/feedback.js:163-178` (cheer); `e2e/04`:step 1; **live**: `{framesLoaded:3, plaquesLoaded:3, cheerLoaded:true}` | ✅ PASS |
| GUARD-08.4 asset fails → solid-color fallback, game stays playable | theme flags at 0/false, `console.warn`, game functional | `src/scene.js:23-36` — fallback IS the initial state, `onError → console.warn`; `e2e/04` Part B; **live** (assets renamed and restored): `{framesLoaded:0, plaquesLoaded:0, cheerLoaded:false}` + 7× `console.warn "art unavailable"` + success `stored` + fallback cheer `cheerVisible:true` | ✅ PASS |

### P2: Sound (GUARD-09)

| Criterion | Spec-defined outcome | Evidence | Result |
|---|---|---|---|
| GUARD-09.1 first tap (play button) unlocks WebAudio | before: `unlocked false`; after the real click: `true` | `src/main.js:39-43` + `src/feedback.js:109-120`; `e2e/03`:steps 1-2; **live** (real browser_click): before `{unlocked:false, soundsPlayed:0}`, after `{unlocked:true}` | ✅ PASS |
| GUARD-09.2 success → short sound; round end → fanfare | `soundsPlayed` increments per success; +1 fanfare at the end | `src/feedback.js:147-158` (chime/fanfare via `safePlay`, only counts with `running` ctx); `e2e/03`:step 3 (`>= 1`); **live**: 1st success → `soundsPlayed === 1`; round complete (6 successes) → `soundsPlayed === 7` (6 chimes + 1 fanfare) | ✅ PASS |
| GUARD-09.3 audio doesn't unlock → functional in silence | `unlocked false`, `soundsPlayed 0`, game plays normally | `src/feedback.js:116-118` (catch → muted), `:137` (guard `ctx.state !== 'running'`); `e2e/03` Part B; **live** (AudioContext removed before play): `{unlocked:false}`, success `stored`, `soundsPlayed === 0`, zero console errors | ✅ PASS |

**Status**: ✅ All ACs covered with matching outcomes — 2 spec-precision gaps flagged (not implementation failures; the spec doesn't define the precise value).

---

## Edge Cases (spec.md)

- [x] Pointer leaves the window during a drag → released as "outside" — `src/drag.js:79-93` (`pointercancel`/`pointerleave` → `endDrag` with no screen parallax); **live**: mid-drag `pointercancel` → `'idle'`, next repick works (`'dragging'`)
- [x] Overlapping toys → picks the one closest to the camera — `src/drag.js:49-51` (`hits[0]` from the raycast = first hit); operational convention of the E2E scenarios ("the dragged one is whichever reports `dragging`")
- [x] `localStorage` throws an exception (private mode) → continues without persistence — unit `src/game.test.js:246-257`; `src/main.js:51-57` (`window.localStorage` access wrapped in try/catch)
- [x] WebGL unavailable → simple static message — `src/main.js:15-37`; **live** (`#nowebgl` + reload): `#webgl-error` present and visible, `window.__game === undefined`, play overlay removed

---

## Discrimination Sensor

Disposable state: mutation via `sed` in the working tree + `git restore src/game.js` after each round; `git status` clean at the end (verified).

| Mutation | File:line | Description | Killed? |
|---|---|---|---|
| 1 | `src/game.js:112` | Inverted the matching condition in `tryStore`: `toy.type === boxType` → `!==` | ✅ Killed (6 failed / 24) |
| 2 | `src/game.js:17` | Changed the 6/9/12 sequence: `round === 2` returns 12 instead of 9 | ✅ Killed (4 failed / 24) |
| 3 | `src/game.js:128` | Removed persistence from `advanceRound` (commented out `writeSavedRound`) | ✅ Killed (1 failed / 24) |

**Sensor depth**: lightweight (standard feature, 3 mutations on the highest-risk code)
**Result**: 3/3 killed — PASS ✅

---

## Gate Check

- **Gate commands** (tasks.md, Build/Full level): `npm test` and `npm run build`
- **`npm test`**: exit 0 — 1 file, **24 passed, 0 failed, 0 skipped** (matches the 24 expected)
- **`npm run build`**: exit 0 (non-blocking warning about a chunk > 500 kB — the whole three.js in one bundle; irrelevant for a local app)
- **Test count before feature**: 0 (greenfield — T1 "npm test runs (0 tests)")
- **Test count after**: 24 → **delta +24**; no removal/weakening possible (there were no prior tests)
- **E2E (AD-006, prompt-guided)**: independent spot-check re-executed by the Verifier via Playwright MCP against `npm run dev` (port 5199), covering the core asserts of scenarios 01, 02, 03 (A+B), 04 (A+B with asset rename/restore) and 05 (resize mid-drag, portrait touch, pointercancel, `#nowebgl`) — all observed values match the spec's expected outcomes (table above). Console clean except for a favicon 404 and the expected warnings from scenario 04 Part B.

---

## Code Quality

| Principle | Status |
|---|---|
| Minimum code / no scope creep | ✅ (modules match the design 1:1; no feature beyond the spec) |
| Surgical changes / matches patterns | ✅ |
| Spec-anchored outcome check (asserted values = spec outcome) | ✅ (2 spec-precision gaps flagged, not silenced) |
| Per-layer Coverage Expectation (tasks.md matrix) | ✅ pure logic 1:1 with ACs in unit tests; rendering via build gate; flows via happy+edge+failure E2E |
| Every test maps to an AC/edge case/Done-when (no unclaimed) | ✅ 24 tests: describes named by GUARD-xx; state machine = the spec's "State-transition integrity" dimension; `getState` copy test = the hook's contract in design.md |
| Payload fields asserted on value (not just call) | ✅ (round, length, per-type counts, phase, unlocked, soundsPlayed, framesLoaded/plaquesLoaded/cheerLoaded/cheerVisible) |
| Project guidelines | none — strong defaults applied (no guideline file in the repo) |
| Spec deviations flagged | ✅ `src/feedback.js:4` — `// SPEC_DEVIATION`: synthesized sounds (WebAudio oscillators) instead of kenney/freesound files; reason recorded (zero asset dependency, the design already anticipated direct WebAudio). tasks.md T11 mentions assets in `assets/sounds/` — the divergence is properly flagged in the code |

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
|---|---|---|
| GUARD-01 | Implemented | ✅ Verified |
| GUARD-02 | Implemented | ✅ Verified |
| GUARD-03 | Implemented | ✅ Verified |
| GUARD-04 | Implemented | ✅ Verified (1 spec-precision gap flagged) |
| GUARD-05 | Implemented | ✅ Verified |
| GUARD-06 | Implemented | ✅ Verified |
| GUARD-07 | Implemented | ✅ Verified |
| GUARD-08 | Implemented | ✅ Verified (1 spec-precision gap flagged in 08.2) |
| GUARD-09 | Implemented | ✅ Verified |

(Updating spec.md is up to the orchestrator — the Verifier is read-only outside this file.)

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 17/17 AC outcomes matching the spec; 2 spec-precision gaps flagged:
1. GUARD-04 "scatter" with no numeric bounds in the spec — the test asserts against `FLOOR_BOUNDS` (reasonable, already self-flagged in the test)
2. GUARD-08.2 "characters" (plural) in the big celebration — the implementation shows confetti+fanfare+Bluey (cheer from the last success); the spec doesn't define which/how many characters

**Sensor**: 3/3 mutations killed
**Gate**: `npm test` 24/24 (exit 0); `npm run build` exit 0
**Working tree**: clean after the sensor and the asset rename (verified with `git status`)

**What works**: core dragging (mouse+touch), matching, rejection with return to spawn, settling outside, multi-touch ignored, 6→9→12→12 progression, tolerant persistence, resize mid-drag, portrait mode, pointercancel, theme with full fallback, audio with unlock and tolerant silence, WebGL fallback.

**Issues found**: none blocking. The 2 spec-precision gaps are spec wording issues, not implementation issues — optional: make the spec more precise (spawn bounds; definition of "characters" in the celebration).

**Next steps**: no fix needed; feature ready for acceptance/interactive UAT with the child (family Success Criteria are inherently manual).

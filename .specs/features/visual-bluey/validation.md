# Visual Bluey Validation

**Date**: 2026-07-08
**Spec**: `.specs/features/visual-bluey/spec.md`
**Diff range**: `f11c1e6..8f616d8` (11 commits, `5c77f0f`..`8f616d8`)
**Verifier**: independent sub-agent (author ≠ verifier); evidence re-derived from code, gates run locally; E2E evidence from the orchestrator's Playwright MCP run of 2026-07-08 against `vite preview` (build `8f616d8`), sanity-checked against the code

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 `materials.js` | ✅ Done | `src/materials.js` — 3-band `GRADIENT_MAP` + `toonMaterial()` |
| T2 `room.js` | ✅ Done | sofa, rug, window+backyard, side table; `ROOM_CLEARANCE` exported |
| T3 room+shadows+light in `scene.js` | ✅ Done | PCFSoftShadowMap, warm sun `0xffd38a`, `createRoom()` integrated |
| T4 `boxes.js` → toon | ✅ Done | zero remaining `Lambert` in `src/` (grep = 0) |
| T5 `toys.js` → toon | ✅ Done | same |
| T6 Procedural Bluey | ✅ Done | idle/cheer/dance state machine in `src/bluey.js` |
| T7 GLTF + fallback | ✅ Done* | *the successful GLTF branch not exercised: `assets/bluey/bluey.glb` absent (user hasn't downloaded it yet); deferral documented in T7/design.md — the AD-008 fallback is the expected outcome and was validated |
| T8 wiring Bluey + removing 2D cheer | ✅ Done | `bluey: {source, mode}` hook; `createCheer`/`cheerLoaded` removed |
| T9 `transitions.js` + overlay | ✅ Done | 4 new unit tests; `#transition-overlay` overlay in `index.html` |
| T10 wiring transitions + input gate | ✅ Done | `isBlocked` in `drag.js`; `transition` hook |
| T11 E2E review (02 and 04) | ✅ Done | scenarios rewritten and run green on 2026-07-08 |

Note: the working tree contains a pre-existing uncommitted modification to `tasks.md` (checkboxes T9–T11 marked by the implementer) — prior to this validation, preserved intact.

---

## Spec-Anchored Acceptance Criteria (P1 — VIS-01..VIS-07)

Layers per the Test Coverage Matrix (`tasks.md`): rendering modules = build gate + E2E; `transitions.js` = unit (Vitest); flows = prompt-guided E2E (AD-006).

### P1: Heeler living room (VIS-01, VIS-02)

| Criterion | Spec-defined outcome | Evidence | Result |
| --------- | -------------------- | -------- | ------ |
| Room-1: scene loads → sofa, rug, window w/ sunny backyard, floor/walls in warm palette | Minimum furniture present; "tones defined in the design" | `src/room.js:26-52` (sofa), `:54-79` (rug), `:81-108` (window+backyard+sun), `:110-121` (table); `src/scene.js:91-106` (floor `#d9a066` orange, wall `#f7e8c9` cream); build gate OK; E2E screenshot `e2e-04-tema.jpeg` | ✅ PASS / ⚠️ see precision note below |
| Room-2: all environment+toy materials in toon 2–4 bands | Replace flat Lambert | `src/materials.js:4-13` — `Uint8Array([80,170,255])` = 3 bands + `MeshToonMaterial`; `grep -rn Lambert src/` = 0 occurrences; `toonMaterial` imported in `scene/room/boxes/toys/bluey` | ✅ PASS |
| Room-3: soft shadows active, warm directional light, furniture (toys, Bluey) cast shadow | shadow map + castShadow | `src/scene.js:75-76` (`shadowMap.enabled`, `PCFSoftShadowMap`), `:79-89` (sun `0xffd38a`, `castShadow`, frustum = ROOM), `:97` (`floor.receiveShadow`); `src/toys.js:62` and `src/bluey.js:12-19` (`markShadows` → `castShadow` on all meshes) | ✅ PASS |
| Room-4: texture fails → solid color kept, game playable (GUARD-08.4) | `framesLoaded/plaquesLoaded` 0, warn, playable | `src/scene.js:23-36` (`applyArtTexture` unchanged — fallback IS the initial state); E2E 04 Part B: `framesLoaded 0`, `plaquesLoaded 0`, `console.warn` per asset, toy `'stored'` | ✅ PASS |
| Room-5: furniture clear of drag routes | No furniture between spawns and boxes | Code inspection: `FLOOR_BOUNDS {x:±6, z:-2.5..4}` (`src/game.js:6`), boxes at `z=5` (`src/boxes.js:80-86`); sofa at `z≈-3.05` (behind minZ), table at `x=6.55` (outside maxX), rug is flat (`y+0.015`); E2E 02: 6/6 toys dragged and stored with no occlusion | ✅ PASS |

### P1: Bluey in the scene (VIS-03, VIS-04, VIS-05)

| Criterion | Spec-defined outcome | Evidence | Result |
| --------- | -------------------- | -------- | ------ |
| Bluey-1: game starts → Bluey visible in the corner with continuous idle | cheering position + idle bob | `src/main.js:72-76` (`cornerPosition (5.8, floorY, -2.1)`); `src/bluey.js:157` (initial `mode='idle'`), `:229-234` (continuous bob/breathing); E2E 04-A: `bluey.mode === 'idle'` at start; screenshot | ✅ PASS |
| Bluey-2: correct match → celebration ≤ 2 s and return to idle | short cheer, back to idle | `src/feedback.js:243` (`stored()` → `bluey.cheer()`); `src/bluey.js:10` (`CHEER_DURATION = 1.6` ≤ 2 s), `:209-214` (auto-return to `'idle'`); E2E 04: `mode 'cheer'` after correct match → `'idle'` within ~2.5 s of observation | ✅ PASS |
| Bluey-3: round complete → dances in center; returns to corner on new round | move + dance + return | `src/feedback.js:250` (`danceAt(center, 3)`); `src/bluey.js:245-251` (`moveTo(center)`), `:225` (`danceDuration<=0 → returnToCorner()`), `:253-261`; E2E 02: `mode 'dance'` during celebration; round 2 with `mode 'idle'` | ✅ PASS |
| Bluey-4: GLTF available → used; failure/absent → procedural; hook reports `bluey.source` `'gltf'|'procedural'` | fallback + exact hook | `src/bluey.js:135-143` (try GLTF → `source:'gltf'`; catch → `console.warn` + procedural `source:'procedural'`); `src/main.js:207` (`bluey: {source, mode}` hook); E2E 04-A/B: `source === 'procedural'` (glb absent — AD-008, expected outcome) + warn. `'gltf'` branch implemented but not exercisable (asset absent; deferral documented T7) | ✅ PASS (gltf branch: documented, non-blocking gap) |
| Bluey-5: Bluey ignored by raycast; animation never blocks input | never intercepts touch | `src/drag.js:51` (`raycaster.intersectObjects(toys, ...)` — only the `toys` array); `src/main.js:81-93` (`toyMeshes` receives only toys; Bluey added directly to `scene`, `bluey.js:152`); animation via `bluey.update(dt)` in the rAF loop (`main.js:234`) — no input path passes through Bluey | ✅ PASS |
| Bluey-6: re-entrant cheer without inconsistent state | idle → cheer → idle; clean restart | `src/bluey.js:237-243` (`cheer()` unconditionally resets `modeTime/cheerTime/danceDuration` — a second call restarts it); closed state machine in `pose()` (`:197-235`); E2E: cheer triggered and completed; no unit test (rendering layer, per matrix) | ✅ PASS (via code inspection + E2E, per matrix) |

### P1: Transitions (VIS-06, VIS-07)

| Criterion | Spec-defined outcome | Evidence | Result |
| --------- | -------------------- | -------- | ------ |
| Trans-1: play → opening iris, 0.8–2.5 s | duration within range | `src/transitions.js:10` (`IRIS_DURATION_MS = 1200` ∈ [800, 2500]); `src/main.js:43-49` (play → `transitions.open()`); unit `src/transitions.test.js:25-42` (`expect(t.state).toBe('opening')` → `toBe('none')`); E2E 02: `'opening'` → `'none'` ≤ 1.5 s | ✅ PASS |
| Trans-2: celebration ends → iris closes → swap → iris opens; new toys never appear without a transition | close → spawn → open | `src/main.js:167-175` (`transitions.close().then(() => { advanceRound(); spawnRound(); transitions.open(); })` — spawn only while the iris is closed); unit `:45-59` (close enters `'closing'` → `'none'`); E2E 02: sequence recorded via rAF `['none','closing','opening','none']` | ✅ PASS |
| Trans-3: active transition → drag ignored; end → input returns immediately | binary gate on state | `src/drag.js:46` (`if (isBlocked()) return;` on pointerdown); `src/main.js:196` (`isBlocked: () => transitions.isBlocking()`); `src/transitions.js:47-49` (`isBlocking() = state !== 'none'`, state resets in `finished.then`); unit `:34,41` (`expect(t.isBlocking()).toBe(true/false)`); E2E 02: pointerdown+move during `'closing'` → no `'dragging'` | ✅ PASS |
| Trans-4: hook exposes `transition: 'none'|'opening'|'closing'` | exact values | `src/main.js:208` (`transition: transitions.state`); unit `:29,33,50,57` assert the three exact literals (`'none'`, `'opening'`, `'closing'`); E2E consumed the hook with those values | ✅ PASS |
| Trans-5: coinciding conditions → never two overlapping transitions, deterministic | 1 animation; extra call returns the in-progress one | `src/transitions.js:14,20` (`activePromise` guard); unit `:63-79` — `expect(second).toBe(first)`, `expect(third).toBe(first)`, `expect(overlay.animations).toHaveLength(1)`; reopening after completion covered in `:82-96` (`toHaveLength(2)`) | ✅ PASS |

**Payload/conjunction rule**: `transitions.js` tests assert state values (exact literals), `isBlocking()` booleans, Promise identity **and** the actual count of started animations (`overlay.animations.toHaveLength(1|2)`) — not just that a call occurred. ✅

### VIS-08 (P2) / VIS-09 (P3) — out of scope for this delivery

Confirmed by the spec (traceability table: VIS-08 = P2 Celebration, VIS-09 = P3 Bingo) and by `tasks.md`: no task T1–T11 maps to VIS-08/09 (the Requirement column covers only VIS-01..07). The confetti content pre-exists from the `hora-de-guardar` feature (`src/feedback.js`, fixed pool of 150 — GUARD-05/08), but the P2 ACs (formal palette/cleanup) and P3 (Bingo) remain **Pending**, correctly not claimed in this delivery.

**Status**: ✅ 16/16 P1 ACs covered — 1 spec-precision gap flagged (below)

**⚠️ Spec-precision gap (non-blocking)**: Room-1 says "warm palette ... defined in the design," but `design.md` does not define an explicit color/hex table — the values only exist in the code (`#d9a066`, `#f7e8c9`, `#f2a65a`, `#4fa9e0`, ...). The visual outcome was validated via E2E screenshot, but the spec doesn't pin verifiable values. Recommendation: record the palette in design.md (or relax the AC wording).

---

## Discrimination Sensor

Run on a scratch state: mutation via `sed` in `src/transitions.js` (no own uncommitted changes) → `npm test` → `git checkout -- src/transitions.js` after each. Tree verified pristine at the end (`git status --porcelain` = only the implementer's pre-existing `tasks.md` modification + this `validation.md`).

| Mutation | File:line | Description | Killed? |
| -------- | --------- | ----------- | ------- |
| A | `src/transitions.js:48` | `isBlocking()` now always returns `false` | ✅ Killed (2 failed / 26 passed) |
| B | `src/transitions.js:30` | Removed `state = 'none'` at the end of the animation (state never resets) | ✅ Killed (4 failed / 24 passed) |
| C | `src/transitions.js:20` | Removed the non-overlap guard (`if (activePromise) return activePromise`) | ✅ Killed (1 failed / 27 passed) |

**Sensor depth**: lightweight (3 behavioral mutations, highest-risk new code)
**Result**: 3/3 killed — PASS ✅

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code (no features beyond what was requested) | ✅ |
| Surgical changes (15 files, all within task scope) | ✅ |
| No scope creep (VIS-08/09 not prematurely implemented) | ✅ |
| Matches patterns (`markShadows`, mini-tween from `feedback.js` reused in `bluey.js`, `applyArtTexture`-style fallback) | ✅ |
| Spec-anchored outcome check | ✅ (1 ⚠️ precision gap flagged, VIS-01.1 palette) |
| Per-layer Coverage Expectation (`tasks.md` matrix) | ✅ — `transitions.js` unit 1:1 with VIS-06/07; rendering = build gate + E2E; flows = scenarios 02/04 |
| Every test maps to an AC (no orphan tests) | ✅ — 4 new tests annotated with VIS-06.x/07.x in the file itself |
| Documented guidelines | none in the repo — AD-004 convention from the `hora-de-guardar` precedent followed |

**Documented SPEC_DEVIATIONS** (both justified in a comment, no AC impact):
- `index.html:33` — overlay with `z-index:5` instead of the `30` foreseen in the design (needs to stay under the start-overlay/WebGL-error overlay). Correct: the opaque iris must not cover the play button.
- `src/feedback.js:4` — pre-existing (`hora-de-guardar`), not from this feature.
- Minor design↔code divergence: design.md anticipated `themeStatus.blueySource`; implemented as `bluey.source` in the hook — which is exactly what the **spec** (VIS-04) requires. Spec wins; no action needed.

---

## Edge Cases

- [x] GLTF with no embedded animations → `pose()`/`update(dt)` unconditionally apply procedural bob/squash (`src/bluey.js:197-235`); GLTF clips are ignored by design
- [x] Environment texture fails → solid color (`applyArtTexture` pattern unchanged, `src/scene.js:23-36`; E2E 04-B)
- [x] Tab sleeps during a transition → iris is WAAPI (browser completes `anim.finished` on its own); dt clamp preserved for 3D animations (`src/main.js:231`)
- [x] WebGL unavailable → `#transition-overlay` removed before the static message; no transition runs (`src/main.js:27-41`)

---

## Gate Check

- **Gate commands**: `npm test` (Vitest) and `npm run build` — run locally by this Verifier on 2026-07-08
- **`npm test`**: exit 0 — 28 passed, 0 failed, 0 skipped (2 files: `game.test.js`, `transitions.test.js`)
- **`npm run build`**: exit 0 (chunk >500 kB warning — informational, non-blocking)
- **Test count before feature**: 24 (`git show f11c1e6:src/game.test.js` — 24 `it(`)
- **Test count after feature**: 28
- **Delta**: +4 new (all in `src/transitions.test.js`; no test deleted/weakened — `game.test.js` untouched in the range)
- **E2E (external evidence, orchestrator, Playwright MCP, 2026-07-08)**: scenarios 02 and 04 green against the `vite preview` of build `8f616d8`; console clean except for a favicon 404 (+ expected 404s in Part B); screenshots captured. Scenario asserts checked against the code — consistent.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| VIS-01 | Pending | ✅ Verified |
| VIS-02 | Pending | ✅ Verified |
| VIS-03 | Pending | ✅ Verified |
| VIS-04 | Pending | ✅ Verified (successful GLTF branch pending the asset — re-run once `bluey.glb` arrives) |
| VIS-05 | Pending | ✅ Verified |
| VIS-06 | Pending | ✅ Verified |
| VIS-07 | Pending | ✅ Verified |
| VIS-08 (P2) | Pending | Pending (out of scope for this delivery) |
| VIS-09 (P3) | Pending | Pending (out of scope for this delivery) |

(This Verifier did not edit `spec.md`; the table above is the recommended update.)

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 16/16 P1 ACs with evidence; 1 spec-precision gap flagged (VIS-01.1 — palette with no values in the design)
**Sensor**: 3/3 mutations killed
**Gate**: `npm test` 28/28 (exit 0); `npm run build` exit 0

**What works**: toon-shaded Heeler living room with shadows and warm light; procedural Bluey with an idle/cheer/dance state machine and GLTF fallback; DOM iris transitions with an input gate, deterministic hook, and non-overlap guard (empirically discriminated by the sensor); zero regression in `hora-de-guardar` (24 original tests green; full E2E flow green).

**Issues found (non-blocking)**:
1. ⚠️ VIS-01.1: the palette "defined in the design" doesn't exist as values in `design.md` — record the palette there (or adjust the AC wording).
2. 📌 VIS-04: the `source === 'gltf'` branch not exercised (asset absent, pending the user; deferral documented in T7/design.md); revalidate once `assets/bluey/bluey.glb` is downloaded.

**Lessons**: there is signal (1 spec-precision gap + 1 z-index SPEC_DEVIATION) — lesson NOT recorded via `lessons.py` due to an orchestrator constraint (the only authorized write is this file); flagged in chat for the orchestrator to record.

**Next steps**: update statuses in `spec.md` (table above); record a lesson about "spec delegates values to the design → the design must pin them"; revalidate the GLTF branch once the asset arrives.

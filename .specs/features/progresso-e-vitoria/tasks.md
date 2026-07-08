# Progress and Victory — Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/progresso-e-vitoria/design.md`
**Status**: In Progress

**Baseline note (user decision, 2026-07-08):** the working tree contains uncommitted
work from the camera feature (camera-controls + opening pull-back in
`main.js`/`scene.js`/`drag.js`/`toys.js` + E2E scenarios). The user chose to "carry it
forward": the commits for tasks touching these files will also include those
pre-existing changes. `glow-*.png` and `assets/bluey/bluey.glb` stay out of the commits.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec — guidelines found: `.specs/STATE.md` AD-004 (pure logic tested with Vitest; rendering validated via E2E/manual) and AD-006 (prompt-guided E2E via Playwright MCP over `e2e/scenarios/*.md` + `window.__game` hook).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------- | --------------------- | ----------------- | ------------ |
| Pure logic (`game.js`) | unit | All new branches; 1:1 with ACs WIN-05/07 and the logic of WIN-02/03/09; all listed storage edge cases | `src/game.test.js` | `npm test` |
| DOM controller with injected elements (`hud.js`) | unit (mocked elements, `transitions.test.js` pattern) | 1:1 with HUD ACs (WIN-01/02/03); input clamps | `src/hud.test.js` | `npm test` |
| Composition/render (`main.js`, `feedback.js`, `index.html`) | e2e (prompt scenario, AD-006) | Happy path of victory + replay + visible edge cases (HUD, button, old save); run during validation (Verifier) via Playwright MCP | `e2e/scenarios/*.md` | Playwright MCP against `npm run dev`/`vite preview` |
| Pure CSS/markup | none | — (build gate; visual evidence via scenario screenshots) | — | `npm run build` |

## Gate Check Commands

> Generated from codebase — `package.json` scripts.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tasks with unit tests only | `npm test` |
| Full | Tasks that change E2E scenarios | `npm test` (E2E scenarios run during validation via Playwright MCP, AD-006) |
| Build | Last task of a phase / markup-only tasks | `npm run build && npm test` |

---

## Execution Plan

### Phase 1: Pure logic (game.js)

```
T1 → T2
```

### Phase 2: HUD (DOM)

```
T3 → T4
```

### Phase 3: Celebration and composition

```
T5 → T6
```

---

## Task Breakdown

### T1: `won` phase and storage rules in game.js

**What**: `TOTAL_ROUNDS = 3`; `tryStore` sets `phase = 'won'` upon completing round 3 (otherwise `'celebrating'`) and removes the storage key; `advanceRound()` becomes a no-op when `won`; `readSavedRound` treats save > 3 as 1.
**Where**: `src/game.js` + `src/game.test.js`
**Depends on**: None
**Reuses**: tolerant storage wrappers (GUARD-06), existing test pattern
**Requirement**: WIN-05, WIN-07

**Tools**: MCP: NONE · Skill: NONE

**Done when**:

- [ ] Completing round 3 → `phase === 'won'`; rounds 1–2 → `'celebrating'` (unchanged)
- [ ] `advanceRound()` after `won` does NOT increment (never round 4)
- [ ] Victory removes `hora-de-guardar:round` from storage; storage that throws doesn't break
- [ ] Saved round > 3 or invalid → loads round 1; save 2–3 preserved
- [ ] Gate passes: `npm test` (test count ≥ current, no deletions)

**Tests**: unit · **Gate**: quick
**Commit**: `feat(game): victory after 3 rounds with save cleanup`

---

### T2: Derived progress and reset in game.js

**What**: `getProgress()` → `{ round, totalRounds, stored, total, starsLit }` (starsLit = completed rounds; 3 when `won`; bar = stored/total of the current round) and `reset()` (round 1, storage cleared, ready for `startRound()`).
**Where**: `src/game.js` + `src/game.test.js`
**Depends on**: T1
**Reuses**: existing `state.toys` state
**Requirement**: WIN-02, WIN-03, WIN-09 (logic)

**Tools**: MCP: NONE · Skill: NONE

**Done when**:

- [ ] `getProgress()` reflects stored/total per round and resets `stored` on a new round
- [ ] `starsLit` = N−1 at round N; = 3 at victory
- [ ] `reset()` returns to round 1 with storage cleared; the next `startRound()` generates 6 toys
- [ ] Gate passes: `npm test`

**Tests**: unit · **Gate**: quick
**Commit**: `feat(game): derived progress (bar/stars) and game reset`

---

### T3: HUD markup and CSS + replay button

**What**: `#hud` fixed at the top (3 inline CSS/SVG stars + bar with `#bar-fill`), `pointer-events: none`, `z-index: 4`; `#replay-overlay.hidden` with `#replay-button` (visual clone of `#play-button`, no text).
**Where**: `index.html`
**Depends on**: None
**Reuses**: `#play-button` style, existing overlay/z-index convention
**Requirement**: WIN-01, WIN-04

**Tools**: MCP: NONE · Skill: NONE

**Done when**:

- [ ] HUD has no text at all; doesn't capture the pointer; visible and proportional at 1280×800 and 390×844 (relative units)
- [ ] z-index: HUD 4 < iris 5 < start 10 < WebGL error 20
- [ ] `#replay-overlay` hidden by default
- [ ] Gate passes: `npm run build && npm test`

**Tests**: none (markup layer; visual evidence in the E2E scenarios during validation) · **Gate**: build
**Commit**: `feat(hud): progress HUD markup and styling plus replay button`

---

### T4: hud.js module

**What**: `createHud({ starEls, barFillEl })` with `set({ starsLit, fraction })` — `lit` class on the stars, percentage `style.width` on the bar; clamped inputs.
**Where**: `src/hud.js` + `src/hud.test.js`
**Depends on**: T3 (element names/classes)
**Reuses**: mocked-element pattern from `transitions.test.js`
**Requirement**: WIN-01, WIN-02, WIN-03

**Tools**: MCP: NONE · Skill: NONE

**Done when**:

- [ ] `set({starsLit: 2, fraction: 0.5})` → first 2 stars `lit`, bar `50%`
- [ ] Reapplying with fewer stars clears the extras (replay resets)
- [ ] `fraction`/`starsLit` outside bounds are clamped
- [ ] Gate passes: `npm test`

**Tests**: unit · **Gate**: quick
**Commit**: `feat(hud): progress HUD controller (stars + bar)`

---

### T5: Victory celebration in feedback.js

**What**: `victory(boxes)` — `confetti.rain(8)`, `bluey.danceAt(center, 8)`, pulse on all boxes, and a victory jingle (~2s, extended arpeggio with `note`), distinct from `roundComplete`.
**Where**: `src/feedback.js`
**Depends on**: None
**Reuses**: confetti pool, `danceAt`, WebAudio primitives `note`/`safePlay`
**Requirement**: WIN-06

**Tools**: MCP: NONE · Skill: NONE

**Done when**:

- [ ] `victory()` exported and longer/denser than `roundComplete` (8s of rain vs 3s; its own jingle)
- [ ] Audio failure stays silent (`safePlay`)
- [ ] Gate passes: `npm test`

**Tests**: none (render layer, AD-004; evidence in the E2E scenarios during validation) · **Gate**: quick
**Commit**: `feat(feedback): big victory celebration`

---

### T6: Composition in main.js + E2E hook + scenarios

**What**: Updated HUD (spawn/stored/replay); victory flow (`phase === 'won'` → `feedback.victory`, 4s timer → shows replay); replay handler (iris → `reset` → `spawnRound` → HUD reset → iris opens); WebGL error path removes `#hud`/`#replay-overlay`; `window.__game.state()` gains `progress`. New scenario `e2e/scenarios/06-progresso-e-vitoria.md` (full victory via seed + replay + old save > 3) and adjustment of scenario 02 (round 3 ends in victory, not round 4).
**Where**: `src/main.js`, `e2e/scenarios/06-progresso-e-vitoria.md`, `e2e/scenarios/02-rodada-completa.md`
**Depends on**: T1, T2, T3, T4, T5
**Reuses**: existing iris flow from the round transition, E2E scenario pattern (AD-006)
**Requirement**: WIN-02, WIN-04, WIN-05, WIN-06, WIN-08, WIN-09

**Tools**: MCP: Playwright (validation only) · Skill: NONE

**Done when**:

- [ ] Bar advances with each `stored`; star lights up on round completion; bar resets on a new round
- [ ] Victory: big celebration, replay button after ~4s, dragging inert (`phase !== 'playing'`)
- [ ] Replay: round 1, HUD reset, button disappears, dragging works
- [ ] `state().progress` available for the scenarios
- [ ] Scenario 06 written (happy path + edge cases: save>3, reload post-victory); scenario 02 adjusted
- [ ] Gate passes: `npm run build && npm test`

**Tests**: e2e (scenarios written in this task; run during validation by the Verifier via Playwright MCP, AD-006) · **Gate**: build
**Commit**: `feat(main): HUD progress, victory flow and replay`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 ──→ T2
Phase 2:  T3 ──→ T4
Phase 3:  T5 ──→ T6
```

6 tasks ⇒ a single batch (≤ ~8) ⇒ inline execution, no batch sub-agents.
The Verifier runs automatically after T6.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: won phase + storage | 1 file, cohesive end-of-game rules | ✅ Granular |
| T2: progress + reset | 1 file, 2 derived functions | ✅ Granular |
| T3: HUD markup/CSS + replay | 1 file (index.html) | ✅ Granular |
| T4: hud.js | 1 new module | ✅ Granular |
| T5: victory() | 1 function in 1 file | ✅ Granular |
| T6: composition + scenarios | 1 code file + scenario docs cohesive with the wiring (merge-forward) | ✅ OK (cohesive) |

## Diagram-Definition Cross-Check

| Task | Depends On (body) | Diagram Shows | Status |
| ---- | ------------------- | -------------- | ------ |
| T1 | None | start of Phase 1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | None | start of Phase 2 (after Phase 1) | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | None | start of Phase 3 (after Phase 2) | ✅ Match |
| T6 | T1–T5 | last node | ✅ Match |

## Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
| ---- | ---------- | ------------------ | ---------- | ------ |
| T1 | pure logic | unit | unit | ✅ OK |
| T2 | pure logic | unit | unit | ✅ OK |
| T3 | CSS/markup | none (build) | none | ✅ OK |
| T4 | DOM controller | unit | unit | ✅ OK |
| T5 | render | e2e during validation (AD-004/006) | none + e2e evidence during validation | ✅ OK |
| T6 | composition | e2e (prompt scenario) | e2e — scenarios written IN the task (merge-forward) | ✅ OK |

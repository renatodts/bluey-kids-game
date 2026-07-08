# Music and Sounds Validation

**Date**: 2026-07-08
**Spec**: `.specs/features/musica-e-sons/spec.md`
**Diff range**: `b5eff6a` (feat: `src/feedback.js`) + `0a1e259` (docs: `.specs/STATE.md`, `.specs/features/hora-de-guardar/spec.md`, `.specs/features/musica-e-sons/spec.md`)
**Verifier**: independent sub-agent (author ≠ verifier); evidence re-derived from code and git history, gates run locally in isolated worktrees
**Note on scope**: the working tree also contains unrelated, out-of-scope changes from a different in-progress feature (`camera-gestos`: `src/main.js`, `src/toys.js`, `src/bluey.js`, `assets/bluey/bluey.glb`, `src/bluey.test.js`, commit `b51f634`). These were read only where needed to trace the call graph into `main.js` and are **not** part of this validation's subject.

No formal `tasks.md` exists for this feature (Medium-scope, inline Execute per traceability note in spec.md) — Task Completion table omitted per instructions; a manual code-path trace substitutes for the usual mutation-sensor table, since `feedback.js` has zero unit tests by design (WebAudio is not testable under jsdom/Vitest — same AD-004 exception already applied to pre-existing `chime`/`fanfare`/`victoryTune`).

---

## Spec-Anchored Acceptance Criteria (MUS-01..MUS-04.1)

| Criterion | Spec-defined outcome | Evidence | Result |
| --------- | --------------------- | -------- | ------ |
| MUS-01 | WebAudio unlocked → starts a synthesized track, short and cheerful, looping continuously while the game is open | `src/feedback.js:145` (`unlock()` → `if (unlocked) startMusic();`); `:196-203` (`startMusic()` creates `musicBus`, `musicRunning=true`); `:205-213` (`tickMusic()` schedules the next loop with a 0.5s lookahead from `ctx.currentTime`, not from `dt`); `:293` (`update(dt)` calls `audio.tickMusic()` every frame); confirmed that `update(dt)` runs indefinitely via `renderer.setAnimationLoop` in `src/main.js:345-370` (unconditional call to `feedback.update(dt)` at `:367`) | ✅ PASS |
| MUS-02 | Track always noticeably quieter than any effect (chime/oops/fanfare/victoryTune) | `src/feedback.js:108` (`MUSIC_BASE_GAIN = 0.05`) multiplied by each melody note's peak (0.3–0.55, `:111-127`) via a series graph `osc→gain(peak)→musicBus(0.05)→destination` (`:191-192`, `noteTo` receives `musicBus` as the destination) — effective music gain ≈0.015–0.028; effects use `note()` → connect directly to `ctx.destination` (`:165-166`), without the 0.05 factor, with peaks of 0.16–0.22 (chime/fanfare/victoryTune, `:216-234`) and 0.18 (oops, `:246`) — 6–14× louder than the music | ✅ PASS |
| MUS-03 | Any effect (chime/oops/fanfare/victoryTune) → duck the music for a fraction of a second, returning to base volume | `duck()` at `:171-178` (linear ramp down to `MUSIC_DUCK_GAIN` over 0.04s, then back up to `MUSIC_BASE_GAIN` at the end of `duration`); triggered via `safePlay(fn, duckDuration)` (`:180-189`, line 183: `if (duckDuration) duck(duckDuration);`); all 4 call sites pass a truthy `duckDuration`: chime `0.4` (`:219`), fanfare `1.5` (`:225`), victoryTune `2.5` (`:234`), oops `0.4` (`:251`) | ✅ PASS |
| MUS-03.1 | Two effects in quick succession → stable duck, no "stuck" low volume nor abrupt jump | `duck()` `:172-177`: `cancelScheduledValues(t0)` + `setValueAtTime(gain.value, t0)` before scheduling the new ramps — cancels previous ramps starting from the *current* value (no discontinuity), then schedules a new linear ramp back to base. A second `duck()` called before the first one finishes restarts from wherever the volume was, never getting stuck low (the return ramp is always rescheduled) | ✅ PASS |
| MUS-04 | Toy dropped in a wrong-type box → in addition to the visual wobble (GUARD-03), plays a short and good-humored sound (never buzzer/punishment) | `src/feedback.js:390` (`rejected()` → `audio.oops(); // (MUS-04)`, called after `wobble(box.mesh)` at `:389`); `oops()` at `:236-251`: `triangle` oscillator, descending glide 520→260Hz over 0.26s ("boop"), total duration 0.35s, peak 0.18 — no buzzer characteristics (no `square`/long sustain) | ✅ PASS |
| MUS-04.1 | Toy dropped outside any box → same sound as MUS-04 | `src/feedback.js:396` (`settle()` → `audio.oops(); // (MUS-04.1)`, same `oops` function reused, guaranteeing an identical sound) | ✅ PASS |

**Result**: 6/6 ACs with direct file:line evidence — all citations confirmed by reading the code, not just "something related exists."

---

## Manual Code-Path Trace (substitutes for the mutation sensor — no unit tests by design)

| # | Question | File:line evidence | Verdict |
| - | -------- | ------------------- | ------- |
| a | Does `unlock()` call `startMusic()` on success, and is `startMusic()` idempotent against a double start? | `feedback.js:145` (`if (unlocked) startMusic();`, called synchronously right after `unlocked = ctx.state === 'running'`, with no `await` between the two lines — no race window); `feedback.js:197` (`if (!unlocked \|\| musicRunning) return;` — a second call to `startMusic()`, including from a second `unlock()`, is a no-op) | ✅ PASS |
| b | Is `audio.tickMusic()` called every frame from `update(dt)` in `createFeedback()`? | `feedback.js:293` (`audio.tickMusic(); // (MUS-01)`, last line of `update(dt)`); `update(dt)` is in turn called unconditionally every frame from `renderer.setAnimationLoop` in `src/main.js:367` | ✅ PASS |
| c | Is `duck()` triggered for all 4 effect sounds, i.e. does `safePlay` receive a truthy `duckDuration` at all 4 call sites? | `chime` `:219` (`0.4`), `fanfare` `:225` (`1.5`), `victoryTune` `:234` (`2.5`), `oops` `:251` (`0.4`) — all truthy, all go through `safePlay(fn, duckDuration)` (`:180`) | ✅ PASS |
| d | Is `audio.oops()` called both in `rejected()` and in `settle()`? | `rejected()`: `feedback.js:390`; `settle()`: `feedback.js:396` — both call the same `oops` function | ✅ PASS |
| e | Does `musicBus` route through a gain node separate from the one used by `note()` for sfx, so that ducking never affects the effects? | `note()` (`:165-166`) always connects directly to `ctx.destination`; `scheduleMusicLoop()` (`:191-192`) always connects via `noteTo(musicBus, ...)`; `musicBus` is its own `GainNode` (`:198-200`, connected to `ctx.destination`) manipulated only by `duck()` (`:174-177`) — physically distinct audio graphs, so ducking the music bus never touches the gain of the effect oscillators | ✅ PASS |
| f | Is there a race where `duck()` could be called before `musicBus` exists (e.g. before `startMusic()` runs)? Is it safely guarded? | `duck()` `:172` (`if (!musicBus) return;`); additionally, `duck()` is only reachable via `safePlay()`, which requires `unlocked === true` (`:181`) — and `unlocked` only becomes `true` inside `unlock()`, which calls `startMusic()` synchronously right after (`:145`), with no `await` between the two — no concurrent task is possible between them in single-threaded JS. The guard at `:172` covers the case defensively regardless | ✅ PASS (guarded) |

**Result**: 6/6 code-path checks PASS.

---

## Edge Cases (spec.md)

| Edge case | Evidence | Result |
| --------- | -------- | ------ |
| Music playing, miss right after a hit (chime + oops very close together) → both audible, without one cutting off the other | `chime()` and `oops()` are independent oscillators, each with its own `GainNode` connected directly to `ctx.destination` (`:165-166`, `:248`) — signals sum additively, no cancellation mechanism between them; the only shared side effect is `duck()` on `musicBus` (not on the effects themselves), and a second `duck()` merely reschedules the ramp (item MUS-03.1 above) | ✅ PASS |
| Victory jingle (~2.3s) → duck stays applied for the entire duration, not just the initial attack | `victoryTune` uses `duckDuration=2.5` (`:234`); jingle's audible duration: last note at `t=1.3, dur=0.9` → ends ~2.2s (`:229-233`), within the 2.5s window; `duck(2.5)` keeps the return-to-base ramp only completing at `t0+2.5` (`:177`) — the volume stays below base for the entire 2.5s window, fully covering the ~2.2-2.3s jingle | ✅ PASS |
| `AudioContext` fails to start/unlock → neither music nor effects play, no error in the console | `unlock()` `:146-148`: silent catch, `unlocked = false` with no `console.*`; since `unlocked` never becomes `true`, `startMusic()` never runs (`:145`) and `safePlay()` returns early on every effect call (`:181`) — neither music nor effects play, no log emitted | ✅ PASS |

---

## GUARD-03/GUARD-09 Amendment Consistency

`.specs/features/hora-de-guardar/spec.md` (commit `0a1e259`) was checked against `musica-e-sons/spec.md` and against the code:

- GUARD-03 item 3 (wrong box) amended to "no traditional punitive sound (amended by MUS-04...)" — consistent with the implementation: `oops()` is a short "boop" (triangle, descending glide, 0.35s), not a buzzer, triggered in `rejected()` (`:390`). ✅ Consistent.
- GUARD-03 item 4 (outside a box) amended to "same good-humored touch as GUARD-03.3" — the implementation confirms it is literally the same `oops()` function reused in `settle()` (`:396`), with no different sound. ✅ Consistent with the behavior.
- GUARD-09 gained a new item 4: "audio unlocked → also starts background music, always quieter than the effects (MUS-01/02/03)" — consistent with MUS-01/02 in the new spec and with the implementation (`startMusic()` from `unlock()`, `MUSIC_BASE_GAIN` lower than the effect peaks). ✅ Consistent.
- **Non-blocking nit**: the amended text of GUARD-03 item 4 references "GUARD-03.3" — this sub-ID does not exist in the Requirement Traceability table of `hora-de-guardar/spec.md` (which lists only the monolithic `GUARD-03` covering the original items 3 and 4, a pre-existing convention before this feature). It is an ad-hoc notation by the author to disambiguate "item 3 of GUARD-03" vs. "item 4 of GUARD-03" within the same formal ID — not a functional contradiction (the behavior is clear and correct in the code), but it is a cross-reference that doesn't resolve to any formally defined ID in either spec. Recommendation: use "item 3 of this list" or formalize sub-IDs (GUARD-03.1..03.4) in the traceability table if this pattern recurs.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code (no features beyond what was requested) | ✅ — only music/duck/oops, no mute button (Out of Scope respected) |
| Surgical changes (commit 1 touches only `src/feedback.js`; commit 2 touches only the 3 spec/doc files) | ✅ — confirmed via `git show --stat` on both commits |
| No scope creep | ✅ — no changes to `main.js`/`game.js`/other modules; `unlockAudio`/`update` already existed as integration points, reused without changing their signature |
| Matches existing patterns (mini-tween/no-deps philosophy, comments in Portuguese only where the "why" isn't obvious) | ✅ — `noteTo()` is a clean generalization of the pre-existing `note()` (extracts `destination` as a parameter instead of duplicating logic); new comments follow the same style of citing the requirement ID in parentheses (`// (MUS-01)` etc.), same as the existing pattern for GUARD-xx |
| `SPEC_DEVIATION` documented where applicable | ✅ — the file header (`:1-8`) already had a `SPEC_DEVIATION` for WebAudio oscillators instead of audio files; the new feature is consistent with that prior decision (reaffirmed in the MUS Out of Scope: "synthesize via WebAudio... AD-005, lesson L-003") and introduces no new deviation |
| The spec.md's own validation documentation is factually accurate | ⚠️ See gap #1 below |

**Gaps found (non-blocking, ranked)**:

1. **[Low severity] The test count cited in the spec is incorrect for the commit's point in time.** `.specs/features/musica-e-sons/spec.md` (in the "Implementation" section) states: *"Validation is: Vitest suite 54/54 with no regression..."*. Reproducing the exact commit `0a1e259` in an isolated worktree, the actual suite at that point in history is **50/50** (3 test files), not 54. The number 54 only exists at the current HEAD (`b51f634`), which includes 4 new tests from `src/bluey.test.js` belonging to the *unrelated* `camera-gestos` feature, committed later. Likely hypothesis: the author ran `npm test` in a working tree that already contained the other feature's uncommitted changes while writing the spec, instead of isolating the count to this feature's scope. It does not affect the correctness of the code (confirmed by this Verifier: 50/50 with no regression on the isolated commit, see Gate Check), but it is an inaccuracy in the persisted documentation artifact. Recommendation: correct the spec.md to "50/50" or generalize to "full Vitest suite, no regression" without a fixed number.
2. **[Nit / cosmetic]** See "GUARD-03.3" above — a cross-reference to a sub-ID that doesn't exist in the traceability table.

No functional gaps found in the `src/feedback.js` code.

---

## Gate Check

- **Gate commands**: `npm test` (Vitest) and `npm run build` — run locally by this Verifier on 2026-07-08, across three distinct states via `git worktree`:
  1. Parent commit `f20ae1a` (before the feature): `npm test` → 3 files, **50 passed / 50 total**, exit 0. `npm run build` → exit 0, clean (chunk >500kB warning, pre-existing/informational).
  2. Feature commit `0a1e259` (feature complete, isolated): `npm test` → 3 files, **50 passed / 50 total**, exit 0. `npm run build` → exit 0, clean.
  3. Current HEAD (`b51f634`, includes unrelated `camera-gestos` work on top): `npm test` → 4 files, **54 passed / 54 total**, exit 0. `npm run build` → exit 0, clean.
- **Isolated `musica-e-sons` feature delta**: 50 → 50 (0 tests added, 0 removed, 0 broken) — expected and correct, given that `feedback.js` has no unit tests by design (WebAudio not testable under jsdom, same AD-004 exception as `chime`/`fanfare`/`victoryTune`, none of which had a test before this feature either).
- **Regression**: none — the 50 pre-existing tests (`game.test.js`, `hud.test.js`, `transitions.test.js`) pass intact at all three points.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| MUS-01 | Implemented (spec) | ✅ Verified |
| MUS-02 | Implemented (spec) | ✅ Verified |
| MUS-03 | Implemented (spec) | ✅ Verified |
| MUS-03.1 | Implemented (spec) | ✅ Verified |
| MUS-04 | Implemented (spec) | ✅ Verified |
| MUS-04.1 | Implemented (spec) | ✅ Verified |

(This Verifier did not edit `spec.md`; the spec already lists "Implemented" for all 6 rows — confirmed by independent evidence.)

---

## Summary

**Overall**: ✅ PASS

**Spec-anchored check**: 6/6 ACs (MUS-01..MUS-04.1) with direct file:line evidence and confirmed behavior, not just the presence of related code
**Manual code-path trace**: 6/6 checks PASS (a–f)
**Edge cases**: 3/3 covered (simultaneous effects, duck throughout the entire victory jingle, silent AudioContext failure)
**Gate**: `npm test` 50/50 on the feature's isolated commit (54/54 at current HEAD, including unrelated work), exit 0; `npm run build` exit 0 at all three points tested

**What works**: synthesized background music looping continuously with lookahead scheduling robust to irregular frames; correct automatic duck (cancels previous ramps without a click) for the 4 effects, including full coverage of the ~2.3s victory jingle; the miss sound (good-humored, non-punitive "boop") reused identically in both cases (wrong box and outside a box); the audio graph physically separates the music and sfx buses, so ducking never affects the effects themselves; zero regression in the 50 pre-existing tests; clean build.

**Issues found (non-blocking)**:
1. ⚠️ Low severity — `spec.md` cites "Vitest suite 54/54" in the validation section, but the actual count on the feature's commit is 50/50 (the 54 only exists after later unrelated work). Suggestion: correct the number or remove the fixed figure.
2. 📌 Cosmetic nit — the "GUARD-03.3" cross-reference in `hora-de-guardar/spec.md` doesn't correspond to any formal sub-ID in that spec's traceability table.

**Next steps**: correct the test count cited in `musica-e-sons/spec.md`; optionally formalize GUARD-03 sub-IDs if the `hora-de-guardar` spec is revised again.

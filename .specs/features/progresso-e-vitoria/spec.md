# Progress and Victory Specification

## Problem Statement

Today the game is an infinite loop of rounds (6 → 9 → 12 → 12…): the child never "wins".
For a 4-year-old there's a missing sense of accomplishment — seeing how much is left and having
a clear victory moment. This feature adds a progress HUD at the top of the screen
(no text) and a victory upon completing the 3rd round, with a big celebration and a
giant button to play again.

## Goals

- [ ] The child sees at the top, at all times, how much is left in the round (bar) and in the game (stars)
- [ ] Completing 3 rounds produces an unmistakable victory (big party) and a simple restart (1 tap)
- [ ] Zero text in the game UI (keeps the existing rule)

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Scoreboard, numeric count, or timer | A 4-year-old can't read; "no text" rule |
| Levels/difficulties beyond the current 3 rounds | The 6/9/12 progression already exists (GUARD-04); victory just closes the arc |
| Persistent rewards (trophy collection across sessions) | New scope; victory resets the game by user decision |
| New sounds beyond the victory fanfare | Reuses the existing audio base from feedback |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Bar semantics | The bar shows the current round (0 → N toys of the round) and resets each new round | Immediate reward per toy; stars carry the macro progress ("bar + stars" choice) | y (discuss) |
| Old save with round > 3 | Reset to round 1 | The new model has 3 rounds; a save from the infinite version has no meaning — restarting the arc is simpler and more coherent | n (assumption) |
| Timing of the replay button | Appears ~4s after the start of the victory celebration (party first, button after) | Same window used in the current round celebration; the party is the reward, the button shouldn't compete with it | n (assumption) |
| Replay button icon | Graphic ▶/↻ icon with no text, in the style of the existing play button on the start-overlay | "No text" rule; reuses visual language the child already knows | n (assumption) |
| Reloading the page during the victory screen | Game loads at round 1 (storage was already cleared on victory) | Persistence resets on victory (user decision); no intermediate state to preserve | y (derives from discuss) |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: Visible progress at the top ⭐ MVP

**User Story**: As a 4-year-old, I want to see at the top of the screen how much I've
already stored, so I feel like I'm getting closer to winning.

**Why P1**: It's the "progress" half of the request; without it, victory arrives without anticipation.

**Acceptance Criteria**:

1. WHEN a round is in play THEN the HUD SHALL display at the top 3 star slots and a progress bar, with no text at all
2. WHEN a toy is stored in the correct box THEN the bar SHALL advance to the proportion `stored/total` of the current round
3. WHEN the round is completed THEN the star corresponding to the round SHALL light up
4. WHEN a new round begins THEN the bar SHALL return to empty and the lit stars SHALL remain lit
5. WHEN the game loads with a saved round N (1 ≤ N ≤ 3) THEN the HUD SHALL show N−1 lit stars and an empty bar
6. WHEN the child drags a toy over the HUD region THEN the HUD SHALL NOT capture the pointer (dragging keeps working)
7. WHEN WebGL is unavailable (error screen) THEN the HUD SHALL NOT appear

**Independent Test**: Play round 1 storing toys one by one and watch the bar fill
in 6 steps; complete the round and see the 1st star light up; in round 2 the bar returns to empty.

---

### P1: Victory upon completing 3 rounds ⭐ MVP

**User Story**: As a 4-year-old, I want a big party when I store everything across the
3 rounds, so I know I won the game.

**Why P1**: It's the final goal of the game — the reason for this feature.

**Acceptance Criteria**:

1. WHEN the last toy of round 3 is stored THEN the game SHALL enter the `won` phase and SHALL NOT start a round 4
2. WHEN the `won` phase starts THEN the system SHALL trigger a victory celebration bigger/distinct from the round celebration (Bluey in the center + confetti/stars + party sound)
3. WHEN the `won` phase starts THEN the system SHALL clear the saved round in storage (next session starts at round 1)
4. WHEN the victory celebration is active THEN dragging toys SHALL be ignored
5. WHEN ~4s of celebration have passed THEN a giant replay button (icon, no text) SHALL appear over the scene
6. WHEN victory occurs THEN the HUD's 3 stars SHALL be lit and the bar full

**Independent Test**: With a deterministic seed, complete the 3 rounds via the E2E hook and
verify `phase === 'won'`, storage cleared, replay button visible, no round 4.

---

### P1: Play again ⭐ MVP

**User Story**: As a 4-year-old, I want to press a big button to play again
from the start.

**Why P1**: Without a restart, victory is a dead end; 1 tap closes the loop.

**Acceptance Criteria**:

1. WHEN the replay button is tapped THEN the game SHALL restart at round 1 with the iris transition (close → swap → open)
2. WHEN the game restarts THEN the HUD SHALL show 0 lit stars and an empty bar
3. WHEN the game restarts THEN the replay button and celebration effects SHALL disappear
4. WHEN the game restarts THEN dragging SHALL work again in round 1

**Independent Test**: From the victory screen, tap replay and verify round 1 is active,
HUD reset, dragging working.

---

## Edge Cases

- WHEN storage contains a saved round > 3 (save from the old/infinite version) THEN the game SHALL load at round 1
- WHEN storage contains an invalid value THEN the game SHALL load at round 1 (current behavior preserved, GUARD-06)
- WHEN the page is reloaded during the victory screen THEN the game SHALL load at round 1 (storage already cleared)
- WHEN storage is unavailable (private mode) THEN progress/victory SHALL work normally in memory (without persisting)
- WHEN the window is resized THEN the HUD SHALL remain visible and proportional at the top

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --------------- | ----- | ----- | ------ |
| WIN-01 | P1: Progress — textless top HUD (AC 1, 7) | Design | Pending |
| WIN-02 | P1: Progress — per-toy bar (AC 2, 4) | Design | Pending |
| WIN-03 | P1: Progress — per-round stars (AC 3, 5) | Design | Pending |
| WIN-04 | P1: Progress — HUD does not block input (AC 6) | Design | Pending |
| WIN-05 | P1: Victory — `won` phase after 3rd round, no round 4 (AC 1) | Design | Pending |
| WIN-06 | P1: Victory — distinct big celebration (AC 2, 6) | Design | Pending |
| WIN-07 | P1: Victory — storage cleared on victory (AC 3) + save edge cases | Design | Pending |
| WIN-08 | P1: Victory — input blocked + replay button after ~4s (AC 4, 5) | Design | Pending |
| WIN-09 | P1: Replay — full restart at round 1 (AC 1–4) | Design | Pending |

**ID format:** `WIN-[NN]`

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 9 total, 0 mapped to tasks, 9 unmapped ⚠️ (pre-tasks)

---

## Success Criteria

- [ ] A 4-year-old understands the progress without instruction (bar fills, stars light up)
- [ ] Completing the 3 rounds produces victory + restart in 1 tap, with no text in the UI
- [ ] `npm test` green (pure victory/progress logic covered); updated E2E scenarios pass

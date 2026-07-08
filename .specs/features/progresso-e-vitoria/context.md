# Progress and Victory — Context

**Gathered:** 2026-07-08
**Spec:** `.specs/features/progresso-e-vitoria/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Give the game a final objective: a progress HUD at the top of the screen (no text) and a
victory moment upon completing the last round, suitable for a 4-year-old,
with a giant button to play again.

---

## Implementation Decisions

### Victory goal

- The complete game has **3 rounds** (6 + 9 + 12 = 27 toys).
- Completing round 3 triggers **victory** (there is no round 4).

### Progress at the top

- **Bar + stars** ("micro + macro"): the bar fills a bit with each toy
  stored (immediate reward); one **star per round** lights up when the round
  is completed.
- Preview chosen by the user: `⭐ ⭐ ☆  ▓▓▓▓▓▓░░░░░░` at the top of the screen.
- No text (existing project rule: UI without text, except WebGL error).

### Victory

- **Party + play again button**: a big celebration — Bluey dances, confetti/stars
  in the 3D scene — followed by a **giant textless button** (▶/↻ icon) to
  restart. The child decides when to play again.

### Persistence

- **Saves midway, clears on victory**: closing the game midway keeps the round saved
  (current behavior); winning clears the storage — the next session starts at round 1.

### Agent's Discretion

- Exact semantics of the bar (per round vs. whole game) — decided: **per round**
  (resets every new round; stars carry the macro state). Logged as an assumption.
- Exact duration/shape of the victory celebration and the moment the button appears.
- Handling of old saves with round > 3.

### Declined / Undiscussed Gray Areas → Assumptions

No area was declined; the discretions above are logged in the
Assumptions & Open Questions section of the spec.

---

## Specific References

- ASCII preview of the HUD chosen by the user (bar + stars at the top).
- Consistency with the project pattern: DOM overlays (start-overlay, transition-overlay),
  3D feedback via `feedback.js`, pure logic in `game.js` (AD-004).

---

## Deferred Ideas

None — discussion stayed within feature scope.

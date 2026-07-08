# Music and Sounds Specification

## Problem Statement

The game today only has occasional sound effects for a correct match/win (GUARD-09); the room stays silent between them, and there is no sound feedback at all when the child misses the box. The request is to give the game more sonic life with a fun background music track, without taking the spotlight away from the game's own effects, and to also add a touch for the miss case.

## Goals

- [ ] Cheerful background music, looping, playing during the game
- [ ] Game effects (hit/fanfare/victory/miss) always audible in the foreground over the music
- [ ] Short, non-punitive touch when the child misses the box

## Out of Scope

| Feature | Reason |
|---|---|
| Mute button / volume control | Out of scope for now (decided with the user) — YAGNI |
| Downloading an external music file | Decided with the user: synthesize via WebAudio, same pattern as GUARD-09, avoids license/network risk (AD-005, lesson L-003) |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
|---|---|---|---|
| Background music source | Synthesized via WebAudio (oscillators), short and cheerful loop | Already validated with the user; consistent with AD-005/L-003 | y |
| Tone of the miss sound | Short, good-humored, not a buzzer/punishment | Already validated with the user; preserves the original intent of GUARD-03 (don't punish the child) | y |
| Music vs. effects mixing | Music at a constant low volume + automatic duck (lowers it even further for a fraction of a second) during any game effect | Already validated with the user — ensures effects "stand out" | y |
| Scope of the miss sound (wrong box vs. dropped outside a box) | Plays in both cases: wrong-type box (`rejected`) AND dropped outside any box (`settle`) | Asked directly to the user, who preferred covering both cases instead of only the wrong-box one | y |
| Mute control | Not included in this delivery | Already validated with the user (out of scope) | y |

**Open questions:** none — all resolved or recorded above.

---

## User Stories

### P1: Fun background music ⭐ MVP

**User Story**: As a child, I want the room to have a lively little tune playing while I play.

**Why P1**: It's the central request of this feature.

**Acceptance Criteria**:

1. WHEN WebAudio is unlocked (same gesture as GUARD-09.1, the play button) THEN the system SHALL start a synthesized background track via WebAudio, short and cheerful, looping continuously while the game is open (MUS-01)
2. WHILE the track is playing THE system SHALL keep it at a noticeably lower volume than any game effect (chime/oops/fanfare/victoryTune) (MUS-02)
3. WHEN audio cannot be unlocked THEN the system SHALL remain silent (no music, no effects) and functional, with no console errors (reuses GUARD-09.3)

**Independent Test**: Tap play → music starts playing softly in a loop; leave the game open for more than one full loop → music restarts with no perceptible cut and no doubled/overlapping voices.

---

### P1: Game effects standing out over the music ⭐ MVP

**User Story**: As a child, I want the "I did it!" sound to keep standing out even with the little tune playing.

**Why P1**: Without this, the background music muffles the positive reinforcement that already existed — a regression of the original GUARD-09.

**Acceptance Criteria**:

1. WHEN any game effect plays (hit chime, miss sound, round fanfare, victory jingle) THEN the system SHALL duck (lower) the background music's volume for a fraction of a second and return it to the base volume right after, guaranteeing the effect is always audible in the foreground (MUS-03)
2. WHEN two effects play in quick succession (e.g., two hits in a row) THEN the duck SHALL behave stably, without leaving the music "stuck" at low volume or the volume jumping abruptly/audibly broken (MUS-03.1)

**Independent Test**: Hit a box while the music is playing → the chime is clearly heard over the music, which returns to normal volume shortly after.

---

### P1: Touch on a miss, without punishment ⭐ MVP

**User Story**: As a child, I want a funny touch when I miss the box, without feeling scolded.

**Why P1**: Explicit request from the user; a direct amendment to the original GUARD-03.

**Acceptance Criteria**:

1. WHEN a toy is dropped within the hit radius of a box of a DIFFERENT type THEN the system SHALL, in addition to the already-existing visual wobble (GUARD-03), play a short and good-humored sound — never a traditional buzzer/"error" tone nor any volume variation that sounds like a reprimand (MUS-04, amendment to GUARD-03)
2. WHEN the toy is dropped outside the radius of any box THEN the system SHALL, in addition to the already-existing visual settle (GUARD-03), play the SAME short and good-humored sound from MUS-04 (MUS-04.1, amendment to GUARD-03)

**Independent Test**: Drag a block onto the basket (wrong type) → basket wobbles + short funny touch; drag a toy to the empty floor → settles smoothly + same short funny touch.

---

## Edge Cases

- WHEN the music is playing and the player misses right after a hit (chime + oops very close together) THEN both effects SHALL play audibly, without one cutting off the other
- WHEN the victory celebration fires (longer jingle, ~2s) THEN the background music SHALL remain ducked for the entire duration of the jingle, not just the initial attack
- WHEN the `AudioContext` fails to start/unlock THEN neither music nor effects play, and no error should appear in the console (same guarantee as GUARD-09.3)

---

## Implicit-Requirement Dimensions (sweep)

Remaining dimensions N/A for this scope (no new persistence, no external call, no auth, no concurrency beyond what's already covered by GUARD-09) — the only relevant dimension:

| Dimension | Resolution |
|---|---|
| State-transition integrity | Music has only two states (`stopped` → `looping`), started once on unlock; duck is a per-event gain envelope, with no state persisted between effects |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| MUS-01 | P1: Background music | Execute | Implemented |
| MUS-02 | P1: Background music | Execute | Implemented |
| MUS-03 | P1: Effects standing out | Execute | Implemented |
| MUS-03.1 | P1: Effects standing out | Execute | Implemented |
| MUS-04 | P1: Touch on a miss (amendment to GUARD-03) | Execute | Implemented |
| MUS-04.1 | P1: Touch on a miss (amendment to GUARD-03) | Execute | Implemented |

**Coverage:** 6 total, 6 mapped (implicit in Execute, no formal tasks.md — Medium scope), 0 unmapped.

**Implementation:** `src/feedback.js` (`createAudio()`: `startMusic`/`tickMusic`/`duck`/`oops`; `createFeedback()`: `update()` calls `tickMusic()`, `rejected()`/`settle()` call `oops()`). No dedicated unit tests — `AudioContext`/oscillator scheduling is not testable under jsdom/Vitest; same exception as AD-004 already applied to `chime`/`fanfare`/`victoryTune` (none of the three had a test before this feature). Validation is: Vitest suite 50/50 on this feature's commit, no regression (no test broken/removed) + clean `npm run build` + manual listening (`npm run dev`). Independently verified in `.specs/features/musica-e-sons/validation.md` (Verifier PASS).

**Amendment note:** this feature revises the text of `GUARD-03` (P1: Drag and put away) and `GUARD-09` (P2: Sound) in `.specs/features/hora-de-guardar/spec.md` — "no negative sound" becomes "no traditional punitive sound; a short and good-humored sound is allowed." The original text will be updated with a note pointing to MUS-04.

---

## Success Criteria

- [ ] A 4-year-old plays a full round with music playing and still clearly notices when they hit or miss
- [ ] No regression in the existing hit/fanfare/victory effects (GUARD-09)

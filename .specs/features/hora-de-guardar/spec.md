# "Hora de Guardar!" — Specification

Derived from the approved product spec: `docs/2026-07-08-hora-de-guardar-design.md`.

## Problem Statement

A 4-year-old child who loves piece-and-match games needs a simple web game, with no text
and no punishment, playable on tablet (touch) and laptop (mouse).
The game: put away 3D toys in the right boxes, by type, in the Heeler family's (Bluey) room.

## Goals

- [ ] A 4-year-old plays alone, with no instructions, from the first touch to the celebration
- [ ] Works by touch (tablet/phone) and mouse (laptop) with the same code
- [ ] Zero punitive states: no text, no timer, no losing, no error count

## Out of Scope

| Feature | Reason |
|---------|--------|
| Color mode / color→type progression | Decided during brainstorming: type only |
| Camera rotation/parallax | AD-002: fixed camera |
| Menus, level selection, multiple scenes | YAGNI for the first version |
| Original show audio | Hard to obtain cleanly; generic free sounds for now |
| Public release | AD-005: official assets for private use only |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
|---|---|---|---|
| Multi-touch (second finger during drag) | Only one toy dragged at a time; first pointer wins, others ignored | Simplicity and predictability for the child | y (logical default) |
| Dropping a toy far from any box | Toy settles gently on the floor where it was dropped, no error feedback | It's not an error, just "I let go" | y (logical default) |
| `localStorage` unavailable/corrupted | Starts at round 1 silently | Losing progress is irrelevant here | y (logical default) |
| Failure loading an official image (key art/plaque) | Fallback: solid-color panel with a simple shape; game stays functional | Game cannot depend on network/assets | y (logical default) |
| Audio blocked by the browser | Game works in silence; audio unlocks on the first tap (start screen with a big button) | Mobile autoplay policy | y (approved in design) |
| Maximum round | After round 12, repeats 12 with new colors/positions indefinitely | Simple infinite progression | y (logical default) |
| Screen orientation | Landscape preferred; portrait works with a tight layout (no lock) | Don't frustrate the child if they rotate the tablet | y (logical default) |

**Open questions:** none — all resolved or recorded above.

---

## User Stories

### P1: Drag and put away a toy ⭐ MVP

**User Story**: As a child, I want to drag a toy with my finger or mouse to a box to put it away.

**Why P1**: This is the core of the whole game.

**Acceptance Criteria**:

1. WHEN the child touches/clicks a toy THEN the system MUST lift it off the floor and make it follow the pointer over the floor plane (GUARD-01)
2. WHEN the toy is dropped within the hit radius of the box of the SAME type THEN the system MUST absorb it into the box with a jump animation (GUARD-02)
3. WHEN the toy is dropped within the hit radius of a box of a DIFFERENT type THEN the system MUST shake the box and return the toy bouncing to the floor, with no traditional punitive sound (amended by MUS-04: a short, good-humored tone is allowed — see `.specs/features/musica-e-sons/spec.md`) (GUARD-03)
4. WHEN the toy is dropped outside the radius of any box THEN the system MUST settle it gently on the floor where it was dropped (amended by MUS-04.1: the same good-humored tone from criterion 3 above) (GUARD-03)
5. WHEN a second finger touches the screen during a drag THEN the system MUST ignore it (only the first pointer drags) (GUARD-01)

**Independent Test**: Open the game, drag a ball to the basket → ball disappears into the basket; drag a block to the basket → basket shakes and the block returns.

### P1: Rounds and progression ⭐ MVP

**User Story**: As a child, I want the room to fill up with toys again when I finish, each time with a little more.

**Why P1**: Without a round loop there is no continuous game.

**Acceptance Criteria**:

1. WHEN a round starts THEN the system MUST scatter N toys (round 1: 6, round 2: 9, round 3+: 12) in equal amounts per type, with color and position variation (GUARD-04)
2. WHEN the round's last toy is put away THEN the system MUST trigger the big celebration and start the next round automatically after ~4s (GUARD-05)
3. WHEN a round ends THEN the system MUST persist the next round number in `localStorage` (GUARD-06)
4. WHEN the game opens with saved progress THEN the system MUST start at the saved round; if `localStorage` is unavailable or invalid, it MUST start at round 1 (GUARD-06)

**Independent Test**: Put away all 6 toys of round 1 → celebration → round 2 starts with 9; reload the page → continues at round 2.

### P1: Touch-first diorama ⭐ MVP

**User Story**: As a child, I want to see the whole room at once and interact directly, with no camera controls.

**Why P1**: The visual and input base for everything.

**Acceptance Criteria**:

1. WHEN the game loads THEN the system MUST display the diorama (floor, wall, 3 boxes, toys) with a fixed perspective camera, with no orbit/zoom controls (GUARD-07)
2. WHEN the window changes size or orientation THEN the system MUST readjust the renderer and camera keeping the whole scene visible and any in-progress drag functional (GUARD-07)
3. WHEN used with touch or mouse THEN the system MUST respond to dragging with the same behavior (Pointer Events) (GUARD-01, GUARD-07)

**Independent Test**: Open on desktop and on a tablet; resize the window in the middle of a drag — nothing breaks.

### P2: Festive feedback and Bluey theme

**User Story**: As a child who's a Bluey fan, I want Bluey to celebrate with me every time I succeed.

**Why P2**: The game works without it, but it's what gives it soul — comes right after the playable MVP.

**Acceptance Criteria**:

1. WHEN a toy is put away correctly THEN the system MUST emit particle confetti at the box and show Bluey celebrating in a corner for ~2s (GUARD-08)
2. WHEN the round ends THEN the system MUST display the big celebration: characters, confetti rain and a fanfare (GUARD-08)
3. WHEN the scene is set up THEN the system MUST display official key art as wall frames and character plaques on the boxes (Bluey→basket, Bingo→chest, Chilli/Bandit→bed) (GUARD-08)
4. WHEN an image asset fails to load THEN the system MUST use a solid-color fallback and remain playable (GUARD-08)

**Independent Test**: Successfully place a toy → confetti + Bluey; rename an asset to simulate failure → game opens normally with color panels.

### P2: Sound

**User Story**: As a child, I want party sounds when I succeed.

**Why P2**: Important positive reinforcement, but the game is playable muted.

**Acceptance Criteria**:

1. WHEN the first tap/click happens (big play button on the start screen) THEN the system MUST unlock WebAudio (GUARD-09)
2. WHEN a toy is put away correctly THEN the system MUST play a short success sound; WHEN the round ends, a fanfare (GUARD-09)
3. WHEN audio cannot be unlocked THEN the system MUST remain functional in silence (GUARD-09)
4. WHEN audio is unlocked THEN the system MUST also start looping background music, always at a lower volume than the success/error/fanfare/victory effects (amendment: see `.specs/features/musica-e-sons/spec.md`, MUS-01/02/03)

**Independent Test**: Tap play → succeed → sound; open with the system sound muted → game continues normally.

---

## Edge Cases

- WHEN the pointer leaves the window during a drag THEN the system MUST release the toy as "dropped outside a box" (settles on the floor)
- WHEN two toys overlap at the touch point THEN the system MUST pick the one closest to the camera (first raycast hit)
- WHEN `localStorage` throws an exception (private mode) THEN the system MUST catch it and continue without persistence
- WHEN WebGL is not available THEN the system MUST show a simple static message (the only exception to the "no text" rule — aimed at the adult)

---

## Implicit-Requirement Dimensions (sweep)

| Dimension | Resolution |
|---|---|
| Input validation & bounds | Dragging limited to the diorama floor area (clamp); multi-touch ignored beyond the 1st pointer |
| Failure / partial-failure | Asset fallback (GUARD-08.4); optional audio (GUARD-09.3); tolerant localStorage (GUARD-06) |
| Idempotency / retry | N/A — no remote operations |
| Auth & rate limits | N/A — local game with no backend |
| Concurrency / ordering | One drag at a time; pointer events serialized by the browser |
| Data lifecycle | Only the round number in `localStorage`; no expiration (irrelevant) |
| Observability | N/A — `console.warn` on asset failure is enough for home use |
| External-dependency failure | No runtime dependencies (local assets, no network) |
| State-transition integrity | Round state machine: `playing → celebrating → playing`; toy: `idle → dragging → (stored | dropped)` — transitions covered by `game.js` tests |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| GUARD-01 | P1: Drag and put away | Execute | Implemented |
| GUARD-02 | P1: Drag and put away | Execute | Implemented |
| GUARD-03 | P1: Drag and put away | Execute | Implemented |
| GUARD-04 | P1: Rounds and progression | Execute | Implemented |
| GUARD-05 | P1: Rounds and progression | Execute | Implemented |
| GUARD-06 | P1: Rounds and progression | Execute | Implemented |
| GUARD-07 | P1: Touch-first diorama | Execute | Implemented |
| GUARD-08 | P2: Feedback and Bluey theme | Execute | Implemented |
| GUARD-09 | P2: Sound | Execute | Implemented |

**Coverage:** 9 total, 9 mapped to tasks, 0 unmapped.

---

## Success Criteria

- [ ] A 4-year-old completes a full round without adult help (real family test)
- [ ] The same build runs on tablet (touch) and laptop (mouse) with no adjustment
- [ ] No game state blocks progression (dropping outside, multi-touch, resize, reload)

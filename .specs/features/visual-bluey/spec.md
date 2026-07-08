# Visual Bluey Specification

## Problem Statement

The game works, but visually it's a generic low-poly room with flat materials — it doesn't "look like a Bluey game." To delight a 4-year-old fan of the show, the environment, the character, and the transitions need to feel like the cartoon: the Heeler living room, warm colors, Bluey present and cheering, episode-style transitions.

## Goals

- [ ] Environment recognizable as the Heelers' living room, with cartoon-style (toon) shading and warm light.
- [ ] Bluey present in the scene as a 3D character, reacting to correct matches and to round completion.
- [ ] Animated transitions at all key moments (opening, between rounds, celebration), with no "hard jumps" in visual state.
- [ ] Gameplay mechanic intact: no `hora-de-guardar` requirement regresses (17/17 ACs remain valid).

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Changes to the drag/store mechanic | `hora-de-guardar` feature completed and validated; this feature is visual |
| Camera movement (follow, pan) | Belongs to the `mobile-camera` feature; here we only define the CONTENT of the celebration |
| New audio assets | Existing synthesized WebAudio system is reused/extended |
| Bluey as an active guide (hints) | Dropped by the user; deferred idea |
| Publishing beyond private use | AD-005 — IP boundary maintained |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Bingo in the scene | Optional (P3) | Not explicitly requested by the user; only Bluey is mandatory | y (via discuss) |
| Transition audio | Reuse existing synthesized WebAudio | No new sound assets; GUARD-09 pattern | y (via discuss) |
| Source of Bluey's 3D model | Look for a fan-made GLTF with a license allowing download/private use; if not viable, build a proprietary low-poly procedural model | Explicit user decision (fallback = build, not a 2D billboard) | y |
| Reduced motion (prefers-reduced-motion) | Not handled | Local game for one specific child; outside the usage profile | n (assumption) |
| Exact room composition (furniture beyond the minimum) | Agent's discretion, referencing the episodes | Discuss: agent's discretion | y |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: Stylized Heeler living room ⭐ MVP

**User Story**: As a child who's a Bluey fan, I want to play inside Bluey's living room so I feel like I'm inside the cartoon.

**Why P1**: It's the biggest leap in visual identity; everything else (character, transitions) is built on top of this stage.

**Acceptance Criteria**:

1. WHEN the scene loads THEN the system SHALL render the Heelers' living room containing at least: a sofa, a rug, a window with a view of a sunny backyard, and floor/walls in the cartoon's warm palette (orange/cream/blue tones defined in the design).
2. WHEN the scene renders THEN all environment and toy materials SHALL use toon-style shading (discrete 2–4 band gradient), replacing the current flat Lambert.
3. WHEN the scene renders THEN soft shadows SHALL be active (shadow map) with warm directional light, and moving objects (toys, Bluey) SHALL cast a shadow on the floor.
4. WHEN any official texture/art fails to load THEN the system SHALL keep the corresponding solid-color material and the game SHALL remain playable (GUARD-08.4 pattern preserved).
5. WHEN the game runs THEN the furniture SHALL stay clear of the drag routes (no piece of furniture between spawn points and boxes that hides a dragged toy).

**Independent Test**: Open the game and see the Heeler living room with shadows and toon shading; screenshot compared to the previous state; drag a toy to each box without occlusion.

---

### P1: Bluey in the scene (cheering and celebrating) ⭐ MVP

**User Story**: As a child, I want to see Bluey cheering for me when I get it right, so the game feels like a real Bluey game.

**Why P1**: "Her appearing" was an explicit request; it's the heart of the identity.

**Acceptance Criteria**:

1. WHEN the game starts THEN Bluey SHALL be visible in a cheering position (corner of the room) executing a continuous idle animation (sway/breathing).
2. WHEN a toy is stored in the correct box THEN Bluey SHALL execute a short celebration animation (≤ 2 s) and return to idle.
3. WHEN the round is completed THEN Bluey SHALL move to the center of the room and execute a dance animation during the celebration, returning to the cheering position when the new round begins.
4. WHEN the fan-made GLTF model is available and loads THEN the system SHALL use it; WHEN loading fails or no model was obtained THEN the system SHALL use the proprietary low-poly procedural Bluey, and the test hook SHALL report `bluey.source` as `'gltf'` or `'procedural'`.
5. WHEN the child drags a toy THEN Bluey SHALL be ignored by the drag raycast (never intercepts the touch) and her animation SHALL never block or delay input.
6. WHEN Bluey is cheering and a new correct match occurs before the animation ends THEN the system SHALL restart the celebration without inconsistent state (state machine: idle → cheer → idle; cheer re-entrant).

**Independent Test**: Get a toy right → Bluey jumps; complete the round → Bluey dances in the center; force a model failure (missing file) → procedural Bluey appears and `window.__game.state().bluey.source === 'procedural'`.

---

### P1: Cartoon-style transitions ⭐ MVP

**User Story**: As a child, I want the game to open and switch rounds like an episode of the cartoon, with no hard cuts.

**Why P1**: Explicit request ("with transitions"); eliminates the current visual "jumps" (toys popping in on round change).

**Acceptance Criteria**:

1. WHEN the play button is tapped THEN an opening transition (circular iris/wipe) SHALL reveal the game, with a duration between 0.8 s and 2.5 s.
2. WHEN the round-complete celebration ends THEN a transition (iris closes → toys swap → iris opens) SHALL cover the removal of the old toys and the spawn of the new ones, so that new toys never appear without a transition.
3. WHEN a transition is active THEN drag input SHALL be ignored, and WHEN the transition ends THEN input SHALL resume working immediately.
4. WHEN the transition state changes THEN the test hook SHALL expose the current state (`transition: 'none' | 'opening' | 'closing'`) for deterministic asserts.
5. WHEN two transition conditions coincide (e.g., round complete during another transition) THEN the system SHALL queue/ignore deterministically — never two overlapping transitions.

**Independent Test**: Tap play and see the iris open; complete a round and see the iris close/open on the swap; try to drag during the transition and nothing happens.

---

### P2: Cinematic celebration (content)

**User Story**: As a child, I want a real party when I put everything away — confetti, stars, and Bluey dancing.

**Why P2**: Amplifies the reward; depends on the camera (feature `mobile-camera`) for the pan, but the visual content belongs to this feature.

**Acceptance Criteria**:

1. WHEN the round is completed THEN the system SHALL emit colorful confetti/stars (particles) during the celebration, ending before the round transition.
2. WHEN the celebration occurs THEN the effects SHALL use the Bluey theme palette (design colors) and SHALL be removed from the scene at the end (no leaked objects/memory between rounds).

**Independent Test**: Complete a round and observe confetti + dance; complete 3 rounds in a row and verify the scene's object count doesn't grow.

---

### P3: Bingo cheering along

**User Story**: As a child, I want to see Bingo cheering alongside Bluey.

**Why P3**: Not explicitly requested; adds charm if the cost is low (reusing Bluey's pipeline).

**Acceptance Criteria**:

1. WHEN Bluey's pipeline (model or procedural) is ready and an asset/variation for Bingo is viable THEN Bingo SHALL appear next to Bluey with her own idle and celebration.

---

## Edge Cases

- WHEN the GLTF loads but without embedded animations THEN the system SHALL animate procedurally (code-driven bob/squash) — animation never depends on the asset's clips.
- WHEN an environment texture fails THEN the equivalent solid color is used (existing pattern).
- WHEN the tab sleeps during a transition THEN the existing dt clamp SHALL prevent an animation jump and the transition SHALL complete normally.
- WHEN WebGL is unavailable THEN the current behavior (static message) remains — no transition attempts to run.

---

## Implicit-Requirement Dimensions (sweep — Large)

| Dimension | Resolution |
| --------- | ---------- |
| Input validation & bounds | Covered by AC P1-Transitions-3 (input ignored during transition) and P1-Bluey-5 (raycast ignores Bluey); other inputs unchanged |
| Failure / partial-failure | AC P1-Room-4 and P1-Bluey-4 (asset fallbacks); GLTF-without-animation edge case |
| Idempotency / retry / duplicates | N/A because assets are loaded once with an immediate fallback; no retry by design (project pattern) |
| Auth boundaries & rate limits | N/A because it's a local game with no backend |
| Concurrency / ordering | AC P1-Transitions-5 (transitions never overlap) and P1-Bluey-6 (re-entrant cheer) |
| Data lifecycle / expiry | AC P2-2 (particles removed; no leak); no new persistence |
| Observability | AC P1-Bluey-4 and P1-Transitions-4 (`window.__game` hook exposes `bluey.source` and `transition`); console.warn on asset fallback (existing pattern) |
| External-dependency failure | N/A because there is no runtime network dependency (local assets) |
| State-transition integrity | Explicit state machines: Bluey (idle/cheer/dance) and transition (none/opening/closing) — ACs P1-Bluey-6 and P1-Transitions-5 |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| VIS-01 | P1: Heeler living room (AC 1–3) | T1–T5 | ✅ Verified |
| VIS-02 | P1: Heeler living room (AC 4–5, fallback + clear routes) | T3 | ✅ Verified |
| VIS-03 | P1: Bluey in the scene (AC 1–3, presence + animations) | T6, T8 | ✅ Verified |
| VIS-04 | P1: Bluey in the scene (AC 4, GLTF + procedural fallback + hook) | T7, T8 | ✅ Verified (`'gltf'` branch pending the asset — see validation.md) |
| VIS-05 | P1: Bluey in the scene (AC 5–6, raycast + state machine) | T6 | ✅ Verified |
| VIS-06 | P1: Transitions (AC 1–2, opening + between rounds) | T9, T10 | ✅ Verified |
| VIS-07 | P1: Transitions (AC 3–5, input gate + hook + no overlap) | T9, T10 | ✅ Verified |
| VIS-08 | P2: Celebration (AC 1–2, particles + cleanup) | - | Pending (P2, out of this delivery) |
| VIS-09 | P3: Bingo | - | Pending (P3, out of this delivery) |

**Coverage:** 9 total, 7 verified (P1 complete — Verifier PASS 2026-07-08, `validation.md`), 2 pending (P2/P3, not scoped)

---

## Success Criteria

- [ ] Someone familiar with the show recognizes the Heeler living room in a screenshot with no context.
- [ ] Full flow (open → play → complete round → new round) with no hard visual cut.
- [ ] Existing Vitest suite stays green (no regression in `hora-de-guardar`).
- [ ] Game stays smooth on a modest phone (manual/e2e validation: no perceptible stutter while dragging).

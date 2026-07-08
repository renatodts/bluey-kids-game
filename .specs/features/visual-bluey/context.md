# Visual Bluey Context

**Gathered:** 2026-07-08
**Spec:** `.specs/features/visual-bluey/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Transform the game's visuals to "look like a Bluey game": a stylized 3D Heeler living room, materials/lighting with a cartoon feel, a 3D Bluey character present in the scene (cheering/celebrating), and animated transitions (opening, between rounds, cinematic celebration). The gameplay mechanic (dragging toys into boxes) does NOT change.

---

## Implementation Decisions

### Bluey Character

- Fan-made 3D model (free GLTF, license compatible with private use).
- **Fallback if no usable model is found: build a proprietary low-poly Bluey, procedural in Three.js** (in the style of the current toys, more elaborate). Explicit user decision — do not fall back to a 2D billboard.
- Role: **cheering and celebrating**. Bluey stays in a corner watching; jumps/cheers on every correct match; dances in the center when the round is complete. Never interferes with dragging.

### Environment

- **Stylized Heeler living room**: procedural recreation of the living room in Bluey's house — sofa, rug, window with a sunny backyard, warm colors from the show.
- Toon/gradient materials, soft shadows, warm light.

### Transitions (all three selected)

- **Cartoon-style opening**: themed start screen with an animated transition (circular wipe/iris, like an episode opening) when play is tapped.
- **Between rounds**: animated transition (iris or card wipe) before the new toys appear.
- **Cinematic celebration**: on round completion, a short camera pass through the room with confetti/stars while Bluey dances. (The camera mechanics belong to the `mobile-camera` feature; this feature defines the CONTENT of the celebration.)

### Agent's Discretion

- Exact choice of furniture, palette, and room composition (reference: show episodes).
- Toon shading technique (gradient map vs. custom shader).
- Exact duration/curves of the transitions (within the spec's limits).

### Declined / Undiscussed Gray Areas → Assumptions

- Bingo (sister) in the scene: assumed **optional/P3** — not explicitly requested by the user; only Bluey is mandatory.
- New sounds for transitions: assumed to reuse/extend the existing synthesized WebAudio system (GUARD-09), with no new audio assets.

---

## Specific References

- "It has to look like a Bluey game" — visual fidelity to the show (Ludo Studio's 2D animation): saturated, warm colors, rounded shapes, no realism.
- Official art already available in `assets/bluey/` (frames, plaques, bluey-cheer.png) — keep using it where it fits.
- IP boundary: AD-005 (private family use).

---

## Deferred Ideas

- Bluey as an active guide (pointing to the correct box as a hint) — dropped by the user this round; possible future "hints" feature.

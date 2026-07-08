# Mobile Camera & Fullscreen Context

**Gathered:** 2026-07-08
**Spec:** `.specs/features/mobile-camera/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Make the game work well on mobile in full viewport, served on the local network via IP: fullscreen in landscape, and a "living camera" that moves automatically to give a sense of a moving environment and focus on the action. The child NEVER controls the camera directly.

---

## Implementation Decisions

### Automatic living camera

- User's choice: **automatic living camera** (not manual pan). Keeps the spirit of AD-002 — the child doesn't control the camera — but the framing is no longer static:
  - Smoothly approaches the toy being dragged (follow with easing).
  - Frames the box on a hit.
  - Does a short tour during the celebration of a completed round (content defined in the `visual-bluey` feature).
  - Returns to the diorama framing when idle.

### Fullscreen and orientation

- The play button requests **fullscreen** and locks **landscape** (best effort — iOS Safari doesn't support the Fullscreen API/orientation lock on iPhone; in those cases, full viewport via CSS/meta is the maximum possible).
- In portrait, a visual "turn your phone" warning (no long text; icon/animation — for a 4-year-old audience).

### Serving on the local network

- The game is accessed via an `http://IP:port` link — Vite server with `--host` (dev and preview). No API that requires a secure context may be a gameplay requirement.

### Agent's Discretion

- Easing curves, distances, and exact camera limits (as long as the room never "loses" the framing).
- Implementation of the portrait warning (CSS overlay vs. scene).

### Declined / Undiscussed Gray Areas → Assumptions

- Manual finger pan: **dropped** by the user (chose pure automatic).
- PWA/installable: assumed out of scope — access is via a direct browser link.
- Vibration (haptics) on a hit: assumed out of scope — not requested.

---

## Specific References

- "Will be played on mobile via a server link with an IP" — local network, plain HTTP.
- AD-002 remains in spirit (no camera control by the child); the fixed framing is revised to "automatic camera with return to the diorama."

---

## Deferred Ideas

- Light manual pan adjustment (combined with automatic) — option not chosen; a future candidate if the automatic camera isn't enough.

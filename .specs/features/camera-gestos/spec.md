# Camera Gestos Specification

## Problem Statement

The current camera controls (ad-hoc v1, not committed) were hand-written: no inertia/damping, raw rotation speed (2π per screen height), noisy two-finger math (pan via pointer + unstable twist). The result is a "stiff" and imprecise camera, especially on mobile. Research (Context7, `/yomotsu/camera-controls`) confirms that the market standard for mobile 3D games/viewers is: actions mapped by finger count, smooth damping during and after the gesture, and declarative limits — all solved by the `camera-controls` library.

## Goals

- [ ] Camera that feels like a mobile map/game app: smooth, predictable, no jitter.
- [ ] Gestures mapped by finger count (1 = orbit, 2 = pinch-zoom + pan, 3 = pan).
- [ ] Full web version for mouse (left orbits, right pans, wheel zooms at the cursor).
- [ ] Zero regression in toy dragging (absolute gameplay priority).

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Twist (two-finger rotation) | Removed on purpose: source of v1's imprecision; the mobile 3D game standard is 1-finger orbit / 2-finger zoom+pan |
| Fullscreen / orientation / portrait overlay | Feature `mobile-camera` (the fullscreen part remains pending) |
| Automatic camera (follow/emphasis/tour) | The "living camera" part of `mobile-camera` is superseded — the user opted for manual gestural control |
| Long inertia (list-style fling) | A short smoothTime is enough; a long fling would disorient a 4-year-old |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| "quantidade de dados" (amount of data) in the request | Interpreted as "quantidade de deDOS" (amount of fingers) (action map by number of fingers) | The only reading coherent with "gestures" + "web version for mouse" | n (logged) |
| Hand-rewrite vs. library | Use `camera-controls` (yomotsu) — battle-tested, SmoothDamp damping, `touches.one/two/three`, `mouseButtons`, native limits and `setBoundary` | Verification chain: Context7 `/yomotsu/camera-controls` (High reputation, 234 snippets); rebuilding damping/gestures by hand would repeat v1's mistake | n (logged) |
| Gesture map | 1 finger=orbit, 2 fingers=pinch-zoom+pan (`TOUCH_DOLLY_TRUCK`), 3 fingers=pan (`TOUCH_TRUCK`); mouse: left=orbit, right=pan (`TRUCK`), middle+wheel=zoom (`dollyToCursor`) | Library defaults ≈ market standard (Google Maps/model viewers) | n (logged) |
| Smoothness tuning | `draggingSmoothTime` ≈ 0.06 s (direct response with micro-smoothing), `smoothTime` ≈ 0.25 s (post-gesture settling) | Agent's discretion; invariant: immediate perceptible response (the child's hand is in charge), no long fling | n (logged) |
| Limits inherited from v1 | distance [3, 26], polar [0.12, π/2−0.06], target locked to the room via `setBoundary` (v1's box) | Values already validated in-game in v1 | y (existing code) |
| Opening (close-up pull-back on Bluey) | Kept as the existing manual lerp; on finish, the controls sync the pose (`setLookAt` without transition) and enable | Behavior already covered by the updated e2e scenarios; do not reintroduce risk | n (logged) |
| Uncommitted ad-hoc work | Commit as a baseline before the rebuild | Preserves history and keeps the feature's diff clean/atomic | n (logged) |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: Touch gestures by finger count ⭐ MVP

**User Story**: As a player on mobile, I want to control the camera with gestures I already know from other 3D apps, so I can explore the room naturally.

**Acceptance Criteria**:

1. WHEN 1 finger drags on free area (a touch that didn't start on a toy) THEN the camera SHALL orbit around the target, with smoothing during the gesture (no sharp jumps per event).
2. WHEN 2 fingers move apart/together (pinch) THEN the camera distance SHALL decrease/increase; WHEN the 2 fingers translate together THEN the target SHALL pan — both within the same continuous gesture.
3. WHEN 3 fingers drag THEN the camera SHALL pan purely (no zoom/rotation).
4. WHEN the gesture ends THEN the movement SHALL settle smoothly (short damping), stopping completely — no continuous drift.
5. WHEN any gesture reaches the limits THEN the system SHALL respect them: distance ∈ [3, 26], polar angle never below the floor (≤ π/2−0.06), target inside the room's box.

**Independent Test**: In e2e (touch viewport), synthetic pointer event dispatch: 1 finger changes azimuth; pinch changes `camera.distance`; asserts via `window.__game.state().camera`.

---

### P1: Web version for mouse ⭐ MVP

**User Story**: As a player on desktop, I want to control the camera with the mouse, so the web version is a complete game.

**Acceptance Criteria**:

1. WHEN the left button drags on free area THEN the camera SHALL orbit.
2. WHEN the right button drags THEN the camera SHALL pan; the context menu SHALL remain suppressed on the canvas.
3. WHEN the mouse wheel scrolls THEN the camera SHALL zoom toward the cursor (`dollyToCursor`), respecting the distance limits.

**Independent Test**: In e2e (desktop viewport), left-button drag changes azimuth; wheel changes `camera.distance`; asserts via the hook.

---

### P1: Gameplay integration ⭐ MVP

**User Story**: As a child, I want picking up a toy to keep working exactly as before, even with a controllable camera.

**Acceptance Criteria**:

1. WHEN a touch/click starts on a toy THEN dragging the toy SHALL take priority and the camera SHALL remain still for that pointer (controls disabled for the whole drag; re-enabled on drop).
2. WHEN the opening (close-up pull-back on Bluey) is active THEN gestures SHALL be disabled; WHEN the opening ends THEN the controls SHALL take over the exact pose from the end of the opening (no visible jump) and enable.
3. WHEN controls are disabled mid-gesture THEN the gesture SHALL die immediately (no residual camera movement).
4. WHEN the state is queried THEN `window.__game.state().camera` SHALL expose `{ intro, gesturesEnabled, position: [x,y,z], target: [x,y,z], distance }` (numbers with 2 decimal places) for deterministic asserts.

**Independent Test**: e2e: pointerdown on a toy + moves → camera pose unchanged and toy `dragging`; at the end of the opening, `gesturesEnabled === true` and pose equal to the gameplay view.

---

## Edge Cases

- WHEN a 3rd finger lands on a toy during a 2-finger gesture THEN no toy drag SHALL start (existing guard in `drag.js` kept).
- WHEN `pointercancel` occurs mid-gesture THEN the gesture SHALL end cleanly (next touch starts fresh).
- WHEN a resize occurs during a gesture THEN the camera SHALL remain valid (no NaN/jump).
- WHEN the tab sleeps and wakes THEN the existing dt clamp SHALL prevent camera teleportation in `update`.

## Implicit-Requirement Dimensions (Medium)

| Dimension | Resolution |
| --------- | ---------- |
| Input validation & bounds | Gestures AC5 (distance/polar/boundary limits) |
| Concurrency / ordering | Integration AC1/AC3 + 3rd-finger edge case (drag × camera never simultaneous) |
| State-transition integrity | Integration AC2 (intro → gestures, pose handoff without a jump) |
| Observability | Integration AC4 (`camera` hook with numeric pose) |
| Other dimensions | N/A for this scope (no persistence, network, auth) |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| CAMG-01 | P1 Touch gestures (AC 1–4, finger map + damping) | Tasks | Pending |
| CAMG-02 | P1 Touch gestures (AC 5, limits/boundary) | Tasks | Pending |
| CAMG-03 | P1 Mouse (AC 1–3) | Tasks | Pending |
| CAMG-04 | P1 Integration (AC 1, drag priority) | Tasks | Pending |
| CAMG-05 | P1 Integration (AC 2–3, opening + gesture kill) | Tasks | Pending |
| CAMG-06 | P1 Integration (AC 4, observable hook) | Tasks | Pending |

**Coverage:** 6 total, 0 mapped to tasks, 6 unmapped ⚠️ (pre-tasks)

---

## Success Criteria

- [ ] Smooth and predictable camera on touch and mouse (e2e + manual validation).
- [ ] No regression: Vitest suite green, e2e scenarios 01–05 remain valid, toy dragging intact.
- [ ] `src/camera-controls.js` v1 replaced by the integration with `camera-controls` (yomotsu) — less custom code, market-standard behavior.

# Mobile Camera & Fullscreen Specification

## Problem Statement

The game will be played on a phone via a link on the local network, but today the mobile experience is passive: a camera fixed on a diorama, no guaranteed fullscreen, and portrait mode only "pulls the camera back." To feel like a real game on mobile, it needs a full landscape viewport and an environment that moves — a living camera that focuses on the action on its own, without handing camera control to the child.

## Goals

- [ ] Game in full landscape screen on mobile, accessed via `http://IP:port` on the local network.
- [ ] Living camera: follows the drag, emphasizes the hit, tours during the celebration, returns to the diorama — 100% automatic.
- [ ] Dragging remains precise during any camera movement (the toy never "detaches" from the finger).

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Manual pan/zoom by the child | Dropped during discuss; AD-002 (spirit) kept |
| PWA / installable / offline | Access is via a direct browser link |
| Vibration (haptics) | Not requested |
| Visual celebration content (confetti, dance) | Feature `visual-bluey`; here only the camera MOVEMENT |
| Desktop support beyond current | Desktop keeps working, but the tuning target is mobile |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| iOS Safari (iPhone) without Fullscreen API | Best effort: full viewport via CSS/meta; fullscreen only where the API exists | Known platform limitation; silent failure | y (via discuss) |
| Orientation lock unavailable outside fullscreen | Attempt lock only with fullscreen active; otherwise, the "turn your phone" overlay covers the case | Screen Orientation lock requires fullscreen in most browsers | y (via discuss) |
| Portrait during gameplay | Visual "turn your phone" overlay + game paused (replaces the current "pull the camera back in portrait" behavior) | User's choice: fullscreen landscape; supersedes part of e2e scenario 05 | y |
| Exact camera curves/limits | Agent's discretion, with the invariant: the 3 boxes and the dragged toy are always in frame | Discuss: agent's discretion | y |
| LAN server | `vite --host` (dev) and `vite preview --host` (production); documented in the README | Already supported by Vite; no new code beyond config/docs | y |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: Full landscape screen on mobile ⭐ MVP

**User Story**: As a parent, I want to open the link on the phone and have the game fill the whole screen in landscape, so the child can play without browser bar distractions.

**Why P1**: It's the delivery requirement ("played on mobile via link"); without it nothing else matters.

**Acceptance Criteria**:

1. WHEN the play button is tapped in a browser with the Fullscreen API THEN the system SHALL request fullscreen within the same gesture; WHEN the API doesn't exist or the request fails THEN the game SHALL continue in full viewport with no visible error.
2. WHEN fullscreen is obtained and the Screen Orientation API allows locking THEN the system SHALL lock to landscape; failure SHALL be silent.
3. WHEN the viewport is in portrait (aspect < 1) outside the start screen THEN the system SHALL show a visual "turn your phone" overlay (animated icon, not dependent on reading) and SHALL ignore game input; WHEN the viewport returns to landscape THEN the overlay SHALL disappear and the game SHALL resume in the state it was in.
4. WHEN the game is served via plain HTTP on the local network (`http://IP:port`) THEN all game features SHALL operate — no gameplay requirement depends on a secure context.
5. WHEN the portrait overlay appears during a drag THEN the toy SHALL be dropped in place (same behavior as the existing resilient cancel).

**Independent Test**: Open `http://IP:port` on a phone, tap play → full landscape screen; rotate to portrait → overlay appears and game pauses; rotate back → game resumes.

---

### P1: Automatic living camera ⭐ MVP

**User Story**: As a child, I want the world to move and get close to where I'm interacting, so the game feels alive — without me having to control anything.

**Why P1**: Central request ("moving environment, controlling the focus"); solves the feeling of a static game.

**Acceptance Criteria**:

1. WHEN a toy is picked up (drag start) THEN the camera SHALL start a smooth approach (easing, no cuts) toward the toy, and throughout the drag SHALL keep the toy AND the three boxes within the frame.
2. WHEN the toy is dropped (any outcome) THEN the camera SHALL smoothly return to the diorama framing within at most 2 s.
3. WHEN a toy is successfully put away THEN the camera SHALL perform a brief emphasis on the box (push-in ≤ 1 s) before returning, without preventing the child from picking up another toy immediately (a new drag start cancels the emphasis and takes over the follow).
4. WHEN the round is completed THEN the camera SHALL perform a short tour of the room during the celebration and SHALL be back at the diorama framing by the time the new round becomes interactive.
5. WHEN the camera is in any motion THEN the drag raycast SHALL use the current camera pose every frame — the dragged toy SHALL stay under the finger (imperceptible projection error).
6. WHEN the child touches the background (outside toys) THEN the camera SHALL remain unchanged (no direct camera control).
7. WHEN the camera state changes THEN the test hook SHALL expose the current mode (`camera.mode: 'idle' | 'follow' | 'emphasis' | 'celebrate' | 'return'`) and the pose SHALL be deterministic given the same state + dt (pure testable module, AD-004 pattern).

**Independent Test**: Drag a toy and watch the camera follow smoothly; release it and watch it return; complete a round and watch the tour; asserts via `window.__game.state().camera.mode` in e2e.

---

### P2: Mobile quality (viewport and performance)

**User Story**: As a parent, I want the game to run smoothly on the family's phone, with no stretched screen or stutters.

**Why P2**: Fine tuning; P1 delivers the functional part.

**Acceptance Criteria**:

1. WHEN the game runs in fullscreen THEN the canvas SHALL cover 100% of the visible viewport (including notch/safe-area regions, via `viewport-fit=cover`) with no scrollbars or aspect distortion.
2. WHEN the device has a high devicePixelRatio THEN the renderer SHALL remain capped (existing pixel ratio cap ≤ 2) to preserve performance.
3. WHEN camera movement occurs on a modest phone THEN it SHALL stay fluid (manual/e2e validation: dragging with no perceptible stutter).

**Independent Test**: Play on a real phone via LAN and observe full screen coverage and fluid camera follow.

---

## Edge Cases

- WHEN the user exits fullscreen manually (system gesture) THEN the game SHALL remain playable in normal viewport; the next tap on play (if a start screen is visible) may re-request it.
- WHEN resize/orientationchange occurs during camera movement THEN the framing SHALL recompute with no NaN/jump (integrates with the existing resilient resize).
- WHEN the tab sleeps and wakes during follow THEN the existing dt clamp SHALL prevent camera teleportation.
- WHEN a round completes while the finger is still on the screen THEN the celebration tour SHALL wait for the drop (follow → celebrate state transition only after release).

---

## Implicit-Requirement Dimensions (sweep — Large)

| Dimension | Resolution |
| --------- | ---------- |
| Input validation & bounds | Camera-AC1 (bounded framing: boxes always visible), Fullscreen-AC3/5 (input ignored in portrait, resilient drop) |
| Failure / partial-failure | Fullscreen-AC1/2 (APIs missing/failing → silent); edge case of manual fullscreen exit |
| Idempotency / retry / duplicates | Repeated fullscreen requests are harmless (idempotent by the API's nature); N/A beyond that |
| Auth boundaries & rate limits | N/A because the game is local with no backend |
| Concurrency / ordering | Camera-AC3 (new drag cancels emphasis), edge case celebrate-after-drop; camera state machine with explicit transitions |
| Data lifecycle / expiry | N/A because no new persistence |
| Observability | Camera-AC7 (hook exposes `camera.mode`); portrait overlay observable via DOM |
| External-dependency failure | N/A because no runtime network dependency; serving via LAN is infra (Vite `--host`) |
| State-transition integrity | Camera-AC7 + edge cases: idle/follow/emphasis/celebrate/return state machine with valid, deterministic transitions |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| MOB-01 | P1: Fullscreen (AC 1–2, fullscreen + best-effort lock) | Design | Pending |
| MOB-02 | P1: Fullscreen (AC 3, 5, portrait overlay + pause) | Design | Pending |
| MOB-03 | P1: Fullscreen (AC 4, LAN HTTP without secure context) | Design | Pending |
| MOB-04 | P1: Living camera (AC 1–2, follow + return) | Design | Pending |
| MOB-05 | P1: Living camera (AC 3–4, emphasis + celebration tour) | Design | Pending |
| MOB-06 | P1: Living camera (AC 5–6, per-frame raycast + no manual control) | Design | Pending |
| MOB-07 | P1: Living camera (AC 7, pure module + hook) | Design | Pending |
| MOB-08 | P2: Mobile quality (AC 1–3) | Design | Pending |

**Coverage:** 8 total, 0 mapped to tasks, 8 unmapped ⚠️ (pre-design)

---

## Success Criteria

- [ ] Child plays on mobile via link, full landscape screen, from start to end of a round, with no adult interaction beyond opening the link and tapping play.
- [ ] Camera moves at every key moment and never leaves the child "lost" (diorama always restored when idle).
- [ ] No regression: Vitest suite green; existing e2e scenarios pass (scenario 05 updated for the new portrait behavior).

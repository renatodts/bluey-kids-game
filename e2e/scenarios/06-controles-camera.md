# Scenario 06 — Camera controls (finger-count gestures + mouse)

Feature `camera-gestos` (CAMG-01..06). Executed by an agent via Playwright
MCP, conventions from previous scenarios (dev server, `window.__game` hook).

The pose is asserted via `state().camera`: `{ intro, gesturesEnabled, position:
[x,y,z], target: [x,y,z], distance }` (2 decimal places). Gesture events are
synthetic PointerEvents dispatched on the canvas (`bubbles: true`, distinct
`pointerId`s, `pointerType` per the part). "Free area" = a point that doesn't
hit a toy (e.g. the tall wall, y≈200 in the desktop viewport).

## Part A — Desktop mouse (1280×800)

1. Navigate with `localStorage` cleared; tap play; wait for
   `camera.intro === false` (~3s).
   **Assert (CAMG-05)**: `gesturesEnabled === true`; record `pose0`.
2. **CAMG-03.1 (orbit, left button)**: `pointerdown` (button 0, mouse) on a
   free area → ~6 `pointermove` of +25px in x → `pointerup`. Wait ~400ms
   (settling).
   **Assert**: `position` changed vs `pose0` (Δ > 0.1 on some axis); `target`
   unchanged (Δ < 0.05 per axis); `distance` preserved (Δ < 0.15).
3. **CAMG-01.4 (settles without drift)**: read the pose twice with ~300ms
   between reads.
   **Assert**: readings identical (Δ ≤ 0.01 per component).
4. **CAMG-03.3 + CAMG-02 (wheel / zoom-to-cursor + limit)**: ~5 `wheel`
   events with `deltaY < 0` at the center. **Assert**: `distance` decreased.
   Then ~40 `wheel` events with `deltaY > 0`. **Assert**: `distance ≤ 26`
   (max clamp). Restore with a few wheel-in events.
5. **CAMG-03.2 (pan, right button)**: `pointerdown` (button 2) on a free area →
   ~6 `pointermove` of −20px x / −10px y → `pointerup`.
   **Assert**: `target` changed (Δ > 0.05) and stays within the room's bounding
   box (x ∈ [−7,7], y ∈ [0,4], z ∈ [−3.4,6.4]); no context menu visible.
6. **CAMG-04 (drag priority)**: `seed(606)`; `pointerdown` at the `screenPos`
   of an idle toy → identify the `'dragging'` one → ~5 moves.
   **Assert**: during the drag `gesturesEnabled === false` and `position`
   identical to pre-drag (Δ ≤ 0.01). Release over the correct box.
   **Assert**: toy `'stored'`; `gesturesEnabled === true` after the drop.
7. Evidence screenshot: `e2e-06-desktop.jpeg`.

## Part B — Touch (390×844 functional portrait)

8. `browser_resize` 390×844; reload cleared; play; wait for
   `camera.intro === false`; record `poseB0`.
9. **CAMG-01.1 (1-finger orbit)**: touch `pointerdown` on a free area → ~6
   moves of +18px x → `pointerup`. Wait ~400ms.
   **Assert**: `position` changed; `target` unchanged (Δ < 0.05); `distance`
   preserved (Δ < 0.15).
10. **CAMG-01.2 (2 fingers: pinch-zoom + pan in the same gesture)**: 2 touch
    pointers (distinct ids) `pointerdown` ~80px apart → moves spreading them
    apart (pinch-out, +Δdist between fingers) → `pointerup` both.
    **Assert**: `distance` decreased (zoom-in) vs `poseB0`.
    New gesture: 2 fingers translating together +30px x.
    **Assert**: `target` changed (pan) while staying within the room's box.
11. **CAMG-01.3 (3 fingers: pure pan)**: 3 touch pointers `pointerdown` →
    joint moves of −20px x → `pointerup` all. Record `distance` before/after.
    **Assert**: `target` changed; `distance` preserved (Δ < 0.2).
12. **CAMG-05 (gesture kill)**: start 1 finger on a free area with moves;
    `seed(707)` and, with the camera finger still active, read the pose, then
    dispatch `pointercancel`. **Assert**: no NaN in any component; a new
    reading after ~300ms is stable (Δ ≤ 0.01).
13. Evidence screenshot: `e2e-06-touch.jpeg`.

## Log

Result (date, green/red per step, deviations) recorded by the agent in the
run report; failure on any assertion = scenario red.

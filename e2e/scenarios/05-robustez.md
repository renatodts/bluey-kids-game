# Scenario 05 — Robustness: resize mid-drag, portrait, pointercancel, WebGL (GUARD-07 + edge cases)

Executed by an agent via Playwright MCP. Conventions from previous scenarios
(assertions via `__game.state()`, dragged toy = the one reporting `'dragging'`).

---

## Part A — Desktop 1280×800 (pointerType `mouse`)

1. Navigate with `localStorage` cleared; tap play; wait for
   `camera.intro === false` (opening pull-back, ~3s); `seed(808)`.
   **Assert**: `round === 1`, 6 `'idle'` toys, `phase === 'playing'`.
2. **GUARD-07.2 (resize during drag)**: `pointerdown` on an idle toy,
   ~3 `pointermove` toward the correct box; `browser_resize` 900×900 with the
   drag ACTIVE; recompute `screenPos` (camera changed) and continue the moves
   to the correct box; release.
   **Assert (mid-resize)**: the toy keeps `'dragging'` after the resize.
   **Assert (final)**: toy `'stored'` — nothing broke.
3. **Edge case (pointercancel = released outside)**: start dragging another
   toy, ~3 moves, dispatch `pointercancel` (same pointerId).
   **Assert**: the toy goes back to `'idle'` (released as "outside", settles
   on the floor — no success from screen parallax on cancel); afterwards a
   new `pointerdown` on it grabs it normally (`'dragging'`) — release outside
   a box again.
4. Evidence screenshot: `e2e-05-desktop.jpeg`.

## Part B — Portrait 390×844 (pointerType `touch`)

5. `browser_resize` 390×844; reload cleared; play; wait for
   `camera.intro === false`; `seed(909)`.
   **Assert**: scene functional (6 idle toys).
6. **GUARD-07 (portrait functional)**: drag a toy to the correct box
   (touch) and release over the box.
   **Assert**: `'stored'`.
7. Evidence screenshot: `e2e-05-retrato.jpeg`.

## Part C — WebGL unavailable

8. Navigate to the URL with `#nowebgl` (test hook that simulates the absence
   of WebGL) and reload.
   **Assert**: `#webgl-error` element present and visible with a static
   message; `window.__game === undefined` (game does not initialize); play
   overlay removed.
9. Evidence screenshot: `e2e-05-nowebgl.jpeg`. Return to the URL without the hash.

## Green when

- All assertions confirmed.
- Console free of errors other than: a favicon 404 and the intentional
  "WebGL unavailable" error from Part C.
- Screenshots captured.

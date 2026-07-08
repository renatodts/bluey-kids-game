# Scenario 01 — Drag and put away (GUARD-01, GUARD-02, GUARD-03)

Executed by an agent via Playwright MCP against `npm run dev`.
Pointer Events are dispatched with `browser_evaluate` using coordinates from
`window.__game.screenPos(id)` — the WebGL canvas is opaque to the
accessibility snapshot, so ALL assertions are made against
`window.__game.state()`.

**Drag helper** (used in the steps): dispatch on `#game-canvas` a
`pointerdown` at the origin coordinate, ~8 interpolated `pointermove` events
to the destination, and `pointerup` at the destination — always with the same
`pointerId` and `pointerType` as specified by the step (`mouse` on desktop,
`touch` on mobile).

**Selecting the dragged toy**: toys can overlap on screen; per spec, the
touch grabs the one closest to the camera (first raycast hit). After the
`pointerdown`, the toy actually being dragged is whichever one `state()`
reports as `'dragging'` — the following steps use THAT toy (and its type)
to pick the correct/incorrect box, never the initial assumption.

---

## Part A — Desktop (viewport 1280×800, pointerType `mouse`)

1. `browser_resize` 1280×800; navigate to the dev server with `localStorage`
   cleared (clear the `hora-de-guardar:round` key and reload).
2. Tap the play button (overlay disappears). Wait for `state().camera.intro === false`
   — the opening pulls the camera back from the close-up on Bluey to the game
   view (~3s) and input is blocked during the pull-back.
   **Assert**: overlay `#start-overlay` has the `hidden` class;
   `state().camera.gesturesEnabled === true` at the end of the pull-back.
3. `window.__game.seed(101)` — deterministic round.
   **Assert**: `state().round === 1`, `state().toys.length === 6`,
   all `state === 'idle'`, 2 toys per type, `phase === 'playing'`.
4. **GUARD-01 (follows the pointer)**: pick the first ball (`type === 'ball'`,
   `state === 'idle'`). `pointerdown` at `screenPos(ballId)`, move 2 steps.
   **Assert (mid-drag)**: the ball's `state()` === `'dragging'`.
5. **GUARD-01 (second pointer ignored)**: with the drag active, dispatch
   `pointerdown` with a different `pointerId` over another idle toy.
   **Assert**: the other toy remains `'idle'`; the ball remains `'dragging'`.
6. **GUARD-02 (correct box)**: continue the movement to `screenPos('ball')`
   (basket) and release (`pointerup`).
   **Assert**: ball === `'stored'`; the remaining toys are `'idle'`.
7. **GUARD-03 (wrong box)**: record `screenPos(blockId)` (spawn); drag a
   block (`type === 'block'`) to the basket (`screenPos('ball')`) and release.
   **Assert**: block === `'rejected'` on the logical return → final state
   `'idle'` and `screenPos(blockId)` returns to the recorded spawn point
   (tolerance ±10px).
8. **GUARD-03 (dropped outside)**: drag a plush toy (`type === 'plush'`) to an
   empty spot on the floor (screenPos between spawn and boxes, at least
   snapRadius away from any box) and release.
   **Assert**: plush === `'idle'` and `screenPos(plushId)` stays close to
   the release point (settled where it was dropped, ±25px), did NOT return
   to spawn.
9. Evidence screenshot: `e2e-01-desktop.jpeg`.

## Part B — Mobile touch (viewport 390×844, pointerType `touch`)

10. `browser_resize` 390×844; reload with `localStorage` cleared; tap play;
    wait for `camera.intro === false`; `seed(202)`.
    **Assert**: `round === 1`, 6 idle toys, `phase === 'playing'`.
11. **GUARD-02 (touch)**: drag a ball to the basket with `pointerType: 'touch'`.
    **Assert**: ball === `'stored'`.
12. **GUARD-01 (multi-touch)**: start dragging a block (touch, pointerId 1);
    while it's active, `pointerdown` with a second finger (pointerId 2) over
    another toy.
    **Assert**: the second toy remains `'idle'`; the block keeps `'dragging'`.
13. **GUARD-03 (touch, wrong box)**: finish the block's drag by releasing on
    the bed (`screenPos('plush')`).
    **Assert**: block === `'idle'` (rejected and returned).
14. Evidence screenshot: `e2e-01-mobile.jpeg`.

## Green when

- All assertions above are confirmed (state via `__game.state()`).
- No console errors other than a favicon 404.
- Evidence screenshots captured.

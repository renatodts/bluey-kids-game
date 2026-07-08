# Scenario 02 — Complete round, celebration, transitions and persistence (GUARD-04, GUARD-05, GUARD-06, VIS-03, VIS-06, VIS-07)

Executed by an agent via Playwright MCP. Same conventions as scenario 01:
assertions against `window.__game.state()`, dragging via synthetic Pointer
Events at coordinates from `window.__game.screenPos(id)`, and the toy
actually being dragged is whichever one `state()` reports as `'dragging'`
after the `pointerdown` (use THAT toy and its type to pick the correct box).

Animations (T9): wait ~0.7s between drags so the tweens don't overlap picks;
state assertions can be immediate.

Transitions (VIS-06/07): the hook exposes `state().transition`
(`'none' | 'opening' | 'closing'`). While `transition !== 'none'`, drag input
is ignored — wait for `transition === 'none'` before each sequence of drags.

---

## Steps (viewport 1280×800, pointerType `mouse`)

1. `browser_resize` 1280×800; navigate with `localStorage` cleared (remove
   the `hora-de-guardar:round` key and reload); tap play.
   **Assert (VIS-06.1)**: right after play, `transition === 'opening'`
   (opening iris in progress); within ~1.5s, `transition === 'none'`.
   Also wait for `camera.intro === false` (pull-back from the close-up on
   Bluey, ~3s; input blocked while it lasts). Then `window.__game.seed(303)`.
   **Assert**: `round === 1`, `toys.length === 6`, all `'idle'`, `phase === 'playing'`.
   **Assert (WIN-02/03, HUD zeroed)**: `progress` = `{ round: 1, totalRounds: 3,
   stored: 0, total: 6, starsLit: 0 }`; on screen, no star in `#hud` has the
   `lit` class and `#bar-fill` has a width of `0%`.
2. **GUARD-02/04 (put everything away)**: repeat until no `'idle'` toy is
   left: `pointerdown` at the `screenPos` of an idle toy → identify the
   `'dragging'` one → drag to `screenPos(itsType)` (correct box) → release →
   wait ~0.7s.
   **Assert (WIN-02.2, after the 1st success)**: `progress.stored === 1` and
   the width of `#bar-fill` rose to ~`16.67%` (1/6).
   **Assert (after the last one)**: all 6 have `state === 'stored'`.
3. **GUARD-05 (big celebration) + VIS-03 (Bluey dances)**: right after the
   last success.
   **Assert**: `phase === 'celebrating'`; within ~1s, `bluey.mode === 'dance'`
   (Bluey goes to the center to dance amid the confetti shower).
   **Assert (WIN-03.3, star lights up)**: `progress.starsLit === 1` and the
   first star in `#hud` has the `lit` class.
   Evidence screenshot of the celebration: `e2e-02-celebracao.jpeg`.
4. **VIS-06.2 (iris between rounds)**: wait ~4.2s from the last success.
   **Assert**: `transition === 'closing'` (iris covering the toy swap).
   **Assert (VIS-07.3, input gate)**: with `transition !== 'none'`, attempt a
   `pointerdown`+`pointermove` over a toy — no toy enters `'dragging'` (input
   ignored during the transition).
   This should be followed by `transition === 'opening'` and finally `'none'`.
5. **GUARD-05 (automatic advance under the iris)**: wait until `transition === 'none'`
   (~6.5s from the last success in total).
   **Assert**: `round === 2`, `toys.length === 9` (3 per type), all `'idle'`,
   `phase === 'playing'`, `bluey.mode === 'idle'` (back in the corner).
   **Assert (WIN-02.4, bar resets / star stays)**: `progress` =
   `{ round: 2, totalRounds: 3, stored: 0, total: 9, starsLit: 1 }` and
   `#bar-fill` went back to `0%` with the first star still `lit`.
6. **GUARD-06 (persistence)**: reload the page WITHOUT clearing `localStorage`;
   tap play; wait for `transition === 'none'`.
   **Assert**: `state().round === 2` and `toys.length === 9` (resumed from the
   saved round).
7. Evidence screenshot: `e2e-02-rodada2.jpeg`.

## Green when

- All assertions confirmed via `__game.state()`.
- Transition sequence observed between rounds: `'closing'` → `'opening'` → `'none'`.
- No console errors other than a favicon 404.
- Screenshots captured.

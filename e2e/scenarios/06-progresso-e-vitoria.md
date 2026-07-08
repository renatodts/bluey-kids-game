# Scenario 06 — Progress, victory and playing again (WIN-01..WIN-09)

Executed by an agent via Playwright MCP. Same conventions as previous
scenarios: assertions against `window.__game.state()` (which now exposes
`progress: { round, totalRounds, stored, total, starsLit }`), dragging via
synthetic Pointer Events at coordinates from `window.__game.screenPos(id)`,
and the dragged toy is whichever one `state()` reports as `'dragging'`.

To reach victory quickly, the scenario injects round 3 into `localStorage`
(key `hora-de-guardar:round` = `'3'`) — playing all 3 rounds in full is
already partly covered by scenario 02; the focus here is the end of the arc.

---

## Part A — Victory (viewport 1280×800, pointerType `mouse`)

1. `browser_resize` 1280×800; set `localStorage['hora-de-guardar:round'] = '3'`;
   reload; tap play; wait for `transition === 'none'` and
   `camera.intro === false`; `window.__game.seed(606)`.
   **Assert (WIN-03.5, load with save)**: `progress` = `{ round: 3, totalRounds: 3,
   stored: 0, total: 12, starsLit: 2 }`; in `#hud`, exactly the first 2 stars
   have the `lit` class; `#replay-overlay` has the `hidden` class.
   **Assert (WIN-01.1, no text)**: `#hud` contains no text
   (`textContent.trim() === ''`).
2. **WIN-02 (bar per toy)**: put all 12 toys away in the correct box
   (following the `'dragging'` rule; ~0.7s between drags).
   **Assert (after the 6th)**: `progress.stored === 6`; width of `#bar-fill` = `50%`.
3. **WIN-05 (victory, no round 4)**: after the 12th success.
   **Assert**: `phase === 'won'`; `progress` = `{ round: 3, totalRounds: 3,
   stored: 12, total: 12, starsLit: 3 }`; all 3 stars `lit`; `#bar-fill` at `100%`.
   **Assert (WIN-07, save cleared)**: `localStorage['hora-de-guardar:round']` is `null`.
4. **WIN-06 (big party)**: right after the victory.
   **Assert**: `bluey.mode === 'dance'`; `audio.soundsPlayed` increased with
   the jingle. Evidence screenshot: `e2e-06-vitoria.jpeg`.
5. **WIN-08 (inert input + button after the party)**: before ~4s,
   `#replay-overlay` is still `hidden`; try `pointerdown` over any area of
   the game — no toy enters `'dragging'` (`phase !== 'playing'` and there are
   no toys). Wait ~4.2s from the victory.
   **Assert**: `#replay-overlay` WITHOUT the `hidden` class (giant button
   visible). Screenshot: `e2e-06-botao-replay.jpeg`.

## Part B — Play again (WIN-09)

6. Click `#replay-button`.
   **Assert (immediate)**: `#replay-overlay` has the `hidden` class; followed
   by `transition === 'closing'` → `'opening'` → `'none'` (iris covers the swap).
7. After `transition === 'none'`:
   **Assert**: `round === 1`, `toys.length === 6`, all `'idle'`,
   `phase === 'playing'`; `progress` = `{ round: 1, totalRounds: 3, stored: 0,
   total: 6, starsLit: 0 }`; no star `lit`; `#bar-fill` at `0%`;
   `localStorage['hora-de-guardar:round']` is `null`.
8. **WIN-09.4 (drag works again)**: drag 1 toy to the correct box.
   **Assert**: toy `'stored'`, `progress.stored === 1`.

## Part C — Save edge cases

9. **Old save > 3**: set `localStorage['hora-de-guardar:round'] = '7'`;
   reload; tap play; wait for `transition === 'none'`.
   **Assert**: `round === 1`, `toys.length === 6`, `progress.starsLit === 0`.
10. **Reload during victory**: quickly repeat Part A's path (save `'3'`,
    win) and, with the replay button visible, reload the page WITHOUT
    touching storage; tap play.
    **Assert**: `round === 1` (the save died at victory), `#replay-overlay`
    `hidden`, HUD zeroed.

## Green when

- All assertions confirmed via `__game.state()` + DOM (`#hud`, `#bar-fill`,
  `#replay-overlay`).
- Full flow observed: bar fills → 3rd star + `phase === 'won'` →
  party → button → replay → round 1 reset.
- No console errors other than a favicon 404.
- Screenshots captured.

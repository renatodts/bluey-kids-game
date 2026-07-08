# Scenario 03 — Audio: unlock on play and graceful silence (GUARD-09)

Executed by an agent via Playwright MCP. Conventions from scenarios 01/02.
The hook exposes `state().audio = { unlocked, soundsPlayed }`.

Sounds are synthesized with WebAudio (oscillators) — there are no sound
files; `soundsPlayed` counts actual triggers (only increments while the
context is `running`).

---

## Part A — Unlock and success sound (viewport 1280×800)

1. Navigate with `localStorage` cleared.
   **Assert**: overlay `#start-overlay` visible (no `hidden` class);
   `state().audio.unlocked === false` (nothing plays before the gesture).
2. **GUARD-09.1 (unlock on gesture)**: click the play button with a REAL
   click (`browser_click` — a trusted gesture for the autoplay policy).
   **Assert**: overlay has the `hidden` class; `state().audio.unlocked === true`.
3. **GUARD-09.2 (success sound)**: wait for `camera.intro === false`
   (opening pull-back, ~3s); `seed(404)`; drag a toy to the correct box
   (following the 'dragging' rule from previous scenarios) and release.
   **Assert**: toy `'stored'`; `state().audio.soundsPlayed >= 1`.
4. Evidence screenshot: `e2e-03-audio.jpeg`.

## Part B — Audio blocked: game keeps working silently (GUARD-09.3)

5. Reload with `localStorage` cleared; BEFORE tapping play, remove the
   constructor: `window.AudioContext = undefined; window.webkitAudioContext = undefined`
   (the game only creates the context on the play gesture — this simulates a
   browser without/blocking WebAudio).
6. Tap play.
   **Assert**: overlay disappears; `state().audio.unlocked === false`.
7. Drag a toy to the correct box.
   **Assert**: toy `'stored'` (game 100% functional in silence);
   `state().audio.soundsPlayed === 0`; no console errors.

## Green when

- All assertions confirmed; no console errors other than a favicon 404.
- Screenshot captured.

# Licenses and credits

This project combines original code with third-party material. The restrictions below apply **before** reusing, redistributing, or publishing any part of this repository.

## Source code

The project's own code (`src/`, `e2e/`, configuration) has no open-source license attached — personal/private use. Do not redistribute without the author's authorization.

## Images — official Bluey art (`assets/bluey/`)

| File | Original source |
|---|---|
| `frame-1.jpg` | bluey.tv media hub — S1 Iconics 001 |
| `frame-2.jpg` | bluey.tv media hub — S2 Iconic 001 |
| `frame-3.jpg` | bluey.tv media hub — S3 Iconic Landscape |
| `plaque-bluey.png` | bluey.tv/characters — Bluey |
| `plaque-bingo.png` | bluey.tv/characters — Bingo |
| `plaque-chilli.png` | bluey.tv/characters — Chilli |
| `bluey-cheer.png` | bluey.tv/characters — Bluey (pose) |

Downloaded from the official Bluey media hub (Ludo Studio / BBC Studios / Disney) and resized to ≤1024px. These are the property of their respective trademark and copyright holders.

**Restricted to private/home use (AD-005).** Publishing a game with this art requires licensing from the IP holder — without that authorization, this repository and its assets **cannot be published or distributed**.

The game works without any file from this folder: without them, it falls back to a solid-color/procedural Bluey (GUARD-08.4 / AD-008).

## 3D model (`assets/bluey/bluey.glb`)

- **Bluey Heeler's Family**, by `MickeyFan1928` — [Sketchfab](https://sketchfab.com/3d-models/bluey-heelers-family-bluey-3d-model-chucky-db72671fe85043e69fd0cb271ae3850e)
- **License: CC-BY** — requires attribution to the author whenever the file is used or the game is distributed.
- Restricted to private/family use (AD-005/AD-008), same as the images above.
- Optional file: if absent, the game uses a procedural low-poly Bluey built in `src/bluey.js` as an automatic fallback.

## Audio

No external audio files are used. All background music and sound effects (success, error, fanfare, victory) are **synthesized in real time via the Web Audio API** (`src/feedback.js`), specifically to avoid licensing risks from third-party tracks (AD-005).

## Code dependencies

Third-party libraries used via npm (`three`, `camera-controls`, `vite`, `vitest`) follow their own licenses as declared in their respective packages — see `package-lock.json` and each project's repository.

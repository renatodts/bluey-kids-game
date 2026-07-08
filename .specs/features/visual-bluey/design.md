# Visual Bluey Design

**Spec**: `.specs/features/visual-bluey/spec.md`
**Status**: Approved (architecture A: Toon + DOM iris, confirmed with the user)

---

## Architecture Overview

Five new modules join the existing ones, each owning a single responsibility — no existing file grows beyond +30% of its current size:

```mermaid
graph TD
    Materials[materials.js NEW<br/>gradientMap + toonMaterial()] --> Scene[scene.js<br/>+shadows +warm light]
    Materials --> Room[room.js NEW<br/>sofa/rug/window]
    Materials --> Boxes[boxes.js<br/>lambert→toon]
    Materials --> Toys[toys.js<br/>lambert→toon]
    Materials --> Bluey[bluey.js NEW<br/>GLTF or procedural]

    Scene --> Main[main.js]
    Room --> Main
    Bluey --> Main
    Transitions[transitions.js NEW<br/>iris DOM overlay] --> Main
    Feedback[feedback.js<br/>remove createCheer 2D] --> Main
    Main --> Hook["window.__game<br/>+bluey.source +transition"]
```

All new modules are independent and individually testable; `main.js` remains the single composition layer (already established pattern).

---

## Code Reuse Analysis

### Existing Components to Leverage

| Component | Location | How to Use |
| --------- | -------- | ---------- |
| `applyArtTexture` + solid-color fallback | `src/scene.js:23` | Reused as-is for environment textures (window/rug) and for the fallback 2D art of the frames — the fallback pattern does not change |
| Mini-tween (`addTween`/`cancel`) | `src/feedback.js:186` | `bluey.js` and `transitions.js` reuse the same tween pattern (no new dependency); `cameraDirector` (feature `mobile-camera`) is the exception — it needs to be a pure, testable module (see that feature's design) |
| Low-poly factory built from composed primitives | `src/toys.js` | Reference model for the procedural Bluey (fallback) and for the room furniture in `room.js` |
| `window.__game` hook | `src/main.js:180` | Extended with `bluey.source` and `transition`, without breaking the existing contract (`state()`, `screenPos()`, `seed()`) |
| `themeStatus` | `src/scene.js:14` | Extended with the Bluey GLTF loading status (`blueySource`) for consistency with the pattern already used by frames/plaques |

### Integration Points

| System | Integration Method |
| ------ | ------------------- |
| Vitest (`game.test.js`) | No visual logic enters `game.js` — zero impact on the existing pure test suite (AD-004 preserved) |
| E2E (`e2e/scenarios/*.md`) | Scenarios 03/04/05 need review (see Risks & Concerns) — handled as an Execute task, does not block the design |

---

## Components

### `materials.js` (new)

- **Purpose**: Central toon material factory — ensures a single shared `gradientMap` and consistent naming across the whole project.
- **Location**: `src/materials.js`
- **Interfaces**:
  - `toonMaterial(color: string, extra?: object): THREE.MeshToonMaterial` — creates a toon material with the shared 3-band gradient map
  - `GRADIENT_MAP: THREE.DataTexture` — exported only for advanced use cases (e.g., Bluey's material needs band variation)
- **Dependencies**: `three`
- **Reuses**: None — this is the new base that `scene.js`, `boxes.js`, `toys.js`, `room.js`, `bluey.js` now import instead of `MeshLambertMaterial`

```javascript
// 3-band gradient map (shadow / mid-tone / light) — tiny 1D texture, no network cost
const bands = new Uint8Array([80, 170, 255]);
export const GRADIENT_MAP = new THREE.DataTexture(bands, bands.length, 1, THREE.RedFormat);
GRADIENT_MAP.minFilter = GRADIENT_MAP.magFilter = THREE.NearestFilter;
GRADIENT_MAP.needsUpdate = true;

export function toonMaterial(color, extra = {}) {
  return new THREE.MeshToonMaterial({ color, gradientMap: GRADIENT_MAP, ...extra });
}
```

### `room.js` (new)

- **Purpose**: Furniture and composition of the Heeler living room (sofa, rug, window with backyard) — extracted from `scene.js` so as not to mix "technical stage" (renderer/camera/light) with "artistic set dressing."
- **Location**: `src/room.js`
- **Interfaces**:
  - `createRoom(): THREE.Group` — group with all the furniture, ready for `scene.add()`
  - `ROOM_CLEARANCE: {minX, maxX, minZ, maxZ}` — furniture-free rectangle, used to validate that `FLOOR_BOUNDS` (game.js) does not collide with any piece of furniture (AC VIS-01.5)
- **Dependencies**: `materials.js`, `three`
- **Reuses**: Primitive-composition pattern from `toys.js`/`boxes.js`

### `bluey.js` (new)

- **Purpose**: The Bluey character — loads a fan-made GLTF with a fallback to a procedural model; exposes an idle/cheer/dance state machine.
- **Location**: `src/bluey.js`
- **Interfaces**:
  - `createBluey({ scene, cornerPosition, centerPosition }): BlueyCharacter`
  - `BlueyCharacter.cheer()` — triggers a short celebration (≤2s), re-entrant (AC VIS-03.6)
  - `BlueyCharacter.danceAt(position, duration)` — moves to the center and dances during the celebration
  - `BlueyCharacter.returnToCorner()` — returns to the cheering position
  - `BlueyCharacter.update(dt)` — advances idle animation/procedural tweens (squash/bob) — needed even with a GLTF, since clip animations are not guaranteed (spec edge case)
  - `BlueyCharacter.source: 'gltf' | 'procedural'` — getter, mirrored in the hook
- **Dependencies**: `three`, `three/addons/loaders/GLTFLoader.js`, `materials.js` (procedural fallback uses `toonMaterial`)
- **Reuses**: Asset fallback pattern (`applyArtTexture`) adapted for a 3D model; primitive-factory pattern (`toys.js`) for the procedural build

**State machine** (AC VIS-03.6):

```
idle ──cheer()──▶ cheer ──(2s)──▶ idle
idle ──danceAt()──▶ dance ──(external duration)──▶ returnToCorner() ──▶ idle
cheer ──cheer() again──▶ resets the cheer timer (re-entrant, never accumulates)
```

Implemented with the same pattern as `feedback.js` (`cancel` + module-local `addTween`) — no new state-machine library.

**Loading** (Promise + fallback pattern, from the `threejs-loaders` skill):

```javascript
async function loadBlueyModel() {
  try {
    const gltf = await loadGLTF('/bluey/bluey.glb'); // see Tech Decisions: asset origin
    return { object: gltf.scene, animations: gltf.animations, source: 'gltf' };
  } catch {
    console.warn('[visual-bluey] GLTF model unavailable — using procedural Bluey');
    return { object: buildProceduralBluey(), animations: [], source: 'procedural' };
  }
}
```

### `transitions.js` (new)

- **Purpose**: Iris transition (opening, between rounds) via a DOM overlay — not through the 3D scene, so as not to compete with the phone's draw-call budget and to be trivially testable (CSS, not WebGL).
- **Location**: `src/transitions.js`
- **Interfaces**:
  - `createTransitions(overlayEl: HTMLElement): TransitionController`
  - `TransitionController.open(): Promise<void>` — iris opens (reveals the game), resolves on completion
  - `TransitionController.close(): Promise<void>` — iris closes (covers the game), resolves on completion
  - `TransitionController.state: 'none' | 'opening' | 'closing'` — mirrored in the hook (AC VIS-06/07.4)
  - `TransitionController.isBlocking(): boolean` — used by `drag.js` for the input gate (AC VIS-06/07.3)
- **Dependencies**: DOM (`overlayEl`), no dependency on `three`
- **Reuses**: No existing 3D component — pure DOM, explicit decision (see Tech Decisions)

**Non-overlap guards** (AC VIS-07.5): `open()`/`close()` calls made while a transition is already active return the in-progress Promise (idempotent) instead of starting a second animation — implemented with an internal `activePromise` flag.

**DOM element**: `<div id="transition-overlay">` added to `index.html`, `position:fixed; inset:0; z-index:30`, with a `clip-path: circle(...)` animated via the Web Animations API (`element.animate()`), which already exposes a completion `Promise` (`animation.finished`).

### `drag.js` (modified)

- **Purpose (unchanged)**: raycast-based dragging.
- **Change**: `createDrag` now accepts an optional `isBlocked: () => boolean`; `onPointerDown` returns early if `isBlocked()` is `true` (AC VIS-07.3). `main.js` passes `() => transitions.isBlocking()`.
- **Reuses**: Minimal, additive extension — the optional parameter doesn't break the existing call site if omitted (default `() => false`).

### `feedback.js` (modified)

- **Purpose (unchanged)**: success/error tweens, confetti, audio.
- **Change**: `createCheer`/`showCheer` (fixed 2D billboard, `feedback.js:163-178` and `267-284`) are **removed**; `stored()` now calls `bluey.cheer()` (injected via `createFeedback({ scene, floorY, bluey })`) instead of `showCheer()`. `themeStatus.cheerLoaded`/`cheerVisible` are replaced by `blueySource`/`blueyState` in `scene.js` (same pattern, new name — see Risks & Concerns regarding e2e scenario 04).
- **Reuses**: `roundComplete(boxes)` now also calls `bluey.danceAt(centerPosition, 3)` (the duration matches the existing `confetti.rain(3)`).

---

## Data Models

### `BlueyState` (not persisted — in-memory state of the `bluey.js` module)

```typescript
interface BlueyState {
  mode: 'idle' | 'cheer' | 'dance';
  source: 'gltf' | 'procedural';
}
```

Mirrored in `window.__game.state().bluey` (same pattern as the current `theme`).

### `TransitionState` (not persisted)

```typescript
type TransitionState = 'none' | 'opening' | 'closing';
```

Mirrored in `window.__game.state().transition`.

---

## Error Handling Strategy

| Error Scenario | Handling | User Impact |
| --------------- | -------- | ------------ |
| Bluey's GLTF fails to load (404, CORS, parse error) | `loadBlueyModel()` catches it and returns the procedural build; `console.warn` (`applyArtTexture` pattern) | None — Bluey appears the same, with a simplified model |
| GLTF loads without `animations` | `bluey.update(dt)` always applies procedural bob/squash regardless of clips | None — cheer/dance always visible |
| `Element.animate()` unavailable (very old browser) | Out of scope — same target audience already assumed by the project for `AudioContext`/WebGL; no polyfill | Transition does not occur; game remains functional (degradation, not breakage) — same as the audio pattern (GUARD-09.3) |
| Environment texture (window/rug) fails | `applyArtTexture` (reused) keeps the solid color | None — environment shows a solid color instead of a texture |

---

## Risks & Concerns

| Concern | Location | Impact | Mitigation |
| ------- | -------- | ------ | ---------- |
| Removing `createCheer`/`showCheer` (2D billboard) changes `themeStatus.cheerLoaded`/`cheerVisible`, read by e2e scenario 04 | `src/feedback.js:163-178,267-284`, `e2e/scenarios/04-*.md` | Scenario 04 breaks when asserting fields that no longer exist | Execute task: rewrite scenario 04 to assert `bluey.source`/`bluey.mode` instead of `theme.cheerLoaded/cheerVisible`; `theme.framesLoaded`/`plaquesLoaded` remain untouched |
| `feedback.js` is already 344 lines; it's tempting to put Bluey's logic there | `src/feedback.js` | File grows beyond reason, mixing responsibilities | `bluey.js` is its own module; `feedback.js` only calls `bluey.cheer()`/`bluey.danceAt()` via injection, never imports `bluey.js` directly into internal logic |
| Toon materials change the visual shadow read of the existing toys/boxes (manually tested in `hora-de-guardar`) | `src/toys.js`, `src/boxes.js` | Visual regression not covered by Vitest (purely visual) | Mandatory manual/e2e validation in this feature's Execute (before/after screenshot), not just an automated gate |
| Enabled shadow map may cost FPS on a modest phone | `src/scene.js` (renderer) | Frame drop on a weaker device | Conservative `shadow.mapSize` (1024), frustum tightened to the room size (`ROOM.width/depth`), validated in the `mobile-camera` feature (P2: mobile quality) |

---

## Tech Decisions

| Decision | Choice | Rationale |
| -------- | ------ | --------- |
| Toon shading | `MeshToonMaterial` + shared 3-band gradient map | Native to Three.js (no custom shader), lightweight for mobile, immediate "cartoon" look — avoids an outline pass (option B declined by the user due to GPU cost) |
| Transitions | DOM overlay (`clip-path`/`Element.animate()`), not 3D geometry | Zero extra draw-call cost; testable via `TransitionController.state` without relying on visual asserts in WebGL (same rationale as AD-006: the canvas is opaque to asserts) |
| Origin of Bluey's model | Fan-made GLTF **if** an asset with a private-use-compatible license is found (research in progress); otherwise, low-poly procedural in `bluey.js` (AD-008) | Explicit user decision during discuss; no URL/license assumption without verification (Knowledge Verification Chain) |
| Heeler living room | `room.js` module separate from `scene.js` | Keeps `scene.js` focused on "technical stage" (camera/light/renderer), sealing the boundary between scene infrastructure and artistic content |

> **Research completed (2026-07-08):** no fan-made model could be downloaded automatically (all require manual Sketchfab login). The user chose to manually download **"Bluey Heeler's Family"** (CC-BY, `MickeyFan1928`) — see `docs/references.md`. Expected file at `assets/bluey/bluey.glb`. The GLTF loading task depends on this file existing; if absent at task time, the procedural fallback (AD-008) is automatically used and the GLTF integration task is deferred/re-run once the file arrives (does not block the feature's other tasks).

---

## Tips

Model guidance: this is a **Large**-scope feature (multiple new components, architectural decisions). Tasks and Execute proceed with per-task verification.

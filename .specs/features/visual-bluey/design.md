# Visual Bluey Design

**Spec**: `.specs/features/visual-bluey/spec.md`
**Status**: Approved (arquitetura A: Toon + iris DOM, confirmada com o usuário)

---

## Architecture Overview

Cinco novos módulos entram ao lado dos existentes, cada um dono de uma responsabilidade única — nenhum arquivo existente cresce além de +30% do tamanho atual:

```mermaid
graph TD
    Materials[materials.js NEW<br/>gradientMap + toonMaterial()] --> Scene[scene.js<br/>+shadows +luz quente]
    Materials --> Room[room.js NEW<br/>sofá/tapete/janela]
    Materials --> Boxes[boxes.js<br/>lambert→toon]
    Materials --> Toys[toys.js<br/>lambert→toon]
    Materials --> Bluey[bluey.js NEW<br/>GLTF ou procedural]

    Scene --> Main[main.js]
    Room --> Main
    Bluey --> Main
    Transitions[transitions.js NEW<br/>iris DOM overlay] --> Main
    Feedback[feedback.js<br/>remove createCheer 2D] --> Main
    Main --> Hook["window.__game<br/>+bluey.source +transition"]
```

Todos os módulos novos são independentes e testáveis isoladamente; `main.js` continua sendo a única camada de composição (padrão já estabelecido).

---

## Code Reuse Analysis

### Existing Components to Leverage

| Component | Location | How to Use |
| --------- | -------- | ---------- |
| `applyArtTexture` + fallback de cor sólida | `src/scene.js:23` | Reusado tal qual para texturas do ambiente (janela/tapete) e para a arte 2D de fallback dos frames — padrão de fallback não muda |
| Mini-tween (`addTween`/`cancel`) | `src/feedback.js:186` | `bluey.js` e `transitions.js` reusam o mesmo padrão de tween (sem nova dependência); `cameraDirector` (feature `mobile-camera`) é a exceção — precisa ser um módulo puro testável (ver design daquela feature) |
| Fábrica low-poly por composição de primitivas | `src/toys.js` | Modelo de referência para a Bluey procedural (fallback) e para os móveis da sala em `room.js` |
| `window.__game` hook | `src/main.js:180` | Estendido com `bluey.source` e `transition`, sem quebrar o contrato existente (`state()`, `screenPos()`, `seed()`) |
| `themeStatus` | `src/scene.js:14` | Estendido com o status de carregamento do GLTF da Bluey (`blueySource`) para consistência com o padrão já usado por frames/plaquetas |

### Integration Points

| System | Integration Method |
| ------ | ------------------- |
| Vitest (`game.test.js`) | Nenhuma lógica visual entra em `game.js` — zero impacto na suíte pura existente (AD-004 preservado) |
| E2E (`e2e/scenarios/*.md`) | Cenários 03/04/05 precisam de revisão (ver Risks & Concerns) — tratado como task de Execute, não bloqueia o design |

---

## Components

### `materials.js` (novo)

- **Purpose**: Fábrica central de materiais toon — garante um único `gradientMap` compartilhado e nomenclatura consistente em todo o projeto.
- **Location**: `src/materials.js`
- **Interfaces**:
  - `toonMaterial(color: string, extra?: object): THREE.MeshToonMaterial` — cria material toon com o gradient map de 3 bandas compartilhado
  - `GRADIENT_MAP: THREE.DataTexture` — exportado só para casos de uso avançado (ex.: material da Bluey precisa de variação de banda)
- **Dependencies**: `three`
- **Reuses**: Nenhum — é a nova base que `scene.js`, `boxes.js`, `toys.js`, `room.js`, `bluey.js` passam a importar em vez de `MeshLambertMaterial`

```javascript
// gradient map de 3 bandas (sombra / meio-tom / luz) — textura 1D minúscula, sem custo de rede
const bands = new Uint8Array([80, 170, 255]);
export const GRADIENT_MAP = new THREE.DataTexture(bands, bands.length, 1, THREE.RedFormat);
GRADIENT_MAP.minFilter = GRADIENT_MAP.magFilter = THREE.NearestFilter;
GRADIENT_MAP.needsUpdate = true;

export function toonMaterial(color, extra = {}) {
  return new THREE.MeshToonMaterial({ color, gradientMap: GRADIENT_MAP, ...extra });
}
```

### `room.js` (novo)

- **Purpose**: Mobília e composição da sala dos Heeler (sofá, tapete, janela com quintal) — extraído de `scene.js` para não misturar "palco técnico" (renderer/câmera/luz) com "cenário artístico".
- **Location**: `src/room.js`
- **Interfaces**:
  - `createRoom(): THREE.Group` — grupo com toda a mobília, pronto para `scene.add()`
  - `ROOM_CLEARANCE: {minX, maxX, minZ, maxZ}` — retângulo livre de mobília, usado para validar que `FLOOR_BOUNDS` (game.js) não colide com nenhum móvel (AC VIS-01.5)
- **Dependencies**: `materials.js`, `three`
- **Reuses**: Padrão de composição por primitivas de `toys.js`/`boxes.js`

### `bluey.js` (novo)

- **Purpose**: Personagem Bluey — carrega GLTF fan-made com fallback para modelo procedural; expõe máquina de estados idle/cheer/dance.
- **Location**: `src/bluey.js`
- **Interfaces**:
  - `createBluey({ scene, cornerPosition, centerPosition }): BlueyCharacter`
  - `BlueyCharacter.cheer()` — dispara comemoração curta (≤2s), re-entrante (AC VIS-03.6)
  - `BlueyCharacter.danceAt(position, duration)` — desloca ao centro e dança durante a celebração
  - `BlueyCharacter.returnToCorner()` — volta à posição de torcida
  - `BlueyCharacter.update(dt)` — avança animação idle/tweens procedurais (squash/bob) — necessário mesmo com GLTF, pois animações do clipe não são garantidas (edge case da spec)
  - `BlueyCharacter.source: 'gltf' | 'procedural'` — getter, espelhado no hook
- **Dependencies**: `three`, `three/addons/loaders/GLTFLoader.js`, `materials.js` (fallback procedural usa `toonMaterial`)
- **Reuses**: Padrão de fallback de asset (`applyArtTexture`) adaptado para modelo 3D; padrão de fábrica por primitivas (`toys.js`) para o procedural

**Máquina de estados** (AC VIS-03.6):

```
idle ──cheer()──▶ cheer ──(2s)──▶ idle
idle ──danceAt()──▶ dance ──(duração externa)──▶ returnToCorner() ──▶ idle
cheer ──cheer() again──▶ reinicia o timer de cheer (re-entrante, nunca acumula)
```

Implementado com o mesmo padrão de `feedback.js` (`cancel` + `addTween` local ao módulo) — sem nova biblioteca de state machine.

**Carregamento** (padrão Promise + fallback, do skill `threejs-loaders`):

```javascript
async function loadBlueyModel() {
  try {
    const gltf = await loadGLTF('/bluey/bluey.glb'); // ver Tech Decisions: origem do asset
    return { object: gltf.scene, animations: gltf.animations, source: 'gltf' };
  } catch {
    console.warn('[visual-bluey] modelo GLTF indisponível — usando Bluey procedural');
    return { object: buildProceduralBluey(), animations: [], source: 'procedural' };
  }
}
```

### `transitions.js` (novo)

- **Purpose**: Transição iris (abertura, entre rodadas) via overlay DOM — não via cena 3D, para não competir com o orçamento de draw calls do celular e para ser trivialmente testável (CSS, não WebGL).
- **Location**: `src/transitions.js`
- **Interfaces**:
  - `createTransitions(overlayEl: HTMLElement): TransitionController`
  - `TransitionController.open(): Promise<void>` — iris abre (revela o jogo), resolve ao concluir
  - `TransitionController.close(): Promise<void>` — iris fecha (cobre o jogo), resolve ao concluir
  - `TransitionController.state: 'none' | 'opening' | 'closing'` — espelhado no hook (AC VIS-06/07.4)
  - `TransitionController.isBlocking(): boolean` — usado por `drag.js` para o input gate (AC VIS-06/07.3)
- **Dependencies**: DOM (`overlayEl`), nenhuma dependência de `three`
- **Reuses**: Nenhum componente 3D existente — é DOM puro, decisão explícita (ver Tech Decisions)

**Guardas de não sobreposição** (AC VIS-07.5): `open()`/`close()` chamados enquanto uma transição já está ativa retornam a Promise em andamento (idempotente) em vez de iniciar uma segunda animação — implementado com uma flag `activePromise` interna.

**Elemento DOM**: `<div id="transition-overlay">` adicionado ao `index.html`, `position:fixed; inset:0; z-index:30`, com `clip-path: circle(...)` animado via Web Animations API (`element.animate()`), que já expõe `Promise` de conclusão (`animation.finished`).

### `drag.js` (modificado)

- **Purpose (inalterado)**: arrasto por raycasting.
- **Mudança**: `createDrag` passa a aceitar `isBlocked: () => boolean` opcional; `onPointerDown` retorna cedo se `isBlocked()` for `true` (AC VIS-07.3). `main.js` passa `() => transitions.isBlocking()`.
- **Reuses**: Extensão mínima e aditiva — parâmetro opcional não quebra a chamada existente se omitido (default `() => false`).

### `feedback.js` (modificado)

- **Purpose (inalterado)**: tweens de acerto/erro, confete, áudio.
- **Mudança**: `createCheer`/`showCheer` (billboard 2D fixo, `feedback.js:163-178` e `267-284`) são **removidos**; `stored()` passa a chamar `bluey.cheer()` (injetado via `createFeedback({ scene, floorY, bluey })`) em vez de `showCheer()`. `themeStatus.cheerLoaded`/`cheerVisible` são substituídos por `blueySource`/`blueyState` em `scene.js` (mesmo padrão, novo nome — ver Risks & Concerns sobre o cenário e2e 04).
- **Reuses**: `roundComplete(boxes)` passa a também chamar `bluey.danceAt(centerPosition, 3)` (a duração casa com `confetti.rain(3)` já existente).

---

## Data Models

### `BlueyState` (não persistido — estado em memória do módulo `bluey.js`)

```typescript
interface BlueyState {
  mode: 'idle' | 'cheer' | 'dance';
  source: 'gltf' | 'procedural';
}
```

Espelhado em `window.__game.state().bluey` (mesmo padrão do `theme` atual).

### `TransitionState` (não persistido)

```typescript
type TransitionState = 'none' | 'opening' | 'closing';
```

Espelhado em `window.__game.state().transition`.

---

## Error Handling Strategy

| Error Scenario | Handling | User Impact |
| --------------- | -------- | ------------ |
| GLTF da Bluey falha ao carregar (404, CORS, parse) | `loadBlueyModel()` captura e retorna procedural; `console.warn` (padrão `applyArtTexture`) | Nenhum — Bluey aparece igual, com modelo simplificado |
| GLTF carrega sem `animations` | `bluey.update(dt)` sempre aplica bob/squash procedural independente de clipes | Nenhum — comemoração/dança sempre visíveis |
| `Element.animate()` indisponível (browser muito antigo) | Fora do escopo — mesmo público-alvo de `AudioContext`/WebGL já assumido pelo projeto; sem polyfill | Transição não ocorre; jogo segue funcional (degradação, não quebra) — igual ao padrão de áudio (GUARD-09.3) |
| Textura de ambiente (janela/tapete) falha | `applyArtTexture` (reuso) mantém cor sólida | Nenhum — ambiente com cor sólida em vez de textura |

---

## Risks & Concerns

| Concern | Location | Impact | Mitigation |
| ------- | -------- | ------ | ---------- |
| Remoção do `createCheer`/`showCheer` (billboard 2D) muda `themeStatus.cheerLoaded`/`cheerVisible`, lidos pelo e2e cenário 04 | `src/feedback.js:163-178,267-284`, `e2e/scenarios/04-*.md` | Cenário 04 quebra ao assertar campos que deixam de existir | Task de Execute: reescrever cenário 04 para assertar `bluey.source`/`bluey.mode` em vez de `theme.cheerLoaded/cheerVisible`; `theme.framesLoaded`/`plaquesLoaded` continuam intactos |
| `feedback.js` já tem 344 linhas; é tentador colocar a lógica da Bluey ali | `src/feedback.js` | Arquivo cresce além do razoável, mistura responsabilidades | `bluey.js` é módulo próprio; `feedback.js` só chama `bluey.cheer()`/`bluey.danceAt()` via injeção, nunca importa `bluey.js` diretamente na lógica interna |
| Materiais toon mudam a leitura visual de sombra dos brinquedos/caixas existentes (testados manualmente em `hora-de-guardar`) | `src/toys.js`, `src/boxes.js` | Regressão visual não coberta por Vitest (é puramente visual) | Validação manual/e2e obrigatória no Execute desta feature (screenshot antes/depois), não apenas gate automatizado |
| Shadow map ligado pode custar FPS em celular modesto | `src/scene.js` (renderer) | Frame drop em dispositivo fraco | `shadow.mapSize` conservador (1024), frustum apertado ao tamanho da sala (`ROOM.width/depth`), validado na feature `mobile-camera` (P2: Qualidade mobile) |

---

## Tech Decisions

| Decision | Choice | Rationale |
| -------- | ------ | --------- |
| Toon shading | `MeshToonMaterial` + gradient map de 3 bandas compartilhado | Nativo do Three.js (sem shader custom), leve para mobile, visual "desenho" imediato — dispensa outline pass (opção B recusada pelo usuário por custo de GPU) |
| Transições | Overlay DOM (`clip-path`/`Element.animate()`), não geometria 3D | Zero custo de draw call extra; testável via `TransitionController.state` sem depender de asserts visuais em WebGL (mesmo racional do AD-006: canvas é opaco para asserts) |
| Origem do modelo da Bluey | GLTF fan-made **se** um asset com licença de uso privado for encontrado (pesquisa em andamento); senão, procedural low-poly em `bluey.js` (AD-008) | Decisão explícita do usuário no discuss; nenhuma suposição de URL/licença sem verificação (Knowledge Verification Chain) |
| Sala dos Heeler | Módulo `room.js` separado de `scene.js` | Mantém `scene.js` focado em "palco técnico" (câmera/luz/renderer), sela a fronteira entre infra de cena e conteúdo artístico |

> **Pesquisa concluída (2026-07-08):** nenhum modelo fan-made pôde ser baixado automaticamente (todos exigem login manual no Sketchfab). Usuário optou por baixar manualmente **"Bluey Heeler's Family"** (CC-BY, `MickeyFan1928`) — ver `docs/references.md`. Arquivo esperado em `assets/bluey/bluey.glb`. A Task de carregamento do GLTF depende desse arquivo existir; se ausente no momento da Task, o fallback procedural (AD-008) assume automaticamente e a Task de integração do GLTF é adiada/reexecutada quando o arquivo chegar (não bloqueia as demais tasks da feature).

---

## Tips

Modelo guidance: esta é uma feature de escopo **Large** (múltiplos componentes novos, decisões de arquitetura). Tasks e Execute seguem com verificação por task.

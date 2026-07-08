# Mobile Camera & Fullscreen Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/mobile-camera/design.md`
**Status**: Draft

**Pré-requisito**: feature `visual-bluey` implementada e mesclada antes de iniciar esta — ambas tocam `src/scene.js` (Risks & Concerns do design.md); executar em série evita conflito de merge dentro da mesma sessão.

---

## Test Coverage Matrix

> Generated from codebase sampling (`src/game.js` + `src/game.test.js`, precedente de `hora-de-guardar/tasks.md` e de `visual-bluey/tasks.md`). Guidelines found: nenhum `AGENTS.md`/`CLAUDE.md`/`CONTRIBUTING.md` no repo — convenção inferida do código existente (AD-004: lógica pura testada, renderização/browser API validada manual/e2e).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------- | ---------------------- | ------------------ | ------------- |
| Lógica de câmera (`src/cameraFraming.js`, `src/cameraDirector.js`) — sem `three`, sem DOM | unit (Vitest) | Todos os branches; 1:1 com AC MOB-04..07 (transições de estado, invariante de enquadramento, re-entrância, clamp de dt) | `src/*.test.js` | `npm test` |
| Módulos de renderização/browser API (`src/scene.js`, `src/fullscreen.js`, `src/drag.js` mudanças, `src/main.js`) | none | — (build gate; comportamento coberto pelos fluxos E2E, mesmo padrão de `hora-de-guardar`/`visual-bluey`) | — | `npm run build` |
| Fluxos integrados (fullscreen, retrato, follow de câmera) | e2e (Playwright MCP, prompt-guided, AD-006) | Cenários cobrindo AC MOB-01..08 via `window.__game` hook (`camera.mode`) + screenshots | `e2e/scenarios/*.md` | Executar via Playwright MCP contra `vite preview` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tasks com testes unitários (`cameraFraming.js`, `cameraDirector.js`) | `npm test` |
| Build | Tasks só de renderização/config | `npm run build && npm test` |
| Full | Tasks de fluxo integrado | `npm run build && npm test` + executar o(s) cenário(s) E2E da task via Playwright MCP |

---

## Execution Plan

### Phase 1: Câmera — lógica pura

```
T1 → T2
```

### Phase 2: Integração da câmera no jogo

```
T3 → T4 → T5
```

### Phase 3: Fullscreen e retrato

```
T6 → T7
```

### Phase 4: Docs e revisão E2E

```
T8 → T9
```

---

## Task Breakdown

### T1: Criar `cameraFraming.js` (matemática de enquadramento pura)

**What**: `frameDistance(points, fov, aspect, margin)` — distância mínima da câmera para caber um conjunto de pontos no frustum; `dioramaPose(aspect)` — refatoração pura da fórmula hoje em `scene.js:100-110` (`onResize`).
**Where**: `src/cameraFraming.js`
**Depends on**: None
**Reuses**: Fórmula de `widen`/distância de `src/scene.js:106` (generalizada para N pontos em vez de aspect isolado)
**Requirement**: MOB-04, MOB-07

**Tools**:
- MCP: `context7` (conferir fórmulas de FOV/frustum do Three.js, mesmo sem depender de `three` no código)
- Skill: NONE

**Done when**:
- [ ] Testes cobrem: 1 ponto, N pontos dispersos, aspect extremos (retrato estreito e paisagem larga), `margin` aplicado corretamente
- [ ] `dioramaPose(aspect)` produz a mesma pose numérica que o `onResize` atual para os aspects testados em `hora-de-guardar` (regressão zero visual)
- [ ] Gate passa: `npm test`
- [ ] Test count: 6+ testes passam (sem deleção silenciosa)

**Tests**: unit
**Gate**: quick
**Commit**: `feat(camera): add pure frustum-fit framing math`

---

### T2: Criar `cameraDirector.js` (máquina de estados)

**What**: `createCameraDirector({dioramaPose, roomBounds})` com estados `idle/follow/emphasis/celebrate/return`, damping exponencial, e `update(dt)` retornando `{position, lookAt, mode}`.
**Where**: `src/cameraDirector.js`
**Depends on**: T1
**Reuses**: `frameDistance`/`dioramaPose` (T1); padrão de módulo puro testável de `game.js` (AD-004)
**Requirement**: MOB-04, MOB-05, MOB-06, MOB-07

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Testes cobrem cada transição da máquina de estados: `idle→follow→return→idle`; `follow→emphasis→(novo follow cancela)`; `celebrate` só aceito a partir de `idle`/`return`; `dt` grande (aba dormiu) não gera `NaN`/salto
- [ ] Enquadramento de `follow`/`emphasis` mantém as 3 caixas + alvo dentro do frustum (teste com pontos fixos das caixas de `boxes.js`)
- [ ] Gate passa: `npm test`
- [ ] Test count: 10+ testes passam (sem deleção silenciosa)

**Tests**: unit
**Gate**: quick
**Commit**: `feat(camera): add camera director state machine`

---

### T3: Refatorar `scene.js` — `onResize` deixa de tocar a câmera diretamente

**What**: `onResize()` recalcula `renderer.setSize`/`camera.aspect`/`updateProjectionMatrix` e retorna a nova `dioramaPose(aspect)` (T1) em vez de setar `camera.position`/`lookAt` diretamente.
**Where**: `src/scene.js` (modifica)
**Depends on**: T1
**Reuses**: `dioramaPose` (T1)
**Requirement**: MOB-07 (mitigação do Risk "onResize briga com cameraDirector")

**Tools**:
- MCP: NONE
- Skill: `threejs-fundamentals`

**Done when**:
- [ ] `onResize()` não seta mais `camera.position`/`camera.lookAt`; retorna a pose calculada
- [ ] `npm run build` passa (visual idêntico ao estado anterior até T5 conectar o director)

**Tests**: none
**Gate**: build
**Commit**: `refactor(camera): decouple onResize from direct camera positioning`

---

### T4: Estender `drag.js` — `onDragMove` e `isBlocked`

**What**: `createDrag` recebe `onDragMove(toyId, pos)` (disparado ao fim de `onPointerMove`) e `isBlocked` (checado no início de `onPointerDown`) — ambos opcionais, aditivos.
**Where**: `src/drag.js` (modifica)
**Depends on**: None
**Reuses**: Estrutura de callbacks existente (`onPick`/`onDrop`)
**Requirement**: MOB-06

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Chamada sem os novos parâmetros continua funcionando (retrocompatível — `hora-de-guardar` e `visual-bluey` não quebram)
- [ ] `npm run build && npm test` passa

**Tests**: none
**Gate**: build
**Commit**: `feat(drag): add optional onDragMove and isBlocked hooks`

---

### T5: Integrar `cameraDirector` em `main.js`

**What**: Cria `cameraDirector` com a `dioramaPose` inicial; loop de animação chama `update(dt)` e aplica a pose em `camera.position`/`camera.lookAt` antes de `renderer.render`; `onPick`→`follow`, `onDragMove`→`follow`, `handleDrop` (stored)→`emphasize`→`release`, (rejected/fora)→`release`; `roundComplete`→`celebrate`; hook ganha `window.__game.state().camera.mode`; `onResize` do `window` passa a chamar `cameraDirector.setIdlePose(scene.onResize())`.
**Where**: `src/main.js` (modifica)
**Depends on**: T2, T3, T4
**Reuses**: `cameraDirector.js` (T2); estrutura de `handleDrop`/`spawnRound` existente
**Requirement**: MOB-04, MOB-05, MOB-06, MOB-07

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Arrastar um brinquedo aproxima a câmera suavemente (checado em `npm run dev`); soltar retorna ao diorama
- [ ] Completar rodada dispara o passeio de celebração e retorna ao diorama quando a nova rodada é interativa
- [ ] `window.__game.state().camera.mode` reflete o estado atual
- [ ] `npm run build && npm test` passa

**Tests**: none (fluxo coberto no E2E de T9)
**Gate**: build
**Commit**: `feat(camera): wire live camera director into gameplay`

---

### T6: Criar `fullscreen.js` (fullscreen + orientation lock + portrait guard)

**What**: `requestGameFullscreen(canvas)` (feature-detected, silencioso em falha); `createPortraitGuard({overlayEl, onBlock, onUnblock})` escutando `resize`/`orientationchange`.
**Where**: `src/fullscreen.js`
**Depends on**: None
**Reuses**: Padrão de feature-detection de `main.js:15-23` (`webglAvailable`)
**Requirement**: MOB-01, MOB-02, MOB-03

**Tools**:
- MCP: `context7` (Fullscreen API / Screen Orientation API atuais)
- Skill: NONE

**Done when**:
- [ ] `requestGameFullscreen` não lança erro não tratado em navegador sem suporte (checado via `#nowebgl`-like flag manual ou DevTools)
- [ ] `PortraitGuard.isPortrait()` reflete `window.innerWidth < window.innerHeight`
- [ ] `npm run build` passa

**Tests**: none
**Gate**: build
**Commit**: `feat(mobile): add fullscreen request and portrait guard`

---

### T7: Integrar fullscreen + overlay de retrato em `main.js`/`index.html`

**What**: Botão play chama `requestGameFullscreen(canvas)` no mesmo gesto; novo `<div id="portrait-overlay">` em `index.html`; `createPortraitGuard` pausa o jogo (`isBlocked` combinado com o de `transitions.js` da feature `visual-bluey`, ou `Array.some()` de blockers) e solta o brinquedo em arrasto no lugar (reuso de `settle`) quando o retrato aparece.
**Where**: `src/main.js` (modifica), `index.html` (modifica)
**Depends on**: T6, T5
**Reuses**: `fullscreen.js` (T6); `feedback.settle` existente; mecanismo `isBlocked` de `drag.js` (T4)
**Requirement**: MOB-01, MOB-02, MOB-03

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Tocar play em viewport landscape simulado entra em fullscreen (ou degrada silenciosamente se a API faltar)
- [ ] Girar para retrato mostra o overlay e pausa o input; girar de volta remove o overlay e retoma
- [ ] Arrasto ativo ao entrar em retrato assenta o brinquedo no lugar (sem perda de estado)
- [ ] `npm run build && npm test` passa

**Tests**: none (fluxo coberto no E2E de T9)
**Gate**: build
**Commit**: `feat(mobile): wire fullscreen and portrait overlay into gameplay`

---

### T8: Documentar acesso via rede local (LAN)

**What**: `README.md` (ou seção em `docs/`) documentando `npm run dev -- --host` e `npm run preview -- --host`, com nota de que nenhuma funcionalidade de jogo depende de secure context.
**Where**: `README.md` (cria se não existir) ou `docs/lan.md`
**Depends on**: None
**Reuses**: Suporte nativo do Vite (`--host`), sem código novo
**Requirement**: MOB-03

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Instruções testadas manualmente: `npm run dev -- --host` expõe um IP de rede local acessível de outro dispositivo
- [ ] `npm run build` passa

**Tests**: none
**Gate**: build
**Commit**: `docs: document LAN access via vite --host`

---

### T9: Reescrever cenário E2E 05 (retrato) + novo cenário de câmera viva

**What**: Reescrever `e2e/scenarios/05-robustez.md` para o novo contrato de retrato (overlay + pausa, não mais "afasta câmera"); criar `e2e/scenarios/06-camera-viva.md` cobrindo follow durante arrasto, retorno ao idle, e passeio de celebração, via `window.__game.state().camera.mode`.
**Where**: `e2e/scenarios/05-robustez.md` (modifica), `e2e/scenarios/06-camera-viva.md` (novo)
**Depends on**: T7
**Reuses**: Estrutura de cenário prompt-guiado existente (AD-006)
**Requirement**: MOB-01, MOB-02, MOB-04, MOB-05

**Tools**:
- MCP: `plugin_playwright_playwright` (via Playwright MCP)
- Skill: NONE

**Done when**:
- [ ] Cenário 05 verde com o novo comportamento de retrato (overlay+pausa)
- [ ] Cenário 06 verde: `camera.mode` alterna `idle→follow→emphasis→return→idle` num acerto, e passa por `celebrate` numa rodada completa
- [ ] `npm run build && npm test` passa

**Tests**: e2e
**Gate**: full
**Commit**: `test(e2e): update portrait scenario, add live camera scenario`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4

Phase 1:  T1 ──→ T2
Phase 2:  T3 ──→ T4 ──→ T5
Phase 3:  T6 ──→ T7
Phase 4:  T8 ──→ T9
```

**Batching sugerido para Execute** (9 tasks > ~8, offer de sub-agentes será feito): Batch 1 = Phase 1 + Phase 2 (5 tasks), Batch 2 = Phase 3 + Phase 4 (4 tasks).

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: `cameraFraming.js` | 1 módulo (2 funções puras) | ✅ Granular |
| T2: `cameraDirector.js` | 1 módulo (1 máquina de estados) | ✅ Granular |
| T3: Refatorar `onResize` | 1 arquivo, 1 função | ✅ Granular |
| T4: Estender `drag.js` | 1 arquivo, 2 parâmetros opcionais | ✅ Granular |
| T5: Integrar director em `main.js` | 1 arquivo, 1 conceito coeso (fiação de câmera) | ✅ Granular |
| T6: `fullscreen.js` | 1 módulo (2 funções) | ✅ Granular |
| T7: Integrar fullscreen+retrato | 2 arquivos, 1 conceito coeso | ✅ Granular |
| T8: Docs LAN | 1 arquivo | ✅ Granular |
| T9: Revisão E2E | 2 arquivos de cenário, 1 conceito | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ----------------------- | -------------- | ------ |
| T1 | None | (início da Phase 1) | ✅ Match |
| T2 | T1 | T1→T2 | ✅ Match |
| T3 | T1 | (início da Phase 2, depende de T1 da fase anterior) | ✅ Match |
| T4 | None | T3→T4 (sequencial na fase) | ✅ Match |
| T5 | T2, T3, T4 | T4→T5 (+ depende de T2, fase anterior) | ✅ Match |
| T6 | None | (início da Phase 3) | ✅ Match |
| T7 | T6, T5 | T6→T7 (+ depende de T5, fase anterior) | ✅ Match |
| T8 | None | (início da Phase 4) | ✅ Match |
| T9 | T7 | T8→T9 (sequencial na fase; dependência real é T7, fase anterior) | ✅ Match |

Nenhuma dependência aponta para uma fase posterior — todas apontam para trás ou dentro da mesma fase.

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | ----------------------------- | ------------------ | ----------- | ------ |
| T1 | Lógica de câmera (`cameraFraming.js`) | unit | unit | ✅ OK |
| T2 | Lógica de câmera (`cameraDirector.js`) | unit | unit | ✅ OK |
| T3 | Renderização (`scene.js`) | none | none | ✅ OK |
| T4 | Renderização (`drag.js`) | none | none | ✅ OK |
| T5 | Renderização (`main.js`) | none | none | ✅ OK |
| T6 | Renderização/browser API (`fullscreen.js`) | none | none | ✅ OK |
| T7 | Renderização (`main.js`, `index.html`) | none | none | ✅ OK |
| T8 | Docs | none | none | ✅ OK |
| T9 | Fluxo integrado (E2E) | e2e | e2e | ✅ OK |

Nenhuma violação — as duas únicas camadas testáveis unitariamente (`cameraFraming.js`, `cameraDirector.js`) têm seus testes co-localizados nas próprias T1/T2.

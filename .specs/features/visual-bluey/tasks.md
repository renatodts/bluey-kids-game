# Visual Bluey Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/visual-bluey/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase sampling (`src/game.js` + `src/game.test.js`, precedente de `hora-de-guardar/tasks.md`). Guidelines found: nenhum `AGENTS.md`/`CLAUDE.md`/`CONTRIBUTING.md` no repo — convenção inferida do código existente (AD-004: lógica pura testada, renderização validada manual/e2e).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------- | ---------------------- | ------------------ | ------------- |
| Lógica de transição (`src/transitions.js`) — DOM injetado, sem `three` | unit (Vitest) | Todos os branches; 1:1 com AC VIS-06/07 (`open`/`close`/`state`/`isBlocking`/não-sobreposição); overlay mockado (objeto com `.animate()` stub), sem jsdom | `src/*.test.js` | `npm test` |
| Módulos de renderização (`src/materials.js`, `src/room.js`, `src/scene.js`, `src/boxes.js`, `src/toys.js`, `src/bluey.js`, `src/feedback.js`) | none | — (build gate; comportamento coberto pelos fluxos E2E, mesmo padrão de `hora-de-guardar`) | — | `npm run build` |
| Fluxos integrados (abertura, Bluey reagindo, transição entre rodadas) | e2e (Playwright MCP, prompt-guided, AD-006) | Cenários cobrindo AC VIS-01..07 via `window.__game` hook (`bluey.source`, `bluey.mode`, `transition`) + screenshots | `e2e/scenarios/*.md` | Executar cenário via Playwright MCP contra `vite preview` |

## Gate Check Commands

> Reusa o padrão já validado em `hora-de-guardar/tasks.md`.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tasks com testes unitários (`transitions.js`) | `npm test` |
| Build | Tasks só de renderização/config | `npm run build && npm test` |
| Full | Tasks de fluxo integrado | `npm run build && npm test` + executar o(s) cenário(s) E2E da task via Playwright MCP |

---

## Execution Plan

### Phase 1: Palco — materiais, sala, luz e sombra

```
T1 → T2 → T3 → T4 → T5
```

### Phase 2: Bluey — personagem 3D

```
T6 → T7 → T8
```

### Phase 3: Transições estilo desenho

```
T9 → T10
```

### Phase 4: Revisão E2E

```
T11
```

---

## Task Breakdown

### T1: Criar `materials.js` (fábrica de material toon)

**What**: Módulo com `GRADIENT_MAP` (DataTexture 3 bandas) e `toonMaterial(color, extra)` compartilhados por todo o projeto.
**Where**: `src/materials.js`
**Depends on**: None
**Reuses**: Nenhum (nova base) — segue o padrão de fábrica simples de `toys.js`
**Requirement**: VIS-01

**Tools**:
- MCP: `context7` (verificar API atual de `MeshToonMaterial`/`DataTexture` antes de codar)
- Skill: `threejs-materials`

**Done when**:
- [x] `toonMaterial()` retorna `MeshToonMaterial` com `gradientMap` de 3 bandas
- [x] `npm run build` passa

**Tests**: none
**Gate**: build
**Commit**: `feat(visual): add shared toon material factory`

---

### T2: Criar `room.js` (mobília da sala dos Heeler)

**What**: Grupo com sofá, tapete, janela e quintal ensolarado (primitivas compostas, estilo `toys.js`), usando `toonMaterial`; exporta `ROOM_CLEARANCE`.
**Where**: `src/room.js`
**Depends on**: T1
**Reuses**: `materials.js` (T1); padrão de composição de `toys.js`/`boxes.js`
**Requirement**: VIS-01

**Tools**:
- MCP: `context7`
- Skill: `threejs-geometry`, `threejs-materials`

**Done when**:
- [x] `createRoom()` retorna `THREE.Group` com no mínimo sofá, tapete, janela+quintal
- [x] `ROOM_CLEARANCE` exportado não colide com `FLOOR_BOUNDS` de `game.js` (checagem manual visual)
- [x] `npm run build` passa

**Tests**: none
**Gate**: build
**Commit**: `feat(visual): add stylized Heeler living room`

---

### T3: Integrar sala + sombras + luz quente em `scene.js`

**What**: `scene.js` chama `createRoom()`, converte piso/parede/frames para `toonMaterial`, liga `renderer.shadowMap` (PCFSoftShadowMap), adiciona luz direcional quente com `castShadow` e frustum ajustado a `ROOM`.
**Where**: `src/scene.js` (modifica)
**Depends on**: T2
**Reuses**: `applyArtTexture`/`themeStatus` (fallback de arte inalterado); `room.js` (T2)
**Requirement**: VIS-01, VIS-02

**Tools**:
- MCP: `context7`
- Skill: `threejs-lighting`, `threejs-materials`

**Done when**:
- [x] Sala dos Heeler visível em `npm run dev` com sombras suaves e luz quente
- [x] Frames/plaquetas continuam com fallback de cor sólida se a textura falhar (regressão zero de GUARD-08.4)
- [x] `npm run build` passa

**Tests**: none
**Gate**: build
**Commit**: `feat(visual): shadows, warm light and room integration in scene.js`

---

### T4: Migrar `boxes.js` para material toon

**What**: Trocar `MeshLambertMaterial` por `toonMaterial()` em cesta/baú/cama; manter `castShadow`/`receiveShadow` coerentes.
**Where**: `src/boxes.js` (modifica)
**Depends on**: T1
**Reuses**: `materials.js` (T1)
**Requirement**: VIS-01

**Tools**:
- MCP: NONE
- Skill: `threejs-materials`

**Done when**:
- [x] Caixas usam `toonMaterial`; nenhuma mudança de posição/`snapRadius`/`userData.boxType` (mecânica intacta)
- [x] `npm run build` passa

**Tests**: none
**Gate**: build
**Commit**: `feat(visual): toon-shade storage boxes`

---

### T5: Migrar `toys.js` para material toon

**What**: Trocar `MeshLambertMaterial` por `toonMaterial()` em ball/block/plush.
**Where**: `src/toys.js` (modifica)
**Depends on**: T1
**Reuses**: `materials.js` (T1)
**Requirement**: VIS-01

**Tools**:
- MCP: NONE
- Skill: `threejs-materials`

**Done when**:
- [x] Brinquedos usam `toonMaterial`; `userData.type`/`userData.toyId` inalterados (mecânica intacta)
- [x] `npm run build` passa

**Tests**: none
**Gate**: build
**Commit**: `feat(visual): toon-shade toys`

---

### T6: Criar `bluey.js` — Bluey procedural (fallback, AD-008)

**What**: `createBluey({scene, cornerPosition, centerPosition})` com modelo procedural low-poly (composição de primitivas, estilo `toys.js`) e máquina de estados idle/cheer/dance (tween próprio, padrão `feedback.js`); `source: 'procedural'` fixo nesta task.
**Where**: `src/bluey.js`
**Depends on**: T1
**Reuses**: `materials.js` (T1); padrão de tween de `feedback.js` (`addTween`/`cancel`); padrão de composição de `toys.js`
**Requirement**: VIS-03, VIS-05

**Tools**:
- MCP: `context7`
- Skill: `threejs-geometry`, `threejs-animation`, `threejs-materials`

**Done when**:
- [x] `bluey.cheer()` reinicia corretamente se chamado durante um cheer em andamento (AC VIS-03.6, checado manualmente disparando duas vezes seguidas)
- [x] `bluey.danceAt(pos, duration)` desloca ao centro e `returnToCorner()` volta à posição original
- [x] Bluey nunca é adicionada ao array `toys` do raycast de arrasto (AC VIS-03.5 — checagem de código)
- [x] `npm run build` passa

**Tests**: none
**Gate**: build
**Commit**: `feat(visual): add procedural Bluey character with idle/cheer/dance states`

---

### T7: Adicionar carregamento GLTF com fallback em `bluey.js`

**What**: `loadBlueyModel()` tenta `GLTFLoader` em `/bluey/bluey.glb`; sucesso → substitui o procedural, `source: 'gltf'`; falha/ausência → mantém procedural (T6), `source: 'procedural'`; animação sempre procedural (bob/squash) independente de clipes do GLTF (edge case da spec).
**Where**: `src/bluey.js` (modifica)
**Depends on**: T6
**Reuses**: Padrão de fallback de `applyArtTexture` (`scene.js:23`), adaptado para modelo 3D (ver skill `threejs-loaders`)
**Requirement**: VIS-04

**Tools**:
- MCP: `context7`
- Skill: `threejs-loaders`

**Done when**:
- [x] Com `assets/bluey/bluey.glb` ausente: `bluey.source === 'procedural'`, jogo funcional, `console.warn` (padrão GUARD-08.4)
- [x] Se o arquivo `assets/bluey/bluey.glb` já estiver presente (baixado manualmente pelo usuário — ver `docs/references.md`): `bluey.source === 'gltf'` e o modelo aparece na cena
- [x] `npm run build` passa
- [x] **Nota de execução**: se `assets/bluey/bluey.glb` ainda não existir no momento desta task, o caminho GLTF fica implementado e testado só pelo ramo de fallback; validar o ramo de sucesso assim que o arquivo chegar (não bloqueia as próximas tasks)

**Tests**: none
**Gate**: build
**Commit**: `feat(visual): load fan-made Bluey GLTF with procedural fallback`

---

### T8: Integrar Bluey em `main.js` (hook + gatilhos) e remover cheer 2D antigo

**What**: `main.js` cria `bluey`; `feedback.stored()` chama `bluey.cheer()` em vez de `showCheer()`; `roundComplete` chama `bluey.danceAt(center, 3)`; remove `createCheer`/`showCheer`/`cheer` de `feedback.js` e `themeStatus.cheerLoaded`/`cheerVisible` de `scene.js`; hook `window.__game.state()` ganha `bluey: {source, mode}`.
**Where**: `src/main.js`, `src/feedback.js`, `src/scene.js` (modifica)
**Depends on**: T7
**Reuses**: Estrutura de composição existente de `main.js`; `createFeedback` estendido via parâmetro `bluey` injetado (mesmo padrão de injeção de `floorY`)
**Requirement**: VIS-03, VIS-04

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Acertar um brinquedo dispara `bluey.cheer()` (checado em `npm run dev`)
- [ ] Completar rodada dispara `bluey.danceAt()` junto da chuva de confete existente
- [ ] `window.__game.state().bluey` retorna `{source, mode}` coerente
- [ ] `themeStatus.cheerLoaded`/`cheerVisible` removidos sem quebrar `framesLoaded`/`plaquesLoaded`
- [ ] `npm run build && npm test` passa

**Tests**: none (fluxo coberto no E2E de T11)
**Gate**: build
**Commit**: `feat(visual): wire Bluey reactions into gameplay, retire 2D cheer billboard`

---

### T9: Criar `transitions.js` (iris DOM) + overlay em `index.html`

**What**: `createTransitions(overlayEl)` com `open()`/`close()`/`state`/`isBlocking()`; usa `Element.animate()` (Web Animations API) para o efeito iris via `clip-path`; guarda de não sobreposição (chamada durante transição ativa retorna a Promise em andamento). Novo `<div id="transition-overlay">` em `index.html`.
**Where**: `src/transitions.js`, `index.html` (modifica)
**Depends on**: None (paralelo às Phases 1-2, mas sequenciado aqui por ordem de fases)
**Reuses**: Nenhum componente 3D — DOM puro, decisão de design explícita
**Requirement**: VIS-06, VIS-07

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Testes unitários cobrem: `open()`/`close()` resolvem e mudam `state` corretamente; chamada repetida durante transição ativa não inicia uma segunda animação (AC VIS-07.5); `isBlocking()` reflete `state !== 'none'`
- [ ] Gate passa: `npm test`
- [ ] Test count: 4+ testes passam (sem deleção silenciosa)

**Tests**: unit
**Gate**: quick
**Commit**: `feat(visual): add DOM iris transition controller`

---

### T10: Integrar transições em `main.js` + gate de input em `drag.js`

**What**: Botão play chama `transitions.open()` após remover o overlay inicial; rodada completa faz `transitions.close()` → `spawnRound()` → `transitions.open()`; `createDrag` recebe `isBlocked: () => transitions.isBlocking()`; hook ganha `window.__game.state().transition`.
**Where**: `src/main.js` (modifica), `src/drag.js` (modifica — parâmetro `isBlocked` opcional)
**Depends on**: T9, T8
**Reuses**: `transitions.js` (T9); estrutura de `handleDrop`/`spawnRound` existente
**Requirement**: VIS-06, VIS-07

**Tools**:
- MCP: NONE
- Skill: NONE

**Done when**:
- [ ] Tocar play mostra a transição de abertura antes do jogo ficar interativo
- [ ] Completar rodada mostra iris fechar/abrir entre a remoção dos brinquedos antigos e o spawn dos novos
- [ ] Arrastar durante uma transição não move nada (`isBlocked()` ativo)
- [ ] `npm run build && npm test` passa

**Tests**: none (fluxo coberto no E2E de T11)
**Gate**: build
**Commit**: `feat(visual): wire opening and round transitions into gameplay`

---

### T11: Revisar cenários E2E afetados (04 e 02)

**What**: Reescrever `e2e/scenarios/04-tema-e-fallback.md` para assertar `bluey.source`/`bluey.mode` em vez de `theme.cheerLoaded/cheerVisible` (removidos em T8); adicionar ao `e2e/scenarios/02-rodada-completa.md` os asserts de `transition` (abre/fecha entre rodadas) e `bluey.mode === 'dance'` durante a celebração.
**Where**: `e2e/scenarios/04-tema-e-fallback.md`, `e2e/scenarios/02-rodada-completa.md` (modifica)
**Depends on**: T10
**Reuses**: Estrutura de cenário prompt-guiado existente (AD-006)
**Requirement**: VIS-03, VIS-04, VIS-06, VIS-07

**Tools**:
- MCP: `plugin_playwright_playwright` (via Playwright MCP)
- Skill: NONE

**Done when**:
- [ ] Cenário 04 verde: `bluey.source` é `'gltf'` ou `'procedural'` conforme o asset disponível; fallback de frames/plaquetas continua coberto
- [ ] Cenário 02 verde: `transition` alterna `'closing'`→`'opening'`→`'none'` entre rodadas; `bluey.mode === 'dance'` observado durante a celebração
- [ ] `npm run build && npm test` passa

**Tests**: e2e
**Gate**: full
**Commit**: `test(e2e): update scenario 04 for Bluey character, extend scenario 02 for transitions`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4

Phase 1:  T1 ──→ T2 ──→ T3 ──→ T4 ──→ T5
Phase 2:  T6 ──→ T7 ──→ T8
Phase 3:  T9 ──→ T10
Phase 4:  T11
```

Execution é estritamente sequencial dentro de cada fase. T9 não depende de T1-T8 tecnicamente, mas é sequenciada após a Phase 2 para manter a ordem de fases simples (uma frente de trabalho por vez).

**Batching sugerido para Execute** (11 tasks > ~8, offer de sub-agentes será feito): Batch 1 = Phase 1 + Phase 2 (8 tasks), Batch 2 = Phase 3 + Phase 4 (3 tasks).

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: `materials.js` | 1 módulo (2 exports) | ✅ Granular |
| T2: `room.js` | 1 módulo (1 export + const) | ✅ Granular |
| T3: Integrar sala+sombra+luz em `scene.js` | 1 arquivo, 1 conceito coeso (palco) | ✅ Granular |
| T4: `boxes.js` → toon | 1 arquivo, troca de material | ✅ Granular |
| T5: `toys.js` → toon | 1 arquivo, troca de material | ✅ Granular |
| T6: Bluey procedural | 1 módulo novo, 1 conceito (personagem+estados) | ✅ Granular |
| T7: Bluey GLTF+fallback | 1 arquivo, 1 função (`loadBlueyModel`) | ✅ Granular |
| T8: Integração + remoção cheer 2D | 3 arquivos, 1 conceito coeso (fiação de reações) | ✅ Granular |
| T9: `transitions.js` + overlay | 2 arquivos, 1 conceito coeso (controlador de transição) | ✅ Granular |
| T10: Integrar transições + gate de input | 2 arquivos, 1 conceito coeso (fiação de transições) | ✅ Granular |
| T11: Revisão E2E | 2 arquivos de cenário, 1 conceito (asserts pós-mudança visual) | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ----------------------- | -------------- | ------ |
| T1 | None | (início da Phase 1) | ✅ Match |
| T2 | T1 | T1→T2 | ✅ Match |
| T3 | T2 | T2→T3 | ✅ Match |
| T4 | T1 | T1→T2→T3→T4 (sequencial na fase) | ✅ Match |
| T5 | T1 | T4→T5 (sequencial na fase) | ✅ Match |
| T6 | T1 | (início da Phase 2) | ✅ Match |
| T7 | T6 | T6→T7 | ✅ Match |
| T8 | T7 | T7→T8 | ✅ Match |
| T9 | None | (início da Phase 3) | ✅ Match |
| T10 | T9, T8 | T9→T10 (+ depende de T8, fase anterior) | ✅ Match |
| T11 | T10 | T10→T11 | ✅ Match |

Nenhuma dependência aponta para uma fase posterior — todas apontam para trás ou dentro da mesma fase.

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | ----------------------------- | ------------------ | ----------- | ------ |
| T1 | Renderização (`materials.js`) | none | none | ✅ OK |
| T2 | Renderização (`room.js`) | none | none | ✅ OK |
| T3 | Renderização (`scene.js`) | none | none | ✅ OK |
| T4 | Renderização (`boxes.js`) | none | none | ✅ OK |
| T5 | Renderização (`toys.js`) | none | none | ✅ OK |
| T6 | Renderização (`bluey.js`) | none | none | ✅ OK |
| T7 | Renderização (`bluey.js`) | none | none | ✅ OK |
| T8 | Renderização (`main.js`, `feedback.js`, `scene.js`) | none | none | ✅ OK |
| T9 | Lógica de transição (`transitions.js`) | unit | unit | ✅ OK |
| T10 | Renderização (`main.js`, `drag.js`) | none | none | ✅ OK |
| T11 | Fluxo integrado (E2E) | e2e | e2e | ✅ OK |

Nenhuma violação — todas as tasks de camada "renderização" usam `Tests: none` conforme a matriz; a única camada testável unitariamente (`transitions.js`) tem seus testes co-localizados na própria T9.

# "Hora de Guardar!" Tasks

## Execution Protocol (MANDATORY — do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its
Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill
is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy
review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/hora-de-guardar/design.md`
**Status**: In Progress (aprovado em 2026-07-08; execução via 2 batch workers: P1–P3 = T1–T8, P4–P5 = T9–T14)

---

## Test Coverage Matrix

> Gerada de spec + decisão do usuário (E2E guiado por prompt via Playwright MCP — AD-006).
> Guidelines encontradas: nenhuma no repo — defaults fortes aplicados. Confirmar antes do Execute.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
|---|---|---|---|---|
| Lógica de jogo (`src/game.js`) | unit (Vitest) | Todos os branches; 1:1 com ACs GUARD-02/03/04/05/06; todos os edge cases listados (storage quebrado, estados) | `src/*.test.js` | `npm test` |
| Módulos de renderização (`src/scene.js`, `src/toys.js`, `src/boxes.js`, `src/feedback.js`, `src/drag.js`) | none | — (build gate; comportamento coberto pelos fluxos E2E) | — | `npm run build` |
| Fluxos integrados (`src/main.js` + hook `window.__game`) | e2e (prompt-guided, Playwright MCP) | Cada fluxo de usuário da spec: feliz + edge + falha (GUARD-01/02/03/05/07/08/09), viewport desktop e mobile-touch | `e2e/scenarios/*.md` | agente executa o cenário via Playwright MCP contra `npm run dev` |

**Cenários E2E (prompt-guided):** arquivos Markdown com passos numerados + asserts sobre
`window.__game.state()` + screenshot de evidência. O agente executa com as tools do MCP
(`browser_navigate`, `browser_evaluate` disparando Pointer Events em coordenadas de
`__game.screenPos()`, `browser_resize`, `browser_take_screenshot`).

## Gate Check Commands

> Geradas do stack escolhido — confirmar antes do Execute.

| Gate Level | When to Use | Command |
|---|---|---|
| Quick | Tasks com testes unitários | `npm test` |
| Build | Tasks só de renderização/config | `npm run build && npm test` |
| Full | Tasks de fluxo integrado | `npm run build && npm test` + executar os cenários E2E da task via Playwright MCP |

---

## Execution Plan

Fases ordenadas; tasks em ordem dentro da fase.

### Phase 1: Fundação (lógica pura)
```
T1 → T2 → T3
```
### Phase 2: Cena
```
T4 → T5 → T6
```
### Phase 3: Interação integrada
```
T7 → T8
```
### Phase 4: Feedback, tema e som
```
T9 → T10 → T11 → T12
```
### Phase 5: Polimento e E2E completo
```
T13 → T14
```

---

## Task Breakdown

### T1: Scaffold do projeto

**What**: Projeto Vite + three + vitest funcionando: `package.json` (scripts `dev`/`build`/`test`), `index.html` (canvas + overlay de tela inicial), `src/main.js` stub, `.gitignore`.
**Where**: raiz, `index.html`, `src/main.js`
**Depends on**: None | **Reuses**: — | **Requirement**: GUARD-07 (base)
**Tools**: MCP: NONE | Skill: NONE
**Done when**:
- [x] `npm run dev` serve a página; `npm run build` passa; `npm test` roda (0 testes) sem erro
**Tests**: none | **Gate**: build
**Commit**: `chore: scaffold vite + three + vitest`

### T2: game.js — rodada, matching e estados

**What**: `createGame`, `startRound` (6/9/12, tipos equilibrados, RNG semeável para cor/posição), `tryStore` (stored/rejected), `isRoundComplete`, máquina de estados de brinquedo/rodada. Testes unitários 1:1 com GUARD-02/03/04 + transições.
**Where**: `src/game.js`, `src/game.test.js`
**Depends on**: T1 | **Reuses**: — | **Requirement**: GUARD-02, GUARD-03, GUARD-04
**Tools**: MCP: NONE | Skill: NONE
**Done when**:
- [x] ACs de matching e geração cobertos por testes que derivam da spec (não da implementação)
- [x] Gate passa: `npm test`; contagem de testes registrada no commit
**Tests**: unit | **Gate**: quick
**Commit**: `feat(game): round generation, matching and state machine`

### T3: game.js — progressão e persistência

**What**: `advanceRound` (6→9→12, depois repete 12), wrapper de storage tolerante a exceção, retomada da rodada salva, fallback rodada 1. Testes com storage stub e storage que lança.
**Where**: `src/game.js`, `src/game.test.js`
**Depends on**: T2 | **Reuses**: T2 | **Requirement**: GUARD-05 (lógica), GUARD-06
**Tools**: MCP: NONE | Skill: NONE
**Done when**:
- [x] ACs GUARD-06.1–.4 e progressão GUARD-04.1 cobertos; `npm test` passa
**Tests**: unit | **Gate**: quick
**Commit**: `feat(game): round progression and tolerant persistence`

### T4: scene.js — palco com câmera fixa

**What**: Renderer, `PerspectiveCamera` fixa, luzes, chão + parede, quadros placeholder (cor sólida), resize responsivo que mantém a cena visível.
**Where**: `src/scene.js` (+ uso em `src/main.js`)
**Depends on**: T1 | **Reuses**: padrão de resize dos exemplos Three.js | **Requirement**: GUARD-07
**Tools**: MCP: `context7` (API three atual) | Skill: NONE
**Done when**:
- [x] Diorama visível em `npm run dev`; sem controles de câmera; `npm run build` passa
**Tests**: none | **Gate**: build
**Commit**: `feat(scene): fixed-camera diorama room`

### T5: toys.js — fábrica de brinquedos

**What**: `createToyMesh(type, color)` para `ball`/`block`/`plush` com primitivas compostas, `userData` com id/tipo.
**Where**: `src/toys.js`
**Depends on**: T4 | **Reuses**: primitivas three | **Requirement**: GUARD-04 (visual)
**Tools**: MCP: `context7` | Skill: NONE
**Done when**:
- [x] 3 tipos distinguíveis a olho nu em cena de teste; build passa
**Tests**: none | **Gate**: build
**Commit**: `feat(toys): low-poly toy factory`

### T6: boxes.js — cesta, baú e caminha

**What**: `createBoxes()` com malha, `type`, `snapRadius` generoso e placas placeholder com fallback de cor sólida (estrutura pronta para receber arte em T12).
**Where**: `src/boxes.js`
**Depends on**: T4 | **Reuses**: T4 | **Requirement**: GUARD-02/03 (alvos), GUARD-08 (estrutura)
**Tools**: MCP: `context7` | Skill: NONE
**Done when**:
- [x] 3 caixas posicionadas na frente do diorama; fallback de textura funciona; build passa
**Tests**: none | **Gate**: build
**Commit**: `feat(boxes): three target boxes with plaque slots`

### T7: drag.js — arrasto por plano do chão

**What**: Pointer Events (`pointerdown/move/up/cancel`, `setPointerCapture`), raycast para pegar brinquedo (hit mais próximo), arrasto preso ao plano do chão com clamp na área da sala, elevação ao pegar, 1 ponteiro por vez, `onDrop(toyId, posXZ)`.
**Where**: `src/drag.js`
**Depends on**: T4, T5 | **Reuses**: padrão raycast/plane (Context7) | **Requirement**: GUARD-01
**Tools**: MCP: `context7` | Skill: NONE
**Done when**:
- [x] Arrasto funciona com mouse em `npm run dev`; build passa (comportamento completo é gate do T8)
**Tests**: none (fluxo coberto no E2E de T8) | **Gate**: build
**Commit**: `feat(drag): floor-plane pointer dragging`

### T8: Integração jogo↔cena + hook de teste + E2E cenário 01

**What**: `main.js` liga drag→game→cena: solta perto da caixa certa → some (placeholder imediato), errada → volta ao spawn, fora → assenta. Expõe `window.__game` (`state()`, `screenPos()`, `seed()`). Escreve e executa `e2e/scenarios/01-arrastar-e-guardar.md` (feliz + errada + fora + multi-touch, desktop e mobile-touch).
**Where**: `src/main.js`, `e2e/scenarios/01-arrastar-e-guardar.md`
**Depends on**: T2, T3, T6, T7 | **Reuses**: tudo anterior | **Requirement**: GUARD-01, GUARD-02, GUARD-03
**Tools**: MCP: `playwright` | Skill: NONE
**Done when**:
- [x] Cenário 01 executado via Playwright MCP com todos os asserts de `__game.state()` verdes + screenshots de evidência
- [x] `npm run build && npm test` passa
**Tests**: e2e | **Gate**: full
**Commit**: `feat(main): wire drag to game logic with test hook + e2e scenario 01`

### T9: feedback.js — tweens de acerto/erro

**What**: Mini-tween (lerp+easing): sugar para caixa com pulo, quicar de volta, balançar caixa; substitui os placeholders do T8.
**Where**: `src/feedback.js` (+ integração em `main.js`)
**Depends on**: T8 | **Reuses**: T8 | **Requirement**: GUARD-02, GUARD-03
**Tools**: MCP: NONE | Skill: NONE
**Done when**:
- [ ] Animações visíveis e sem travar o arrasto seguinte; build passa; cenário 01 continua verde (re-executar)
**Tests**: none (coberto pelo re-run do cenário 01) | **Gate**: full
**Commit**: `feat(feedback): store/reject tweens`

### T10: Celebração de rodada + auto-avanço + E2E cenário 02

**What**: Confete de partículas (pool limitado), celebração grande ao completar rodada, avanço automático ~4s, integração com persistência. Escreve e executa `e2e/scenarios/02-rodada-completa.md` (completa rodada com `seed()`, verifica celebração, avanço 6→9 e retomada após reload).
**Where**: `src/feedback.js`, `src/main.js`, `e2e/scenarios/02-rodada-completa.md`
**Depends on**: T9 | **Reuses**: T3, T9 | **Requirement**: GUARD-04, GUARD-05, GUARD-06
**Tools**: MCP: `playwright` | Skill: NONE
**Done when**:
- [ ] Cenário 02 verde (incluindo reload/persistência); `npm run build && npm test` passa
**Tests**: e2e | **Gate**: full
**Commit**: `feat(feedback): round celebration, auto-advance + e2e scenario 02`

### T11: Som + tela inicial + E2E cenário 03

**What**: WebAudio com unlock no botão play da tela inicial, som de acerto e fanfarra (assets livres kenney/freesound em `assets/sounds/`), modo silencioso tolerante. Escreve e executa `e2e/scenarios/03-audio.md` (unlock, flag de áudio no `__game.state()`, jogo funcional com áudio bloqueado).
**Where**: `src/feedback.js`, `src/main.js`, `index.html`, `assets/sounds/`, `e2e/scenarios/03-audio.md`
**Depends on**: T10 | **Reuses**: T10 | **Requirement**: GUARD-09
**Tools**: MCP: `playwright`; WebSearch/WebFetch (baixar sons livres) | Skill: NONE
**Done when**:
- [ ] Cenário 03 verde; sons tocam após play; sem erro quando áudio bloqueado
**Tests**: e2e | **Gate**: full
**Commit**: `feat(audio): unlockable webaudio + start screen + e2e scenario 03`

### T12: Assets Bluey + E2E cenário 04

**What**: Baixar e tratar (≤1024px) key art/personagens do media hub (`docs/references.md`) em `assets/bluey/`; aplicar nos quadros, placas (Bluey/Bingo/Chilli) e aparição da Bluey comemorando (~2s por acerto). Escreve e executa `e2e/scenarios/04-tema-e-fallback.md` (tema presente; renomear asset → fallback de cor e jogo funcional).
**Where**: `assets/bluey/`, `src/scene.js`, `src/boxes.js`, `src/feedback.js`, `e2e/scenarios/04-tema-e-fallback.md`
**Depends on**: T10 | **Reuses**: fallbacks de T4/T6 | **Requirement**: GUARD-08
**Tools**: MCP: `playwright`; WebFetch (media hub) | Skill: NONE
**Done when**:
- [ ] Cenário 04 verde nos dois modos (com assets e com fallback); AD-005 respeitado (assets fora de qualquer publicação)
**Tests**: e2e | **Gate**: full
**Commit**: `feat(theme): official bluey art with solid-color fallback + e2e scenario 04`

### T13: Robustez de viewport e edge cases + E2E cenário 05

**What**: Resize/rotação durante arrasto, retrato funcional, `pointercancel`/saída da janela, detecção de WebGL ausente com mensagem estática. Escreve e executa `e2e/scenarios/05-robustez.md` (resize mid-drag, retrato, pointercancel).
**Where**: `src/scene.js`, `src/drag.js`, `src/main.js`, `e2e/scenarios/05-robustez.md`
**Depends on**: T8 | **Reuses**: T4/T7 | **Requirement**: GUARD-07 + edge cases da spec
**Tools**: MCP: `playwright` | Skill: NONE
**Done when**:
- [ ] Cenário 05 verde em viewport desktop e mobile; `npm run build && npm test` passa
**Tests**: e2e | **Gate**: full
**Commit**: `fix(viewport): resilient resize, cancel and portrait handling + e2e scenario 05`

### T14: Passada E2E completa

**What**: Executar TODOS os cenários (01–05) em sequência, viewport desktop e mobile-touch, num build de produção (`vite preview`); corrigir o que quebrar; registrar evidências (screenshots) e contagens no relatório da task.
**Where**: `e2e/scenarios/*`, correções pontuais
**Depends on**: T11, T12, T13 | **Reuses**: todos | **Requirement**: todos (GUARD-01..09)
**Tools**: MCP: `playwright` | Skill: NONE
**Done when**:
- [ ] 5 cenários verdes contra `vite preview`; `npm run build && npm test` passa
**Tests**: e2e | **Gate**: full
**Commit**: `test(e2e): full prompt-guided pass on production build`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

Phase 1:  T1 ──→ T2 ──→ T3
Phase 2:  T4 ──→ T5 ──→ T6
Phase 3:  T7 ──→ T8
Phase 4:  T9 ──→ T10 ──→ T11 ──→ T12
Phase 5:  T13 ──→ T14
```

14 tasks → empacotamento em batches (~7 tasks, fases inteiras): **Batch 1** = P1+P2 (6 tasks),
**Batch 2** = P3+P4 (6 tasks), **Batch 3** = P5 (2 tasks) → oferta de 3 sub-agents no Execute
(oferta obrigatória por >8 tasks; usuário decide). Verifier automático após T14.

---

## Task Granularity Check

| Task | Scope | Status |
|---|---|---|
| T1 | scaffold (1 conjunto de config coeso) | ✅ |
| T2 | 1 módulo lógico + testes co-locados | ✅ |
| T3 | extensão do mesmo módulo + testes | ✅ |
| T4–T7 | 1 módulo cada | ✅ |
| T8 | 1 arquivo de composição + 1 cenário E2E | ✅ (coeso: integração é indivisível) |
| T9 | 1 módulo | ✅ |
| T10–T13 | 1 fluxo + 1 cenário E2E cada | ✅ |
| T14 | execução de suite + correções | ✅ |

## Diagram-Definition Cross-Check

| Task | Depends On (body) | Diagram | Status |
|---|---|---|---|
| T1 | None | início P1 | ✅ |
| T2 | T1 | T1→T2 | ✅ |
| T3 | T2 | T2→T3 | ✅ |
| T4 | T1 | P1→P2 (T4 primeiro da fase) | ✅ |
| T5 | T4 | T4→T5 | ✅ |
| T6 | T4 | T5→T6 (ordem de fase; dependência real T4, fase anterior à execução de T6) | ✅ |
| T7 | T4, T5 | P2→P3 | ✅ |
| T8 | T2,T3,T6,T7 | T7→T8 (demais em fases anteriores) | ✅ |
| T9 | T8 | P3→P4 | ✅ |
| T10 | T9 | T9→T10 | ✅ |
| T11 | T10 | T10→T11 | ✅ |
| T12 | T10 | T11→T12 (ordem de fase; dependência real T10) | ✅ |
| T13 | T8 | P4→P5 | ✅ |
| T14 | T11,T12,T13 | T13→T14 | ✅ |

Nenhuma dependência aponta para fase posterior. ✅

## Test Co-location Validation

| Task | Layer | Matrix exige | Task diz | Status |
|---|---|---|---|---|
| T1 | config/scaffold | none | none | ✅ |
| T2 | lógica de jogo | unit | unit | ✅ |
| T3 | lógica de jogo | unit | unit | ✅ |
| T4–T6 | renderização | none | none | ✅ |
| T7 | renderização/input (módulo) | none | none (fluxo coberto no E2E de T8, mesmo batch/fase seguinte imediata — merge forward permitido) | ✅ |
| T8 | fluxo integrado | e2e | e2e (cenário 01) | ✅ |
| T9 | renderização | none | none + re-run cenário 01 | ✅ |
| T10 | fluxo integrado | e2e | e2e (cenário 02) | ✅ |
| T11 | fluxo integrado | e2e | e2e (cenário 03) | ✅ |
| T12 | fluxo integrado | e2e | e2e (cenário 04) | ✅ |
| T13 | fluxo integrado | e2e | e2e (cenário 05) | ✅ |
| T14 | suite E2E | e2e | e2e (todos) | ✅ |

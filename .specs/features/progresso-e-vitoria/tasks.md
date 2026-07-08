# Progresso e Vitória — Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/progresso-e-vitoria/design.md`
**Status**: In Progress

**Nota de baseline (decisão do usuário, 2026-07-08):** a working tree contém trabalho
não commitado da feature de câmera (camera-controls + recuo de abertura em
`main.js`/`scene.js`/`drag.js`/`toys.js` + cenários E2E). O usuário escolheu "seguir
por cima": os commits das tasks que tocam esses arquivos incluirão também essas
mudanças pré-existentes. `glow-*.png` e `assets/bluey/bluey.glb` ficam fora dos commits.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec — guidelines found: `.specs/STATE.md` AD-004 (lógica pura testada com Vitest; render validado via E2E/manual) e AD-006 (E2E guiado por prompt via Playwright MCP sobre `e2e/scenarios/*.md` + hook `window.__game`).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Lógica pura (`game.js`) | unit | Todas as branches novas; 1:1 com ACs WIN-05/07 e lógica de WIN-02/03/09; todos os edge cases de storage listados | `src/game.test.js` | `npm test` |
| Controlador DOM com elementos injetados (`hud.js`) | unit (elementos mockados, padrão `transitions.test.js`) | 1:1 com ACs de HUD (WIN-01/02/03); clamps de entrada | `src/hud.test.js` | `npm test` |
| Composição/render (`main.js`, `feedback.js`, `index.html`) | e2e (cenário prompt, AD-006) | Fluxo feliz de vitória + replay + edge cases visíveis (HUD, botão, save antigo); executado na validação (Verifier) via Playwright MCP | `e2e/scenarios/*.md` | Playwright MCP contra `npm run dev`/`vite preview` |
| CSS/markup puro | none | — (gate de build; evidência visual via screenshots dos cenários) | — | `npm run build` |

## Gate Check Commands

> Generated from codebase — `package.json` scripts.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tasks com unit tests apenas | `npm test` |
| Full | Tasks que alteram cenários E2E | `npm test` (cenários E2E rodam na validação via Playwright MCP, AD-006) |
| Build | Última task de fase / tasks só de markup | `npm run build && npm test` |

---

## Execution Plan

### Phase 1: Lógica pura (game.js)

```
T1 → T2
```

### Phase 2: HUD (DOM)

```
T3 → T4
```

### Phase 3: Celebração e composição

```
T5 → T6
```

---

## Task Breakdown

### T1: Fase `won` e regras de storage em game.js

**What**: `TOTAL_ROUNDS = 3`; `tryStore` põe `phase = 'won'` ao completar a rodada 3 (senão `'celebrating'`) e remove a chave do storage; `advanceRound()` vira no-op quando `won`; `readSavedRound` trata save > 3 como 1.
**Where**: `src/game.js` + `src/game.test.js`
**Depends on**: None
**Reuses**: wrappers tolerantes de storage (GUARD-06), padrão de testes existente
**Requirement**: WIN-05, WIN-07

**Tools**: MCP: NONE · Skill: NONE

**Done when**:

- [ ] Completar rodada 3 → `phase === 'won'`; rodadas 1–2 → `'celebrating'` (inalterado)
- [ ] `advanceRound()` após `won` NÃO incrementa (nunca rodada 4)
- [ ] Vitória remove `hora-de-guardar:round` do storage; storage que lança não quebra
- [ ] Save salvo > 3 ou inválido → carrega rodada 1; save 2–3 preservado
- [ ] Gate passa: `npm test` (test count ≥ atual, sem deleções)

**Tests**: unit · **Gate**: quick
**Commit**: `feat(game): vitoria apos 3 rodadas com limpeza do save`

---

### T2: Progresso derivado e reset em game.js

**What**: `getProgress()` → `{ round, totalRounds, stored, total, starsLit }` (starsLit = rodadas completadas; 3 quando `won`; barra = stored/total da rodada atual) e `reset()` (rodada 1, storage limpo, pronto para `startRound()`).
**Where**: `src/game.js` + `src/game.test.js`
**Depends on**: T1
**Reuses**: estado existente de `state.toys`
**Requirement**: WIN-02, WIN-03, WIN-09 (lógica)

**Tools**: MCP: NONE · Skill: NONE

**Done when**:

- [ ] `getProgress()` reflete stored/total por rodada e zera `stored` em rodada nova
- [ ] `starsLit` = N−1 na rodada N; = 3 na vitória
- [ ] `reset()` volta à rodada 1 com storage limpo; `startRound()` seguinte gera 6 brinquedos
- [ ] Gate passa: `npm test`

**Tests**: unit · **Gate**: quick
**Commit**: `feat(game): progresso derivado (barra/estrelas) e reset de jogo`

---

### T3: Markup e CSS do HUD + botão de replay

**What**: `#hud` fixo no topo (3 estrelas CSS/SVG inline + barra com `#bar-fill`), `pointer-events: none`, `z-index: 4`; `#replay-overlay.hidden` com `#replay-button` (clone visual do `#play-button`, sem texto).
**Where**: `index.html`
**Depends on**: None
**Reuses**: estilo do `#play-button`, convenção de overlays/z-index existente
**Requirement**: WIN-01, WIN-04

**Tools**: MCP: NONE · Skill: NONE

**Done when**:

- [ ] HUD sem nenhum texto; não captura ponteiro; visível e proporcional em 1280×800 e 390×844 (unidades relativas)
- [ ] z-index: HUD 4 < iris 5 < start 10 < erro WebGL 20
- [ ] `#replay-overlay` oculto por padrão
- [ ] Gate passa: `npm run build && npm test`

**Tests**: none (camada markup; evidência visual nos cenários E2E da validação) · **Gate**: build
**Commit**: `feat(hud): markup e estilo do HUD de progresso e botao de replay`

---

### T4: Módulo hud.js

**What**: `createHud({ starEls, barFillEl })` com `set({ starsLit, fraction })` — classe `lit` nas estrelas, `style.width` percentual na barra; entradas clampadas.
**Where**: `src/hud.js` + `src/hud.test.js`
**Depends on**: T3 (nomes/classes dos elementos)
**Reuses**: padrão de elementos mockados de `transitions.test.js`
**Requirement**: WIN-01, WIN-02, WIN-03

**Tools**: MCP: NONE · Skill: NONE

**Done when**:

- [ ] `set({starsLit: 2, fraction: 0.5})` → 2 primeiras estrelas `lit`, barra `50%`
- [ ] Reaplicar com menos estrelas apaga as extras (replay zera)
- [ ] `fraction`/`starsLit` fora dos limites são clampados
- [ ] Gate passa: `npm test`

**Tests**: unit · **Gate**: quick
**Commit**: `feat(hud): controlador do HUD de progresso (estrelas + barra)`

---

### T5: Celebração de vitória em feedback.js

**What**: `victory(boxes)` — `confetti.rain(8)`, `bluey.danceAt(centro, 8)`, pulse em todas as caixas e jingle de vitória (~2s, arpejo estendido com `note`), distinta de `roundComplete`.
**Where**: `src/feedback.js`
**Depends on**: None
**Reuses**: pool de confete, `danceAt`, primitivas WebAudio `note`/`safePlay`
**Requirement**: WIN-06

**Tools**: MCP: NONE · Skill: NONE

**Done when**:

- [ ] `victory()` exportado e mais longo/denso que `roundComplete` (8s de chuva vs 3s; jingle próprio)
- [ ] Falha de áudio segue silenciosa (`safePlay`)
- [ ] Gate passa: `npm test`

**Tests**: none (camada render, AD-004; evidência nos cenários E2E da validação) · **Gate**: quick
**Commit**: `feat(feedback): celebracao grande de vitoria`

---

### T6: Composição em main.js + hook E2E + cenários

**What**: HUD atualizado (spawn/stored/replay); fluxo de vitória (`phase === 'won'` → `feedback.victory`, timer 4s → mostra replay); handler do replay (iris → `reset` → `spawnRound` → HUD zerado → iris abre); caminho de erro WebGL remove `#hud`/`#replay-overlay`; `window.__game.state()` ganha `progress`. Cenário novo `e2e/scenarios/06-progresso-e-vitoria.md` (vitória completa via seed + replay + save antigo > 3) e ajuste do 02 (rodada 3 termina em vitória, não em rodada 4).
**Where**: `src/main.js`, `e2e/scenarios/06-progresso-e-vitoria.md`, `e2e/scenarios/02-rodada-completa.md`
**Depends on**: T1, T2, T3, T4, T5
**Reuses**: fluxo iris existente da troca de rodada, padrão dos cenários E2E (AD-006)
**Requirement**: WIN-02, WIN-04, WIN-05, WIN-06, WIN-08, WIN-09

**Tools**: MCP: Playwright (somente na validação) · Skill: NONE

**Done when**:

- [ ] Barra avança a cada `stored`; estrela acende ao completar rodada; barra zera na rodada nova
- [ ] Vitória: celebração grande, botão replay após ~4s, arrasto inerte (`phase !== 'playing'`)
- [ ] Replay: rodada 1, HUD zerado, botão some, arrasto funciona
- [ ] `state().progress` disponível para os cenários
- [ ] Cenário 06 escrito (happy + edge: save>3, reload pós-vitória); cenário 02 ajustado
- [ ] Gate passa: `npm run build && npm test`

**Tests**: e2e (cenários escritos nesta task; executados na validação pelo Verifier via Playwright MCP, AD-006) · **Gate**: build
**Commit**: `feat(main): progresso no HUD, fluxo de vitoria e replay`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 ──→ T2
Phase 2:  T3 ──→ T4
Phase 3:  T5 ──→ T6
```

6 tasks ⇒ um único batch (≤ ~8) ⇒ execução inline, sem sub-agentes de batch.
Verifier roda automaticamente após T6.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: fase won + storage | 1 arquivo, regras coesas de fim de jogo | ✅ Granular |
| T2: progresso + reset | 1 arquivo, 2 funções derivadas | ✅ Granular |
| T3: markup/CSS HUD + replay | 1 arquivo (index.html) | ✅ Granular |
| T4: hud.js | 1 módulo novo | ✅ Granular |
| T5: victory() | 1 função em 1 arquivo | ✅ Granular |
| T6: composição + cenários | 1 arquivo de código + docs de cenário coesos ao wiring (merge-forward) | ✅ OK (coeso) |

## Diagram-Definition Cross-Check

| Task | Depends On (body) | Diagram Shows | Status |
| ---- | ----------------- | ------------- | ------ |
| T1 | None | início Phase 1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | None | início Phase 2 (após Phase 1) | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | None | início Phase 3 (após Phase 2) | ✅ Match |
| T6 | T1–T5 | último nó | ✅ Match |

## Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
| ---- | ---------- | --------------- | --------- | ------ |
| T1 | lógica pura | unit | unit | ✅ OK |
| T2 | lógica pura | unit | unit | ✅ OK |
| T3 | CSS/markup | none (build) | none | ✅ OK |
| T4 | controlador DOM | unit | unit | ✅ OK |
| T5 | render | e2e na validação (AD-004/006) | none + evidência e2e na validação | ✅ OK |
| T6 | composição | e2e (cenário prompt) | e2e — cenários escritos NA task (merge-forward) | ✅ OK |

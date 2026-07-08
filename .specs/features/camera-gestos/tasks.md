# Camera Gestos Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.**

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: inline (Medium — decisões de arquitetura registradas na spec: biblioteca `camera-controls`/yomotsu, mapa de gestos, handoff da abertura)
**Status**: In Progress

---

## Test Coverage Matrix

> Generated from codebase — guidelines found: **none** (sem CLAUDE.md/AGENTS.md/CONTRIBUTING.md); padrões inferidos de AD-004 (lógica pura → Vitest; render → e2e) e AD-006 (e2e guiado por prompt via Playwright MCP + hook `window.__game`).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Lógica pura de jogo (`game.js`, `transitions.js`) | unit | Sem mudanças nesta feature; suite existente permanece verde | `src/*.test.js` | `npm test` |
| Código de render/câmera (`camera-controls.js`, `main.js`, `scene.js`) | e2e | Cada AC da spec vira passo com assert via `window.__game.state().camera`; happy + edges listados | `e2e/scenarios/*.md` | Agente via Playwright MCP contra `npm run dev` |
| Config / dependências (`package.json`) | none | — (build gate only) | — | `npm run build` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Tasks só com unit | `npm test` |
| Full | Tasks com e2e | `npm test` + cenário e2e via Playwright MCP (dev server) |
| Build | Fim de fase / tasks sem testes | `npm run build && npm test` |

---

## Execution Plan

### Phase 1: Base

```
T1 → T2
```

### Phase 2: Reconstrução

```
T3 → T4
```

### Phase 3: Verificação e memória

```
T5 → T6
```

---

## Task Breakdown

### T1: Commitar baseline ad-hoc (v1)

**What**: Commitar o trabalho não commitado do working tree (controles v1, brilho/hit-area dos brinquedos, abertura com recuo, cenários e2e atualizados) como baseline, para o diff da feature ficar atômico.
**Where**: working tree inteiro (arquivos já modificados)
**Depends on**: None
**Requirement**: — (pré-requisito de higiene de história)
**Done when**:
- [ ] `git status` limpo após commit
- [ ] Gate build passa: `npm run build && npm test`

**Tests**: none | **Gate**: build
**Commit**: `feat(game): baseline ad-hoc — controles de câmera v1, brilho/hit-area dos brinquedos, abertura com recuo`

---

### T2: Adicionar dependência `camera-controls`

**What**: `npm install camera-controls` (runtime dependency).
**Where**: `package.json`, `package-lock.json`
**Depends on**: T1
**Requirement**: CAMG-01
**Done when**:
- [ ] Dependência instalada e lockfile atualizado
- [ ] `npm run build && npm test` passa

**Tests**: none | **Gate**: build
**Commit**: `build(camera): add camera-controls dependency`

---

### T3: Reescrever `src/camera-controls.js` sobre a biblioteca

**What**: Substituir a implementação custom por um wrapper de `CameraControls` (yomotsu): `install({THREE})`, `touches.one/two/three` = ROTATE / DOLLY_TRUCK / TRUCK, `mouseButtons` esq/dir/meio = ROTATE / TRUCK / DOLLY, `dollyToCursor`, limites de distância/polar da v1, `setBoundary` com o box da sala, `draggingSmoothTime`/`smoothTime`. API exposta: `{ enabled (get/set — set false mata gesto), update(dt), setPose(position, target), getState() }`.
**Where**: `src/camera-controls.js` (reescrita completa)
**Depends on**: T2
**Reuses**: constantes de limites/bounds da v1
**Requirement**: CAMG-01, CAMG-02, CAMG-03, CAMG-05 (kill de gesto)
**Done when**:
- [ ] Zero math de gesto próprio no arquivo (tudo delegado à biblioteca)
- [ ] Limites e boundary configurados com os valores da v1
- [ ] `npm run build && npm test` passa

**Tests**: e2e (coberto em T5 — código render-coupled; ver matriz) | **Gate**: build
**Commit**: `feat(camera): rebuild controls on camera-controls lib (gestos por nº de dedos + damping)`

---

### T4: Reintegrar em `main.js` + hook observável

**What**: `controls.update(dt)` no loop de animação; handoff da abertura (ao fim do lerp, `setPose` com a pose final e habilitar); interop com drag mantida (disable no pick, enable no drop); hook `state().camera` passa a expor `{ intro, gesturesEnabled, position, target, distance }` (2 casas decimais).
**Where**: `src/main.js`
**Depends on**: T3
**Requirement**: CAMG-04, CAMG-05, CAMG-06
**Done when**:
- [ ] Abertura termina sem salto visível de câmera (pose sincronizada)
- [ ] Pick de brinquedo desabilita gestos; drop reabilita (fora da abertura)
- [ ] Hook expõe os 5 campos
- [ ] `npm run build && npm test` passa

**Tests**: e2e (coberto em T5) | **Gate**: build
**Commit**: `feat(camera): wire lib controls into game loop, intro handoff and test hook`

---

### T5: Cenário e2e 06 + execução via Playwright MCP

**What**: Novo `e2e/scenarios/06-controles-camera.md` cobrindo cada AC (orbita 1 dedo, pinch+pan 2 dedos, pan 3 dedos, assentamento pós-gesto, limites, mouse esq/dir/roda, prioridade do arrasto, handoff da abertura, kill de gesto) com asserts numéricos via `state().camera`; executar o cenário contra `npm run dev` com Playwright MCP e registrar resultado.
**Where**: `e2e/scenarios/06-controles-camera.md`
**Depends on**: T4
**Requirement**: CAMG-01..CAMG-06
**Done when**:
- [ ] Cada AC da spec mapeado a ≥1 passo com assert numérico
- [ ] Cenário executado verde via Playwright MCP (desktop 1280×800 + touch 390×844... paisagem 844×390 se aplicável)
- [ ] Gate full: `npm test` verde + cenário verde

**Tests**: e2e | **Gate**: full
**Commit**: `test(e2e): add camera gesture scenario 06 (touch por nº de dedos + mouse)`

---

### T6: Traceability + STATE.md

**What**: spec.md → status Verified nos CAMG; STATE.md: nova decisão AD-009 (controles manuais gestuais via `camera-controls`, supersede AD-007 na parte "criança nunca controla"; parte fullscreen de `mobile-camera` segue pendente) + Handoff atualizado.
**Where**: `.specs/features/camera-gestos/spec.md`, `.specs/STATE.md`
**Depends on**: T5
**Requirement**: — (memória)
**Done when**:
- [ ] Traceability atualizada; AD-009 registrada; Handoff reflete a entrega

**Tests**: none | **Gate**: none (docs)
**Commit**: `docs(specs): camera-gestos — traceability, AD-009, handoff`

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | 1 commit de higiene | ✅ Granular |
| T2 | 1 dependência | ✅ Granular |
| T3 | 1 arquivo (reescrita) | ✅ Granular |
| T4 | 1 arquivo (wiring) | ✅ Granular |
| T5 | 1 cenário + execução | ✅ Granular |
| T6 | 2 docs | ✅ Granular (coeso) |

## Diagram-Definition Cross-Check

| Task | Depends On (body) | Diagram Shows | Status |
| ---- | ----------------- | ------------- | ------ |
| T1 | None | início | ✅ Match |
| T2 | T1 | T1→T2 | ✅ Match |
| T3 | T2 | T2→T3 | ✅ Match |
| T4 | T3 | T3→T4 | ✅ Match |
| T5 | T4 | T4→T5 | ✅ Match |
| T6 | T5 | T5→T6 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
| ---- | ---------- | --------------- | --------- | ------ |
| T1 | baseline (misto, já escrito) | — | none/build | ✅ OK |
| T2 | config/deps | none | none/build | ✅ OK |
| T3 | render/câmera | e2e | e2e via T5* | ✅ OK* |
| T4 | render/câmera | e2e | e2e via T5* | ✅ OK* |
| T5 | e2e | e2e | e2e | ✅ OK |
| T6 | docs | — | none | ✅ OK |

\* Merge forward legítimo (regra de dependência de compilação da skill): o e2e de T3/T4 só é executável com o wiring completo + cenário; T5 é a task mais cedo onde os testes rodam, e T3/T4 não são marcadas Verified até T5 passar. Não há camada unit para código render-coupled (AD-004).

**Tools por task**: MCP `context7` (concluído na pesquisa), MCP `playwright` (T5); Skills: `tlc-spec-driven` (todas), `threejs-interaction` se necessário em T3.

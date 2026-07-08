# Visual Bluey Validation

**Date**: 2026-07-08
**Spec**: `.specs/features/visual-bluey/spec.md`
**Diff range**: `f11c1e6..8f616d8` (11 commits, `5c77f0f`..`8f616d8`)
**Verifier**: independent sub-agent (author ≠ verifier); evidence re-derived from code, gates run locally; E2E evidence from orchestrator's Playwright MCP run of 2026-07-08 against `vite preview` (build of `8f616d8`), sanity-checked against code

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 `materials.js` | ✅ Done | `src/materials.js` — `GRADIENT_MAP` 3 bandas + `toonMaterial()` |
| T2 `room.js` | ✅ Done | sofá, tapete, janela+quintal, mesa lateral; `ROOM_CLEARANCE` exportado |
| T3 sala+sombras+luz em `scene.js` | ✅ Done | PCFSoftShadowMap, sol quente `0xffd38a`, `createRoom()` integrado |
| T4 `boxes.js` → toon | ✅ Done | zero `Lambert` restante em `src/` (grep = 0) |
| T5 `toys.js` → toon | ✅ Done | idem |
| T6 Bluey procedural | ✅ Done | máquina idle/cheer/dance em `src/bluey.js` |
| T7 GLTF + fallback | ✅ Done* | *ramo GLTF de sucesso não exercitado: `assets/bluey/bluey.glb` ausente (usuário ainda não baixou); deferral documentado em T7/design.md — fallback AD-008 é o resultado esperado e foi validado |
| T8 fiação Bluey + remoção cheer 2D | ✅ Done | hook `bluey: {source, mode}`; `createCheer`/`cheerLoaded` removidos |
| T9 `transitions.js` + overlay | ✅ Done | 4 testes unitários novos; overlay `#transition-overlay` em `index.html` |
| T10 fiação transições + gate input | ✅ Done | `isBlocked` em `drag.js`; hook `transition` |
| T11 revisão E2E (02 e 04) | ✅ Done | cenários reescritos e executados verdes em 2026-07-08 |

Nota: o working tree contém uma modificação não commitada pré-existente em `tasks.md` (checkboxes T9–T11 marcados pelo implementer) — anterior a esta validação, preservada intacta.

---

## Spec-Anchored Acceptance Criteria (P1 — VIS-01..VIS-07)

Camadas conforme Test Coverage Matrix (`tasks.md`): módulos de renderização = build gate + E2E; `transitions.js` = unit (Vitest); fluxos = E2E prompt-guiado (AD-006).

### P1: Sala dos Heeler (VIS-01, VIS-02)

| Criterion | Spec-defined outcome | Evidence | Result |
| --------- | -------------------- | -------- | ------ |
| Sala-1: cena carrega → sofá, tapete, janela c/ quintal ensolarado, piso/paredes na paleta quente | Mobília mínima presente; "tons definidos no design" | `src/room.js:26-52` (sofá), `:54-79` (tapete), `:81-108` (janela+quintal+sol), `:110-121` (mesa); `src/scene.js:91-106` (piso `#d9a066` laranja, parede `#f7e8c9` creme); build gate OK; E2E screenshot `e2e-04-tema.jpeg` | ✅ PASS / ⚠️ ver nota de precisão abaixo |
| Sala-2: todos materiais ambiente+brinquedos em toon 2–4 bandas | Substituir Lambert chapado | `src/materials.js:4-13` — `Uint8Array([80,170,255])` = 3 bandas + `MeshToonMaterial`; `grep -rn Lambert src/` = 0 ocorrências; `toonMaterial` importado em `scene/room/boxes/toys/bluey` | ✅ PASS |
| Sala-3: sombras suaves ativas, luz direcional quente, móveis (brinquedos, Bluey) projetam sombra | shadow map + castShadow | `src/scene.js:75-76` (`shadowMap.enabled`, `PCFSoftShadowMap`), `:79-89` (sun `0xffd38a`, `castShadow`, frustum = ROOM), `:97` (`floor.receiveShadow`); `src/toys.js:62` e `src/bluey.js:12-19` (`markShadows` → `castShadow` em todos os meshes) | ✅ PASS |
| Sala-4: textura falha → cor sólida mantida, jogo jogável (GUARD-08.4) | `framesLoaded/plaquesLoaded` 0, warn, jogável | `src/scene.js:23-36` (`applyArtTexture` inalterado — fallback É o estado inicial); E2E 04 Parte B: `framesLoaded 0`, `plaquesLoaded 0`, `console.warn` por asset, brinquedo `'stored'` | ✅ PASS |
| Sala-5: mobília fora das rotas de arrasto | Nenhum móvel entre spawns e caixas | Code inspection: `FLOOR_BOUNDS {x:±6, z:-2.5..4}` (`src/game.js:6`), caixas em `z=5` (`src/boxes.js:80-86`); sofá em `z≈-3.05` (atrás do minZ), mesa em `x=6.55` (fora do maxX), tapete plano (`y+0.015`); E2E 02: 6/6 brinquedos arrastados e guardados sem oclusão | ✅ PASS |

### P1: Bluey na cena (VIS-03, VIS-04, VIS-05)

| Criterion | Spec-defined outcome | Evidence | Result |
| --------- | -------------------- | -------- | ------ |
| Bluey-1: jogo inicia → Bluey visível no canto em idle contínuo | posição de torcida + idle bob | `src/main.js:72-76` (`cornerPosition (5.8, floorY, -2.1)`); `src/bluey.js:157` (`mode='idle'` inicial), `:229-234` (bob/respiração contínuos); E2E 04-A: `bluey.mode === 'idle'` no início; screenshot | ✅ PASS |
| Bluey-2: acerto → comemoração ≤ 2 s e retorno ao idle | cheer curto, volta a idle | `src/feedback.js:243` (`stored()` → `bluey.cheer()`); `src/bluey.js:10` (`CHEER_DURATION = 1.6` ≤ 2 s), `:209-214` (auto-retorno a `'idle'`); E2E 04: `mode 'cheer'` após acerto → `'idle'` em ~2.5 s de observação | ✅ PASS |
| Bluey-3: rodada completa → dança no centro; volta ao canto na nova rodada | deslocamento + dance + retorno | `src/feedback.js:250` (`danceAt(centro, 3)`); `src/bluey.js:245-251` (`moveTo(center)`), `:225` (`danceDuration<=0 → returnToCorner()`), `:253-261`; E2E 02: `mode 'dance'` na celebração; rodada 2 com `mode 'idle'` | ✅ PASS |
| Bluey-4: GLTF disponível → usa; falha/ausente → procedural; hook reporta `bluey.source` `'gltf'|'procedural'` | fallback + hook exato | `src/bluey.js:135-143` (try GLTF → `source:'gltf'`; catch → `console.warn` + procedural `source:'procedural'`); `src/main.js:207` (hook `bluey: {source, mode}`); E2E 04-A/B: `source === 'procedural'` (glb ausente — AD-008, resultado esperado) + warn. Ramo `'gltf'` implementado mas não exercitável (asset ausente; deferral documentado T7) | ✅ PASS (ramo gltf: pendência documentada, não bloqueante) |
| Bluey-5: Bluey ignorada pelo raycast; animação nunca bloqueia input | nunca intercepta toque | `src/drag.js:51` (`raycaster.intersectObjects(toys, ...)` — só o array `toys`); `src/main.js:81-93` (`toyMeshes` recebe apenas brinquedos; Bluey adicionada direto à `scene`, `bluey.js:152`); animação via `bluey.update(dt)` no rAF (`main.js:234`) — nenhum caminho de input passa pela Bluey | ✅ PASS |
| Bluey-6: cheer re-entrante sem estado inconsistente | idle → cheer → idle; reinício limpo | `src/bluey.js:237-243` (`cheer()` zera `modeTime/cheerTime/danceDuration` incondicionalmente — segunda chamada reinicia); máquina de estados fechada em `pose()` (`:197-235`); E2E: cheer disparado e concluído; sem unit (camada renderização, conforme matriz) | ✅ PASS (via code inspection + E2E, per matrix) |

### P1: Transições (VIS-06, VIS-07)

| Criterion | Spec-defined outcome | Evidence | Result |
| --------- | -------------------- | -------- | ------ |
| Trans-1: play → iris de abertura, 0,8–2,5 s | duração no intervalo | `src/transitions.js:10` (`IRIS_DURATION_MS = 1200` ∈ [800, 2500]); `src/main.js:43-49` (play → `transitions.open()`); unit `src/transitions.test.js:25-42` (`expect(t.state).toBe('opening')` → `toBe('none')`); E2E 02: `'opening'` → `'none'` ≤ 1,5 s | ✅ PASS |
| Trans-2: fim da celebração → iris fecha → troca → iris abre; brinquedos novos nunca sem transição | close → spawn → open | `src/main.js:167-175` (`transitions.close().then(() => { advanceRound(); spawnRound(); transitions.open(); })` — spawn só sob iris fechado); unit `:45-59` (close entra `'closing'` → `'none'`); E2E 02: sequência gravada via rAF `['none','closing','opening','none']` | ✅ PASS |
| Trans-3: transição ativa → arrasto ignorado; fim → input volta imediatamente | gate binário no estado | `src/drag.js:46` (`if (isBlocked()) return;` no pointerdown); `src/main.js:196` (`isBlocked: () => transitions.isBlocking()`); `src/transitions.js:47-49` (`isBlocking() = state !== 'none'`, estado zera no `finished.then`); unit `:34,41` (`expect(t.isBlocking()).toBe(true/false)`); E2E 02: pointerdown+move durante `'closing'` → nenhum `'dragging'` | ✅ PASS |
| Trans-4: hook expõe `transition: 'none'|'opening'|'closing'` | valores exatos | `src/main.js:208` (`transition: transitions.state`); unit `:29,33,50,57` assertam os três literais exatos (`'none'`, `'opening'`, `'closing'`); E2E consumiu o hook com esses valores | ✅ PASS |
| Trans-5: condições coincidentes → nunca duas transições sobrepostas, determinístico | 1 animação; chamada extra devolve a em andamento | `src/transitions.js:14,20` (guarda `activePromise`); unit `:63-79` — `expect(second).toBe(first)`, `expect(third).toBe(first)`, `expect(overlay.animations).toHaveLength(1)`; reabertura pós-conclusão coberta em `:82-96` (`toHaveLength(2)`) | ✅ PASS |

**Payload/conjunction rule**: os testes de `transitions.js` assertam valores de estado (literais exatos), booleans de `isBlocking()`, identidade de Promise **e** contagem real de animações iniciadas (`overlay.animations.toHaveLength(1|2)`) — não apenas ocorrência de chamada. ✅

### VIS-08 (P2) / VIS-09 (P3) — fora do escopo desta entrega

Confirmado pela spec (tabela de traceability: VIS-08 = P2 Celebração, VIS-09 = P3 Bingo) e por `tasks.md`: nenhuma task T1–T11 mapeia VIS-08/09 (coluna Requirement cobre apenas VIS-01..07). O conteúdo de confete pré-existe da feature `hora-de-guardar` (`src/feedback.js`, pool fixo de 150 — GUARD-05/08), mas os ACs P2 (paleta/limpeza formal) e P3 (Bingo) permanecem **Pending**, corretamente não reivindicados nesta entrega.

**Status**: ✅ 16/16 ACs P1 cobertos — 1 spec-precision gap flagged (abaixo)

**⚠️ Spec-precision gap (não bloqueante)**: Sala-1 diz "paleta quente ... definidos no design", mas `design.md` não define tabela de cores/hex explícita — os valores existem apenas no código (`#d9a066`, `#f7e8c9`, `#f2a65a`, `#4fa9e0`, ...). O resultado visual foi validado por screenshot E2E, mas a spec não pina valores verificáveis. Recomendação: registrar paleta no design.md (ou relaxar a redação do AC).

---

## Discrimination Sensor

Executado em estado scratch: mutação via `sed` em `src/transitions.js` (sem alterações não commitadas próprias) → `npm test` → `git checkout -- src/transitions.js` após cada uma. Árvore verificada pristine ao final (`git status --porcelain` = apenas a modificação pré-existente de `tasks.md` do implementer + este `validation.md`).

| Mutation | File:line | Description | Killed? |
| -------- | --------- | ----------- | ------- |
| A | `src/transitions.js:48` | `isBlocking()` passa a retornar sempre `false` | ✅ Killed (2 failed / 26 passed) |
| B | `src/transitions.js:30` | Removido `state = 'none'` no fim da animação (estado nunca volta) | ✅ Killed (4 failed / 24 passed) |
| C | `src/transitions.js:20` | Removida a guarda de não-sobreposição (`if (activePromise) return activePromise`) | ✅ Killed (1 failed / 27 passed) |

**Sensor depth**: lightweight (3 mutações comportamentais, código novo de maior risco)
**Result**: 3/3 killed — PASS ✅

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code (sem features além do pedido) | ✅ |
| Surgical changes (15 arquivos, todos no escopo das tasks) | ✅ |
| No scope creep (VIS-08/09 não implementados prematuramente) | ✅ |
| Matches patterns (`markShadows`, mini-tween de `feedback.js` reusado em `bluey.js`, fallback estilo `applyArtTexture`) | ✅ |
| Spec-anchored outcome check | ✅ (1 ⚠️ precision gap flagged, VIS-01.1 paleta) |
| Per-layer Coverage Expectation (matriz de `tasks.md`) | ✅ — `transitions.js` unit 1:1 com VIS-06/07; renderização = build gate + E2E; fluxos = cenários 02/04 |
| Todo teste mapeia a um AC (sem testes órfãos) | ✅ — 4 testes novos anotados com VIS-06.x/07.x no próprio arquivo |
| Documented guidelines | none no repo — convenção AD-004 do precedente `hora-de-guardar` seguida |

**SPEC_DEVIATIONS documentados** (ambos justificados em comentário, sem impacto em AC):
- `index.html:33` — overlay com `z-index:5` em vez do `30` previsto no design (precisa ficar sob start-overlay/erro WebGL). Correto: o iris opaco não pode cobrir o botão play.
- `src/feedback.js:4` — pré-existente (`hora-de-guardar`), não desta feature.
- Divergência menor design↔código: design.md previa `themeStatus.blueySource`; implementado como `bluey.source` no hook — que é exatamente o que a **spec** (VIS-04) exige. Spec vence; sem ação.

---

## Edge Cases

- [x] GLTF sem animações embutidas → `pose()`/`update(dt)` aplicam bob/squash procedural incondicionalmente (`src/bluey.js:197-235`); clipes do GLTF são ignorados por design
- [x] Textura de ambiente falha → cor sólida (padrão `applyArtTexture` inalterado, `src/scene.js:23-36`; E2E 04-B)
- [x] Aba dorme durante transição → iris é WAAPI (browser conclui `anim.finished` sozinho); clamp de dt preservado para animações 3D (`src/main.js:231`)
- [x] WebGL indisponível → `#transition-overlay` removido antes da mensagem estática; nenhuma transição roda (`src/main.js:27-41`)

---

## Gate Check

- **Gate commands**: `npm test` (Vitest) e `npm run build` — executados localmente por este Verifier em 2026-07-08
- **`npm test`**: exit 0 — 28 passed, 0 failed, 0 skipped (2 arquivos: `game.test.js`, `transitions.test.js`)
- **`npm run build`**: exit 0 (aviso de chunk >500 kB — informativo, não bloqueante)
- **Test count before feature**: 24 (`git show f11c1e6:src/game.test.js` — 24 `it(`)
- **Test count after feature**: 28
- **Delta**: +4 novos (todos em `src/transitions.test.js`; nenhum teste deletado/enfraquecido — `game.test.js` intocado no range)
- **E2E (evidência externa, orquestrador, Playwright MCP, 2026-07-08)**: cenários 02 e 04 verdes contra `vite preview` do build `8f616d8`; console limpo exceto 404 de favicon (+ 404s esperados na Parte B); screenshots capturados. Asserts do cenário conferidos contra o código — coerentes.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| VIS-01 | Pending | ✅ Verified |
| VIS-02 | Pending | ✅ Verified |
| VIS-03 | Pending | ✅ Verified |
| VIS-04 | Pending | ✅ Verified (ramo GLTF de sucesso pendente do asset — reexecutar quando `bluey.glb` chegar) |
| VIS-05 | Pending | ✅ Verified |
| VIS-06 | Pending | ✅ Verified |
| VIS-07 | Pending | ✅ Verified |
| VIS-08 (P2) | Pending | Pending (fora do escopo desta entrega) |
| VIS-09 (P3) | Pending | Pending (fora do escopo desta entrega) |

(Este Verifier não editou `spec.md`; tabela acima é a atualização recomendada.)

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 16/16 ACs P1 com evidência; 1 spec-precision gap flagged (VIS-01.1 — paleta sem valores no design)
**Sensor**: 3/3 mutations killed
**Gate**: `npm test` 28/28 (exit 0); `npm run build` exit 0

**What works**: sala dos Heeler toon-shaded com sombras e luz quente; Bluey procedural com máquina idle/cheer/dance e fallback GLTF; transições iris DOM com gate de input, hook determinístico e guarda de não-sobreposição (empiricamente discriminada pelo sensor); zero regressão em `hora-de-guardar` (24 testes originais verdes; fluxo E2E completo verde).

**Issues found (não bloqueantes)**:
1. ⚠️ VIS-01.1: paleta "definida no design" não existe como valores no `design.md` — registrar a paleta lá (ou ajustar a redação do AC).
2. 📌 VIS-04: ramo `source === 'gltf'` não exercitado (asset ausente por dependência do usuário — deferral documentado em T7/design.md); revalidar quando `assets/bluey/bluey.glb` for baixado.

**Lessons**: há sinal (1 spec-precision gap + 1 SPEC_DEVIATION de z-index) — lição NÃO registrada via `lessons.py` por restrição do orquestrador (único write autorizado = este arquivo); sinalizado no chat para o orquestrador registrar.

**Next steps**: atualizar statuses em `spec.md` (tabela acima); registrar lição sobre "spec delega valores ao design → design deve piná-los"; revalidar ramo GLTF quando o asset chegar.

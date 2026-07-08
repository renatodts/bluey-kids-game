# "Hora de Guardar!" Validation

**Date**: 2026-07-08
**Spec**: `.specs/features/hora-de-guardar/spec.md`
**Diff range**: `5d12769..HEAD` (`61947ac`) — feature = repositório inteiro pós-scaffold
**Verifier**: independent sub-agent (author ≠ verifier); cobertura re-derivada da spec, evidence-or-zero
**Método**: leitura independente de código/testes + re-execução real dos gates + spot-check E2E ao vivo via Playwright MCP (dev server próprio, porta 5199) + 3 mutações do discrimination sensor em estado descartável (revertidas com `git restore`)

---

## Task Completion

| Task | Status | Notes |
|---|---|---|
| T1–T14 | ✅ Done | tasks.md marca todos os "Done when" como [x]; commits 1:1 com as mensagens planejadas no range `5d12769..61947ac` |

---

## Spec-Anchored Acceptance Criteria

Evidência unit = `src/game.test.js` (file:line + assert). Evidência de fluxo = cenário E2E (arquivo/passo) **+ re-execução ao vivo pelo Verifier** (valores observados anotados). Todos os campos de estado foram assertados em VALOR (round, contagens por tipo, phase, flags de áudio/tema), não só em chamada.

### P1: Arrastar e guardar (GUARD-01/02/03)

| Criterion | Spec-defined outcome | Evidência | Result |
|---|---|---|---|
| GUARD-01.1 toca brinquedo → levanta e segue o ponteiro no plano do chão | toy `dragging`, segue ponteiro | `e2e/scenarios/01`:passo 4; **live**: mid-drag `state === 'dragging'` (t1, ball); código `src/drag.js:44-68` (raycast + plano + `DRAG_LIFT`) | ✅ PASS |
| GUARD-01.5 segundo dedo durante arrasto é ignorado | 2º brinquedo permanece `idle`; 1º segue `dragging` | unit `src/game.test.js:107-109` — `expect(game.pickToy(toys[1].id)).toBe(false)` + state `'idle'`; `e2e/01`:passos 5 e 12; **live**: 2º pointerdown (pointerId 2, touch) → `{other:'idle', dragged:'dragging'}` | ✅ PASS |
| GUARD-02 solto na caixa do MESMO tipo → absorvido com animação de pulo | retorno `'stored'`, toy `stored` | unit `src/game.test.js:72-74` — `expect(game.tryStore(ball.id,'ball')).toBe('stored')` + `after.state === 'stored'`; `e2e/01`:passos 6/11; **live**: bola → cesta = `stored`, demais `idle`. Animação (tween de pulo): `src/feedback.js:242-265`, evidência visual (screenshot) — desfecho de estado é o assert | ✅ PASS |
| GUARD-03 caixa de tipo DIFERENTE → balança caixa, devolve quicando, sem som negativo | retorno `'rejected'`, toy volta a `idle`, retorna ao spawn | unit `src/game.test.js:85-87` — `expect(game.tryStore(ball.id,'block')).toBe('rejected')` + `'idle'`; `e2e/01`:passo 7 (spawn ±10px); **live**: bloco → cesta = `idle`, `returnedToSpawn = 0px`. Sem som negativo: único trigger de som é acerto/fanfarra (`src/feedback.js:147-158`) | ✅ PASS |
| GUARD-03 fora de qualquer caixa → assenta suavemente onde foi solto | toy `idle`, posição ≈ ponto de soltura (não spawn) | unit `src/game.test.js:90-99` — `dropToy` `dragging → idle`; `e2e/01`:passo 8 (±25px); **live**: plush solto no vazio = `idle`, `distFromDropPoint = 18px`, `distFromSpawn = 602px` | ✅ PASS |

### P1: Rodadas e progressão (GUARD-04/05/06)

| Criterion | Spec-defined outcome | Evidência | Result |
|---|---|---|---|
| GUARD-04 rodada espalha N (1→6, 2→9, 3+→12) em quantidades iguais, cor/posição variadas | contagens exatas 6/9/12, equilíbrio por tipo | unit `src/game.test.js:14-15` — `toHaveLength(6)` + `toEqual({ball:2,block:2,plush:2})`; `:19-24` — `toyCountForRound(1..50)` = 6/9/12/12/12/12; `:43-57` — seeds iguais reproduzem, seeds diferentes variam; **live**: rodada 1 = 6 (2/2/2), rodada 2 = 9 (3/3/3) | ✅ PASS |
| GUARD-04 "espalhar" (posições) | spec não define bounds numéricos | unit `src/game.test.js:34-39` asserta contra `FLOOR_BOUNDS` (mesma área do clamp de arrasto) — gap de precisão já sinalizado em comentário no próprio teste (`:34-35`) | ⚠️ Spec-precision gap (flagged, mitigado) |
| GUARD-05 último brinquedo guardado → celebração grande + próxima rodada automática ~4s | `phase === 'celebrating'`; após ~4s rodada+1 nasce `playing` | unit `src/game.test.js:147-160` — penúltimo: `phase === 'playing'`, último: `'celebrating'`; `src/main.js:150-156` — `setTimeout(…, 4000)`; `e2e/02`:passos 3-4; **live**: 6/6 `stored` → `phase 'celebrating'`; após 4.5s → `round 2`, 9 toys, todos `idle`, `phase 'playing'` | ✅ PASS |
| GUARD-06 fim de rodada persiste próxima rodada em localStorage | chave `hora-de-guardar:round` = `'2'`, `'3'`… | unit `src/game.test.js:219-222` — `expect(storage.getItem('hora-de-guardar:round')).toBe('2')` e `'3'`; **live**: `localStorage['hora-de-guardar:round'] === '2'` após rodada 1 | ✅ PASS |
| GUARD-06 abre com progresso salvo → inicia na rodada salva; storage indisponível/inválido → rodada 1 | `currentRound === 2` (salvo); inválido → 1 | unit `src/game.test.js:225-232` (salvo `'2'` → round 2, 9 toys); `:239-244` (`'abc','','0','-3','2.5','NaN'` → 1); `:246-250` (getItem lança → 1, joga normal); `:252-257` (setItem lança → avança sem quebrar); `:234-237`, `:259-262` (sem storage); **live**: reload sem limpar → `round 2`, 9 toys | ✅ PASS |

### P1: Diorama touch-first (GUARD-07)

| Criterion | Spec-defined outcome | Evidência | Result |
|---|---|---|---|
| GUARD-07.1 diorama com câmera fixa, sem órbita/zoom | cena visível; nenhum controle de câmera | `src/scene.js:67-114` — `PerspectiveCamera` posicionada em `onResize()`, nenhum OrbitControls no repo (`grep` limpo); screenshot de evidência | ✅ PASS |
| GUARD-07.2 resize/orientação → reajusta renderer/câmera, arrasto em andamento segue funcional | mid-resize toy segue `dragging`; drop final `stored` | `e2e/05`:passo 2; **live**: pointerdown+3 moves → `browser_resize` 1280×800→900×900 com arrasto ativo → `midResize: 'dragging'` → continua com `screenPos` recalculado → `final: 'stored'` | ✅ PASS |
| GUARD-07.3 touch e mouse com mesmo comportamento (Pointer Events) | mesmo fluxo `stored` em ambos | `src/drag.js:95-99` — listeners `pointer*` únicos; `e2e/01` Parte A (mouse) / Parte B (touch); **live**: retrato 390×844 `pointerType:'touch'` → `stored` | ✅ PASS |

### P2: Feedback festivo e tema Bluey (GUARD-08)

| Criterion | Spec-defined outcome | Evidência | Result |
|---|---|---|---|
| GUARD-08.1 acerto → confete na caixa + Bluey comemora ~2s | `cheerVisible` true logo após, false depois de ~2s | `src/feedback.js:262-284` — `confetti.burst` + `showCheer` (tween 2.2s); `e2e/04`:passo 2; **live**: pós-acerto `cheerVisible === true`, após 2.5s `=== false` | ✅ PASS |
| GUARD-08.2 fim de rodada → celebração grande: personagens, chuva de confete e fanfarra | confete + fanfarra + personagem visível | `src/feedback.js:288-292` — `rain(3)` + pulse das caixas + `fanfare()`; **live**: `soundsPlayed` 6→7 no fim da rodada (6 chimes + 1 fanfarra); Bluey do último acerto visível durante a celebração. "Personagens" (plural) não tem aparição dedicada além da Bluey do cheer — spec não define quais/quantos | ⚠️ Spec-precision gap (flagged) |
| GUARD-08.3 cena monta com key art nos quadros + placas por caixa | `framesLoaded === 3`, `plaquesLoaded === 3`, `cheerLoaded === true` | `src/scene.js:39-65` (quadros), `src/boxes.js` (placas), `src/feedback.js:163-178` (cheer); `e2e/04`:passo 1; **live**: `{framesLoaded:3, plaquesLoaded:3, cheerLoaded:true}` | ✅ PASS |
| GUARD-08.4 asset falha → fallback cor sólida, jogo segue jogável | flags de tema em 0/false, `console.warn`, jogo funcional | `src/scene.js:23-36` — fallback É o estado inicial, `onError → console.warn`; `e2e/04` Parte B; **live** (assets renomeados e restaurados): `{framesLoaded:0, plaquesLoaded:0, cheerLoaded:false}` + 7× `console.warn "arte indisponível"` + acerto `stored` + cheer fallback `cheerVisible:true` | ✅ PASS |

### P2: Som (GUARD-09)

| Criterion | Spec-defined outcome | Evidência | Result |
|---|---|---|---|
| GUARD-09.1 primeiro toque (botão play) destrava WebAudio | antes: `unlocked false`; depois do clique real: `true` | `src/main.js:39-43` + `src/feedback.js:109-120`; `e2e/03`:passos 1-2; **live** (browser_click real): antes `{unlocked:false, soundsPlayed:0}`, depois `{unlocked:true}` | ✅ PASS |
| GUARD-09.2 acerto → som curto; fim de rodada → fanfarra | `soundsPlayed` incrementa por acerto; +1 fanfarra no fim | `src/feedback.js:147-158` (chime/fanfare via `safePlay`, conta só com ctx `running`); `e2e/03`:passo 3 (`>= 1`); **live**: 1º acerto → `soundsPlayed === 1`; rodada completa (6 acertos) → `soundsPlayed === 7` (6 chimes + 1 fanfarra) | ✅ PASS |
| GUARD-09.3 áudio não destrava → funcional em silêncio | `unlocked false`, `soundsPlayed 0`, jogo joga normal | `src/feedback.js:116-118` (catch → muted), `:137` (guard `ctx.state !== 'running'`); `e2e/03` Parte B; **live** (AudioContext removido antes do play): `{unlocked:false}`, acerto `stored`, `soundsPlayed === 0`, zero erros de console | ✅ PASS |

**Status**: ✅ Todos os ACs cobertos com desfecho batendo — 2 spec-precision gaps sinalizados (não são falhas de implementação; a spec não define o valor preciso).

---

## Edge Cases (spec.md)

- [x] Ponteiro sai da janela durante arrasto → solta como "fora" — `src/drag.js:79-93` (`pointercancel`/`pointerleave` → `endDrag` sem paralaxe de tela); **live**: `pointercancel` mid-drag → `'idle'`, repick seguinte funciona (`'dragging'`)
- [x] Brinquedos sobrepostos → pega o mais próximo da câmera — `src/drag.js:49-51` (`hits[0]` do raycast = primeiro hit); convenção operacional dos cenários E2E ("o arrastado é o que reporta `dragging`")
- [x] `localStorage` lança exceção (modo privado) → segue sem persistência — unit `src/game.test.js:246-257`; `src/main.js:51-57` (acesso a `window.localStorage` em try/catch)
- [x] WebGL indisponível → mensagem estática simples — `src/main.js:15-37`; **live** (`#nowebgl` + reload): `#webgl-error` presente e visível, `window.__game === undefined`, overlay de play removido

---

## Discrimination Sensor

Estado descartável: mutação via `sed` no working tree + `git restore src/game.js` após cada rodada; `git status` limpo ao final (verificado).

| Mutation | File:line | Description | Killed? |
|---|---|---|---|
| 1 | `src/game.js:112` | Inverteu a condição de matching em `tryStore`: `toy.type === boxType` → `!==` | ✅ Killed (6 failed / 24) |
| 2 | `src/game.js:17` | Alterou a sequência 6/9/12: `round === 2` retorna 12 em vez de 9 | ✅ Killed (4 failed / 24) |
| 3 | `src/game.js:128` | Removeu a persistência do `advanceRound` (comentou `writeSavedRound`) | ✅ Killed (1 failed / 24) |

**Sensor depth**: lightweight (feature padrão, 3 mutações no código de maior risco)
**Result**: 3/3 killed — PASS ✅

---

## Gate Check

- **Gate commands** (tasks.md, nível Build/Full): `npm test` e `npm run build`
- **`npm test`**: exit 0 — 1 arquivo, **24 passed, 0 failed, 0 skipped** (bate com os 24 esperados)
- **`npm run build`**: exit 0 (aviso não-bloqueante de chunk > 500 kB — three.js inteiro num bundle; irrelevante para app local)
- **Test count before feature**: 0 (greenfield — T1 "npm test roda (0 testes)")
- **Test count after**: 24 → **delta +24**; nenhuma remoção/enfraquecimento possível (não havia testes antes)
- **E2E (AD-006, prompt-guided)**: spot-check independente re-executado pelo Verifier via Playwright MCP contra `npm run dev` (porta 5199), cobrindo os asserts centrais dos cenários 01, 02, 03 (A+B), 04 (A+B com rename/restore de assets) e 05 (resize mid-drag, retrato touch, pointercancel, `#nowebgl`) — todos os valores observados batem com os desfechos da spec (tabela acima). Console limpo exceto 404 de favicon e os warnings esperados da Parte B do cenário 04.

---

## Code Quality

| Principle | Status |
|---|---|
| Minimum code / sem scope creep | ✅ (módulos 1:1 com o design; nenhuma feature além da spec) |
| Surgical changes / matches patterns | ✅ |
| Spec-anchored outcome check (valores assertados = desfecho da spec) | ✅ (2 spec-precision gaps sinalizados, não silenciados) |
| Per-layer Coverage Expectation (matrix de tasks.md) | ✅ lógica pura 1:1 com ACs em unit; renderização via build gate; fluxos via E2E feliz+edge+falha |
| Todo teste mapeia para AC/edge/Done-when (sem unclaimed) | ✅ 24 testes: describes nomeados por GUARD-xx; máquina de estados = dimensão "State-transition integrity" da spec; teste de `getState` cópia = contrato do hook no design.md |
| Campos de payload assertados em valor (não só chamada) | ✅ (round, length, contagens por tipo, phase, unlocked, soundsPlayed, framesLoaded/plaquesLoaded/cheerLoaded/cheerVisible) |
| Guidelines do projeto | none — strong defaults applied (nenhum arquivo de guideline no repo) |
| Desvios de spec marcados | ✅ `src/feedback.js:4` — `// SPEC_DEVIATION`: sons sintetizados (osciladores WebAudio) em vez de arquivos kenney/freesound; razão registrada (zero dependência de asset, design já previa WebAudio direto). tasks.md T11 menciona assets em `assets/sounds/` — divergência devidamente marcada no código |

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
|---|---|---|
| GUARD-01 | Implemented | ✅ Verified |
| GUARD-02 | Implemented | ✅ Verified |
| GUARD-03 | Implemented | ✅ Verified |
| GUARD-04 | Implemented | ✅ Verified (1 spec-precision gap sinalizado) |
| GUARD-05 | Implemented | ✅ Verified |
| GUARD-06 | Implemented | ✅ Verified |
| GUARD-07 | Implemented | ✅ Verified |
| GUARD-08 | Implemented | ✅ Verified (1 spec-precision gap sinalizado em 08.2) |
| GUARD-09 | Implemented | ✅ Verified |

(Atualização do spec.md fica a cargo do orquestrador — Verifier é read-only fora deste arquivo.)

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 17/17 desfechos de AC batendo com a spec; 2 spec-precision gaps sinalizados:
1. GUARD-04 "espalhar" sem bounds numéricos na spec — teste asserta contra `FLOOR_BOUNDS` (razoável, já auto-sinalizado no teste)
2. GUARD-08.2 "personagens" (plural) na celebração grande — implementação mostra confete+fanfarra+Bluey (cheer do último acerto); a spec não define quais/quantos personagens

**Sensor**: 3/3 mutações mortas
**Gate**: `npm test` 24/24 (exit 0); `npm run build` exit 0
**Working tree**: limpa após o sensor e o rename de assets (verificado com `git status`)

**What works**: núcleo de arrasto (mouse+touch), matching, rejeição com retorno ao spawn, assentar fora, multi-touch ignorado, progressão 6→9→12→12, persistência tolerante, resize mid-drag, retrato, pointercancel, tema com fallback total, áudio com unlock e silêncio tolerante, fallback WebGL.

**Issues found**: nenhum bloqueante. Os 2 spec-precision gaps são de redação da spec, não de implementação — opcional: precisar a spec (bounds de spawn; definição de "personagens" na celebração).

**Next steps**: nenhum fix necessário; feature pronta para aceite/UAT interativo com a criança (Success Criteria de família são inerentemente manuais).

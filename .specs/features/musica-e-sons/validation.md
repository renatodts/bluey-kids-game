# Música e Sons Validation

**Date**: 2026-07-08
**Spec**: `.specs/features/musica-e-sons/spec.md`
**Diff range**: `b5eff6a` (feat: `src/feedback.js`) + `0a1e259` (docs: `.specs/STATE.md`, `.specs/features/hora-de-guardar/spec.md`, `.specs/features/musica-e-sons/spec.md`)
**Verifier**: independent sub-agent (author ≠ verifier); evidence re-derived from code and git history, gates run locally in isolated worktrees
**Note on scope**: the working tree also contains unrelated, out-of-scope changes from a different in-progress feature (`camera-gestos`: `src/main.js`, `src/toys.js`, `src/bluey.js`, `assets/bluey/bluey.glb`, `src/bluey.test.js`, commit `b51f634`). These were read only where needed to trace the call graph into `main.js` and are **not** part of this validation's subject.

No formal `tasks.md` exists for this feature (Medium-scope, inline Execute per traceability note in spec.md) — Task Completion table omitted per instructions; a manual code-path trace substitutes for the usual mutation-sensor table, since `feedback.js` has zero unit tests by design (WebAudio is not testable under jsdom/Vitest — same AD-004 exception already applied to pre-existing `chime`/`fanfare`/`victoryTune`).

---

## Spec-Anchored Acceptance Criteria (MUS-01..MUS-04.1)

| Criterion | Spec-defined outcome | Evidence | Result |
| --------- | --------------------- | -------- | ------ |
| MUS-01 | WebAudio destravado → inicia trilha sintetizada, curta e alegre, em loop contínuo enquanto o jogo está aberto | `src/feedback.js:145` (`unlock()` → `if (unlocked) startMusic();`); `:196-203` (`startMusic()` cria `musicBus`, `musicRunning=true`); `:205-213` (`tickMusic()` agenda o próximo loop com lookahead de 0.5s a partir de `ctx.currentTime`, não de `dt`); `:293` (`update(dt)` chama `audio.tickMusic()` a cada frame); confirmado que `update(dt)` roda indefinidamente via `renderer.setAnimationLoop` em `src/main.js:345-370` (chamada incondicional de `feedback.update(dt)` em `:367`) | ✅ PASS |
| MUS-02 | Trilha sempre perceptivelmente mais baixa que qualquer efeito (chime/oops/fanfare/victoryTune) | `src/feedback.js:108` (`MUSIC_BASE_GAIN = 0.05`) multiplicado pelo peak de cada nota da melodia (0.3–0.55, `:111-127`) via grafo em série `osc→gain(peak)→musicBus(0.05)→destination` (`:191-192`, `noteTo` recebe `musicBus` como destino) — ganho efetivo da música ≈0.015–0.028; efeitos usam `note()` → conecta direto a `ctx.destination` (`:165-166`), sem o fator 0.05, com peaks 0.16–0.22 (chime/fanfare/victoryTune, `:216-234`) e 0.18 (oops, `:246`) — 6–14× mais alto que a música | ✅ PASS |
| MUS-03 | Qualquer efeito (chime/oops/fanfare/victoryTune) → duck da música por uma fração de segundo, retornando ao volume base | `duck()` em `:171-178` (ramp linear até `MUSIC_DUCK_GAIN` em 0.04s, depois de volta a `MUSIC_BASE_GAIN` ao fim de `duration`); disparado via `safePlay(fn, duckDuration)` (`:180-189`, linha 183: `if (duckDuration) duck(duckDuration);`); todos os 4 call sites passam `duckDuration` truthy: chime `0.4` (`:219`), fanfare `1.5` (`:225`), victoryTune `2.5` (`:234`), oops `0.4` (`:251`) | ✅ PASS |
| MUS-03.1 | Dois efeitos em sequência rápida → duck estável, sem "presa" em volume baixo nem salto abrupto | `duck()` `:172-177`: `cancelScheduledValues(t0)` + `setValueAtTime(gain.value, t0)` antes de agendar as novas rampas — cancela ramps anteriores a partir do valor *atual* (sem descontinuidade), depois agenda nova rampa linear até a base. Um segundo `duck()` chamado antes do primeiro terminar reinicia a partir de onde o volume estava, nunca trava embaixo (a rampa de retorno é sempre reagendada) | ✅ PASS |
| MUS-04 | Brinquedo solto em caixa de tipo errado → além do balanço visual (GUARD-03), toca som curto e bem-humorado (nunca buzzer/punição) | `src/feedback.js:390` (`rejected()` → `audio.oops(); // (MUS-04)`, chamado após `wobble(box.mesh)` em `:389`); `oops()` em `:236-251`: oscilador `triangle`, glide descendente 520→260Hz em 0.26s ("boop"), duração total 0.35s, peak 0.18 — sem característica de buzzer (sem `square`/sustain longo) | ✅ PASS |
| MUS-04.1 | Brinquedo solto fora de qualquer caixa → mesmo som de MUS-04 | `src/feedback.js:396` (`settle()` → `audio.oops(); // (MUS-04.1)`, mesma função `oops` reutilizada, garantindo som idêntico) | ✅ PASS |

**Result**: 6/6 ACs com evidência file:line direta — todas as citações confirmadas por leitura do código, não apenas "algo relacionado existe".

---

## Manual Code-Path Trace (substitui sensor de mutação — sem testes unitários por design)

| # | Question | File:line evidence | Verdict |
| - | -------- | ------------------- | ------- |
| a | `unlock()` chama `startMusic()` no sucesso, e `startMusic()` é idempotente contra double-start? | `feedback.js:145` (`if (unlocked) startMusic();`, chamado sincronamente logo após `unlocked = ctx.state === 'running'`, sem `await` entre as duas linhas — sem janela de corrida); `feedback.js:197` (`if (!unlocked \|\| musicRunning) return;` — segunda chamada a `startMusic()`, inclusive de um segundo `unlock()`, é no-op) | ✅ PASS |
| b | `audio.tickMusic()` é chamado todo frame a partir de `update(dt)` de `createFeedback()`? | `feedback.js:293` (`audio.tickMusic(); // (MUS-01)`, última linha de `update(dt)`); `update(dt)` por sua vez é chamado incondicionalmente a cada frame do `renderer.setAnimationLoop` em `src/main.js:367` | ✅ PASS |
| c | `duck()` é disparado para os 4 sons de efeito, i.e. `safePlay` recebe `duckDuration` truthy nos 4 call sites? | `chime` `:219` (`0.4`), `fanfare` `:225` (`1.5`), `victoryTune` `:234` (`2.5`), `oops` `:251` (`0.4`) — todos truthy, todos passam por `safePlay(fn, duckDuration)` (`:180`) | ✅ PASS |
| d | `audio.oops()` é chamado tanto em `rejected()` quanto em `settle()`? | `rejected()`: `feedback.js:390`; `settle()`: `feedback.js:396` — ambos chamam a mesma função `oops` | ✅ PASS |
| e | `musicBus` roteia por um gain node separado do usado por `note()` para sfx, de forma que duck nunca afeta os efeitos? | `note()` (`:165-166`) conecta sempre a `ctx.destination` diretamente; `scheduleMusicLoop()` (`:191-192`) conecta sempre via `noteTo(musicBus, ...)`; `musicBus` é seu próprio `GainNode` (`:198-200`, conectado a `ctx.destination`) manipulado só por `duck()` (`:174-177`) — grafos de áudio fisicamente distintos, ducking do bus da música não toca no ganho dos osciladores de efeito | ✅ PASS |
| f | Existe race em que `duck()` seria chamado antes de `musicBus` existir (ex. antes de `startMusic()` rodar)? Está guardado com segurança? | `duck()` `:172` (`if (!musicBus) return;`); adicionalmente, `duck()` só é alcançável via `safePlay()`, que exige `unlocked === true` (`:181`) — e `unlocked` só vira `true` dentro de `unlock()`, que chama `startMusic()` sincronamente na sequência seguinte (`:145`), sem `await` entre as duas — não há tarefa concorrente possível entre elas em JS single-thread. O guard em `:172` cobre o caso defensivamente mesmo assim | ✅ PASS (guarded) |

**Result**: 6/6 code-path checks PASS.

---

## Edge Cases (spec.md)

| Edge case | Evidence | Result |
| --------- | -------- | ------ |
| Música tocando, erro logo após acerto (chime + oops muito próximos) → ambos audíveis, sem um cortar o outro | `chime()` e `oops()` são osciladores independentes, cada um com seu próprio `GainNode` conectado direto a `ctx.destination` (`:165-166`, `:248`) — sinais somam aditivamente, nenhum mecanismo de cancelamento entre eles; o único efeito colateral compartilhado é `duck()` no `musicBus` (não nos próprios efeitos), e um segundo `duck()` apenas reagenda a rampa (item MUS-03.1 acima) | ✅ PASS |
| Jingle de vitória (~2.3s) → duck permanece aplicado durante toda a duração, não só no ataque inicial | `victoryTune` usa `duckDuration=2.5` (`:234`); duração audível do jingle: última nota em `t=1.3, dur=0.9` → termina ~2.2s (`:229-233`), dentro da janela de 2.5s; `duck(2.5)` mantém a rampa de retorno à base só concluindo em `t0+2.5` (`:177`) — o volume permanece abaixo da base durante toda a janela de 2.5s, cobrindo integralmente o jingle de ~2.2-2.3s | ✅ PASS |
| `AudioContext` falha ao iniciar/destravar → nem música nem efeitos tocam, nenhum erro no console | `unlock()` `:146-148`: catch silencioso, `unlocked = false` sem `console.*`; como `unlocked` nunca vira `true`, `startMusic()` nunca roda (`:145`) e `safePlay()` retorna cedo em toda chamada de efeito (`:181`) — nem música nem efeitos tocam, nenhum log emitido | ✅ PASS |

---

## GUARD-03/GUARD-09 Amendment Consistency

`.specs/features/hora-de-guardar/spec.md` (commit `0a1e259`) foi checado contra `musica-e-sons/spec.md` e contra o código:

- GUARD-03 item 3 (caixa errada) amendado para "sem som punitivo tradicional (emendado por MUS-04...)" — consistente com a implementação: `oops()` é um "boop" curto (triangle, glide descendente, 0.35s), não um buzzer, disparado em `rejected()` (`:390`). ✅ Consistente.
- GUARD-03 item 4 (fora de caixa) amendado para "mesmo toque bem-humorado de GUARD-03.3" — a implementação confirma que é literalmente a mesma função `oops()` reusada em `settle()` (`:396`), sem som diferente. ✅ Consistente com o comportamento.
- GUARD-09 ganhou um item 4 novo: "áudio destravado → também inicia música de fundo, sempre mais baixa que os efeitos (MUS-01/02/03)" — consistente com MUS-01/02 na spec nova e com a implementação (`startMusic()` a partir de `unlock()`, `MUSIC_BASE_GAIN` menor que os peaks de efeito). ✅ Consistente.
- **Nit não bloqueante**: o texto amendado de GUARD-03 item 4 referencia "GUARD-03.3" — esse sub-ID não existe na tabela de Requirement Traceability de `hora-de-guardar/spec.md` (que lista apenas `GUARD-03` monolítico cobrindo os itens 3 e 4 originais, convenção pré-existente antes desta feature). É uma notação ad-hoc do autor para desambiguar "item 3 de GUARD-03" vs. "item 4 de GUARD-03" dentro do mesmo ID formal — não é uma contradição funcional (o comportamento é claro e correto no código), mas é uma referência cruzada que não resolve para nenhum ID formalmente definido em nenhuma das duas specs. Recomendação: usar "item 3 desta lista" ou formalizar sub-IDs (GUARD-03.1..03.4) na tabela de traceability caso o padrão se repita.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code (sem features além do pedido) | ✅ — só música/duck/oops, sem botão de mudo (Out of Scope respeitado) |
| Surgical changes (commit 1 toca só `src/feedback.js`; commit 2 toca só os 3 arquivos de spec/doc) | ✅ — confirmado via `git show --stat` em ambos os commits |
| No scope creep | ✅ — nenhuma mudança em `main.js`/`game.js`/outros módulos; `unlockAudio`/`update` já existiam como pontos de integração, reusados sem alterar assinatura |
| Matches existing patterns (mini-tween/no-deps philosophy, comentários em português só onde o "porquê" não é óbvio) | ✅ — `noteTo()` é uma generalização limpa do `note()` pré-existente (extrai `destination` como parâmetro em vez de duplicar lógica); comentários novos seguem o mesmo estilo de citar o requirement ID entre parênteses (`// (MUS-01)` etc.), igual ao padrão já usado para GUARD-xx |
| `SPEC_DEVIATION` documentado quando aplicável | ✅ — o cabeçalho do arquivo (`:1-8`) já tinha um `SPEC_DEVIATION` para osciladores WebAudio em vez de arquivos de áudio; a nova feature é coerente com essa decisão prévia (reafirmada em MUS out-of-scope: "sintetizar via WebAudio... AD-005, lição L-003") e não introduz nova divergência |
| Documentação de validação da própria spec.md é factualmente precisa | ⚠️ Ver gap #1 abaixo |

**Gaps encontrados (não bloqueantes, ranqueados)**:

1. **[Baixa severidade] Contagem de testes citada na spec está incorreta para o momento do commit.** `.specs/features/musica-e-sons/spec.md` (linha da seção "Implementação") afirma: *"Validação é: suite Vitest 54/54 sem regressão..."*. Reproduzindo o commit exato `0a1e259` em worktree isolado, a suite real naquele ponto da história é **50/50** (3 arquivos de teste), não 54. O número 54 só existe no HEAD atual (`b51f634`), que inclui 4 testes novos de `src/bluey.test.js` pertencentes à feature *não relacionada* `camera-gestos`, commitada depois. Hipótese provável: o autor rodou `npm test` numa working tree que já continha as mudanças não commitadas da outra feature ao escrever a spec, em vez de isolar a contagem ao escopo desta feature. Não afeta a corretude do código (confirmado por este Verifier: 50/50 sem regressão no commit isolado, ver Gate Check), mas é uma imprecisão no artefato de documentação persistido. Recomendação: corrigir a spec.md para "50/50" ou generalizar para "suite Vitest completa, sem regressão" sem número fixo.
2. **[Nit / cosmético]** Ver "GUARD-03.3" acima — referência cruzada a um sub-ID inexistente na tabela de traceability.

Nenhum gap funcional encontrado no código de `src/feedback.js`.

---

## Gate Check

- **Gate commands**: `npm test` (Vitest) e `npm run build` — executados localmente por este Verifier em 2026-07-08, em três estados distintos via `git worktree`:
  1. Commit pai `f20ae1a` (antes da feature): `npm test` → 3 arquivos, **50 passed / 50 total**, exit 0. `npm run build` → exit 0, limpo (aviso de chunk >500kB, pré-existente/informativo).
  2. Commit da feature `0a1e259` (feature completa, isolada): `npm test` → 3 arquivos, **50 passed / 50 total**, exit 0. `npm run build` → exit 0, limpo.
  3. HEAD atual (`b51f634`, inclui trabalho não relacionado de `camera-gestos` em cima): `npm test` → 4 arquivos, **54 passed / 54 total**, exit 0. `npm run build` → exit 0, limpo.
- **Delta da feature `musica-e-sons` isolada**: 50 → 50 (0 testes adicionados, 0 removidos, 0 quebrados) — esperado e correto, dado que `feedback.js` não tem testes unitários por design (WebAudio não testável em jsdom, mesma exceção AD-004 de `chime`/`fanfare`/`victoryTune`, nenhum dos quais tinha teste antes desta feature também).
- **Regressão**: nenhuma — os 50 testes pré-existentes (`game.test.js`, `hud.test.js`, `transitions.test.js`) passam intactos em todos os três pontos.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| MUS-01 | Implemented (spec) | ✅ Verified |
| MUS-02 | Implemented (spec) | ✅ Verified |
| MUS-03 | Implemented (spec) | ✅ Verified |
| MUS-03.1 | Implemented (spec) | ✅ Verified |
| MUS-04 | Implemented (spec) | ✅ Verified |
| MUS-04.1 | Implemented (spec) | ✅ Verified |

(Este Verifier não editou `spec.md`; a spec já lista "Implemented" para as 6 linhas — confirmado por evidência independente.)

---

## Summary

**Overall**: ✅ PASS

**Spec-anchored check**: 6/6 ACs (MUS-01..MUS-04.1) com evidência file:line direta e comportamento confirmado, não apenas presença de código relacionado
**Manual code-path trace**: 6/6 checks PASS (a–f)
**Edge cases**: 3/3 cobertos (efeitos simultâneos, duck durante todo o jingle de vitória, falha silenciosa de AudioContext)
**Gate**: `npm test` 50/50 no commit isolado da feature (54/54 no HEAD atual, incluindo trabalho não relacionado), exit 0; `npm run build` exit 0 em todos os três pontos testados

**What works**: música de fundo sintetizada em loop contínuo com lookahead scheduling robusto a frames irregulares; duck automático correto (cancela rampas anteriores sem estalo) para os 4 efeitos, incluindo cobertura completa do jingle de vitória de ~2.3s; som de erro ("boop" bem-humorado, não-punitivo) reutilizado identicamente nos dois casos (caixa errada e fora de caixa); grafo de áudio separa fisicamente bus de música e sfx, então duck nunca afeta os próprios efeitos; zero regressão nos 50 testes pré-existentes; build limpo.

**Issues found (não bloqueantes)**:
1. ⚠️ Baixa severidade — `spec.md` cita "suite Vitest 54/54" na seção de validação, mas a contagem real no commit da feature é 50/50 (o 54 só existe após trabalho não relacionado posterior). Sugestão: corrigir o número ou remover a cifra fixa.
2. 📌 Nit cosmético — referência cruzada "GUARD-03.3" em `hora-de-guardar/spec.md` não corresponde a nenhum sub-ID formal na tabela de traceability daquela spec.

**Next steps**: corrigir a contagem de testes citada em `musica-e-sons/spec.md`; opcionalmente formalizar sub-IDs de GUARD-03 se a spec de `hora-de-guardar` for revisada novamente.

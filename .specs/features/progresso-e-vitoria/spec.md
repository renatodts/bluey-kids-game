# Progresso e Vitória Specification

## Problem Statement

O jogo hoje é um loop infinito de rodadas (6 → 9 → 12 → 12…): a criança nunca "vence".
Para uma criança de 4 anos falta um senso de conquista — ver o quanto falta e ter um
momento de vitória claro. Esta feature adiciona um HUD de progresso no topo da tela
(sem texto) e uma vitória ao completar a 3ª rodada, com celebração grande e botão
gigante para jogar de novo.

## Goals

- [ ] A criança vê no topo, o tempo todo, quanto falta na rodada (barra) e no jogo (estrelas)
- [ ] Completar 3 rodadas produz uma vitória inconfundível (festa grande) e um recomeço simples (1 toque)
- [ ] Zero texto na UI do jogo (mantém a regra existente)

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Placar, contagem numérica ou tempo | Criança de 4 anos não lê; regra "sem texto" |
| Níveis/dificuldades além das 3 rodadas atuais | A progressão 6/9/12 já existe (GUARD-04); vitória só encerra o arco |
| Recompensas persistentes (coleção de troféus entre sessões) | Escopo novo; vitória zera o jogo por decisão do usuário |
| Sons novos além da fanfarra de vitória | Reaproveita a base de áudio existente do feedback |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Semântica da barra | Barra mostra a rodada atual (0 → N brinquedos da rodada) e zera a cada rodada nova | Recompensa imediata por brinquedo; estrelas carregam o progresso macro (escolha "barra + estrelas") | y (discuss) |
| Save antigo com rodada > 3 | Reset para rodada 1 | O modelo novo tem 3 rodadas; um save da versão infinita não tem significado — recomeçar o arco é mais simples e coerente | n (assumption) |
| Momento do botão de replay | Aparece ~4s após o início da celebração de vitória (festa primeiro, botão depois) | Mesma janela usada na celebração de rodada atual; a festa é o prêmio, o botão não deve competir com ela | n (assumption) |
| Ícone do botão de replay | Ícone gráfico ▶/↻ sem texto, estilo do botão de play existente no start-overlay | Regra "sem texto"; reusa linguagem visual que a criança já conhece | n (assumption) |
| Recarregar a página durante a tela de vitória | Jogo carrega na rodada 1 (storage já foi limpo na vitória) | Persistência zera na vitória (decisão do usuário); sem estado intermediário a preservar | y (deriva do discuss) |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: Progresso visível no topo ⭐ MVP

**User Story**: Como criança de 4 anos, quero ver no topo da tela o quanto já guardei,
para sentir que estou chegando perto de ganhar.

**Why P1**: É a metade "progresso" do pedido; sem ela a vitória chega sem antecipação.

**Acceptance Criteria**:

1. WHEN uma rodada está em jogo THEN o HUD SHALL exibir no topo 3 slots de estrela e uma barra de progresso, sem nenhum texto
2. WHEN um brinquedo é guardado na caixa certa THEN a barra SHALL avançar para a proporção `guardados/total` da rodada atual
3. WHEN a rodada é completada THEN a estrela correspondente à rodada SHALL acender
4. WHEN uma nova rodada começa THEN a barra SHALL voltar a vazia e as estrelas acesas SHALL permanecer acesas
5. WHEN o jogo carrega com rodada salva N (1 ≤ N ≤ 3) THEN o HUD SHALL exibir N−1 estrelas acesas e barra vazia
6. WHEN a criança arrasta um brinquedo sobre a região do HUD THEN o HUD SHALL NOT capturar o ponteiro (arrasto continua funcionando)
7. WHEN o WebGL está indisponível (tela de erro) THEN o HUD SHALL NOT aparecer

**Independent Test**: Jogar rodada 1 guardando brinquedos um a um e ver a barra encher
em 6 passos; completar a rodada e ver a 1ª estrela acender; na rodada 2 a barra volta vazia.

---

### P1: Vitória ao completar 3 rodadas ⭐ MVP

**User Story**: Como criança de 4 anos, quero uma festa grande quando guardar tudo nas
3 rodadas, para saber que ganhei o jogo.

**Why P1**: É o objetivo final do jogo — a razão da feature.

**Acceptance Criteria**:

1. WHEN o último brinquedo da rodada 3 é guardado THEN o jogo SHALL entrar na fase `won` e SHALL NOT iniciar uma rodada 4
2. WHEN a fase `won` inicia THEN o sistema SHALL disparar uma celebração de vitória maior/distinta da celebração de rodada (Bluey no centro + confete/estrelas + som de festa)
3. WHEN a fase `won` inicia THEN o sistema SHALL limpar a rodada salva no storage (próxima sessão começa na rodada 1)
4. WHEN a celebração de vitória está ativa THEN o arrasto de brinquedos SHALL ser ignorado
5. WHEN ~4s de celebração se passam THEN um botão gigante de replay (ícone, sem texto) SHALL aparecer sobre a cena
6. WHEN a vitória ocorre THEN as 3 estrelas do HUD SHALL estar acesas e a barra cheia

**Independent Test**: Com seed determinística, completar as 3 rodadas via hook E2E e
verificar `phase === 'won'`, storage limpo, botão de replay visível, sem rodada 4.

---

### P1: Jogar de novo ⭐ MVP

**User Story**: Como criança de 4 anos, quero apertar um botão grande para brincar de
novo do começo.

**Why P1**: Sem recomeço a vitória é um beco sem saída; 1 toque fecha o ciclo.

**Acceptance Criteria**:

1. WHEN o botão de replay é tocado THEN o jogo SHALL reiniciar na rodada 1 com a transição de iris (fecha → troca → abre)
2. WHEN o jogo reinicia THEN o HUD SHALL mostrar 0 estrelas acesas e barra vazia
3. WHEN o jogo reinicia THEN o botão de replay e os efeitos de celebração SHALL desaparecer
4. WHEN o jogo reinicia THEN o arrasto SHALL voltar a funcionar na rodada 1

**Independent Test**: Da tela de vitória, tocar o replay e verificar rodada 1 ativa,
HUD zerado, arrasto funcionando.

---

## Edge Cases

- WHEN o storage contém rodada salva > 3 (save da versão antiga/infinita) THEN o jogo SHALL carregar na rodada 1
- WHEN o storage contém valor inválido THEN o jogo SHALL carregar na rodada 1 (comportamento atual preservado, GUARD-06)
- WHEN a página é recarregada durante a tela de vitória THEN o jogo SHALL carregar na rodada 1 (storage já limpo)
- WHEN o storage está indisponível (modo privado) THEN progresso/vitória SHALL funcionar normalmente em memória (sem persistir)
- WHEN a janela é redimensionada THEN o HUD SHALL permanecer visível e proporcional no topo

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| WIN-01 | P1: Progresso — HUD topo sem texto (AC 1, 7) | Design | Pending |
| WIN-02 | P1: Progresso — barra por brinquedo (AC 2, 4) | Design | Pending |
| WIN-03 | P1: Progresso — estrelas por rodada (AC 3, 5) | Design | Pending |
| WIN-04 | P1: Progresso — HUD não bloqueia input (AC 6) | Design | Pending |
| WIN-05 | P1: Vitória — fase `won` após 3ª rodada, sem rodada 4 (AC 1) | Design | Pending |
| WIN-06 | P1: Vitória — celebração grande distinta (AC 2, 6) | Design | Pending |
| WIN-07 | P1: Vitória — storage limpo na vitória (AC 3) + edge cases de save | Design | Pending |
| WIN-08 | P1: Vitória — input bloqueado + botão de replay após ~4s (AC 4, 5) | Design | Pending |
| WIN-09 | P1: Replay — reinício completo na rodada 1 (AC 1–4) | Design | Pending |

**ID format:** `WIN-[NN]`

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 9 total, 0 mapped to tasks, 9 unmapped ⚠️ (pré-tasks)

---

## Success Criteria

- [ ] Uma criança de 4 anos entende o progresso sem instrução (barra enche, estrelas acendem)
- [ ] Completar as 3 rodadas produz vitória + recomeço em 1 toque, sem texto na UI
- [ ] `npm test` verde (lógica pura de vitória/progresso coberta); cenários E2E atualizados passam

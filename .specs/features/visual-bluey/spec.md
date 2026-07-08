# Visual Bluey Specification

## Problem Statement

O jogo funciona, mas visualmente é uma sala genérica low-poly com materiais chapados — não "parece um jogo da Bluey". Para encantar uma criança de 4 anos fã da série, o ambiente, a personagem e as transições precisam ter a cara do desenho: sala dos Heeler, cores quentes, Bluey presente e comemorando, transições de episódio.

## Goals

- [ ] Ambiente reconhecível como a sala de estar dos Heeler, com shading estilo desenho (toon) e luz quente.
- [ ] Bluey presente na cena como personagem 3D, reagindo aos acertos e à rodada completa.
- [ ] Transições animadas em todos os momentos-chave (abertura, entre rodadas, celebração), sem "pulos secos" de estado visual.
- [ ] Mecânica de jogo intacta: nenhum requisito de `hora-de-guardar` regride (17/17 ACs continuam válidos).

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Mudanças na mecânica de arrastar/guardar | Feature `hora-de-guardar` concluída e validada; esta feature é visual |
| Movimento de câmera (follow, passeio) | Pertence à feature `mobile-camera`; aqui definimos só o CONTEÚDO da celebração |
| Novos assets de áudio | Sistema WebAudio sintetizado existente é reutilizado/estendido |
| Bluey como guia ativa (dicas) | Descartado pelo usuário; ideia deferida |
| Publicação fora do uso privado | AD-005 — limite de IP mantido |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| Bingo na cena | Opcional (P3) | Usuário não pediu explicitamente; só Bluey é obrigatória | y (via discuss) |
| Áudio das transições | Reutilizar WebAudio sintetizado existente | Sem novos assets de som; padrão GUARD-09 | y (via discuss) |
| Fonte do modelo 3D da Bluey | Buscar GLTF fan-made com licença que permita download/uso privado; se inviável, construir low-poly procedural própria | Decisão explícita do usuário (fallback = construir, não billboard 2D) | y |
| Redução de movimento (prefers-reduced-motion) | Não tratado | Jogo local para uma criança específica; fora do perfil de uso | n (assumption) |
| Composição exata da sala (mobília além do mínimo) | Critério do agente, referência nos episódios | Discuss: agent's discretion | y |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: Sala dos Heeler estilizada ⭐ MVP

**User Story**: Como criança fã de Bluey, quero jogar dentro da sala da casa da Bluey para me sentir dentro do desenho.

**Why P1**: É o maior salto de identidade visual; todo o resto (personagem, transições) assenta sobre este palco.

**Acceptance Criteria**:

1. WHEN a cena carrega THEN o sistema SHALL renderizar a sala de estar dos Heeler contendo no mínimo: sofá, tapete, janela com vista de quintal ensolarado, e piso/paredes na paleta quente do desenho (tons de laranja/creme/azul definidos no design).
2. WHEN a cena renderiza THEN todos os materiais do ambiente e dos brinquedos SHALL usar shading estilo toon (gradiente discreto de 2–4 bandas), substituindo o Lambert chapado atual.
3. WHEN a cena renderiza THEN sombras suaves SHALL estar ativas (shadow map) com luz direcional quente, e objetos móveis (brinquedos, Bluey) SHALL projetar sombra no chão.
4. WHEN qualquer textura/arte oficial falha ao carregar THEN o sistema SHALL manter o material de cor sólida correspondente e o jogo SHALL permanecer jogável (padrão GUARD-08.4 preservado).
5. WHEN o jogo roda THEN a mobília SHALL ficar fora das rotas de arrasto (nenhum móvel entre pontos de spawn e caixas que oculte um brinquedo arrastado).

**Independent Test**: Abrir o jogo e ver a sala dos Heeler com sombras e toon shading; screenshot comparado ao estado anterior; arrastar um brinquedo até cada caixa sem oclusão.

---

### P1: Bluey na cena (torcida e celebração) ⭐ MVP

**User Story**: Como criança, quero ver a Bluey torcendo por mim quando acerto, para o jogo parecer da Bluey de verdade.

**Why P1**: "Ela aparecendo" foi pedido explícito; é o coração da identidade.

**Acceptance Criteria**:

1. WHEN o jogo inicia THEN Bluey SHALL estar visível em posição de torcida (canto da sala) executando animação idle contínua (balanço/respiração).
2. WHEN um brinquedo é guardado na caixa correta THEN Bluey SHALL executar uma animação de comemoração curta (≤ 2 s) e retornar ao idle.
3. WHEN a rodada é completada THEN Bluey SHALL deslocar-se para o centro da sala e executar animação de dança durante a celebração, retornando à posição de torcida quando a nova rodada começa.
4. WHEN o modelo GLTF fan-made está disponível e carrega THEN o sistema SHALL usá-lo; WHEN o carregamento falha ou nenhum modelo foi obtido THEN o sistema SHALL usar a Bluey low-poly procedural própria, e o hook de teste SHALL reportar `bluey.source` como `'gltf'` ou `'procedural'`.
5. WHEN a criança arrasta um brinquedo THEN Bluey SHALL ser ignorada pelo raycast de arrasto (nunca intercepta o toque) e sua animação SHALL nunca bloquear ou atrasar o input.
6. WHEN Bluey comemora e um novo acerto ocorre antes do fim da animação THEN o sistema SHALL reiniciar a comemoração sem estado inconsistente (máquina de estados: idle → cheer → idle; cheer re-entrante).

**Independent Test**: Acertar um brinquedo → Bluey pula; completar rodada → Bluey dança no centro; forçar falha de modelo (arquivo ausente) → Bluey procedural aparece e `window.__game.state().bluey.source === 'procedural'`.

---

### P1: Transições estilo desenho ⭐ MVP

**User Story**: Como criança, quero que o jogo abra e troque de rodada como um episódio do desenho, sem cortes secos.

**Why P1**: Pedido explícito ("com transições"); elimina os "pulos" visuais atuais (brinquedos pipocando na troca de rodada).

**Acceptance Criteria**:

1. WHEN o botão play é tocado THEN uma transição de abertura (iris/wipe circular) SHALL revelar o jogo, com duração entre 0,8 s e 2,5 s.
2. WHEN a celebração de rodada completa termina THEN uma transição (iris fecha → troca de brinquedos → iris abre) SHALL cobrir a remoção dos brinquedos antigos e o spawn dos novos, de modo que brinquedos novos nunca apareçam sem transição.
3. WHEN uma transição está ativa THEN o input de arrasto SHALL ser ignorado, e WHEN a transição termina THEN o input SHALL voltar a funcionar imediatamente.
4. WHEN o estado de transição muda THEN o hook de teste SHALL expor o estado atual (`transition: 'none' | 'opening' | 'closing'`) para asserts determinísticos.
5. WHEN duas condições de transição coincidem (ex.: rodada completa durante outra transição) THEN o sistema SHALL enfileirar/ignorar de forma determinística — nunca duas transições sobrepostas.

**Independent Test**: Tocar play e ver o iris abrir; completar rodada e ver iris fechar/abrir na troca; tentar arrastar durante a transição e nada acontecer.

---

### P2: Celebração cinematográfica (conteúdo)

**User Story**: Como criança, quero uma festa de verdade quando guardo tudo — confete, estrelas e a Bluey dançando.

**Why P2**: Amplifica a recompensa; depende da câmera (feature `mobile-camera`) para o passeio, mas o conteúdo visual é desta feature.

**Acceptance Criteria**:

1. WHEN a rodada é completada THEN o sistema SHALL emitir confete/estrelas coloridas (partículas) durante a celebração, encerrando antes da transição de rodada.
2. WHEN a celebração ocorre THEN os efeitos SHALL usar a paleta do tema Bluey (cores do design) e SHALL ser removidos da cena ao final (sem vazamento de objetos/memória entre rodadas).

**Independent Test**: Completar uma rodada e observar confete + dança; completar 3 rodadas seguidas e verificar que a contagem de objetos da cena não cresce.

---

### P3: Bingo na torcida

**User Story**: Como criança, quero ver a Bingo junto da Bluey torcendo.

**Why P3**: Não pedido explicitamente; adiciona charme se o custo for baixo (reuso do pipeline da Bluey).

**Acceptance Criteria**:

1. WHEN o pipeline da Bluey (modelo ou procedural) estiver pronto e um asset/variação para Bingo for viável THEN Bingo SHALL aparecer ao lado da Bluey com idle e comemoração próprias.

---

## Edge Cases

- WHEN o GLTF carrega mas sem animações embutidas THEN o sistema SHALL animar proceduralmente (bob/squash por código) — animação nunca depende de clipes do asset.
- WHEN uma textura do ambiente falha THEN cor sólida equivalente (padrão existente).
- WHEN a aba dorme durante uma transição THEN o clamp de dt existente SHALL impedir salto de animação e a transição SHALL concluir normalmente.
- WHEN WebGL indisponível THEN o comportamento atual (mensagem estática) permanece — nenhuma transição tenta rodar.

---

## Implicit-Requirement Dimensions (sweep — Large)

| Dimension | Resolution |
| --------- | ---------- |
| Input validation & bounds | Coberto por AC P1-Transições-3 (input ignorado durante transição) e P1-Bluey-5 (raycast ignora Bluey); demais entradas inalteradas |
| Failure / partial-failure | AC P1-Sala-4 e P1-Bluey-4 (fallbacks de asset); edge case GLTF sem animação |
| Idempotency / retry / duplicates | N/A because assets são carregados uma vez com fallback imediato; sem retry por design (padrão do projeto) |
| Auth boundaries & rate limits | N/A because jogo local sem backend |
| Concurrency / ordering | AC P1-Transições-5 (transições nunca sobrepostas) e P1-Bluey-6 (cheer re-entrante) |
| Data lifecycle / expiry | AC P2-2 (partículas removidas; sem vazamento); sem nova persistência |
| Observability | AC P1-Bluey-4 e P1-Transições-4 (hook `window.__game` expõe `bluey.source` e `transition`); console.warn em fallback de asset (padrão existente) |
| External-dependency failure | N/A because nenhuma dependência de rede em runtime (assets locais) |
| State-transition integrity | Máquinas de estado explícitas: Bluey (idle/cheer/dance) e transição (none/opening/closing) — ACs P1-Bluey-6 e P1-Transições-5 |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| VIS-01 | P1: Sala dos Heeler (AC 1–3) | T1–T5 | ✅ Verified |
| VIS-02 | P1: Sala dos Heeler (AC 4–5, fallback + rotas livres) | T3 | ✅ Verified |
| VIS-03 | P1: Bluey na cena (AC 1–3, presença + animações) | T6, T8 | ✅ Verified |
| VIS-04 | P1: Bluey na cena (AC 4, GLTF + fallback procedural + hook) | T7, T8 | ✅ Verified (ramo `'gltf'` pendente do asset — ver validation.md) |
| VIS-05 | P1: Bluey na cena (AC 5–6, raycast + máquina de estados) | T6 | ✅ Verified |
| VIS-06 | P1: Transições (AC 1–2, abertura + entre rodadas) | T9, T10 | ✅ Verified |
| VIS-07 | P1: Transições (AC 3–5, input gate + hook + não sobreposição) | T9, T10 | ✅ Verified |
| VIS-08 | P2: Celebração (AC 1–2, partículas + limpeza) | - | Pending (P2, fora desta entrega) |
| VIS-09 | P3: Bingo | - | Pending (P3, fora desta entrega) |

**Coverage:** 9 total, 7 verified (P1 completo — Verifier PASS 2026-07-08, `validation.md`), 2 pendentes (P2/P3, não escopados)

---

## Success Criteria

- [ ] Uma pessoa que conhece a série reconhece a sala dos Heeler em um screenshot sem contexto.
- [ ] Fluxo completo (abrir → jogar → completar rodada → nova rodada) sem nenhum corte visual seco.
- [ ] Suite Vitest existente continua verde (nenhuma regressão em `hora-de-guardar`).
- [ ] Jogo mantém fluidez em celular modesto (validação manual/e2e: sem travadas perceptíveis ao arrastar).

# "Hora de Guardar!" — Specification

Derivada da spec de produto aprovada: `docs/2026-07-08-hora-de-guardar-design.md`.

## Problem Statement

Uma criança de 4 anos que adora jogos de peças e combinações precisa de um jogo web
simples, sem texto e sem punição, jogável em tablet (toque) e notebook (mouse).
O jogo: guardar brinquedos 3D nas caixas certas, por tipo, na sala da família Heeler (Bluey).

## Goals

- [ ] Criança de 4 anos joga sozinha, sem instruções, do primeiro toque à celebração
- [ ] Funciona por toque (tablet/celular) e mouse (notebook) com o mesmo código
- [ ] Zero estados punitivos: sem texto, sem tempo, sem derrota, sem contagem de erros

## Out of Scope

| Feature | Motivo |
|---------|--------|
| Modo por cor / progressão cor→tipo | Decidido no brainstorming: só por tipo |
| Rotação/parallax de câmera | AD-002: câmera fixa |
| Menus, seleção de fases, múltiplas cenas | YAGNI para a primeira versão |
| Áudio original do desenho | Difícil de obter limpo; sons livres genéricos por ora |
| Publicação pública | AD-005: assets oficiais só para uso privado |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
|---|---|---|---|
| Multi-touch (segundo dedo durante arrasto) | Só um brinquedo arrastado por vez; primeiro ponteiro vence, demais ignorados | Simplicidade e previsibilidade para a criança | y (default lógico) |
| Soltar brinquedo longe de qualquer caixa | Brinquedo desce suavemente ao chão onde foi solto, sem feedback de erro | Não é erro, é só "larguei" | y (default lógico) |
| `localStorage` indisponível/corrompido | Começa na rodada 1 silenciosamente | Perder progresso é irrelevante aqui | y (default lógico) |
| Falha ao carregar imagem oficial (key art/placa) | Fallback: painel de cor sólida com forma simples; jogo segue funcional | Jogo não pode depender de rede/asset | y (default lógico) |
| Áudio bloqueado pelo navegador | Jogo funciona em silêncio; áudio destrava no primeiro toque (tela inicial com botão grande) | Política de autoplay mobile | y (aprovado no design) |
| Rodada máxima | Após a rodada de 12, repete 12 com cores/posições novas indefinidamente | Progressão infinita simples | y (default lógico) |
| Orientação de tela | Paisagem preferida; retrato funciona com layout apertado (sem bloqueio) | Não frustrar se a criança girar o tablet | y (default lógico) |

**Open questions:** none — todas resolvidas ou registradas acima.

---

## User Stories

### P1: Arrastar e guardar brinquedo ⭐ MVP

**User Story**: Como criança, quero arrastar um brinquedo com o dedo ou mouse até uma caixa para guardá-lo.

**Why P1**: É o núcleo do jogo inteiro.

**Acceptance Criteria**:

1. QUANDO a criança toca/clica num brinquedo ENTÃO o sistema DEVE levantá-lo do chão e fazê-lo seguir o ponteiro sobre o plano do chão (GUARD-01)
2. QUANDO o brinquedo é solto dentro do raio de acerto da caixa do MESMO tipo ENTÃO o sistema DEVE absorvê-lo na caixa com animação de pulo (GUARD-02)
3. QUANDO o brinquedo é solto dentro do raio de acerto de uma caixa de tipo DIFERENTE ENTÃO o sistema DEVE balançar a caixa e devolver o brinquedo quicando ao chão, sem som negativo (GUARD-03)
4. QUANDO o brinquedo é solto fora do raio de qualquer caixa ENTÃO o sistema DEVE assentá-lo suavemente no chão onde foi solto (GUARD-03)
5. QUANDO um segundo dedo toca a tela durante um arrasto ENTÃO o sistema DEVE ignorá-lo (só o primeiro ponteiro arrasta) (GUARD-01)

**Independent Test**: Abrir o jogo, arrastar uma bola até a cesta → bola some na cesta; arrastar um bloco até a cesta → cesta balança e bloco volta.

### P1: Rodadas e progressão ⭐ MVP

**User Story**: Como criança, quero que a sala se encha de brinquedos de novo quando eu terminar, cada vez com um pouquinho mais.

**Why P1**: Sem loop de rodadas não há jogo contínuo.

**Acceptance Criteria**:

1. QUANDO uma rodada inicia ENTÃO o sistema DEVE espalhar N brinquedos (rodada 1: 6, rodada 2: 9, rodada 3+: 12) em quantidades iguais por tipo, com variação de cor e posição (GUARD-04)
2. QUANDO o último brinquedo da rodada é guardado ENTÃO o sistema DEVE disparar a celebração grande e iniciar a próxima rodada automaticamente após ~4s (GUARD-05)
3. QUANDO uma rodada termina ENTÃO o sistema DEVE persistir o número da próxima rodada em `localStorage` (GUARD-06)
4. QUANDO o jogo abre com progresso salvo ENTÃO o sistema DEVE iniciar na rodada salva; se `localStorage` estiver indisponível ou inválido, DEVE iniciar na rodada 1 (GUARD-06)

**Independent Test**: Guardar os 6 brinquedos da rodada 1 → celebração → rodada 2 nasce com 9; recarregar a página → continua na rodada 2.

### P1: Diorama touch-first ⭐ MVP

**User Story**: Como criança, quero ver a sala inteira de uma vez e interagir direto, sem controles de câmera.

**Why P1**: Base visual e de input de tudo.

**Acceptance Criteria**:

1. QUANDO o jogo carrega ENTÃO o sistema DEVE exibir o diorama (chão, parede, 3 caixas, brinquedos) com câmera fixa em perspectiva, sem controles de órbita/zoom (GUARD-07)
2. QUANDO a janela muda de tamanho ou orientação ENTÃO o sistema DEVE reajustar renderer e câmera mantendo a cena inteira visível e o arrasto em andamento funcional (GUARD-07)
3. QUANDO usado em touch ou mouse ENTÃO o sistema DEVE responder ao arrasto com o mesmo comportamento (Pointer Events) (GUARD-01, GUARD-07)

**Independent Test**: Abrir em desktop e num tablet; redimensionar a janela no meio de um arrasto — nada quebra.

### P2: Feedback festivo e tema Bluey

**User Story**: Como criança fã de Bluey, quero que a Bluey comemore comigo a cada acerto.

**Why P2**: O jogo funciona sem, mas é o que dá alma — entra logo após o MVP jogável.

**Acceptance Criteria**:

1. QUANDO um brinquedo é guardado corretamente ENTÃO o sistema DEVE emitir confete de partículas na caixa e mostrar a Bluey comemorando num canto por ~2s (GUARD-08)
2. QUANDO a rodada termina ENTÃO o sistema DEVE exibir celebração grande: personagens, chuva de confete e fanfarra (GUARD-08)
3. QUANDO a cena monta ENTÃO o sistema DEVE exibir key art oficial como quadros na parede e placas de personagem nas caixas (Bluey→cesta, Bingo→baú, Chilli/Bandit→caminha) (GUARD-08)
4. QUANDO um asset de imagem falha ao carregar ENTÃO o sistema DEVE usar fallback de cor sólida e seguir jogável (GUARD-08)

**Independent Test**: Acertar um brinquedo → confete + Bluey; renomear um asset para simular falha → jogo abre normal com painéis de cor.

### P2: Som

**User Story**: Como criança, quero sons de festa quando acerto.

**Why P2**: Reforço positivo importante, mas o jogo é jogável mudo.

**Acceptance Criteria**:

1. QUANDO o primeiro toque/clique acontece (botão grande de play na tela inicial) ENTÃO o sistema DEVE destravar o WebAudio (GUARD-09)
2. QUANDO um brinquedo é guardado corretamente ENTÃO o sistema DEVE tocar um som curto de acerto; QUANDO a rodada termina, uma fanfarra (GUARD-09)
3. QUANDO o áudio não puder ser destravado ENTÃO o sistema DEVE seguir funcional em silêncio (GUARD-09)

**Independent Test**: Tocar play → acertar → som; abrir com som do sistema mutado → jogo segue normal.

---

## Edge Cases

- QUANDO o ponteiro sai da janela durante o arrasto ENTÃO o sistema DEVE soltar o brinquedo como "solto fora de caixa" (assenta no chão)
- QUANDO dois brinquedos se sobrepõem no toque ENTÃO o sistema DEVE pegar o mais próximo da câmera (primeiro hit do raycast)
- QUANDO `localStorage` lança exceção (modo privado) ENTÃO o sistema DEVE capturar e seguir sem persistência
- QUANDO WebGL não está disponível ENTÃO o sistema DEVE mostrar uma mensagem simples estática (única exceção à regra "sem texto" — voltada ao adulto)

---

## Implicit-Requirement Dimensions (sweep)

| Dimensão | Resolução |
|---|---|
| Input validation & bounds | Arrasto limitado à área do chão do diorama (clamp); multi-touch ignorado além do 1º ponteiro |
| Failure / partial-failure | Fallback de assets (GUARD-08.4); áudio opcional (GUARD-09.3); localStorage tolerante (GUARD-06) |
| Idempotency / retry | N/A — sem operações remotas |
| Auth & rate limits | N/A — jogo local sem backend |
| Concurrency / ordering | Um arrasto por vez; eventos de ponteiro serializados pelo navegador |
| Data lifecycle | Só o número da rodada em `localStorage`; sem expiração (irrelevante) |
| Observability | N/A — `console.warn` em falha de asset é suficiente para uso doméstico |
| External-dependency failure | Sem dependências em runtime (assets locais, sem rede) |
| State-transition integrity | Máquina de estados da rodada: `playing → celebrating → playing`; brinquedo: `idle → dragging → (stored | dropped)` — transições cobertas por testes de `game.js` |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| GUARD-01 | P1: Arrastar e guardar | Tasks | Pending |
| GUARD-02 | P1: Arrastar e guardar | Tasks | Pending |
| GUARD-03 | P1: Arrastar e guardar | Tasks | Pending |
| GUARD-04 | P1: Rodadas e progressão | Tasks | Pending |
| GUARD-05 | P1: Rodadas e progressão | Tasks | Pending |
| GUARD-06 | P1: Rodadas e progressão | Tasks | Pending |
| GUARD-07 | P1: Diorama touch-first | Tasks | Pending |
| GUARD-08 | P2: Feedback e tema Bluey | Tasks | Pending |
| GUARD-09 | P2: Som | Tasks | Pending |

**Coverage:** 9 total, 9 mapeados em tasks, 0 sem mapeamento.

---

## Success Criteria

- [ ] Criança de 4 anos completa uma rodada inteira sem ajuda de adulto (teste real em família)
- [ ] Mesmo build roda em tablet (touch) e notebook (mouse) sem ajuste
- [ ] Nenhum estado do jogo trava a progressão (soltar fora, multi-touch, resize, reload)

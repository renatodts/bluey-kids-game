# Música e Sons Specification

## Problem Statement

O jogo hoje só tem efeitos sonoros pontuais de acerto/vitória (GUARD-09); a sala fica em silêncio entre eles, e não há nenhum retorno sonoro quando a criança erra a caixa. O pedido é dar mais vida sonora ao jogo com uma música de fundo divertida, sem tirar o protagonismo dos efeitos do próprio jogo, e adicionar um toque também para o caso de erro.

## Goals

- [ ] Música de fundo alegre, em loop, tocando durante o jogo
- [ ] Efeitos do jogo (acerto/fanfarra/vitória/erro) sempre audíveis em primeiro plano sobre a música
- [ ] Toque curto e não-punitivo quando a criança erra a caixa

## Out of Scope

| Feature | Reason |
|---|---|
| Botão de mudo / controle de volume | Fora de escopo por agora (decidido com o usuário) — YAGNI |
| Baixar arquivo de música externo | Decidido com o usuário: sintetizar via WebAudio, mesmo padrão de GUARD-09, evita risco de licença/rede (AD-005, lição L-003) |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
|---|---|---|---|
| Fonte da música de fundo | Sintetizada via WebAudio (osciladores), loop curto e alegre | Já validado com o usuário; consistente com AD-005/L-003 | y |
| Tom do som de erro | Curto, bem-humorado, não é buzzer/punição | Já validado com o usuário; preserva a intenção original de GUARD-03 (não punir a criança) | y |
| Mixagem música x efeitos | Música em volume baixo constante + duck automático (abaixa mais ainda por uma fração de segundo) durante qualquer efeito do jogo | Já validado com o usuário — garante que efeitos "fiquem em evidência" | y |
| Escopo do som de erro (caixa errada vs. solto fora de caixa) | Toca nos dois casos: caixa de tipo errado (`rejected`) E solto fora de qualquer caixa (`settle`) | Perguntado diretamente ao usuário, que preferiu cobrir os dois casos em vez de só o de caixa errada | y |
| Controle de mudo | Não incluir nesta entrega | Já validado com o usuário (fora de escopo) | y |

**Open questions:** nenhuma — todas resolvidas ou registradas acima.

---

## User Stories

### P1: Música de fundo divertida ⭐ MVP

**User Story**: Como criança, quero que a sala tenha uma musiquinha animada tocando enquanto jogo.

**Why P1**: É o pedido central desta feature.

**Acceptance Criteria**:

1. QUANDO o WebAudio é destravado (mesmo gesto do GUARD-09.1, botão de play) ENTÃO o sistema DEVE iniciar uma trilha de fundo sintetizada via WebAudio, curta e alegre, em loop contínuo enquanto o jogo estiver aberto (MUS-01)
2. QUANDO a trilha está tocando ENTÃO o sistema DEVE mantê-la em volume perceptivelmente mais baixo que qualquer efeito de jogo (chime/oops/fanfare/victoryTune) (MUS-02)
3. QUANDO o áudio não pode ser destravado ENTÃO o sistema DEVE seguir mudo (sem música, sem efeitos) e funcional, sem erros no console (reaproveita GUARD-09.3)

**Independent Test**: Tocar play → música começa a tocar baixinho em loop; deixar o jogo aberto por mais de um loop inteiro → música recomeça sem corte perceptível nem duplicar/sobrepor vozes.

---

### P1: Efeitos do jogo em evidência sobre a música ⭐ MVP

**User Story**: Como criança, quero que o som de "consegui!" continue se destacando mesmo com a musiquinha tocando.

**Why P1**: Sem isso a música de fundo abafa o reforço positivo que já existia — regressão do GUARD-09 original.

**Acceptance Criteria**:

1. QUANDO qualquer efeito do jogo toca (chime de acerto, som de erro, fanfarra de rodada, jingle de vitória) ENTÃO o sistema DEVE abaixar (duck) o volume da música de fundo por uma fração de segundo e retorná-lo ao volume base logo depois, garantindo o efeito sempre audível em primeiro plano (MUS-03)
2. QUANDO dois efeitos tocam em sequência rápida (ex.: dois acertos seguidos) ENTÃO o duck DEVE se comportar de forma estável, sem deixar a música "presa" em volume baixo ou o volume saltando de forma abrupta/audivelmente quebrada (MUS-03.1)

**Independent Test**: Acertar uma caixa com a música tocando → percebe-se o chime nítido por cima da música, que volta ao volume normal logo depois.

---

### P1: Toque ao errar, sem punição ⭐ MVP

**User Story**: Como criança, quero um toque engraçado quando erro a caixa, sem me sentir repreendida.

**Why P1**: Pedido explícito do usuário; emenda direta ao GUARD-03 original.

**Acceptance Criteria**:

1. QUANDO um brinquedo é solto dentro do raio de acerto de uma caixa de tipo DIFERENTE ENTÃO o sistema DEVE, além do balanço visual já existente (GUARD-03), tocar um som curto e bem-humorado — nunca um buzzer/tom de "erro" tradicional nem qualquer variação de volume que soe como repreensão (MUS-04, emenda GUARD-03)
2. QUANDO o brinquedo é solto fora do raio de qualquer caixa ENTÃO o sistema DEVE, além do assentamento visual já existente (GUARD-03), tocar o MESMO som curto e bem-humorado de MUS-04 (MUS-04.1, emenda GUARD-03)

**Independent Test**: Arrastar um bloco até a cesta (tipo errado) → cesta balança + toque engraçado curto; arrastar um brinquedo para o chão vazio → assenta suavemente + mesmo toque engraçado curto.

---

## Edge Cases

- QUANDO a música está tocando e o jogador erra logo em seguida a um acerto (chime + oops muito próximos) ENTÃO ambos os efeitos DEVEM tocar de forma audível, sem um cortar o outro
- QUANDO a celebração de vitória dispara (jingle mais longo, ~2s) ENTÃO a música de fundo DEVE permanecer com duck aplicado durante toda a duração do jingle, não só no ataque inicial
- QUANDO o `AudioContext` falha ao iniciar/destravar ENTÃO nem música nem efeitos tocam, e nenhum erro deve aparecer no console (mesma garantia de GUARD-09.3)

---

## Implicit-Requirement Dimensions (sweep)

Dimensões restantes N/A para este escopo (sem persistência nova, sem chamada externa, sem auth, sem concorrência além da já coberta por GUARD-09) — única dimensão relevante:

| Dimensão | Resolução |
|---|---|
| State-transition integrity | Música tem só dois estados (`parada` → `tocando em loop`), iniciados uma única vez no unlock; duck é um envelope de gain por evento, sem estado persistente entre efeitos |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| MUS-01 | P1: Música de fundo | Execute | Implemented |
| MUS-02 | P1: Música de fundo | Execute | Implemented |
| MUS-03 | P1: Efeitos em evidência | Execute | Implemented |
| MUS-03.1 | P1: Efeitos em evidência | Execute | Implemented |
| MUS-04 | P1: Toque ao errar (emenda GUARD-03) | Execute | Implemented |
| MUS-04.1 | P1: Toque ao errar (emenda GUARD-03) | Execute | Implemented |

**Coverage:** 6 total, 6 mapeados (implícito em Execute, sem tasks.md formal — escopo Medium), 0 sem mapeamento.

**Implementação:** `src/feedback.js` (`createAudio()`: `startMusic`/`tickMusic`/`duck`/`oops`; `createFeedback()`: `update()` chama `tickMusic()`, `rejected()`/`settle()` chamam `oops()`). Sem testes unitários dedicados — `AudioContext`/agendamento de osciladores não é testável em jsdom/Vitest; mesma exceção de AD-004 já aplicada a `chime`/`fanfare`/`victoryTune` (nenhum dos três tinha teste antes desta feature). Validação é: suite Vitest 50/50 no commit desta feature, sem regressão (nenhum teste quebrado/removido) + `npm run build` limpo + escuta manual (`npm run dev`). Verificado de forma independente em `.specs/features/musica-e-sons/validation.md` (Verifier PASS).

**Nota de emenda:** esta feature revisa o texto de `GUARD-03` (P1: Arrastar e guardar) e `GUARD-09` (P2: Som) em `.specs/features/hora-de-guardar/spec.md` — "sem som negativo" passa a "sem som punitivo tradicional; som curto e bem-humorado permitido". O texto original será atualizado com uma nota apontando para MUS-04.

---

## Success Criteria

- [ ] Criança de 4 anos joga uma rodada inteira com música tocando e continua percebendo claramente quando acerta/erra
- [ ] Nenhuma regressão nos efeitos de acerto/fanfarra/vitória existentes (GUARD-09)

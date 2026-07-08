# Mobile Camera & Fullscreen Specification

## Problem Statement

O jogo será jogado num celular via link na rede local, mas hoje a experiência mobile é passiva: câmera parada num diorama, sem tela cheia garantida, e o retrato só "afasta a câmera". Para parecer um jogo de verdade no celular, precisa de viewport cheia em paisagem e de um ambiente que se move — uma câmera viva que foca a ação sozinha, sem entregar controle de câmera à criança.

## Goals

- [ ] Jogo em tela cheia paisagem no celular, acessado via `http://IP:porta` na rede local.
- [ ] Câmera viva: segue o arrasto, enfatiza o acerto, passeia na celebração, volta ao diorama — 100% automática.
- [ ] Arrasto permanece preciso durante qualquer movimento de câmera (o brinquedo nunca "desgruda" do dedo).

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Pan/zoom manual pela criança | Descartado no discuss; AD-002 (espírito) mantido |
| PWA / instalável / offline | Acesso é via link direto no navegador |
| Vibração (haptics) | Não pedido |
| Conteúdo visual da celebração (confete, dança) | Feature `visual-bluey`; aqui só o MOVIMENTO de câmera |
| Suporte a desktop além do atual | Desktop continua funcionando, mas o alvo de tuning é mobile |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| iOS Safari (iPhone) sem Fullscreen API | Best effort: viewport cheia via CSS/meta; fullscreen só onde a API existe | Limitação de plataforma conhecida; falha silenciosa | y (via discuss) |
| Orientation lock indisponível fora de fullscreen | Tentar lock só com fullscreen ativo; senão, overlay "vire o celular" cobre o caso | Screen Orientation lock exige fullscreen na maioria dos browsers | y (via discuss) |
| Retrato durante o jogo | Overlay visual "vire o celular" + jogo pausado (substitui o comportamento atual de "afastar a câmera em retrato") | Escolha do usuário: paisagem em tela cheia; supersede parte do cenário e2e 05 | y |
| Curvas/limites exatos da câmera | Critério do agente, com invariante: as 3 caixas e o brinquedo arrastado sempre no enquadramento | Discuss: agent's discretion | y |
| Servidor LAN | `vite --host` (dev) e `vite preview --host` (produção); documentado no README | Já suportado pelo Vite; sem código novo além de config/doc | y |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: Tela cheia paisagem no celular ⭐ MVP

**User Story**: Como pai, quero abrir o link no celular e o jogo ocupar a tela inteira em paisagem, para a criança jogar sem distração de barras do navegador.

**Why P1**: É o requisito de entrega ("jogado no celular via link"); sem isso nada do resto importa.

**Acceptance Criteria**:

1. WHEN o botão play é tocado em um navegador com Fullscreen API THEN o sistema SHALL requisitar fullscreen no mesmo gesto; WHEN a API não existe ou a requisição falha THEN o jogo SHALL continuar em viewport cheia sem erro visível.
2. WHEN fullscreen é obtido e a Screen Orientation API permite lock THEN o sistema SHALL travar em landscape; falha SHALL ser silenciosa.
3. WHEN a viewport está em retrato (aspect < 1) fora da tela inicial THEN o sistema SHALL exibir um overlay visual de "vire o celular" (ícone animado, sem depender de leitura) e SHALL ignorar input de jogo; WHEN a viewport volta a paisagem THEN o overlay SHALL sumir e o jogo retomar no estado em que estava.
4. WHEN o jogo é servido via HTTP simples na rede local (`http://IP:porta`) THEN todas as funcionalidades de jogo SHALL operar — nenhum requisito de gameplay depende de secure context.
5. WHEN o overlay de retrato aparece durante um arrasto THEN o brinquedo SHALL ser solto no lugar (mesmo comportamento do cancel resiliente existente).

**Independent Test**: Abrir `http://IP:porta` num celular, tocar play → tela cheia paisagem; girar para retrato → overlay aparece e jogo pausa; girar de volta → jogo retoma.

---

### P1: Câmera viva automática ⭐ MVP

**User Story**: Como criança, quero que o mundo se mexa e chegue perto de onde estou mexendo, para o jogo parecer vivo — sem eu precisar controlar nada.

**Why P1**: Pedido central ("ambiente se movendo, controlar o foco"); resolve a sensação de jogo parado.

**Acceptance Criteria**:

1. WHEN um brinquedo é pego (drag start) THEN a câmera SHALL iniciar aproximação suave (easing, sem cortes) na direção do brinquedo, e durante todo o arrasto SHALL manter o brinquedo E as três caixas dentro do enquadramento.
2. WHEN o brinquedo é solto (qualquer resultado) THEN a câmera SHALL retornar suavemente ao enquadramento diorama em no máximo 2 s.
3. WHEN um brinquedo é guardado com sucesso THEN a câmera SHALL executar uma ênfase breve na caixa (push-in ≤ 1 s) antes de retornar, sem impedir que a criança pegue outro brinquedo imediatamente (novo drag start cancela a ênfase e assume o follow).
4. WHEN a rodada é completada THEN a câmera SHALL executar um passeio curto pela sala durante a celebração e SHALL estar de volta ao enquadramento diorama quando a nova rodada fica interativa.
5. WHEN a câmera está em qualquer movimento THEN o raycast do arrasto SHALL usar a pose atual da câmera a cada frame — o brinquedo arrastado SHALL permanecer sob o dedo (erro de projeção imperceptível).
6. WHEN a criança toca o fundo (fora de brinquedos) THEN a câmera SHALL permanecer inalterada (nenhum controle direto de câmera).
7. WHEN o estado da câmera muda THEN o hook de teste SHALL expor o modo atual (`camera.mode: 'idle' | 'follow' | 'emphasis' | 'celebrate' | 'return'`) e a pose SHALL ser determinística dado o mesmo estado + dt (módulo puro testável, padrão AD-004).

**Independent Test**: Arrastar um brinquedo e ver a câmera acompanhar suavemente; soltar e vê-la voltar; completar rodada e ver o passeio; asserts via `window.__game.state().camera.mode` no e2e.

---

### P2: Qualidade mobile (viewport e performance)

**User Story**: Como pai, quero que o jogo rode liso no celular da família, sem tela esticada nem engasgos.

**Why P2**: Tuning fino; o P1 entrega o funcional.

**Acceptance Criteria**:

1. WHEN o jogo roda em tela cheia THEN o canvas SHALL cobrir 100% da viewport visível (incluindo áreas de notch/safe-area, via `viewport-fit=cover`) sem barras de rolagem nem distorção de aspecto.
2. WHEN o dispositivo tem devicePixelRatio alto THEN o renderer SHALL continuar limitado (cap existente de pixel ratio ≤ 2) para preservar performance.
3. WHEN o movimento de câmera ocorre em celular modesto THEN SHALL manter fluidez (validação manual/e2e: arrasto sem travadas perceptíveis).

**Independent Test**: Jogar num celular real via LAN e observar cobertura total da tela e fluidez do follow de câmera.

---

## Edge Cases

- WHEN o usuário sai do fullscreen manualmente (gesto do sistema) THEN o jogo SHALL continuar jogável em viewport normal; próximo toque no play (se houver tela inicial visível) pode re-requisitar.
- WHEN resize/orientationchange ocorre durante movimento de câmera THEN o enquadramento SHALL se recalcular sem NaN/salto (integra com o resize resiliente existente).
- WHEN a aba dorme e acorda durante follow THEN o clamp de dt existente SHALL evitar teleporte de câmera.
- WHEN rodada completa ocorre com o dedo ainda na tela THEN o passeio de celebração SHALL aguardar o drop (estado follow → celebrate somente após soltar).

---

## Implicit-Requirement Dimensions (sweep — Large)

| Dimension | Resolution |
| --------- | ---------- |
| Input validation & bounds | AC Câmera-1 (enquadramento limitado: caixas sempre visíveis), AC Fullscreen-3/5 (input ignorado em retrato, drop resiliente) |
| Failure / partial-failure | AC Fullscreen-1/2 (APIs ausentes/falhando → silencioso); edge case saída manual de fullscreen |
| Idempotency / retry / duplicates | Requisições repetidas de fullscreen são inofensivas (idempotentes por natureza da API); N/A além disso |
| Auth boundaries & rate limits | N/A because jogo local sem backend |
| Concurrency / ordering | AC Câmera-3 (novo drag cancela ênfase), edge case celebrate-após-drop; máquina de estados de câmera com transições explícitas |
| Data lifecycle / expiry | N/A because nenhuma persistência nova |
| Observability | AC Câmera-7 (hook expõe `camera.mode`); overlay de retrato observável via DOM |
| External-dependency failure | N/A because sem dependência de rede em runtime; servir via LAN é infra (Vite `--host`) |
| State-transition integrity | AC Câmera-7 + edge cases: máquina idle/follow/emphasis/celebrate/return com transições válidas e determinísticas |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| MOB-01 | P1: Fullscreen (AC 1–2, fullscreen + lock best effort) | Design | Pending |
| MOB-02 | P1: Fullscreen (AC 3, 5, overlay retrato + pausa) | Design | Pending |
| MOB-03 | P1: Fullscreen (AC 4, LAN HTTP sem secure context) | Design | Pending |
| MOB-04 | P1: Câmera viva (AC 1–2, follow + retorno) | Design | Pending |
| MOB-05 | P1: Câmera viva (AC 3–4, ênfase + passeio de celebração) | Design | Pending |
| MOB-06 | P1: Câmera viva (AC 5–6, raycast por frame + sem controle manual) | Design | Pending |
| MOB-07 | P1: Câmera viva (AC 7, módulo puro + hook) | Design | Pending |
| MOB-08 | P2: Qualidade mobile (AC 1–3) | Design | Pending |

**Coverage:** 8 total, 0 mapped to tasks, 8 unmapped ⚠️ (pré-design)

---

## Success Criteria

- [ ] Criança joga no celular via link, tela cheia paisagem, do início ao fim de uma rodada, sem interação de adulto além de abrir o link e tocar play.
- [ ] Câmera se move em todos os momentos-chave e nunca deixa a criança "perdida" (diorama sempre restaurado ao ficar ocioso).
- [ ] Nenhuma regressão: suite Vitest verde; cenários e2e existentes passam (cenário 05 atualizado para o novo comportamento de retrato).

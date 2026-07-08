# Camera Gestos Specification

## Problem Statement

Os controles de câmera atuais (v1 ad-hoc, não commitados) foram escritos à mão: sem inércia/damping, velocidade de rotação crua (2π por altura de tela), math de dois dedos ruidosa (pan por ponteiro + twist instável). O resultado é uma câmera "dura" e imprecisa, especialmente no celular. Pesquisa (Context7, `/yomotsu/camera-controls`) confirma que o padrão de mercado para jogos/visualizadores 3D mobile é: ações mapeadas por quantidade de dedos, damping suave durante e após o gesto, e limites declarativos — tudo resolvido pela biblioteca `camera-controls`.

## Goals

- [ ] Câmera com sensação de app de mapa/jogo mobile: suave, previsível, sem tremores.
- [ ] Gestos mapeados por quantidade de dedos (1 = orbitar, 2 = pinch-zoom + pan, 3 = pan).
- [ ] Versão web completa para mouse (esquerdo orbita, direito pan, roda zoom no cursor).
- [ ] Zero regressão no arrasto de brinquedos (prioridade absoluta do gameplay).

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Twist (giro com 2 dedos) | Removido de propósito: fonte da imprecisão da v1; padrão de jogos 3D mobile é 1 dedo orbita / 2 dedos zoom+pan |
| Fullscreen / orientação / overlay retrato | Feature `mobile-camera` (parte fullscreen segue pendente) |
| Câmera automática (follow/ênfase/passeio) | Parte "câmera viva" de `mobile-camera` superseded — usuário optou por controle manual gestual |
| Inércia longa (fling estilo lista) | smoothTime curto basta; fling longo desorienta criança de 4 anos |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| "quantidade de dados" no pedido | Interpretado como "quantidade de deDOS" (mapa de ações por nº de dedos) | Única leitura coerente com "gestos" + "versão web pra mouse" | n (logged) |
| Reescrever na mão vs biblioteca | Usar `camera-controls` (yomotsu) — battle-tested, damping SmoothDamp, `touches.one/two/three`, `mouseButtons`, limites e `setBoundary` nativos | Cadeia de verificação: Context7 `/yomotsu/camera-controls` (reputação High, 234 snippets); reconstruir damping/gesto na mão é reincidir no erro da v1 | n (logged) |
| Mapa de gestos | 1 dedo=orbita, 2 dedos=pinch-zoom+pan (`TOUCH_DOLLY_TRUCK`), 3 dedos=pan (`TOUCH_TRUCK`); mouse: esq=orbita, dir=pan (`TRUCK`), meio+roda=zoom (`dollyToCursor`) | Defaults da biblioteca ≈ padrão de mercado (Google Maps/model viewers) | n (logged) |
| Tuning de suavidade | `draggingSmoothTime` ≈ 0.06 s (resposta direta com micro-suavização), `smoothTime` ≈ 0.25 s (assentamento pós-gesto) | Critério do agente; invariante: resposta perceptível imediata (mão da criança manda), sem fling longo | n (logged) |
| Limites herdados da v1 | distância [3, 26], polar [0.12, π/2−0.06], alvo preso à sala via `setBoundary` (box da v1) | Valores já validados em jogo na v1 | y (código existente) |
| Abertura (recuo do close na Bluey) | Mantida como lerp manual existente; ao terminar, controles sincronizam a pose (`setLookAt` sem transição) e habilitam | Comportamento já coberto pelos cenários e2e atualizados; não reintroduzir risco | n (logged) |
| Trabalho ad-hoc não commitado | Commitar como baseline antes da reconstrução | Preserva história e deixa o diff da feature limpo/atômico | n (logged) |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: Gestos touch por quantidade de dedos ⭐ MVP

**User Story**: Como jogador no celular, quero controlar a câmera com os gestos que já conheço de outros apps 3D, para explorar a sala com naturalidade.

**Acceptance Criteria**:

1. WHEN 1 dedo arrasta em área livre (toque que não começou num brinquedo) THEN a câmera SHALL orbitar ao redor do alvo, com suavização durante o gesto (sem saltos secos por evento).
2. WHEN 2 dedos se afastam/aproximam (pinch) THEN a distância da câmera SHALL diminuir/aumentar; WHEN os 2 dedos transladam juntos THEN o alvo SHALL fazer pan — ambos no mesmo gesto contínuo.
3. WHEN 3 dedos arrastam THEN a câmera SHALL fazer pan puro (sem zoom/rotação).
4. WHEN o gesto termina THEN o movimento SHALL assentar suavemente (damping curto), parando por completo — sem deriva contínua.
5. WHEN qualquer gesto atinge os limites THEN o sistema SHALL respeitá-los: distância ∈ [3, 26], ângulo polar nunca abaixo do chão (≤ π/2−0.06), alvo dentro do box da sala.

**Independent Test**: No e2e (viewport touch), dispatch de pointer events sintéticos: 1 dedo altera azimute; pinch altera `camera.distance`; asserts via `window.__game.state().camera`.

---

### P1: Versão web para mouse ⭐ MVP

**User Story**: Como jogador no desktop, quero controlar a câmera com o mouse, para a versão web ser um jogo completo.

**Acceptance Criteria**:

1. WHEN o botão esquerdo arrasta em área livre THEN a câmera SHALL orbitar.
2. WHEN o botão direito arrasta THEN a câmera SHALL fazer pan; o menu de contexto SHALL permanecer suprimido no canvas.
3. WHEN a roda do mouse gira THEN a câmera SHALL fazer zoom na direção do cursor (`dollyToCursor`), respeitando os limites de distância.

**Independent Test**: No e2e (viewport desktop), arrasto com botão esquerdo muda azimute; wheel muda `camera.distance`; asserts via hook.

---

### P1: Integração com o gameplay ⭐ MVP

**User Story**: Como criança, quero que pegar brinquedo continue funcionando exatamente como antes, mesmo com a câmera controlável.

**Acceptance Criteria**:

1. WHEN um toque/clique começa sobre um brinquedo THEN o arrasto do brinquedo SHALL ter prioridade e a câmera SHALL permanecer imóvel para esse ponteiro (controles desabilitados durante todo o arrasto; reabilitados no drop).
2. WHEN a abertura (recuo do close na Bluey) está ativa THEN os gestos SHALL estar desabilitados; WHEN a abertura termina THEN os controles SHALL assumir a pose exata do fim da abertura (sem salto visível) e habilitar.
3. WHEN os controles são desabilitados no meio de um gesto THEN o gesto SHALL morrer imediatamente (sem movimento residual da câmera).
4. WHEN o estado é consultado THEN `window.__game.state().camera` SHALL expor `{ intro, gesturesEnabled, position: [x,y,z], target: [x,y,z], distance }` (números com 2 casas) para asserts determinísticos.

**Independent Test**: e2e: pointerdown num brinquedo + moves → pose da câmera inalterada e brinquedo `dragging`; ao fim da abertura, `gesturesEnabled === true` e pose igual à vista de jogo.

---

## Edge Cases

- WHEN um 3º dedo cai sobre um brinquedo durante gesto de 2 dedos THEN nenhum arrasto de brinquedo SHALL começar (guarda existente em `drag.js` mantida).
- WHEN `pointercancel` ocorre no meio do gesto THEN o gesto SHALL terminar limpo (próximo toque começa do zero).
- WHEN resize ocorre durante um gesto THEN a câmera SHALL continuar válida (sem NaN/salto).
- WHEN a aba dorme e acorda THEN o clamp de dt existente SHALL impedir teleporte da câmera no `update`.

## Implicit-Requirement Dimensions (Medium)

| Dimension | Resolution |
| --------- | ---------- |
| Input validation & bounds | Gestos AC5 (limites de distância/polar/boundary) |
| Concurrency / ordering | Integração AC1/AC3 + edge do 3º dedo (drag × câmera nunca simultâneos) |
| State-transition integrity | Integração AC2 (intro → gestos, handoff de pose sem salto) |
| Observability | Integração AC4 (hook `camera` com pose numérica) |
| Demais dimensões | N/A para este escopo (sem persistência, rede, auth) |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| CAMG-01 | P1 Gestos touch (AC 1–4, mapa por dedos + damping) | Tasks | Pending |
| CAMG-02 | P1 Gestos touch (AC 5, limites/boundary) | Tasks | Pending |
| CAMG-03 | P1 Mouse (AC 1–3) | Tasks | Pending |
| CAMG-04 | P1 Integração (AC 1, prioridade do arrasto) | Tasks | Pending |
| CAMG-05 | P1 Integração (AC 2–3, abertura + kill de gesto) | Tasks | Pending |
| CAMG-06 | P1 Integração (AC 4, hook observável) | Tasks | Pending |

**Coverage:** 6 total, 0 mapped to tasks, 6 unmapped ⚠️ (pré-tasks)

---

## Success Criteria

- [ ] Câmera suave e previsível no touch e no mouse (validação e2e + manual).
- [ ] Nenhuma regressão: suite Vitest verde, cenários e2e 01–05 continuam válidos, arrasto de brinquedo intacto.
- [ ] `src/camera-controls.js` v1 substituído pela integração com `camera-controls` (yomotsu) — menos código próprio, comportamento de mercado.

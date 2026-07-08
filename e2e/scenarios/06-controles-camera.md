# Cenário 06 — Controles de câmera (gestos por nº de dedos + mouse)

Feature `camera-gestos` (CAMG-01..06). Executado por agente via Playwright MCP,
convenções dos cenários anteriores (dev server, hook `window.__game`).

A pose é assertada por `state().camera`: `{ intro, gesturesEnabled, position:
[x,y,z], target: [x,y,z], distance }` (2 casas). Eventos de gesto são
PointerEvents sintéticos despachados no canvas (`bubbles: true`, `pointerId`
distintos, `pointerType` conforme a parte). "Área livre" = ponto que não acerta
brinquedo (ex.: parede alta, y≈200 na viewport desktop).

## Parte A — Desktop mouse (1280×800)

1. Navegar com `localStorage` limpo; tocar play; aguardar
   `camera.intro === false` (~3s).
   **Assert (CAMG-05)**: `gesturesEnabled === true`; registrar `pose0`.
2. **CAMG-03.1 (orbita, botão esquerdo)**: `pointerdown` (button 0, mouse) em
   área livre → ~6 `pointermove` de +25px em x → `pointerup`. Aguardar ~400ms
   (assentamento).
   **Assert**: `position` mudou vs `pose0` (Δ > 0.1 em algum eixo); `target`
   inalterado (Δ < 0.05 por eixo); `distance` preservada (Δ < 0.15).
3. **CAMG-01.4 (assentamento sem deriva)**: ler a pose 2× com ~300ms de
   intervalo.
   **Assert**: leituras idênticas (Δ ≤ 0.01 por componente).
4. **CAMG-03.3 + CAMG-02 (roda / zoom no cursor + limite)**: ~5 `wheel` com
   `deltaY < 0` no centro. **Assert**: `distance` diminuiu. Depois ~40 `wheel`
   com `deltaY > 0`. **Assert**: `distance ≤ 26` (clamp máx). Restaurar com
   alguns wheel-in.
5. **CAMG-03.2 (pan, botão direito)**: `pointerdown` (button 2) em área livre →
   ~6 `pointermove` de −20px x / −10px y → `pointerup`.
   **Assert**: `target` mudou (Δ > 0.05) e permanece dentro do box da sala
   (x ∈ [−7,7], y ∈ [0,4], z ∈ [−3.4,6.4]); nenhum menu de contexto visível.
6. **CAMG-04 (prioridade do arrasto)**: `seed(606)`; `pointerdown` no
   `screenPos` de um brinquedo idle → identificar o `'dragging'` → ~5 moves.
   **Assert**: durante o arrasto `gesturesEnabled === false` e `position`
   idêntica à pré-arrasto (Δ ≤ 0.01). Soltar sobre a caixa certa.
   **Assert**: brinquedo `'stored'`; `gesturesEnabled === true` após o drop.
7. Screenshot de evidência: `e2e-06-desktop.jpeg`.

## Parte B — Touch (390×844 retrato funcional)

8. `browser_resize` 390×844; recarregar limpo; play; aguardar
   `camera.intro === false`; registrar `poseB0`.
9. **CAMG-01.1 (1 dedo orbita)**: `pointerdown` touch em área livre → ~6 moves
   de +18px x → `pointerup`. Aguardar ~400ms.
   **Assert**: `position` mudou; `target` inalterado (Δ < 0.05); `distance`
   preservada (Δ < 0.15).
10. **CAMG-01.2 (2 dedos: pinch-zoom + pan no mesmo gesto)**: 2 pointers touch
    (ids distintos) `pointerdown` afastados ~80px → moves afastando-os
    (pinch-out, +Δdist entre dedos) → `pointerup` ambos.
    **Assert**: `distance` diminuiu (zoom-in) vs `poseB0`.
    Novo gesto: 2 dedos transladando juntos +30px x.
    **Assert**: `target` mudou (pan) mantendo-se no box da sala.
11. **CAMG-01.3 (3 dedos: pan puro)**: 3 pointers touch `pointerdown` → moves
    conjuntos de −20px x → `pointerup` todos. Registrar `distance` antes/depois.
    **Assert**: `target` mudou; `distance` preservada (Δ < 0.2).
12. **CAMG-05 (kill de gesto)**: iniciar 1 dedo em área livre com moves;
    `seed(707)` e, com o dedo de câmera ainda ativo, ler pose, então
    `pointercancel`. **Assert**: sem NaN em nenhum componente; nova leitura
    após ~300ms estável (Δ ≤ 0.01).
13. Screenshot de evidência: `e2e-06-touch.jpeg`.

## Registro

Resultado (data, verde/vermelho por passo, desvios) anotado pelo agente no
relatório da execução; falha em qualquer assert = cenário vermelho.

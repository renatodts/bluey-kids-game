# Cenário 05 — Robustez: resize mid-drag, retrato, pointercancel, WebGL (GUARD-07 + edge cases)

Executado por agente via Playwright MCP. Convenções dos cenários anteriores
(asserts via `__game.state()`, brinquedo arrastado = o que reporta `'dragging'`).

---

## Parte A — Desktop 1280×800 (pointerType `mouse`)

1. Navegar com `localStorage` limpo; tocar play; aguardar
   `camera.intro === false` (recuo da abertura, ~3s); `seed(808)`.
   **Assert**: `round === 1`, 6 brinquedos `'idle'`, `phase === 'playing'`.
2. **GUARD-07.2 (resize durante arrasto)**: `pointerdown` num brinquedo idle,
   ~3 `pointermove` na direção da caixa certa; `browser_resize` 900×900 com o
   arrasto ATIVO; recalcular `screenPos` (câmera mudou) e continuar os moves até
   a caixa certa; soltar.
   **Assert (mid-resize)**: brinquedo segue `'dragging'` após o resize.
   **Assert (final)**: brinquedo `'stored'` — nada quebrou.
3. **Edge (pointercancel = solto fora)**: iniciar arrasto de outro brinquedo,
   ~3 moves, disparar `pointercancel` (mesmo pointerId).
   **Assert**: brinquedo volta a `'idle'` (solto como "fora", assenta no chão —
   sem acerto por paralaxe de tela em cancel); em seguida um novo `pointerdown`
   sobre ele pega normalmente (`'dragging'`) — soltar fora de caixa de novo.
4. Screenshot de evidência: `e2e-05-desktop.jpeg`.

## Parte B — Retrato 390×844 (pointerType `touch`)

5. `browser_resize` 390×844; recarregar limpo; play; aguardar
   `camera.intro === false`; `seed(909)`.
   **Assert**: cena funcional (6 brinquedos idle).
6. **GUARD-07 (retrato funcional)**: arrastar um brinquedo até a caixa certa
   (touch) e soltar sobre a caixa.
   **Assert**: `'stored'`.
7. Screenshot de evidência: `e2e-05-retrato.jpeg`.

## Parte C — WebGL indisponível

8. Navegar para a URL com `#nowebgl` (gancho de teste que simula ausência de
   WebGL) e recarregar.
   **Assert**: elemento `#webgl-error` presente e visível com mensagem estática;
   `window.__game === undefined` (jogo não inicializa); overlay de play removido.
9. Screenshot de evidência: `e2e-05-nowebgl.jpeg`. Voltar para a URL sem hash.

## Verde quando

- Todos os asserts confirmados.
- Console sem erros além de: 404 de favicon e o erro proposital
  "WebGL indisponível" da Parte C.
- Screenshots capturados.

# Cenário 01 — Arrastar e guardar (GUARD-01, GUARD-02, GUARD-03)

Executado por agente via Playwright MCP contra `npm run dev`.
Pointer Events são disparados com `browser_evaluate` usando coordenadas de
`window.__game.screenPos(id)` — o canvas WebGL é opaco para o snapshot de
acessibilidade, então TODOS os asserts são sobre `window.__game.state()`.

**Helper de arrasto** (usado nos passos): disparar no `#game-canvas`
`pointerdown` na coordenada de origem, ~8 `pointermove` interpolados até o
destino, e `pointerup` no destino — sempre com o mesmo `pointerId` e
`pointerType` conforme o passo (`mouse` no desktop, `touch` no mobile).

**Seleção do brinquedo arrastado**: brinquedos podem se sobrepor em tela; por
spec, o toque pega o mais próximo da câmera (primeiro hit do raycast). Após o
`pointerdown`, o brinquedo efetivamente arrastado é o que `state()` reporta
como `'dragging'` — os passos seguintes usam ESSE brinquedo (e o tipo dele)
para escolher caixa certa/errada, nunca a suposição inicial.

---

## Parte A — Desktop (viewport 1280×800, pointerType `mouse`)

1. `browser_resize` 1280×800; navegar para o dev server com `localStorage` limpo
   (limpar a chave `hora-de-guardar:round` e recarregar).
2. Tocar o botão play (overlay some).
   **Assert**: overlay `#start-overlay` tem classe `hidden`.
3. `window.__game.seed(101)` — rodada determinística.
   **Assert**: `state().round === 1`, `state().toys.length === 6`,
   todos `state === 'idle'`, 2 brinquedos por tipo, `phase === 'playing'`.
4. **GUARD-01 (seguir o ponteiro)**: escolher a primeira bola (`type === 'ball'`,
   `state === 'idle'`). `pointerdown` em `screenPos(bolaId)`, mover 2 passos.
   **Assert (mid-drag)**: `state()` da bola === `'dragging'`.
5. **GUARD-01 (segundo ponteiro ignorado)**: com o arrasto ativo, disparar
   `pointerdown` com `pointerId` diferente sobre outro brinquedo idle.
   **Assert**: o outro brinquedo permanece `'idle'`; a bola permanece `'dragging'`.
6. **GUARD-02 (caixa certa)**: continuar o movimento até `screenPos('ball')`
   (cesta) e soltar (`pointerup`).
   **Assert**: bola === `'stored'`; demais brinquedos `'idle'`.
7. **GUARD-03 (caixa errada)**: registrar `screenPos(blocoId)` (spawn); arrastar
   um bloco (`type === 'block'`) até a cesta (`screenPos('ball')`) e soltar.
   **Assert**: bloco === `'rejected'` no retorno lógico → estado final `'idle'`
   e `screenPos(blocoId)` volta ao spawn registrado (tolerância ±10px).
8. **GUARD-03 (soltar fora)**: arrastar um bichinho (`type === 'plush'`) até um
   ponto vazio do chão (screenPos entre spawn e caixas, longe ≥ snapRadius de
   qualquer caixa) e soltar.
   **Assert**: bichinho === `'idle'` e `screenPos(bichinhoId)` fica próximo ao
   ponto de soltura (assentou onde foi solto, ±25px), NÃO voltou ao spawn.
9. Screenshot de evidência: `e2e-01-desktop.jpeg`.

## Parte B — Mobile touch (viewport 390×844, pointerType `touch`)

10. `browser_resize` 390×844; recarregar com `localStorage` limpo; tocar play;
    `seed(202)`.
    **Assert**: `round === 1`, 6 brinquedos idle, `phase === 'playing'`.
11. **GUARD-02 (touch)**: arrastar uma bola até a cesta com `pointerType: 'touch'`.
    **Assert**: bola === `'stored'`.
12. **GUARD-01 (multi-touch)**: iniciar arrasto de um bloco (touch, pointerId 1);
    com ele ativo, `pointerdown` de um segundo dedo (pointerId 2) sobre outro
    brinquedo.
    **Assert**: segundo brinquedo permanece `'idle'`; bloco segue `'dragging'`.
13. **GUARD-03 (touch, caixa errada)**: concluir o arrasto do bloco soltando na
    caminha (`screenPos('plush')`).
    **Assert**: bloco === `'idle'` (rejeitado e devolvido).
14. Screenshot de evidência: `e2e-01-mobile.jpeg`.

## Verde quando

- Todos os asserts acima confirmados (estado via `__game.state()`).
- Nenhum erro no console além de 404 de favicon.
- Screenshots de evidência capturados.

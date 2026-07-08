# Cenário 02 — Rodada completa, celebração e persistência (GUARD-04, GUARD-05, GUARD-06)

Executado por agente via Playwright MCP. Mesmas convenções do cenário 01:
asserts sobre `window.__game.state()`, arrasto por Pointer Events sintéticos em
coordenadas de `window.__game.screenPos(id)`, e o brinquedo efetivamente
arrastado é o que `state()` reporta como `'dragging'` após o `pointerdown`
(usar ESSE brinquedo e o tipo dele para escolher a caixa certa).

Animações (T9): aguardar ~0.7s entre arrastos para os tweens não sobreporem
picks; asserts de estado podem ser imediatos.

---

## Passos (viewport 1280×800, pointerType `mouse`)

1. `browser_resize` 1280×800; navegar com `localStorage` limpo (remover a chave
   `hora-de-guardar:round` e recarregar); tocar play; `window.__game.seed(303)`.
   **Assert**: `round === 1`, `toys.length === 6`, todos `'idle'`, `phase === 'playing'`.
2. **GUARD-02/04 (guardar todos)**: repetir até não sobrar brinquedo `'idle'`:
   `pointerdown` no `screenPos` de um brinquedo idle → identificar o `'dragging'`
   → arrastar até `screenPos(tipoDele)` (caixa certa) → soltar → aguardar ~0.7s.
   **Assert (após o último)**: todos os 6 `state === 'stored'`.
3. **GUARD-05 (celebração grande)**: imediatamente após o último acerto.
   **Assert**: `phase === 'celebrating'`.
   Screenshot de evidência da celebração: `e2e-02-celebracao.jpeg`.
4. **GUARD-05 (avanço automático ~4s)**: aguardar ~4.5s do último acerto.
   **Assert**: `round === 2`, `toys.length === 9` (3 por tipo), todos `'idle'`,
   `phase === 'playing'`.
5. **GUARD-06 (persistência)**: recarregar a página SEM limpar `localStorage`;
   tocar play.
   **Assert**: `state().round === 2` e `toys.length === 9` (retomou da rodada salva).
6. Screenshot de evidência: `e2e-02-rodada2.jpeg`.

## Verde quando

- Todos os asserts confirmados via `__game.state()`.
- Nenhum erro no console além de 404 de favicon.
- Screenshots capturados.

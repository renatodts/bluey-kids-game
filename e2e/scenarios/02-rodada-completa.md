# Cenário 02 — Rodada completa, celebração, transições e persistência (GUARD-04, GUARD-05, GUARD-06, VIS-03, VIS-06, VIS-07)

Executado por agente via Playwright MCP. Mesmas convenções do cenário 01:
asserts sobre `window.__game.state()`, arrasto por Pointer Events sintéticos em
coordenadas de `window.__game.screenPos(id)`, e o brinquedo efetivamente
arrastado é o que `state()` reporta como `'dragging'` após o `pointerdown`
(usar ESSE brinquedo e o tipo dele para escolher a caixa certa).

Animações (T9): aguardar ~0.7s entre arrastos para os tweens não sobreporem
picks; asserts de estado podem ser imediatos.

Transições (VIS-06/07): o hook expõe `state().transition`
(`'none' | 'opening' | 'closing'`). Enquanto `transition !== 'none'`, o input
de arrasto é ignorado — aguardar `transition === 'none'` antes de cada
sequência de arrastos.

---

## Passos (viewport 1280×800, pointerType `mouse`)

1. `browser_resize` 1280×800; navegar com `localStorage` limpo (remover a chave
   `hora-de-guardar:round` e recarregar); tocar play.
   **Assert (VIS-06.1)**: logo após o play, `transition === 'opening'` (iris de
   abertura em andamento); em até ~1.5s, `transition === 'none'`.
   Aguardar também `camera.intro === false` (recuo do close na Bluey, ~3s;
   input bloqueado enquanto durar). Então `window.__game.seed(303)`.
   **Assert**: `round === 1`, `toys.length === 6`, todos `'idle'`, `phase === 'playing'`.
2. **GUARD-02/04 (guardar todos)**: repetir até não sobrar brinquedo `'idle'`:
   `pointerdown` no `screenPos` de um brinquedo idle → identificar o `'dragging'`
   → arrastar até `screenPos(tipoDele)` (caixa certa) → soltar → aguardar ~0.7s.
   **Assert (após o último)**: todos os 6 `state === 'stored'`.
3. **GUARD-05 (celebração grande) + VIS-03 (Bluey dança)**: imediatamente após
   o último acerto.
   **Assert**: `phase === 'celebrating'`; dentro de ~1s, `bluey.mode === 'dance'`
   (Bluey vai ao centro dançar com a chuva de confete).
   Screenshot de evidência da celebração: `e2e-02-celebracao.jpeg`.
4. **VIS-06.2 (iris entre rodadas)**: aguardar ~4.2s do último acerto.
   **Assert**: `transition === 'closing'` (iris cobrindo a troca de brinquedos).
   **Assert (VIS-07.3, input gate)**: com `transition !== 'none'`, tentar um
   `pointerdown`+`pointermove` sobre um brinquedo — nenhum brinquedo entra em
   `'dragging'` (input ignorado durante a transição).
   Em seguida deve vir `transition === 'opening'` e por fim `'none'`.
5. **GUARD-05 (avanço automático sob o iris)**: aguardar até `transition === 'none'`
   (~6.5s do último acerto no total).
   **Assert**: `round === 2`, `toys.length === 9` (3 por tipo), todos `'idle'`,
   `phase === 'playing'`, `bluey.mode === 'idle'` (voltou ao canto).
6. **GUARD-06 (persistência)**: recarregar a página SEM limpar `localStorage`;
   tocar play; aguardar `transition === 'none'`.
   **Assert**: `state().round === 2` e `toys.length === 9` (retomou da rodada salva).
7. Screenshot de evidência: `e2e-02-rodada2.jpeg`.

## Verde quando

- Todos os asserts confirmados via `__game.state()`.
- Sequência de transição observada entre rodadas: `'closing'` → `'opening'` → `'none'`.
- Nenhum erro no console além de 404 de favicon.
- Screenshots capturados.

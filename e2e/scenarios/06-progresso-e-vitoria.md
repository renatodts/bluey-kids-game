# Cenário 06 — Progresso, vitória e jogar de novo (WIN-01..WIN-09)

Executado por agente via Playwright MCP. Mesmas convenções dos cenários
anteriores: asserts sobre `window.__game.state()` (que agora expõe
`progress: { round, totalRounds, stored, total, starsLit }`), arrasto por
Pointer Events sintéticos em coordenadas de `window.__game.screenPos(id)`, e o
brinquedo arrastado é o que `state()` reporta como `'dragging'`.

Para chegar rápido à vitória, o cenário injeta a rodada 3 no `localStorage`
(chave `hora-de-guardar:round` = `'3'`) — jogar as 3 rodadas inteiras já é
coberto em parte pelo cenário 02; aqui o foco é o fim do arco.

---

## Parte A — Vitória (viewport 1280×800, pointerType `mouse`)

1. `browser_resize` 1280×800; definir `localStorage['hora-de-guardar:round'] = '3'`;
   recarregar; tocar play; aguardar `transition === 'none'` e
   `camera.intro === false`; `window.__game.seed(606)`.
   **Assert (WIN-03.5, carga com save)**: `progress` = `{ round: 3, totalRounds: 3,
   stored: 0, total: 12, starsLit: 2 }`; no `#hud`, exatamente as 2 primeiras
   estrelas têm classe `lit`; `#replay-overlay` tem classe `hidden`.
   **Assert (WIN-01.1, sem texto)**: `#hud` não contém nenhum texto
   (`textContent.trim() === ''`).
2. **WIN-02 (barra por brinquedo)**: guardar todos os 12 brinquedos na caixa
   certa (regra do `'dragging'`; ~0.7s entre arrastos).
   **Assert (após o 6º)**: `progress.stored === 6`; largura de `#bar-fill` = `50%`.
3. **WIN-05 (vitória, sem rodada 4)**: após o 12º acerto.
   **Assert**: `phase === 'won'`; `progress` = `{ round: 3, totalRounds: 3,
   stored: 12, total: 12, starsLit: 3 }`; as 3 estrelas `lit`; `#bar-fill` em `100%`.
   **Assert (WIN-07, save limpo)**: `localStorage['hora-de-guardar:round']` é `null`.
4. **WIN-06 (festa grande)**: imediatamente após a vitória.
   **Assert**: `bluey.mode === 'dance'`; `audio.soundsPlayed` aumentou com o
   jingle. Screenshot de evidência: `e2e-06-vitoria.jpeg`.
5. **WIN-08 (input inerte + botão depois da festa)**: antes de ~4s,
   `#replay-overlay` ainda `hidden`; tentar `pointerdown` sobre qualquer área do
   jogo — nenhum brinquedo entra em `'dragging'` (`phase !== 'playing'` e não
   há brinquedos). Aguardar ~4.2s da vitória.
   **Assert**: `#replay-overlay` SEM a classe `hidden` (botão gigante visível).
   Screenshot: `e2e-06-botao-replay.jpeg`.

## Parte B — Jogar de novo (WIN-09)

6. Clicar `#replay-button`.
   **Assert (imediato)**: `#replay-overlay` com classe `hidden`; em seguida
   `transition === 'closing'` → `'opening'` → `'none'` (iris cobre a troca).
7. Após `transition === 'none'`:
   **Assert**: `round === 1`, `toys.length === 6`, todos `'idle'`,
   `phase === 'playing'`; `progress` = `{ round: 1, totalRounds: 3, stored: 0,
   total: 6, starsLit: 0 }`; nenhuma estrela `lit`; `#bar-fill` em `0%`;
   `localStorage['hora-de-guardar:round']` é `null`.
8. **WIN-09.4 (arrasto volta a funcionar)**: arrastar 1 brinquedo até a caixa
   certa.
   **Assert**: brinquedo `'stored'`, `progress.stored === 1`.

## Parte C — Edge cases de save

9. **Save antigo > 3**: definir `localStorage['hora-de-guardar:round'] = '7'`;
   recarregar; tocar play; aguardar `transition === 'none'`.
   **Assert**: `round === 1`, `toys.length === 6`, `progress.starsLit === 0`.
10. **Reload durante a vitória**: repetir rapidamente o caminho da Parte A
    (save `'3'`, vencer) e, com o botão de replay visível, recarregar a página
    SEM mexer no storage; tocar play.
    **Assert**: `round === 1` (o save morreu na vitória), `#replay-overlay`
    `hidden`, HUD zerado.

## Verde quando

- Todos os asserts confirmados via `__game.state()` + DOM (`#hud`, `#bar-fill`,
  `#replay-overlay`).
- Fluxo completo observado: barra enche → 3ª estrela + `phase === 'won'` →
  festa → botão → replay → rodada 1 zerada.
- Nenhum erro no console além de 404 de favicon.
- Screenshots capturados.

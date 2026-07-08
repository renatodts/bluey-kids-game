# Cenário 03 — Áudio: unlock no play e silêncio tolerante (GUARD-09)

Executado por agente via Playwright MCP. Convenções dos cenários 01/02.
O hook expõe `state().audio = { unlocked, soundsPlayed }`.

Os sons são sintetizados com WebAudio (osciladores) — não há arquivos de som;
`soundsPlayed` conta disparos reais (só incrementa com o contexto `running`).

---

## Parte A — Unlock e som de acerto (viewport 1280×800)

1. Navegar com `localStorage` limpo.
   **Assert**: overlay `#start-overlay` visível (sem classe `hidden`);
   `state().audio.unlocked === false` (nada toca antes do gesto).
2. **GUARD-09.1 (unlock no gesto)**: clicar o botão play com clique REAL
   (`browser_click` — gesto confiável para a política de autoplay).
   **Assert**: overlay com classe `hidden`; `state().audio.unlocked === true`.
3. **GUARD-09.2 (som de acerto)**: `seed(404)`; arrastar um brinquedo até a
   caixa certa (regra do 'dragging' dos cenários anteriores) e soltar.
   **Assert**: brinquedo `'stored'`; `state().audio.soundsPlayed >= 1`.
4. Screenshot de evidência: `e2e-03-audio.jpeg`.

## Parte B — Áudio bloqueado: jogo segue mudo (GUARD-09.3)

5. Recarregar com `localStorage` limpo; ANTES de tocar play, remover o
   construtor: `window.AudioContext = undefined; window.webkitAudioContext = undefined`
   (o jogo só cria o contexto no gesto do play — simula navegador sem/bloqueando WebAudio).
6. Tocar play.
   **Assert**: overlay some; `state().audio.unlocked === false`.
7. Arrastar um brinquedo até a caixa certa.
   **Assert**: brinquedo `'stored'` (jogo 100% funcional em silêncio);
   `state().audio.soundsPlayed === 0`; nenhum erro no console.

## Verde quando

- Todos os asserts confirmados; nenhum erro de console além de 404 de favicon.
- Screenshot capturado.

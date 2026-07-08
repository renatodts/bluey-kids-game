# Cenário 04 — Tema Bluey e fallback de cor sólida (GUARD-08)

Executado por agente via Playwright MCP. Convenções dos cenários anteriores.
O hook expõe `state().theme = { framesLoaded, plaquesLoaded, cheerLoaded, cheerVisible }`.

Assets oficiais em `assets/bluey/` (ver `assets/bluey/README.md`; AD-005: uso
privado). Servidos em `/bluey/*`. O fallback de cor sólida é o estado inicial
dos painéis — a arte só substitui quando a textura carrega com sucesso.

---

## Parte A — Tema presente (viewport 1280×800)

1. Navegar com `localStorage` limpo; tocar play; aguardar ~1s (carga das texturas).
   **Assert (GUARD-08.3)**: `theme.framesLoaded === 3` (quadros na parede) e
   `theme.plaquesLoaded === 3` (placas Bluey/Bingo/Chilli) e `theme.cheerLoaded === true`.
2. **GUARD-08.1 (Bluey comemora ~2s)**: `seed(606)`; arrastar um brinquedo até a
   caixa certa e soltar.
   **Assert**: brinquedo `'stored'`; logo após o acerto `theme.cheerVisible === true`;
   após ~2.5s `theme.cheerVisible === false` (aparição termina sozinha).
3. Screenshot de evidência com o tema: `e2e-04-tema.jpeg` (quadros + placas + Bluey
   visíveis).

## Parte B — Falha de asset → fallback funcional (GUARD-08.4)

4. Simular falha: renomear `assets/bluey` para `assets/bluey-off` (fora do browser)
   e recarregar a página com `localStorage` limpo; tocar play; aguardar ~1s.
   **Assert**: `theme.framesLoaded === 0`, `theme.plaquesLoaded === 0`,
   `theme.cheerLoaded === false`; `console.warn` de arte indisponível presente
   (falha tratada, não erro fatal).
5. Jogo segue jogável: `seed(707)`; arrastar um brinquedo até a caixa certa.
   **Assert**: brinquedo `'stored'`; `phase` coerente; aparição fallback ainda
   acontece (`cheerVisible === true` logo após o acerto — estrela de cor sólida).
6. Screenshot de evidência do fallback: `e2e-04-fallback.jpeg`.
7. Restaurar: renomear `assets/bluey-off` de volta para `assets/bluey`.

## Verde quando

- Parte A e Parte B com todos os asserts confirmados.
- Nenhum erro de console além de 404 de favicon e dos 404/warnings esperados dos
  assets removidos na Parte B.
- Screenshots capturados.

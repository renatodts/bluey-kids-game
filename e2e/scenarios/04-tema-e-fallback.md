# Cenário 04 — Tema Bluey, personagem 3D e fallback (GUARD-08, VIS-03, VIS-04)

Executado por agente via Playwright MCP. Convenções dos cenários anteriores.
O hook expõe `state().theme = { framesLoaded, plaquesLoaded }` e
`state().bluey = { source, mode }` (`source: 'gltf' | 'procedural'`,
`mode: 'idle' | 'cheer' | 'dance'`).

Assets oficiais em `assets/bluey/` (ver `assets/bluey/README.md`; AD-005: uso
privado). Servidos em `/bluey/*`. O fallback de cor sólida é o estado inicial
dos painéis — a arte só substitui quando a textura carrega com sucesso. A
personagem Bluey 3D tenta carregar `/bluey/bluey.glb` (GLTF fan-made, baixado
manualmente — ver `docs/references.md`); sem o arquivo, usa o modelo procedural
low-poly (AD-008) — o jogo nunca fica sem a personagem.

---

## Parte A — Tema presente (viewport 1280×800)

1. Navegar com `localStorage` limpo; tocar play; aguardar a transição de
   abertura terminar (`transition === 'none'`), o recuo da câmera
   (`camera.intro === false`, ~3s) e ~1s para a carga das texturas.
   **Assert (GUARD-08.3)**: `theme.framesLoaded === 3` (quadros na parede) e
   `theme.plaquesLoaded === 3` (placas Bluey/Bingo/Chilli).
   **Assert (VIS-04)**: `bluey.source === 'gltf'` se `assets/bluey/bluey.glb`
   existir; senão `bluey.source === 'procedural'` (fallback automático). Em
   ambos os casos `bluey.mode === 'idle'`.
2. **VIS-03 (Bluey comemora acerto)**: `seed(606)`; arrastar um brinquedo até a
   caixa certa e soltar.
   **Assert**: brinquedo `'stored'`; logo após o acerto `bluey.mode === 'cheer'`;
   após ~2.5s `bluey.mode === 'idle'` (comemoração termina sozinha).
3. Screenshot de evidência com o tema: `e2e-04-tema.jpeg` (quadros + placas +
   personagem Bluey no canto visíveis).

## Parte B — Falha de asset → fallback funcional (GUARD-08.4, VIS-04)

4. Simular falha: renomear `assets/bluey` para `assets/bluey-off` (fora do browser)
   e recarregar a página com `localStorage` limpo; tocar play; aguardar ~1s.
   **Assert**: `theme.framesLoaded === 0`, `theme.plaquesLoaded === 0`;
   `bluey.source === 'procedural'` (GLTF indisponível → modelo próprio);
   `console.warn` de arte/modelo indisponível presente (falha tratada, não
   erro fatal).
5. Jogo segue jogável: `seed(707)`; arrastar um brinquedo até a caixa certa.
   **Assert**: brinquedo `'stored'`; `phase` coerente; a Bluey procedural ainda
   comemora (`bluey.mode === 'cheer'` logo após o acerto).
6. Screenshot de evidência do fallback: `e2e-04-fallback.jpeg`.
7. Restaurar: renomear `assets/bluey-off` de volta para `assets/bluey`.

## Verde quando

- Parte A e Parte B com todos os asserts confirmados.
- Nenhum erro de console além de 404 de favicon e dos 404/warnings esperados dos
  assets removidos na Parte B.
- Screenshots capturados.

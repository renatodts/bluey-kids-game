# Visual Bluey Context

**Gathered:** 2026-07-08
**Spec:** `.specs/features/visual-bluey/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Transformar o visual do jogo para "parecer um jogo da Bluey": sala dos Heeler estilizada em 3D, materiais/luz com cara de desenho, personagem Bluey 3D presente na cena (torcida/celebração) e transições animadas (abertura, entre rodadas, celebração cinematográfica). A mecânica de jogo (arrastar brinquedos às caixas) NÃO muda.

---

## Implementation Decisions

### Personagem Bluey

- Modelo 3D fan-made (GLTF gratuito, licença compatível com uso privado).
- **Fallback se não houver modelo utilizável: construir Bluey low-poly própria, procedural em Three.js** (estilo dos brinquedos atuais, mais elaborada). Decisão explícita do usuário — não cair para billboard 2D.
- Papel: **torcida e celebração**. Bluey fica num canto assistindo; pula/comemora a cada acerto; dança no centro na rodada completa. Nunca interfere no arrasto.

### Ambiente

- **Sala dos Heeler estilizada**: recriação procedural da sala de estar da casa da Bluey — sofá, tapete, janela com quintal ensolarado, cores quentes do desenho.
- Materiais toon/gradiente, sombras suaves, luz quente.

### Transições (todas as três selecionadas)

- **Abertura estilo desenho**: tela inicial temática com transição animada (wipe/iris circular, como abertura de episódio) ao tocar play.
- **Entre rodadas**: transição animada (iris ou cartela) antes dos novos brinquedos aparecerem.
- **Celebração cinematográfica**: na rodada completa, passeio curto de câmera pela sala com confete/estrelas enquanto a Bluey dança. (A mecânica de câmera pertence à feature `mobile-camera`; esta feature define o CONTEÚDO da celebração.)

### Agent's Discretion

- Escolha exata de mobília, paleta e composição da sala (referência: episódios da série).
- Técnica de toon shading (gradient map vs shader custom).
- Duração/curvas exatas das transições (dentro dos limites da spec).

### Declined / Undiscussed Gray Areas → Assumptions

- Bingo (irmã) na cena: assumido **opcional/P3** — usuário não pediu explicitamente; só Bluey é obrigatória.
- Sons novos para transições: assumido reutilizar/estender o sistema WebAudio sintetizado existente (GUARD-09), sem novos assets de áudio.

---

## Specific References

- "Tem que parecer um jogo da Bluey" — fidelidade visual à série (animação 2D da Ludo Studio): cores saturadas e quentes, formas arredondadas, sem realismo.
- Arte oficial já disponível em `assets/bluey/` (frames, plaquetas, bluey-cheer.png) — continuar usando onde couber.
- Limite de IP: AD-005 (uso privado em família).

---

## Deferred Ideas

- Bluey como guia ativa (apontar a caixa certa como dica) — descartado pelo usuário nesta rodada; possível feature futura de "dicas".

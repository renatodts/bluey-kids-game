# Design — "Hora de Guardar!"

Jogo web 3D (Three.js) de guardar brinquedos, tema Bluey, para criança de 4 anos.
Uso privado em família — assets oficiais da Bluey apenas nesse contexto (ver `references.md`).

**Data:** 2026-07-08
**Status:** aprovado (aguardando plano de implementação)

## Conceito

A sala da família Heeler em 3D, vista fixa de frente (diorama, sem controle de câmera).
Brinquedos espalhados pelo chão; na frente, três lugares para guardar:

| Lugar | Tipo de brinquedo | Personagem na placa |
|---|---|---|
| Cesta | Bolas | Bluey |
| Baú | Blocos | Bingo |
| Caminha | Bichinhos de pelúcia | Chilli/Bandit |

A criança arrasta cada brinquedo com o dedo (tablet/celular) ou mouse (notebook/PC)
até o lugar certo. **Sem texto, sem tempo, sem derrota.**

## Regras e feedback

- **Acerto:** o brinquedo é "sugado" para a caixa com animação de pulo, som de festa,
  confete de partículas e a Bluey aparece pulando num canto com balão de comemoração.
- **Erro:** a caixa balança de leve ("balança a cabeça") e o brinquedo volta quicando
  para o chão. Feedback claro, nunca punitivo — sem sons negativos, sem contagem de erros.
- **Áreas de acerto generosas:** o raio de snap é bem maior que a caixa.
- Ao tocar num brinquedo, ele levanta um pouco do chão e segue o ponteiro (affordance
  de "peguei").

## Progressão

- Rodadas com quantidade crescente de brinquedos: 6 (2 de cada tipo) → 9 → 12,
  com variações de cor. Sempre 3 tipos/caixas.
- Sala limpa → celebração grande (todos os personagens, chuva de confete, fanfarra)
  e a próxima rodada começa sozinha após alguns segundos.
- Progresso (rodada atual) salvo em `localStorage`.

## Tema Bluey e assets

- Key art oficial como quadros na parede e no fundo do diorama.
- Placas com personagens 2D nas caixas.
- Fontes: media hub oficial e media kit Disney+ (links em `references.md`),
  baixados para `assets/` e tratados (recorte/redimensionamento).
- Brinquedos 3D: modelos próprios low-poly compostos de primitivas do Three.js
  (esferas, caixas, cápsulas) — sem modelagem externa, sem downloads de modelos.
- **Limite de IP:** materiais oficiais só para este uso privado; publicação exigiria
  licença ou troca por arte própria.

## Interação técnica

- Arrasto por **raycasting contra um plano invisível na altura do chão** — não usar
  o `DragControls` pronto (arrasta em profundidade livre, ruim para criança).
- Eventos **Pointer Events** (`pointerdown/move/up` + `setPointerCapture`) para
  unificar touch e mouse com um único código.
- Câmera fixa em perspectiva; sem orbit/zoom.

## Som

- WebAudio, desbloqueado no primeiro toque (política de autoplay do mobile).
- Sons genéricos de festa/acerto de bibliotecas livres (freesound, kenney.nl).
- Áudio do desenho fica de fora por ora; pode ser adicionado depois se houver clipes.

## Arquitetura

Vite + Three.js, JavaScript puro, página estática (serve via rede local para o tablet
ou qualquer hospedagem estática). Módulos pequenos e independentes:

| Módulo | Responsabilidade |
|---|---|
| `scene.js` | Sala, luzes, câmera fixa, quadros com key art |
| `toys.js` | Fábrica de brinquedos low-poly (tipo + cor) |
| `boxes.js` | As três caixas com placas de personagem |
| `drag.js` | Raycasting, plano de arrasto, pointer events |
| `game.js` | Estado da rodada, regra de combinação, progressão — lógica pura, sem renderer |
| `feedback.js` | Animações de acerto/erro, confete, sons, aparição da Bluey |

## Testes

- `game.js` (combinação, contagem, avanço de rodada): testes unitários com Vitest.
- Restante: validação manual no navegador — desktop e tablet — com apoio de
  Playwright para gestos de toque quando útil.

## Fora de escopo (por ora)

- Modo "por cor" ou progressão cor→tipo (foi decidido: só por tipo).
- Rotação/parallax de câmera.
- Menus, fases selecionáveis, múltiplas cenas.
- Áudio original do desenho.

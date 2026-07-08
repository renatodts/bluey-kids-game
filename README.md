# Hora de Guardar! 🧸

Um joguinho 3D de arrumar brinquedos, com tema Bluey, feito para uma criança pequena (4 anos). A câmera nunca é controlada pela criança — ela segue a ação sozinha (arrasto, acerto, celebração) e volta para o diorama da sala. O objetivo é simples: arrastar cada brinquedo até a caixa certa.

Projeto pessoal/privado — não é distribuído nem publicado por conter arte oficial da Bluey (ver [LICENSES.md](./LICENSES.md)).

## Stack

- [Vite](https://vitejs.dev/) — build e dev server
- [Three.js](https://threejs.org/) — cena 3D, câmera, materiais e animação procedural
- [camera-controls](https://github.com/yomotsu/camera-controls) — easing da câmera viva (AD-007)
- [Vitest](https://vitest.dev/) — testes unitários da lógica pura de jogo
- Playwright MCP — cenários end-to-end guiados por prompt (`e2e/scenarios/*.md`)

Sem framework de UI: página estática servida pelo Vite, JavaScript puro em `src/`.

## Como rodar

```bash
npm install
npm run dev       # servidor de desenvolvimento
npm run build     # build de produção em dist/
npm run preview   # serve o build de produção localmente
npm test          # roda a suíte Vitest
```

Abra o endereço impresso pelo Vite e clique em jogar (o áudio só é destravado após o primeiro gesto do usuário).

## Estrutura do projeto

```
src/            lógica e cena do jogo (game.js é puro/testável; o resto é renderização)
assets/         arte e modelo 3D da Bluey (uso privado, ver LICENSES.md)
docs/           notas de pesquisa e referências de assets
e2e/scenarios/  cenários end-to-end em linguagem natural, executados via Playwright MCP
.specs/         specs de features, decisões de arquitetura (STATE.md) e lições aprendidas
```

## Testes

- **Unitários** (`npm test`): cobrem a lógica pura de jogo (`game.js`, `hud.js`, `transitions.js`, `bluey.js`), sem depender de WebGL.
- **End-to-end**: cenários descritos em `e2e/scenarios/*.md`, executados por um agente com Playwright MCP contra `vite preview`, usando o hook determinístico `window.__game` para asserts (o canvas WebGL é opaco para asserts de DOM tradicionais).

## Licenças e créditos

Este projeto usa arte oficial da Bluey e um modelo 3D de terceiros. Consulte [LICENSES.md](./LICENSES.md) antes de reutilizar, redistribuir ou publicar qualquer parte deste repositório.

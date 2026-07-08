# Licenças e créditos

Este projeto combina código próprio com material de terceiros. As restrições abaixo se aplicam **antes** de reutilizar, redistribuir ou publicar qualquer parte deste repositório.

## Código-fonte

Código próprio do projeto (`src/`, `e2e/`, configuração), sem licença de código aberto atribuída — uso pessoal/privado. Não redistribuir sem autorização do autor.

## Imagens — arte oficial Bluey (`assets/bluey/`)

| Arquivo | Fonte original |
|---|---|
| `frame-1.jpg` | bluey.tv media hub — S1 Iconics 001 |
| `frame-2.jpg` | bluey.tv media hub — S2 Iconic 001 |
| `frame-3.jpg` | bluey.tv media hub — S3 Iconic Landscape |
| `plaque-bluey.png` | bluey.tv/characters — Bluey |
| `plaque-bingo.png` | bluey.tv/characters — Bingo |
| `plaque-chilli.png` | bluey.tv/characters — Chilli |
| `bluey-cheer.png` | bluey.tv/characters — Bluey (pose) |

Baixadas do media hub oficial da Bluey (Ludo Studio / BBC Studios / Disney) e tratadas para ≤1024px. São propriedade dos respectivos detentores de marca e direitos autorais.

**Uso restrito a ambiente privado/doméstico (AD-005).** Publicar um jogo com esta arte exige licenciamento do detentor da IP — sem essa autorização, este repositório e seus assets **não podem ser publicados nem distribuídos**.

O jogo funciona sem nenhum arquivo desta pasta: sem eles, cai em fallback de cor sólida/Bluey procedural (GUARD-08.4 / AD-008).

## Modelo 3D (`assets/bluey/bluey.glb`)

- **Bluey Heeler's Family**, autor `MickeyFan1928` — [Sketchfab](https://sketchfab.com/3d-models/bluey-heelers-family-bluey-3d-model-chucky-db72671fe85043e69fd0cb271ae3850e)
- **Licença: CC-BY** — exige atribuição ao autor sempre que o arquivo for usado ou o jogo distribuído.
- Uso restrito a ambiente privado/familiar (AD-005/AD-008), assim como as imagens acima.
- Arquivo opcional: se ausente, o jogo usa uma Bluey procedural low-poly construída em `src/bluey.js` como fallback automático.

## Áudio

Nenhum arquivo de áudio externo é usado. Toda a música de fundo e os efeitos sonoros (acerto, erro, fanfarra, vitória) são **sintetizados em tempo real via Web Audio API** (`src/feedback.js`), especificamente para evitar riscos de licenciamento de faixas de terceiros (AD-005).

## Dependências de código

Bibliotecas de terceiros usadas via npm (`three`, `camera-controls`, `vite`, `vitest`) seguem suas próprias licenças declaradas em seus respectivos pacotes — ver `package-lock.json` e os repositórios de cada projeto.

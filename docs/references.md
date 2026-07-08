Achei as **fontes oficiais mais úteis** para você montar um jogo da Bluey focado só na personagem principal, mas preciso fazer um alerta importante: os assets oficiais de Bluey são protegidos por direitos autorais e marca, então o uso em jogo público/comercial depende de licença/autorização do detentor da IP. [press.disneyplus](https://press.disneyplus.com/media-kits/bluey)
## Fontes oficiais
Os dois hubs mais relevantes são o **Media Hub oficial da Bluey** e o **media kit da Disney+**, porque ambos concentram logos, key art, imagens promocionais e materiais de imprensa oficiais. [press.disneyplus](https://press.disneyplus.com/media-kits/bluey)
No Media Hub, a página “About Bluey” informa explicitamente que há downloads de logos e key art em alta resolução. [bluey](https://www.bluey.tv/media-hub/about-bluey/)

- Media Hub oficial: [bluey.tv/media-hub](https://www.bluey.tv/media-hub/) [bluey](https://www.bluey.tv/media-hub/)
- About Bluey / brand assets: [bluey.tv/media-hub/about-bluey](https://www.bluey.tv/media-hub/about-bluey/) [bluey](https://www.bluey.tv/media-hub/about-bluey/)
- Media kit Disney+: [press.disneyplus.com/media-kits/bluey](https://press.disneyplus.com/media-kits/bluey) [press.disneyplus](https://press.disneyplus.com/media-kits/bluey)
## Recursos encontrados
Pelo conteúdo das páginas, estes são os tipos de recursos oficiais disponíveis para coleta ou referência: logos, key art, imagens promocionais, imagens de episódios, trailers e materiais de minisodes. [press.disneyplus](https://press.disneyplus.com/media-kits/bluey)
O Media Hub também publica releases e materiais de franquia, o que ajuda a encontrar novas peças visuais, anúncios de jogos e campanhas recentes ligadas a Bluey. [bluey](https://www.bluey.tv/media-hub/)

| Recurso | Onde achar | Observação |
|---|---|---|
| Logos oficiais | [About Bluey](https://www.bluey.tv/media-hub/about-bluey/)  [bluey](https://www.bluey.tv/media-hub/about-bluey/) | A página indica downloads “Full Res”.  [bluey](https://www.bluey.tv/media-hub/about-bluey/) |
| Key art oficial | [About Bluey](https://www.bluey.tv/media-hub/about-bluey/)  [bluey](https://www.bluey.tv/media-hub/about-bluey/) | Útil para telas, menu e referência visual.  [bluey](https://www.bluey.tv/media-hub/about-bluey/) |
| Imagens promocionais | [Disney+ Media Kit](https://press.disneyplus.com/media-kits/bluey)  [press.disneyplus](https://press.disneyplus.com/media-kits/bluey) | Inclui seção “Images”.  [press.disneyplus](https://press.disneyplus.com/media-kits/bluey) |
| Imagens de episódios | [Disney+ Media Kit](https://press.disneyplus.com/media-kits/bluey)  [press.disneyplus](https://press.disneyplus.com/media-kits/bluey) | Há seção “New Episode Images”.  [press.disneyplus](https://press.disneyplus.com/media-kits/bluey) |
| Artes especiais | [Disney+ Media Kit](https://press.disneyplus.com/media-kits/bluey)  [press.disneyplus](https://press.disneyplus.com/media-kits/bluey) | Inclui “Ghostbasket”, “The Sign” e “Surprise”.  [press.disneyplus](https://press.disneyplus.com/media-kits/bluey) |
| Trailer/vídeos | [Disney+ Media Kit](https://press.disneyplus.com/media-kits/bluey)  [press.disneyplus](https://press.disneyplus.com/media-kits/bluey) | Bom para capturar poses e animação de referência.  [press.disneyplus](https://press.disneyplus.com/media-kits/bluey) |
| Releases e novidades | [Media Hub](https://www.bluey.tv/media-hub/)  [bluey](https://www.bluey.tv/media-hub/) | Ajuda a achar materiais novos da franquia.  [bluey](https://www.bluey.tv/media-hub/) |
## Links visuais úteis
Encontrei também um arquivo de imagem hospedado no domínio oficial da Bluey, que pode servir como referência visual da personagem e da família.
Além disso, o site brasileiro da Disney tem uma imagem promocional de Bluey em CDN oficial Disney, útil como referência de cor e proporção.
Essa imagem vem de um arquivo em `bluey.tv/wp-content/uploads`, então é uma referência oficial do ecossistema Bluey.



Essa arte está hospedada em infraestrutura da Disney e pode ajudar na direção de arte do seu jogo.
## Limites de uso
Esses materiais são bons para **referência, prototipação privada e pitch**, mas para publicar um jogo da personagem Bluey com arte oficial você provavelmente vai precisar de licenciamento do detentor da marca/IP. [press.disneyplus](https://press.disneyplus.com/media-kits/bluey)
Se o seu objetivo for evitar risco jurídico, o caminho mais seguro é criar um jogo **inspirado no estilo** de uma filhote azul carismática, sem usar nome, visual exato, logos ou artes oficiais. [bluey](https://www.bluey.tv/media-hub/)

Posso, no próximo passo, montar uma lista mais prática em formato de produção com:
1. links organizados por tipo de asset,  
2. quais arquivos baixar primeiro,  
3. e uma estratégia para transformar isso em sprites/UI para um jogo web.

## Modelo 3D fan-made da Bluey (feature `visual-bluey`)

Pesquisa (2026-07-08) não encontrou nenhum modelo 3D fan-made baixável sem login manual — todos os candidatos viáveis estão no Sketchfab e exigem conta gratuita para exportar o glTF.

**Escolhido para download manual pelo usuário:**

- **Bluey Heeler's Family** — autor `MickeyFan1928`, Sketchfab: https://sketchfab.com/3d-models/bluey-heelers-family-bluey-3d-model-chucky-db72671fe85043e69fd0cb271ae3850e
- Licença: **CC-BY** (exige atribuição ao autor no jogo/créditos)
- Pack inclui Bluey, Bingo, Bandit e Chilli; ~36k tris por personagem; sem rig/animações embutidas (animação é procedural, ver `bluey.js`)
- Passo manual: criar conta gratuita no Sketchfab → baixar em formato glTF → salvar em `assets/bluey/bluey.glb` (Bluey) e, opcionalmente, `assets/bluey/bingo.glb` (P3)

**Alternativa com rig** (não escolhida por licença não declarada): pack `coolbeanslollol` no DeviantArt (.blend/FBX, rigged) — mantido aqui só como referência caso o pack acima não sirva.

**Uso**: privado, uso familiar, conforme AD-005/AD-008. Sem esse arquivo, o jogo usa a Bluey procedural (fallback automático, sem quebrar).
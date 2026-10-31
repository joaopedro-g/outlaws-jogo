# Landing: proposta visual portável

Esta pasta é uma proposta para a origem do JP. Nenhum PNG original foi alterado. Nenhum arquivo de carteira, chain, ABI ou transação foi editado.

## O que mudou

- Primeira dobra com nome do jogo, descrição curta, demo sem carteira e entrada para a testnet.
- Diorama com cartaz Wanted, selo, floresta e personagens PNG originais, com luz âmbar e movimento discreto.
- Mural Wanted completo preservado, com molduras retas, respiro entre retratos e leitura melhor de títulos e valores.
- Hierarquia consistente entre Holtwood para títulos, Archivo para leitura e Press Start 2P para etiquetas. IM Fell continua nos detalhes de época.
- Navegação mais legível, botões com relevo, hovers curtos, foco visível e movimento desligado com `prefers-reduced-motion`.
- Celular com hero em uma coluna, personagens menores, cartas de mapa maiores e tabela rolável.
- Corrigido o `margin` padrão de `figure` que comprimia as imagens dos terrenos.
- Favicon e Apple touch icon usam `assets/crest.png` do JP.
- Imagem de compartilhamento 1200 × 630 composta só de HTML/CSS e PNGs existentes. Fonte reproduzível em `og-card.html`.
- Novos textos em inglês, português, espanhol e filipino via extensão do motor de tradução existente.
- O subtítulo dos terrenos ficou sem travessão nas quatro traduções e a barra de som cabe no fluxo da landing mobile, sem editar áudio.

## Arquivo por arquivo

| Arquivo da proposta | Mudança | Destino provável na origem |
| --- | --- | --- |
| `index.html` | Metadados OG/Twitter, favicon, importação de CSS/JS, nova seção `.entry`, mural com `id="crew"`, título Wanted como `h2` | Template da landing usado por `tools/build-panel.js`. O README informa geração, mas o caminho desse template não está neste checkout. Localizar antes de portar. |
| `assets/propostas/site/site.css` | CSS exclusivo da landing, com hero, atmosfera, quadros e ajustes responsivos | Copiar para assets da origem e incluir no gerador da landing. Pode ser consolidado no CSS do template se o JP preferir. |
| `assets/propostas/site/site.js` | Extensão de textos `v.site.*`, sem chamadas de rede ou acesso a carteira | Copiar para assets de landing, ou mover somente as chaves para o dicionário da landing na origem. Não precisa alterar o motor `i18n.js`. |
| `assets/propostas/site/og-card.html` | Composição reproduzível de social card | Arquivo de design de referência. A origem só precisa publicar o PNG final. |
| `assets/propostas/site/og-image.png` | Captura estática 1200 × 630 do social card | Copiar para assets publicados e ajustar `og:image`/`twitter:image` caso a URL final mude. |

## Referências e critério

[Pixels](https://www.pixels.xyz/) coloca Play For Free cedo e explica o gameplay antes da economia. [Kingdom](https://kingdomthegame.com/) apresenta atmosfera pixel com poucas decisões e uma galeria clara. A aplicação aqui é uma inferência de design: abrir a demo fica fácil, a arte do próprio JP domina a entrada e a coleção completa continua no mural. Não foi medido ganho de conversão.

## Validação e limites

O CSS/JS afeta somente a landing. A rota de demo e a rota de testnet já existiam. A URL pública nos metadados foi copiada do README deste repositório; confirmar o domínio ao portar. Fontes usam o Google Fonts já presente no projeto, com fallbacks nativos. Sem acesso ao Google Fonts, o layout cai em Georgia e fontes do sistema e continua legível. Para uma versão totalmente offline, o JP pode portar os arquivos oficiais das famílias escolhidas com suas respectivas licenças.

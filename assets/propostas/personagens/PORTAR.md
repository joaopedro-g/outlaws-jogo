# Personagens e interface do jogo

Proposta visual feita sobre a cópia publicada do `outlaws-jogo`. Os PNGs e o gerador de sprites do JP não foram alterados. A origem não está disponível neste checkout, então os destinos abaixo são sugestões para confirmar no `tools/build-panel.js` do JP.

## O que portar por arquivo

| Arquivo nesta proposta | Mudança | Onde levar na origem |
| --- | --- | --- |
| `jogar/index.html` | Um `link` para `../assets/propostas/characters.css?v=visual-v1`, imediatamente depois do `style` existente; um `script` para `../assets/propostas/characters.js?v=visual-v1`, imediatamente depois do `app.js` existente. Nenhuma referência de script original foi alterada. | Template HTML do jogo em `panel/`, ou HTML emitido pelo `tools/build-panel.js`. Confirmar caminho exato no gerador. |
| `assets/propostas/characters.css` | Cartazes de pergaminho com contraste mais calmo; palco/sombra dos sprites; rank em selo de metal; respiração em passos inteiros de 1 px; títulos legíveis; botões, filtros, painel, barra superior e navegação refinados; composição do mapa e bando corrigida entre 1041 e 1499 px; dois cartazes por linha no celular de 360 a 700 px; safe area; reduzir movimento. | Folha visual do painel, carregada depois do CSS atual. Copiar também no fluxo que emite `assets/`; manter os caminhos relativos de `parchment.png`. |
| `assets/propostas/characters.js` | Decorador DOM limitado a `#band`, `#fusion`, `#fuse-list`, `#reveal` e galeria. Move a mesma imagem para um palco com sombra e acrescenta SVG de rank; mantém `src`, `alt`, atributos, checkboxes e botões. Pausa animação quando o documento fica oculto ou o cartaz sai da tela. | JS visual do painel, carregado após `app.js`. Não precisa entrar em `lib.js`, no gerador de sprites, nas funções de carteira nem no código de transação. |
| `assets/propostas/personagens/rank-seals.svg` | Seis insígnias geométricas originais: aço/diamante, verde/folha, azul/flecha, violeta/estrela, âmbar/lâminas e vermelho/coroa. Paleta derivada dos ranks existentes, geometria de selo em passos de pixel. | Diretório de assets do painel, preservando o caminho de `characters.js` ou ajustando `emblemUrl` somente. |
| `assets/propostas/personagens/index.html`, `gallery.css`, `gallery.js` | Galeria de revisão com antes/depois dos mesmos PNGs originais, seis selos e textos EN/PT/ES. É documentação de proposta, não uma tela de compra. | Diretório de propostas/documentação visual. Publicar a galeria é opcional; não é dependência do jogo. |
| `assets/propostas/personagens/PORTAR.md` | Este mapa de portabilidade e verificação. | Documentação de revisão do JP. |

## Decisões visuais

- Mantidos pergaminho, madeira, selo, cores de raridade e todos os pixels do JP.
- O sprite de 32 × 32 aparece em 96 × 96 no bando: escala inteira 3×; a respiração usa deslocamento inteiro de 1 px. A capa e o repouso no mapa ficam na frente MAPA, que trabalha o canvas separadamente.
- O brilho contínuo dos cartazes foi trocado por borda de papel e insígnia de metal. O aparecimento de um personagem novo mantém o pop breve; o rank mítico deixa de pulsar o cartaz inteiro.
- Os números e ações seguem com fonte pixel; os títulos usam a fonte de pergaminho já presente e a leitura usa Archivo já presente.
- O decorador não lê estado do jogo, contratos, providers, carteira, seeds nem atributos on-chain. Os atributos decorativos próprios começam com `data-outlaw-` e `data-visual-`.
- Os quatro recursos ocupam grade 2 × 2 no celular, sem trilho ocultando o próximo epoch. O papel recebe camada de cor a 85% acima da textura original; rótulos dos atributos, estados, vida, recompensa e ações do cartaz usam leitura de pelo menos 11 px.
- Integração visual de controles de áudio paralelos: no celular, `body > .outlaws-sfx` ocupa uma faixa opaca reservada acima dos quatro botões de navegação. `:has()` reserva o espaço só quando os controles estão presentes; padding no fim da página deixa o último cartaz fora da barra. Os handlers e arquivos de áudio não foram editados; controles movidos a um diálogo pelo portal conservam o estilo original dele. Desktop preservado.

## Revisão

- Sintaxe: `node --check assets/propostas/characters.js` e `node --check assets/propostas/personagens/gallery.js`, ambos exit 0.
- SVG: XML analisado com `[xml]` no PowerShell, seis símbolos de rank encontrados.
- Arte preservada: SHA-256 dos seis `rank-*.png` e oito `crew-*.png` idênticos ao snapshot original, 14/14.
- `git diff --check` nos caminhos desta frente: exit 0.
- Conferido em EN/PT/ES e sete larguras: nenhum dado importante cortado, nenhum overflow do documento, nenhuma imagem quebrada e nenhum erro de console. Reduzir movimento desliga o idle.
- Galeria: abrir `assets/propostas/personagens/` pelo servidor local.
- Revisar somente as inclusões de CSS/JS no HTML ao portar. Alterações paralelas em `feel.js`, `sfx.js`, `juice.js` não fazem parte desta frente.

Nenhum arquivo de cadeia ou carteira foi alterado.

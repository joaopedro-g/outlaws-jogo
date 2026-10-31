# Proposta visual do mapa e da estrada

Esta cópia é gerada. O JP deve portar a proposta para a origem antes de rodar `tools/build-panel.js` novamente. Os arquivos da origem não estão nesta pasta; os símbolos abaixo permitem localizar os trechos corretos em `panel/`.

## Direção

1. A pintura de chão, árvores, pedra, água, baús e caixas do JP permanece na base.
2. A luz vem do alto à esquerda e fica quente na Estrada e na Mata, mais fria na Ponte.
3. Raios largos e discretos dão profundidade à Estrada e à Mata.
4. A borda em sombra conduz o olhar ao bando sem apagar os objetos.
5. Sombras de nuvens atravessam devagar apenas os terrenos externos.
6. A Mata ganha sete vaga-lumes; os demais pontos são poeira de um pixel.
7. Tochas e braseiros ganham fumaça curta e uma brasa ocasional.
8. O contorno de raridade recebe luz no alto e sombra embaixo, sem mudar a paleta interna do boneco.
9. O repouso usa respiração e capa com amplitude de um pixel, reaproveitando os pixels originais.
10. A estrada dos sacos ganha céu, serras e copas em planos, preservando a silhueta e o castelo.

## Mudanças por arquivo

| Arquivo nesta cópia | Trechos a localizar na origem | O que portar |
| --- | --- | --- |
| `jogar/js/heist.js` | Módulo do assalto em `panel/`, funções `look`, `roomArt`, `drawOutlaw`, `draw`, `frame` | Aro de raridade com luz direcional, camadas `atmosphere` e `drawAir`, metadados visuais por sala, sombra em duas densidades, repouso em três faixas do canvas original e pausa de desenho em aba oculta. |
| `jogar/js/road.js` | Módulo da estrada em `panel/`, funções `castelo`, `desenha`, `mount`, `sync`, `quadro` | `paisagemDe`, `ceu`, planos com deslocamento proporcional à posição do viajante, céu em faixas, nuvens lentas, poeira, luz no portão pronto e cache dos dois estados do castelo. |
| `assets/propostas/mapa/PORTAR.md` | Documentação de revisão da origem | Este roteiro de portabilidade e os limites da proposta. |

A origem pode organizar os módulos como `panel/heist.js` e `panel/road.js`, ou dentro de `panel/js/`. São caminhos prováveis, não confirmados nesta cópia. Localizar pelos símbolos evita portar para o arquivo gerado errado.

## Limites e desempenho

- A base de `MAP.paintRoom` não muda. Nenhum raster da arte do JP foi sobrescrito.
- Luz, vinheta e nuvens são canvases cacheados por sala; o castelo da estrada é cacheado nos estados apagado e aceso.
- Cada sala tem 10 pontos de ambiente, ou 14 na Mata, incluindo sete vaga-lumes. Cada fogo tem três amostras pequenas de fumaça.
- Partículas consultam somente o tempo de apresentação. O novo stream `arte:estrada` serve exclusivamente para a paisagem da vinheta.
- `prefers-reduced-motion` mantém o ambiente estático, desliga o balanço dos personagens e permite atualizar o progresso da estrada sem iniciar um loop de animação.
- Aba oculta não desenha o mapa nem a vinheta. Ao voltar, o relógio e a simulação originais continuam responsáveis pelo estado.
- O mapa não recebe indicador de clique: o canvas é uma vitrine e não possui ação de clique.
- Não foi criada câmera artificial nem ciclo de dia/noite. A composição atual é um mapa inteiro visto de cima; a atmosfera continua previsível por terreno.

## Conferência

- `node --check jogar/js/heist.js` e `node --check jogar/js/road.js` passaram.
- Smoke de render em VM: cinco terrenos, repouso e caminhada, movimento normal e reduzido; estrada pendente e pronta, incluindo IDs BigInt; 879 chamadas de desenho com coordenadas finitas e sem exceções.
- Hash SHA-256 da seção pura de simulação do assalto, antes e depois: `889e1cb02bb3a78badb1335493554e7e1185a5a32a5521dbe04346a3c6e3afbc`.

Toda alteração aqui continua sendo proposta para revisão do JP. O port não exige ABI, contratos, cadeia, carteira ou arquivos de transação.

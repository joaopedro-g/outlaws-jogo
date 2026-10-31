# Personagens arcade, proposta separada

Arte original feita por desenho geométrico em código, com uma grade inteira de 24 × 24 px, sem dependências e sem antialias. Os personagens atuais, PNGs do JP, gerador original, contratos e interface do jogo não foram alterados nesta rodada.

## Direção

Seis bandidos chibi roubadores de cofre, com cabeça grande, olhos mínimos e contorno de 1 px em `#17182d`. A composição usa a leitura imediata de jogos arcade de grade, sem reproduzir personagem, bomba ou logo de referência.

| Rank | Paleta e sinal visual |
| --- | --- |
| Common | Cinza frio, lenço e pequena bolsa de moedas. |
| Uncommon | Verde vivo e punhal com guarda dourada. |
| Rare | Azul vivo, arco dourado e flecha clara. |
| Epic | Roxo, máscara decorada e pluma rosa. |
| Legendary | Laranja, chave grande dourada e cofre pequeno. |
| Mythic | Magenta, crista de rubi um pixel acima do capuz e capa com ombros um pixel mais largos de cada lado. O rank se distingue do Epic pela silhueta, além da cor. |

## Folha e animações

- `characters.png`: 480 × 144 px, transparente; seis linhas de rank, vinte colunas de frames de 24 × 24 px.
- `characters.json`: paleta, ranks, recortes de 120 frames, tempos e âncora do pé em `(12, 21)`.
- Colunas 0..1: idle com respiração de 1 px e pés ancorados.
- Colunas 2..4: andar para baixo; 5..7: esquerda; 8..10: direita; 11..13: cima. Cada direção tem três poses. O perfil direito espelha o desenho do perfil esquerdo em coordenadas inteiras.
- Colunas 14..16: celebração com braços erguidos e expressão alegre.
- Colunas 17..19: queda em três poses, começando pelo desequilíbrio e terminando de lado, achatado. A queda foi desenhada no grid, sem rotação ou filtro de imagem.

## Reprodução e portabilidade

Rodar na pasta do projeto: `node tools/draw-arcade-characters.cjs`. O script usa somente módulos nativos de Node e o helper local `tools/arcade-pixels.cjs`.

Para inspeção ampliada: `node tools/draw-arcade-characters.cjs --preview` também gera `characters-preview.png`, 1440 × 432 px, com escala inteira 3× por repetição dos mesmos pixels. É imagem de revisão, não spritesheet adicional de produção.

Na origem do JP, esta folha pode morar em um diretório de propostas do `panel/`, copiado pelo gerador `tools/build-panel.js`. Qualquer substituição dos personagens ativos depende da escolha do JP; não é dependência da interface atual.

## Verificação

- `node --check tools/draw-arcade-characters.cjs`: exit 0.
- PNG RGBA8 decodificado com módulos nativos de Node: 480 × 144 px, 120 frames não vazios, sem antialias, alfa somente 0/255 e 45 cores opacas.
- Os 120 frames terminam em `y = 21`, com pixels dentro de `x = 1..22` e `y = 0..21`; a âncora do pé fica consistente entre idle, caminhada, celebração e queda.
- Inspeção visual do PNG original a 1× e do preview a 3×: cores, quatro direções, braços erguidos e poses laterais legíveis.
- Refino após revisão: Mythic ganhou rubi elevado em 1 px, visível também de costas, e capa ampliada em 1 px por lado. Folha e preview regenerados; sintaxe e âncora dos 120 frames novamente conferidas, com 45 cores e alfa 0/255 preservados.
- Reprodução: executar o gerador novamente mantém os mesmos SHA-256 do PNG e do JSON, sem timestamp ou aleatoriedade.
- Nenhuma arte ativa, CSS/JS anteriores, `app.js`, `heist.js`, `road.js` ou outro script foi alterado nesta rodada.

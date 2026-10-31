# Inimigos de três épocas

Arte original OUTLAWS, desenhada em coordenadas inteiras. As duas folhas têm 512 x 192 px, células de 32 px, 16 colunas e seis linhas. O gerador usa apenas Node e `tools/arcade-pixels.cjs`.

| Linha | ID | Época | Identidade |
| --- | --- | --- | --- |
| 0 | king_guard | medieval | Elmo dourado com coroa, tabardo vermelho, escudo quadrado e alabarda |
| 1 | knight | medieval | Pluma azul, elmo de aço, escudo pontudo e espada larga |
| 2 | bank_security | modern | Cabelo penteado, óculos, bigode, mangas brancas, rádio e cassetete |
| 3 | police | modern | Quepe azul, distintivo, rádio de ombro e pistola |
| 4 | security_robot | future | Cabeça retangular, visor laranja, antena e canhão de braço |
| 5 | alien_guardian | future | Chifres assimétricos, pele turquesa, armadura orgânica e cajado crescente |

Classic usa terra, vinho, ouro envelhecido e luz marfim. Arcade usa cabeça maior, azul e turquesa saturados, destaques fortes e contorno `#17182d`. Não há blur, antialias, gradiente ou dependência externa.

## Uso

Leia `enemies.json`. `image.classic` e `image.arcade` são relativos à pasta deste arquivo. Todos os atores têm anchor `[16, 29]` em coordenadas locais da célula e ficam no mesmo chão, inclusive a queda. `bounds` guarda a união das poses por estilo, enquanto `frameBounds` guarda os limites de cada célula.

| Frames | Estado |
| --- | --- |
| 0, 1, 2 | Caminhar para baixo, com idle no frame 0 |
| 3, 4, 5 | Caminhar para a esquerda |
| 6, 7, 8 | Caminhar para a direita |
| 9, 10, 11 | Caminhar para cima |
| 12, 13 | Preparar ataque, soltar ataque |
| 14 | Receber impacto com recuo e expressão |
| 15 | Cair de lado, arma solta e sem sangue |

`animations` tem os estados e as quatro direções. Ataque, impacto e queda compartilham frames nas quatro chaves, por caberem no grid de 16 colunas. A pose de ataque usa o corpo de frente e a arma à direita; o renderer pode espelhar a célula inteira quando precisar atacar à esquerda. Os frames de andar para esquerda e direita já estão desenhados.

Use `image-rendering: pixelated` e escalas inteiras para preservar o desenho. Recorte com `sx = frame * 32` e `sy = actor.row * 32`.

## Reprodução e conferência

Execute `node tools/draw-era-enemies.cjs` na raiz do projeto. O gerador valida 192 poses, 16 poses únicas por ator e estilo, alpha somente 0 ou 255, pixels inteiros e chão no y=29. `styles` registra as dimensões e SHA-256 de cada PNG.

`enemies-preview.png` mostra cada personagem em 1x e 3x, as quatro direções e os quatro estados de ação. O fundo do recorte 1x é opaco apenas nessa prancha; as folhas de sprites são transparentes.

# OUTLAWS arcade: itens e efeitos

Proposta original de pixel art produzida por código Node, sem dependências, bitmap de IA ou arte copiada de outro jogo. Os PNGs do JP continuam intactos. Esta folha só fornece desenhos para a integração aditiva.

## Reproduzir

Na raiz do projeto:

```text
node tools/draw-arcade-items.cjs
```

O gerador usa `tools/arcade-pixels.cjs` e grava `assets/propostas/arcade/items.png` e `items.json`. A folha mede **192 × 96 px**, com 8 colunas × 4 linhas e células de **24 × 24 px**. Coordenadas sempre inteiras; transparência exclusivamente 0 ou 255. Ampliação deve usar nearest-neighbor, `image-rendering: pixelated` ou `imageSmoothingEnabled = false`.

## Índices e blocos

| Índices | Nome em JSON | Uso visual |
| --- | --- | --- |
| 0..3 | `coin-spin-0` até `coin-spin-3` | Giro em quatro poses, com a mesma linha de base. |
| 4 | `loot-sack` | Saco de couro com corda e remendo. |
| 5 | `cut-gem` | Gema facetada azul, com facetas discretas. |
| 6 | `repair-hammer` | Martelo de reparo com aço e cabo de madeira. |
| 7 | `vault-key` | Chave de cofre dourada. |
| 8..13 | `rank-seal-common` até `rank-seal-mythic` | Selos com cauda, cor e emblema diferentes por rank. |
| 14..17 | `dust-0` até `dust-3` | Poeira curta com quatro fases de dispersão. |
| 18..21 | `spark-0` até `spark-3` | Impacto em estrela, raios e pequenos pontos finais. |
| 22..27 | `explosion-0` até `explosion-5` | Núcleo, expansão, anel aberto e resíduo. Somente efeito visual de evento existente. |
| 28 | `loot-shine` | Brilho de saque, sem novo baú ou recompensa. |
| 29 | `guard-alert` | Alerta legível de guarda/perigo. |
| 30 | `exit-arrow` | Seta verde para saída. |
| 31 | `coin-burst` | Pequeno conjunto de moedas para evento visual existente. |

Cada entrada de `frames` contém `id`, `name`, `block`, `x`, `y`, `w` e `h`. `durationMs` é fornecido nos frames animados; `rarity` identifica os selos. A propriedade `blocks` inclui `first`, `count`, `fps`, `loop` e `docs`, para integrar sem inferir ranges.

## Direção de arte

Contorno comum `#17182d`, materiais distintos e luz no canto superior esquerdo. Ouro tem aro, face e carimbo de capuz próprio; couro, metal e gema têm sombras opacas. As seis raridades têm símbolos diferentes além da cor: pequeno losango, dupla marca, gema, asas, coroa e estrela. Efeitos usam partículas e curvas em degraus, sem blur, glow de bitmap ou neon.

O clima de arcade e leitura imediata serve ao tema de foras-da-lei roubando um cofre. Nenhum personagem, item, logotipo ou mapa de Bomberman foi copiado. A explosão **não representa bomba ou nova arma**; só pode vestir um evento visual já existente e confirmado.

## Movimento reduzido e integração

Com `prefers-reduced-motion`, usar uma pose estática representativa ou ocultar os efeitos transitórios. Esta folha não registra listeners, ações, som, estado de jogo, carteira ou transação. O módulo visual controla a pausa e os eventos na integração.

Na origem, portar o gerador e o helper para ferramentas de arte, e copiar a folha/JSON para os assets que `tools/build-panel.js` publica. O caminho exato do módulo de visual da origem não existe neste checkout e precisa ser confirmado pelo JP. `ITENS.md` é documentação de portabilidade, não código de gameplay.

## Conferência desta proposta

`node --check tools/draw-arcade-items.cjs` passou. O gerador executou e confirmou 32 frames em 192 × 96; o sheet foi inspecionado a 1x. Nenhum teste ou estado de gameplay foi alterado por esta frente.

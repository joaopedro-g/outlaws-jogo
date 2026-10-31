# Arte por época: portar para a origem do JP

Esta pasta é proposta. O repositório atual é saída gerada. Levar os módulos, assets e inclusões ao template de `panel/` usado por `tools/build-panel.js` na origem; o caminho exato desse template não está disponível neste checkout.

## Arquivos e função

| Arquivo | Mudança | Destino na origem |
| --- | --- | --- |
| `tools/arcade-pixels.cjs` | Painter inteiro e encoder PNG sem dependência, já entregue na rodada 2 | Ferramenta de arte equivalente |
| `tools/draw-era-enemies.cjs` | Seis inimigos, Classic e Arcade, 32 px | Ferramenta de arte equivalente |
| `tools/draw-era-bosses.cjs` | Três bosses e seis raridades de caixa, 48 px | Ferramenta de arte equivalente |
| `tools/draw-era-effects.cjs` | Blast, fumaça e detritos originais, 64 px | Ferramenta de arte equivalente |
| `tools/draw-graphics-levels.cjs` | Converte as sheets Arcade para paletas 4/16/32 cores | Ferramenta de arte equivalente |
| `tools/build-era-art-manifest.cjs` | Consolida os cinco JSONs em script local | Etapa de geração de assets |
| `assets/propostas/era-art/enemies-{classic,arcade}.png`, `enemies.json` | 192 poses, IDs estáveis por época | Assets do painel |
| `assets/propostas/era-art/bosses-{classic,arcade}.png`, `bosses.json` | 96 poses, Rei Tirano, Chefe da SWAT e Imperador Alien | Assets do painel |
| `assets/propostas/era-art/lootbox-{classic,arcade}.png`, `lootbox.json` | 144 frames de caixa e luz de raridade | Assets do painel |
| `assets/propostas/era-art/impact.png`, `impact.json` | 24 frames de impacto | Assets opcionais do módulo de efeitos |
| `assets/propostas/era-art/graphics-{atari,8bit,16bit}-{characters,scenario,items}.png`, `graphics.json` | Nove sheets de qualidade retro em células 24 px | Assets do painel |
| `assets/propostas/era-art/graphics-pixels.js`, `manifest.js` | Conversão de pixels compartilhada e metadados locais | Assets carregados pelo painel |
| `jogar/js/arte-epocas.js` | API de desenho, qualidade, iluminação 2D e preferência local | Novo módulo em `panel/` |
| `jogar/js/graficos-evolucao.js`, `assets/propostas/era-art/graphics.css` | UPGRADE GRAPHICS, comparação e transição cosmética | Novo módulo e CSS em `panel/` |
| `jogar/js/arte-v3-loader.js` | Carga aditiva dos módulos acima | Novo módulo em `panel/` |
| `jogar/js/estilo-arcade.js` | Hooks visuais `processClassic`, `processArcadeFrame`, `processRoom`, `processImage`, `drawActorLight` e `refreshArt` | Módulo visual da rodada 2 |
| `jogar/index.html` | Uma inclusão de `arte-v3-loader.js` após `estilo-arcade.js` | Template de HTML do painel |
| `assets/propostas/era-art/galeria.{html,css,js}` | Galeria e abertura fictícia de caixa | Página de revisão dos assets |

## Integração com o módulo de armas

Os IDs são o ponto estável de comunicação. Esta frente não cria inimigos, não controla ataques e não determina loot. O módulo de comportamento pode chamar `drawEnemy`, `drawBoss`, `drawLootbox`, `drawReveal` e `drawEffect`, ou consumir PNG + JSON diretamente. Ataques à esquerda são espelhados pela API; o arquivo PNG continua reproduzível.

Os sprites novos aparecem na galeria e na cena da tela de comparação. A aparição no combate real depende da chamada do módulo de comportamento. Nenhum ator é inserido no simulador por esta proposta.

`Classico / Arcade` continua sendo a escolha de desenho; a qualidade gráfica é uma preferência independente. A preferência gráfica inicial é `original`, que repassa a arte existente. Só a escolha explícita ou uma preferência já salva aplica Atari, 8 bits, 16 bits, Arcade ou HD-2D. Restaurar original mantém o estilo escolhido e restaura seus pixels base.

HD-2D aqui usa somente Canvas 2D: sombra, luz, vinheta, brilho e um desfoque limitado ao fundo superior. Personagens e props ficam nítidos. Não há modelos, perspectiva ou renderizador 3D. Paletas retro têm pixels inteiros e alpha binário; luz composta em runtime tem alpha normal de Canvas.

O botão de upgrade é cosmético na demo e fora dela. Não implementa custo, tokens, rendimento ou compra. As aberturas da galeria não dão recompensas. Qualquer regra econômica futura pertence ao módulo de comportamento.

## Reprodução

```text
node tools/draw-era-enemies.cjs
node tools/draw-era-bosses.cjs
node tools/draw-era-effects.cjs
node tools/draw-graphics-levels.cjs
node tools/build-era-art-manifest.cjs
```

Os PNGs originais do JP continuam preservados.

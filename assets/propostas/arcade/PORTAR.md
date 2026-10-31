# Pacote Arcade para portar à origem do JP

Proposta original de arte pixel, inspirada nas proporções chibi, contraste e leitura em grade de jogos arcade. Nenhum sprite de Bomberman foi copiado. Os PNGs existentes do JP permanecem intactos. Clássico é o padrão; Arcade é uma preferência visual local em Configurações.

## Build reproduzível, sem dependências

Na raiz deste projeto, executar em sequência:

```powershell
node tools/draw-arcade-characters.cjs
node tools/draw-arcade-scenario.cjs
node tools/draw-arcade-items.cjs
node tools/build-arcade-manifest.cjs
```

O helper `tools/arcade-pixels.cjs` escreve PNG RGBA lossless usando apenas fs/path/zlib. Desenho por coordenadas inteiras, sem antialiasing ou dependência de canvas. As três folhas têm células de 24 × 24 px. O manifest é JS local para não depender de fetch/JSON durante a carga.

| Arquivos | Conteúdo | Destino na origem |
| --- | --- | --- |
| `characters.png`, `characters.json`, `PERSONAGENS.md`, `characters-preview.png` | 6 ranks × 20 poses = 120 frames; direções, idle, comemoração e queda | Assets publicados do painel; metadados são o contrato da grade |
| `scenario.png`, `scenario.json`, `CENARIO.md`, `scenario-preview.png` | 32 tiles/props; piso, parede, madeira, cofre, saída, guarda e estrada | Assets publicados do painel |
| `items.png`, `items.json`, `ITENS.md` | 32 frames; loot, selos e efeitos animados | Assets publicados do painel |
| `manifest.js` | Metadados consolidados dos três sheets | Antes do adaptador Arcade |
| `jogar/js/estilo-arcade.js` | Preferência de estilo, desenho de sprites, troca de ícones/retratos, escala e integração com épocas | Módulo próprio em `panel/`, carregado depois de lib/i18n e antes de heist/road/app |
| `jogar/index.html` | Duas inclusões aditivas de script | Template gerado por `tools/build-panel.js` na origem; incluir manifest e adaptador na mesma ordem |
| `galeria.html`, `galeria.css`, `galeria.js` | Comparativo Classic/Arcade, poses, épocas e FX; EN/PT/ES | Galeria de revisão opcional; não exige carteira |
| `tools/arcade-pixels.cjs`, `draw-arcade-*.cjs`, `build-arcade-manifest.cjs` | Fontes reproduzíveis da arte | Ferramentas de arte na origem; os PNGs são o resultado publicado |

Não temos o repositório de origem nesta pasta. Os caminhos internos exatos de `panel/` precisam ser confirmados pelo JP. Portar o adaptador próprio e suas inclusões; não copiar a saída gerada por cima do gerador.

## Limites do adaptador

- Simulação, seed/hash, atributos, grid lógico de 32 px, hitboxes, números e fluxo de carteira continuam os mesmos. Não há novo guarda, bloqueio ou recompensa na simulação.
- O adaptador chama os painters originais sem alterar o retorno; registra metadados em WeakMaps e troca somente o desenho final nos canvases do assalto/estrada. Os retratos e ícones guardam a URL original para restauração.
- O render atual guarda imagens offscreen de 32/34 px. O adaptador reconhece essas imagens antes da montagem do assalto. Se a origem mudar o renderer, revisar esses pontos de conexão; os PNGs e a API de desenho continuam utilizáveis sem o adaptador.
- Sprites de 24 px são centralizados nas células lógicas existentes. Paredes externas ganham conexão visual contínua. No celular, a sala pode rolar dentro do painel para conservar pixels inteiros.
- O renderer usa backing canvas em 1×/2×. Medir escala dos pixels da arte por `CSS width / canvas.width * context.getTransform().a`; a redução do backing 2× para CSS 1× continua com pixels da arte em escala inteira.
- Retratos em 4× no jogo; idle e comemoração limitados à tela visível. Queda fica disponível na sheet/API/galeria e a pose final ilustra o estado já capturado. Preferência de movimento reduzido mantém pose estática. Voltar ao Clássico restaura as imagens.
- A galeria mostra porta, guarda, todos os props e FX novos. O jogo troca os objetos que o renderer já possui. Estados/objetos que não existem na simulação ficam disponíveis como arte, sem inventar mecânica.

## Épocas e Crusade of Duty

Não há alterações em `eras.js`, `crusade.js`, `feel.js` ou em seus controles. O adaptador escuta `outlaws:era-change` já emitido pelo módulo de épocas: medieval usa pedra verde, modern azul, future violeta/ciano com visor chibi. Ouro e cores dos ranks continuam reconhecíveis. A prévia de época não muda o estilo escolhido.

O módulo paralelo pode desenhar a arte pelo objeto público, após `OutlawsArcade.whenReady`:

```js
OutlawsArcade.drawCharacter(ctx, x, y, {
  rank: 0, state: 'walk', direction: 'right', frame: 0, scale: 1
});
OutlawsArcade.drawTile(ctx, 'vault_closed', x, y, 1);
OutlawsArcade.drawItem(ctx, 22, x, y, 1);
OutlawsArcade.getStyle(); // 'classic' ou 'arcade'
OutlawsArcade.getState(); // estilo, época, carga e contadores de render
```

`state`: idle/walk/celebrate/fall. `direction`: down/left/right/up. O scale é inteiro ≥1. Eventos disponíveis: `outlaws:style-change`, `outlaws:arcade-ready`, `outlaws:arcade-era`. A comemoração reutiliza `outlaws:juice` de sucesso/rank/unlock, sem disparar ação do jogo.

Revisar a convivência das camadas de Crusade no build final da origem.

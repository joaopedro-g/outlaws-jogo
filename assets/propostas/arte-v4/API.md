# Sprite API v4, proposta para portar

Provider: `window.OutlawsSpriteV4`, versão `outlaws.sprite-v4.1`. Carregar `manifest.js` e depois `api.js`, ambos desta pasta. Aguardar `OutlawsSpriteV4.whenReady` ou `outlaws:sprite-v4-ready`. O adapter Arcade carrega os dois sem editar o HTML do jogo. Nenhuma função altera ator, vida, RNG, cooldown, loot, recompensa ou simulação. Não há loop ou áudio neste provider.

IDs reais do contrato visual existente: `sword`, `flamesword`, `bow`, `staff`, `ak`, `awp`, `grenade`, `taser`, `laser`, `beam`, `energyblade`, `kamikaze`, `combatdrone`. `canonical(id)` aceita aliases listados no manifesto. Não renomear loadouts do jogo.

| Função | Entrada | Saída |
| --- | --- | --- |
| `getCrewFrame(options)` | `rank:0..5`, `era:medieval/modern/future`, `state:idle/walk/celebrate/fall/attack`, `direction:down/left/right/up`, `frame` | Canvas 24×24 ou null se Classic/asset indisponível |
| `getCrewFrameByIndex(index,{era})` | Índice Arcade existente 0..119 | Canvas 24×24. Remapeia as 20 colunas antigas para as primeiras 20 do atlas novo, que tem 52 colunas por rank |
| `getCrewAnchors(options)` | `x,y` do pé, `direction`, `scale` | Coordenadas de pintura `{foot,hand}`; não altera ator |
| `getHeldFrame(options)` | `weapon`, `frame:0..7`, `motion` | Canvas 48×48. Mão em `[14,32]` |
| `getAttackFrame(options)` | `weapon`, `variant`, `frame:0..7` **ou** `elapsedMs`, `motion`, `effects` | Canvas 80×64. Pé do ator em `[20,56]`, mão em `[28,44]` |
| `drawCrew(ctx,options)` | Opções da quadrilha + `x,y` do **pé**, `scale` inteiro | boolean; true se pintou |
| `drawHeld(ctx,options)` | Opções de held + `x,y` da **mão**, `direction`, `scale` inteiro | boolean; true se pintou |
| `drawAttack(ctx,options)` | Opções de ataque + `x,y` do **pé**, `direction`, `scale` inteiro; ou `anchor:'hand'` com `x,y` da mão | boolean; true se pintou; orienta a arma ao redor da mão |
| `phaseAt(weapon,elapsedMs)` | Tempo visual fornecido pelo chamador | Quadro 0..7, nunca avanço de combate |
| `getState()` | nenhuma | disponibilidade, época, IDs e contadores somente de pintura |

As seis identidades mantêm rosto, pele, cor e assinatura entre roupas. O look Classic do JP usa o renderer original: `getCrewFrame({style:'classic'})` retorna null para fallback explícito. As armas são novas propostas originais; o consumidor escolhe onde usá-las.

Atlas da quadrilha: 52×18 células de 24px, 936 quadros. Colunas 0..19 compatíveis com Arcade anterior; ataque à direita 20..27, baixo 28..35, esquerda 36..43, cima 44..51. Cada roupa mantém os seis ranks e suas assinaturas. A mão de ataque já faz parte do corpo; não pintar uma segunda arma ou uma segunda mão por cima.

Ataques são desenhados voltados à direita. `drawAttack/drawHeld` espelham para esquerda ou rotacionam em quartos de volta para cima/baixo, sem antialiasing. Se o contexto já estiver orientado pelo renderer das armas, omitir `direction` para não orientar duas vezes. `scale` aceita inteiros 1..4. Renderizar perto do pé/mão real, não no centro de um overlay fixo.

Bow: `normal`, `explosive`, `fire`, `triple`, `lightning`. Staff: `fire`, `lightning`, `ice`, `heal`, `frog`. Armas restantes: `normal`. Variantes desconhecidas caem na primeira variante existente daquele ID; ID desconhecido retorna null/false. Não há substituição por arma de outra família.

Quadros: **ready → anticipate → strike → impact → follow-through → settle → recover → rest**. `manifest.attacks.timings` registra duração da **prévia de arte**, não cooldown ou tempo de dano. A cena/luta controla quando começa e quando conclui, podendo passar quadro explícito. Não usar isso para calcular resultado, dano, chance, tempo on-chain ou recompensa.

Motion off do produto, `motion:false` ou reduced-motion usam quadro estático zero e sheet básica no ataque. `effects:false` ou Special effects off usa `attacks-basic.png`: silhueta, lâmina, fogo próprio da espada e projéteis continuam legíveis; rastro, partículas, explosão e clarão são removidos. Nenhum som é emitido, portanto mudo permanece com o módulo de SONS.

```js
await OutlawsSpriteV4.whenReady;
// Render coordinates only. The combat owner supplies event time and direction.
OutlawsSpriteV4.drawHeld(ctx, {weapon:'flamesword', x:handX, y:handY, frame:idleFrame});
OutlawsSpriteV4.drawAttack(ctx, {
  weapon:'flamesword', x:footX, y:footY, direction:'right', frame:attackFrame,
  motion:motionEnabled, effects:specialEffectsEnabled
});
```

Os módulos de armas e de luta (`equipped-weapons.js`, `epoch-weapons.js`, `enemy-stage.js`, `boss-demo.js`) usam estas funções na demo. Fallback deve continuar limpo se `ready=false` ou `draw...` retornar false.

Reprodução: `node assets/propostas/arte-v4/draw.mjs`. Usa somente Node nativo e `tools/arcade-pixels.cjs` já existente. Galeria `galeria.html` mostra ataques inteiros em 1× e 4×, held na mão e as mesmas identidades nas três épocas. É prévia de arte; não prova o funcionamento da luta integrada, boss ou loot.

## Cenário inteiro

O mesmo provider inclui `world.png`, 72 células de 32×32px: 24 por época. Não é uma camada de adesivos. O adapter chama `drawRoom` no canvas offscreen da sala e `drawRoad` na estrada, sem alterar a grade, coordenadas ou resultado do motor. A chegada é uma porta/airlock na mesma escala. A cena das armas deve usar este cenário e retirar sua antiga decoração flutuante de planeta/disco. Não desenhar planeta ou nave no chão: já aparecem dentro de `window`.

| Função | Contrato |
| --- | --- |
| `getWorldTile(name,{era})` | Canvas 32×32; null antes de ready ou nome desconhecido |
| `drawWorldTile(ctx,{name,era,x,y,scale})` | x/y são canto superior esquerdo; escala inteira 1..4; boolean |
| `drawRoom(ctx,{room:{w,h,grid},era,x:0,y:0})` | Pinta todas as células em 32px. Lê apenas `#` para paredes; não modifica grid/room e não inventa loot ou saída |
| `drawRoad(ctx,{era,x,y,width:148,height:48})` | Pinta todo o retângulo da estrada com piso/trilha da época, recortado ao tamanho recebido |

Nomes: `floor_a/b/c`, `wall_center`, `wall_edge`, `window`, `door_closed/open`, `crate`, `barrel`, `chest_closed/open`, `vault_closed/open`, `lamp`, `road_center/edge`, `castle` (alias visual da entrada), `hay`, `terminal`, `grille`, `light_strip`, `arrival`, `stairs`. Os significados de objetos e posições continuam pertencendo ao chamador.

Medieval usa pedra, madeira e ouro; moderno usa mármore, grades, gaveteiros e aço; futuro usa painéis metálicos, janelas para o espaço e luz teal contida. Contorno `#141c2c`, luz superior esquerda e sombra com o mesmo peso em todas as épocas e na quadrilha. `rooms-contact.png` mostra a mesma sala nas três épocas lado a lado. Os sprites de inimigos/bosses da R3 continuam sob seus providers existentes; esta entrega não redesenha nem toma posse deles.

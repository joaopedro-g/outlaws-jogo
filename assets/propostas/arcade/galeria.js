(function(root){'use strict';const doc=root.document,api=root.OutlawsArcade,P=root.OutlawsArcadePack;
 const names=['Common','Uncommon','Rare','Epic','Legendary','Mythic'],colors=['#b6c5dd','#70d85b','#4ca9eb','#af79ef','#ffad48','#ff65a2'];
 const notes=['Scarf & satchel','Green hood & dagger','Blue hood & bow','Violet hood & feather','Amber hood & vault key','Ruby hood & royal cloak'];
 const classicSprites=[];
 const classicReady=Promise.all(names.map((name,index)=>new Promise((resolve,reject)=>{const image=new root.Image();image.onload=()=>{classicSprites[index]=image;resolve();};image.onerror=()=>reject(new Error('Classic portrait did not load: rank-'+index));image.src='../../rank-'+index+'.png';})));
 const classicItemNames=['coin','sack','gem','hammer'],classicItemImages=[];
 const classicItemsReady=Promise.all(classicItemNames.map((name,index)=>new Promise((resolve,reject)=>{const image=new root.Image();image.onload=()=>{classicItemImages[index]=image;resolve();};image.onerror=()=>reject(new Error('Classic item did not load: '+name));image.src='../../icon-'+name+'.png';})));
 const copy={en:{title:'Small outlaws. Big trouble.',lede:'Get in. Grab the vault. Get out. Original chibi pixel art for the OUTLAWS crew.',animation:'Animation',era:'Era',motion:'Motion',crew:'Six ranks. Six silhouettes.',native:'1× pixels plus an integer 4× preview',room:'Same job. New arcade world.',roomNote:'Pixel grid, anchored props and a clear golden objective.',classic:'Classic',road:'The getaway road',items:'Loot, ranks and effects.',sheets:'Fixed 24 px cells. Binary transparency. No blur.',footer:'Art proposal. Classic remains the default in the game.',demo:'Open game demo'},pt:{title:'Bandidos pequenos. Confusão grande.',lede:'Entre. Pegue o cofre. Fuja. Arte pixel chibi original para o bando OUTLAWS.',animation:'Animação',era:'Época',motion:'Movimento',crew:'Seis ranks. Seis silhuetas.',native:'Pixels em 1× e prévia em escala inteira de 4×',room:'O mesmo golpe. Um novo mundo arcade.',roomNote:'Grade pixel, objetos apoiados e um objetivo dourado claro.',classic:'Clássico',road:'A estrada da fuga',items:'Espólio, ranks e efeitos.',sheets:'Células fixas de 24 px. Transparência binária. Sem borrão.',footer:'Proposta de arte. Clássico continua como padrão no jogo.',demo:'Abrir a demo do jogo'},es:{title:'Bandidos pequeños. Grandes problemas.',lede:'Entra. Toma la bóveda. Escapa. Arte chibi pixel original para OUTLAWS.',animation:'Animación',era:'Época',motion:'Movimiento',crew:'Seis rangos. Seis siluetas.',native:'Píxeles 1× y vista previa en escala entera 4×',room:'El mismo golpe. Un nuevo mundo arcade.',roomNote:'Cuadrícula pixel, objetos apoyados y un objetivo dorado claro.',classic:'Clásico',road:'El camino de escape',items:'Botín, rangos y efectos.',sheets:'Celdas fijas de 24 px. Transparencia binaria. Sin desenfoque.',footer:'Propuesta de arte. Clásico sigue siendo el estilo por defecto.',demo:'Abrir demo del juego'}};
 let language='en',last=0;const media=matchMedia('(prefers-reduced-motion: reduce)');
 Object.assign(copy.en,{eyebrow:'THE VAULT JOB',native:'Native pixels plus an integer-scale preview',poseIdle:'Idle',poseDown:'Walk down',poseLeft:'Walk left',poseRight:'Walk right',poseUp:'Walk up',poseCelebrate:'Celebrate',poseFall:'Fall',eraMedieval:'Medieval',eraModern:'Modern',eraFuture:'Future'});
 Object.assign(copy.pt,{eyebrow:'O GOLPE DO COFRE',native:'Pixels nativos e prévia em escala inteira',poseIdle:'Parado',poseDown:'Andar para baixo',poseLeft:'Andar para a esquerda',poseRight:'Andar para a direita',poseUp:'Andar para cima',poseCelebrate:'Comemorar',poseFall:'Cair',eraMedieval:'Medieval',eraModern:'Moderna',eraFuture:'Futuro'});
 Object.assign(copy.es,{eyebrow:'EL GOLPE A LA BÓVEDA',native:'Píxeles nativos y vista previa en escala entera',poseIdle:'En reposo',poseDown:'Caminar hacia abajo',poseLeft:'Caminar a la izquierda',poseRight:'Caminar a la derecha',poseUp:'Caminar hacia arriba',poseCelebrate:'Celebrar',poseFall:'Caer',eraMedieval:'Medieval',eraModern:'Moderna',eraFuture:'Futuro'});
 Object.assign(copy.en,{native:'Native pixels: Classic 32 px · Arcade 24 px',fxNote:'Dust, vault sparks and a crate impact play in short cycles, with pauses.'});
 Object.assign(copy.pt,{native:'Pixels nativos: Clássico 32 px · Arcade 24 px',fxNote:'Poeira, faíscas no cofre e impacto no caixote em ciclos curtos, com pausas.'});
 Object.assign(copy.es,{native:'Píxeles nativos: Clásico 32 px · Arcade 24 px',fxNote:'Polvo, chispas en la bóveda e impacto en la caja en ciclos cortos, con pausas.'});
 Object.assign(copy.en,{arcade:'Arcade',itemCoin:'Coin',itemSack:'Sack',itemGem:'Gem',itemHammer:'Hammer'});
 Object.assign(copy.pt,{arcade:'Arcade',itemCoin:'Moeda',itemSack:'Saco',itemGem:'Gema',itemHammer:'Martelo'});
 Object.assign(copy.es,{arcade:'Arcade',itemCoin:'Moneda',itemSack:'Saco',itemGem:'Gema',itemHammer:'Martillo'});
 copy.fil={eyebrow:'ANG HEIST SA VAULT',title:'Maliit na bandido. Malaking gulo.',lede:'Pumasok. Kunin ang vault. Tumakas. Orihinal na chibi pixel art para sa gang ng OUTLAWS.',animation:'Animasyon',era:'Panahon',motion:'Galaw',crew:'Anim na rank. Anim na silweta.',native:'Likas na pixels: Classic 32 px · Arcade 24 px',room:'Parehong heist. Bagong arcade world.',roomNote:'Pixel grid, nakapirming props at malinaw na gintong layunin.',classic:'Classic',arcade:'Arcade',road:'Daan ng pagtakas',items:'Samsam, rank at effects.',sheets:'Nakapirming 24 px cells. Binary transparency. Walang blur.',footer:'Panukalang art. Classic pa rin ang default sa laro.',demo:'Buksan ang game demo',fxNote:'Maikling ikot ng alikabok, spark sa vault at tama sa kahon, na may pahinga.',itemCoin:'Barya',itemSack:'Sako',itemGem:'Hiyas',itemHammer:'Martilyo',poseIdle:'Nakatigil',poseDown:'Lumakad pababa',poseLeft:'Lumakad pakaliwa',poseRight:'Lumakad pakanan',poseUp:'Lumakad pataas',poseCelebrate:'Magdiwang',poseFall:'Bumagsak',eraMedieval:'Medieval',eraModern:'Moderno',eraFuture:'Hinaharap'};
 const rankCopy={en:{names,notes},pt:{names:['Comum','Incomum','Raro','Épico','Lendário','Mítico'],notes:['Lenço e bolsa','Capuz verde e adaga','Capuz azul e arco','Capuz violeta e pena','Capuz âmbar e chave do cofre','Capuz rubi e capa real']},es:{names:['Común','Poco común','Raro','Épico','Legendario','Mítico'],notes:['Bufanda y bolso','Capucha verde y daga','Capucha azul y arco','Capucha violeta y pluma','Capucha ámbar y llave de bóveda','Capucha rubí y capa real']}};
 rankCopy.fil={names:['Karaniwan','Di-karaniwan','Bihira','Epiko','Alamat','Mitiko'],notes:['Panyo at bag','Berdeng hood at punyal','Asul na hood at pana','Lilang hood at balahibo','Amber na hood at susi ng vault','Rubing hood at maharlikang kapa']};
 const descriptions={
  en:{portrait:'Hooded outlaw',seal:'Rank seal',native:'Native-size preview',large:'Enlarged preview',still:'Static portrait',scene:'Top-down heist room: walls, crates, golden vault, guard and exit.',road:'Getaway road: grass, trees, castle and a hooded outlaw.',item:'Pixel loot or effect',nav:'Language'},
  pt:{portrait:'Bandido encapuzado',seal:'Selo de raridade',native:'Prévia em tamanho nativo',large:'Prévia ampliada',still:'Retrato parado',scene:'Sala do assalto vista de cima: paredes, caixotes, cofre dourado, guarda e saída.',road:'Estrada da fuga: grama, árvores, castelo e um bandido encapuzado.',item:'Espólio ou efeito em pixel',nav:'Idioma'},
  es:{portrait:'Bandido encapuchado',seal:'Sello de rareza',native:'Vista en tamaño nativo',large:'Vista ampliada',still:'Retrato estático',scene:'Sala del atraco desde arriba: paredes, cajas, bóveda dorada, guardia y salida.',road:'Camino de escape: hierba, árboles, castillo y un bandido encapuchado.',item:'Botín o efecto pixel',nav:'Idioma'},
  fil:{portrait:'Bandidong naka-hood',seal:'Selyo ng rarity',native:'Preview sa likas na laki',large:'Pinalaking preview',still:'Nakatigil na portrait',scene:'Silid ng heist mula sa itaas: pader, kahon, gintong vault, bantay at labasan.',road:'Daan ng pagtakas: damo, puno, kastilyo at bandidong naka-hood.',item:'Pixel na samsam o effect',nav:'Wika'}
 };
 const classicScenes={en:'Top-down room: walls, crates, chest and golden vault.',pt:'Sala vista de cima: paredes, caixotes, baú e cofre dourado.',es:'Sala desde arriba: paredes, cajas, cofre y bóveda dorada.',fil:'Silid mula sa itaas: pader, kahon, kaban at gintong vault.'};
 function describe(node,label){node.setAttribute('role','img');node.setAttribute('aria-label',label);node.removeAttribute('aria-hidden');if(node.tagName==='CANVAS'&&node.textContent!==label)node.textContent=label;}
 function accessibleArt(){const t=copy[language],d=descriptions[language],r=rankCopy[language],pose=doc.querySelector('#animation option:checked')?.textContent||t.poseIdle,era=doc.querySelector('#era option:checked')?.textContent||t.eraMedieval;
  doc.querySelector('header nav')?.setAttribute('aria-label',d.nav);
  for(const c of doc.querySelectorAll('canvas[data-rank]')){const i=+c.dataset.rank;describe(c,[t.arcade,d.portrait,r.names[i],r.notes[i],pose,era,c.closest('.native-row')?d.native:d.large].join('. '));}
  for(const c of doc.querySelectorAll('[data-classic-rank]')){const i=+c.dataset.classicRank;describe(c,[t.classic,c.tagName==='svg'||c.tagName==='SVG'?d.seal:d.portrait,r.names[i],c.tagName==='CANVAS'?d.still:'',c.classList.contains('classic-native')?d.native:''].filter(Boolean).join('. '));}
  // Human item names are supplied by the SONS-owned label adapter's public contract.
  for(const c of doc.querySelectorAll('canvas[data-item]')){const name=P.items.frames[+c.dataset.item].name;describe(c,t.arcade+'. '+(root.OutlawsGalleryLabels?.labelFor(name,language)||d.item));}
  for(const c of doc.querySelectorAll('canvas[data-classic-item]'))describe(c,t.classic+'. '+t[['itemCoin','itemSack','itemGem','itemHammer'][+c.dataset.classicItem]]);
  for(const [id,label]of [['classic-room',t.classic+'. '+classicScenes[language]],['arcade-room',t.arcade+'. '+era+'. '+d.scene],['arcade-road',t.arcade+'. '+era+'. '+d.road]]){const c=doc.getElementById(id);if(c)describe(c,label);}
 }
 function translate(lang){language=copy[lang]?lang:'en';doc.documentElement.lang=language;for(const e of doc.querySelectorAll('[data-word]')){const word=copy[language][e.dataset.word];if(word!==undefined)e.textContent=word;}for(const e of doc.querySelectorAll('[data-rank-name]'))e.textContent=rankCopy[language].names[+e.dataset.rankName];for(const e of doc.querySelectorAll('[data-rank-note]'))e.textContent=rankCopy[language].notes[+e.dataset.rankNote];for(const b of doc.querySelectorAll('[data-lang]'))b.setAttribute('aria-pressed',String(b.dataset.lang===language));root.OutlawsGalleryLabels?.refresh(language);accessibleArt();}
 doc.addEventListener('click',e=>{const b=e.target.closest('[data-lang]');if(b)translate(b.dataset.lang);});
 function build(){
  for(let i=0;i<6;i++){const a=doc.createElement('article');a.style.setProperty('--rank',colors[i]);a.innerHTML=`<div class="rank-name" data-rank-name="${i}">${names[i]}</div><div class="rank-note" data-rank-note="${i}">${notes[i]}</div><div class="portraits"><canvas class="classic-portrait" width="32" height="32" data-classic-rank="${i}" role="img"></canvas><canvas class="arcade-portrait" width="24" height="24" data-rank="${i}"></canvas></div><div class="sprite-labels"><span data-word="classic">Classic</span><span>Arcade</span></div><div class="native-row"><span>1×</span><canvas class="classic-native" width="32" height="32" data-classic-rank="${i}" role="img"></canvas><canvas width="24" height="24" data-rank="${i}"></canvas></div>`;doc.getElementById('crew').append(a);}
  for(const index of [0,4,5,6,7,8,9,10,11,12,13,14,18,22,28,30]){const a=doc.createElement('article');a.innerHTML=`<canvas width="24" height="24" data-item="${index}"></canvas><span>${P.items.frames[index].name.replaceAll('_',' ')}</span>`;doc.getElementById('items').append(a);}
  const itemKeys=['itemCoin','itemSack','itemGem','itemHammer'];
  for(let i=0;i<4;i++){const a=doc.createElement('article');a.innerHTML=`<canvas width="24" height="24" data-classic-item="${i}" aria-hidden="true"></canvas><span data-word="${itemKeys[i]}">${copy.en[itemKeys[i]]}</span>`;doc.getElementById('classic-items').append(a);}
  for(let i=0;i<6;i++){const a=doc.createElement('article');a.innerHTML=`<svg class="classic-seal" viewBox="0 0 24 24" width="24" height="24" data-classic-rank="${i}" role="img"><use href="../personagens/rank-seals.svg#rank-${i}"></use></svg><span data-rank-name="${i}">${names[i]}</span>`;doc.getElementById('classic-items').append(a);}
  for(const c of doc.querySelectorAll('canvas[data-classic-item]')){const x=c.getContext('2d'),image=classicItemImages[+c.dataset.classicItem];x.imageSmoothingEnabled=false;x.drawImage(image,0,0,image.naturalWidth,image.naturalHeight,0,0,24,24);}
  for(const c of doc.querySelectorAll('canvas[data-classic-rank]')){const x=c.getContext('2d'),image=classicSprites[+c.dataset.classicRank];x.imageSmoothingEnabled=false;x.drawImage(image,0,0,image.naturalWidth,image.naturalHeight,0,0,32,32);}
  translate(language);classicRoom();draw(0);requestAnimationFrame(loop);
 }
 function classicRoom(){
  const c=doc.getElementById('classic-room'),x=c.getContext('2d'),L=root.OutlawsLib;
  const seed='0x'+'a1'.repeat(32),m=L.map.generate(seed,1,13,9),cell=L.map.HD;
  // These are only composition coordinates in this isolated art preview.
  const props=[['o',3,2],['o',7,2],['$',5,5],['gold',9,2]];
  for(const [kind,col,row]of props)m.grid[row][col]=kind==='gold'?'.':kind;
  const room=L.map.paintRoom(m),stage=doc.createElement('canvas');
  stage.width=room.w;stage.height=room.h;
  const paint=stage.getContext('2d');paint.imageSmoothingEnabled=false;
  paint.putImageData(new ImageData(new Uint8ClampedArray(room.px),room.w,room.h),0,0);
  function drawProp(kind,col,row){const prop=L.map.paintProp(kind,m.terrain,seed),tile=doc.createElement('canvas');tile.width=prop.w;tile.height=prop.h;tile.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(prop.px),prop.w,prop.h),0,0);paint.drawImage(tile,col*cell,row*cell);}
  for(let row=0;row<m.h;row++)for(let col=0;col<m.w;col++)if(m.grid[row][col]==='o'||m.grid[row][col]==='$')drawProp(m.grid[row][col],col,row);
  drawProp('gold',9,2);
  // Source and destination sizes are identical: original pixels, no resampling.
  const sx=Math.floor((stage.width-c.width)/2),sy=Math.floor((stage.height-c.height)/2);
  x.imageSmoothingEnabled=false;x.clearRect(0,0,c.width,c.height);
  x.drawImage(stage,sx,sy,c.width,c.height,0,0,c.width,c.height);
  c.dataset.pixelScale='1';c.dataset.sourceCrop=sx+','+sy+','+c.width+','+c.height;
 }
 function arena(now){
  const c=doc.getElementById('arcade-room'),x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);
  for(let y=0;y<9;y++)for(let col=0;col<13;col++){const wall=y===0||y===8||col===0||col===12||(col%2===0&&y%2===0);api.drawTile(x,wall?'wall_center':'floor_a',col*24,y*24);}
  for(const [name,col,y]of [['crate',3,2],['crate_damage_1',7,2],['barrel',9,5],['hay',3,6],['chest_closed',5,5],['vault_closed',9,2],['exit_open',12,6],['guard_front',10,6]])api.drawTile(x,name,col*24,y*24);
  // Gallery-only FX: fixed showcase positions, short bursts separated by quiet time.
  // now=0 under reduced motion or the Motion switch keeps all transient FX hidden.
  const phase=now%3000;
  if(now>0&&phase<320)api.drawItem(x,14+Math.floor(phase/80),60,80);
  api.drawCharacter(x,72,72,{rank:4,state:'walk',direction:'right',frame:Math.floor(now/140)});
  api.drawCharacter(x,168,120,{rank:5,state:'idle',frame:Math.floor(now/500)});
  if(now>0&&phase>=800&&phase<1240)api.drawItem(x,18+Math.floor((phase-800)/110),214,47);
  if(now>0&&phase>=1600&&phase<2260)api.drawItem(x,22+Math.floor((phase-1600)/110),168,48);
  api.drawItem(x,0,216,144);
 }
 function draw(now){const state=doc.getElementById('animation').value;for(const c of doc.querySelectorAll('[data-rank]')){const x=c.getContext('2d');x.clearRect(0,0,24,24);api.drawCharacter(x,0,0,{rank:+c.dataset.rank,state:['idle','celebrate','fall'].includes(state)?state:'walk',direction:state,frame:Math.floor(now/(state==='idle'?500:160))});}for(const c of doc.querySelectorAll('[data-item]')){const x=c.getContext('2d');x.clearRect(0,0,24,24);let index=+c.dataset.item;if(index===0)index+=Math.floor(now/160)%4;if(index===14)index+=Math.floor(now/120)%4;if(index===18)index+=Math.floor(now/110)%4;if(index===22)index+=Math.floor(now/110)%6;api.drawItem(x,index,0,0);}arena(now);const road=doc.getElementById('arcade-road'),r=road.getContext('2d');r.clearRect(0,0,312,48);r.fillStyle='#254753';r.fillRect(0,0,312,48);for(let i=0;i<13;i++){api.drawTile(r,'grass',i*24,0);api.drawTile(r,'road_center',i*24,24);if(i%3===0)api.drawTile(r,'tree',i*24,0);}api.drawTile(r,'castle',288,0);api.drawCharacter(r,48+Math.floor(now/200)%120,17,{rank:1,state:'walk',direction:'right',frame:Math.floor(now/160)});}
 function loop(now){if(!doc.hidden&&now-last>60){last=now;draw(!doc.getElementById('motion').checked||media.matches?0:now);}requestAnimationFrame(loop);}
 doc.getElementById('animation').addEventListener('change',()=>{draw(0);accessibleArt();});doc.getElementById('era').addEventListener('change',e=>{root.dispatchEvent(new CustomEvent('outlaws:era-change',{detail:{era:e.target.value}}));accessibleArt();});
 Promise.all([api.whenReady,classicReady,classicItemsReady]).then(build).catch(error=>root.console.error(error));translate('en');
})(window);

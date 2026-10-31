/* Presentation + disposable training only. Does not write native game state. */
(function(root){
 'use strict';
 const doc=root.document;if(!new URLSearchParams(root.location.search).has('demo')||root.OutlawsLoopV5)return;
 const MODEL=root.OutlawsLoopV5Model,map=doc.getElementById('heist-map');if(!MODEL||!map)return;
 const base=new URL('../../assets/propostas/cenarios-v5/',doc.currentScript.src);
 const strings={
  en:{title:'Watch your crew grow',train:'TRAINING BOUNTY · no value · 15 min run',start:'Start a new practice run',stop:'End practice and discard',bag:'Training bag',next:'Next role upgrade',kills:'Guards defeated',boss:'A boss challenges the crew',bet:'Bet 400 training BOUNTY · 40% box chance',decline:'Decline and keep grinding',box:'Open the boss box',food:'Food: 30 BOUNTY · restore 50 energy',repair:'Repair',enchant:'Enchant',affix:'Reroll accessory buff: 40 BOUNTY',energy:'Energy',gear:'Crew and equipment',rules:'Practice rules',chaos:'Time rifts after 5 to 10 min',roles:['Breacher','Sharpshooter','Channeler','Saboteur'],rarities:['Common','Uncommon','Rare','Epic','Legendary','Mythic'],eras:['Crown lands','Bank district','Orbital district'],slots:['Weapon','Armor','Accessory'],level:'Level',dur:'Durability',range:['Close range','Long range'],ended:'Practice ended. Bag and collection discarded.',coin:'Training BOUNTY',buff:'Temporary buff',weapon:'New equipment',special:'Special skill ready',aoe:'Area skill ready',upgrade:'Role skill upgraded',rift:'Time rift queued for a safe moment',route:'New route queued',win:'Boss defeated. Your box is ready.',loss:'Boss survived. 400 training BOUNTY spent.',empty:'Not enough training BOUNTY.',collection:'Boss collection',cool:'Cooldown',tip:'One drop per guard. Boxes only from bosses. No wallet, reward or transfer.',condition:'Repair restores durability. Enchant guarantees one level, up to 5. Buff reroll replaces one accessory effect.',waiting:'Loading the approved scenery',paused:'Practice paused',continue:'Continue practice',applied:'Practice updated',minute:'Time left',source:'Loop V5 · disposable practice',scenarios:['Guard castle','Barred dungeon','Barrel cave','Village market','Beach harbor','Forest trail','Desert road','City center','Escape alley','Smuggler shore','Cargo train','Bank vault','Cyber city','Underground city','Neon alley','Cargo station','Circuit factory','Steel rooftops']},
  pt:{title:'Veja seu bando evoluir',train:'BOUNTY DE TREINO · sem valor · corrida de 15 min',start:'Iniciar outro treino',stop:'Encerrar e descartar treino',bag:'Bolsa de treino',next:'Próximo upgrade de função',kills:'Guardas derrotados',boss:'Um boss desafia o bando',bet:'Apostar 400 BOUNTY de treino · 40% de chance de caixa',decline:'Recusar e continuar o grind',box:'Abrir caixa do boss',food:'Comida: 30 BOUNTY · recupera 50 de energia',repair:'Reparar',enchant:'Encantar',affix:'Sortear buff do acessório: 40 BOUNTY',energy:'Energia',gear:'Bando e equipamento',rules:'Regras do treino',chaos:'Fendas do tempo após 5 a 10 min',roles:['Arrombador','Atirador','Condutor','Sabotador'],rarities:['Comum','Incomum','Raro','Épico','Lendário','Mítico'],eras:['Terras da coroa','Distrito do banco','Distrito orbital'],slots:['Arma','Armadura','Acessório'],level:'Nível',dur:'Durabilidade',range:['De perto','De longe'],ended:'Treino encerrado. Bolsa e coleção descartadas.',coin:'BOUNTY de treino',buff:'Buff temporário',weapon:'Novo equipamento',special:'Skill especial pronta',aoe:'Skill em área pronta',upgrade:'Skill da função melhorada',rift:'Fenda guardada para um instante seguro',route:'Nova rota guardada',win:'Boss derrotado. Sua caixa está pronta.',loss:'Boss resistiu. 400 BOUNTY de treino gastos.',empty:'Falta BOUNTY de treino.',collection:'Coleção do boss',cool:'Recarga',tip:'Um drop por guarda. Caixas só de bosses. Sem carteira, prêmio ou transferência.',condition:'Reparo restaura durabilidade. Encantar garante um nível até 5. Novo buff substitui um efeito do acessório.',waiting:'Carregando o cenário aprovado',paused:'Treino pausado',continue:'Continuar treino',applied:'Treino atualizado',minute:'Tempo restante',source:'Loop V5 · treino descartável',scenarios:['Castelo da guarda','Masmorra das grades','Caverna dos barris','Mercado da vila','Porto da praia','Trilha da mata','Estrada do deserto','Centro da cidade','Beco da fuga','Orla do contrabando','Trem de carga','Cofre do banco','Cidade cyberpunk','Cidade subterrânea','Beco neon','Estação de carga','Fábrica de circuitos','Telhados de aço']},
  es:{title:'Mira crecer a tu banda',train:'BOUNTY DE PRÁCTICA · sin valor · partida de 15 min',start:'Iniciar otra práctica',stop:'Terminar y descartar',bag:'Bolsa de práctica',next:'Próxima mejora de función',kills:'Guardias derrotados',boss:'Un jefe desafía a la banda',bet:'Apostar 400 BOUNTY de práctica · 40% de caja',decline:'Rechazar y seguir luchando',box:'Abrir caja del jefe',food:'Comida: 30 BOUNTY · recupera 50 de energía',repair:'Reparar',enchant:'Encantar',affix:'Sortear efecto del accesorio: 40 BOUNTY',energy:'Energía',gear:'Banda y equipo',rules:'Reglas de práctica',chaos:'Grietas temporales tras 5 a 10 min',roles:['Asaltante','Tirador','Canalizador','Saboteador'],rarities:['Común','Inusual','Raro','Épico','Legendario','Mítico'],eras:['Tierras de la corona','Distrito bancario','Distrito orbital'],slots:['Arma','Armadura','Accesorio'],level:'Nivel',dur:'Durabilidad',range:['De cerca','De lejos'],ended:'Práctica terminada. Bolsa y colección descartadas.',coin:'BOUNTY de práctica',buff:'Efecto temporal',weapon:'Equipo nuevo',special:'Habilidad especial lista',aoe:'Habilidad de área lista',upgrade:'Habilidad de función mejorada',rift:'Grieta pendiente de un momento seguro',route:'Nueva ruta pendiente',win:'Jefe derrotado. Tu caja está lista.',loss:'El jefe resistió. 400 BOUNTY de práctica gastados.',empty:'Falta BOUNTY de práctica.',collection:'Colección del jefe',cool:'Recarga',tip:'Un drop por guardia. Cajas solo de jefes. Sin cartera, premio ni transferencia.',condition:'Reparar restaura durabilidad. Encantar garantiza un nivel hasta 5. Cambiar efecto sustituye uno del accesorio.',waiting:'Cargando el escenario aprobado',paused:'Práctica pausada',continue:'Continuar práctica',applied:'Práctica actualizada',minute:'Tiempo restante',source:'Loop V5 · práctica desechable',scenarios:['Castillo de guardia','Mazmorra de rejas','Cueva de barriles','Mercado de aldea','Puerto de playa','Sendero del bosque','Carretera del desierto','Centro urbano','Callejón de fuga','Costa del contrabando','Tren de carga','Bóveda bancaria','Ciudad ciber','Ciudad subterránea','Callejón neón','Estación de carga','Fábrica de circuitos','Azoteas de acero']},
  fil:{title:'Panoorin ang paglakas ng gang',train:'TRAINING BOUNTY · walang halaga · burado pagkaraan ng 15 min',start:'Magsimula ng bagong ensayo',stop:'Tapusin at burahin ang ensayo',bag:'Training bag',next:'Susunod na role upgrade',kills:'Natalong bantay',boss:'Hinahamon ng boss ang gang',bet:'Tumaya ng 400 training BOUNTY · 40% tsansa ng kahon',decline:'Tumanggi at magpatuloy',box:'Buksan ang kahon ng boss',food:'Pagkain 30 · ibalik 50 energy',repair:'Ayusin',enchant:'Palakasin',affix:'Bagong accessory buff 40',energy:'Energy',gear:'Gang at kagamitan',rules:'Mga tuntunin ng ensayo',chaos:'Time rift pagkaraan ng 5 hanggang 10 min',roles:['Pambukas','Tagabaril','Tagadaloy','Saboteur'],rarities:['Common','Uncommon','Rare','Epic','Legendary','Mythic'],eras:['Lupain ng korona','Bank district','Orbital district'],slots:['Armas','Armor','Accessory'],level:'Antas',dur:'Tibay',range:['Malapitan','Malayo'],ended:'Tapos ang ensayo. Burado ang bag at koleksiyon.',coin:'Training BOUNTY',buff:'Pansamantalang buff',weapon:'Bagong kagamitan',special:'Handa ang special skill',aoe:'Handa ang area skill',upgrade:'Lumakas ang role skill',rift:'Nakahanda ang rift sa ligtas na sandali',route:'Nakahanda ang bagong ruta',win:'Natalo ang boss. Handa ang kahon.',loss:'Nakaligtas ang boss. Nagastos ang 400 training BOUNTY.',empty:'Kulang ang training BOUNTY.',collection:'Koleksiyon ng boss',cool:'Cooldown',tip:'Isang drop bawat bantay. Kahon mula sa boss lang. Walang wallet, premyo o transfer.',condition:'Ibinabalik ng repair ang tibay. Isang antas ang enchant hanggang 5. Pinapalitan ang isang accessory buff.',waiting:'Nilo-load ang aprubadong lugar',paused:'Naka-pause ang ensayo',continue:'Ituloy ang ensayo',applied:'Na-update ang ensayo',minute:'Natitirang oras',source:'Loop V5 · pansamantalang ensayo',scenarios:['Kastilyo ng bantay','Piitan ng rehas','Kuweba ng bariles','Pamilihan ng nayon','Daungan sa dalampasigan','Daan sa gubat','Daan sa disyerto','Sentro ng lungsod','Eskinitang takasan','Baybay ng kontrabando','Tren ng kargamento','Vault ng bangko','Cyber city','Lungsod sa ilalim','Neon alley','Cargo station','Circuit factory','Steel rooftops']}
 };
 const extra={en:{combo:'Four roles: faster teamwork',skills:['Brace','Deadeye','Quick hands','Blast'],classes:['Gatebreaker','Farshot','Sparkhand','Powderrunner'],pause:'Pause practice',enchantTo:'raise to level',maxLevel:'Maximum level',function:'Role',reserve:'Reserve equipment, latest 24'},pt:{combo:'Quatro funções: equipe mais rápida',skills:['Proteção','Mira firme','Mãos rápidas','Explosão'],classes:['Quebra-portões','Tiro-longo','Mão-faísca','Corre-pólvora'],pause:'Pausar treino',enchantTo:'sobe para o nível',maxLevel:'Nível máximo',function:'Função',reserve:'Equipamento reserva, últimos 24'},es:{combo:'Cuatro funciones: equipo más rápido',skills:['Protección','Puntería','Manos rápidas','Explosión'],classes:['Rompepuertas','Tirolejano','Manochispa','Correpolvora'],pause:'Pausar práctica',enchantTo:'sube al nivel',maxLevel:'Nivel máximo',function:'Función',reserve:'Equipo de reserva, últimos 24'},fil:{combo:'Apat na role: mas mabilis ang gang',skills:['Panangga','Tamang tutok','Mabilis na kamay','Pagsabog'],classes:['Gatebreaker','Farshot','Sparkhand','Powderrunner'],reserve:'Reserbang kagamitan, huling 24',pause:'I-pause ang ensayo',enchantTo:'itaas sa antas',maxLevel:'Pinakamataas na antas',function:'Role'}};
 const guards={en:['Royal guard','Knight','Bank guard','Police','Security bot','Vault guardian'],pt:['Guarda real','Cavaleiro','Guarda do banco','Polícia','Robô de segurança','Guardião do cofre'],es:['Guardia real','Caballero','Guardia del banco','Policía','Robot de seguridad','Guardián del cofre'],fil:['Bantay ng hari','Kabalyero','Bantay ng bangko','Pulis','Security bot','Bantay ng vault']};
 const cadenceCopy={en:{bossCounter:'Guards to next boss',buffTime:'Buff remaining',skillTime:'Special remaining',mapKills:'Guards'},pt:{bossCounter:'Guardas até o próximo boss',buffTime:'Buff restante',skillTime:'Skill restante',mapKills:'Abates'},es:{bossCounter:'Guardias hasta el próximo jefe',buffTime:'Efecto restante',skillTime:'Habilidad restante',mapKills:'Bajas'},fil:{bossCounter:'Bantay bago ang susunod na boss',buffTime:'Natitirang buff',skillTime:'Natitirang special',mapKills:'Bantay'}};
 for(const lang of Object.keys(strings))Object.assign(strings[lang],extra[lang],{guards:guards[lang]},cadenceCopy[lang]);
 const words=()=>strings[({ph:'fil',tl:'fil'})[root.I18N?.lang?.()]||root.I18N?.lang?.()]||strings.en;
 const clock=()=>root.performance.now(),media=root.matchMedia('(prefers-reduced-motion: reduce)');
 const preferences=()=>root.OutlawsJuice?.getState?.()||{},motion=()=>!media.matches&&!preferences().reducedMotion&&preferences().motion!==false,fx=()=>preferences().effects!==false;
 let model=null,state=null,started=clock(),offset=0,paused=false,timer=0,lastUI=-Infinity,sceneAPI=null,scene=null,sceneSerial=0,sceneLoading=false,sampleAt=clock(),lastPaint=-Infinity;
 const frameCache=doc.createElement('canvas');
 let cosmetic=0x7a216b90,draws=0,statusKey='tip',statusDetail='',lastCoinAt=-Infinity,lastAoeAt=-Infinity,readyScene=null;
 const falls=[],dropEffects=[],seenEvents=[],sceneQueue=[],loaded=new Map(),pending=new Map();
 let sceneRequest=null,sceneHoldUntil=0,presentation=null;
 function weaponFor(a,era){const v=a.weapon.variant||0;
  const choices={medieval:[['sword','flamesword'],['bow','flamearrow'],['staff','froststaff'],['flamesword','sword']],modern:[['taser','taser'],['awp','ak'],['ak','awp'],['grenade','kamikaze']],future:[['energyblade','energyblade'],['beam','laser'],['laser','beam'],['combatdrone','beam']]};return choices[era][a.role][v];}
 const sceneIds=['M1','M2','M3','M4','M5','M6','B1','B2','B3','B4','B5','B6','F1','F2','F3','F4','F5','F6'];
 const visualRoll=()=>{cosmetic^=cosmetic<<13;cosmetic^=cosmetic>>>17;cosmetic^=cosmetic<<5;return(cosmetic>>>0)/4294967296;};
 const fmt=seconds=>{const n=Math.max(0,Math.ceil(seconds));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');};
 const panel=doc.createElement('section');panel.id='outlaws-loop-v5';panel.className='olv5';panel.setAttribute('aria-labelledby','olv5-title');
 panel.innerHTML='<h3 id="olv5-title"></h3><p data-v5-disclaimer></p><p class="olv5-summary" data-v5-summary></p><p class="olv5-next" data-v5-next></p><p data-v5-status role="status" aria-live="polite" aria-atomic="true"></p><div class="olv5-actions" data-v5-actions></div><details><summary data-v5-gear-title></summary><div class="olv5-members"></div></details><details><summary data-v5-rules-title></summary><p data-v5-tip></p><p data-v5-condition></p><label class="olv5-chaos"><input type="checkbox" checked><span></span></label><div data-v5-collection></div></details><small data-v5-version></small>';
 const style=doc.createElement('style');style.id='outlaws-loop-v5-style';style.textContent=`
 .olv5{padding:12px;margin:12px 0;background:var(--panel,#211e19);border:1px solid var(--border,#796449);color:var(--text,#e8e0cc);font:14px/1.5 var(--ui,system-ui);max-width:100%;box-sizing:border-box;overflow-wrap:anywhere}.olv5 h3{margin:0 0 4px;font-size:16px}.olv5 p{margin:6px 0}.olv5-summary{font-weight:700;font-variant-numeric:tabular-nums}.olv5-next{font-size:13px;font-variant-numeric:tabular-nums}.olv5-actions,.olv5-gear-actions{display:flex;gap:8px;flex-wrap:wrap}.olv5 button,.olv5 summary,.olv5-chaos{min-height:44px;min-width:44px;font:inherit;box-sizing:border-box}.olv5 button{padding:10px 12px;border:1px solid var(--border,#796449);background:var(--panel,#211e19);color:inherit;cursor:pointer;max-width:100%;white-space:normal}.olv5 [data-v5-action=bet],.olv5 [data-v5-action=open]{background:var(--gold,#d9a441);color:var(--bg,#17130e);font-weight:700}.olv5 button[hidden]{display:none}.olv5 :focus-visible{outline:3px solid var(--gold,#d9a441);outline-offset:3px}.olv5 button:disabled{opacity:.65;cursor:default}.olv5 summary{display:flex;align-items:center;cursor:pointer;font-weight:700}.olv5-members{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(min(230px,100%),1fr))}.olv5-member{border:1px solid var(--border,#796449);padding:8px;min-width:0}.olv5-member p{font-size:13px}.olv5-chaos{display:flex;gap:8px;align-items:center}.olv5-chaos input{width:20px;height:20px;margin:12px}.olv5 small{display:block;font-size:11px;margin-top:8px}.olv5 [data-v5-disclaimer]{font-size:12px}.olv5 progress{width:100%;height:8px;accent-color:var(--gold,#d9a441)}
 body[data-loop-v5] #outlaws-boss-demo,body[data-loop-v5] #outlaws-boss-demo-stage,body[data-loop-v5] #outlaws-visual-evolution,body[data-loop-v5] #sacks-panel,body[data-loop-v5] #owj-demo-tray,body[data-loop-v5] .owj-demo-buttons,body[data-loop-v5] #game-tools .owc-demo-intro{display:none!important}
 body[data-loop-v5] .heist-rules{display:none!important}
 body[data-loop-v5] .olv5-stage{position:relative;width:100%;min-width:0}
 body[data-loop-v5] .olv5-stage>#heist-map{opacity:0;box-sizing:content-box!important;width:var(--olv5-scene-w)!important;height:var(--olv5-scene-h)!important;max-width:none;margin:0!important}
 #olv5-scene{display:none}
 body[data-loop-v5] #olv5-scene{display:block;position:absolute;left:0;top:0;box-sizing:content-box!important;margin:0!important;width:var(--olv5-scene-w)!important;height:var(--olv5-scene-h)!important;max-width:none;pointer-events:none;image-rendering:pixelated}
 body[data-loop-v5] .olv5-members{display:flex;flex-direction:column;gap:6px}
 body[data-loop-v5] .olv5-member{padding:0}
 body[data-loop-v5] .olv5-member>summary{display:flex;align-items:center;gap:12px;padding:10px;min-height:48px;list-style:none}
 .olv5-member>summary::after{content:'+';margin-left:auto;flex:none}.olv5-member[open]>summary::after{content:'−'}
 .olv5-class-name{font-weight:700;flex:0 0 auto}.olv5-range{font-size:12px;flex:0 0 auto;color:var(--text-dim,#d2c6af)}
 .olv5-inline-gear{display:flex;flex-wrap:wrap;gap:6px 12px;font-size:12px}.olv5-inline-gear>span{white-space:nowrap}
 .olv5-inline-gear b{font-weight:600}.olv5 [data-rarity="0"]{color:#d5dce2}.olv5 [data-rarity="1"]{color:#a8d6ab}.olv5 [data-rarity="2"]{color:#aad4ed}.olv5 [data-rarity="3"]{color:#d1b9ef}.olv5 [data-rarity="4"]{color:#f0c979}.olv5 [data-rarity="5"]{color:#f0b4c8}
 .olv5-member-body{padding:4px 12px 12px;border-top:1px solid var(--border,#796449)}
 body[data-loop-v5] .olv5-actions,body[data-loop-v5] .olv5-gear-actions{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:8px;align-items:stretch}
 body[data-loop-v5] .olv5-actions>button,body[data-loop-v5] .olv5-gear-actions>button{width:100%;min-height:64px;height:64px;padding:8px 10px;font-size:13px;line-height:1.4;text-align:center}
 @media(min-width:1041px){body[data-loop-v5] .hud{grid-template-columns:minmax(0,1.6fr) minmax(320px,1fr)}body[data-loop-v5] #assalto{grid-column:1;grid-row:1}body[data-loop-v5] .col-main{grid-column:2;grid-row:1}body[data-loop-v5] .col-side{grid-column:1/-1;grid-row:2;display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}}
 @media(max-width:700px){body[data-loop-v5] .olv5-member>summary{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:5px 8px}.olv5-member>summary::after{display:none}.olv5-inline-gear{grid-column:1/-1;justify-content:space-between;font-size:11px}}
 `;doc.head.append(style);map.after(panel);doc.body.dataset.loopV5='true';
 const stage=doc.createElement('div');stage.className='olv5-stage';map.before(stage);stage.append(map);
 const sceneCanvas=doc.createElement('canvas');sceneCanvas.id='olv5-scene';sceneCanvas.setAttribute('aria-hidden','true');stage.append(sceneCanvas);
 let sceneSize={width:480,height:360,scale:1};
 function resizeStage(){
  const available=Math.floor(stage.clientWidth);if(available<80)return;
  const scale=available>=960?3:available>=600?2:1,width=Math.floor((available-6)/scale),height=Math.floor(width*3/4);
  sceneSize={width,height,scale};stage.style.setProperty('--olv5-scene-w',width*scale+'px');stage.style.setProperty('--olv5-scene-h',height*scale+'px');
  if(sceneCanvas.width!==width*scale||sceneCanvas.height!==height*scale){sceneCanvas.width=width*scale;sceneCanvas.height=height*scale;lastPaint=-Infinity;}
 }
 const stageObserver=new ResizeObserver(resizeStage);stageObserver.observe(stage);resizeStage();
 panel.querySelector('[data-v5-gear-title]').parentElement.open=true;
 for(const key of ['bet','decline','open','food','pause','stop','start']){const b=doc.createElement('button');b.type='button';b.dataset.v5Action=key;panel.querySelector('[data-v5-actions]').append(b);}
 function announce(key,detail=''){statusKey=key;statusDetail=detail;panel.querySelector('[data-v5-status]').textContent=(words()[key]||key)+(detail?' · '+detail:'');}
 function audio(name,rarity){if(doc.hidden||!fx())return;root.OutlawsSFX?.play?.(name,{rarity});}
 function load(id){if(loaded.has(id))return Promise.resolve(loaded.get(id));if(pending.has(id))return pending.get(id);const promise=sceneAPI.loadScenario(id,base).then(s=>{loaded.set(id,s);pending.delete(id);return s;},()=>{pending.delete(id);return null;});pending.set(id,promise);return promise;}
 function chooseScene(era){sceneQueue.push(era);sceneLoading=true;pumpScene();}
 function pumpScene(){
  if(!sceneAPI||!active()||sceneRequest||!sceneQueue.length||state.time<sceneHoldUntil||state.phase==='boss')return;
  const era=sceneQueue.shift(),id=sceneAPI.chooseScenario(era,{roll:visualRoll(),previous:scene?.manifest.id}),token=++sceneSerial;
  sceneRequest={era,id,token};
  load(id).then(asset=>{if(token!==sceneSerial||!model)return;if(!asset){sceneRequest=null;sceneLoading=Boolean(sceneQueue.length);return;}readyScene={asset,era,id,token};});
 }
 function commitScene(){
  if(!readyScene||!active()||state.phase==='boss'||state.time-state.lastHit<.8)return;
  const {asset,era,id,token}=readyScene;readyScene=null;if(token!==sceneSerial)return;
  scene={...asset,era};sceneRequest=null;sceneHoldUntil=state.time+4;sceneLoading=Boolean(sceneQueue.length);
  model.setScenario(id);root.dispatchEvent(new CustomEvent('outlaws:training-scenario-ready',{detail:{id,era,visualOnly:true}}));
 }
 import(new URL('api.js',base).href).then(api=>{sceneAPI=api;pumpScene();}).catch(()=>{sceneLoading=false;announce('waiting');});
 function start(){
  const crew=root.OutlawsFightScene?.getCrewSnapshot?.();if(!crew?.length)return false;
  model=MODEL.create({seed:((clock()*1000)>>>0)^0x5a17c0de,crew,era:root.OutlawsEras?.getState?.().era||'medieval',chaos:panel.querySelector('.olv5-chaos input').checked});
  state=model.snapshot();paused=false;started=clock();offset=0;falls.length=0;dropEffects.length=0;lastAoeAt=-Infinity;scene=null;readyScene=null;sceneSerial++;sceneQueue.length=0;sceneRequest=null;sceneHoldUntil=0;presentation=null;
  doc.body.dataset.loopV5Active='true';root.OutlawsBossDemo?.clear?.();chooseScene(state.era);announce('tip');buildMembers();update(true);return true;
 }
 function stop(){if(model)model.stop();state=model?.snapshot();delete doc.body.dataset.loopV5Active;announce('ended');update(true);}
 function active(){return Boolean(model&&state?.active);}
 function events(){
  for(const e of model.takeEvents()){
   seenEvents.push({type:e.type,time:e.time});if(seenEvents.length>64)seenEvents.shift();
   if(e.type==='enemy-fall'){falls.push(e);if(falls.length>8)falls.shift();if(e.kind!=='none'){dropEffects.push({...e});if(dropEffects.length>16)dropEffects.shift();}}
   if(e.type==='attack'){const a=state.crew.find(a=>a.id===e.member);if(a&&!doc.hidden&&fx())root.OutlawsEpochSFX?.play?.(weaponFor(a,scene?.era||state.era),{rarity:a.weapon.rarity});}
   if(e.type==='coin'){lastCoinAt=state.time;audio('coin');announce('coin','+'+e.amount);}
   else if(['buff','weapon','special','aoe'].includes(e.type)){announce(e.type,words().rarities[e.rarity]);audio(e.rarity>=3?'unlock':'count',e.rarity);}
   else if(e.type==='upgrade'){announce('upgrade',String(e.level));audio('rank',0);}
   else if(e.type==='boss-invited'){announce('boss');audio('heist');}
   else if(e.type==='boss-start')audio('heist');
   else if(e.type==='boss-win'){announce('win');audio('success');}
   else if(e.type==='boss-loss'){announce('loss');audio('fail');}
   else if(e.type==='box-open'){const item=state.collection.at(-1),detail=words().rarities[e.rarity]+' · '+words().classes[item.role];announce('collection',detail);audio(e.rarity>=3?'rank':'unlock',e.rarity);root.setTimeout(()=>{if(statusKey==='collection'&&statusDetail===detail)announce('tip');},2600);}
   else if(e.type==='rift-found')announce('rift');else if(e.type==='route-found')announce('route');
   else if(e.type==='scenario-change')chooseScene(scene?.era||state.era);
   else if(e.type==='era-change')chooseScene(e.era||state.era);
   else if(e.type==='aoe')lastAoeAt=state.time;
   else if(e.type==='ended'){delete doc.body.dataset.loopV5Active;announce('ended');}
  }
 }
 function buildMembers(){
  const list=panel.querySelector('.olv5-members');list.replaceChildren();
  for(let i=0;i<(state?.crew.length||0);i++){
   const card=doc.createElement('details');card.className='olv5-member';card.dataset.v5Member=i;
   const summary=doc.createElement('summary'),title=doc.createElement('span');title.dataset.v5Role='';title.className='olv5-class-name';summary.append(title);
   const range=doc.createElement('span');range.className='olv5-range';range.dataset.v5Range='';summary.append(range);
   const gear=doc.createElement('span');gear.className='olv5-inline-gear';summary.append(gear);card.append(summary);
   for(const key of ['weapon','armor','accessory']){const item=doc.createElement('span'),name=doc.createElement('span'),rarity=doc.createElement('b');name.dataset.v5Name=key;rarity.dataset.v5Rarity=key;item.append(name,' ',rarity);gear.append(item);}
   const body=doc.createElement('div');body.className='olv5-member-body';card.append(body);
   const skill=doc.createElement('p');skill.dataset.v5Skill='';body.append(skill);
   for(const key of ['weapon','armor','accessory']){const p=doc.createElement('p');p.dataset.v5Slot=key;body.append(p);}
   const actions=doc.createElement('div');actions.className='olv5-gear-actions';
   for(const key of ['repair','enchant','affix']){const b=doc.createElement('button');b.type='button';b.dataset.v5Action=key;b.dataset.v5Index=i;actions.append(b);}body.append(actions);list.append(card);
  }
 }
 function update(force=false){
  if(!force&&clock()-lastUI<1000)return;lastUI=clock();const w=words(),s=state;
  panel.querySelector('h3').textContent=w.title;panel.querySelector('[data-v5-disclaimer]').textContent=w.train;
  panel.querySelector('[data-v5-gear-title]').textContent=w.gear;panel.querySelector('[data-v5-rules-title]').textContent=w.rules;
  panel.querySelector('[data-v5-tip]').textContent=w.tip;panel.querySelector('[data-v5-condition]').textContent=w.condition;panel.querySelector('.olv5-chaos span').textContent=w.chaos;
  panel.querySelector('[data-v5-version]').textContent=w.source+' · v5.4 · 2026-09-30 19:09:04 UTC';
  panel.querySelector('[data-v5-summary]').textContent=s?.active?`${w.bag}: ${s.coins} · ${w.kills}: ${s.kills} · ${w.energy}: ${Math.round(s.energy)}`:w.ended;
  map.setAttribute('aria-label',s?.active?`${w.title}. ${w.kills}: ${s.kills}. ${w.bag}: ${s.coins}. ${s.phase==='boss'?w.boss:w.tip}`:w.ended);
  panel.querySelector('[data-v5-next]').textContent=s?.active?`${w.minute}: ${fmt(900-s.time)} · ${w.next}: ${fmt(s.nextUpgrade-s.time)} · ${w.bossCounter}: ${Math.max(0,MODEL.CONFIG.bossKills[s.level-1]-s.counter)}${s.buffUntil>s.time?' · '+w.buffTime+': '+fmt(s.buffUntil-s.time):''}${s.specialUntil>s.time?' · '+w.skillTime+': '+fmt(s.specialUntil-s.time):''}`:'';
  panel.querySelector('[data-v5-status]').textContent=(w[statusKey]||w.tip)+(statusDetail?' · '+statusDetail:'');
  for(const b of panel.querySelectorAll('[data-v5-actions] button')){const key=b.dataset.v5Action;b.textContent=key==='pause'?(paused?w.continue:w.pause):w[key];
   b.hidden=key==='bet'||key==='decline'?s?.phase!=='invited':key==='open'?!s?.box:key==='start'?Boolean(s?.active):!s?.active;
   b.disabled=key==='bet'&&(s?.coins??0)<400||key==='food'&&((s?.coins??0)<30||(s?.energy??100)>=100||s?.phase==='boss');
  }
  const cards=panel.querySelectorAll('[data-v5-member]');if(cards.length!==(s?.crew.length||0))buildMembers();
  for(const card of panel.querySelectorAll('[data-v5-member]')){const a=s.crew[Number(card.dataset.v5Member)],role=MODEL.ROLES[a.role],melee=role.range==='melee'||a.role===3&&(scene?.era||s.era)==='medieval';
   card.querySelector('[data-v5-role]').textContent=role.icon+' '+w.classes[a.role];card.querySelector('[data-v5-range]').textContent=w.range[melee?0:1];card.querySelector('[data-v5-skill]').textContent=w.function+': '+w.roles[a.role]+' · '+w.skills[a.role]+' · '+w.level+' '+a.skillLevel;
   ['weapon','armor','accessory'].forEach((key,i)=>{card.querySelector('[data-v5-name='+key+']').textContent=w.slots[i];const r=card.querySelector('[data-v5-rarity='+key+']');r.textContent=w.rarities[a[key].rarity];r.dataset.rarity=a[key].rarity;});
   ['weapon','armor','accessory'].forEach((key,i)=>{const item=a[key];card.querySelector('[data-v5-slot='+key+']').textContent=w.slots[i]+' · '+w.rarities[item.rarity]+' · '+w.level+' '+item.level+(i<2?' · '+w.dur+' '+Math.round(item.durability)+'%':item.affix?' · '+w.roles[['guard','precision','haste','burst'].indexOf(item.affix)]:'');});
   const cost=Math.ceil((200-a.weapon.durability-a.armor.durability)/2);
   for(const b of card.querySelectorAll('button')){const k=b.dataset.v5Action;b.textContent=k==='repair'?w.repair+': '+cost+' BOUNTY':k==='enchant'?a.weapon.level>=5?w.maxLevel+' 5':w.enchant+': '+50*a.weapon.level+' BOUNTY, '+w.enchantTo+' '+Math.min(5,a.weapon.level+1):w.affix;b.disabled=!s.active||s.phase==='boss'||s.coins<(k==='repair'?cost:k==='enchant'?50*a.weapon.level:40)||k==='enchant'&&a.weapon.level>=5||k==='repair'&&cost===0;}
  }
  const collection=panel.querySelector('[data-v5-collection]');collection.replaceChildren();const caption=doc.createElement('p');caption.textContent=w.collection+': '+(s?.collection?.length||0)+' · '+w.reserve+': '+(s?.inventory?.length||0)+(new Set(s?.crew?.map(a=>a.role)).size===4?' · '+w.combo:'');collection.append(caption);
 }
 panel.addEventListener('click',event=>{
  const button=event.target.closest('[data-v5-action]');if(!button)return;const kind=button.dataset.v5Action;
  if(kind==='start'){start();return;}if(kind==='stop'){stop();return;}
  if(kind==='pause'){if(!active())return;paused=!paused;if(paused)offset=state.time;else started=clock();update(true);return;}
  const ok=model?.action(kind,Number(button.dataset.v5Index)||0);state=model?.snapshot();events();if(!(kind==='open'&&ok))announce(ok?(kind==='decline'?'tip':kind==='bet'?'boss':'applied'):'empty');update(true);
 });
 panel.querySelector('.olv5-chaos input').addEventListener('change',e=>{model?.setChaos(e.target.checked);state=model?.snapshot();update(true);});
 root.I18N?.onChange?.(()=>{statusDetail='';update(true);});
 function tick(){
  if(!model){start();}else if(active()&&!paused){model.advance(offset+(clock()-started)/1000);state=model.snapshot();sampleAt=clock();events();commitScene();pumpScene();update();}
  timer=root.setTimeout(tick,250);
 }
 const enemies={medieval:['king_guard','knight'],modern:['bank_security','police'],future:['security_robot','alien_guardian']},bosses={medieval:'king_tyrant',modern:'swat_chief',future:'alien_emperor'};
 function background(ctx,W,H,type){
  if(!scene||!sceneAPI){root.OutlawsFightArt?.drawScene?.(ctx,{era:type,width:W,height:H,motion:false,effects:false});return;}
  for(let y=0;y<H;y+=32)for(let x=0;x<W;x+=32)sceneAPI.drawTile(ctx,scene,'ground_'+((x/32+y/32*3)%4),x,y);
  for(let x=0;x<W;x+=32){sceneAPI.drawTile(ctx,scene,'wall_top',x,0);sceneAPI.drawTile(ctx,scene,'wall_body',x,32);}
  for(let y=64;y<H-32;y+=32){sceneAPI.drawTile(ctx,scene,'wall_corner',0,y);sceneAPI.drawTile(ctx,scene,'wall_body',Math.floor((W-32)/32)*32,y);}
  sceneAPI.drawAssembly(ctx,scene,'signature',Math.round(W/2-48),0);
  for(const tile of scene.manifest.previewRecipe.overlays.filter(t=>t.y>=45&&t.x>0&&t.x<384&&t.tile<16)){
   const name=scene.manifest.frames[tile.tile].name;if(name==='wall_body')continue;
   sceneAPI.drawTile(ctx,scene,name,Math.round(tile.x*W/416),Math.min(H-34,Math.round(tile.y*H/320)));
  }
 }
 function sprite(ctx,method,id,x,y,options){const art=root.OutlawsEraArt;try{if(art?.getState?.().ready&&typeof art[method]==='function'&&art[method](ctx,id,x,y,options)!==false)return;}catch{}
  ctx.fillStyle=['#bba17c','#688398','#729899'][MODEL.ERAS.indexOf(scene?.era||state.era)];ctx.fillRect(x+5,y+4,22,28);
 }
 function copyFrame(output){
  const view=sceneCanvas.getContext('2d');view.setTransform(sceneSize.scale,0,0,sceneSize.scale,0,0);view.imageSmoothingEnabled=false;view.clearRect(0,0,frameCache.width,frameCache.height);view.drawImage(frameCache,0,0);
  output.save();output.setTransform(1,0,0,1,0,0);output.imageSmoothingEnabled=false;output.drawImage(frameCache,0,0,output.canvas.width,output.canvas.height);output.restore();
 }
 function draw(output){
  const paintAt=clock(),W=sceneSize.width,H=sceneSize.height,ratio=1;
  if(paintAt-lastPaint<16&&frameCache.width===W&&frameCache.height===H){copyFrame(output);return true;}lastPaint=paintAt;
  if(frameCache.width!==W||frameCache.height!==H){frameCache.width=W;frameCache.height=H;}
  const ctx=frameCache.getContext('2d');
  if(!active()){ctx.save();ctx.setTransform(ratio,0,0,ratio,0,0);background(ctx,W,H,scene?.era||'medieval');ctx.fillStyle='#14202b';ctx.fillRect(12,H/2-24,W-24,48);ctx.fillStyle='#ecddbd';ctx.font='12px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(model?words().ended:words().waiting,W/2,H/2,W-36);ctx.restore();copyFrame(output);return true;}
  const s=state,type=scene?.era||s.era,m=motion(),effects=fx(),now=s.time+(m&&!paused?Math.min(.3,(paintAt-sampleAt)/1000):0),art=root.OutlawsFightArt,api=root.OutlawsEraArt;
  ctx.save();ctx.setTransform(ratio,0,0,ratio,0,0);ctx.imageSmoothingEnabled=false;background(ctx,W,H,type);
  const boss=s.phase==='boss',elapsed=boss?now-s.boss.start:0,phase=boss?elapsed<.7?'entry':Math.floor(elapsed/3.7)%2?'dodge':'counter':'grind';
  const rowGap=Math.max(28,Math.min(48,Math.floor((H*.62-64)/2))),ordinal=s.kills%5,target=boss?{x:Math.round(W*.67),y:Math.round(H*.52)}:{x:Math.round(W*.63+(ordinal%2)*47),y:Math.round(H*.31+Math.floor(ordinal/2)*rowGap)},attackAge=now-s.lastHit;
  presentation={time:s.time,era:type,phase:s.phase,viewport:{...sceneSize},target:{...target},actors:[]};
  for(let i=0;i<s.crew.length;i++){
   const a=s.crew[i],role=MODEL.ROLES[a.role],melee=role.range==='melee'||a.role===3&&type==='medieval';
   const baseX=melee?W*.53:W*.14+(i%2)*45,baseY=H*.44+Math.floor(i/2)*31;
   let x=Math.round(baseX),y=Math.round(baseY),pose='idle',beat=0;
   const attacking=boss?phase==='counter':i===(s.kills-1)%s.crew.length&&attackAge>=0&&attackAge<.7;
   if(attacking){beat=boss?(elapsed%3.7)/3.7:attackAge/.7;pose='attack';if(melee&&m){const reach=Math.max(0,Math.sin(Math.PI*beat));x+=Math.round((target.x-48-baseX)*reach);y+=Math.round((target.y-baseY)*reach);}}
   else if(boss&&phase==='dodge'&&m){x-=Math.round(Math.sin((elapsed%3.7)/3.7*Math.PI)*18);pose='walk';}
   const frame=m?Math.min(5,Math.floor(beat*6)):0,weapon=weaponFor(a,type);
   presentation.actors.push({id:a.id,role:role.id,range:melee?'melee':'ranged',weapon,x,y,attacking,distance:Math.hypot(target.x-x,target.y-y)});
   art.drawOutlaw(ctx,{id:a.id,rank:a.rank,era:type,x,y,state:pose,frame,face:1,motion:m,effects});
   art.drawWeapon(ctx,{weapon,era:type,x:x+24,y:y+17,state:pose==='attack'?'attack':'idle',frame,face:1,motion:m,effects});
   ctx.fillStyle='#ecddbd';ctx.font='11px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(role.icon,x+16,y-4);
   if(attacking&&!melee){ctx.strokeStyle=type==='future'?'#84bfc8':'#e5b657';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+29,y+17);ctx.lineTo(target.x+12,target.y+18);ctx.stroke();}
  }
  const options={style:root.OutlawsArcade?.getStyle?.()||'arcade',scale:1,motion:m,effects};
  if(boss){sprite(ctx,'drawBoss',bosses[type],target.x-4,target.y-8,{...options,state:phase==='counter'?'hit':'attack',direction:'left',frame:m?Math.floor(elapsed*5)%8:0});
   const hp=Math.max(22,100-Math.floor(elapsed/40*78));ctx.fillStyle='#15202a';ctx.fillRect(Math.round(W*.58),H-43,Math.round(W*.32),7);ctx.fillStyle='#b99459';ctx.fillRect(Math.round(W*.58),H-43,Math.round(W*.32*hp/100),7);
  }else{
   const labels=[];
   for(let i=0;i<5;i++){
    const fall=[...falls].reverse().find(e=>e.ordinal%5===i),age=fall?now-fall.time:Infinity;
    const falling=age>=.25&&age<.8,x=Math.round(W*.63+(i%2)*47),y=Math.round(H*.31+Math.floor(i/2)*rowGap);
    const stateName=falling?'fall':age<.25?'hit':Math.floor(now*2+i)%5===0?'attack':'idle';
    sprite(ctx,'drawEnemy',enemies[type][i%2],x,y,{...options,state:stateName,direction:'left',frame:m?Math.floor(now*8)%8:0});
    ctx.fillStyle='#15202a';ctx.fillRect(x+4,y-5,24,3);ctx.fillStyle='#b99459';ctx.fillRect(x+4,y-5,falling?0:age<.25?5:24,3);
    if(!falling){ctx.font='9px ui-monospace,monospace';const text=words().guards[MODEL.ERAS.indexOf(type)*2+i%2],width=Math.ceil(ctx.measureText(text).width)+8,lx=Math.max(8,Math.min(W-width-8,x+16-width/2));let ly=Math.max(42,y-19);
     for(let n=0;n<8&&labels.some(b=>lx<b.x+b.w&&lx+width>b.x&&ly<b.y+13&&ly+13>b.y);n++)ly=Math.max(42,ly-14);
     labels.push({x:lx,y:ly,w:width,text});
    }
   }
   for(const l of labels){ctx.fillStyle='#15202a';ctx.fillRect(Math.round(l.x),Math.round(l.y),l.w,13);ctx.fillStyle='#ecddbd';ctx.textAlign='center';ctx.fillText(l.text,l.x+l.w/2,l.y+10,l.w-6);}
  }
  for(const d of dropEffects){const age=now-d.time;if(age<0||age>.65)continue;const n=d.ordinal%5,progress=m&&effects?Math.min(1,age/.65):0,origin={x:Math.round(W*.63+(n%2)*47)+16,y:Math.round(H*.31+Math.floor(n/2)*rowGap)+22};
   const x=Math.round(origin.x+(W*.24-origin.x)*progress),y=Math.round(origin.y+(H-30-origin.y)*progress-(m&&effects?Math.sin(progress*Math.PI)*22:0));
   ctx.fillStyle='#15202a';ctx.fillRect(x-7,y-7,14,14);ctx.fillStyle=d.kind==='coin'?'#e5b657':d.kind==='buff'?'#84bfc8':'#ecddbd';ctx.font='bold 12px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(d.kind==='coin'?'●':d.kind==='weapon'?'↗':d.kind==='buff'?'✦':d.kind==='aoe'?'◉':d.kind==='era'?'◇':d.kind==='scene'?'↪':'◆',x,y+4);
  }
  if(s.box){try{if(api?.getState?.().ready)api.drawLootbox(ctx,W-70,H-64,{...options,rarity:s.box.rarity,state:'closed'});}catch{}}
  if(m&&effects&&now-lastAoeAt<.45){ctx.strokeStyle='#e5b657';ctx.lineWidth=2;ctx.strokeRect(target.x-22,target.y-26,74,84);}
  const w=words(),caption=scene?w.scenarios[sceneIds.indexOf(scene.manifest.id)]:w.waiting;
  ctx.fillStyle='#14202b';ctx.fillRect(9,9,W-18,24);ctx.font='bold 11px ui-monospace,monospace';ctx.textAlign='left';ctx.fillStyle='#ecddbd';ctx.fillText(caption,18,25,W-34);
  ctx.font='10px ui-monospace,monospace';ctx.fillStyle='#14202b';ctx.fillRect(9,H-26,W-18,20);ctx.fillStyle='#ecddbd';ctx.fillText(w.coin+': '+s.coins+' · '+w.mapKills+': '+s.kills,18,H-12,W-34);
  if(now-lastCoinAt<.3){ctx.fillStyle='#f2d487';ctx.fillText('+ BOUNTY',W*.4,H*.4-(m?(now-lastCoinAt)*15:0));}
  ctx.restore();copyFrame(output);draws++;return true;
 }
 root.OutlawsLoopV5=Object.freeze({active,ownsPresentation:()=>true,start,stop,draw,getMetrics:()=>model?.metrics(),getPresentation:()=>presentation?JSON.parse(JSON.stringify(presentation)):null,getState:()=>({privateDemo:true,active:active(),paused,phase:state?.phase,bossSeconds:state?.boss?Math.max(0,state.time-state.boss.start):0,chaos:state?.chaos,era:state?.era,displayEra:scene?.era,scenario:scene?.manifest.id,sceneLoading,draws,seconds:state?.time,coins:state?.coins,kills:state?.kills,counter:state?.counter,bossThreshold:MODEL.CONFIG.bossKills[(state?.level||1)-1],upgrade:state?.upgrade,buffSeconds:Math.max(0,(state?.buffUntil||0)-(state?.time||0)),specialSeconds:Math.max(0,(state?.specialUntil||0)-(state?.time||0)),hasBox:Boolean(state?.box),boxRarity:state?.box?.rarity,collectionCount:state?.collection?.length||0,lastDrop:state?.lastDrop,crew:state?.crew?.map(a=>({id:a.id,role:MODEL.ROLES[a.role].id,rank:a.rank,weapon:weaponFor(a,scene?.era||state.era),classRarity:a.classRarity,skillLevel:a.skillLevel})),reducedMotion:!motion(),effects:fx(),events:seenEvents.slice(-12)}),dispose:()=>{root.clearTimeout(timer);stageObserver.disconnect();stop();delete doc.body.dataset.loopV5;}});
 timer=root.setTimeout(tick,0);update(true);
})(window);

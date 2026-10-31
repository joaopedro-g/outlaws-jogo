/* Presentation director. Copies observed poses/outcomes; never writes Heist or game state. */
(function(root){
 'use strict'; if(root.OutlawsFightScene)return;
 const doc=root.document, demo=new URLSearchParams(root.location.search).has('demo');
 const eras=['medieval','modern','future'], ranks=['#a7b4bd','#82bd8a','#86bddd','#b89ad8','#e2b763','#f2d388'];
 const enemyIds={medieval:['king_guard','knight'],modern:['bank_security','police'],future:['security_robot','alien_guardian']};
 const language=()=>{const l=root.I18N?.lang?.()||'en';return l==='ph'||l==='tl'?'fil':l;};
 const copy={
  en:{eras:['Crown dungeon','Bank vault','Orbital station'],guards:['Royal guard','Knight','Bank guard','Police','Security bot','Vault guardian'],clear:['CROWN GOLD!','VAULT OPEN!','CREDITS STOLEN!'],preview:'Fight preview',live:'The heist',wave:'Guards remaining',next:'Next visual evolution in',evolve:'Graphics evolved',era:'Next time rift in',done:'Full graphics reached',toggle:'Automatic visual evolution',help:'Demo only. Graphics and eras evolve while this map is visible. No rewards or game rules change.'},
  pt:{eras:['Masmorra da coroa','Cofre do banco','Estação em órbita'],guards:['Guarda real','Cavaleiro','Guarda do banco','Polícia','Robô de segurança','Guardião do cofre'],clear:['OURO DA COROA!','COFRE ABERTO!','CRÉDITOS ROUBADOS!'],preview:'Prévia de luta',live:'O assalto',wave:'Guardas restantes',next:'Próxima evolução visual em',evolve:'Gráficos evoluíram',era:'Próxima fenda do tempo em',done:'Gráficos completos',toggle:'Evolução visual automática',help:'Só na demo. Gráficos e épocas evoluem enquanto o mapa está visível. Os ganhos e as regras continuam iguais.'},
  es:{eras:['Mazmorra de la corona','Bóveda del banco','Estación orbital'],guards:['Guardia real','Caballero','Guardia del banco','Policía','Robot de seguridad','Guardián de la bóveda'],clear:['¡ORO DE LA CORONA!','¡BÓVEDA ABIERTA!','¡CRÉDITOS ROBADOS!'],preview:'Vista de combate',live:'El atraco',wave:'Guardias restantes',next:'Próxima evolución visual en',evolve:'Gráficos mejorados',era:'Próxima grieta temporal en',done:'Gráficos completos',toggle:'Evolución visual automática',help:'Solo en la demo. Gráficos y épocas evolucionan mientras el mapa está visible. Las recompensas y reglas no cambian.'},
  fil:{eras:['Piitan ng korona','Vault ng bangko','Orbital station'],guards:['Bantay ng hari','Kabalyero','Bantay ng bangko','Pulis','Security bot','Bantay ng vault'],clear:['GINTO NG KORONA!','BUKAS ANG VAULT!','NAKAW NA CREDITS!'],preview:'Silip sa labanan',live:'Ang heist',wave:'Natitirang bantay',next:'Susunod na visual evolution sa',evolve:'Na-upgrade ang graphics',era:'Susunod na time rift sa',done:'Kumpleto ang graphics',toggle:'Awtomatikong visual evolution',help:'Demo lang. Nagbabago ang graphics at panahon habang nakikita ang mapa. Pareho ang reward at tuntunin.'}
 };
 const words=()=>copy[language()]||copy.en, media=root.matchMedia?.('(prefers-reduced-motion: reduce)');
 const preferences=()=>root.OutlawsJuice?.getState?.()||{};
 const moving=()=>!media?.matches&&!preferences().reducedMotion&&preferences().motion!==false;
 const effects=()=>preferences().effects!==false;
 const clock=()=>root.performance.now();
 let map=doc.getElementById('heist-map'), crew=[], scanned=-Infinity, room=null, previewState=null;
 let hitCount=0,deaths=0,draws=0,warpAt=-Infinity,upgradeAt=-Infinity,lastEra='medieval',lastPaint=-Infinity;
 const paintedFrame=doc.createElement('canvas');let hasPaintedFrame=false;
 const attacks=new Map(), hitEvents=[], liveEnemies=new Map(), pickups=new Map();
 const currentEra=()=>root.OutlawsEras?.getState?.().era||'medieval';
 const pixel=(ctx,color,x,y,w=1,h=1)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function scanCrew(force=false){
  if(!force&&clock()-scanned<700)return;scanned=clock();
  const observed=root.OutlawsEquippedAdapter?.getState?.().actors||[], selected=new Set(observed.filter(a=>a.identity==='outlaw'&&a.working).map(a=>String(a.id)));
  const cards=[...doc.querySelectorAll('.card')], list=[];
  for(const card of cards){const id=Number(card.querySelector('[data-act="select"]')?.dataset.id),rank=Number(card.className.match(/\br-([0-5])\b/)?.[1]);
   if(!Number.isSafeInteger(id)||!Number.isInteger(rank))continue;
   list.push({id,rank,identity:'outlaw',inRoom:selected.has(String(id))});
  }
  if(list.length)crew=(selected.size?list.filter(a=>a.inRoom):list).sort((a,b)=>a.id-b.id).slice(0,10);
 }
 function getCrewSnapshot(){scanCrew();return crew.map(a=>({...a}));}
 function weaponFor(actor,type,forced){
  if(forced)return forced;
  const load=root.OutlawsEquippedWeapons?.getLoadouts?.().find(g=>String(g.id)===String(actor.id));
  if(load&&load.expiresAt>clock()&&root.OutlawsTemporalArsenal?.arsenal?.[type]?.includes(load.weapon))return load.weapon;
  const families={sword:['sword','ak47','laser'],flamesword:['flamesword','ak47','sabre'],bow:['bow','awp','beam'],staff:['staff','taser','beam'],froststaff:['froststaff','taser','beam'],shockstaff:['shockstaff','taser','beam'],flamearrow:['flamearrow','grenade','sabre'],frostarrow:['frostarrow','taser','beam'],shockarrow:['shockarrow','taser','beam'],ak47:['sword','ak47','laser'],awp:['bow','awp','beam'],grenade:['flamearrow','grenade','sabre'],taser:['shockstaff','taser','beam'],kamikaze:['flamearrow','kamikaze','combatdrone'],laser:['sword','ak47','laser'],beam:['staff','awp','beam'],sabre:['flamesword','grenade','sabre'],combatdrone:['staff','kamikaze','combatdrone']};
  return load&&load.expiresAt>clock()?(families[{ak:'ak47',energyblade:'sabre'}[load.weapon]||load.weapon]||families.sword)[eras.indexOf(type)]:['sword','ak47','laser'][eras.indexOf(type)];
 }
 function observeRoom(snapshot){
  if(!snapshot)return;
  if(room?.serial!==snapshot.serial){liveEnemies.clear();attacks.clear();hitEvents.length=0;}
  room=snapshot;
  for(const node of snapshot.nodes){let enemy=liveEnemies.get(node.id);
   if(!enemy){enemy={...node,hp:100,hitAt:-Infinity,fallAt:0,ordinal:liveEnemies.size};liveEnemies.set(node.id,enemy);}
   if(!node.alive&&enemy.alive!==false){enemy.alive=false;enemy.hp=0;enemy.fallAt=Math.max(node.fellAt||clock(),enemy.hitAt+260);deaths++;}
   if(node.alive)enemy.alive=true;
  }
  const now=clock();for(const [id,e]of liveEnemies)if(e.alive===false&&now-e.fallAt>900)liveEnemies.delete(id);
 }
 function observeAttack(input){
  if(!input?.observed||previewState||root.OutlawsLoopV5?.ownsPresentation?.())return false;
  const now=clock(),id=String(input.id),previous=attacks.get(id);if(previous&&now-previous.at<700)return false;
  let candidates=[...liveEnemies.values()].filter(e=>e.alive!==false);
  if(!candidates.length)return false;
  if(input.target)candidates.sort((a,b)=>Math.hypot(a.x-input.target.x,a.y-input.target.y)-Math.hypot(b.x-input.target.x,b.y-input.target.y));
  const enemy=candidates[0];enemy.hitAt=now+300;enemy.hp=Math.max(1,enemy.hp-17);attacks.set(id,{at:now,enemy:enemy.id});
  hitEvents.push({at:now+300,enemy:enemy.id,damage:17});hitCount++;
  if(effects()&&!root.OutlawsEquippedWeapons?.getLoadouts?.().some(g=>String(g.id)===id)){
   const cue=weaponFor(crew.find(a=>String(a.id)===id)||{id:input.id},currentEra());
   root.OutlawsEpochSFX?.play?.(cue==='ak47'?'ak':cue);
  }
  return true;
 }
 function enemyPositions(list,W,H){return list.map((e,i)=>({...e,x:Math.round(W*.67+(i%2)*W*.15),y:Math.round(H*.34+Math.floor(i/2)*H*.27)}));}
 function attackEffect(ctx,weapon,from,to,t,motion,fx){
  if(!motion||!fx||t<.23||t>.8)return;
  const hot=weapon==='flamesword'||weapon==='flamearrow'||weapon==='sabre';
  if(/sword|sabre/.test(weapon)){
   const p=clamp((t-.23)/.4,0,1),radius=34,start=-1.55;
   for(let i=0;i<11;i++){const angle=start+p*2.8-i*.105;if(angle<start)continue;
    pixel(ctx,hot?(i<3?'#fff1b4':i<7?'#ffb447':'#de6735'):'#dce9e0',from.x+Math.cos(angle)*radius,from.y+Math.sin(angle)*radius,hot?5:3,3);
    if(hot&&i%2===0)pixel(ctx,'#df6939',from.x+Math.cos(angle)*(radius+7),from.y+Math.sin(angle)*(radius+7),2,3);
   }
  }else if(weapon==='grenade'||weapon==='kamikaze'){
   const p=clamp((t-.23)/.42,0,1),x=from.x+(to.x-from.x)*p,y=from.y+(to.y-from.y)*p-Math.sin(p*Math.PI)*45;
   pixel(ctx,'#eff0c5',x,y,4,4);if(p>.9)for(let i=0;i<8;i++){const a=i*Math.PI/4;pixel(ctx,i<4?'#ffc16b':'#a28068',to.x+Math.cos(a)*20,to.y+Math.sin(a)*20,6,5);}
  }else{
   const electric=/taser|shock|beam/.test(weapon),color=electric?'#a9eff1':hot?'#ffbc69':'#f7dfaa';
   if(t<.5){ctx.strokeStyle=color;ctx.lineWidth=electric?2:1;ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);ctx.stroke();}
   if(weapon==='ak47'&&t<.45){pixel(ctx,'#fff1aa',from.x+23,from.y-3,9,6);pixel(ctx,'#d8ba76',from.x-7,from.y-10-(t-.23)*25,3,2);}
  }
  if(t>.38&&t<.58){pixel(ctx,'#fff1c6',to.x-4,to.y-4,9,8);pixel(ctx,hot?'#ffac57':'#a7d8e8',to.x-9,to.y,4,3);}
 }
 function paintActor(ctx,a,x,y,type,state,frame,weapon,face=1,options={}){
  const art=root.OutlawsFightArt;if(!art)return;
  art.drawOutlaw(ctx,{id:a.id,rank:a.rank,era:type,x,y,state,frame,face,scale:1,motion:options.motion,effects:options.effects});
  art.drawWeapon(ctx,{weapon,era:type,x:x+(face>0?24:7),y:y+17,state:state==='attack'?'attack':'idle',frame,face,scale:1,motion:options.motion,effects:options.effects});
 }
 function drawCrew(ctx,options={}){
  const list=(options.crew||getCrewSnapshot()).slice(0,6);if(!list.length)return false;
  const b=options.bounds||{x:18,y:100,width:174,height:104},type=eras.includes(options.era)?options.era:currentEra();
  const motion=options.motion!==false&&moving(),fx=options.effects!==false&&effects(),beat=options.beat||0;
  for(let i=0;i<list.length;i++){
   let x=b.x+(i%3)*(b.width-36)/2,y=b.y+Math.floor(i/3)*(b.height-32),state='idle';
   if(options.phase==='dodge'&&motion){x+=((i%3)-1)*10*Math.sin(beat*Math.PI/2);y+=(i<3?-13:13)*Math.sin(beat*Math.PI/2);state='walk';}
   if(options.phase==='counter'){if(motion)x+=Math.sin(beat*Math.PI)*20;state='attack';}
   if(options.phase==='defeat')state='fall';
   const weapon=weaponFor(list[i],type),frame=motion?Math.min(5,Math.floor(beat*6)):0;
   paintActor(ctx,list[i],Math.round(x),Math.round(y),type,state,frame,weapon,1,{motion, effects:fx});
   if(options.phase==='counter')attackEffect(ctx,weapon,{x:x+23,y:y+20},options.target||{x:230,y:144},beat,motion,fx);
  }return true;
 }
 function preview(options={}){
  if(!demo)return false;scanCrew(true);if(!crew.length)return false;
  const now=clock(),entry=options.entry===true?1550:0;previewState={started:now,combatAt:now+entry,expires:now+5200+entry,entry,weapon:options.weapon||'flamesword',crew:getCrewSnapshot().slice(0,6),soundBeat:-1};
  return true;
 }
 function clear(){previewState=null;}
 function model(now){
  if(previewState&&now>=previewState.expires)previewState=null;
  if(previewState){const age=Math.max(0,now-previewState.combatAt);
   const enemies=[0,1,2].map(i=>{const fallAt=previewState.combatAt+1200+i*650;return {id:'preview-guard-'+i,ordinal:i,alive:now<fallAt,hp:now<fallAt?Math.max(1,100-Math.floor(age/320)*17):0,hitAt:previewState.combatAt+350+Math.floor(Math.max(0,age-350)/700)*700,fallAt};});
   const cleared=enemies.every(e=>!e.alive&&now-e.fallAt>=650);
   return {mode:'preview',crew:previewState.crew,enemies,roomCleared:cleared,chestVisible:cleared,hitCount:Math.floor(age/350),deaths:enemies.filter(e=>!e.alive).length,entering:now<previewState.started+650&&previewState.entry>0,picking:previewState.entry>0&&now>=previewState.started+650&&now<previewState.combatAt};
  }
  const enemies=[...liveEnemies.values()], cleared=Boolean(room?.cleared&&enemies.every(e=>e.alive===false&&now-e.fallAt>=650));
  return {mode:'realRoom',crew:getCrewSnapshot(),enemies,roomCleared:cleared,chestVisible:cleared,hitCount,deaths};
 }
 function drawEnemy(ctx,e,type,now,motion,fx){
  const age=now-e.fallAt;if(e.alive===false&&(!motion||age>650))return;
  const hitAge=now-e.hitAt,hit=hitAge>=0&&hitAge<140,state=e.alive===false?'fall':hit?'hit':'idle';
  const x=e.x+(motion&&hit?Math.round(5*(1-hitAge/140)):0),y=e.y;
  ctx.save();if(!e.alive)ctx.globalAlpha=clamp(1-age/700,0,1);
  const api=root.OutlawsEraArt,id=enemyIds[type][e.ordinal%2];
  let painted=false;
  try{if(api?.getState?.().ready)painted=api.drawEnemy(ctx,id,x,y,{style:root.OutlawsArcade?.getStyle?.()||'arcade',graphics:api.getState().graphics,state,direction:'left',frame:motion?Math.floor(Math.max(0,age)/90)%8:0,scale:1})!==false;}catch{}
  if(!painted){pixel(ctx,'#15202a',x+5,y+3,22,28);pixel(ctx,type==='future'?'#729899':type==='modern'?'#688398':'#bba17c',x+8,y+6,16,21);pixel(ctx,'#17242c',x+10,y+11,12,3);}
  if(hit&&motion&&fx){ctx.globalAlpha=.58;pixel(ctx,'#fff1d5',x+8,y+4,17,25);ctx.globalAlpha=1;}
  if(!e.alive&&motion&&fx)for(let i=0;i<7;i++)pixel(ctx,i%2?'#978d7e':'#c6b897',x+16+(i-3)*age/32,y+27-age/60+(i%2)*5,3,2);
  ctx.restore();
  if(e.alive!==false){pixel(ctx,'#17242c',x+4,y-6,24,3);pixel(ctx,type==='future'?'#82c2cc':'#b9a575',x+4,y-6,24*e.hp/100,3);}
 }
 function labelEnemies(ctx,enemies,type,W,H){
  const used=[],w=words(),eraIndex=eras.indexOf(type);ctx.font='9px ui-monospace,monospace';ctx.textAlign='center';ctx.textBaseline='top';
  for(const e of enemies.filter(e=>e.alive!==false)){
   const name=w.guards[eraIndex*2+e.ordinal%2],width=Math.min(W-12,Math.ceil(ctx.measureText(name).width)+10);
   const x=clamp(e.x+16-width/2,6,W-width-6);let y=clamp(e.y-24,38,H-16);
   for(let n=0;n<12&&used.some(b=>x<b.x+b.w+3&&x+width+3>b.x&&y<b.y+14&&y+14>b.y);n++)y=clamp(y-15,38,H-16);
   used.push({x,y,w:width});pixel(ctx,'#15202a',x,y,width,13);ctx.fillStyle='#e8dec8';ctx.fillText(name,x+width/2,y+2,width-6);
  }
 }
 function render(ctx,time){
  if(ctx.canvas.id!=='heist-map'||doc.hidden||!root.OutlawsFightArt)return false;
  if(root.OutlawsLoopV5?.ownsPresentation?.())return root.OutlawsLoopV5.draw(ctx);
  const now=Number.isFinite(time)?time:clock();
  if(now-lastPaint<40&&hasPaintedFrame&&paintedFrame.width===ctx.canvas.width&&paintedFrame.height===ctx.canvas.height){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(paintedFrame,0,0);ctx.restore();return true;}lastPaint=now;
  // Keep native32px world/actors consistent when Arcade doubles the backing store.
  const ratio=Math.max(1,Math.round(ctx.canvas.width/480));
  const data=model(now),type=currentEra(),motion=moving(),fx=effects(),W=ctx.canvas.width/ratio,H=ctx.canvas.height/ratio;
  ctx.save();ctx.setTransform(ratio,0,0,ratio,0,0);ctx.imageSmoothingEnabled=false;
  root.OutlawsFightArt.drawScene(ctx,{era:type,width:W,height:H,time:now,motion,effects:fx,graphics:root.OutlawsEraArt?.getState?.().graphics});
  const positioned=enemyPositions(data.enemies,W,H),list=data.crew.slice(0,6),live=positioned.filter(e=>e.alive!==false);
  for(let i=0;i<list.length;i++){
   const a=list[i];let x=30+(i%3)*49,y=H*.41+Math.floor(i/3)*H*.3,state='idle',beat=0;
   let target=live[i%Math.max(1,live.length)],attack=data.mode==='preview'?null:attacks.get(String(a.id));
   if(data.mode==='preview'&&live.length&&i<3&&now>=previewState.combatAt){const age=now-previewState.combatAt;attack={at:previewState.combatAt+Math.floor((age+i*120)/700)*700-i*120};}
   if(data.entering){state='walk';if(motion)x-=90*(1-clamp((now-previewState.started)/650,0,1));}
   if(attack&&now-attack.at>=0&&now-attack.at<700&&target){beat=(now-attack.at)/700;state=beat<.23?'walk':beat<.8?'attack':'walk';
    if(motion){const approach=Math.min(1,beat/.23,(1-beat)/.2);x+=(target.x-42-x)*Math.max(0,approach);y+=(target.y+(i<3?-12:15)-y)*Math.max(0,approach);}
   }
   const weapon=weaponFor(a,type,data.mode==='preview'&&type==='medieval'&&!data.entering?previewState.weapon:null),frame=motion?Math.min(5,Math.floor(beat*6)):0;
   paintActor(ctx,a,x,y,type,state,frame,weapon,state==='walk'&&beat>.8?-1:1,{motion,effects:fx});
   const pickup=pickups.get(String(a.id)),pickupAge=pickup?now-pickup.at:Infinity;
   if((data.picking&&i===0)||pickupAge<650){
    if(fx){ctx.strokeStyle=['#dfb16d','#b8d9dd','#82d8cf'][eras.indexOf(type)];ctx.lineWidth=1;ctx.strokeRect(Math.round(x+3),Math.round(y+5),27,27);}
    root.OutlawsFightArt.drawWeapon(ctx,{weapon,era:type,x:x+15,y:y-4,state:'idle',frame:0,scale:1,motion:false});
   }
   if(target&&state==='attack')attackEffect(ctx,weapon,{x:x+23,y:y+20},{x:target.x+12,y:target.y+18},beat,motion,fx);
  }
  for(const e of positioned)drawEnemy(ctx,e,type,now,motion,fx);
  labelEnemies(ctx,positioned,type,W,H);
  for(const hit of hitEvents){const e=positioned.find(e=>e.id===hit.enemy),age=now-hit.at;if(!e||age<0||age>700)continue;ctx.fillStyle='#ffdfa2';ctx.font='bold 12px monospace';ctx.fillText(String(hit.damage),e.x+16,e.y-30-(motion?age/45:0));}
  while(hitEvents.length&&now-hitEvents[0].at>800)hitEvents.shift();
  if(data.chestVisible){const art=root.OutlawsEraArt;let painted=false;try{if(art?.getState?.().ready)painted=art.drawLootbox(ctx,W*.72,H*.58,{rarity:0,state:'closed',scale:1,style:root.OutlawsArcade?.getStyle?.()||'arcade'})!==false;}catch{}if(!painted){pixel(ctx,'#b38b52',W*.72,H*.58,35,25);pixel(ctx,'#ecd18a',W*.72,H*.58+9,35,3);}}
  const w=words(),caption=w.eras[eras.indexOf(type)];pixel(ctx,'#14202b',9,9,W-18,24);pixel(ctx,['#b99459','#90afb6','#84bfc8'][eras.indexOf(type)],9,9,3,24);
  ctx.font='bold 11px ui-monospace,monospace';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle='#ecddbd';ctx.fillText(caption,20,21,W-40);
  if(data.chestVisible){ctx.textAlign='center';pixel(ctx,'#14202b',W*.18,H-33,W*.64,24);ctx.fillStyle='#f2d487';ctx.fillText(w.clear[eras.indexOf(type)],W/2,H-21,W*.62);}
  if(data.mode==='preview'){ctx.font='9px monospace';ctx.textAlign='left';ctx.fillStyle='#d0c6b1';ctx.fillText(w.preview,12,H-12);}
  const transition=Math.max(now-warpAt<600?1-(now-warpAt)/600:0,now-upgradeAt<600?1-(now-upgradeAt)/600:0);
  if(transition>0&&motion&&fx){const x=W*(1-transition);pixel(ctx,'#b4e7df',x-3,0,3,H);ctx.globalAlpha=transition*.14;pixel(ctx,'#b5dbd5',0,0,W,H);}
  ctx.restore();if(paintedFrame.width!==W||paintedFrame.height!==H){paintedFrame.width=W;paintedFrame.height=H;}paintedFrame.getContext('2d').drawImage(ctx.canvas,0,0);hasPaintedFrame=true;draws++;return true;
 }
 function getState(){const now=clock(),m=model(now);return {visualOnly:true,mode:m.mode,preview:m.mode==='preview',era:currentEra(),actors:m.crew.map(a=>({...a,weapon:weaponFor(a,currentEra(),m.mode==='preview'&&currentEra()==='medieval'?previewState.weapon:null),action:attacks.has(String(a.id))?'attack':'idle'})),enemies:m.enemies.map(e=>({id:e.id,hp:e.hp,alive:e.alive!==false,state:e.alive===false?'fall':'standing'})),roomCleared:m.roomCleared,chestVisible:m.chestVisible,phase:m.roomCleared?'cleared':'fight',hitCount:m.hitCount,deaths:m.deaths,reducedMotion:!moving(),effects:effects(),rafActive:false,draws,art:root.OutlawsFightArt?.getState?.(),evolution:evolutionState()};}
 // A single visible-time director owns automatic DEMO evolution; never the economic epoch.
 const levels=['atari','8bit','16bit','arcade','hd2d'], EVOLUTION_MS=45000, ERA_MS=60000;
 let auto=demo,visibleMs=0,lastTick=clock(),nextGraphics=EVOLUTION_MS,nextEra=ERA_MS,evolutionCount=0,eraCount=0,timer=0,status,toggle;
 try{if(root.localStorage.getItem('outlaws:demo:evolution')==='off')auto=false;}catch{}
 function evolutionState(){return {enabled:auto,demo,visibleMs,nextGraphicsInMs:Math.max(0,nextGraphics-visibleMs),nextEraInMs:Math.max(0,nextEra-visibleMs),evolutionCount,eraCount,graphics:root.OutlawsEraArt?.getState?.().graphics||'original'};}
 const timeText=ms=>{const s=Math.ceil(ms/1000);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
 function visible(){if(doc.hidden||!map||map.closest('[hidden]'))return false;const r=map.getBoundingClientRect();return r.bottom>0&&r.top<root.innerHeight;}
 function translate(){if(!status)return;const w=words(),s=evolutionState();toggle.querySelector('span').textContent=w.toggle;toggle.title=w.help;const final=s.graphics==='hd2d';status.textContent=auto?`${final?w.done:w.next+' '+timeText(s.nextGraphicsInMs)} · ${w.era} ${timeText(s.nextEraInMs)}`:'';status.hidden=!auto;}
 function setAutomatic(value){auto=demo&&Boolean(value);lastTick=clock();if(toggle)toggle.querySelector('input').checked=auto;try{root.localStorage.setItem('outlaws:demo:evolution',auto?'on':'off');}catch{}translate();return auto;}
 function tick(){
  const now=clock(),delta=Math.min(1500,Math.max(0,now-lastTick));lastTick=now;
  if(auto&&visible()&&!root.OutlawsLoopV5?.ownsPresentation?.()&&!['fighting','opening'].includes(root.OutlawsBossDemo?.getState?.().phase)){
   visibleMs+=delta;
   if(visibleMs>=nextGraphics){const api=root.OutlawsEraArt,current=api?.getState?.().graphics,index=levels.indexOf(current),next=levels[Math.min(4,index+1)];
    if(api?.getState?.().ready&&next!==current&&api.setGraphics?.(next)!==false){evolutionCount++;upgradeAt=now;root.dispatchEvent(new CustomEvent('outlaws:visual-evolution',{detail:{graphics:next,visualOnly:true}}));}
    nextGraphics=visibleMs+EVOLUTION_MS;
   }
   // Respect an explicitly enabled Chaos clock. Otherwise the demo director owns this timer.
   if(root.OutlawsEras?.getState?.().enabled){nextEra=visibleMs+(root.OutlawsEras.getState().nextInMs||ERA_MS);}
   else if(visibleMs>=nextEra){if(root.OutlawsEras?.shift?.(eras[(eras.indexOf(currentEra())+1)%3],{preview:true,persistent:true})){eraCount++;}nextEra=visibleMs+ERA_MS;}
  }
  translate();timer=root.setTimeout(tick,1000);
 }
 function startVisualLadder(){const api=root.OutlawsEraArt;if(auto&&api?.getState?.().ready&&api.getState().graphics==='original')api.setGraphics('atari',{persist:false});}
 root.addEventListener('outlaws:era-art-ready',startVisualLadder);root.OutlawsEraArt?.whenReady?.then(startVisualLadder).catch(()=>{});startVisualLadder();
 if(map){
  map.dataset.outlawsFight='v4';const style=doc.createElement('style');style.id='outlaws-fight-v4-style';style.textContent='#heist-map[data-outlaws-fight="v4"]{filter:none!important}.owe-stage{display:none!important}.fight-evolution{font:13px/1.5 var(--ui,system-ui);color:var(--text,#ded3bc);margin:8px 0;font-variant-numeric:tabular-nums}.fight-auto{display:flex;align-items:center;gap:10px;min-height:44px}.fight-auto input{width:20px;height:20px;margin:12px}.fight-auto span{line-height:1.4}';doc.head.append(style);
  if(demo){status=doc.createElement('p');status.className='fight-evolution';status.id='outlaws-visual-evolution';status.setAttribute('aria-live','off');map.before(status);toggle=doc.createElement('label');toggle.className='fight-auto';const input=doc.createElement('input');input.type='checkbox';input.checked=auto;input.addEventListener('change',()=>setAutomatic(input.checked));toggle.append(input,doc.createElement('span'));(doc.querySelector('#oup-chaos .oup-group-body')||doc.getElementById('owe-settings'))?.append(toggle);translate();timer=root.setTimeout(tick,1000);}
 }
 root.addEventListener('outlaws:era-change',()=>{if(currentEra()!==lastEra){warpAt=clock();lastEra=currentEra();}translate();});
  root.I18N?.onChange?.(translate);doc.addEventListener('visibilitychange',()=>{lastTick=clock();});
 root.addEventListener('outlaws:gear-equipped',event=>{const d=event.detail;if(d?.visualOnly){pickups.set(String(d.id),{at:clock(),weapon:d.weapon});hasPaintedFrame=false;}});
 root.OutlawsFightScene={render,observeRoom,observeAttack,preview,clear,getState,getCrewSnapshot,drawCrew,setAutomatic,evolutionState,dispose:()=>{root.clearTimeout(timer);clear();}};
 root.dispatchEvent(new CustomEvent('outlaws:fight-scene-ready'));
})(window);

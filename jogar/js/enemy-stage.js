/* Enemies stage existing rendered results: a prop changes or disappears after an observed attack.
 * Nothing is defeated merely because an effect played. No damage, loot or simulation is calculated here.
 * Enemy sprites use the separate ARTE API. A provider can override draw(ctx,enemy).
 */
(function(root){
 'use strict';if(root.OutlawsEnemyStage)return;const doc=root.document,frames=new WeakMap(),rooms=new WeakMap();let spriteProvider=null;
 const counters={frames:0,seenProps:0,attacks:0,defeats:0,rendered:0};let presentationSerial=0;
 const kinds={medieval:['royal','knight'],modern:['security','police','drone'],future:['robot','alien']};
 const words={en:{royal:'Royal guard',knight:'Knight',security:'Bank guard',police:'Police',drone:'Police drone',robot:'Security bot',alien:'Vault guardian',note:'Enemies stage existing hits and loot. Rewards stay the same.'},pt:{royal:'Guarda real',knight:'Cavaleiro',security:'Guarda do banco',police:'Polícia',drone:'Drone policial',robot:'Robô de segurança',alien:'Guardião do cofre',note:'Inimigos encenam os ataques e o loot existentes. Os ganhos continuam iguais.'},es:{royal:'Guardia real',knight:'Caballero',security:'Guardia del banco',police:'Policía',drone:'Dron policial',robot:'Robot de seguridad',alien:'Guardián de la bóveda',note:'Los enemigos representan ataques y botín existentes. Las recompensas siguen iguales.'},fil:{royal:'Bantay ng hari',knight:'Kabalyero',security:'Bantay ng bangko',police:'Pulis',drone:'Police drone',robot:'Security bot',alien:'Bantay ng vault',note:'Ipinapakita ng kalaban ang kasalukuyang hit at loot. Pareho ang reward.'}};
 const prefs=()=>root.OutlawsJuice?.getState?.()||{effects:true,reducedMotion:false};const era=()=>root.OutlawsEras?.getState?.().era||'medieval';
 function beginFrame(ctx,now){frames.set(ctx,{now,props:new Map()});}
 function observeProp(ctx,source,x,y){const frame=frames.get(ctx);if(!frame||!Number.isFinite(x)||!Number.isFinite(y))return;const tx=Math.round(x/32),ty=Math.round(y/32);frame.props.set(tx+':'+ty,{source,x:tx*32,y:ty*32});}
 function clear(){for(const cv of [doc.getElementById('heist-map')])if(cv)rooms.delete(cv);}
 // Only the painted name box moves. World positions, sprites and staged outcomes stay untouched.
 function nameBox(ctx,name,node,used){
  const gap=2,height=10,canvasWidth=ctx.canvas.width,canvasHeight=ctx.canvas.height;
  const width=Math.min(Math.ceil(ctx.measureText(name).width)+8,Math.max(1,canvasWidth-gap*2));
  const x=Math.max(gap,Math.min(canvasWidth-gap-width,Math.round(node.x+16-width/2)));
  const maxY=Math.max(0,canvasHeight-height-gap),minY=Math.min(16,maxY);
  const preferred=Math.max(minY,Math.min(maxY,node.y-17)),step=height+gap;
  const overlaps=box=>used.some(other=>box.x<other.x+other.width+gap&&box.x+box.width+gap>other.x&&box.y<other.y+other.height+gap&&box.y+box.height+gap>other.y);
  let box={x,y:preferred,width,height};
  for(let lane=0;lane<=Math.ceil(canvasHeight/step);lane++){
   for(const offset of lane?[ -lane*step,lane*step ]:[0]){
    const candidate={x,y:Math.max(minY,Math.min(maxY,preferred+offset)),width,height};
    if(!overlaps(candidate)){used.push(candidate);return candidate;}
   }
  }
  used.push(box);return box;
 }
 function endFrame(ctx,now){
  const frame=frames.get(ctx);frames.delete(ctx);if(!frame)return;counters.frames++;counters.seenProps+=frame.props.size;
  if(doc.hidden){clear();return;}
  let room=rooms.get(ctx.canvas);if(!room){room={serial:++presentationSerial,nodes:new Map(),retired:new Set(),lastProps:new Map(),lastAttack:null};rooms.set(ctx.canvas,room);}
  // Source replacement is an observed rendered outcome. Full-room changes reset staging without fake kills.
  const changed=[...frame.props].filter(([key,p])=>room.lastProps.has(key)&&room.lastProps.get(key)!==p.source).length;
  if(changed>3){room.nodes.clear();room.retired.clear();room.serial=++presentationSerial;room.lastAttack=null;}
  for(const [key,node]of room.nodes){const prop=frame.props.get(key);if(node.state==='standing'&&(!prop||prop.source!==node.source)){
    node.state='fall';node.fellAt=now;room.retired.add(key);counters.defeats++;
  }}
  for(const [key,node]of room.nodes)if(node.state==='fall'&&now-node.fellAt>900)room.nodes.delete(key);
  for(const [key,p]of frame.props){if(room.nodes.size>=3)break;if(!room.nodes.has(key)&&!room.retired.has(key))room.nodes.set(key,{...p,key,state:'standing',born:now,fellAt:0});}
  root.OutlawsFightScene?.observeRoom?.({serial:room.serial,remainingProps:frame.props.size,cleared:frame.props.size===0&&room.retired.size>0,nodes:[...room.nodes.values()].map(n=>({id:n.key,x:n.x,y:n.y,alive:n.state==='standing',fellAt:n.fellAt}))});
  if(root.OutlawsFightScene||!prefs().effects){room.lastProps=new Map([...frame.props].map(([key,p])=>[key,p.source]));return;}
  room.lastProps=new Map([...frame.props].map(([key,p])=>[key,p.source]));
  const type=era(),labels=words[root.I18N?.lang?.()]||words.en,reduced=prefs().reducedMotion,nameBoxes=[];let index=0;
  for(const node of room.nodes.values()){
    if(node.state==='fall'&&now-node.fellAt>600)continue;const kind=kinds[type][index++%kinds[type].length],age=now-node.fellAt;
    const enemy={era:type,kind,x:node.x+4,y:node.y-7,state:node.state,frame:reduced?0:Math.floor(now/180)%3,reducedMotion:reduced};ctx.save();
    if(node.state==='fall'){if(reduced){ctx.restore();continue;}ctx.globalAlpha=Math.max(0,1-age/600);}
    const provider=spriteProvider||root.OutlawsEnemyArt?.draw,art=root.OutlawsEraArt;
    if(provider)provider(ctx,enemy);
    else if(art?.getState?.().ready){const id={royal:'king_guard',knight:'knight',security:'bank_security',police:'police',drone:'police',robot:'security_robot',alien:'alien_guardian'}[kind];art.drawEnemy(ctx,id,enemy.x-4,enemy.y,{style:root.OutlawsArcade?.getStyle?.()||'classic',graphics:art.getState().graphics,state:node.state==='fall'?'fall':'idle',direction:'down',frame:enemy.frame,scale:1});if(kind==='drone'){ctx.save();ctx.translate(enemy.x+22,enemy.y-12);root.OutlawsEquippedWeapons?.art?.drawWeapon?.(ctx,'kamikaze',.55);ctx.restore();}}
    else root.OutlawsArcade?.drawCharacter?.(ctx,enemy.x,enemy.y,{rank:0,state:node.state==='fall'?'fall':'idle',frame:enemy.frame,scale:1});
    ctx.font='7px monospace';ctx.textAlign='center';ctx.fillStyle='#151d22';const name=labels[kind],box=nameBox(ctx,name,node,nameBoxes);ctx.fillRect(box.x,box.y,box.width,box.height);ctx.fillStyle=type==='future'?'#aeeef4':type==='modern'?'#b8d1e3':'#ddc7a1';ctx.fillText(name,box.x+box.width/2,box.y+8,Math.max(1,box.width-8));
    if(node.state==='fall'&&!reduced){ctx.fillStyle='#dbc18a';for(let i=0;i<5;i++)ctx.fillRect(Math.round(node.x+16+(i-2)*age/35),Math.round(node.y+7-age/25+i%2*4),2,2);}
    ctx.restore();counters.rendered++;
  }
 }
 root.addEventListener('outlaws:visual-shot',event=>{const d=event.detail,cv=doc.getElementById('heist-map'),room=cv&&rooms.get(cv);if(!room||!d?.observed||!d.target)return;room.lastAttack={target:{...d.target},at:performance.now(),observed:true};counters.attacks++;});
 doc.addEventListener('visibilitychange',clear);doc.addEventListener('change',e=>{if(e.target.dataset?.owjSetting==='effects'&&!e.target.checked)clear();});
 root.OutlawsEnemyStage={beginFrame,observeProp,endFrame,clear,setSpriteProvider:fn=>{spriteProvider=typeof fn==='function'?fn:null;},getState:()=>({visualOnly:true,artReady:Boolean(spriteProvider||root.OutlawsEnemyArt?.draw||root.OutlawsEraArt?.getState?.().ready),fallback:'existing Common artwork only until enemy sheets finish loading',...counters})};
})(window);

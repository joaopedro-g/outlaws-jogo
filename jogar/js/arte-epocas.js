/* OUTLAWS art-only API. Does not create actors, advance a simulation or touch providers. */
(function(root){
 'use strict';if(root.OutlawsEraArt)return;
 const doc=root.document,base=new URL('../../assets/propostas/era-art/',doc.currentScript.src),P=root.OutlawsEraArtPack;
 const pixels=root.OutlawsGraphicsPixels,ctxProto=root.CanvasRenderingContext2D.prototype,rawDraw=ctxProto.drawImage;
 const KEY='outlaws:visual:graphics',levels=['original','atari','8bit','16bit','arcade','hd2d'];
 const enemyIds=['king_guard','knight','bank_security','police','security_robot','alien_guardian'],bossIds=['king_tyrant','swat_chief','alien_emperor'];
 const ranks=['#aab5cf','#70d85b','#4ca9eb','#af79ef','#ffad48','#ff65a2'];
 const images={},frames=new Map(),converted=new WeakMap(),classifications=new WeakMap(),domImages=new Map(),sceneBases=new Map();
 let graphics='original',era=root.OutlawsArcade?.getState?.().era||'medieval',ready=false,storageAvailable=true;
 try{const saved=root.localStorage.getItem(KEY);if(levels.includes(saved))graphics=saved;}catch{storageAvailable=false;}
 const reduced=root.matchMedia('(prefers-reduced-motion: reduce)');
 const pref=()=>root.OutlawsJuice?.getState?.()||{motion:true,effects:true};
 const canMove=()=>!reduced.matches&&pref().motion!==false;
 const canGlow=()=>pref().effects!==false;
 function canvas(w,h){const c=doc.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').imageSmoothingEnabled=false;return c;}
 function draw(ctx,img,...args){return rawDraw.call(ctx,img,...args);}
 function crop(name,index,cell,cols){const key=name+':'+index;if(frames.has(key))return frames.get(key);const c=canvas(cell,cell);draw(c.getContext('2d'),images[name],index%cols*cell,Math.floor(index/cols)*cell,cell,cell,0,0,cell,cell);frames.set(key,c);return c;}
 function modeOf(options){return levels.includes(options?.graphics)?options.graphics:graphics;}
 // Floors still step down in large blocks. Recognizable silhouettes keep their
 // native one-pixel mask: block averaging must not erase a hood, eye or crown.
 function identityPixels(data,mode,info){
  const rgb=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)),kind=info.kind;
  const rankColor=root.OutlawsSpriteV4?.getManifest?.().crew?.ranks?.[info.rank]?.main||ranks[info.rank]||'#55b187';
  const palette=mode==='8bit'?pixels.palettes['8bit']:kind==='actor'?['#15101f',rankColor,'#f4cc62','#f8f8e7']:kind==='weapon'?['#15101f','#d9552c','#f4cc62','#55b187','#f8f8e7']:['#15101f',info.id==='king_tyrant'?'#d9552c':'#55b187','#f4cc62','#f8f8e7'];
  const colors=palette.map(rgb),out=new Uint8ClampedArray(data.length),mapped=new Map();
  for(let i=0;i<data.length;i+=4){if(!data[i+3])continue;const r=data[i],g=data[i+1],b=data[i+2],key=(r<<16)|(g<<8)|b;let color=mapped.get(key);
   if(!color){let distance=Infinity;for(const c of colors){const d=(r-c[0])**2*.3+(g-c[1])**2*.55+(b-c[2])**2*.15;if(d<distance){distance=d;color=c;}}// Cool steel stays pale; warm fire retains orange/yellow beside it.
    if(kind==='weapon'&&r>=155&&g>=175&&b>=175)color=rgb('#f8f8e7');mapped.set(key,color);}
   out[i]=color[0];out[i+1]=color[1];out[i+2]=color[2];out[i+3]=data[i+3];
  }return out;
 }
 function convert(source,mode,block,info){if(!['atari','8bit','16bit'].includes(mode))return source;info=info||classifications.get(source)||root.OutlawsSpriteV4?.getFrameInfo?.(source);const preserve=['atari','8bit'].includes(mode)&&['actor','enemy','boss','weapon'].includes(info?.kind);let versions=converted.get(source);if(!versions){versions=new Map();converted.set(source,versions);}const key=mode+':'+(block||0)+':'+(preserve?info.kind+':'+(info.rank??info.id??info.weapon??''):'blocks');if(versions.has(key))return versions.get(key);const c=canvas(source.width,source.height),x=c.getContext('2d');draw(x,source,0,0);const data=x.getImageData(0,0,c.width,c.height);data.data.set(preserve?identityPixels(data.data,mode,info):pixels.processPixels(data.data,c.width,c.height,mode,{block}));x.putImageData(data,0,0);versions.set(key,c);if(classifications.has(source))classifications.set(c,classifications.get(source));return c;}
 function frameFor(id,state,direction,n){if(state==='walk')return ({down:0,left:3,right:6,up:9}[direction]??0)+(n%3);if(state==='attack')return 12+n%2;if(state==='hit')return 14;if(state==='fall')return 15;return 0;}
 function halo(ctx,x,y,r,color,power=.4){if(!canGlow())return;ctx.save();ctx.globalCompositeOperation='screen';const g=ctx.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.globalAlpha*=power;ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();}
 function shadow(ctx,x,y,w,h){ctx.save();ctx.fillStyle='rgba(13,17,35,.45)';ctx.beginPath();ctx.ellipse(x+w*.58,y+h*.87,w*.39,h*.08,-.2,0,Math.PI*2);ctx.fill();ctx.restore();}
 function actor(ctx,kind,id,x,y,options={}){
  if(!ready)return false;const list=kind==='enemy'?enemyIds:bossIds,row=list.indexOf(id);if(row<0)return false;
  const style=options.style||root.OutlawsArcade?.getStyle?.()||'classic',cell=kind==='enemy'?32:48,scale=Math.max(1,Math.floor(options.scale||1)),n=Math.max(0,options.frame|0),mode=modeOf(options);
  const source=crop((kind==='enemy'?'enemies':'bosses')+'-'+style,row*16+frameFor(id,options.state||'idle',options.direction||'down',n),cell,16);
  classifications.set(source,{kind,id,style});const art=convert(source,mode,mode==='atari'?Math.floor(cell/8):undefined);
  if(mode==='hd2d'){shadow(ctx,x,y,cell*scale,cell*scale);if(kind==='boss')halo(ctx,x+cell*scale/2,y+cell*scale*.48,cell*scale*.7,era==='future'?'#75dfdf':'#ffc65a',.15);}
  if(options.state==='attack'&&options.direction==='left'){ctx.save();ctx.translate(Math.round(x)+cell*scale,Math.round(y));ctx.scale(-1,1);draw(ctx,art,0,0,cell*scale,cell*scale);ctx.restore();}else draw(ctx,art,Math.round(x),Math.round(y),cell*scale,cell*scale);return true;
 }
 function drawEnemy(ctx,id,x,y,options){return actor(ctx,'enemy',id,x,y,options);}
 function drawBoss(ctx,id,x,y,options){return actor(ctx,'boss',id,x,y,options);}
 function drawLootbox(ctx,x,y,options={}){
  if(!ready)return false;const style=options.style||root.OutlawsArcade?.getStyle?.()||'classic',rank=Math.min(5,Math.max(0,options.rarity|0)),state=options.state||'closed',n=Math.max(0,options.frame|0),scale=Math.max(1,Math.floor(options.scale||1));
  const col=state==='shake'?1+n%3:state==='crack'?4+n%3:state==='burst'?7+n%3:state==='reveal'?10+n%2:0,source=crop('lootbox-'+style,rank*12+col,48,12),mode=modeOf(options);
  if(mode==='hd2d'&&['burst','reveal'].includes(state))halo(ctx,x+24*scale,y+24*scale,40*scale,ranks[rank],.45);
  draw(ctx,convert(source,mode,mode==='atari'?6:undefined),Math.round(x),Math.round(y),48*scale,48*scale);return true;
 }
 function drawReveal(ctx,x,y,options={}){
  if(!ready)return false;const rank=Math.min(5,Math.max(0,options.rarity|0)),style=options.style||'arcade',scale=Math.max(1,Math.floor(options.scale||1)),mode=modeOf(options),c=style==='arcade'?crop('characters',rank*20,24,20):crop('rank-'+rank,0,32,1),size=style==='arcade'?24:32;
  if(mode==='hd2d')halo(ctx,x+size*scale/2,y+size*scale/2,size*scale,ranks[rank],.25);draw(ctx,convert(c,mode,mode==='atari'?Math.max(3,Math.floor(size/8)):undefined,{kind:'actor',rank}),Math.round(x),Math.round(y),size*scale,size*scale);return true;
 }
 function drawEffect(ctx,kind,x,y,options={}){if(!ready)return false;const start={blast:0,smoke:8,debris:16}[kind];if(start===undefined)return false;const n=Math.max(0,options.frame|0)%8,scale=Math.max(1,Math.floor(options.scale||1)),mode=modeOf(options);draw(ctx,convert(crop('impact',start+n,64,8),mode,mode==='atari'?4:undefined),Math.round(x),Math.round(y),64*scale,64*scale);return true;}
 function processRoom(source,options={}){
  const mode=modeOf(options);if(mode!=='hd2d')return convert(source,mode,mode==='atari'?4:undefined);
  let versions=converted.get(source);if(!versions){versions=new Map();converted.set(source,versions);}const e=options.era||era,key='hd2d:'+e+':'+canGlow();if(versions.has(key))return versions.get(key);
  const c=canvas(source.width,source.height),x=c.getContext('2d');
  draw(x,source,0,0);x.save();x.beginPath();x.rect(0,0,c.width,c.height*.3);x.clip();x.filter='blur(1.25px)';draw(x,source,0,0);x.restore();
  const shade=x.createLinearGradient(0,0,c.width,c.height);shade.addColorStop(0,'rgba(8,19,35,.52)');shade.addColorStop(.5,'rgba(8,19,35,.08)');shade.addColorStop(1,'rgba(4,11,25,.5)');x.fillStyle=shade;x.fillRect(0,0,c.width,c.height);
  const keyLight=e==='future'?'#77dadd':e==='modern'?'#ffca8a':'#ffd27a';halo(x,c.width*.76,c.height*.2,c.width*.42,keyLight,.42);halo(x,c.width*.15,c.height*.84,c.width*.29,e==='future'?'#9585e8':'#8fe2ce',.16);
  // A subtle focus vignette leaves actors/props to the sharp foreground renderer.
  const vignette=x.createRadialGradient(c.width*.52,c.height*.48,c.width*.14,c.width*.5,c.height*.5,c.width*.65);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'rgba(5,9,22,.48)');x.fillStyle=vignette;x.fillRect(0,0,c.width,c.height);versions.set(key,c);return c;
 }
 function processClassic(source,info){if(graphics==='original')return source;return info.kind==='room'?processRoom(source):convert(source,graphics,graphics==='atari'?4:undefined,info);}
 function processImage(src,info={}){
  if(graphics==='original')return src;let record=domImages.get(src);
  if(!record){record={image:new Image(),ready:false,urls:new Map()};domImages.set(src,record);record.image.onload=()=>{const size=info.card?32:24,c=canvas(size,size);draw(c.getContext('2d'),record.image,0,0,size,size);record.base=c;record.ready=true;root.OutlawsArcade?.refreshArt?.();};record.image.onerror=()=>{record.error=true;};record.image.src=src;}
  if(!record.ready)return src;if(!record.urls.has(graphics))record.urls.set(graphics,convert(record.base,graphics,graphics==='atari'?4:undefined,info.card?{kind:'actor',rank:Number([...info.card.classList].find(c=>/^r-[0-5]$/.test(c))?.slice(2))||0}:undefined).toDataURL('image/png'));return record.urls.get(graphics);
 }
 function classicBase(e){if(sceneBases.has(e))return sceneBases.get(e);const L=root.OutlawsLib,m=L.map.generate('0x'+'42'.repeat(32),e==='modern'?3:e==='future'?5:1),p=L.map.paintRoom(m),c=canvas(p.w,p.h);c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(p.px),p.w,p.h),0,0);sceneBases.set(e,c);return c;}
 function sceneBase(style,e){const key='scene:'+style+':'+e;if(sceneBases.has(key))return sceneBases.get(key);const c=canvas(288,192),x=c.getContext('2d'),bg=e==='future'?'#514679':e==='modern'?'#426381':'#3d685c';x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);
  if(style==='classic'){const source=classicBase(e);draw(x,source,0,0,288,192,0,0,288,192);}else for(let y=0;y<6;y++)for(let col=0;col<9;col++){const wall=y===0||y===5||col===0||col===8||(col===4&&y===2),outer=wall&&(y===0||y===5||col===0||col===8);if(wall){x.fillStyle='#346558';x.fillRect(col*32,y*32,32,32);}draw(x,crop('scenario',wall?outer?4:3:(col+y)%3,24,8),col*32+4,y*32+4);}
  sceneBases.set(key,c);return c;
 }
 function drawScene(ctx,options={}){
  if(!ready)return false;const mode=modeOf(options),style=options.style||'arcade',e=options.era||era,w=options.width||ctx.canvas.width,h=options.height||ctx.canvas.height,time=options.time||0,moving=options.motion!==false&&canMove(),n=moving?Math.floor(time/150):0;
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,w,h);ctx.fillStyle='#111827';ctx.fillRect(0,0,w,h);const ox=Math.floor((w-288)/2),oy=Math.floor((h-192)/2);ctx.translate(ox,oy);
  const bg=sceneBase(style,e);draw(ctx,processRoom(bg,{graphics:mode,era:e}),0,0);
  for(const [index,x,y]of [[7,68,68],[11,100,100],[15,196,68],[18,260,132]]){const source=crop('scenario',index,24,8);if(mode==='hd2d'&&index===15)halo(ctx,x+12,y+10,43,'#ffc854',.52);draw(ctx,convert(source,mode,mode==='atari'?3:undefined),x,y);}
  drawLootbox(ctx,72,92,{style,graphics:mode,rarity:4,state:'closed'});
  drawEnemy(ctx,e==='modern'?'police':e==='future'?'security_robot':'king_guard',160,112,{style,graphics:mode,state:moving?'walk':'idle',direction:'left',frame:n});
  drawBoss(ctx,e==='modern'?'swat_chief':e==='future'?'alien_emperor':'king_tyrant',212,34,{style,graphics:mode,state:'idle',frame:0});
  drawReveal(ctx,108,139,{style,graphics:mode,rarity:4,scale:1});
  if(mode==='hd2d'&&moving&&canGlow()){for(let i=0;i<8;i++){const xx=30+(i*37)%230,yy=48+(i*19)%103-Math.floor(time/600+i)%6;ctx.fillStyle=i%2?'#ffdd8b':'#91dfd4';ctx.globalAlpha=.35+Math.sin(time/900+i)*.15;ctx.fillRect(xx,yy,1,1);}ctx.globalAlpha=1;}
  ctx.restore();return true;
 }
 function setGraphics(value,options={}){const next=levels.includes(value)?value:'original',previous=graphics;graphics=next;doc.documentElement.dataset.outlawsGraphics=graphics;if(options.persist!==false)try{root.localStorage.setItem(KEY,graphics);}catch{storageAvailable=false;}root.OutlawsArcade?.refreshArt?.();root.dispatchEvent(new CustomEvent('outlaws:graphics-change',{detail:{graphics,previous,visualOnly:true}}));return graphics;}
 function setup(){const css=doc.createElement('style');css.textContent='[data-outlaws-graphics]:not([data-outlaws-graphics=original]) .portrait-stage{transform:none!important}[data-outlaws-graphics]:not([data-outlaws-graphics=original]) .rank-emblem{width:24px;height:24px}[data-outlaws-graphics=hd2d] #heist-map{box-shadow:0 0 0 1px #698273,0 8px 25px #07101480}';doc.head.append(css);setGraphics(graphics,{persist:false});}
 const names=['enemies-classic','enemies-arcade','bosses-classic','bosses-arcade','lootbox-classic','lootbox-arcade','impact','characters','scenario'];
 function loadAssets(){ready=false;const promise=Promise.all(names.map(name=>new Promise((resolve,reject)=>{const img=new Image();images[name]=img;img.onload=resolve;img.onerror=()=>reject(Error('Missing art '+name));img.src=new URL((name==='characters'||name==='scenario'?'../arcade/':'')+name+'.png',base).href;})).concat(Array.from({length:6},(_,rank)=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{const c=canvas(32,32);draw(c.getContext('2d'),img,0,0,32,32);images['rank-'+rank]=c;resolve();};img.onerror=()=>reject(Error('Missing classic portrait'));img.src=new URL('../../rank-'+rank+'.png',base).href;})))).then(()=>{frames.clear();sceneBases.clear();ready=true;root.performance.mark('outlaws-era-art-ready');root.OutlawsArcade?.refreshArt?.();root.dispatchEvent(new CustomEvent('outlaws:era-art-ready'));});promise.catch(()=>{});return promise;}
 const whenReady=loadAssets();
 root.OutlawsEraArt={whenReady,retryAssets:()=>root.OutlawsEraArt.whenReady=loadAssets(),drawEnemy,drawBoss,drawLootbox,drawReveal,drawEffect,drawScene,setGraphics,processRoom,processClassic,processImage,processArcadeFrame:(source,info={})=>convert(source,graphics,graphics==='atari'?3:undefined,root.OutlawsSpriteV4?.getFrameInfo?.(source)||(info.sheet==='characters'?{kind:'actor',rank:Math.floor(info.index/20)}:undefined)),drawActorLight:(ctx,x,y,w,rank)=>{if(graphics==='hd2d'){shadow(ctx,x,y,w,w);halo(ctx,x+w*.55,y+w*.5,w*.8,ranks[rank],.08);}},classifyImage:image=>classifications.get(image)||null,getState:()=>({graphics,era,ready,storageAvailable,style:root.OutlawsArcade?.getStyle?.()||'classic',visualOnly:true,levels:[...levels],cell:{enemy:32,boss:48,lootbox:48,effect:64}})};
 root.addEventListener('outlaws:era-change',e=>{era=['medieval','modern','future'].includes(e.detail?.era)?e.detail.era:'medieval';});
 doc.addEventListener('change',e=>{if(e.target.matches?.('[data-owj-setting]'))root.setTimeout(()=>root.OutlawsArcade?.refreshArt?.(),0);});
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})(window);

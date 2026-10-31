/* Additive art adapter. It never advances a simulation, changes numbers, or accesses a provider. */
(function(root){
 'use strict';
 if(root.OutlawsArcade)return;
 const doc=root.document,pack=root.OutlawsArcadePack,CELL=24,KEY='outlaws:visual:style';
 const base=new URL('../../assets/propostas/arcade/',doc.currentScript.src);
 const v4Base=new URL('../../assets/propostas/arte-v4/',doc.currentScript.src),DEMO_KEY='outlaws:visual:style:v4-local-demo';
 const localDemo=(()=>{try{const u=new URL(root.location.href);return u.searchParams.has('demo')&&(['localhost','127.0.0.1','[::1]'].includes(u.hostname)||u.protocol==='file:');}catch{return false;}})();
 const media=root.matchMedia('(prefers-reduced-motion: reduce)');
 const meta=new WeakMap(),motions=new WeakMap(),pending=new Map(),imageRecords=new WeakMap();let painted=new WeakMap();
 const proto=root.CanvasRenderingContext2D.prototype,nativeDraw=proto.drawImage,nativePut=proto.putImageData;
 const images={},frames=new Map(),urls=new Map(),iconFrames={
  'icon-coin.png':0,'icon-sack.png':4,'icon-gem.png':5,'icon-hammer.png':6,'icon-arrows.png':30,'icon-trophy.png':12,'icon-drop.png':5
 };
 let style='classic',era='medieval',pendingIso=null,ready=false,celebrateUntil=0,settings,worldWidth=544,portraitTimer=null;
 const portraits=new Set();
 // Read the product setting without wrapping its API or pausing the game loop.
 function motionEnabled(){if(media.matches)return false;const state=root.OutlawsJuice?.getState?.();if(state)return state.motion!==false;try{return root.localStorage.getItem('outlaws:juice:motion')!=='off';}catch{return true;}}
 try{style=localDemo?(root.localStorage.getItem(DEMO_KEY)==='classic'?'classic':'arcade'):(root.localStorage.getItem(KEY)==='arcade'?'arcade':'classic');}catch{if(localDemo)style='arcade';}
 const counters={rooms:0,props:0,actors:0,roads:0};
 const palettes={medieval:{floor:'#3d685c',wall:'#263d45'},modern:{floor:'#426381',wall:'#29364e'},future:{floor:'#514679',wall:'#292545'}};
 const eraColors={modern:{'61,104,92':[66,99,129],'71,115,101':[86,125,151],'54,94,85':[49,75,101],'53,94,83':[55,85,111],'79,156,137':[96,132,158],'140,222,193':[166,212,228],'192,245,213':[218,244,255],'52,101,88':[57,83,115]},future:{'61,104,92':[81,70,121],'71,115,101':[105,92,151],'54,94,85':[58,48,92],'53,94,83':[64,56,100],'79,156,137':[113,100,168],'140,222,193':[134,222,221],'192,245,213':[211,255,249],'52,101,88':[64,58,107]}};
 const words={en:{style:'Style',classic:'Classic',arcade:'Arcade',hint:'Arcade pixel art. The original style stays available.',pan:'Swipe the room to see the full grid.'},pt:{style:'Estilo',classic:'Clássico',arcade:'Arcade',hint:'Arte arcade em pixel. O estilo original continua disponível.',pan:'Deslize a sala para ver a grade inteira.'},es:{style:'Estilo',classic:'Clásico',arcade:'Arcade',hint:'Arte arcade en píxeles. El estilo original sigue disponible.',pan:'Desliza la sala para ver toda la cuadrícula.'},fil:{style:'Style',classic:'Classic',arcade:'Arcade',hint:'Arcade pixel art. Available pa rin ang orihinal na estilo.',pan:'I-swipe ang silid para makita ang buong grid.'}};
 const text=()=>words[root.I18N?.lang?.()]||words.en;
 function fingerprint(w,h,data){let hash=2166136261;for(let i=0;i<data.length;i++){hash=Math.imul(hash^data[i],16777619);}return w+':'+h+':'+(hash>>>0);}
 function remember(p,info){if(!p?.px)return p;pending.set(fingerprint(p.w,p.h,p.px),info);if(pending.size>96)pending.delete(pending.keys().next().value);return p;}
 const lib=root.OutlawsLib;
 if(lib){
  for(const [name,kind]of [['paintRoom','room'],['paintProp','prop']]){
   const original=lib.map[name];
   lib.map[name]=function(...args){return remember(original.apply(this,args),kind==='room'?{kind,room:args[0]}:{kind,prop:args[0],terrain:args[1]});};
  }
  const original=lib.sprite.build;
  lib.sprite.build=function(iso){pendingIso={iso,at:performance.now()};return original.apply(this,arguments);};
 }
 function rankOfIso(iso){const color=iso?.rank?.rarity?.[0];return Math.max(0,lib?.traits.RANKS.findIndex(r=>r.rarity?.[0]===color)??0);}
 proto.putImageData=function(image,...args){
  const result=nativePut.call(this,image,...args);
  const key=fingerprint(image.width,image.height,image.data),known=pending.get(key);
  if(known)meta.set(this.canvas,known);
  else if(pendingIso&&performance.now()-pendingIso.at<100&&(image.width===34||image.width===32)&&image.height===image.width){
   meta.set(this.canvas,{kind:'actor',iso:pendingIso.iso,rank:rankOfIso(pendingIso.iso),flipped:false});
  }
  return result;
 };
 function frame(sheet,index){const key=sheet+':'+index+(sheet==='scenario'?':'+era:'');const finish=c=>root.OutlawsEraArt?.processArcadeFrame?.(c,{sheet,index,era})||c;const revised=sheet==='characters'?root.OutlawsSpriteV4?.getCrewFrameByIndex?.(index,{era}):null;if(revised)return finish(revised);if(frames.has(key))return finish(frames.get(key));const c=doc.createElement('canvas');c.width=c.height=CELL;const x=c.getContext('2d');x.imageSmoothingEnabled=false;const columns=sheet==='characters'?20:8;nativeDraw.call(x,images[sheet],(index%columns)*CELL,Math.floor(index/columns)*CELL,CELL,CELL,0,0,CELL,CELL);if(sheet==='scenario'&&eraColors[era]){const image=x.getImageData(0,0,CELL,CELL),d=image.data;for(let i=0;i<d.length;i+=4){const color=eraColors[era][d[i]+','+d[i+1]+','+d[i+2]];if(color){d[i]=color[0];d[i+1]=color[1];d[i+2]=color[2];}}nativePut.call(x,image,0,0);}frames.set(key,c);return finish(c);}
 function tile(name){return pack.scenario.frames[name]?.index??pack.scenario.order.indexOf(name);}
 function drawTile(ctx,name,x,y,scale=1){const index=typeof name==='number'?name:tile(name);if(index<0)return;const s=Math.max(1,Math.floor(scale));nativeDraw.call(ctx,frame('scenario',index),Math.round(x),Math.round(y),CELL*s,CELL*s);}
 function drawItem(ctx,index,x,y,scale=1){const s=Math.max(1,Math.floor(scale));nativeDraw.call(ctx,frame('items',index),Math.round(x),Math.round(y),CELL*s,CELL*s);}
 function drawCharacter(ctx,x,y,options={}){
  const rank=Math.min(5,Math.max(0,options.rank|0)),state=options.state||'idle',dir=options.direction||'down',n=options.frame||0;
  const starts={down:2,left:5,right:8,up:11},col=state==='walk'?(starts[dir]??2)+(n%3):state==='celebrate'?14+(n%3):state==='fall'?17+(n%3):n%2;
  const s=Math.max(1,Math.floor(options.scale||1));nativeDraw.call(ctx,frame('characters',rank*20+col),Math.round(x),Math.round(y),CELL*s,CELL*s);
  if(era==='future'&&!root.OutlawsSpriteV4?.getState().ready){ctx.fillStyle='#80e7e4';ctx.fillRect(Math.round(x)+9*s,Math.round(y)+10*s,5*s,s);}
 }
 function replacement(source,info){
  let versions=painted.get(source);if(!versions){versions=new Map();painted.set(source,versions);}if(versions.has(era))return versions.get(era);
  const c=doc.createElement('canvas');c.width=source.width;c.height=source.height;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
  const revised=root.OutlawsSpriteV4;
  if(info.kind==='room'&&revised?.drawRoom(x,{room:info.room,era})){counters.rooms++;}
  else if(info.kind==='prop'&&revised?.drawWorldTile(x,{name:({o:'crate','$':'chest_closed',gold:'vault_closed'})[info.prop]||'crate',era,x:Math.floor((c.width-32)/2),y:Math.floor((c.height-32)/2)})){counters.props++;}
  else if(info.kind==='room'){
   const room=info.room,p=palettes[era]||palettes.medieval;for(let yy=0;yy<room.h;yy++)for(let xx=0;xx<room.w;xx++){
    const wall=room.grid[yy][xx]==='#',outer=wall&&(xx===0||yy===0||xx===room.w-1||yy===room.h-1);x.fillStyle=wall?p.wall:p.floor;x.fillRect(xx*32,yy*32,32,32);
    if(outer){x.fillStyle=era==='modern'?'#395373':era==='future'?'#403a6b':'#346558';x.fillRect(xx*32,yy*32,32,32);x.fillStyle=era==='modern'?'#a6d4e4':era==='future'?'#86dedd':'#8cdec1';if(yy===0||yy===room.h-1)x.fillRect(xx*32,yy*32+9,32,5);else x.fillRect(xx*32+9,yy*32,5,32);}
    drawTile(x,wall?(outer?'wall_edge':'wall_center'):((xx+yy)%3===0?'floor_a':(xx+yy)%3===1?'floor_b':'floor_c'),xx*32+4,yy*32+4);
    if(!wall&&era==='future'&&(xx+yy)%4===0){x.fillStyle='#65bac4';x.fillRect(xx*32+2,yy*32+2,2,1);}
   }counters.rooms++;
  }else{
   const names={o:'crate','$':'chest_closed',gold:'vault_closed'};
   drawTile(x,names[info.prop]||'crate',Math.floor((c.width-CELL)/2),Math.floor((c.height-CELL)/2));counters.props++;
  }const result=info.kind==='room'?(root.OutlawsEraArt?.processRoom?.(c)||c):c;versions.set(era,result);return result;
 }
 function isHeist(ctx){return ctx.canvas.id==='heist-map';}
 function isRoad(ctx){return ctx.canvas.closest?.('.sack')!=null;}
 proto.drawImage=function(source,...args){
  const info=meta.get(source);
  if(info?.kind==='room'&&isHeist(this)&&worldWidth!==source.width){worldWidth=source.width;integerFit();}
  // Record the JP renderer's mirrored offscreen sprite without changing it.
  if(info?.kind==='actor'&&!isHeist(this)&&!isRoad(this)&&this.canvas.width===source.width&&this.canvas.height===source.height){meta.set(this.canvas,{...info,flipped:!info.flipped});}
  if(style==='arcade'&&ready&&isRoad(this)&&source.height===48){
   if(source.width===34){if(!root.OutlawsSpriteV4?.drawWorldTile(this,{name:'arrival',era,x:Number(args[0])+1,y:Number(args[1])+16}))drawTile(this,'castle',Number(args[0])+5,Number(args[1])+22);counters.roads++;return;}
   if(source.width===148){let versions=painted.get(source);if(!versions){versions=new Map();painted.set(source,versions);}if(!versions.has(era)){const c=doc.createElement('canvas');c.width=148;c.height=48;const x=c.getContext('2d');if(!root.OutlawsSpriteV4?.drawRoad(x,{era,width:148,height:48})){x.fillStyle=palettes[era].floor;x.fillRect(0,0,148,48);for(let i=0;i<7;i++)drawTile(x,'road_center',i*24,24);}versions.set(era,c);}counters.roads++;return nativeDraw.call(this,versions.get(era),...args);}
  }
  if(style!=='arcade'||!ready||(!isHeist(this)&&!isRoad(this))||!info){const display=info&&(isHeist(this)||isRoad(this))?root.OutlawsEraArt?.processClassic?.(source,info)||source:source;return nativeDraw.call(this,display,...args);}
  if(info.kind==='room'||info.kind==='prop')return nativeDraw.call(this,replacement(source,info),...args);
  if(info.kind==='actor'){
   const sliced=args.length===8;if(sliced&&args[1]>0)return;
   const dx=sliced?args[4]:args[0],dy=sliced?args[5]:args[1],now=performance.now();
   const key=info.iso||source;let m=motions.get(key);
   if(!m){m={x:dx,y:dy,until:0,dir:info.flipped?'left':'right'};motions.set(key,m);}
   const mx=dx-m.x,my=dy-m.y;if(Math.abs(mx)+Math.abs(my)>0){m.dir=Math.abs(mx)>=Math.abs(my)?(mx<0?'left':'right'):(my<0?'up':'down');m.until=now+140;}m.x=dx;m.y=dy;
   const animate=motionEnabled(),state=animate&&celebrateUntil>now?'celebrate':animate&&now<m.until?'walk':'idle';
   root.OutlawsEraArt?.drawActorLight?.(this,dx,dy,source.width,info.rank);drawCharacter(this,dx+Math.floor((source.width-CELL)/2),dy+4,{rank:info.rank,state,direction:m.dir,frame:animate?Math.floor(now/(state==='walk'?130:400)):0});counters.actors++;
   return;
  }return nativeDraw.call(this,source,...args);
 };
 function url(sheet,index){const key=sheet+':'+index+(sheet==='characters'?':'+era:'');if(!urls.has(key))urls.set(key,frame(sheet,index).toDataURL('image/png'));return urls.get(key);}
 function rankOfCard(card){const name=[...card.classList].find(v=>/^r-[0-5]$/.test(v));if(name)return +name.slice(2);const rc=card.style.getPropertyValue('--rc').trim().toUpperCase();return Math.max(0,['#A7ADB2','#6CC24A','#4AA3F0','#B06CF0','#F5A623','#FF4F5E'].indexOf(rc));}
 function skinImage(img){
  const src=img.getAttribute('src')||'';if(src.includes('/arcade/'))return;
  const candidate=img.closest('.card,.rv-card,.fuse-pick');
  const card=candidate&&candidate.querySelector('img')===img?candidate:null;let record=imageRecords.get(img);
  if(!record){const filename=src.split('/').pop()?.split('?')[0];if(!card&&iconFrames[filename]===undefined&&filename!=='icon-hood.png'&&filename!=='icon-chest.png')return;record={src,card,filename};imageRecords.set(img,record);}
  if(style==='classic'){const src=root.OutlawsEraArt?.processImage?.(record.src,record)||record.src;if(img.getAttribute('src')!==src)img.setAttribute('src',src);img.classList.remove('arcade-sprite');return;}
  if(!ready)return;
  const now=performance.now(),animate=motionEnabled(),pose=record.card?.classList.contains('st-capturado')?19:animate&&celebrateUntil>now?14+Math.floor(now/130)%3:animate?Math.floor(now/500)%2:0;
  const target=record.card?url('characters',rankOfCard(record.card)*20+pose):record.filename==='icon-hood.png'?url('characters',0):record.filename==='icon-chest.png'?url('scenario',tile('chest_closed')):url('items',iconFrames[record.filename]);
  if(img.getAttribute('src')!==target)img.setAttribute('src',target);if(record.card){img.classList.add('arcade-sprite');portraits.add(img);}
 }
 function animatePortraits(){if(portraitTimer!==null)root.clearTimeout(portraitTimer);portraitTimer=null;if(style!=='arcade'||!ready||doc.hidden)return;for(const img of portraits){if(!img.isConnected){portraits.delete(img);continue;}const r=img.getBoundingClientRect();if(r.bottom>=0&&r.top<innerHeight)skinImage(img);}/* A quiet setting check also catches programmatic setMotion() without changing that API. */portraitTimer=root.setTimeout(animatePortraits,motionEnabled()?160:500);}
 function scan(node){if(node.nodeType!==1)return;if(node.tagName==='IMG')skinImage(node);node.querySelectorAll?.('img').forEach(skinImage);const emblems=[...(node.matches?.('.rank-emblem')?[node]:[]),...node.querySelectorAll('.rank-emblem')];emblems.forEach(svg=>{const card=svg.closest('.card,.rv-card,.fuse-pick');svg.style.backgroundImage=style==='arcade'&&ready&&card?`url("${url('items',8+rankOfCard(card))}")`:'';});}
 // Integer enlargement, or reciprocal powers of two on small screens. The
 // complete room is fitted in CSS; engine coordinates and canvas pixels stay intact.
 function fitScale(available,width){if(available>=width)return Math.min(2,Math.floor(available/width));let scale=1;while(width*scale>available&&scale>1/64)scale/=2;return scale;}
 function integerFit(){const cv=doc.getElementById('heist-map');if(cv){const w=worldWidth,available=cv.parentElement.clientWidth;if(available>0)cv.style.setProperty('--arcade-map-width',w*fitScale(available,w)+'px');}for(const cv2 of doc.querySelectorAll('.sack canvas')){const available=cv2.parentElement.clientWidth;if(available>0)cv2.style.setProperty('--arcade-road-width',148*fitScale(available,148)+'px');}}
 function translate(){const t=text();if(settings){settings.querySelector('label').textContent=t.style;settings.querySelector('[value=classic]').textContent=t.classic;settings.querySelector('[value=arcade]').textContent=t.arcade;settings.querySelector('p').textContent=t.hint;}const hint=doc.querySelector('.arcade-pan-hint');if(hint)hint.textContent=t.pan;}
 function setStyle(value,persist=true){style=value==='arcade'?'arcade':'classic';doc.documentElement.dataset.outlawsStyle=style;if(persist)try{root.localStorage.setItem(KEY,style);if(localDemo)root.localStorage.setItem(DEMO_KEY,style);}catch{}scan(doc.body);if(settings)settings.querySelector('select').value=style;integerFit();animatePortraits();root.dispatchEvent(new CustomEvent('outlaws:style-change',{detail:{style,era}}));}
 function loadV4(){const load=file=>new Promise((resolve,reject)=>{const script=doc.createElement('script');script.src=new URL(file,v4Base).href;script.onload=resolve;script.onerror=()=>reject(Error('Sprite v4 unavailable'));doc.head.appendChild(script);});const available=root.OutlawsSpriteV4?root.OutlawsSpriteV4.whenReady:(root.OutlawsSpriteV4Manifest?Promise.resolve():load('manifest.js')).then(()=>load('api.js')).then(()=>root.OutlawsSpriteV4.whenReady);available.then(()=>{urls.clear();frames.clear();painted=new WeakMap();scan(doc.body);doc.documentElement.dataset.outlawsSpriteV4='ready';}).catch(()=>{doc.documentElement.dataset.outlawsSpriteV4='fallback';root.dispatchEvent(new CustomEvent('outlaws:sprite-v4-error',{detail:{code:'asset-unavailable'}}));});}
 function setup(){
  const css=doc.createElement('style');css.textContent=`.arcade-setting{border:1px solid #8c6a29;padding:12px;margin:12px 0}.arcade-setting label{display:block;margin-bottom:8px;font-weight:700}.arcade-setting select{font:inherit;background:#e6d3a8;color:#2a1a0e;border:2px solid #3e2b16;padding:8px;width:100%}.arcade-setting p{font-size:12px;line-height:1.45}.arcade-pan-hint{display:none}[data-outlaws-style=arcade] #heist-map{width:var(--arcade-map-width,544px)!important;max-width:none!important;image-rendering:pixelated!important}[data-outlaws-style=arcade] .heist{overflow-x:auto;scrollbar-width:thin;scrollbar-color:#d9a441 #22170d}[data-outlaws-style=arcade] .arcade-sprite{width:96px!important;height:96px!important;animation:none!important;image-rendering:pixelated}[data-outlaws-style=arcade] .rank-emblem{background-size:100% 100%;image-rendering:pixelated}[data-outlaws-style=arcade] .rank-emblem use{visibility:hidden}[data-outlaws-style=arcade] .sack canvas{width:var(--arcade-road-width,296px)!important;max-width:none;image-rendering:pixelated}[data-outlaws-style=arcade] .sack{overflow-x:auto}@media(max-width:600px){[data-outlaws-style=arcade] .arcade-pan-hint{display:block;font:12px/1.5 var(--body);color:var(--text-dim);margin:8px 0}}`;
  css.textContent+='[data-outlaws-style=arcade] .col-side,[data-outlaws-style=arcade] .panel,[data-outlaws-style=arcade] .pbody,[data-outlaws-style=arcade] .heist,[data-outlaws-style=arcade] .sack{min-width:0;max-width:100%}[data-outlaws-style=arcade] :is(#heist-map,.sack canvas){max-width:100%!important}[data-outlaws-style=arcade] :is(.heist,.sack){overflow-x:hidden}[data-outlaws-style=arcade] .arcade-pan-hint{display:none}[data-outlaws-style=arcade] .portrait-stage{transform:none!important}';
  doc.head.appendChild(css);const dialog=doc.getElementById('ajustes');if(dialog){settings=doc.createElement('div');settings.className='arcade-setting';settings.innerHTML='<label for="outlaws-art-style"></label><select id="outlaws-art-style"><option value="classic"></option><option value="arcade"></option></select><p></p>';dialog.querySelector('h3')?.after(settings);settings.querySelector('select').addEventListener('change',e=>setStyle(e.target.value));}
  const heist=doc.querySelector('.heist');if(heist){const hint=doc.createElement('p');hint.className='arcade-pan-hint';heist.before(hint);}
  const observer=new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)scan(n);integerFit();});observer.observe(doc.body,{childList:true,subtree:true});
  root.I18N?.onChange?.(()=>{translate();scan(doc.body);});translate();setStyle(style,false);loadV4();
 }
 root.addEventListener('outlaws:era-change',e=>{const next=e.detail?.era||root.OutlawsEras?.getState?.().era||'medieval';era=palettes[next]?next:'medieval';urls.clear();if(doc.body)scan(doc.body);root.dispatchEvent(new CustomEvent('outlaws:arcade-era',{detail:{style,era}}));});
 root.addEventListener('outlaws:juice',e=>{if(['success','rank','unlock'].includes(e.detail?.type))celebrateUntil=performance.now()+650;});
 root.addEventListener('resize',integerFit);
 doc.addEventListener('change',e=>{if(e.target.matches?.('[data-owj-setting="motion"]'))root.queueMicrotask(animatePortraits);});
 media.addEventListener('change',animatePortraits);
 root.addEventListener('storage',e=>{if(e.key==='outlaws:juice:motion')animatePortraits();});
 doc.addEventListener('visibilitychange',animatePortraits);
 const whenReady=Promise.all(['characters','scenario','items'].map(name=>new Promise((resolve,reject)=>{const img=new Image();images[name]=img;img.onload=resolve;img.onerror=()=>reject(Error('Missing Arcade '+name));img.src=new URL(name+'.png',base).href;}))).then(()=>{ready=true;frames.clear();if(doc.body)scan(doc.body);integerFit();animatePortraits();root.dispatchEvent(new CustomEvent('outlaws:arcade-ready'));});
 root.OutlawsArcade={setStyle,getStyle:()=>style,whenReady,drawCharacter,drawTile,drawItem,refreshArt:()=>{urls.clear();painted=new WeakMap();if(doc.body)scan(doc.body);integerFit();},getState:()=>({style,era,ready,cell:CELL,motionEnabled:motionEnabled(),counters:{...counters}})};
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})(window);

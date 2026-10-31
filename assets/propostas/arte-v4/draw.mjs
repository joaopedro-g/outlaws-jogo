/* Original OUTLAWS pixel drawings. Integers, binary alpha, Node built-ins only. */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {buildWorld,worldTile} from './world.mjs';
const require=createRequire(import.meta.url),{Canvas}=require('../../../tools/arcade-pixels.cjs');
const DIR=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const I='#141c2c',D='#29394e',WHITE='#fff4d4',STEEL='#b4dbe3',STEELD='#537f91',GOLD='#ffd568',WOOD='#ac673b',FIRE='#ff692c',HOT='#ffcd55',RED='#c73140',CYAN='#65f7e3';
const ranks=[
 {key:'common',main:'#9aa8bc',shade:'#4f637d',light:'#e0ebed',skin:'#e7b383',dark:'#a3684c',mark:'satchel'},
 {key:'uncommon',main:'#5fd85a',shade:'#246c45',light:'#bdf27c',skin:'#d59866',dark:'#915038',mark:'dagger'},
 {key:'rare',main:'#45b5ef',shade:'#225e92',light:'#abe8ff',skin:'#f3c188',dark:'#b9784d',mark:'quiver'},
 {key:'epic',main:'#b482f4',shade:'#613d94',light:'#ead1ff',skin:'#dfaa76',dark:'#9d6048',mark:'feather'},
 {key:'legendary',main:'#ffb43e',shade:'#aa5931',light:'#ffe990',skin:'#e7ad6d',dark:'#a96742',mark:'key'},
 {key:'mythic',main:'#fa6397',shade:'#93374f',light:'#ffc1d6',skin:'#f0c991',dark:'#b27c50',mark:'ruby'}
];
const eras=['medieval','modern','future'];
const weaponIds=['sword','flamesword','bow','staff','ak','awp','grenade','taser','laser','beam','energyblade','kamikaze','combatdrone'];
const aliases={fire_sword:'flamesword','fire-sword':'flamesword',fireSword:'flamesword','ak-47':'ak',ak47:'ak',sniper:'awp',laser_pistol:'laser','laser-pistol':'laser',ray_gun:'beam','ray-gun':'beam',energy_saber:'energyblade','energy-saber':'energyblade',drone:'combatdrone'};
const actorStates=[['idle','down',0],['idle','down',1],...['down','left','right','up'].flatMap(dir=>[0,1,2].map(frame=>['walk',dir,frame])),...[0,1,2].map(f=>['celebrate','down',f]),...[0,1,2].map(f=>['fall','right',f]),...['right','down','left','up'].flatMap(dir=>[0,1,2,3,4,5,6,7].map(f=>['attack',dir,f]))];
const animations={idle:[0,1],walkDown:[2,3,4],walkLeft:[5,6,7],walkRight:[8,9,10],walkUp:[11,12,13],celebrate:[14,15,16],fall:[17,18,19],attackRight:[20,21,22,23,24,25,26,27],attackDown:[28,29,30,31,32,33,34,35],attackLeft:[36,37,38,39,40,41,42,43],attackUp:[44,45,46,47,48,49,50,51]};
const rows=weaponIds.flatMap(id=>id==='bow'?['normal','explosive','fire','triple','lightning'].map(variant=>({id,variant})):id==='staff'?['fire','lightning','ice','heal','frog'].map(variant=>({id,variant})):[{id,variant:'normal'}]);
const timings={sword:[90,80,60,70,80,100,100,120],flamesword:[90,80,60,70,90,100,100,120],bow:[100,100,65,65,80,80,80,80],staff:[110,90,80,70,70,90,90,100],ak:[75,55,45,55,65,70,75,90],awp:[110,100,50,65,75,80,80,100],grenade:[100,90,70,70,75,90,100,110],taser:[100,70,60,60,80,90,90,100],laser:[85,65,50,65,75,80,90,100],beam:[110,90,60,70,75,80,90,100],energyblade:[90,80,60,70,80,100,100,120],kamikaze:[100,80,70,75,75,90,100,100],combatdrone:[90,80,60,70,80,90,90,100]};
function outlineRect(c,x,y,w,h,color){c.rect(x,y,w,h,I);c.rect(x+1,y+1,w-2,h-2,color);}
function circle(c,x,y,r,color){for(let yy=-r;yy<=r;yy++)for(let xx=-r;xx<=r;xx++)if(xx*xx+yy*yy<=r*r)c.set(x+xx,y+yy,color);}
function stroke(c,points,color,width=1){for(let j=1;j<points.length;j++){const [a,b]=points[j-1],[x,y]=points[j];for(let d=0;d<width;d++)c.line(a+d,b,x+d,y,color);}}
function mirror(source){const out=new Canvas(source.w,source.h);for(let y=0;y<source.h;y++)for(let x=0;x<source.w;x++){const i=(y*source.w+x)*4;if(source.pixels[i+3])out.set(source.w-x-1,y,[...source.pixels.subarray(i,i+4)]);}return out;}
function fallen(source,frame){const out=new Canvas(24,24);for(let y=0;y<24;y++)for(let x=0;x<24;x++){const i=(y*24+x)*4;if(source.pixels[i+3])out.set(23-y,x+1,[...source.pixels.subarray(i,i+4)]);}if(frame===2)out.rect(4,22,15,1,D);return out;}
function crew(rank,era,state,dir,step){
 const c=new Canvas(24,24),r=ranks[rank],profile=dir==='right'||dir==='left',back=dir==='up',bob=(state==='walk'||state==='idle')&&step===1?1:0,walk=state==='walk'?[-1,1,0][step]:0,celebrate=state==='celebrate';
 const y=bob,modern=era==='modern',space=era==='future';
 // Feet anchor remains stable. Clothing is different; face, color and signature stay the same.
 if(!modern&&!space){c.poly([[6,12+y],[17,12+y],[20,21],[15,22],[11,21],[4,22],[3,20]],I);c.poly([[7,13+y],[16,13+y],[18,20],[13,21],[11,20],[5,21]],r.shade);c.line(6,20,10,20,r.main);c.line(14,20,17,20,r.main);}
 outlineRect(c,6+walk,20,5,3,I);c.rect(7+walk,20,3,1,STEELD);outlineRect(c,13-walk,20,5,3,I);c.rect(14-walk,20,3,1,STEELD);
 outlineRect(c,6,13+y,12,8,space?STEELD:modern?D:r.shade);c.rect(8,14+y,8,5,r.main);c.rect(9,14+y,2,5,r.light);c.rect(15,15+y,2,4,r.shade);
 if(modern){c.rect(7,15+y,3,4,D);c.rect(14,15+y,3,4,D);c.rect(8,15+y,2,1,r.light);c.rect(14,15+y,2,1,r.main);c.rect(10,19,4,1,STEELD);}
 if(space){c.rect(6,15+y,2,4,STEEL);c.rect(16,15+y,2,4,STEEL);c.rect(10,15+y,4,3,D);c.rect(11,15+y,2,1,r.light);c.rect(11,17+y,2,1,r.main);}
 const armY=celebrate?8+[1,0,1][step]:15+y;
 outlineRect(c,3,armY,4,5,r.shade);outlineRect(c,17,armY,4,5,r.shade);c.rect(4,armY+3,2,2,r.skin);c.rect(18,armY+3,2,2,r.skin);
 if(space){c.rect(4,armY+3,2,2,STEEL);c.rect(18,armY+3,2,2,STEEL);}
 const hood=modern?[[5,2+y],[18,2+y],[20,4+y],[20,12+y],[17,15+y],[6,15+y],[3,12+y],[3,5+y]]:[[8,1+y],[16,1+y],[19,4+y],[21,9+y],[20,13+y],[17,16+y],[6,16+y],[3,13+y],[2,9+y],[4,4+y]];
 c.poly(hood,I);c.poly(hood.map(([x,yy])=>[x<12?x+1:x-1,yy<8?yy+1:yy-1]),r.main);c.rect(16,5+y,3,8,r.shade);c.line(6,4+y,9,2+y,r.light);c.line(5,5+y,5,8+y,r.light);
 if(space){c.line(7,2+y,16,2+y,STEEL);c.line(4,6+y,4,11+y,STEEL);c.rect(2,7+y,2,5,r.shade);c.rect(20,7+y,2,5,r.shade);}
 if(back){c.rect(7,8+y,10,5,r.shade);c.rect(9,9+y,6,2,modern?STEELD:r.main);c.rect(11,9+y,2,2,r.light);}
 else if(profile){outlineRect(c,11,6+y,8,8,space?'#24475b':r.shade);c.rect(12,7+y,6,4,r.skin);c.rect(13,8+y,3,2,WHITE);c.set(15,9+y,I);c.line(13,7+y,16,8+y,I);c.rect(12,11+y,6,3,modern?I:r.shade);if(space)c.line(12,6+y,17,6+y,STEEL);}
 else{outlineRect(c,6,6+y,12,9,space?'#24475b':r.shade);c.rect(7,7+y,10,5,r.skin);c.rect(8,8+y,3,2,WHITE);c.rect(13,8+y,3,2,WHITE);c.set(rank%2?10:9,9+y,I);c.set(rank%2?14:15,9+y,I);if(rank!==0){c.line(8,7+y,10,8+y,I);c.line(13,8+y,15,7+y,I);}c.rect(7,12+y,10,2,modern?I:r.shade);c.rect(8,12+y,3,1,r.light);if(space){c.line(7,6+y,16,6+y,STEEL);c.set(16,7+y,WHITE);}}
 // The six signatures persist across all three costumes.
 if(rank===0){outlineRect(c,3,17,5,5,WOOD);c.rect(4,18,3,1,GOLD);c.set(5,20,I);}
 if(rank===1){c.line(18,17,20,21,I);c.line(19,17,21,20,STEEL);c.set(20,17,WHITE);c.rect(18,20,3,1,WOOD);}
 if(rank===2){outlineRect(c,18,14,4,7,WOOD);c.line(19,10,19,16,STEEL);c.line(21,11,21,16,STEEL);c.set(19,10,WHITE);c.set(21,11,WHITE);}
 if(rank===3){c.poly([[16,4+y],[17,0],[21,1],[22,3],[19,5+y]],I);c.poly([[17,3+y],[18,1],[20,2],[21,3],[18,4+y]],r.light);c.line(17,3+y,20,2,WHITE);}
 if(rank===4){outlineRect(c,17,16,5,4,GOLD);c.rect(18,17,2,1,I);c.rect(19,19,2,3,GOLD);c.set(21,21,GOLD);}
 if(rank===5){c.poly([[11,0+y],[14,3+y],[11,6+y],[8,3+y]],I);c.poly([[11,1+y],[13,3+y],[11,5+y],[9,3+y]],GOLD);c.rect(10,2+y,2,2,RED);c.set(10,2+y,WHITE);if(!back)c.rect(10,16+y,4,2,GOLD);}
 if(state==='attack'){outlineRect(c,17,8,6,5,r.shade);c.rect(20,10,2,2,space?STEEL:r.skin);c.rect(17,9,2,2,r.main);if(step===1)c.line(18,8,20,8,r.light);if(step===3)c.rect(6,20,4,1,r.light);}
 if(state==='fall'&&step>0)return fallen(c,step);
 return dir==='left'?mirror(c):c;
}
function sword(c,x,y,angle,fire,step,energy=false){
 const rad=angle*Math.PI/180,ux=Math.cos(rad),uy=Math.sin(rad),vx=-uy,vy=ux;
 const p=(a,b)=>[Math.round(x+ux*a+vx*b),Math.round(y+uy*a+vy*b)];
 const poly=(points,color)=>c.poly(points.map(([a,b])=>p(a,b)),color);
 poly([[-5,-2],[0,-2],[0,2],[-5,2]],I);poly([[-4,-1],[0,-1],[0,1],[-4,1]],WOOD);
 poly([[-1,-6],[2,-6],[2,6],[-1,6]],I);poly([[0,-5],[1,-5],[1,5],[0,5]],energy?STEEL:GOLD);
 poly([[2,-3],[19,-3],[25,0],[19,3],[2,3]],I);poly([[3,-2],[19,-2],[23,0],[19,2],[3,2]],energy?CYAN:STEEL);poly([[4,-2],[19,-2],[22,0],[4,0]],energy?WHITE:WHITE);poly([[4,1],[19,1],[21,0],[4,2]],energy?'#239fbc':STEELD);
 if(fire)for(let i=4;i<22;i+=4){const side=(i/4+step)%2?1:-1,reach=4+(i+step)%4;poly([[i-2,side*2],[i-1,side*reach],[i+1,side*(reach+1)],[i+2,side*2]],FIRE);poly([[i-1,side*2],[i,side*(reach-1)],[i+1,side*2]],HOT);const [px,py]=p(i,side*2);c.set(px,py,WHITE);}
}
function gun(c,x,y,id,recoil=0){x-=recoil;
 if(id==='ak'){c.poly([[x-8,y-5],[x+3,y-4],[x+5,y],[x-7,y+3]],I);c.rect(x-7,y-3,9,4,WOOD);c.line(x-6,y-3,x,y-3,HOT);outlineRect(c,x,y-5,14,7,D);c.rect(x+12,y-3,10,3,I);c.rect(x+13,y-3,8,1,STEEL);c.rect(x+4,y-5,4,2,WOOD);c.poly([[x+5,y+1],[x+10,y+1],[x+8,y+9],[x+3,y+8]],I);c.poly([[x+6,y+2],[x+8,y+2],[x+6,y+7],[x+4,y+6]],STEELD);c.rect(x-1,y+1,4,6,I);c.rect(x,y+2,2,4,WOOD);}
 else if(id==='awp'){c.poly([[x-8,y-4],[x+12,y-4],[x+14,y],[x+3,y+3],[x-7,y+3]],I);c.rect(x-6,y-2,18,4,'#60875b');c.line(x-4,y-2,x+11,y-2,'#b9ce81');c.rect(x+12,y-2,17,2,I);c.line(x+13,y-2,x+27,y-2,STEEL);outlineRect(c,x+2,y-8,10,4,I);c.rect(x+3,y-7,7,1,STEEL);c.rect(x+8,y-4,2,2,I);c.rect(x,y+2,4,5,I);}
 else if(id==='taser'){outlineRect(c,x-3,y-5,18,8,HOT);c.rect(x+2,y-4,7,4,D);c.rect(x+14,y-4,4,2,STEEL);c.rect(x+14,y,4,2,STEEL);c.rect(x,y+2,4,6,I);c.rect(x+1,y+3,2,3,HOT);}
 else if(id==='laser'){outlineRect(c,x-4,y-6,20,9,STEELD);c.rect(x-2,y-4,10,4,STEEL);c.rect(x+10,y-3,10,3,I);c.rect(x+15,y-3,4,3,CYAN);c.rect(x,y+2,4,7,I);c.rect(x+1,y+3,2,4,'#5d6b9e');c.rect(x+4,y-3,4,2,CYAN);}
 else{outlineRect(c,x-7,y-8,28,13,'#71549a');c.rect(x-4,y-6,13,4,'#c89eee');circle(c,x+13,y-2,6,I);circle(c,x+13,y-2,4,CYAN);c.rect(x+15,y-3,9,3,I);c.rect(x+21,y-3,3,3,WHITE);c.rect(x-1,y+4,5,5,I);c.rect(x+1,y+4,2,4,STEELD);}
}
function bow(c,x,y,pull=0){stroke(c,[[x+4,y-15],[x+10,y-11],[x+13,y-4],[x+13,y+4],[x+10,y+11],[x+4,y+15]],I,3);stroke(c,[[x+5,y-14],[x+10,y-9],[x+12,y],[x+10,y+9],[x+5,y+14]],WOOD,2);c.line(x+5,y-13,x+1-pull,y,WHITE);c.line(x+1-pull,y,x+5,y+13,WHITE);c.line(x-7-pull,y,x+17,y,WOOD);c.poly([[x+16,y-3],[x+22,y],[x+16,y+3]],STEEL);c.line(x-7-pull,y-2,x-3-pull,y,WHITE);c.line(x-7-pull,y+2,x-3-pull,y,WHITE);}
function staff(c,x,y,variant='fire'){const color={fire:HOT,lightning:'#b7d8ff',ice:'#9befff',heal:'#8fffab',frog:'#bbef69'}[variant]||'#d1a3ff';c.rect(x-2,y-21,5,28,I);c.rect(x-1,y-17,3,24,WOOD);c.line(x,y-16,x,y+4,GOLD);circle(c,x,y-22,6,I);circle(c,x,y-22,4,GOLD);circle(c,x,y-22,3,color);c.rect(x-1,y-24,2,2,WHITE);c.rect(x-5,y-28,2,6,GOLD);c.rect(x+4,y-28,2,6,GOLD);}
function drone(c,x,y,combat,step){const col=combat?CYAN:HOT;c.rect(x-13,y-3,26,2,I);c.rect(x-13,y-4,8,1,step%2?STEEL:WHITE);c.rect(x+5,y-4,8,1,step%2?WHITE:STEEL);c.rect(x-10,y-2,3,3,STEELD);c.rect(x+7,y-2,3,3,STEELD);outlineRect(c,x-5,y-4,10,8,D);c.rect(x-3,y-3,6,3,col);c.rect(x-1,y,3,2,RED);c.rect(x-7,y+2,3,4,I);c.rect(x+5,y+2,3,4,I);if(combat){c.rect(x+3,y+3,10,2,STEEL);c.rect(x+4,y+6,9,2,I);}else{circle(c,x,y+6,4,I);circle(c,x,y+6,2,RED);}}
function remote(c,x,y,combat){outlineRect(c,x-5,y-3,12,8,D);c.rect(x-3,y-2,4,3,combat?CYAN:HOT);c.rect(x+2,y-2,3,3,RED);c.line(x+4,y-3,x+6,y-7,STEEL);}
function held(c,id,x,y,step,variant='normal'){const kick=step===3?2:step===4?1:0;
 if(['sword','flamesword','energyblade'].includes(id))sword(c,x,y,-40,id==='flamesword',step,id==='energyblade');
 else if(id==='bow')bow(c,x,y,step<2?step*3:0);
 else if(id==='staff')staff(c,x,y,variant==='normal'?'fire':variant);
 else if(['ak','awp','taser','laser','beam'].includes(id))gun(c,x,y,id,kick);
 else if(id==='grenade'){outlineRect(c,x-2,y-5,8,10,'#60875b');c.rect(x,y-5,4,1,'#b9ce81');c.rect(x,y-8,4,3,I);c.line(x+3,y-8,x+8,y-6,STEEL);c.rect(x,y-2,2,4,GOLD);}
 else remote(c,x,y,id==='combatdrone');
}
function sparks(c,x,y,step,color=HOT){for(let i=0;i<6;i++){const dx=[-8,-4,1,8,10,-10][i],dy=[-8,4,-11,-3,6,8][i];c.rect(x+dx+Math.sign(dx)*step,y+dy+step,2,2,i%2?color:WHITE);}}
function impact(c,x,y,step,fire=false){if(step<3||step>6)return;x=Math.min(x,62);y=Math.max(15,Math.min(y,46));const r=[0,0,0,6,10,8,5][step];if(fire){circle(c,x,y,r,I);circle(c,x,y,r-1,RED);circle(c,x-1,y-2,r-2,FIRE);circle(c,x-2,y-3,Math.max(1,r-4),HOT);circle(c,x-2,y-4,Math.max(1,r-7),WHITE);if(step>4){circle(c,x-4,y-9-(step-4)*2,3,D);circle(c,x+4,y-7-(step-4)*2,4,STEELD);}}else{c.poly([[x,y-r],[x+2,y-2],[x+r,y],[x+2,y+2],[x,y+r],[x-2,y+2],[x-r,y],[x-2,y-2]],HOT);c.rect(x-2,y-2,4,4,WHITE);}sparks(c,x,y,step-3,fire?FIRE:HOT);}
function arrow(c,x,y,variant,step){const col=variant==='lightning'?'#b7d8ff':variant==='fire'?HOT:STEEL;c.line(x-12,y,x+1,y,WOOD);c.poly([[x,y-3],[x+6,y],[x,y+3]],col);c.line(x-12,y-2,x-8,y,WHITE);c.line(x-12,y+2,x-8,y,WHITE);if(variant==='explosive'){c.rect(x-1,y-1,3,3,RED);c.set(x,y-2,HOT);}if(variant==='fire')stroke(c,[[x-18,y],[x-15,y-2],[x-12,y+1],[x-8,y]],FIRE,2);if(variant==='lightning')stroke(c,[[x-22,y-2],[x-18,y+1],[x-15,y-3],[x-12,y+1],[x-8,y]],col);}
function attack(id,variant,step,effects){
 const c=new Canvas(80,64),x=28,y=44;
 if(['sword','flamesword','energyblade'].includes(id)){
  const angle=[-100,-125,-45,10,38,50,-10,-40][step];sword(c,x,y,angle,id==='flamesword',step,id==='energyblade');
  if(effects&&step>=2&&step<=4){const trail=[[32,18],[43,18],[53,26],[57,38],[53,50],[43,57]],color=id==='flamesword'?FIRE:id==='energyblade'?CYAN:STEEL;stroke(c,trail.slice(0,step===2?4:6),color,3);stroke(c,trail.slice(1,step===2?4:6),id==='flamesword'?HOT:WHITE);if(id==='flamesword')sparks(c,48,31,step,FIRE);impact(c,65,40,step,id==='flamesword');}
 }else if(id==='bow'){
  if(step<3||step>6)bow(c,x,y,step<2?step*4:0);else bow(c,x,y,0);
  if(step>=2&&step<=5){const px=39+(step-2)*10;arrow(c,px,39,variant,step);if(variant==='triple'){arrow(c,px,34-(step-2),variant,step);arrow(c,px,44+(step-2),variant,step);}}
  if(effects&&step>=4)impact(c,69,39,step,variant==='explosive'||variant==='fire');
 }else if(id==='staff'){
  staff(c,x,y,variant);const col={fire:HOT,lightning:'#b7d8ff',ice:'#9befff',heal:'#8fffab',frog:'#bbef69'}[variant];
  if(step<2&&effects){circle(c,28,21,3+step*2,col);c.rect(27,19,2,2,WHITE);}
  if(step>=2&&step<=5){const px=36+(step-2)*10;circle(c,px,24,4,I);circle(c,px,24,3,col);c.set(px-1,23,WHITE);if(variant==='lightning')stroke(c,[[32,24],[40,18],[45,27],[53,21],[px,24]],col,2);if(variant==='heal'){c.rect(px-1,20,2,8,WHITE);c.rect(px-4,23,8,2,WHITE);}if(variant==='frog'){c.rect(px-3,21,2,2,WHITE);c.rect(px+1,21,2,2,WHITE);c.rect(px-2,26,5,1,D);}}
  if(effects&&step>=4)impact(c,69,24,step,variant==='fire');
 }else if(['ak','awp','taser','laser','beam'].includes(id)){
  gun(c,x,y,id,step===3?2:step===4?1:0);
  if(id==='awp'&&step<2&&effects){c.line(58,41,74,41,'#749867');c.rect(68,38,1,7,RED);}
  if(step>=2&&step<=4){const muzzle=id==='awp'?57:id==='beam'?51:id==='ak'?50:47;
   if(effects){c.poly([[muzzle,39],[muzzle+7,35],[muzzle+4,40],[muzzle+10,43],[muzzle+3,45],[muzzle+4,48],[muzzle,46]],id==='laser'||id==='beam'?CYAN:HOT);c.rect(muzzle,41,4,3,WHITE);}
   if(id==='taser'){c.rect(49+(step-2)*9,38,4,1,STEEL);c.rect(49+(step-2)*9,46,4,1,STEEL);c.line(46,38,66,38,STEELD);c.line(46,46,66,46,STEELD);if(effects)stroke(c,[[53,38],[57,41],[54,44],[61,46],[65,42],[69,45]],'#b7d8ff',2);}
   else{const col=id==='beam'?CYAN:id==='laser'?'#a6fbff':WHITE;c.line(muzzle+5,42,74,42,col);if(id==='beam'){c.line(muzzle+4,40,72,40,'#4aadbd');c.line(muzzle+4,44,72,44,'#4aadbd');}}
   if((id==='ak'||id==='awp')&&effects)outlineRect(c,39-step*2,30-step,4,3,GOLD);
  }if(effects&&step>=3)impact(c,71,42,step,false);
 }else if(id==='grenade'){
  if(step<2||step===7)held(c,id,x,y,step);if(step>=2&&step<=4){const px=[0,0,42,56,65][step],py=[0,0,23,26,43][step];outlineRect(c,px,py,7,8,'#60875b');c.rect(px+2,py-2,3,2,STEEL);c.rect(px+2,py+2,2,3,GOLD);}if(effects&&step>=4&&step<7)impact(c,68,45,Math.min(6,step),true);
 }else{
  remote(c,x,y,id==='combatdrone');const px=step<2?46:48+Math.min(3,step-2)*5,py=22+(step%2);if(id==='combatdrone'||step<5)drone(c,px,py,id==='combatdrone',step);
  if(id==='combatdrone'&&step>=2&&step<5){c.line(px+13,py+5,75,40,CYAN);if(effects)c.rect(px+12,py+4,3,3,WHITE);}if(effects&&step>=4)impact(c,69,id==='combatdrone'?40:34,step,id==='kamikaze');
 }return c;
}
function sheet(columns,rows,w,h,draw){const out=new Canvas(columns*w,rows*h);for(let row=0;row<rows;row++)for(let col=0;col<columns;col++)out.blit(draw(row,col),col*w,row*h);return out;}
const crewSheet=sheet(52,18,24,24,(row,col)=>crew(row%6,eras[Math.floor(row/6)],...actorStates[col]));crewSheet.save(path.join(DIR,'crew.png'));
const contact=new Canvas(688,352);contact.rect(0,0,688,352,'#211b18');for(let e=0;e<3;e++)for(let rank=0;rank<6;rank++){const sprite=crew(rank,eras[e],'idle','down',0);for(let yy=0;yy<24;yy++)for(let xx=0;xx<24;xx++){const i=(yy*24+xx)*4;if(sprite.pixels[i+3])contact.rect(12+rank*112+xx*4,12+e*112+yy*4,4,4,[...sprite.pixels.subarray(i,i+4)]);}}contact.save(path.join(DIR,'crew-contact.png'));
const heldSheet=sheet(8,13,48,48,(row,col)=>{const c=new Canvas(48,48);held(c,weaponIds[row],14,32,col);return c;});heldSheet.save(path.join(DIR,'held.png'));
for(const effects of [true,false])sheet(8,rows.length,80,64,(row,col)=>attack(rows[row].id,rows[row].variant,col,effects)).save(path.join(DIR,effects?'attacks.png':'attacks-basic.png'));
const manifest={schema:'outlaws.sprite-v4.1',status:'proposal-to-port',provenance:'Original integer pixel drawings; no borrowed sprites; Node built-ins only.',alpha:[0,255],ink:I,light:'upper-left',crew:{image:'crew.png',cell:[24,24],columns:52,rows:18,anchor:[12,22],eras,ranks,animations,states:actorStates,identity:'same six rank IDs, faces, skin colors and signatures in every era'},held:{image:'held.png',cell:[48,48],columns:8,rows:13,anchor:[14,32],ids:weaponIds},attacks:{image:'attacks.png',basic:'attacks-basic.png',cell:[80,64],columns:8,rows:rows.map((r,index)=>({...r,index})),anchor:[20,56],hand:[28,44],target:[69,40],phase:['ready','anticipate','strike','impact','follow-through','settle','recover','rest'],timings},aliases,rules:['draw-only API: no enemy state, health, RNG, cooldown, rewards or transactions','callers own time and choose phase; timings are preview durations only','Motion off/reduced-motion uses a representative static frame','Special effects off uses attacks-basic.png; projectiles and weapon shape remain visible']};
manifest.world=buildWorld(DIR);
// Equal room and actor placement in each era, for direct comparison.
const rooms=new Canvas(984,224);const sample=['##########','#........#','#..#..o..#','#...$....#','#.o...G..#','#........#','##########'];
for(let e=0;e<3;e++)for(let yy=0;yy<7;yy++)for(let xx=0;xx<10;xx++){const mark=sample[yy][xx],name=mark==='#'?((yy===0||yy===6)&&xx%3===1?'window':'wall_center'):'floor_'+['a','b','c'][(xx+yy)%3];rooms.blit(worldTile(name,eras[e]),e*328+xx*32,yy*32);if(mark==='o'||mark==='$'||mark==='G')rooms.blit(worldTile(mark==='o'?'crate':mark==='$'?'chest_closed':'vault_closed',eras[e]),e*328+xx*32,yy*32);}
for(let e=0;e<3;e++)for(let r=0;r<6;r++)rooms.blit(crew(r,eras[e],'idle','down',0),e*328+37+r*32,166);
rooms.save(path.join(DIR,'rooms-contact.png'));
const attackContact=new Canvas(8*320,256);for(let f=0;f<8;f++){const stage=new Canvas(80,64);stage.rect(0,0,80,64,'#211b18');stage.blit(crew(5,'medieval','attack','right',f),8,34);stage.blit(attack('flamesword','normal',f,true),0,0);for(let y=0;y<64;y++)for(let x=0;x<80;x++){const i=(y*80+x)*4;attackContact.rect(f*320+x*4,y*4,4,4,[...stage.pixels.subarray(i,i+4)]);}}attackContact.save(path.join(DIR,'flamesword-contact.png'));
fs.writeFileSync(path.join(DIR,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');fs.writeFileSync(path.join(DIR,'manifest.js'),'window.OutlawsSpriteV4Manifest='+JSON.stringify(manifest)+';\n');
console.log(JSON.stringify({crewFrames:936,weapons:13,attackRows:rows.length,attackFrames:rows.length*8,heldFrames:104,worldTiles:72,spriteImages:5,contactImages:3}));

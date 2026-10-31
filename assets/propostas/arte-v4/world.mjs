/* Original, opaque 32px terrain and transparent 32px props. No room logic. */
import {createRequire} from 'node:module';
import path from 'node:path';
const {Canvas}=createRequire(import.meta.url)('../../../tools/arcade-pixels.cjs');
const INK='#141c2c',WHITE='#f4f3dc';
export const worldNames=['floor_a','floor_b','floor_c','wall_center','wall_edge','window','door_closed','door_open','crate','barrel','chest_closed','chest_open','vault_closed','vault_open','lamp','road_center','road_edge','castle','hay','terminal','grille','light_strip','arrival','stairs'];
const eras=['medieval','modern','future'];
const colors={
 medieval:{floor:'#81705a',floorLight:'#a18c69',floorDark:'#655345',wall:'#594c43',wallLight:'#91765b',wallDark:'#342d2c',accent:'#e5b657',glow:'#fff0b0',wood:'#9a5d35',woodLight:'#cf9351',woodDark:'#633d2c',metal:'#929ca5'},
 modern:{floor:'#94a5ac',floorLight:'#c4d1d0',floorDark:'#687e8d',wall:'#384b61',wallLight:'#73899a',wallDark:'#253445',accent:'#abd9df',glow:'#edf9ef',wood:'#557464',woodLight:'#92af88',woodDark:'#364c49',metal:'#a4b9bf'},
 future:{floor:'#41566b',floorLight:'#617b8c',floorDark:'#2b3c51',wall:'#304358',wallLight:'#677e91',wallDark:'#1e2c40',accent:'#6dd6d1',glow:'#c9efde',wood:'#4f6480',woodLight:'#879bb4',woodDark:'#30435c',metal:'#b4c2cb'}
};
function box(c,x,y,w,h,col){c.rect(x,y,w,h,INK);c.rect(x+1,y+1,w-2,h-2,col);}
function circle(c,x,y,r,col){for(let yy=-r;yy<=r;yy++)for(let xx=-r;xx<=r;xx++)if(xx*xx+yy*yy<=r*r)c.set(x+xx,y+yy,col);}
function shadow(c){c.rect(4,27,24,3,INK);c.rect(7,30,18,1,INK);}
function floor(c,p,variant,era){c.rect(0,0,32,32,p.floor);c.rect(0,0,32,1,p.floorLight);c.rect(0,1,1,30,p.floorLight);c.rect(0,31,32,1,p.floorDark);c.rect(31,1,1,30,p.floorDark);
 if(era==='medieval'){c.line(0,15,31,15,p.floorDark);c.line(variant%2?10:22,1,variant%2?10:22,14,p.floorDark);c.line(variant%2?22:10,16,variant%2?22:10,30,p.floorDark);c.rect(4+variant*5,6,3,1,p.floorLight);c.rect(18-variant*3,25,2,1,p.floorLight);}
 else if(era==='modern'){c.line(4,5+variant*4,12,8+variant*3,p.floorLight);c.line(12,8+variant*3,18,7+variant*3,p.floorLight);c.line(18,7+variant*3,22,11+variant*3,p.floorLight);c.line(8,22,12,24,p.floorDark);c.set(25,26,p.floorLight);}
 else{c.rect(3,3,26,26,p.floorDark);c.rect(4,4,24,23,p.floor);c.rect(5,5,21,1,p.floorLight);c.rect(5,5,1,20,p.floorLight);for(const [x,y]of [[5,5],[25,5],[5,25],[25,25]])c.set(x,y,INK);if(variant===1)c.rect(12,26,8,1,p.accent);if(variant===2){c.rect(8,12,16,8,p.floorDark);for(let y=13;y<20;y+=2)c.rect(9,y,14,1,p.floorLight);}}
}
function wall(c,p,era,window=false,edge=false){c.rect(0,0,32,32,p.wallDark);c.rect(0,0,32,27,INK);c.rect(1,1,30,24,p.wall);c.rect(1,1,30,2,p.wallLight);c.rect(1,2,2,21,p.wallLight);c.rect(2,26,28,3,p.wallDark);c.rect(1,29,30,2,INK);
 if(era==='medieval'){for(const y of [9,17])c.rect(2,y,28,1,p.wallDark);c.rect(11,3,1,6,p.wallDark);c.rect(22,10,1,7,p.wallDark);c.rect(8,18,1,6,p.wallDark);if(edge){box(c,12,7,7,15,INK);c.rect(14,7,3,9,p.accent);c.rect(13,9,5,5,'#f09b3b');c.rect(15,8,2,5,p.glow);c.rect(13,18,5,3,p.wallLight);}}
 else{box(c,4,5,24,17,p.wallDark);c.rect(5,6,22,1,p.wallLight);if(era==='modern'){for(let x=8;x<28;x+=5)c.rect(x,7,2,13,p.metal);}else{c.rect(5,7,22,12,p.wall);c.rect(7,9,6,5,p.wallLight);c.rect(16,8,8,9,p.wallDark);c.rect(18,10,4,1,p.accent);c.rect(18,13,3,1,p.accent);c.rect(12,23,8,1,p.accent);}if(edge){c.rect(3,2,26,2,p.glow);c.rect(5,4,22,1,p.accent);}}
 if(window){box(c,3,4,26,19,INK);c.rect(5,6,22,15,era==='future'?'#152338':era==='modern'?'#759fae':'#2a3337');
  if(era==='future'){for(const [x,y]of [[7,9],[11,17],[17,8],[23,12],[25,18]])c.set(x,y,WHITE);circle(c,21,16,4,'#6e6487');c.line(18,15,23,13,'#a4a1bd');c.rect(6,13,7,2,p.floorLight);c.rect(8,12,3,1,p.accent);c.rect(7,15,5,1,p.wallDark);}
  else if(era==='modern'){c.rect(5,17,22,4,p.wallDark);c.rect(7,11,4,10,p.wall);c.rect(17,9,5,12,p.wall);c.rect(8,12,1,1,p.glow);c.rect(18,11,2,1,p.glow);c.rect(5,15,22,1,p.metal);c.rect(15,6,2,15,p.metal);}
  else{c.rect(8,6,2,15,p.wallLight);c.rect(15,6,2,15,p.wallLight);c.rect(22,6,2,15,p.wallLight);c.rect(5,13,22,2,p.wallLight);}c.rect(5,6,22,1,p.metal);c.rect(5,7,1,13,p.metal);}
}
export function worldTile(name,era='medieval'){const c=new Canvas(32,32),p=colors[era]||colors.medieval;
 if(name.startsWith('floor')){floor(c,p,Math.max(0,['floor_a','floor_b','floor_c'].indexOf(name)),era);return c;}
 if(['wall_center','wall_edge','window','grille','light_strip'].includes(name)){wall(c,p,era,name==='window',name==='wall_edge'||name==='light_strip');return c;}
 if(name==='road_center'||name==='road_edge'){floor(c,p,name==='road_edge'?2:0,era);if(era==='medieval'){c.rect(0,0,32,4,p.wallDark);c.rect(0,28,32,4,p.wallDark);for(const x of [5,17,27])c.rect(x,9+(x%3)*4,3,2,p.floorLight);}else{c.rect(0,2,32,2,p.wallDark);c.rect(0,28,32,2,p.wallDark);c.rect(3,4,7,1,p.accent);c.rect(20,4,7,1,p.accent);c.rect(3,26,7,1,p.accent);c.rect(20,26,7,1,p.accent);}return c;}
 shadow(c);
 if(name==='crate'||name==='hay'||name==='barrel'){
  if(era==='medieval'){if(name==='barrel'){c.poly([[9,3],[23,3],[27,9],[27,23],[23,28],[9,28],[5,23],[5,9]],INK);c.rect(8,5,16,21,p.wood);for(const x of [11,16,21])c.rect(x,6,1,19,p.woodDark);c.rect(6,9,20,3,p.metal);c.rect(6,21,20,3,p.metal);c.rect(9,4,14,2,p.woodLight);}else{box(c,4,4,24,24,name==='hay'?'#bba34b':p.wood);c.rect(5,5,22,2,p.woodLight);c.rect(5,7,2,20,p.woodLight);c.rect(25,7,2,20,p.woodDark);c.line(7,8,23,24,p.woodDark);c.line(7,7,24,24,p.woodLight);c.line(24,7,7,24,p.woodDark);c.rect(5,13,22,2,INK);}}
  else{box(c,4,4,24,24,p.wood);c.rect(5,5,22,2,p.woodLight);c.rect(5,7,2,20,p.woodLight);if(era==='modern'){for(const y of [9,17]){box(c,7,y,18,7,p.woodDark);c.rect(14,y+2,6,2,p.metal);}}else{c.line(8,8,23,8,p.metal);c.rect(8,12,16,10,p.woodDark);c.rect(10,14,12,1,p.accent);c.rect(17,17,4,3,p.metal);c.rect(7,25,18,1,p.woodLight);}}return c;
 }
 if(name.startsWith('chest')||name.startsWith('vault')){const vault=name.startsWith('vault'),open=name.endsWith('open');
  if(era==='medieval'){box(c,4,vault?3:9,24,vault?25:19,vault?'#c68c36':p.wood);c.rect(5,vault?4:10,22,3,'#f1c875');c.rect(7,13,3,13,'#f1c875');c.rect(22,13,3,13,'#f1c875');c.rect(5,16,22,2,INK);box(c,13,14,7,9,'#f1c875');c.rect(15,16,3,3,INK);if(open){c.rect(6,13,20,8,INK);c.rect(8,16,16,3,'#e5b657');for(const x of [9,14,19])c.rect(x,14,3,3,'#fff0b0');}}
  else{box(c,4,vault?3:8,24,vault?25:20,p.wallLight);c.rect(5,vault?4:9,22,2,p.metal);box(c,7,8,18,17,p.wall);if(open){c.rect(8,9,16,15,INK);for(const x of [9,14,19]){c.rect(x,19,4,3,'#e5b657');c.rect(x,18,3,1,'#f1c875');}c.rect(23,8,3,16,p.metal);}else{circle(c,16,16,6,INK);circle(c,16,16,4,p.metal);c.rect(15,12,2,8,p.wall);c.rect(12,15,8,2,p.wall);circle(c,16,16,2,p.metal);c.rect(9,22,6,1,p.accent);if(era==='future'){c.rect(8,7,16,1,p.accent);c.rect(24,10,1,12,p.accent);}}}return c;}
 if(name.startsWith('door')||name==='castle'||name==='arrival'||name==='stairs'){box(c,3,1,26,30,p.wallLight);box(c,6,4,20,26,INK);if(name!=='door_open'){c.rect(7,5,18,24,era==='medieval'?p.wood:p.wall);if(era==='medieval'){for(const x of [10,15,20])c.rect(x,5,1,24,p.woodDark);c.rect(7,10,18,2,INK);c.rect(7,23,18,2,INK);c.rect(21,17,2,3,p.accent);}else{c.rect(8,6,16,2,p.metal);c.rect(15,8,2,20,INK);c.rect(22,14,2,5,p.accent);if(era==='future')c.rect(8,25,16,1,p.accent);}}else{c.rect(8,6,16,21,p.wallDark);for(let i=0;i<3;i++)c.rect(8+i*2,21-i*5,16-i*4,1,p.wallLight);}c.rect(5,29,22,2,p.floorLight);return c;}
 if(name==='terminal'){box(c,5,6,22,22,p.wall);box(c,7,8,18,12,INK);c.rect(8,9,16,9,p.floorDark);c.rect(10,11,8,1,p.accent);c.rect(10,14,12,1,p.accent);c.rect(9,22,14,3,p.metal);c.rect(11,23,3,1,INK);return c;}
 if(name==='lamp'){box(c,11,3,10,25,p.wallLight);c.rect(13,5,6,16,p.accent);c.rect(14,6,3,12,p.glow);return c;}
 return c;
}
export function buildWorld(dir){const sheet=new Canvas(8*32,9*32);for(let e=0;e<3;e++)for(let i=0;i<worldNames.length;i++)sheet.blit(worldTile(worldNames[i],eras[e]),i%8*32,(e*3+Math.floor(i/8))*32);sheet.save(path.join(dir,'world.png'));
 return {image:'world.png',cell:[32,32],columns:8,rows:9,eras,names:worldNames,eraStride:24,light:'upper-left',palettes:colors,windowRule:'Planet, stars and passing ship are behind the station window only',anchor:[16,28]};}

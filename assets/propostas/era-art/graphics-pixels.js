/* Shared deterministic pixel conversion. No game state, filters, providers or dependencies. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OutlawsGraphicsPixels=api;})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const hex=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
 const palettes={
  atari:['#15101f','#d9552c','#f4cc62','#55b187'],
  '8bit':['#17182d','#f8e7b6','#cba162','#9b563a','#583858','#8466b6','#e475b4','#fa984a','#fee16b','#4da662','#9fda78','#3a7795','#80cce2','#668ac6','#ee4d57','#f8f8e7'],
  '16bit':['#17182d','#31314b','#535871','#9298ad','#d4dbea','#e9b684','#be7857','#714624','#ad713b','#e1a550','#ffcd78','#237249','#51bd67','#a4ec76','#275688','#38a5e5','#8de7fa','#603589','#a65adf','#e6a4ff','#b95826','#f6a139','#ffe077','#952f70','#e64c99','#ffaad2','#355e53','#4f9c89','#8cdec1','#f6c64e','#ffe695','#b88932']
 };
 const parsed=Object.fromEntries(Object.entries(palettes).map(([k,v])=>[k,v.map(hex)]));
 function nearest(r,g,b,list){let best=list[0],distance=Infinity;for(const c of list){const d=(r-c[0])**2*.3+(g-c[1])**2*.55+(b-c[2])**2*.15;if(d<distance){distance=d;best=c;}}return best;}
 function processPixels(data,w,h,mode,options={}){
  if(!parsed[mode])return new Uint8ClampedArray(data);
  const list=parsed[mode],step=mode==='atari'?(options.block||Math.max(3,Math.floor(Math.min(w,h)/8))):mode==='8bit'?2:1,out=new Uint8ClampedArray(data.length);
  for(let y=0;y<h;y+=step)for(let x=0;x<w;x+=step){let r=0,g=0,b=0,n=0;for(let yy=y;yy<Math.min(h,y+step);yy++)for(let xx=x;xx<Math.min(w,x+step);xx++){const i=(yy*w+xx)*4;if(data[i+3]>0){r+=data[i];g+=data[i+1];b+=data[i+2];n++;}}if(!n)continue;const c=nearest(r/n,g/n,b/n,list);for(let yy=y;yy<Math.min(h,y+step);yy++)for(let xx=x;xx<Math.min(w,x+step);xx++){const i=(yy*w+xx)*4;out[i]=c[0];out[i+1]=c[1];out[i+2]=c[2];out[i+3]=255;}}
  return out;
 }
 return {processPixels,palettes,levels:['atari','8bit','16bit','arcade','hd2d']};
});

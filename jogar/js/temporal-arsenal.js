/* Epoch-specific visual loadouts. Cosmetic randomness has no connection to the game's RNG. */
(function(root){
  'use strict';if(root.OutlawsTemporalArsenal)return;
  const doc=root.document,gear=root.OutlawsEquippedWeapons;
  const arsenal={medieval:['sword','bow','flamesword','staff'],modern:['ak','awp','grenade','taser','kamikaze'],future:['laser','beam','energyblade','combatdrone']};
  const family={sword:0,ak:0,laser:0,bow:1,awp:1,beam:1,flamesword:2,grenade:2,energyblade:2,staff:3,taser:3,kamikaze:4,combatdrone:4};
  const names={en:{sword:'Sword',bow:'Bow',flamesword:'Fire sword',staff:'Wild staff',ak:'AK-47',awp:'AWP',grenade:'Grenade',taser:'Taser',kamikaze:'Kamikaze drone',laser:'Laser pistol',beam:'Ray cannon',energyblade:'Dawnedge',combatdrone:'Combat drone',help:'Weapons are visual gear. They do not change damage, odds or rewards.',preview:'Preview a weapon',equipped:'Equipped on outlaw',blocked:'Bring a working outlaw into view and enable special effects.'},pt:{sword:'Espada',bow:'Arco',flamesword:'Espada de fogo',staff:'Cajado selvagem',ak:'AK-47',awp:'AWP',grenade:'Granada',taser:'Taser',kamikaze:'Drone kamikaze',laser:'Pistola laser',beam:'Canhão de raio',energyblade:'Lâmina Aurora',combatdrone:'Drone de combate',help:'As armas são visuais. Não mudam dano, chances ou ganhos.',preview:'Ver uma arma',equipped:'Equipado no bandido',blocked:'Deixe um bandido trabalhando visível e ative os efeitos especiais.'},es:{sword:'Espada',bow:'Arco',flamesword:'Espada de fuego',staff:'Bastón salvaje',ak:'AK-47',awp:'AWP',grenade:'Granada',taser:'Taser',kamikaze:'Dron kamikaze',laser:'Pistola láser',beam:'Cañón de rayos',energyblade:'Filo Aurora',combatdrone:'Dron de combate',help:'Las armas son visuales. No cambian daño, probabilidades ni recompensas.',preview:'Ver un arma',equipped:'Equipado en bandido',blocked:'Muestra un bandido trabajando y activa los efectos especiales.'},fil:{sword:'Espada',bow:'Pana',flamesword:'Nag-aapoy na espada',staff:'Mahiwagang tungkod',ak:'AK-47',awp:'AWP',grenade:'Granada',taser:'Taser',kamikaze:'Kamikaze drone',laser:'Laser pistol',beam:'Ray cannon',energyblade:'Talim Aurora',combatdrone:'Combat drone',help:'Biswal lang ang armas. Hindi nagbabago ang damage, tsansa o reward.',preview:'Silipin ang armas',equipped:'Armadong bandido',blocked:'Ipakita ang nagtatrabahong bandido at i-on ang special effects.'}};
  const words=()=>names[root.I18N?.lang?.()]||names.en;
  const currentEra=()=>root.OutlawsEras?.getState?.().era||'medieval';
  const choose=length=>{const n=new Uint32Array(1);root.crypto.getRandomValues(n);return n[0]%length;};
  let panel,status,last=null,raritySelect;
  const rarityColor=rank=>root.OutlawsLib?.traits?.RANKS?.[rank]?.rarity?.[0]||'#d6c395';
  const rarityWords={en:'Weapon rarity',pt:'Raridade da arma',es:'Rareza del arma',fil:'Rarity ng armas'};
  function policy(weapon,options){
    const list=arsenal[currentEra()]||arsenal.medieval;
    const chosen=options.preview?weapon:list[choose(list.length)];
    const rarity=Number.isInteger(options.rarity)?Math.max(0,Math.min(5,options.rarity)):choose(6);
    return {weapon:chosen,family:family[chosen],rarity,rarityColor:rarityColor(rarity)};
  }
  gear?.setEquipPolicy(policy);
  function translate(){
    if(!panel)return;const w=words();panel.querySelector('p').textContent=w.help;panel.querySelector('legend').textContent=w.preview;
    for(const b of panel.querySelectorAll('[data-ota-weapon]')){b.textContent=w[b.dataset.otaWeapon];b.hidden=!(arsenal[currentEra()]||[]).includes(b.dataset.otaWeapon);}
    status.textContent=last?last.ok?w.equipped+' #'+last.id+': '+w[last.weapon]:w.blocked:'';
    if(raritySelect)for(const option of raritySelect.options)option.textContent=root.I18N.t('rank.'+option.value);
    if(raritySelect){const name=rarityWords[root.I18N?.lang?.()]||rarityWords.en;panel.querySelector('.ota-rarity span').textContent=name;raritySelect.setAttribute('aria-label',name);}
  }
  function preview(weapon,options={}){
    if(!(arsenal[currentEra()]||[]).includes(weapon))return false;
    const map=doc.getElementById('heist-map');map?.scrollIntoView({block:'center',behavior:'instant'});
    const result=gear?.equip(weapon,{rarity:Number(raritySelect?.value||0),...options,preview:true});last={weapon,ok:Boolean(result),id:result?.id};translate();return result;
  }
  function init(){
    if(panel||!gear)return;panel=doc.createElement('fieldset');panel.className='ota-panel';panel.innerHTML='<legend></legend><p></p><div class="ota-buttons"></div><div role="status"></div>';
    for(const weapon of new Set(Object.values(arsenal).flat())){const b=doc.createElement('button');b.type='button';b.dataset.otaWeapon=weapon;b.addEventListener('click',()=>{root.OutlawsUIPolish?.preview?.('weapon',weapon);});panel.querySelector('.ota-buttons').appendChild(b);}
    status=panel.querySelector('[role=status]');const destination=doc.querySelector('#oup-arsenal .oup-group-body')||doc.querySelector('#owc-settings');destination?.appendChild(panel);
    const rarityLabel=doc.createElement('label');rarityLabel.className='ota-rarity';const word=doc.createElement('span');rarityLabel.appendChild(word);raritySelect=doc.createElement('select');for(let r=0;r<6;r++){const option=doc.createElement('option');option.value=r;raritySelect.appendChild(option);}rarityLabel.appendChild(raritySelect);panel.querySelector('.ota-buttons').before(rarityLabel);
    const style=doc.createElement('style');style.textContent='.ota-panel{margin:12px 0;border:1px solid #806748;padding:12px}.ota-panel p{line-height:1.5;font-size:14px}.ota-buttons{display:flex;flex-wrap:wrap;gap:8px}.ota-buttons button{min-width:44px;min-height:44px;padding:8px 12px}.ota-panel [role=status]{font-size:14px;margin-top:8px}';doc.head.appendChild(style);translate();
  }
  function equivalent(weapon,era){const group=family[weapon]||0;return ({medieval:['sword','bow','flamesword','staff','staff'],modern:['ak','awp','grenade','taser','kamikaze'],future:['laser','beam','energyblade','combatdrone','combatdrone']}[era]||arsenal.medieval)[group];}
  function transform(){const era=currentEra(),count=gear.transformAll(item=>({weapon:equivalent(item.weapon,era),family:item.family}));if(count){root.OutlawsEpochSFX?.play('transform',{rarity:Math.max(...gear.getLoadouts().map(g=>g.rarity))});}translate();}
  function drawRarity(ctx,actor,item,now,reduced){
    const rank=item.rarity||0,color=item.rarityColor||rarityColor(rank),x=actor.x+actor.width/2,y=actor.y-20;
    ctx.save();ctx.fillStyle=color;const count=rank+1;for(let i=0;i<count;i++)ctx.fillRect(Math.round(x-count*2+i*4),Math.round(y-6),2,2);
    if(!reduced){const age=now-item.started;if(age<800&&rank===5){const p=age/800;ctx.globalAlpha=1-p;for(let i=0;i<12;i++){const a=i*Math.PI/6,d=5+p*35;ctx.fillRect(Math.round(x+Math.cos(a)*d),Math.round(actor.y+actor.height/2+Math.sin(a)*d),3,3);}}if(rank>1&&now-item.lastFire<300){ctx.globalAlpha=.18+rank*.025;ctx.fillRect(Math.round(x-10-rank),Math.round(y-3),20+rank*2,14);}}
    ctx.restore();
  }
  function drawImpact(ctx,shot,now){const rank=shot.rarity||0,p=(now-shot.started)/450;if(!rank||p<0||p>1)return;ctx.save();ctx.globalAlpha=1-p;ctx.fillStyle=shot.rarityColor||rarityColor(rank);for(let i=0;i<rank*3;i++){const a=i*Math.PI*2/(rank*3),d=p*(10+rank*4);ctx.fillRect(Math.round(shot.target.x+Math.cos(a)*d),Math.round(shot.target.y+Math.sin(a)*d-p*8),2,2);}ctx.restore();}
  root.OutlawsTemporalArsenal={init,preview,currentEra,arsenal,weaponNames:names,drawRarity,drawImpact,equivalent,getState:()=>({era:currentEra(),available:[...arsenal[currentEra()]],rarity:Number(raritySelect?.value||0),last: last?{...last}:null,visualOnly:true})};
  root.addEventListener('outlaws:era-change',transform);root.I18N?.onChange(translate);init();
  root.addEventListener('outlaws:visual-shot',event=>{const d=event.detail;if(d?.visualOnly)root.OutlawsEpochSFX?.play(d.cue||d.weapon,{rarity:d.rarity});});
})(window);

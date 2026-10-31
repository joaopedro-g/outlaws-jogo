/* Disposable training model. No engine, storage, wallet or network access. */
(function(host,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else host.OutlawsLoopV5Model=api;})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const ERAS=['medieval','modern','future'],KINDS=['coin','buff','weapon','special','aoe','era','scene','none'];
 const DROPS=[[4400,2400,1200,900,500,100,100,400],[4600,2200,1300,800,400,100,200,400],[4200,2300,1300,1000,600,100,100,400]];
 const RARITY=[8000,1500,400,80,18,2],BOX=[4500,2700,1500,800,400,100];
 const ROLES=[{id:'breacher',icon:'◆',range:'melee',weapons:['sword','taser','energyblade'],skill:'guard'},
  {id:'sharpshooter',icon:'↗',range:'ranged',weapons:['bow','awp','beam'],skill:'precision'},
  {id:'channeler',icon:'✦',range:'ranged',weapons:['staff','ak','laser'],skill:'haste'},
  {id:'saboteur',icon:'◉',range:'ranged',weapons:['flamesword','grenade','combatdrone'],skill:'burst'}];
 const CONFIG=Object.freeze({seconds:900,tailLimit:940,bossSeconds:40,stake:400,bossWin:.4,initialCoins:400,
  bossKills:[180,200,220,240,260],killSeconds:[2.5,2.35,2.2,2.05,1.9],upgradeSeconds:90,
  minimumMilestone:300,maximumMilestone:600,specialCooldown:8,aoeCooldown:20,aoeExtra:2,dropWeights:DROPS,rarity:RARITY,boxRarity:BOX});
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function rng(seed,stream){let x=((seed>>>0)^Math.imul(stream+1,0x85ebca6b))>>>0||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};}
 function weighted(a,r){let n=r()*10000;for(let i=0;i<a.length;i++){n-=a[i];if(n<0)return i;}throw Error('Training probability row');}
 function create(options={}){
  const random=Array.from({length:8},(_,i)=>rng(options.seed??0x5a17c0de,i)),level=clamp(Math.floor(options.level||1),1,5);
  const original=(options.crew?.length?options.crew:[0,1,2,3].map(id=>({id,rank:0}))).slice(0,6);
  let itemSerial=0,events=[],lastHit=0,kindCounts=Object.fromEntries(KINDS.map(x=>[x,0]));
  const stats={coins:0,spent:0,bets:0,wins:0,boxes:0,rolls:0,aoeKills:0,declined:0,returns:[],good:[],upgrades:[],bossTimes:[],bossKills:[],eraTimes:[],scenarioTimes:[],gearRarity:[0,0,0,0,0,0],boxRarity:[0,0,0,0,0,0],costs:{food:0,repair:0,enchant:0,affix:0},balanceSamples:[]};
  const state={schema:'outlaws.training-v5.2',privateDemo:true,active:true,time:0,level,era:ERAS.includes(options.era)?options.era:'medieval',scenario:null,
   phase:'grind',coins:400,kills:0,counter:0,energy:100,inventory:[],buffUntil:0,specialUntil:0,weaponUntil:0,
   specialReady:0,aoeReady:0,specialPending:false,aoePending:false,nextKill:2.5,nextUpgrade:90,
   lastBoss:0,lastEra:0,lastScene:0,pendingEra:null,pendingScene:false,boss:null,box:null,collection:[],upgrade:0,lastDrop:null,
   chaos:options.chaos!==false,crew:original.map((a,i)=>({id:a.id,rank:a.rank||0,role:i%4,classRarity:0,skillLevel:1,
    weapon:equipment('weapon',i%4,0),armor:equipment('armor',i%4,0),accessory:equipment('accessory',i%4,0)}))};
  function equipment(slot,role,rarity){return {id:'training-'+slot+'-'+(++itemSerial),slot,role,rarity,level:1,durability:100,variant:0,affix:null};}
  function emit(type,detail={}){const e={type,time:state.time,...detail};events.push(e);if(events.length>128)events.shift();return e;}
  function pay(amount,kind){if(!state.active||amount>state.coins||state.phase==='boss')return false;state.coins-=amount;stats.spent+=amount;stats.costs[kind]+=amount;return true;}
  function action(kind,index=0){
   if(!state.active||state.time>=900)return false;
   const member=state.crew[clamp(Math.floor(index),0,state.crew.length-1)];
   if(kind==='bet'){
    if(state.phase!=='invited'||state.coins<400)return false;
    const era=state.boss.era;state.coins-=400;stats.spent+=400;stats.bets++;state.phase='boss';state.boss={era,start:state.time,end:state.time+40,win:random[4]()<.4};emit('boss-start');return true;
   }
   if(kind==='decline'){
    if(state.phase!=='invited')return false;state.phase='grind';state.lastBoss=state.time;state.counter=0;state.boss=null;stats.declined++;emit('boss-declined');return true;
   }
   if(kind==='open'){
    if(!state.box)return false;const item=state.box;state.collection.push(item);if(state.collection.length>48)state.collection.shift();state.box=null;stats.boxes++;emit('box-open',{rarity:item.rarity});return true;
   }
   if(kind==='food'){if(state.energy>=100||!pay(30,'food'))return false;state.energy=Math.min(100,state.energy+50);emit('food');return true;}
   if(kind==='repair'){
    const cost=Math.ceil((200-member.weapon.durability-member.armor.durability)/2);
    if(!cost||!pay(cost,'repair'))return false;member.weapon.durability=member.armor.durability=100;emit('repair',{member:member.id});return true;
   }
   if(kind==='enchant'){
    if(member.weapon.level>=5||!pay(50*member.weapon.level,'enchant'))return false;
    member.weapon.level++;emit('enchant',{member:member.id,level:member.weapon.level});return true;
   }
   if(kind==='affix'){
    if(!pay(40,'affix'))return false;
    member.accessory.affix=['guard','precision','haste','burst'][Math.floor(random[6]()*4)];emit('affix',{member:member.id,affix:member.accessory.affix});return true;
   }return false;
  }
  function returnEvent(type,detail){stats.returns.push(state.time);state.lastDrop=emit(type,detail);}
  function kill(fromAoe=false){
   state.kills++;state.counter++;stats.rolls++;if(fromAoe)stats.aoeKills++;
   state.energy=Math.max(0,state.energy-.3);
   const member=state.crew[(state.kills-1)%state.crew.length];member.weapon.durability=Math.max(0,member.weapon.durability-1.6);member.armor.durability=Math.max(0,member.armor.durability-.8);
   const kind=KINDS[weighted(DROPS[ERAS.indexOf(state.era)],random[1])];kindCounts[kind]++;
   emit('enemy-fall',{ordinal:state.kills,member:member.id,fromAoe,kind});
   if(kind==='none')return;
   if(kind==='coin'){const amount=12+Math.floor(random[3]()*7);state.coins+=amount;stats.coins+=amount;returnEvent('coin',{amount});return;}
   if(kind==='era'){const other=ERAS.filter(e=>e!==state.era);state.pendingEra=other[Math.floor(random[6]()*2)];returnEvent('rift-found');return;}
   if(kind==='scene'){state.pendingScene=true;returnEvent('route-found');return;}
   const rarity=weighted(RARITY,random[2]);stats.gearRarity[rarity]++;stats.good.push(state.time);
   if(kind==='buff')state.buffUntil=state.time+Math.min(32,12+rarity*2);
   if(kind==='weapon'){
    const slot=['weapon','armor','accessory'][Math.floor(random[6]()*3)],item=equipment(slot,member.role,rarity);item.variant=(member[slot].variant+1)%2;item.level=member[slot].level;
    if(rarity>=member[slot].rarity){member[slot]=item;member.classRarity=Math.max(member.classRarity,rarity);}
    else{state.inventory.push(item);if(state.inventory.length>24)state.inventory.shift();}
    state.weaponUntil=state.time+Math.min(32,18+rarity*2);
   }
   if(kind==='special')state.specialPending=true;
   if(kind==='aoe'&&!fromAoe)state.aoePending=true; // An AOE drop never recursively starts another AOE.
   returnEvent(kind,{rarity,member:member.id});
  }
  function boundary(){
   if(state.time-state.lastScene>=300&&(state.pendingScene||state.time-state.lastScene>=600)){
    state.lastScene=state.time;state.pendingScene=false;stats.scenarioTimes.push(state.time);emit('scenario-change');
   }
   if(state.chaos&&state.time-state.lastEra>=300&&(state.pendingEra||state.time-state.lastEra>=600)){
    state.era=state.pendingEra||ERAS[(ERAS.indexOf(state.era)+1)%3];state.pendingEra=null;state.lastEra=state.time;state.lastScene=state.time;stats.eraTimes.push(state.time);emit('era-change',{era:state.era});
   }
   if(!state.box&&state.phase==='grind'&&state.counter>=CONFIG.bossKills[level-1]&&state.time-state.lastBoss>=300){
    state.phase='invited';state.boss={era:state.era,invitedAt:state.time};stats.bossTimes.push(state.time);stats.bossKills.push(state.counter);emit('boss-invited');
   }
  }
  function finish(){
   if(!state.active)return;state.active=false;state.phase='ended';state.coins=0;state.collection.length=0;state.box=null;state.boss=null;
   state.crew.length=0;state.inventory.length=0;state.energy=0;state.buffUntil=state.weaponUntil=state.specialUntil=0;emit('ended');
  }
  function advance(to){
   to=Math.max(state.time,Math.min(940,Number(to)||0));if(!state.active)return;
   while(state.active&&state.time<to){
    if(state.phase==='boss'){
     state.time=Math.min(to,state.boss.end,state.nextUpgrade<900?state.nextUpgrade:Infinity);
     if(state.time>=state.nextUpgrade&&state.time<900){state.upgrade++;for(const a of state.crew)a.skillLevel=Math.min(10,a.skillLevel+1);stats.upgrades.push(state.time);emit('upgrade',{level:state.upgrade});state.nextUpgrade+=90;}
     if(state.time>=state.boss.end){
      const win=state.boss.win;state.lastBoss=state.time;state.counter=0;state.boss=null;state.phase='grind';
      if(win){stats.wins++;const rarity=weighted(BOX,random[5]);stats.boxRarity[rarity]++;state.box={id:'training-boss-loot-'+(++itemSerial),era:state.era,rarity,role:Math.floor(random[6]()*4)};}
      emit(win?'boss-win':'boss-loss');if(state.time>=900){finish();break;}state.nextKill=state.time+CONFIG.killSeconds[level-1];
     }continue;
    }
    if(state.time>=900){finish();break;}
    const eventAt=Math.min(to,state.nextKill,state.nextUpgrade,900);state.time=eventAt;
    if(state.time>=900){finish();break;}
    if(state.time>=state.nextUpgrade){state.upgrade++;for(const a of state.crew)a.skillLevel=Math.min(10,a.skillLevel+1);stats.upgrades.push(state.time);emit('upgrade',{level:state.upgrade});state.nextUpgrade+=90;}
    if(state.time>=state.nextKill){
     lastHit=state.time;emit('attack',{member:state.crew[state.kills%state.crew.length].id});
     const aoe=state.aoePending&&state.time>=state.aoeReady;
     if(aoe){state.aoePending=false;state.aoeReady=state.time+20;emit('aoe');}
     if(state.specialPending&&state.time>=state.specialReady){state.specialPending=false;state.specialReady=state.time+8;state.specialUntil=state.time+8;emit('special-use');}
     kill(false);if(aoe){kill(true);kill(true);}boundary();
     const combo=new Set(state.crew.map(a=>a.role)).size===4?.02:0;
     const power=combo+state.crew.reduce((n,a)=>n+(a.weapon.level-1)*.01+(a.skillLevel-1)*.005+(a.accessory.affix==='haste'?.01:0),0)/state.crew.length;
     const speed=Math.min(.2,power+(state.buffUntil>state.time?.1:0)+(state.weaponUntil>state.time?.05:0)+(state.specialUntil>state.time?.15:0));
     state.nextKill=state.time+CONFIG.killSeconds[level-1]*(1-speed)*(state.energy<15?1.3:1)*(1+random[0]()* .3-.15);
    }
   }
  }
  function takeEvents(){const out=events;events=[];return out;}
  function snapshot(){return JSON.parse(JSON.stringify({...state,lastHit}));}
  function metrics(){return JSON.parse(JSON.stringify({...stats,kindCounts,remainingCoins:state.active?state.coins:400+stats.coins-stats.spent}));}
  function inspect(){return {active:state.active,time:state.time,phase:state.phase,coins:state.coins,energy:state.energy,box:Boolean(state.box),crew:state.crew.map(a=>({weapon:{durability:a.weapon.durability,level:a.weapon.level}}))};}
  return Object.freeze({advance,action,snapshot,inspect,metrics,takeEvents,stop:finish,setChaos:value=>{state.chaos=Boolean(value);if(!state.chaos)state.pendingEra=null;},setScenario:id=>{state.scenario=id;}});
 }
 return Object.freeze({create,CONFIG,ROLES,ERAS,KINDS});
});

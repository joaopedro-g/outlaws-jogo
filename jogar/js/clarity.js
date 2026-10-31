/* Presentation-only copy and nearby demo feedback. No state, payouts or network action is changed. */
(function(root){
  'use strict'; if(root.OutlawsClarity)return;
  const doc=root.document,demo=new URLSearchParams(root.location.search).has('demo');
  const copy={
    en:{fuse:'Try to fuse two matching ranks. Success upgrades one; failure can lose one or both. Check the odds and fee first.',poster:'Poster bounty',ranks:'Rarity changes your share of a shared vault. It does not set a fixed income.',note:'Poster bounty is a fictional wanted value, not a bag price or income. Earnings vary with active weight and maintenance. Repair rates are rank references; check the current repair quote in game.',rob:'Send up to 10 outlaws on a heist. Their share of the vault varies with active weight and upkeep.',repair:'Work wears them down. Check the repair quote before paying.',tagline:'Your crew. One shared vault.',econ:'A shared vault funds variable rewards. Participation and upkeep change the outcome; future income is not guaranteed.',variable:'The vault distributes a shared budget by active weight. It does not pay a fixed amount per outlaw.',inflow:'When inflow slows, rewards can shrink. A positive vault balance does not guarantee useful income.',share:'Higher weight competes for a larger share of the same budget. Check active participation and costs.',cost:'Repair and fusion have costs. Read the current quote and outcome odds before choosing.',unique:'Appearance and stats create many combinations. Rarity alone does not guarantee a return.',demo:'Demo only: this action does not change your crew or send a transaction.',open:'Open a demo bag',start:'Try the heist',intro:'Watch your crew rob, or open the sample bag. Everything here is a preview with no value.',preview:'Preview',unavailable:'Bring the heist into view and enable special effects.',modern:'Modern',future:'Future',medieval:'Medieval',grenade:'Grenade',taser:'Taser',done:'Simulated bag opened. This character is a demo sample.',back:'Back to the heist'},
    pt:{fuse:'Tente fundir dois ranks iguais. O sucesso melhora um; a falha pode perder um ou ambos. Confira chances e taxa antes.',poster:'Valor do cartaz',ranks:'A raridade muda sua fatia de um cofre compartilhado. A renda não é fixa.',note:'O valor do cartaz é fictício, não é preço do saco nem renda. O ganho varia com peso ativo e manutenção. Percentuais de reparo são referências do rank; confira a cotação atual no jogo.',rob:'Envie até 10 bandidos ao assalto. A fatia do cofre varia com peso ativo e manutenção.',repair:'O trabalho desgasta o bandido. Confira a cotação do reparo antes de pagar.',tagline:'Seu bando. Um cofre compartilhado.',econ:'Um cofre compartilhado financia ganhos variáveis. Participação e manutenção mudam o resultado; não há renda futura garantida.',variable:'O cofre distribui um orçamento pelo peso ativo. Não paga um valor fixo por bandido.',inflow:'Com menos entradas, os ganhos podem cair. Um saldo positivo no cofre não garante renda útil.',share:'Maior peso disputa uma fatia maior do mesmo orçamento. Confira participação ativa e custos.',cost:'Reparo e fusão têm custos. Confira a cotação e as chances antes de escolher.',unique:'Visual e atributos formam muitas combinações. A raridade sozinha não garante retorno.',demo:'Só demonstração: esta ação não muda seu bando nem envia transação.',open:'Abrir saco da demo',start:'Experimentar o assalto',intro:'Veja seu bando roubar ou abra o saco de exemplo. Tudo aqui é uma prévia sem valor.',preview:'Prévia',unavailable:'Deixe o assalto visível e ative os efeitos especiais.',modern:'Moderno',future:'Futuro',medieval:'Medieval',grenade:'Granada',taser:'Taser',done:'Saco simulado aberto. Este personagem é um exemplo da demo.',back:'Voltar ao assalto'},
    es:{fuse:'Intenta fusionar dos rangos iguales. El éxito mejora uno; el fallo puede perder uno o ambos. Revisa probabilidades y tarifa.',poster:'Valor del cartel',ranks:'La rareza cambia tu parte de una bóveda compartida. Los ingresos no son fijos.',note:'El valor del cartel es ficticio, no es precio de la bolsa ni ingreso. Las ganancias varían con el peso activo y mantenimiento. Los porcentajes de reparación son referencias del rango; revisa la cotización actual en el juego.',rob:'Envía hasta 10 bandidos al atraco. Su parte de la bóveda varía con el peso activo y mantenimiento.',repair:'El trabajo los desgasta. Revisa la cotización antes de reparar.',tagline:'Tu banda. Una bóveda compartida.',econ:'Una bóveda compartida financia ganancias variables. La participación y mantenimiento cambian el resultado; no hay ingresos futuros garantizados.',variable:'La bóveda reparte un presupuesto por peso activo. No paga una cantidad fija por bandido.',inflow:'Con menos entradas, las ganancias pueden bajar. Un saldo positivo no garantiza ingresos útiles.',share:'Mayor peso compite por una parte mayor del mismo presupuesto. Revisa participación y costes.',cost:'La reparación y fusión tienen costes. Revisa la cotización y probabilidades antes de elegir.',unique:'Aspecto y atributos forman muchas combinaciones. La rareza sola no garantiza retorno.',demo:'Solo demo: esta acción no cambia tu banda ni envía transacciones.',open:'Abrir bolsa de demo',start:'Probar el atraco',intro:'Mira a tu banda robar o abre la bolsa de ejemplo. Todo aquí es una vista previa sin valor.',preview:'Vista previa',unavailable:'Muestra el atraco y activa los efectos especiales.',modern:'Moderno',future:'Futuro',medieval:'Medieval',grenade:'Granada',taser:'Taser',done:'Bolsa simulada abierta. Este personaje es una muestra de demo.',back:'Volver al atraco'},
    fil:{fuse:'Subukang pagsamahin ang dalawang magkaparehong rank. Sa tagumpay, aangat ang isa; sa kabiguan, maaaring mawala ang isa o pareho. Tingnan ang tsansa at bayad.',poster:'Halaga sa poster',ranks:'Binabago ng rarity ang bahagi mo sa iisang vault. Hindi nakapirmi ang kita.',note:'Kathang-isip ang halaga sa poster, hindi presyo ng bag o kita. Nagbabago ang kita ayon sa aktibong weight at maintenance. Sanggunian ng rank ang repair rate; tingnan ang kasalukuyang quote sa laro.',rob:'Magpadala ng hanggang 10 bandido sa heist. Nagbabago ang bahagi ayon sa aktibong weight at maintenance.',repair:'Nauubos ang tibay sa trabaho. Tingnan ang repair quote bago magbayad.',tagline:'Gang mo. Iisang vault.',econ:'Iisang vault ang pinagmumulan ng pabago-bagong reward. Nakaaapekto ang kalahok at maintenance; walang garantisadong kita sa hinaharap.',variable:'Hinahati ang budget ng vault ayon sa aktibong weight. Walang nakapirming bayad bawat bandido.',inflow:'Kapag humina ang papasok, maaaring bumaba ang reward. Hindi garantiya ng sapat na kita ang positibong balanse.',share:'Mas malaking weight, mas malaking bahagi ng iisang budget ang pinaglalabanan. Tingnan ang aktibong kalahok at gastos.',cost:'May gastos ang repair at fusion. Tingnan muna ang quote at tsansa.',unique:'Maraming kumbinasyon ng hitsura at stats. Hindi garantiya ng kita ang rarity lamang.',demo:'Demo lang: hindi nito binabago ang gang o nagpapadala ng transaksyon.',open:'Buksan ang demo bag',start:'Subukan ang heist',intro:'Panoorin ang gang o buksan ang sample bag. Preview lang ito at walang halaga.',preview:'Silip',unavailable:'Ipakita ang heist at i-on ang special effects.',modern:'Moderno',future:'Hinaharap',medieval:'Medieval',grenade:'Granada',taser:'Taser',done:'Bukas ang simulated bag. Sample lang ang karakter na ito.',back:'Bumalik sa heist'}
  };
  const words=()=>copy[root.I18N?.lang?.()]||copy.en;
  const last={weapon:null,era:null}; let rendering=false,feedback=null,feedbackAnchor=null;
  const more={};for(const [lang,w]of Object.entries(copy))more[lang]={
    's.tagline':w.tagline,'s.loop.2.p':w.rob,'s.loop.3.p':w.repair,'s.loop.4.p':w.fuse,'s.ledger.bounty':w.poster,'s.ranks.lede':w.ranks,'s.ranks.note':w.note,'s.unique.p2':w.unique,'s.econ.lede':w.econ,'s.econ.1.p1':w.variable,'s.econ.1.p2':w.inflow,'s.econ.2.p1':w.share,'s.econ.2.p2':w.cost,
    's.econ.3.p1':w.cost,'s.econ.3.p2':w.share,'s.econ.4.p1':w.cost,'s.econ.4.p2':w.inflow
  };
  root.I18N?.extend(more);
  const rankLabels={pt:['Comum','Incomum','Raro','Épico','Lendário','Mítico'],es:['Común','Poco común','Raro','Épico','Legendario','Mítico'],fil:['Karaniwan','Di-karaniwan','Bihira','Epiko','Alamat','Mitiko']};
  const rankCopy={};for(const [lang,labels]of Object.entries(rankLabels))rankCopy[lang]=Object.fromEntries(labels.map((text,i)=>['rank.'+i,text]));root.I18N?.extend(rankCopy);
  if(!doc.querySelector('#heist-map')){const touch=doc.createElement('style');touch.textContent='[data-flags] button,[data-flags] a{min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center}.langbar{flex-wrap:wrap}.outlaws-sfx[data-landing] button,.outlaws-sfx[data-landing] summary{min-width:44px;min-height:44px;box-sizing:border-box}.outlaws-sfx[data-landing] input[type=range],.outlaws-sfx[data-landing] .outlaws-sfx-panel label:last-child{min-height:44px}';doc.head.appendChild(touch);}
  const style=doc.createElement('style');style.textContent='.owc-feedback,.owc-demo-intro{background:#291e13;color:#f4dfaf;border:1px solid #987b47;padding:12px;line-height:1.5;font-size:14px}.owc-feedback button,.owc-demo-intro button{min-height:44px;min-width:44px;margin-top:8px}.owc-demo-intro{margin:12px 0}.owc-copy-note{font-size:14px;line-height:1.6;padding:12px 20px;color:#392714}.owc-feedback p{margin:0}.owc-feedback:focus{outline:2px solid #f2ce7e;outline-offset:3px}';doc.head.appendChild(style);
  if(!doc.querySelector('#heist-map')){
    const ledger=doc.querySelector('#ranks .ledger');if(ledger&&!ledger.querySelector('.owc-copy-note')){const n=doc.createElement('p');n.className='owc-copy-note';n.dataset.i18n='s.ranks.note';n.textContent=words().note;ledger.appendChild(n);}
  }
  function updateStatus(){
    const put=(e,t)=>{if(e&&e.textContent!==t)e.textContent=t;};
    const w=words();for(const [id,key]of [['owc-status','weapon'],['owe-status','era']]){const e=doc.getElementById(id),value=last[key];if(e&&value)put(e,value.ok?w.preview+': '+(w[value.name]||value.name.toUpperCase()):w.unavailable);}
    for(const e of doc.querySelectorAll('[data-owc-copy]'))put(e,w[e.dataset.owcCopy]||'');
    if(feedback?.isConnected)put(feedback.querySelector('p'),w.demo);
  }
  function rankText(){
    for(const e of doc.querySelectorAll('[data-filter],.card .c-rank')){
      const card=e.closest('.card'),match=card?.className.match(/\br-([0-5])\b/);
      const r=e.hasAttribute('data-filter')&&e.dataset.filter!==''?Number(e.dataset.filter):match?Number(match[1]):NaN;
      if(!Number.isInteger(r)||r<0||r>5)continue;const label=root.I18N?.t('rank.'+r);
      const node=[...e.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());if(node&&node.textContent.trim()!==label)node.textContent=' '+label+' ';
    }
  }
  function utcLog(){
    for(const e of doc.querySelectorAll('#log time')){
      if(e.dataset.owcUtc)continue;const value=e.textContent.trim(),m=value.match(/(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s*(AM|PM)?/i);if(!m)continue;
      let h=Number(m[1]);if(m[4])h=h%12+(m[4].toUpperCase()==='PM'?12:0);
      const date=new Date();date.setHours(h,Number(m[2]),Number(m[3]||0),0);
      e.textContent=date.toISOString().slice(11,19)+' UTC';e.dataset.owcUtc='true';
    }
  }
  function restoreFeedback(){
    if(!feedbackAnchor||feedback?.isConnected)return;
    const anchor=feedbackAnchor.element?.isConnected?feedbackAnchor.element:[...doc.querySelectorAll('#band .card')].find(e=>e.querySelector('.c-id')?.textContent===feedbackAnchor.id);
    if(!anchor)return;feedback=doc.createElement('aside');feedback.className='owc-feedback';feedback.setAttribute('role','status');feedback.innerHTML='<p></p><button type="button" class="btn" data-owc-demo-bag data-owc-copy="open"></button>';anchor.appendChild(feedback);
  }
  function render(){if(rendering)return;rendering=true;try{restoreFeedback();updateStatus();rankText();utcLog();}finally{rendering=false;}}
  function demoBag(){
    const b=doc.querySelector('#sacks [data-act="open"]:not(:disabled)');if(b){feedbackAnchor=null;feedback?.remove();doc.querySelector('[data-act="tab"][data-tab="taverna"]')?.click();b.scrollIntoView({block:'center',behavior:'instant'});b.focus();b.click();}
  }
  if(demo&&doc.querySelector('#heist')){
    const instructions={en:'Watch your crew rob.',pt:'Veja o bando roubar.',es:'Mira a tu banda robar.',fil:'Panoorin ang banda.'};
    for(const [lang,value]of Object.entries(instructions))copy[lang].intro=value;
    const intro=doc.createElement('aside');intro.className='owc-demo-intro';intro.innerHTML='<p data-owc-copy="intro"></p><button type="button" class="btn btn-gold" data-owc-demo-bag data-owc-copy="open"></button>';
    (doc.querySelector('#game-tools')||doc.querySelector('#heist')).append(intro);
    doc.addEventListener('click',event=>{
      const e=event.target.closest?.('button');if(!e)return;
      if(e.hasAttribute('data-owc-demo-bag')){demoBag();return;}
      if(!['work','claim','repair','stop','b-work','b-stop','b-claim','fuse'].includes(e.dataset.act)||e.disabled)return;
      const anchor=e.closest('.card,.panel')||e.parentElement;if(!anchor)return;
      feedback?.remove();feedbackAnchor={element:anchor,id:anchor.querySelector('.c-id')?.textContent};render();
    });
  }
  doc.addEventListener('click',event=>{
    const b=event.target.closest?.('button');if(!b)return;
    if(b.dataset.owcPreview){const state=root.OutlawsCrusade?.getState?.();last.weapon={name:b.dataset.owcPreview,ok:Boolean(state?.active)};}
    if(b.dataset.owePreview){const state=root.OutlawsEras?.getState?.();last.era={name:b.dataset.owePreview,ok:state?.era===b.dataset.owePreview};}
    render();
  });
  root.I18N?.onChange(render);const observer=new MutationObserver(records=>{if(records.some(r=>r.addedNodes.length))render();});observer.observe(doc.body,{childList:true,subtree:true});
  render();root.OutlawsClarity={refresh:render,getState:()=>({demo,lastPreview:{...last},nearbyFeedback:Boolean(feedback?.isConnected)})};
})(window);

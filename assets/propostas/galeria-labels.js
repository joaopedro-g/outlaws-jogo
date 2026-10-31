/* Additive gallery labels. Presentation text only; artwork, canvas pixels,
 * animation state, alt/aria descriptions and the gallery's source stay intact.
 * OutlawsGalleryLabels.refresh(optionalLanguage), labelFor(name,language), getState().
 */
(function (root) {
  'use strict';
  if (root.OutlawsGalleryLabels) return;
  const doc = root.document, saved = new WeakMap();
  const scope = '#items,#crew,#classic-items,#animation,#era';
  const copy = {
    en: { coin:'Spinning coin', sack:'Loot sack', gem:'Cut gem', hammer:'Repair hammer', key:'Vault key', seal:'Rank seal', dust:'Dust trail', spark:'Impact sparks', explosion:'Explosion', shine:'Loot glint', alert:'Guard alert', exit:'Exit arrow', burst:'Coin burst', fallback:'Pixel item', ranks:['Common','Uncommon','Rare','Epic','Legendary','Mythic'], states:{idle:'Idle',down:'Walk down',left:'Walk left',right:'Walk right',up:'Walk up',celebrate:'Celebrate',fall:'Fall'}, eras:{medieval:'Medieval',modern:'Modern',future:'Future'} },
    pt: { coin:'Moeda girando', sack:'Saco de saque', gem:'Gema lapidada', hammer:'Martelo de reparo', key:'Chave do cofre', seal:'Selo de raridade', dust:'Rastro de poeira', spark:'Faíscas de impacto', explosion:'Explosão', shine:'Brilho do saque', alert:'Alerta do guarda', exit:'Seta de saída', burst:'Chuva de moedas', fallback:'Item pixel', ranks:['Comum','Incomum','Raro','Épico','Lendário','Mítico'], states:{idle:'Parado',down:'Andar para baixo',left:'Andar para a esquerda',right:'Andar para a direita',up:'Andar para cima',celebrate:'Comemorar',fall:'Cair'}, eras:{medieval:'Medieval',modern:'Moderna',future:'Futuro'} },
    es: { coin:'Moneda girando', sack:'Saco de botín', gem:'Gema tallada', hammer:'Martillo de reparación', key:'Llave de la bóveda', seal:'Sello de rareza', dust:'Rastro de polvo', spark:'Chispas de impacto', explosion:'Explosión', shine:'Brillo del botín', alert:'Alerta del guardia', exit:'Flecha de salida', burst:'Lluvia de monedas', fallback:'Objeto pixel', ranks:['Común','Poco común','Raro','Épico','Legendario','Mítico'], states:{idle:'En reposo',down:'Caminar hacia abajo',left:'Caminar a la izquierda',right:'Caminar a la derecha',up:'Caminar hacia arriba',celebrate:'Celebrar',fall:'Caer'}, eras:{medieval:'Medieval',modern:'Moderna',future:'Futuro'} },
    fil: { coin:'Umiikot na barya', sack:'Sako ng samsam', gem:'Hinubog na hiyas', hammer:'Martilyo sa pagkumpuni', key:'Susi ng vault', seal:'Selyo ng rarity', dust:'Bakas ng alikabok', spark:'Mga spark ng tama', explosion:'Pagsabog', shine:'Kislap ng samsam', alert:'Babala ng bantay', exit:'Palaso ng labasan', burst:'Ulan ng barya', fallback:'Pixel na bagay', ranks:['Karaniwan','Di-karaniwan','Bihira','Epiko','Alamat','Mitiko'], states:{idle:'Nakatigil',down:'Lumakad pababa',left:'Lumakad pakaliwa',right:'Lumakad pakanan',up:'Lumakad pataas',celebrate:'Magdiwang',fall:'Bumagsak'}, eras:{medieval:'Medieval',modern:'Moderno',future:'Hinaharap'} }
  };
  const rankIds = ['common','uncommon','rare','epic','legendary','mythic'];
  const direct = { 'loot-sack':'sack','cut-gem':'gem','repair-hammer':'hammer','vault-key':'key','loot-shine':'shine','guard-alert':'alert','exit-arrow':'exit','coin-burst':'burst' };
  const filipino={eyebrow:'ANG HEIST SA VAULT',title:'Maliit na bandido. Malaking gulo.',lede:'Pumasok. Kunin ang vault. Tumakas. Orihinal na chibi pixel art para sa gang ng OUTLAWS.',animation:'Animasyon',era:'Panahon',motion:'Galaw',crew:'Anim na rank. Anim na silweta.',native:'Likas na pixels: Classic 32 px · Arcade 24 px',room:'Parehong heist. Bagong arcade world.',roomNote:'Pixel grid, nakapirming props at malinaw na gintong layunin.',classic:'Classic',arcade:'Arcade',road:'Daan ng pagtakas',items:'Samsam, rank at effects.',sheets:'Nakapirming 24 px cells. Binary transparency. Walang blur.',footer:'Panukalang art. Classic pa rin ang default sa laro.',demo:'Buksan ang game demo',fxNote:'Maikling ikot ng alikabok, spark sa vault at tama sa kahon, na may pahinga.',itemCoin:'Barya',itemSack:'Sako',itemGem:'Hiyas',itemHammer:'Martilyo',poseIdle:'Nakatigil',poseDown:'Lumakad pababa',poseLeft:'Lumakad pakaliwa',poseRight:'Lumakad pakanan',poseUp:'Lumakad pataas',poseCelebrate:'Magdiwang',poseFall:'Bumagsak',eraMedieval:'Medieval',eraModern:'Moderno',eraFuture:'Hinaharap'};
  let requested = null, queued = false, rewrites = 0, lastLanguage = 'en', itemCount = 0, boundI18N = null;
  function normalize(value) { const code = String(value || 'en').toLowerCase(); return /^(fil|ph|tl)(-|$)/.test(code) ? 'fil' : copy[code.slice(0,2)] ? code.slice(0,2) : 'en'; }
  function language() {
    const selected = doc.querySelector('[data-lang][aria-pressed="true"]');
    return normalize(requested || root.I18N?.lang?.() || doc.documentElement.lang || selected?.dataset.lang || 'en');
  }
  function labelFor(value, chosenLanguage) {
    const words = copy[normalize(chosenLanguage || language())], name = String(value || '').toLowerCase().replaceAll('_','-');
    if (/^coin-spin-\d+$/.test(name)) return words.coin;
    if (/^dust-\d+$/.test(name)) return words.dust;
    if (/^spark-\d+$/.test(name)) return words.spark;
    if (/^explosion-\d+$/.test(name)) return words.explosion;
    const rank = rankIds.indexOf(name.replace(/^rank-seal-/,''));
    if (name.startsWith('rank-seal-') && rank !== -1) return words.seal + ' · ' + words.ranks[rank];
    return Object.prototype.hasOwnProperty.call(direct,name) ? words[direct[name]] : words.fallback;
  }
  function write(node, text) { if (node && node.textContent !== text) { node.textContent = text; rewrites++; } }
  function bindI18N() {
    const api = root.I18N; if (!api?.onChange || api === boundI18N) return;
    boundI18N = api; requested = normalize(api.lang?.());
    api.onChange(value => { requested = normalize(value || api.lang()); schedule(); });
  }
  function refresh(value) {
    bindI18N();
    if (typeof value === 'string') requested = normalize(value);
    lastLanguage = language(); const words = copy[lastLanguage]; itemCount = 0;
    if(lastLanguage==='fil'){if(doc.documentElement.lang!=='fil')doc.documentElement.lang='fil';for(const el of doc.querySelectorAll('[data-word]'))if(filipino[el.dataset.word])write(el,filipino[el.dataset.word]);for(const el of doc.querySelectorAll('[data-rank-note]'))write(el,['Bandana at bag','Berdeng hood at punyal','Asul na hood at pana','Lilang hood at balahibo','Amber na hood at susi ng vault','Ruby na hood at kapa ng hari'][Number(el.dataset.rankNote)]||'');}
    for(const b of doc.querySelectorAll('[data-lang]'))b.setAttribute('aria-pressed',String(b.dataset.lang===lastLanguage));
    for (const span of doc.querySelectorAll('#items article canvas[data-item] + span')) {
      const canvas = span.previousElementSibling, index = Number(canvas?.dataset.item);
      const frame = Number.isInteger(index) ? root.OutlawsArcadePack?.items?.frames?.[index] : null;
      const source = frame?.name || saved.get(span)?.source || span.textContent;
      // The original metadata key survives repeated translations and rebuilds.
      saved.set(span,{source,index}); write(span,labelFor(source,lastLanguage)); itemCount++;
    }
    for (const node of doc.querySelectorAll('#crew [data-rank-name],#classic-items [data-rank-name]')) {
      const rank = Number(node.dataset.rankName); if (Number.isInteger(rank) && rank >= 0 && rank <= 5) write(node,words.ranks[rank]);
    }
    for (const option of doc.querySelectorAll('#animation option')) if (Object.prototype.hasOwnProperty.call(words.states,option.value)) write(option,words.states[option.value]);
    for (const option of doc.querySelectorAll('#era option')) if (Object.prototype.hasOwnProperty.call(words.eras,option.value)) write(option,words.eras[option.value]);
    return getState();
  }
  function getState() { return Object.freeze({ language:lastLanguage,itemLabels:itemCount,rewrites,queued,visualOnly:true }); }
  function schedule() { if (queued) return; queued = true; Promise.resolve().then(() => { queued = false; refresh(); }); }
  function relevant(record) {
    const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
    if (target?.closest?.(scope)) return true;
    return [...record.addedNodes].some(node => node.nodeType === 1 && (node.matches?.(scope) || node.querySelector?.(scope)));
  }
  const listObserver = new MutationObserver(records => { if (records.some(relevant)) schedule(); });
  if (doc.body) listObserver.observe(doc.body,{childList:true,subtree:true});
  new MutationObserver(schedule).observe(doc.documentElement,{attributes:true,attributeFilter:['lang']});
  doc.addEventListener('click',event => {
    const button = event.target.closest?.('[data-lang]'); if (!button) return;
    requested = normalize(button.dataset.lang);
    // The art gallery has an independent language picker. Keep a connected
    // I18N selection aligned using its public API, when one is available.
    root.I18N?.set?.(requested); schedule();
  });
  root.OutlawsGalleryLabels = Object.freeze({refresh,labelFor,getState});
  const nav=doc.querySelector('header nav');if(nav&&!nav.querySelector('[data-lang="fil"]')){const b=doc.createElement('button');b.type='button';b.dataset.lang='fil';b.textContent='FIL';b.setAttribute('aria-label','Filipino');nav.appendChild(b);}
  const touch=doc.createElement('style');touch.textContent='header nav button{min-width:44px;min-height:44px}header nav{flex-wrap:wrap}';doc.head.appendChild(touch);
  refresh();
})(window);

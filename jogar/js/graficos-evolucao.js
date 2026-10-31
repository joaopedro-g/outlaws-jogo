/* Local cosmetic controls. Scene rendering belongs to OutlawsEraArt. */
(function (root) {
  'use strict';
  if (root.OutlawsGraphicsUI) return;
  const doc = root.document;
  const levels = ['atari', '8bit', '16bit', 'arcade', 'hd2d'];
  const names = { original: 'CLASSIC', atari: 'ATARI', '8bit': '8 BITS', '16bit': '16 BITS', arcade: 'ARCADE', hd2d: 'HD-2D' };
  const media = root.matchMedia?.('(prefers-reduced-motion: reduce)');
  const demo = new URLSearchParams(root.location.search).has('demo');
  const copy = {
    en: { open: 'UPGRADE GRAPHICS', title: 'A new look for your heist.', eyebrow: 'GRAPHICS LAB', help: 'Same gang. A whole new scene. Pick a look and compare.', current: 'ON YOUR MAP', preview: 'YOUR PREVIEW', choose: 'CHOOSE YOUR NEXT LOOK', apply: 'USE', next: 'NEXT LEVEL', original: 'Original Classic', restore: 'Restore original', close: 'Close', cosmetic: 'VISUAL ONLY', demo: 'Demo upgrade. No tokens spent.', live: 'Visual preview. No tokens spent.', loading: 'Loading the scene…', error: 'The scene could not load.', retry: 'Try again', empty: 'Your original map appears here when a heist is running.', success: 'Graphics updated.', saved: 'Saved on this browser.', local: 'Active for this visit. Browser storage is unavailable.', latest: 'You reached HD-2D. Try any look below.', selected: 'Already on your map', originalNote: 'The original art you know.', atari: 'Bold shapes. Pure old school.', '8bit': 'Tiny pixels. Big outlaw energy.', '16bit': 'Richer colors. Sharper characters.', arcade: 'Detailed sprites. Full arcade swagger.', hd2d: 'Pixel art with depth and light.' },
    pt: { open: 'MELHORAR GRÁFICOS', title: 'Um novo visual para o assalto.', eyebrow: 'LAB DE GRÁFICOS', help: 'O mesmo bando. Uma nova cena. Escolha e compare.', current: 'NO SEU MAPA', preview: 'SUA PRÉVIA', choose: 'ESCOLHA O PRÓXIMO VISUAL', apply: 'USAR', next: 'PRÓXIMO NÍVEL', original: 'Clássico original', restore: 'Restaurar original', close: 'Fechar', cosmetic: 'SÓ VISUAL', demo: 'Melhoria da demo. Nenhum token gasto.', live: 'Prévia visual. Nenhum token gasto.', loading: 'Carregando a cena…', error: 'Não foi possível carregar a cena.', retry: 'Tentar de novo', empty: 'Seu mapa original aparece aqui durante um assalto.', success: 'Gráficos atualizados.', saved: 'Salvo neste navegador.', local: 'Ativo nesta visita. O navegador não permite salvar.', latest: 'Você chegou ao HD-2D. Experimente qualquer visual abaixo.', selected: 'Já está no seu mapa', originalNote: 'A arte original que você conhece.', atari: 'Formas marcantes. Puro retrô.', '8bit': 'Pixels pequenos. Bando de respeito.', '16bit': 'Mais cores. Personagens mais nítidos.', arcade: 'Sprites detalhados. Atitude arcade.', hd2d: 'Pixel art com profundidade e luz.' },
    es: { open: 'MEJORAR GRÁFICOS', title: 'Un nuevo aspecto para el atraco.', eyebrow: 'LAB DE GRÁFICOS', help: 'La misma banda. Una nueva escena. Elige y compara.', current: 'EN TU MAPA', preview: 'TU VISTA PREVIA', choose: 'ELIGE TU PRÓXIMO ASPECTO', apply: 'USAR', next: 'SIGUIENTE NIVEL', original: 'Clásico original', restore: 'Restaurar original', close: 'Cerrar', cosmetic: 'SOLO VISUAL', demo: 'Mejora de demo. Ningún token gastado.', live: 'Vista previa visual. Ningún token gastado.', loading: 'Cargando la escena…', error: 'No se pudo cargar la escena.', retry: 'Reintentar', empty: 'Tu mapa original aparece aquí durante un atraco.', success: 'Gráficos actualizados.', saved: 'Guardado en este navegador.', local: 'Activo en esta visita. El navegador no permite guardar.', latest: 'Llegaste a HD-2D. Prueba cualquier aspecto abajo.', selected: 'Ya está en tu mapa', originalNote: 'El arte original que conoces.', atari: 'Formas claras. Puro retro.', '8bit': 'Píxeles pequeños. Grandes bandidos.', '16bit': 'Más colores. Personajes más nítidos.', arcade: 'Sprites detallados. Actitud arcade.', hd2d: 'Pixel art con profundidad y luz.' },
    fil: { open: 'I-UPGRADE ANG GRAPHICS', title: 'Bagong hitsura para sa heist.', eyebrow: 'GRAPHICS LAB', help: 'Parehong gang. Bagong eksena. Pumili at ikumpara.', current: 'SA MAPA MO', preview: 'PREVIEW MO', choose: 'PILIIN ANG SUSUNOD NA LOOK', apply: 'GAMITIN', next: 'SUSUNOD NA LEVEL', original: 'Orihinal na Classic', restore: 'Ibalik ang orihinal', close: 'Isara', cosmetic: 'VISUAL LANG', demo: 'Demo upgrade. Walang token na ginastos.', live: 'Visual preview. Walang token na ginastos.', loading: 'Nilo-load ang eksena…', error: 'Hindi ma-load ang eksena.', retry: 'Subukan muli', empty: 'Dito makikita ang orihinal na mapa kapag may heist.', success: 'Na-update ang graphics.', saved: 'Naka-save sa browser na ito.', local: 'Aktibo sa pagbisitang ito. Hindi makapag-save ang browser.', latest: 'Nasa HD-2D ka na. Subukan ang alinmang look sa ibaba.', selected: 'Nasa mapa mo na', originalNote: 'Ang orihinal na art na kilala mo.', atari: 'Malinaw na hugis. Purong retro.', '8bit': 'Maliit na pixels. Astig na gang.', '16bit': 'Mas makulay. Mas malinaw na characters.', arcade: 'Detalyadong sprites. Arcade swagger.', hd2d: 'Pixel art na may lalim at liwanag.' }
  };
  Object.assign(copy.en,{offline:'Offline. Downloaded art still works.'});
  Object.assign(copy.pt,{offline:'Sem conexão. A arte já carregada continua disponível.'});
  Object.assign(copy.es,{offline:'Sin conexión. El arte descargado sigue disponible.'});
  Object.assign(copy.fil,{offline:'Offline. Gumagana pa rin ang na-download na art.'});
  let initialized = false, ready = false, failed = false, busy = false;
  let current = 'original', selected = 'atari', frame = 0, loadGeneration = 0, effectTimer = 0, lastPaint = -Infinity;
  let dialog, launcher, cards, applyButton, retryButton, status, notice, mosaic, opener, sceneObserver;
  let messageKey = null, messageSuffix = null;
  const api = () => root.OutlawsEraArt;
  const language = () => { const id = String(root.I18N?.lang?.() || doc.documentElement.lang || 'en').toLowerCase().split('-')[0]; return id === 'ph' || id === 'tl' ? 'fil' : id; };
  const words = () => copy[language()] || copy.en;
  const label = (id) => id === 'original' ? words().original : names[id];
  const valid = (id) => id === 'original' || levels.includes(id);
  const effects = () => { const p = root.OutlawsJuice?.prefs?.() || root.OutlawsJuice?.getState?.() || {}; return !media?.matches && !p.reducedMotion && p.motion !== false && p.effects !== false; };
  function node(tag, className, parent) { const el = doc.createElement(tag); if (className) el.className = className; if (parent) parent.appendChild(el); return el; }
  function word(el, key) { el.dataset.owgWord = key; return el; }
  function button(className, key, parent) { const el = word(node('button', className, parent), key); el.type = 'button'; return el; }
  function nextLevel() { return levels[Math.min(levels.length - 1, levels.indexOf(current) + 1)]; }
  function stateFromRenderer() { const id = api()?.getState?.()?.graphics; if (valid(id)) current = id; }
  function stop() { if (frame) root.cancelAnimationFrame(frame); frame = 0; }
  function clearEffect() { root.clearTimeout(effectTimer); mosaic?.classList.remove('owg-transition'); }
  function message(key, suffix) { messageKey = key; messageSuffix = suffix; status.textContent = words()[key] + (suffix ? ' ' + words()[suffix] : ''); }
  function translate() {
    if (!initialized) return;
    for (const el of doc.querySelectorAll('[data-owg-word]')) el.textContent = words()[el.dataset.owgWord];
    notice.textContent = words()[demo ? 'demo' : 'live'];
    launcher.setAttribute('aria-label', words().open);
    dialog.querySelector('.owg-close').setAttribute('aria-label', words().close);
    refresh();
    if (messageKey) message(messageKey, messageSuffix);
    if (dialog.open) draw();
  }
  function refresh() {
    launcher.querySelector('.owg-current').textContent = label(current);
    launcher.querySelector('.owg-badge').textContent = words().cosmetic;
    for (const card of cards) {
      card.setAttribute('aria-pressed', String(card.dataset.owgLevel === selected));
      card.classList.toggle('is-current', card.dataset.owgLevel === current);
      card.querySelector('small').textContent = words()[card.dataset.owgLevel];
      card.setAttribute('aria-label', names[card.dataset.owgLevel] + '. ' + words()[card.dataset.owgLevel] + (card.dataset.owgLevel === current ? ' ' + words().selected : ''));
    }
    dialog.querySelector('[data-owg-name="current"]').textContent = label(current);
    dialog.querySelector('[data-owg-name="preview"]').textContent = label(selected);
    dialog.querySelector('.owg-detail').textContent = words()[selected];
    dialog.querySelector('.owg-progress').textContent = current === 'original' ? words().originalNote : `${levels.indexOf(current) + 1} / 5 · ${label(current)}`;
    applyButton.textContent = selected === current ? words().selected : `${words().apply} ${label(selected)}`;
    applyButton.disabled = busy || !ready || failed || selected === current;
    dialog.querySelector('.owg-next').disabled = busy || !ready || current === 'hd2d';
    dialog.querySelector('.owg-restore').disabled = busy || !ready || current === 'original';
    retryButton.hidden = !failed;
    dialog.setAttribute('aria-busy', String(busy || !ready && !failed));
    if (!ready && !failed) message('loading');
    else if (failed) message('error');
  }
  function drawScene(canvas, id, stamp) {
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('canvas');
    ctx.imageSmoothingEnabled = false;
    const state = api().getState?.() || {};
    const era = ['medieval', 'modern', 'future'].includes(state.era) ? state.era : 'medieval';
    const style = state.style === 'arcade' ? 'arcade' : 'classic';
    const ok = api().drawScene(ctx, { graphics: id, style, era, time: stamp, motion: effects(), width: canvas.width, height: canvas.height });
    if (ok === false) throw new Error('scene');
  }
  function draw(stamp = root.performance.now()) {
    if (!dialog?.open || !ready || failed) return;
    try {
      for (const kind of ['current', 'preview']) {
        const canvas = dialog.querySelector(`[data-owg-canvas="${kind}"]`);
        const id = kind === 'current' ? current : selected;
        const empty = dialog.querySelector(`[data-owg-empty="${kind}"]`);
        const unavailable = api().getState?.()?.empty === true;
        empty.hidden = !unavailable; canvas.hidden = unavailable;
        if (!unavailable) drawScene(canvas, id, stamp);
      }
    } catch { failed = true; stop(); refresh(); }
  }
  function animate(stamp) {
    frame = 0; if (!dialog.open || doc.hidden || !ready || failed) return;
    // Authored sprite poses change every 150ms; avoid painting identical scenes 60 times a second.
    if (stamp - lastPaint >= 80) { draw(stamp); lastPaint = stamp; }
    if (effects() && !failed) frame = root.requestAnimationFrame(animate);
  }
  function restart() { stop(); draw(); if (dialog?.open && !doc.hidden && ready && !failed && effects()) frame = root.requestAnimationFrame(animate); }
  function pick(id) { if (!levels.includes(id)) return; selected = id; refresh(); restart(); }
  function transition() {
    clearEffect(); if (!effects() || !dialog.open) return;
    mosaic.classList.add('owg-transition'); effectTimer = root.setTimeout(clearEffect, 650);
  }
  async function use(id) {
    if (!ready || failed || busy || !valid(id) || id === current) return false;
    const previous = current; busy = true; refresh();
    try {
      const result = await api().setGraphics(id);
      if (result === false) throw new Error('apply');
      current = id; stateFromRenderer();
      selected = nextLevel(); busy = false; refresh(); transition(); restart();
      // Preference storage is owned by the renderer, never duplicated by this UI.
      if (failed) return false;
      message('success', api().getState?.()?.storageAvailable === false ? 'local' : null); return true;
    } catch { current = previous; busy = false; failed = true; refresh(); return false; }
  }
  async function load() {
    const generation = ++loadGeneration; ready = false; failed = false; refresh();
    try {
      if (!api() || typeof api().drawScene !== 'function' || typeof api().setGraphics !== 'function') throw new Error('renderer');
      const loaded = typeof api().whenReady === 'function' ? api().whenReady() : api().whenReady;
      await Promise.race([Promise.resolve(loaded), new Promise((_, reject) => { const timer = root.setTimeout(() => reject(new Error('timeout')), 12000); Promise.resolve(loaded).finally(() => root.clearTimeout(timer)).catch(() => {}); })]);
      if (generation !== loadGeneration) return;
      ready = true; stateFromRenderer();
      selected = nextLevel(); refresh(); messageKey = null; messageSuffix = null; status.textContent = ''; restart();
    } catch { if (generation !== loadGeneration) return; busy = false; failed = true; ready = false; refresh(); }
  }
  function open() {
    if (dialog.open) return;
    opener = doc.activeElement; selected = nextLevel(); refresh();
    dialog.showModal(); doc.documentElement.classList.add('owg-modal-open'); dialog.querySelector('.owg-close').focus(); restart();
    if(root.navigator.onLine===false)message('offline');
  }
  function close() { if (dialog.open) dialog.close(); }
  function init() {
    if (initialized || !doc.body) return;
    const panel = doc.querySelector('#assalto') || doc.querySelector('#heist-map')?.closest('section');
    const heading = panel?.querySelector('h2'); if (!panel || !heading) return;
    initialized = true;
    const header = node('div', 'owg-header'); header.id = 'outlaws-graphics-header';
    launcher = node('button', 'owg-launch'); launcher.id = 'outlaws-graphics-upgrade'; launcher.type = 'button';
    const icon = node('span', 'owg-icon', launcher); icon.textContent = '▦'; icon.setAttribute('aria-hidden', 'true');
    const title = node('span', 'owg-launch-title', launcher); word(node('b', '', title), 'open'); node('small', 'owg-current', title);
    node('span', 'owg-badge', launcher); launcher.setAttribute('aria-haspopup', 'dialog'); launcher.setAttribute('aria-controls', 'outlaws-graphics-dialog');
    heading.before(header); header.append(heading, launcher);
    dialog = node('dialog', 'owg-dialog', doc.body); dialog.id = 'outlaws-graphics-dialog'; dialog.setAttribute('aria-labelledby', 'owg-title'); dialog.setAttribute('aria-describedby', 'owg-help owg-notice');
    const top = node('div', 'owg-top', dialog); word(node('span', 'owg-eyebrow', top), 'eyebrow'); const closer = button('owg-close', 'close', top); closer.addEventListener('click', close);
    const h = word(node('h2', 'owg-title', dialog), 'title'); h.id = 'owg-title';
    const help = word(node('p', 'owg-help', dialog), 'help'); help.id = 'owg-help';
    const comparison = node('div', 'owg-comparison', dialog);
    for (const kind of ['current', 'preview']) {
      const scene = node('figure', 'owg-scene', comparison);
      const caption = node('figcaption', '', scene); word(node('small', '', caption), kind); node('b', '', caption).dataset.owgName = kind;
      const viewport = node('div', 'owg-viewport', scene); const canvas = node('canvas', '', viewport); canvas.width = 312; canvas.height = 192; canvas.dataset.owgCanvas = kind; canvas.setAttribute('aria-hidden', 'true');
      const empty = word(node('p', 'owg-empty', viewport), 'empty'); empty.dataset.owgEmpty = kind; empty.hidden = true;
      if (kind === 'preview') { mosaic = node('div', 'owg-mosaic', viewport); mosaic.setAttribute('aria-hidden', 'true'); for (let i = 0; i < 24; i++) { const tile = node('i', '', mosaic); tile.style.setProperty('--owg-delay', `${(i % 6) * 13 + Math.floor(i / 6) * 15}ms`); } }
    }
    const progress = node('div', 'owg-progress', dialog); progress.setAttribute('aria-label', words().current);
    const levelTitle = word(node('h3', 'owg-level-title', dialog), 'choose'); levelTitle.id = 'owg-level-title';
    const tray = node('div', 'owg-levels', dialog); tray.setAttribute('role', 'group'); tray.setAttribute('aria-labelledby', levelTitle.id);
    cards = levels.map((id, index) => {
      const card = node('button', 'owg-level', tray); card.type = 'button'; card.dataset.owgLevel = id; card.setAttribute('aria-pressed', 'false');
      const number = node('span', 'owg-step', card); number.textContent = String(index + 1).padStart(2, '0'); number.setAttribute('aria-hidden', 'true');
      node('b', '', card).textContent = names[id]; node('small', '', card); card.addEventListener('click', () => pick(id)); return card;
    });
    node('p', 'owg-detail', dialog);
    const actions = node('div', 'owg-actions', dialog); applyButton = button('owg-apply', 'apply', actions); applyButton.addEventListener('click', () => use(selected));
    const next = button('owg-next', 'next', actions); next.addEventListener('click', () => use(nextLevel()));
    const restore = button('owg-restore', 'restore', dialog); restore.addEventListener('click', () => use('original'));
    const feedback = node('div', 'owg-feedback', dialog); status = node('p', 'owg-status', feedback); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true');
    retryButton = button('owg-retry', 'retry', feedback); retryButton.hidden = true; retryButton.addEventListener('click',()=>{if(api().getState?.()?.ready===false)api().retryAssets?.();load();});
    notice = node('p', 'owg-notice', dialog); notice.id = 'owg-notice';
    launcher.addEventListener('click', open);
    dialog.addEventListener('close', () => { doc.documentElement.classList.remove('owg-modal-open'); stop(); clearEffect(); if (opener?.isConnected) opener.focus(); else launcher.focus(); });
    dialog.addEventListener('click', (event) => { if (event.target !== dialog) return; const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close(); });
    doc.addEventListener('visibilitychange', restart);
    doc.addEventListener('change', (event) => { if (event.target.matches?.('[data-owj-setting]')) { clearEffect(); restart(); } });
    media?.addEventListener?.('change', () => { clearEffect(); restart(); });
    root.addEventListener('outlaws:graphics-change', () => { stateFromRenderer(); refresh(); restart(); });
    root.addEventListener('outlaws:art-ready', () => { if (!ready || failed) load(); else restart(); });
    root.addEventListener('outlaws:era-change', restart); root.addEventListener('outlaws:style-change', restart);
    root.addEventListener('offline',()=>{if(ready&&!failed)message('offline');});root.addEventListener('online',()=>{if(ready&&!failed){messageKey=null;messageSuffix=null;status.textContent='';}});
    root.I18N?.onChange?.(translate);
    if (root.MutationObserver) { sceneObserver = new MutationObserver(() => { if (dialog.open && !effects()) draw(); }); const heist = doc.querySelector('#heist'); if (heist) sceneObserver.observe(heist, { attributes: true, attributeFilter: ['hidden'] }); }
    translate(); load();
  }
  root.OutlawsGraphicsUI = { init, open, close, pick, use, getState: () => ({ initialized, ready, failed, busy, current, selected, open: Boolean(dialog?.open), animated: Boolean(frame), cosmetic: true }) };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})(window);

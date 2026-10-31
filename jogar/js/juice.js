/* OUTLAWS: optional, additive game feel. No game, wallet or network state is read.
 * Public hooks: OutlawsJuice.emit(type, { target, confirmed: true, ...detail })
 * or window.dispatchEvent(new CustomEvent('outlaws:juice', { detail: { type, ...detail } })).
 * Preview hooks use preview:true and are confined to the labelled demo tray.
 */
(function (root) {
  'use strict';
  if (root.OutlawsJuice) return;
  const doc = root.document;
  const media = root.matchMedia ? root.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const KEY = 'outlaws:juice:';
  const read = (name) => { try { return root.localStorage.getItem(KEY + name) !== 'off'; } catch { return true; } };
  const settings = { motion: read('motion'), effects: read('effects') };
  const previews = new Set(['count', 'coin', 'heist-start', 'success', 'failure', 'rank', 'unlock', 'progress', 'combo', 'near', 'milestone']);
  const rewards = new Set(['coin', 'success', 'rank', 'unlock', 'combo', 'milestone']);
  const nodes = new Set(), animations = new Set(), observers = [], counterValues = new Map(), barValues = new Map();
  const layers = new WeakMap(), revealedRows = new WeakMap(), revealEmissions = new WeakMap();
  const seenLogs = new Map(), seenOccurrences = new Map(), silencedReveals = new Set();
  let initialized = false, panel, previewTray, previewCount, previewBar, queued = false, effectEpoch = 0;
  let streak = 0, lastReward = 0, previewStreak = 0, lastCounterSound = 0, lastClick = null, previewStatusType = null;
  let logBaseline = new Set(), logReady = false, lastReveal = null, revealGeneration = 0, revealKnownOpen = false;
  const dict = {
    en: { title: 'Game feel', motion: 'Motion', effects: 'Special effects', preview: 'Demo effects', note: 'Effect preview only. Game data stays the same.', count: 'Count up', coin: 'Coins', 'heist-start': 'Heist start', success: 'Big success', failure: 'Failure', rank: 'Rank up', unlock: 'Unlock', progress: 'Full progress', combo: 'Combo', near: 'Almost there', milestone: 'Milestone', comboWord: 'COMBO', nearWord: 'ALMOST THERE', ready: 'READY', complete: 'COMPLETE' },
    pt: { title: 'Sensações do jogo', motion: 'Movimento', effects: 'Efeitos especiais', preview: 'Efeitos da demo', note: 'Só uma prévia dos efeitos. Os dados do jogo continuam iguais.', count: 'Contagem', coin: 'Moedas', 'heist-start': 'Início do assalto', success: 'Grande sucesso', failure: 'Falha', rank: 'Subir de rank', unlock: 'Desbloqueio', progress: 'Progresso completo', combo: 'Combo', near: 'Quase lá', milestone: 'Marco', comboWord: 'COMBO', nearWord: 'QUASE LÁ', ready: 'PRONTO', complete: 'COMPLETO' },
    es: { title: 'Sensaciones del juego', motion: 'Movimiento', effects: 'Efectos especiales', preview: 'Efectos de la demo', note: 'Solo una vista previa de los efectos. Los datos del juego siguen iguales.', count: 'Conteo', coin: 'Monedas', 'heist-start': 'Inicio del asalto', success: 'Gran éxito', failure: 'Fallo', rank: 'Subir de rango', unlock: 'Desbloqueo', progress: 'Progreso completo', combo: 'Combo', near: 'Casi listo', milestone: 'Hito', comboWord: 'COMBO', nearWord: 'CASI LISTO', ready: 'LISTO', complete: 'COMPLETO' },
    fil: { title: 'Pakiramdam ng laro', motion: 'Galaw', effects: 'Mga espesyal na epekto', preview: 'Mga epekto ng demo', note: 'Preview lang ng mga epekto. Hindi nagbabago ang datos ng laro.', count: 'Pataas na bilang', coin: 'Mga barya', 'heist-start': 'Simula ng heist', success: 'Malaking tagumpay', failure: 'Kabiguan', rank: 'Pagtaas ng ranggo', unlock: 'Pag-unlock', progress: 'Kumpletong progreso', combo: 'Combo', near: 'Malapit na', milestone: 'Mahalagang tagumpay', comboWord: 'COMBO', nearWord: 'MALAPIT NA', ready: 'HANDA', complete: 'KUMPLETO' }
  };
  const lang = () => { const code = String(root.I18N?.lang?.() || doc.documentElement.lang || 'en').toLowerCase(); return /^(fil|ph|tl)(-|$)/.test(code) ? 'fil' : code.slice(0, 2); };
  const words = () => dict[lang()] || dict.en;
  const reduced = () => !settings.motion || Boolean(media?.matches);
  const play = (name, detail) => { if (settings.effects && !doc.hidden) root.OutlawsSFX?.play?.(({ 'heist-start': 'heist', failure: 'fail' })[name] || name, detail || {}); };
  function remember(map, key, limit = 512) {
    map.set(key, true);
    while (map.size > limit) map.delete(map.keys().next().value);
  }
  function save(name, value) { try { root.localStorage.setItem(KEY + name, value ? 'on' : 'off'); } catch {} }
  function clearEffects() {
    effectEpoch++;
    for (const a of animations) a.cancel();
    animations.clear();
    for (const n of nodes) n.remove();
    nodes.clear();
  }
  function afterFill(fn, duration) {
    const epoch = effectEpoch;
    root.setTimeout(() => { if (epoch === effectEpoch && !doc.hidden) fn(); }, duration);
  }
  function animate(el, frames, options) {
    if (!el.animate || doc.hidden) return null;
    let a;
    try { a = el.animate(frames, { duration: 500, easing: 'steps(10, end)', ...options }); } catch { return null; }
    animations.add(a);
    a.finished.then(() => animations.delete(a), () => animations.delete(a));
    return a;
  }
  function transient(el, life = 800) {
    if (nodes.size >= 64) { el.remove(); return null; }
    nodes.add(el);
    root.setTimeout(() => { el.remove(); nodes.delete(el); }, life);
    return el;
  }
  function targetOf(value) {
    if (value instanceof root.Element) return value;
    if (typeof value === 'string') { try { return doc.querySelector(value); } catch { return null; } }
    return null;
  }
  function visible(el) { return Boolean(el?.isConnected && el.getClientRects().length && el.getBoundingClientRect().width); }
  function rectOf(el) { return visible(el) ? el.getBoundingClientRect() : null; }
  function hostFor(target) {
    const host = target?.closest?.('dialog[open]') || doc.body;
    let layer = layers.get(host);
    if (!layer?.isConnected) {
      layer = doc.createElement('div');
      layer.className = 'owj-layer';
      layer.setAttribute('aria-hidden', 'true');
      host.appendChild(layer);
      layers.set(host, layer);
    }
    return layer;
  }
  function glow(target, color = '#f2ce7e') {
    if (!visible(target)) return;
    animate(target, [{ filter: 'brightness(1)', boxShadow: '0 0 0 0 transparent' }, { filter: 'brightness(1.12)', boxShadow: `0 0 0 2px ${color}, 0 0 15px ${color}66` }, { filter: 'brightness(1)', boxShadow: '0 0 0 0 transparent' }], { duration: reduced() ? 250 : 500 });
  }
  function label(target, text, color, duration = 700) {
    const r = rectOf(target);
    if (!r) return;
    const n = doc.createElement('span');
    n.className = 'owj-label';
    n.textContent = text;
    n.style.left = Math.max(6, Math.min(root.innerWidth - 150, r.left + r.width / 2 - 55)) + 'px';
    n.style.top = Math.max(6, r.top - 23) + 'px';
    if (color) n.style.color = color;
    hostFor(target).appendChild(n);
    if (!transient(n)) return;
    animate(n, [{ opacity: 0, transform: 'translateY(0)' }, { opacity: 1, transform: reduced() ? 'translateY(0)' : 'translateY(-5px)', offset: .2 }, { opacity: 0, transform: reduced() ? 'translateY(0)' : 'translateY(-14px)' }], { duration });
  }
  function particles(target, confetti = false) {
    const r = rectOf(target);
    if (!r || reduced()) return;
    const layer = hostFor(target), count = confetti ? 18 : 12;
    for (let i = 0; i < count; i++) {
      const n = doc.createElement('i'), angle = i / count * Math.PI * 2;
      const distance = 30 + (i % 5) * 10;
      n.className = 'owj-pixel';
      n.style.left = (r.left + r.width / 2) + 'px';
      n.style.top = (r.top + Math.min(r.height / 2, 45)) + 'px';
      n.style.background = ['#f2ce7e', '#e8e0cc', '#8eae76', '#d9915c'][i % 4];
      layer.appendChild(n);
      if (!transient(n)) continue;
      const dx = Math.round(Math.cos(angle) * distance), dy = Math.round(Math.sin(angle) * distance);
      animate(n, [{ transform: 'translate(0,0)', opacity: 1 }, { transform: `translate(${dx}px,${dy - 22}px)`, opacity: 1, offset: .65 }, { transform: `translate(${dx}px,${dy + (confetti ? 30 : 2)}px)`, opacity: 0 }], { duration: confetti ? 800 : 650 });
    }
  }
  function coins(target, from) {
    const dest = rectOf(target);
    if (!dest || reduced()) return;
    const recentClick = lastClick && root.performance.now() - lastClick.at < 12000 ? lastClick.rect : null;
    const source = rectOf(targetOf(from)) || (from?.left !== undefined ? from : recentClick);
    const sx = source ? source.left + source.width / 2 : dest.left + dest.width / 2;
    const sy = source ? source.top + source.height / 2 : dest.bottom + 35;
    const dx = dest.left + dest.width / 2 - sx, dy = dest.top + dest.height / 2 - sy;
    const layer = hostFor(target);
    for (let i = 0; i < 5; i++) {
      const n = doc.createElement('i');
      n.className = 'owj-coin'; n.style.left = sx + 'px'; n.style.top = sy + 'px';
      layer.appendChild(n);
      if (!transient(n)) continue;
      animate(n, [{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.round(dx * .45 + (i - 2) * 7)}px,${Math.round(dy * .45 - 35 - i * 3)}px) scale(1)`, opacity: 1, offset: .45 }, { transform: `translate(${Math.round(dx)}px,${Math.round(dy)}px) scale(.55)`, opacity: 0 }], { duration: 450 + i * 55 });
    }
  }
  function shake(target) {
    if (reduced() || !visible(target)) return;
    animate(target, [{ transform: 'translate(0,0)' }, { transform: 'translate(2px,0)' }, { transform: 'translate(-2px,1px)' }, { transform: 'translate(1px,-1px)' }, { transform: 'translate(0,0)' }], { duration: 280, composite: 'add' });
  }
  function count(target, detail) {
    glow(target);
    const r = rectOf(target), from = Number(detail.fromValue), to = Number(detail.toValue);
    if (!r || !Number.isFinite(from) || !Number.isFinite(to) || to <= from) return;
    const n = doc.createElement('span'); n.className = 'owj-number';
    n.style.left = r.left + 'px'; n.style.top = r.top + 'px';
    n.style.minWidth = r.width + 'px'; n.style.font = root.getComputedStyle(target).font;
    const digits = Math.max(0, Math.min(4, detail.digits ?? 2));
    const format = (v) => (detail.prefix || '') + new Intl.NumberFormat(root.I18N?.locale?.() || doc.documentElement.lang || 'en', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);
    n.textContent = format(reduced() ? to : from);
    hostFor(target).appendChild(n);
    if (!transient(n, 700)) return;
    if (!reduced()) {
      const start = root.performance.now();
      const step = (now) => {
        if (!nodes.has(n)) return;
        const p = Math.min(1, (now - start) / 440);
        n.textContent = format(from + (to - from) * (1 - Math.pow(1 - p, 3)));
        if (p < 1) root.requestAnimationFrame(step);
      };
      root.requestAnimationFrame(step);
    }
    animate(n, [{ opacity: 1 }, { opacity: 1, offset: .75 }, { opacity: 0 }], { duration: 650 });
    if (root.performance.now() - lastCounterSound > 1400) { lastCounterSound = root.performance.now(); play('count'); }
  }
  function advanceCombo(target, preview) {
    const now = root.performance.now();
    if (preview) previewStreak = previewStreak >= 8 ? 2 : Math.max(2, previewStreak + 1);
    else { streak = now - lastReward <= 12000 ? Math.min(streak + 1, 8) : 1; lastReward = now; }
    const value = preview ? previewStreak : streak;
    if (value >= 2) { label(target, `${words().comboWord} ×${value}`); play('combo', { streak: value }); }
    return value;
  }
  function emit(type, detail = {}) {
    if (!initialized) init();
    if (!detail || typeof detail !== 'object') detail = {};
    type = ({ heist: 'heist-start', fail: 'failure', rankUp: 'rank', 'rank-up': 'rank' })[type] || type;
    if (!previews.has(type) || !settings.effects || doc.hidden) return false;
    const preview = detail.preview === true;
    if (rewards.has(type) && detail.confirmed !== true && !preview) return false;
    const target = preview ? (type === 'count' || type === 'coin' ? previewCount : type === 'progress' || type === 'near' ? previewBar : previewTray) : targetOf(detail.target) || doc.querySelector('#balances .pill:first-child .v') || doc.querySelector('.col-main') || doc.querySelector('main');
    if (!visible(target)) return false;
    const occurrence = typeof detail.occurrenceId === 'string' || typeof detail.occurrenceId === 'number' ? `${type}:${detail.occurrenceId}` : null;
    if (!preview && occurrence && seenOccurrences.has(occurrence)) return false;
    const row = target.closest?.('.rv-row') || target.closest?.('#reveal')?.querySelector('.rv-row') || (target.id === 'reveal' ? target.querySelector('.rv-row') : null);
    if (!preview && row && ['rank', 'unlock', 'failure'].includes(type)) {
      const key = revealKey(row), old = revealEmissions.get(row);
      const marks = old?.key === key ? old.types : new Set();
      if (marks.has(type)) return false;
      marks.add(type); revealEmissions.set(row, { key, types: marks });
    }
    if (type === 'count') count(target, detail);
    else if (type === 'coin') { coins(target, detail.from); glow(target); play('coin'); }
    else if (type === 'heist-start') { glow(target); play('heist-start'); }
    else if (type === 'failure') { glow(target, '#d99182'); play('failure'); if (!preview) streak = 0; }
    else if (type === 'success') { glow(target); if (detail.big && !detail.canvasFx) shake(preview ? target : doc.querySelector('.col-main') || target); play('success'); }
    else if (type === 'rank') { glow(target); if (!detail.canvasFx) particles(target); play('rank'); }
    else if (type === 'unlock') { glow(target, '#8eae76'); play('unlock'); }
    else if (type === 'progress') {
      if (!Number.isFinite(detail.progress) || detail.progress < 0 || detail.progress > 1) return false;
      if (detail.progress < 1) return true;
      glow(target); label(target, words().complete, null, 400); play('success');
    }
    else if (type === 'near') {
      if (!Number.isFinite(detail.progress) || detail.progress < .85 || detail.progress >= 1) return false;
      glow(target); label(target, words().nearWord, null, 400);
    }
    else if (type === 'milestone') { glow(target); if (!detail.canvasFx) particles(target, true); play('milestone'); }
    else if (type === 'combo') advanceCombo(target, preview);
    if (detail.action === true && ['success', 'rank', 'unlock'].includes(type)) advanceCombo(target, preview);
    if (!preview && occurrence) remember(seenOccurrences, occurrence, 256);
    return true;
  }
  function parseDisplay(text) {
    const locale = root.I18N?.locale?.() || doc.documentElement.lang || 'en';
    const parts = new Intl.NumberFormat(locale).formatToParts(1234.5);
    const group = parts.find((p) => p.type === 'group')?.value || ',';
    const decimal = parts.find((p) => p.type === 'decimal')?.value || '.';
    let value = String(text).trim().replace(/\s/g, '').replaceAll(group, '').replace(decimal, '.');
    if (!/^[+]?\d+(?:\.\d+)?$/.test(value)) return null;
    const n = Number(value);
    return Number.isFinite(n) ? { value: n, digits: (value.split('.')[1] || '').length, prefix: value.startsWith('+') ? '+' : '' } : null;
  }
  function scanCounters(silent = false) {
    for (const [key, selector] of [['balance', '#balances .pill:first-child .v'], ['accrue', '#vault-claim [data-accrue]']]) {
      const target = doc.querySelector(selector), parsed = target && parseDisplay(target.textContent);
      const old = counterValues.get(key);
      if (!parsed) { counterValues.delete(key); continue; }
      counterValues.set(key, parsed);
      if (!silent && old && parsed.value > old.value && visible(target)) {
        emit('count', { target, fromValue: old.value, toValue: parsed.value, digits: parsed.digits, prefix: parsed.prefix });
        if (key === 'balance') emit('coin', { target, confirmed: true });
      }
    }
  }
  function scanBars(silent = false) {
    const current = new Map();
    for (const bar of doc.querySelectorAll('#band .life > span')) {
      const id = bar.closest('.card')?.querySelector('.c-id')?.textContent.trim();
      const width = Number.parseFloat(bar.style.width), old = barValues.get(id);
      if (!id || !Number.isFinite(width) || width < 0 || width > 100) continue;
      current.set(id, width);
      if (!silent && old !== undefined && width > old && visible(bar)) {
        if (!reduced() && settings.effects) animate(bar, [{ width: old + '%' }, { width: width + '%' }], { duration: 300 });
        if (width === 100) afterFill(() => emit('progress', { target: bar.parentElement, progress: 1, confirmed: true }), reduced() ? 0 : 300);
      }
    }
    barValues.clear();
    for (const [id, width] of current) barValues.set(id, width);
  }
  function logKey(li) {
    const href = li.querySelector('a')?.getAttribute('href') || '';
    const message = href ? '' : [...li.childNodes].filter((n) => n.nodeName !== 'TIME').map((n) => n.textContent).join('').trim();
    return `${li.className}|${href}|${message}|${href ? '' : li.querySelector('time')?.textContent || ''}`;
  }
  function scanLogs() {
    const list = [...doc.querySelectorAll('#log > li')];
    const next = new Set(list.map(logKey));
    if (!logReady) {
      logBaseline = next;
      logReady = list.some((li) => /^log-/.test(li.className));
      for (const key of next) remember(seenLogs, key);
      return;
    }
    for (const li of list.reverse()) {
      const key = logKey(li);
      if (logBaseline.has(key) || seenLogs.has(key)) continue;
      remember(seenLogs, key);
      const activeRow = doc.querySelector('#reveal[open] .rv-row');
      const pendingFailure = activeRow?.querySelector('.rv-card.is-gone') && !activeRow.querySelector('.rv-card.is-new');
      if (li.classList.contains('log-erro') && !pendingFailure) emit('failure', { target: li });
      // A generic .log-ok can mean changing settings. Only a receipt link confirms an action.
      if (li.classList.contains('log-ok') && /\/tx\/0x[0-9a-f]{64}$/i.test(li.querySelector('a')?.getAttribute('href') || '')) {
        emit('success', { target: li, confirmed: true, action: true });
      }
    }
    logBaseline = next;
  }
  function revealKey(row) {
    syncRevealOpen();
    const title = row.closest('#reveal')?.querySelector('#reveal-title')?.textContent || '';
    return `${revealGeneration}|${title}|${[...row.querySelectorAll('.rv-card')].map((card) => `${card.className}:${card.querySelector('.rv-id')?.textContent || ''}`).join('|')}`;
  }
  function syncRevealOpen() {
    const open = Boolean(doc.querySelector('#reveal')?.open);
    if (open && !revealKnownOpen) revealGeneration++;
    revealKnownOpen = open;
  }
  function scanReveal() {
    const dialog = doc.querySelector('#reveal'), row = dialog?.querySelector('.rv-row');
    if (!dialog?.open || !row || row.hidden || silencedReveals.has(revealGeneration)) return;
    const key = revealKey(row);
    if (revealedRows.get(row) === key) return;
    revealedRows.set(row, key);
    const born = row.querySelector('.rv-card.is-new');
    if (born) {
      const fusion = Boolean(row.querySelector('.rv-op'));
      // Let RevealFX own its canvas scene. Add the reward only once the result row is visible.
      emit(fusion ? 'rank' : 'unlock', { target: born, confirmed: true, canvasFx: Boolean(dialog.querySelector('.rv-stage')) });
      lastReveal = fusion ? 'rank' : 'unlock';
    } else if (row.querySelector('.rv-card.is-gone')) { emit('failure', { target: row }); lastReveal = 'failure'; }
  }
  function baseline() {
    syncRevealOpen();
    logBaseline = new Set([...doc.querySelectorAll('#log > li')].map(logKey));
    logReady = Boolean(doc.querySelector('#log > li[class^="log-"]'));
    for (const key of logBaseline) remember(seenLogs, key);
    scanCounters(true); scanBars(true);
    if (doc.querySelector('#reveal[open] .rv-row')) {
      silencedReveals.add(revealGeneration);
      if (silencedReveals.size > 32) silencedReveals.delete(silencedReveals.values().next().value);
    }
  }
  function scheduleScan() {
    if (doc.hidden) { baseline(); return; }
    if (queued) return;
    queued = true;
    root.requestAnimationFrame(() => { queued = false; if (doc.hidden) { baseline(); return; } scanLogs(); scanCounters(); scanBars(); scanReveal(); });
  }
  function translatePanel() {
    if (!panel) return;
    for (const el of panel.querySelectorAll('[data-owj-word]')) el.textContent = words()[el.dataset.owjWord] || el.dataset.owjWord;
    for (const key of ['motion', 'effects']) { const input = panel.querySelector(`[data-owj-setting="${key}"]`); if (input) input.checked = settings[key]; }
    const status = panel.querySelector('#owj-demo-status');
    if (status && previewStatusType) status.textContent = `${words().preview}: ${words()[previewStatusType]}. ${words().note}`;
  }
  function createPanel() {
    panel = doc.createElement('details'); panel.id = 'owj-controls'; panel.className = 'owj-controls';
    const summary = doc.createElement('summary'); summary.dataset.owjWord = 'title'; panel.appendChild(summary);
    const switches = doc.createElement('div'); switches.className = 'owj-switches';
    for (const key of ['motion', 'effects']) {
      const labelEl = doc.createElement('label'), input = doc.createElement('input'), span = doc.createElement('span');
      input.type = 'checkbox'; input.dataset.owjSetting = key; input.checked = settings[key]; span.dataset.owjWord = key;
      labelEl.append(input, span); switches.appendChild(labelEl);
    }
    panel.appendChild(switches);
    if (new URLSearchParams(root.location.search).has('demo')) {
      const note = doc.createElement('p'); note.dataset.owjWord = 'note'; panel.appendChild(note);
      previewTray = doc.createElement('div'); previewTray.id = 'owj-demo-tray'; previewTray.className = 'owj-demo-tray';
      const title = doc.createElement('small'); title.dataset.owjWord = 'preview';
      previewCount = doc.createElement('b'); previewCount.id = 'owj-demo-count'; previewCount.textContent = '100';
      previewBar = doc.createElement('div'); previewBar.className = 'owj-demo-bar'; previewBar.id = 'owj-demo-bar'; previewBar.setAttribute('aria-hidden', 'true'); previewBar.appendChild(doc.createElement('i'));
      previewTray.append(title, previewCount, previewBar); panel.appendChild(previewTray);
      const buttons = doc.createElement('div'); buttons.className = 'owj-demo-buttons';
      for (const type of previews) { const button = doc.createElement('button'); button.type = 'button'; button.dataset.owjPreview = type; button.dataset.owjWord = type; buttons.appendChild(button); }
      panel.appendChild(buttons);
      const status = doc.createElement('span'); status.id = 'owj-demo-status'; status.className = 'owj-sr'; status.setAttribute('role', 'status'); panel.appendChild(status);
    }
    const mount = doc.querySelector('.col-side') || doc.querySelector('footer') || doc.body;
    mount.appendChild(panel); translatePanel();
  }
  function preview(type) {
    if (!previewTray) return;
    const detail = { preview: true, confirmed: true, big: true, action: false };
    if (type === 'count') {
      detail.fromValue = Number(previewCount.textContent) || 100; detail.toValue = detail.fromValue + 25; detail.digits = 0;
      previewCount.textContent = String(detail.toValue);
    }
    if (type === 'progress' || type === 'near') {
      const fill = previewBar.firstElementChild, p = type === 'near' ? .92 : 1;
      detail.progress = p;
      fill.style.width = (p * 100) + '%';
      if (!reduced() && settings.effects) animate(fill, [{ width: '15%' }, { width: (p * 100) + '%' }], { duration: 300 });
    }
    if (['progress', 'near'].includes(type) && !reduced()) afterFill(() => emit(type, detail), 300);
    else emit(type, detail);
    previewStatusType = type;
    translatePanel();
  }
  function setMotion(on) { settings.motion = Boolean(on); save('motion', settings.motion); clearEffects(); translatePanel(); return settings.motion; }
  function setEffects(on) { settings.effects = Boolean(on); save('effects', settings.effects); if (!settings.effects) clearEffects(); translatePanel(); return settings.effects; }
  function init() {
    if (initialized || !doc.body) return;
    initialized = true;
    const style = doc.createElement('style'); style.id = 'owj-style';
    style.textContent = `
      .owj-layer{position:fixed;inset:0;pointer-events:none;z-index:2147480000;overflow:hidden}
      .owj-pixel,.owj-coin,.owj-label,.owj-number{position:absolute;pointer-events:none}
      .owj-pixel{width:4px;height:4px;box-shadow:1px 1px #1b160d}
      .owj-coin{width:8px;height:8px;background:#e4b84a;border:2px solid #fff0a4;box-shadow:2px 2px #72551b;image-rendering:pixelated}
      .owj-label{font:700 10px/1.4 var(--pixel,monospace);color:#ffe7a0;text-shadow:2px 2px #25190d;background:#241708e8;padding:3px 5px;white-space:nowrap;max-width:calc(100vw - 12px)}
      .owj-number{background:#251d10;color:#ffe7a0;text-shadow:1px 1px #25190d;text-align:left;white-space:nowrap;box-shadow:0 0 8px #f2ce7e55}
      .owj-controls{margin:14px 0;padding:10px 12px;color:var(--text,#e8e0cc);background:#201b12;border:1px solid #665235;font:12px/1.5 var(--ui,system-ui,sans-serif);text-align:left;box-sizing:border-box}
      .owj-controls summary{cursor:pointer;color:#e5c078;font-weight:700}.owj-controls p{margin:8px 0;font-size:11px;opacity:.85}
      .owj-switches{display:flex;gap:14px;flex-wrap:wrap;margin-top:8px}.owj-switches label{display:flex;align-items:center;gap:5px;cursor:pointer}.owj-switches input{accent-color:#d9a441}
      .owj-demo-tray{position:relative;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px;background:#312719;border:1px solid #786040;min-height:40px;margin-top:10px}
      .owj-demo-tray small{color:#c9bb98;line-height:1.3}.owj-demo-tray b{font:700 16px monospace;color:#f2ce7e}
      .owj-demo-bar{width:64px;height:9px;background:#120f09;border:1px solid #a1844c}.owj-demo-bar i{display:block;height:100%;width:15%;background:#d9a441}
      .owj-demo-buttons{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px}.owj-demo-buttons button{font:inherit;font-size:11px;color:#eedaa8;background:#302719;border:1px solid #786040;padding:5px 7px;cursor:pointer}.owj-demo-buttons button:focus-visible{outline:2px solid #f2ce7e;outline-offset:2px}.owj-demo-buttons button:hover{background:#453621}
      .owj-sr{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
      @media(prefers-reduced-motion:reduce){.owj-pixel,.owj-coin{display:none}}
    `;
    doc.head.appendChild(style); createPanel();
    logBaseline = new Set([...doc.querySelectorAll('#log > li')].map(logKey));
    for (const key of logBaseline) remember(seenLogs, key);
    logReady = Boolean(doc.querySelector('#log > li[class^="log-"]'));
    scanCounters(); scanBars();
    // Observe only the read-only display islands. Animations and preview UI never retrigger scans.
    for (const selector of ['#log', '#balances', '#vault-claim', '#band', '#reveal']) {
      const el = doc.querySelector(selector); if (!el) continue;
      const observer = new MutationObserver((records) => {
        if (selector === '#reveal') syncRevealOpen();
        if (records.some((r) => !r.target.closest?.('.owj-layer'))) scheduleScan();
      });
      observer.observe(el, { childList: true, subtree: true, characterData: true, attributes: selector === '#reveal', attributeOldValue: selector === '#reveal', attributeFilter: selector === '#reveal' ? ['open', 'hidden'] : undefined });
      observers.push(observer);
    }
    doc.addEventListener('click', (event) => {
      const button = event.target.closest?.('[data-owj-preview]');
      if (button) { preview(button.dataset.owjPreview); return; }
      const action = event.target.closest?.('[data-act]');
      if (action && !action.disabled) { const r = action.getBoundingClientRect(); lastClick = { act: action.dataset.act, at: root.performance.now(), rect: { left: r.left, top: r.top, width: r.width, height: r.height } }; }
    }, true);
    doc.addEventListener('change', (event) => {
      const input = event.target; if (!input.dataset?.owjSetting) return;
      if (input.dataset.owjSetting === 'motion') setMotion(input.checked);
      else setEffects(input.checked);
    });
    root.addEventListener('outlaws:juice', (event) => { if (event.detail && typeof event.detail.type === 'string') emit(event.detail.type, event.detail); });
    root.I18N?.onChange?.(() => { counterValues.clear(); baseline(); translatePanel(); });
    media?.addEventListener?.('change', clearEffects);
    doc.addEventListener('visibilitychange', () => { clearEffects(); baseline(); });
  }
  root.OutlawsJuice = {
    init, emit, setMotion, setEffects,
    getState: () => ({ initialized, motion: settings.motion, effects: settings.effects, reducedMotion: reduced(), streak, lastReveal, activeEffects: nodes.size, activeParticles: [...nodes].filter((n) => n.classList.contains('owj-pixel') || n.classList.contains('owj-coin')).length, demo: Boolean(previewTray) })
  };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})(window);

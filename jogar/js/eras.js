/* CHAOS: opt-in era palettes and original criminal-gang cameos.
 * The original heist canvas keeps rendering unchanged. This module owns only
 * a transparent overlay and the data-owe-era attribute, restored on every exit.
 */
(function (root) {
  'use strict';
  if (root.OutlawsEras) return;
  const doc = root.document, W = 544, H = 416, TYPES = ['medieval', 'modern', 'future'];
  const media = root.matchMedia?.('(prefers-reduced-motion: reduce)'), KEY = 'outlaws:chaos:enabled';
  let enabled = false;
  try { enabled = root.localStorage.getItem(KEY) === 'on'; } catch {}
  let initialized = false, map, stage, canvas, ctx, panel, originalEraAttribute = null;
  let era = 'medieval', scene = null, raf = 0, stopTimer = 0, tickTimer = 0, nextAt = 0, wasVisible = false;
  let intervalMs = 60000;
  try { const seconds = Number(root.localStorage.getItem('outlaws:chaos:seconds')); if (seconds >= 15 && seconds <= 300) intervalMs = Math.round(seconds) * 1000; } catch {}
  let randomState = (0xc4a05a13 ^ Math.floor(root.performance.now() * 1000)) >>> 0;
  const stars = [], observerRefs = [];
  const dictionaries = {
    en: { title: 'CHAOS', toggle: 'Chaos eras (opt in)', help: 'Medieval by default. Modern bank gangs and outlaw crews at an orbital vault. Visual scenes.', preview: 'Chaos preview', medieval: 'Medieval', modern: 'Modern', future: 'Future', standard: 'DEFAULT ERA', bank: 'BANK GANG', orbital: 'ORBITAL VAULT CREW', ship: 'THE GANG’S UFO', visual: 'VISUAL SCENE', showcase: 'PREVIEW', unavailable: 'Enable special effects and bring the heist map into view.' },
    pt: { title: 'CHAOS', toggle: 'Eras Chaos (opcional)', help: 'Medieval por padrão. Quadrilhas no banco moderno e bandidos num cofre orbital. Cenas visuais.', preview: 'Prévia Chaos', medieval: 'Medieval', modern: 'Moderno', future: 'Futuro', standard: 'ERA PADRÃO', bank: 'QUADRILHA DO BANCO', orbital: 'BANDO DO COFRE ORBITAL', ship: 'OVNI DO BANDO', visual: 'CENA VISUAL', showcase: 'PRÉVIA', unavailable: 'Ative os efeitos especiais e deixe o mapa do assalto visível.' },
    es: { title: 'CHAOS', toggle: 'Eras Chaos (opcional)', help: 'Medieval por defecto. Bandas en el banco moderno y bandidos en una bóveda orbital. Escenas visuales.', preview: 'Vista previa Chaos', medieval: 'Medieval', modern: 'Moderno', future: 'Futuro', standard: 'ERA POR DEFECTO', bank: 'BANDA DEL BANCO', orbital: 'BANDA DE LA BÓVEDA ORBITAL', ship: 'OVNI DE LA BANDA', visual: 'ESCENA VISUAL', showcase: 'VISTA PREVIA', unavailable: 'Activa los efectos especiales y deja visible el mapa del atraco.' },
    fil: { title: 'CHAOS', toggle: 'Chaos eras (opsyonal)', help: 'Medieval ang default. Mga bandido sa modernong bangko at sa orbital vault. Mga biswal na eksena.', preview: 'Silip sa Chaos', medieval: 'Medieval', modern: 'Moderno', future: 'Hinaharap', standard: 'DEFAULT NA PANAHON', bank: 'GANG SA BANGKO', orbital: 'GANG SA ORBITAL VAULT', ship: 'UFO NG GANG', visual: 'BISWAL NA EKSENA', showcase: 'SILIP', unavailable: 'I-on ang special effects at ipakita ang mapa ng heist.' }
  };
  const language = () => { const value = root.I18N?.lang?.() || doc.documentElement.lang || 'en'; return value === 'ph' || value === 'tl' ? 'fil' : value; };
  const words = () => dictionaries[language()] || dictionaries.en;
  const prefs = () => root.OutlawsJuice?.getState?.() || { effects: true, reducedMotion: false };
  const reduced = () => Boolean(media?.matches || prefs().reducedMotion);
  const art = () => root.OutlawsCrusade?.art;
  const px = (color, x, y, w = 1, h = 1) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  function random() { randomState ^= randomState << 13; randomState ^= randomState >>> 17; randomState ^= randomState << 5; return (randomState >>> 0) / 4294967296; }
  const delay = () => intervalMs;
  function visible() {
    if (!map?.isConnected || doc.hidden || !map.getClientRects().length) return false;
    const r = map.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 50 && r.top < root.innerHeight - 30 && r.right > 0 && r.left < root.innerWidth;
  }
  function position() {
    if (!stage || !map) return;
    const r = map.getBoundingClientRect(), border = Number.parseFloat(root.getComputedStyle(map).borderLeftWidth) || 0;
    stage.style.left = (r.left + border) + 'px'; stage.style.top = (r.top + border) + 'px';
    stage.style.width = Math.max(0, r.width - border * 2) + 'px'; stage.style.height = Math.max(0, r.height - border * 2) + 'px';
  }
  function announce() { root.dispatchEvent(new CustomEvent('outlaws:era-change', { detail: { era, visualOnly: true } })); }
  function restorePalette() { if (!map) return; if (originalEraAttribute === null) map.removeAttribute('data-owe-era'); else map.setAttribute('data-owe-era', originalEraAttribute); }
  function sound(name) { if (prefs().effects && !doc.hidden) root.OutlawsArsenalSFX?.play?.(name); }
  function planet(x, y, radius, color, stripe) {
    const unit = 4;
    for (let row = -radius; row <= radius; row += unit) {
      const half = Math.floor(Math.sqrt(Math.max(0, radius * radius - row * row)) / unit) * unit;
      px(Math.abs(row) < 5 ? stripe : color, x - half, y + row, half * 2, unit);
    }
    px('#f0ddad', x - radius / 2, y - radius / 2, 4, 4);
  }
  function safe(x, y, future) {
    const shell = future ? '#40455f' : '#68726d', rim = future ? '#79eee3' : '#a7afa0';
    px('#131a21', x - 4, y - 4, 73, 77); px(shell, x, y, 65, 69); px('#202c32', x + 5, y + 5, 55, 59);
    px(rim, x + 5, y + 5, 55, 3); px(rim, x + 5, y + 5, 3, 59); px(rim, x + 57, y + 5, 3, 59); px(rim, x + 5, y + 61, 55, 3);
    px(future ? '#836bb5' : '#7f8b7e', x + 21, y + 22, 25, 25); px('#1d292e', x + 28, y + 27, 11, 15); px(rim, x + 31, y + 22, 4, 25); px(rim, x + 21, y + 32, 25, 4);
    px('#d6b16b', x + 9, y + 13, 7, 3); px('#111d23', x + 8, y + 69, 12, 6); px('#111d23', x + 45, y + 69, 12, 6);
  }
  function guard(x, y, scale = 1.5) {
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(scale, scale);
    px('#18313b', 3, 2, 10, 3); px('#8ba6a3', 2, 5, 13, 2); px('#b59d7b', 4, 7, 8, 6); px('#354f5c', 3, 13, 10, 12);
    px('#d4c474', 9, 15, 2, 3); px('#1c2930', 3, 25, 4, 8); px('#1c2930', 10, 25, 4, 8); px('#b59d7b', 0, 14, 3, 9); px('#b59d7b', 13, 14, 3, 9); ctx.restore();
  }
  function ufo(x, y, age, staticView) {
    ctx.save(); ctx.translate(Math.round(x), Math.round(y));
    px('#242738', -20, -16, 40, 8); px('#596e83', -28, -8, 56, 11); px('#5de2d4', -19, -11, 38, 7);
    // The masked pilot makes this unmistakably the outlaws' ship.
    px('#332c43', -6, -13, 12, 10); px('#17151f', -4, -10, 8, 5); px('#e7cd9a', -3, -9, 2, 1); px('#e7cd9a', 2, -9, 2, 1);
    px('#33374f', -44, 2, 88, 9); px('#8386a0', -50, 7, 100, 6); px('#323d58', -40, 13, 80, 6); px('#80eee5', -30, 17, 60, 3);
    for (let i = 0; i < 5; i++) px(i % 2 ? '#986ce3' : '#83efe4', -32 + i * 16, 10, 5, 3);
    if (staticView || age > 2 && age < 7.5) {
      ctx.globalAlpha *= .18; ctx.fillStyle = '#79eee3'; ctx.beginPath(); ctx.moveTo(-12, 20); ctx.lineTo(-46, 224); ctx.lineTo(46, 224); ctx.lineTo(12, 20); ctx.closePath(); ctx.fill(); ctx.globalAlpha /= .18;
      const lift = staticView ? 90 : Math.min(165, Math.max(0, age - 2.2) * 43);
      guard(-12, 208 - lift, 1.4);
    }
    ctx.restore();
  }
  function modern(age, staticView) {
    const deckY = H - 25, a = art();
    px('#202621bd', W - 284, deckY - 1, 255, 9); safe(W - 130, H - 104, false);
    px('#687566', W - 288, H - 137, 9, 103); px('#d8ddb4', W - 305, H - 139, 44, 5);
    ctx.fillStyle = '#d4d3bb'; ctx.font = 'bold 9px monospace'; ctx.fillText(({ en: 'BANK', pt: 'BANCO', es: 'BANCO', fil: 'BANGKO' })[language()] || 'BANK', W - 304, H - 143);
    a?.actor(ctx, W - 261, H - 93, 2, 'modern'); a?.weapon(ctx, 'ak', W - 230, H - 63, 1.7);
    a?.actor(ctx, W - 193, H - 74, 1.4, 'modern'); a?.crate(ctx, W - 74, H - 70, 1.5, true, false);
    if (!staticView && (age > 3 && age < 3.12 || age > 7 && age < 7.12)) { px('#eac77a', W - 182, H - 62, 10, 3); }
    if (!staticView && !scene.actionSound && age >= 3) { scene.actionSound = true; sound('ak'); }
  }
  function future(age, staticView) {
    const a = art(), deckY = H - 25;
    for (let i = 0; i < stars.length; i++) { const s = stars[i]; const brightness = staticView || Math.floor(age * 2 + i) % 3 ? '#7f8ca7' : '#c9e8ee'; px(brightness, s.x, s.y, 2, 2); }
    planet(72, 54, 23, '#715689', '#ae798b'); planet(171, 91, 14, '#466e7c', '#769f9d');
    px('#28334ac2', W - 293, deckY - 1, 274, 10); px('#66d9d2', W - 293, deckY - 1, 274, 2);
    for (let i = 0; i < 4; i++) { px('#3f3659', W - 269 + i * 64, deckY + 5, 25, 5); px('#9380d9', W - 266 + i * 64, deckY + 5, 4, 5); }
    safe(W - 126, H - 102, true);
    a?.actor(ctx, W - 260, H - 94, 2, 'future'); a?.weapon(ctx, 'laser', W - 229, H - 63, 1.7);
    // A second outlaw wears a jetpack. No real actor is moved or replaced.
    const bob = staticView ? 0 : Math.round(Math.sin(age * 1.8) * 3);
    a?.actor(ctx, W - 192, H - 91 + bob, 1.7, 'future'); px('#464362', W - 196, H - 66 + bob, 9, 19); px('#a892df', W - 196, H - 63 + bob, 3, 7);
    if (!staticView) { px('#77e5db', W - 196, H - 45 + bob, 4, 6 + Math.floor(age * 8) % 3); }
    const ufoX = staticView ? W - 118 : W - 118 + Math.max(0, 2 - age) * 90;
    const ufoY = staticView ? 79 : 79 + Math.sin(age) * 2;
    ufo(ufoX, ufoY, age, staticView);
    if (!staticView && (age > 3.2 && age < 3.4 || age > 7.4 && age < 7.6)) { px('#9afbed', W - 188, H - 60, 77, 2); px('#ecffed', W - 129, H - 61, 11, 4); }
    if (!staticView && !scene.actionSound && age >= 3.2) { scene.actionSound = true; sound('laser'); }
  }
  function draw(age) {
    if(root.OutlawsFightScene){if(stage)stage.hidden=true;return;}
    if (!scene || !ctx) return;
    ctx.clearRect(0, 0, W, H); ctx.imageSmoothingEnabled = false;
    const staticView = reduced();
    const fade = staticView ? 1 : Math.min(1, age / .4, (scene.duration - age) / .6);
    ctx.globalAlpha = Math.max(0, fade);
    if (era === 'future') future(age, staticView); else modern(age, staticView);
    const title = era === 'future' ? words().orbital : words().bank;
    const captionX = W - 300, captionY = 13;
    px('#171b28eb', captionX, captionY, 282, 32); px(era === 'future' ? '#79eee3' : '#b9c19a', captionX, captionY, 3, 32);
    ctx.fillStyle = era === 'future' ? '#9bf6eb' : '#d7d8b8'; ctx.font = 'bold 11px monospace'; ctx.fillText(`${words().title} · ${words()[era]}`, captionX + 10, captionY + 13);
    ctx.fillStyle = '#c2c3b7'; ctx.font = '9px monospace'; ctx.fillText(title, captionX + 10, captionY + 24);
    px('#171b28d9', W - 188, H - 18, 177, 14); ctx.fillStyle = '#c2c3b7'; ctx.font = '8px monospace'; ctx.fillText(scene.preview ? words().showcase : words().visual, W - 183, H - 8);
    ctx.globalAlpha = 1;
  }
  function clear(options = {}) {
    if (raf) root.cancelAnimationFrame(raf); raf = 0;
    root.clearTimeout(stopTimer); stopTimer = 0;
    scene = null; if (stage) stage.hidden = true; ctx?.clearRect(0, 0, W, H);
    const changed = era !== 'medieval'; era = 'medieval'; restorePalette(); if (changed && !options.silent) announce();
  }
  function resetWait() { nextAt = root.performance.now() + delay(); wasVisible = false; }
  function frame(now) {
    raf = 0;
    if(root.OutlawsFightScene){if(stage)stage.hidden=true;return;}
    if (!scene) return;
    if (!enabled && !scene.preview || !prefs().effects || !visible()) { clear(); resetWait(); return; }
    position();
    if (reduced()) { draw(4); return; }
    const age = (now - scene.started) / 1000;
    if (age >= scene.duration && !scene.persistent) { clear(); return; }
    if (scene.persistent && age >= 12) { draw(12); return; }
    draw(age); raf = root.requestAnimationFrame(frame);
  }
  function shift(nextEra, options = {}) {
    if (!initialized) init();
    if (!options || typeof options !== 'object') options = {};
    if (!initialized || !TYPES.includes(nextEra)) return false;
    // Hold the already visible arena without an era-change event that would cancel an invitation.
    if(nextEra===era&&scene&&options.persistent===true){root.clearTimeout(stopTimer);stopTimer=0;scene.persistent=true;scene.duration=Math.max(scene.duration,40);nextAt=root.performance.now()+intervalMs;return true;}
    if(['fighting','opening'].includes(root.OutlawsBossDemo?.getState?.().phase))return false;
    if (nextEra === 'medieval') { clear(); resetWait(); return true; }
    if (!prefs().effects || !visible() || !enabled && options.preview !== true) return false;
    clear({ silent: true }); era = nextEra; map.setAttribute('data-owe-era', era);
    const duration = options.persistent ? intervalMs / 1000 : Number.isFinite(options.duration) ? Math.max(12, Math.min(18, options.duration)) : 15;
    scene = { started: root.performance.now(), duration, persistent: options.persistent === true, preview: options.preview === true, actionSound: false };
    stage.hidden = Boolean(root.OutlawsFightScene); if(!root.OutlawsFightScene)position(); nextAt = scene.started + delay(); announce();
    sound('rift'); draw(reduced() ? 4 : 0); if (!reduced()&&!root.OutlawsFightScene) raf = root.requestAnimationFrame(frame);
    if (!scene.persistent) stopTimer = root.setTimeout(clear, duration * 1000); return true;
  }
  function setEnabled(value) {
    enabled = Boolean(value); try { root.localStorage.setItem(KEY, enabled ? 'on' : 'off'); } catch {}
    clear(); resetWait(); translate(); return enabled;
  }
  function translate() {
    for (const el of doc.querySelectorAll('[data-owe-word]')) el.textContent = words()[el.dataset.oweWord] || el.dataset.oweWord;
    for (const input of doc.querySelectorAll('[data-owe-toggle]')) input.checked = enabled;
    if (scene && reduced()) draw(4);
  }
  function control() {
    const label = doc.createElement('label'); label.className = 'owe-toggle';
    const input = doc.createElement('input'); input.type = 'checkbox'; input.dataset.oweToggle = ''; input.checked = enabled;
    const span = doc.createElement('span'); span.dataset.oweWord = 'toggle'; label.append(input, span); return label;
  }
  function schedule() {
    tickTimer = 0;
    if(root.OutlawsLoopV5?.ownsPresentation?.()){nextAt=root.performance.now()+intervalMs;tickTimer=root.setTimeout(schedule,1000);return;}
    if(['fighting','opening'].includes(root.OutlawsBossDemo?.getState?.().phase)){nextAt=root.performance.now()+intervalMs;tickTimer=root.setTimeout(schedule,1000);return;}
    const canSee = prefs().effects && visible();
    if (!canSee) { if (scene) clear(); resetWait(); }
    else if (!enabled) resetWait();
    else {
      if (!wasVisible) { nextAt = root.performance.now() + delay(); wasVisible = true; }
      if (root.performance.now() >= nextAt) { shift(TYPES[(TYPES.indexOf(era) + 1) % TYPES.length], { persistent: true }); wasVisible = true; }
      if (scene && reduced() && raf) { root.cancelAnimationFrame(raf); raf = 0; draw(4); }
    }
    tickTimer = root.setTimeout(schedule, 1000);
  }
  function init() {
    if (initialized) return;
    map = doc.querySelector('#heist-map'); if (!map || !doc.body || !art()) return;
    initialized = true; originalEraAttribute = map.getAttribute('data-owe-era');
    for (let i = 0; i < 24; i++) stars.push({ x: 16 + Math.floor(random() * (W - 32)), y: 12 + Math.floor(random() * 166) });
    const style = doc.createElement('style'); style.id = 'owe-style'; style.textContent = `
      #heist-map[data-owe-era="modern"]{filter:saturate(.73) sepia(.15) contrast(1.04)}#heist-map[data-owe-era="future"]{filter:sepia(.13) hue-rotate(120deg) saturate(1.14) brightness(.92);outline:1px solid #70c6c2;outline-offset:1px}
      .owe-stage{position:fixed;z-index:23;pointer-events:none;overflow:hidden;contain:layout paint}.owe-stage[hidden]{display:none}.owe-stage canvas{display:block;width:100%;height:100%;image-rendering:pixelated;background:transparent;border:0;box-shadow:none}
      .owe-panel{margin:8px auto 0;max-width:680px;background:#201c1c;border:1px solid #675467;padding:8px 10px;color:var(--text,#e8e0cc);font:12px/1.5 var(--ui,system-ui,sans-serif);box-sizing:border-box}.owe-panel summary{cursor:pointer;color:#c9b2e0;font-weight:700}.owe-panel p{font-size:11px;margin:7px 0;color:#bcb1c9}.owe-toggle{display:flex;align-items:center;gap:7px;font:12px/1.5 var(--ui,system-ui,sans-serif);margin:10px 0;color:var(--text,#e8e0cc)}.owe-toggle input{accent-color:#ad91c8}.owe-buttons{display:flex;gap:6px;flex-wrap:wrap}.owe-buttons button{font:inherit;color:#d7c4e8;background:#302a37;border:1px solid #7b678d;padding:5px 10px;cursor:pointer}.owe-buttons button:focus-visible{outline:2px solid #bfa2de;outline-offset:2px}.owe-status{font-size:11px;min-height:16px;color:#bcb1c9}
    `; doc.head.appendChild(style);
    stage = doc.createElement('div'); stage.id = 'owe-stage'; stage.className = 'owe-stage'; stage.hidden = true; stage.setAttribute('aria-hidden', 'true');
    canvas = doc.createElement('canvas'); canvas.id = 'owe-canvas'; canvas.width = W; canvas.height = H; stage.appendChild(canvas); doc.body.appendChild(stage); ctx = canvas.getContext('2d');
    const settings = control(); settings.id = 'owe-settings'; doc.querySelector('#ajustes')?.insertBefore(settings, doc.querySelector('#ajustes [data-act="close-ajustes"]'));
    if (new URLSearchParams(root.location.search).has('demo')) {
      panel = doc.createElement('details'); panel.id = 'owe-preview'; panel.className = 'owe-panel';
      const summary = doc.createElement('summary'); summary.dataset.oweWord = 'preview';
      const help = doc.createElement('p'); help.dataset.oweWord = 'help';
      const buttons = doc.createElement('div'); buttons.className = 'owe-buttons';
      for (const name of ['modern', 'future', 'medieval']) { const button = doc.createElement('button'); button.type = 'button'; button.dataset.owePreview = name; button.dataset.oweWord = name; buttons.appendChild(button); }
      const status = doc.createElement('div'); status.id = 'owe-status'; status.className = 'owe-status'; status.setAttribute('role', 'status');
      panel.append(summary, control(), help, buttons, status); (doc.querySelector('#heist')?.parentElement || map.parentElement).appendChild(panel);
    }
    doc.addEventListener('click', (event) => { const button = event.target.closest?.('[data-owe-preview]'); if (!button) return; const ok = shift(button.dataset.owePreview, { preview: true }); const status = doc.querySelector('#owe-status'); if (status) status.textContent = ok ? `${words().showcase}: ${words()[button.dataset.owePreview]}` : words().unavailable; });
    doc.addEventListener('change', (event) => { if (event.target.matches?.('[data-owe-toggle]')) setEnabled(event.target.checked); if (event.target.matches?.('[data-owj-setting]')) { clear(); resetWait(); } });
    doc.addEventListener('visibilitychange', () => { clear(); resetWait(); });
    root.addEventListener('scroll', () => { if (scene) position(); }, { passive: true }); root.addEventListener('resize', () => { if (scene) position(); });
    root.addEventListener('outlaws:era', (event) => { if (event.detail?.era) shift(event.detail.era, event.detail); });
    media?.addEventListener?.('change', () => { clear(); resetWait(); }); root.I18N?.onChange?.(translate);
    if (root.ResizeObserver) { const observer = new ResizeObserver(() => { if (scene) position(); }); observer.observe(map); observerRefs.push(observer); }
    translate(); resetWait(); tickTimer = root.setTimeout(schedule, 1000);
    root.dispatchEvent(new CustomEvent('outlaws:eras-ready'));
  }
  function setIntervalSeconds(value) { const seconds = Math.max(15, Math.min(300, Math.round(Number(value) || 60))); intervalMs = seconds * 1000; try { root.localStorage.setItem('outlaws:chaos:seconds', String(seconds)); } catch {} resetWait(); return seconds; }
  root.OutlawsEras = { init, shift, setEnabled, clear, setIntervalSeconds, getState: () => ({ initialized, enabled, era: root.OutlawsLoopV5?.getState?.().displayEra || era, intervalSeconds: intervalMs / 1000, active: Boolean(scene), persistent: Boolean(scene?.persistent), preview: Boolean(scene?.preview), remainingMs: scene ? Math.max(0, scene.duration * 1000 - (root.performance.now() - scene.started)) : 0, rafActive: Boolean(raf), visible: visible(), reducedMotion: reduced(), nextInMs: enabled && wasVisible ? Math.max(0, nextAt - root.performance.now()) : null }) };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})(window);

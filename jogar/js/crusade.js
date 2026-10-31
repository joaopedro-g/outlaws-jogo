/* CRUSADE OF DUTY, modern warfare, 1347 edition.
 * Original pixel cameos on a separate canvas. Never touches the heist simulation.
 * Optional source hook: trigger('ak', { actor: { x, y }, preview: false }).
 * Coordinates are normalized to a 544x416 presentation stage, not inferred from game state.
 */
(function (root) {
  'use strict';
  if (root.OutlawsCrusade) return;
  const doc = root.document, W = 544, H = 416, WEAPONS = ['ak', 'awp', 'grenade', 'taser'];
  const media = root.matchMedia?.('(prefers-reduced-motion: reduce)');
  const KEY = 'outlaws:crusade:enabled';
  let enabled = true;
  try { enabled = root.localStorage.getItem(KEY) !== 'off'; } catch {}
  let initialized = false, map, stage, canvas, ctx, panel, settingsControl;
  let scene = null, raf = 0, stopTimer = 0, tickTimer = 0, nextAt = 0, wasVisible = false;
  let randomState = (0x1347c0d ^ Math.floor(root.performance.now() * 1000)) >>> 0;
  const observerRefs = [];
  const dictionary = {
    en: { title: 'CRUSADE OF DUTY', subtitle: 'Modern warfare, 1347 edition', toggle: 'Temporal arsenal', help: 'An outlaw. A time-tossed weapon cache. Visual gear.', preview: 'Arsenal preview', ak: 'AK', awp: 'AWP', grenade: 'Grenade', taser: 'Taser', cache: 'TEMPORAL CACHE', equipment: 'VISUAL GEAR', showcase: 'PREVIEW', joke_ak: 'Heresy!', joke_awp: 'The King did not approve this.', joke_grenade: 'What sorcery is this?', joke_taser: 'Zap. Thou art grounded.', unavailable: 'Enable special effects and bring the heist map into view.' },
    pt: { title: 'CRUSADE OF DUTY', subtitle: 'Guerra moderna, edição 1347', toggle: 'Arsenal temporal', help: 'Um bandido. Uma caixa perdida no tempo. Equipamento visual.', preview: 'Prévia do arsenal', ak: 'AK', awp: 'AWP', grenade: 'Granada', taser: 'Taser', cache: 'CAIXA TEMPORAL', equipment: 'EQUIPAMENTO VISUAL', showcase: 'PRÉVIA', joke_ak: 'Heresia!', joke_awp: 'O rei não aprovou isso.', joke_grenade: 'Que feitiçaria é essa?', joke_taser: 'Zap. Tu estás de castigo.', unavailable: 'Ative os efeitos especiais e deixe o mapa do assalto visível.' },
    es: { title: 'CRUSADE OF DUTY', subtitle: 'Guerra moderna, edición 1347', toggle: 'Arsenal temporal', help: 'Un bandido. Una caja perdida en el tiempo. Equipo visual.', preview: 'Vista previa del arsenal', ak: 'AK', awp: 'AWP', grenade: 'Granada', taser: 'Taser', cache: 'CAJA TEMPORAL', equipment: 'EQUIPO VISUAL', showcase: 'VISTA PREVIA', joke_ak: '¡Herejía!', joke_awp: 'El rey no aprobó esto.', joke_grenade: '¿Qué brujería es esta?', joke_taser: 'Zap. Estás castigado.', unavailable: 'Activa los efectos especiales y deja visible el mapa del atraco.' },
    fil: { title: 'CRUSADE OF DUTY', subtitle: 'Makabagong digmaan, edisyon 1347', toggle: 'Arsenal mula sa ibang panahon', help: 'Isang bandido. Isang kahong naligaw sa panahon. Biswal na kagamitan.', preview: 'Silip sa arsenal', ak: 'AK', awp: 'AWP', grenade: 'Granada', taser: 'Taser', cache: 'KAHONG MULA SA IBANG PANAHON', equipment: 'BISWAL NA KAGAMITAN', showcase: 'SILIP', joke_ak: 'Kalapastanganan!', joke_awp: 'Hindi ito inaprubahan ng hari.', joke_grenade: 'Anong salamangka ito?', joke_taser: 'Zap. Bawal kang gumalaw.', unavailable: 'I-on ang special effects at ipakita ang mapa ng heist.' }
  };
  const language = () => { const value = root.I18N?.lang?.() || doc.documentElement.lang || 'en'; return value === 'ph' || value === 'tl' ? 'fil' : value; };
  const text = () => dictionary[language()] || dictionary.en;
  const prefs = () => root.OutlawsJuice?.getState?.() || { effects: true, reducedMotion: false };
  const reduced = () => Boolean(media?.matches || prefs().reducedMotion);
  function random() { randomState ^= randomState << 13; randomState ^= randomState >>> 17; randomState ^= randomState << 5; return (randomState >>> 0) / 4294967296; }
  const delay = () => 20000 + Math.floor(random() * 15000);
  function inView() {
    if (!map?.isConnected || doc.hidden || !map.getClientRects().length) return false;
    const r = map.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 50 && r.top < root.innerHeight - 30 && r.right > 0 && r.left < root.innerWidth;
  }
  function position() {
    if (!stage || !map) return;
    const r = map.getBoundingClientRect(), border = Number.parseFloat(root.getComputedStyle(map).borderLeftWidth) || 0;
    stage.style.left = (r.left + border) + 'px'; stage.style.top = (r.top + border) + 'px';
    stage.style.width = Math.max(0, r.width - border * 2) + 'px'; stage.style.height = Math.max(0, r.height - border * 2) + 'px';
  }
  const px = (context, color, x, y, w = 1, h = 1) => { context.fillStyle = color; context.fillRect(Math.round(x), Math.round(y), w, h); };
  function actor(context, x, y, scale = 2, skin = 'medieval') {
    context.save(); context.translate(Math.round(x), Math.round(y)); context.scale(scale, scale);
    const hood = skin === 'future' ? '#28283f' : skin === 'modern' ? '#28312b' : '#3c2923';
    px(context, '#111217', 5, 0, 12, 3); px(context, hood, 3, 3, 16, 11); px(context, '#171418', 5, 5, 12, 8);
    px(context, '#bd8d66', 8, 6, 6, 3); px(context, skin === 'future' ? '#8af9ef' : '#efd496', 8, 7, 2, 1); px(context, skin === 'future' ? '#8af9ef' : '#efd496', 12, 7, 2, 1);
    px(context, '#281c20', 7, 9, 8, 4); px(context, hood, 4, 13, 14, 12); px(context, '#594539', 3, 16, 4, 9); px(context, '#bd8d66', 15, 16, 5, 3);
    px(context, '#1c1b24', 5, 25, 5, 5); px(context, '#1c1b24', 12, 25, 5, 5); px(context, '#101116', 3, 29, 8, 3); px(context, '#101116', 12, 29, 8, 3);
    px(context, skin === 'future' ? '#69d4d3' : '#ae8e53', 5, 22, 12, 2); px(context, '#e4be78', 10, 21, 3, 3);
    if (skin === 'future') { px(context, '#936ee0', 3, 14, 2, 7); px(context, '#62dbe0', 16, 14, 2, 7); }
    context.restore();
  }
  function weapon(context, type, x, y, scale = 2, color = '#48504e') {
    context.save(); context.translate(Math.round(x), Math.round(y)); context.scale(scale, scale);
    if (type === 'ak') { px(context, '#916235', 0, 2, 5, 4); px(context, color, 5, 1, 15, 3); px(context, '#a9763b', 12, 3, 6, 3); px(context, '#191c22', 20, 2, 7, 1); px(context, '#30353c', 8, 4, 3, 6); px(context, '#4c5256', 9, 9, 4, 2); }
    else if (type === 'awp') { px(context, '#424841', 0, 3, 7, 5); px(context, '#789071', 7, 2, 15, 4); px(context, '#11151b', 22, 3, 12, 2); px(context, '#222b2e', 11, -2, 9, 3); px(context, '#a8ccb5', 18, -1, 2, 1); px(context, '#2e3834', 10, 6, 3, 5); }
    else if (type === 'grenade') { px(context, '#7d9762', 3, 0, 5, 2); px(context, '#a6ad82', 8, 0, 2, 2); px(context, '#2b332c', 1, 2, 9, 9); px(context, '#687d4a', 2, 3, 7, 7); px(context, '#9baa6e', 3, 3, 2, 5); px(context, '#333b2d', 2, 6, 7, 1); }
    else if (type === 'taser') { px(context, '#222c37', 0, 0, 13, 6); px(context, '#bd9553', 2, 2, 6, 3); px(context, '#293746', 2, 6, 4, 6); px(context, '#c8edf0', 12, 0, 3, 2); px(context, '#c8edf0', 12, 4, 3, 2); px(context, '#7acfd9', 5, 1, 4, 1); }
    else if (type === 'laser') { px(context, '#3b3058', 0, 1, 20, 5); px(context, '#80eee5', 7, 2, 10, 1); px(context, '#986ded', 3, 6, 4, 5); px(context, '#b8fff3', 20, 2, 4, 3); }
    context.restore();
  }
  function crate(context, x, y, scale = 2, open = false, future = false) {
    context.save(); context.translate(Math.round(x), Math.round(y)); context.scale(scale, scale);
    px(context, '#17191b', 0, 0, 23, 18); px(context, future ? '#3b3857' : '#5d6745', 1, 1, 21, 16);
    px(context, future ? '#7760a0' : '#859066', 2, 2, 19, 2); px(context, '#303b32', 1, 13, 21, 3); px(context, '#ada682', 3, 0, 3, 18); px(context, '#ada682', 17, 0, 3, 18);
    px(context, future ? '#80eee5' : '#d9c58e', 10, 5, 3, 8); px(context, future ? '#80eee5' : '#d9c58e', 8, 8, 7, 2);
    if (open) { px(context, '#121516', 6, 4, 11, 5); px(context, future ? '#80eee5' : '#dcc786', 7, -4, 9, 3); }
    context.restore();
  }
  function sound(name) { if (prefs().effects && !doc.hidden) root.OutlawsArsenalSFX?.play?.(name); }
  function draw(age) {
    if (!scene || !ctx) return;
    ctx.clearRect(0, 0, W, H); ctx.imageSmoothingEnabled = false;
    const staticView = reduced(), skin = root.OutlawsEras?.getState?.().era || 'medieval';
    const x = scene.actor.x, floor = scene.actor.y, actorX = x - 18, actorY = floor - 64;
    const time = staticView ? 3.1 : age;
    const fade = staticView ? 1 : Math.min(1, age / .35, (7 - age) / .5);
    ctx.globalAlpha = Math.max(0, fade);
    px(ctx, '#171912b8', x - 50, floor - 2, 144, 7);
    const drop = time < 1.1 ? Math.pow(1 - time / 1.1, 2) * 100 : 0;
    crate(ctx, x + 30, floor - 36 - drop, 2, time > 1.1, skin === 'future');
    actor(ctx, actorX, actorY, 2, skin);
    const armed = time >= 1.25;
    if (armed) weapon(ctx, scene.weapon, actorX + 30, actorY + 29, 1.7);
    if (!staticView) {
      if (time < 1.25) {
        for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + time * 2; px(ctx, skin === 'future' ? '#9bdfe6' : '#d3bc7e', x + 52 + Math.cos(a) * 27, floor - 29 - drop + Math.sin(a) * 15, 3, 3); }
      }
      const fireAges = scene.weapon === 'ak' ? [2.35, 2.52, 2.69, 4.15, 4.32] : scene.weapon === 'awp' ? [2.35, 4.25] : [2.35, 4.15];
      for (const start of fireAges) {
        const since = time - start;
        if (since < 0 || since > .65) continue;
        if ((scene.weapon === 'ak' || scene.weapon === 'awp') && since < .1) { px(ctx, '#f5cd68', actorX + (scene.weapon === 'ak' ? 77 : 89), actorY + 30, 10, 5); px(ctx, '#fff0a3', actorX + (scene.weapon === 'ak' ? 81 : 93), actorY + 31, 10, 2); }
        if ((scene.weapon === 'ak' || scene.weapon === 'awp') && since < .5) px(ctx, '#e0b263', actorX + 45 - since * 30, actorY + 27 - Math.sin(since * Math.PI * 2) * 18 + since * 24, 3, 2);
        if (scene.weapon === 'taser' && since < .32) { for (let i = 0; i < 6; i++) px(ctx, i % 2 ? '#7be4ef' : '#e6fbfb', actorX + 55 + i * 7, actorY + 30 + (i % 2 ? 4 : -2), 8, 2); }
        if (scene.weapon === 'grenade') {
          if (since < .42) weapon(ctx, 'grenade', actorX + 48 + since * 130, actorY + 30 - Math.sin(since / .42 * Math.PI) * 25, 1);
          else { const blast = (since - .42) / .23; for (let i = 0; i < 8; i++) { const angle = i * Math.PI / 4; px(ctx, i % 2 ? '#bf7b48' : '#efc46d', actorX + 106 + Math.cos(angle) * blast * 24, actorY + 32 + Math.sin(angle) * blast * 24, 5, 5); } }
        }
      }
      if (!scene.fired && time >= 2.35) { scene.fired = true; sound(scene.weapon); }
    }
    const bannerX = Math.min(W - 240, Math.max(6, x - 48)), bannerY = Math.max(6, floor - 91);
    px(ctx, '#171719eb', bannerX, bannerY, 234, 21); px(ctx, '#c9ad66', bannerX, bannerY, 3, 21);
    ctx.fillStyle = '#e4ce97'; ctx.font = 'bold 10px monospace'; ctx.fillText(`${text().cache} · ${text()[scene.weapon]}`, bannerX + 9, bannerY + 12);
    ctx.font = '8px monospace'; ctx.fillStyle = '#bcb69d'; ctx.fillText(scene.preview ? text().showcase : text().equipment, bannerX + 9, bannerY + 19);
    if (armed && (staticView || time < 5.5)) {
      const joke = text()['joke_' + scene.weapon]; ctx.font = '9px monospace';
      const width = Math.min(270, Math.ceil(ctx.measureText(joke).width) + 14), bubbleX = Math.min(W - width - 6, x + 29), bubbleY = floor - 64;
      px(ctx, '#dfd1ad', bubbleX, bubbleY, width, 18); px(ctx, '#dfd1ad', bubbleX - 4, bubbleY + 10, 4, 4);
      ctx.fillStyle = '#33291e'; ctx.fillText(joke, bubbleX + 7, bubbleY + 12);
    }
    ctx.globalAlpha = 1;
  }
  function clear(options) {
    if (!options?.preserveGear) root.OutlawsEquippedWeapons?.clear(); // Additive equipment hook; never touches the simulation.
    if (raf) root.cancelAnimationFrame(raf); raf = 0;
    root.clearTimeout(stopTimer); stopTimer = 0;
    scene = null; if (stage) stage.hidden = true; ctx?.clearRect(0, 0, W, H);
  }
  function resetWait() { nextAt = root.performance.now() + delay(); wasVisible = false; }
  function frame(now) {
    raf = 0;
    if (!scene) return;
    if (!enabled && !scene.preview || !prefs().effects || !inView()) { clear(); resetWait(); return; }
    position();
    if (reduced()) { draw(3.1); return; }
    const age = (now - scene.started) / 1000;
    if (age >= 7) { clear(); return; }
    draw(age); raf = root.requestAnimationFrame(frame);
  }
  function trigger(weaponName, options = {}) {
    if(root.OutlawsLoopV5?.ownsPresentation?.())return false;
    if (!initialized) init();
    if (!options || typeof options !== 'object') options = {};
    if (!WEAPONS.includes(weaponName) || !initialized || !prefs().effects || !inView() || !enabled && options.preview !== true) return false;
    if (root.OutlawsEquippedWeapons) {
      clear({ preserveGear: true });
      const equipped = root.OutlawsEquippedWeapons.equip(weaponName, options);
      nextAt = root.performance.now() + delay();
      return Boolean(equipped);
    }
    clear();
    const actorPoint = options.actor || {};
    const point = { x: Number.isFinite(actorPoint.x) ? Math.max(56, Math.min(W - 160, actorPoint.x)) : 108, y: Number.isFinite(actorPoint.y) ? Math.max(120, Math.min(H - 18, actorPoint.y)) : H - 40 };
    scene = { weapon: weaponName, actor: point, preview: options.preview === true, started: root.performance.now(), fired: false };
    stage.hidden = false; position(); nextAt = scene.started + delay();
    if (reduced()) { draw(3.1); scene.fired = true; sound(weaponName); }
    else { sound('rift'); draw(0); raf = root.requestAnimationFrame(frame); }
    stopTimer = root.setTimeout(clear, 7000);
    return true;
  }
  function setEnabled(value) {
    enabled = Boolean(value); try { root.localStorage.setItem(KEY, enabled ? 'on' : 'off'); } catch {}
    clear(); resetWait(); translate(); return enabled;
  }
  function translate() {
    for (const el of doc.querySelectorAll('[data-owc-word]')) el.textContent = text()[el.dataset.owcWord] || el.dataset.owcWord;
    for (const input of doc.querySelectorAll('[data-owc-toggle]')) input.checked = enabled;
    if (scene && reduced()) draw(3.1);
  }
  function control() {
    const label = doc.createElement('label'); label.className = 'owc-toggle';
    const input = doc.createElement('input'); input.type = 'checkbox'; input.dataset.owcToggle = ''; input.checked = enabled;
    const title = doc.createElement('span'); title.dataset.owcWord = 'toggle'; label.append(input, title); return label;
  }
  function schedule() {
    tickTimer = 0;
    if (!initialized) return;
    const visible = prefs().effects && inView();
    if (!visible) { if (scene) clear(); resetWait(); }
    else if (!enabled) resetWait();
    else {
      if (!wasVisible) { nextAt = root.performance.now() + delay(); wasVisible = true; }
      if (!scene && root.performance.now() >= nextAt) trigger(WEAPONS[Math.floor(random() * WEAPONS.length)]);
      if (scene && reduced() && raf) { root.cancelAnimationFrame(raf); raf = 0; draw(3.1); }
    }
    tickTimer = root.setTimeout(schedule, 1000);
  }
  function init() {
    if (initialized) return;
    map = doc.querySelector('#heist-map'); if (!map || !doc.body) return;
    initialized = true;
    const style = doc.createElement('style'); style.id = 'owc-style'; style.textContent = `
      .owc-stage{position:fixed;z-index:24;pointer-events:none;overflow:hidden;contain:layout paint}.owc-stage[hidden]{display:none}.owc-stage canvas{display:block;width:100%;height:100%;image-rendering:pixelated;background:transparent;border:0;box-shadow:none}
      .owc-panel{margin:10px auto 0;max-width:680px;background:#201c15;border:1px solid #665740;padding:8px 10px;color:var(--text,#e8e0cc);font:12px/1.5 var(--ui,system-ui,sans-serif);box-sizing:border-box}.owc-panel summary{cursor:pointer;color:#e4ce97;font-weight:700}.owc-panel p{font-size:11px;margin:7px 0;color:#c4b79f}.owc-toggle{display:flex;align-items:center;gap:7px;font:12px/1.5 var(--ui,system-ui,sans-serif);margin:10px 0;color:var(--text,#e8e0cc)}.owc-toggle input{accent-color:#bda86f}.owc-buttons{display:flex;flex-wrap:wrap;gap:6px}.owc-buttons button{font:inherit;color:#e4ce97;background:#302b21;border:1px solid #7d7050;padding:5px 10px;cursor:pointer}.owc-buttons button:focus-visible{outline:2px solid #e4ce97;outline-offset:2px}.owc-status{font-size:11px;min-height:16px;color:#c4b79f}.owc-panel small{display:block;font-size:10px;color:#a8a18d}
    `; doc.head.appendChild(style);
    stage = doc.createElement('div'); stage.id = 'owc-stage'; stage.className = 'owc-stage'; stage.hidden = true; stage.setAttribute('aria-hidden', 'true');
    canvas = doc.createElement('canvas'); canvas.width = W; canvas.height = H; canvas.id = 'owc-canvas'; stage.appendChild(canvas); doc.body.appendChild(stage); ctx = canvas.getContext('2d');
    settingsControl = control(); settingsControl.id = 'owc-settings'; doc.querySelector('#ajustes')?.insertBefore(settingsControl, doc.querySelector('#ajustes [data-act="close-ajustes"]'));
    if (new URLSearchParams(root.location.search).has('demo')) {
      panel = doc.createElement('details'); panel.id = 'owc-preview'; panel.className = 'owc-panel';
      const summary = doc.createElement('summary'); summary.dataset.owcWord = 'title';
      const subtitle = doc.createElement('small'); subtitle.dataset.owcWord = 'subtitle';
      const help = doc.createElement('p'); help.dataset.owcWord = 'help';
      const buttons = doc.createElement('div'); buttons.className = 'owc-buttons';
      for (const name of WEAPONS) { const button = doc.createElement('button'); button.type = 'button'; button.dataset.owcPreview = name; button.dataset.owcWord = name; buttons.appendChild(button); }
      const status = doc.createElement('div'); status.id = 'owc-status'; status.className = 'owc-status'; status.setAttribute('role', 'status');
      panel.append(summary, subtitle, control(), help, buttons, status); (doc.querySelector('#heist')?.parentElement || map.parentElement).appendChild(panel);
    }
    doc.addEventListener('click', (event) => { const button = event.target.closest?.('[data-owc-preview]'); if (!button) return; const ok = trigger(button.dataset.owcPreview, { preview: true }); const status = doc.querySelector('#owc-status'); if (status) status.textContent = ok ? `${text().showcase}: ${text()[button.dataset.owcPreview]}` : text().unavailable; });
    doc.addEventListener('change', (event) => { if (event.target.matches?.('[data-owc-toggle]')) setEnabled(event.target.checked); if (event.target.matches?.('[data-owj-setting]')) { clear(); resetWait(); } });
    doc.addEventListener('visibilitychange', () => { clear(); resetWait(); });
    root.addEventListener('scroll', () => { if (scene) position(); }, { passive: true }); root.addEventListener('resize', () => { if (scene) position(); });
    root.addEventListener('outlaws:crusade', (event) => { if (event.detail?.weapon) trigger(event.detail.weapon, event.detail); });
    root.addEventListener('outlaws:era-change', () => { if (scene && reduced()) draw(3.1); });
    media?.addEventListener?.('change', () => { clear(); resetWait(); }); root.I18N?.onChange?.(translate);
    if (root.ResizeObserver) { const observer = new ResizeObserver(() => { if (scene) position(); }); observer.observe(map); observerRefs.push(observer); }
    translate(); resetWait(); tickTimer = root.setTimeout(schedule, 1000);
    root.dispatchEvent(new CustomEvent('outlaws:crusade-ready'));
  }
  root.OutlawsCrusade = { init, trigger, setEnabled, clear, art: { actor, weapon, crate, px }, getState: () => ({ initialized, enabled, active: Boolean(scene), weapon: scene?.weapon || null, preview: Boolean(scene?.preview), remainingMs: scene ? Math.max(0, 7000 - (root.performance.now() - scene.started)) : 0, rafActive: Boolean(raf), visible: inView(), reducedMotion: reduced(), nextInMs: enabled && wasVisible ? Math.max(0, nextAt - root.performance.now()) : null }) };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})(window);

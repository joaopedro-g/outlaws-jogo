/* OUTLAWS: gear painted on the real, already rendered outlaw.
 * Inputs are copied render coordinates. No simulation, balances, or RNG is read.
 * beginFrame -> drawActor for each real sprite -> endFrame paints one final layer.
 * Without beginFrame, drawActor paints immediately. fire() is cosmetic only.
 */
(function (root) {
  'use strict';
  if (root.OutlawsEquippedWeapons) return;
  const doc = root.document, media = root.matchMedia?.('(prefers-reduced-motion: reduce)');
  const WEAPONS = ['ak', 'awp', 'grenade', 'taser'];
  const COLOR = { ak: '#f2c15c', awp: '#d7daca', grenade: '#eba65a', taser: '#75eaf4' };
  const COOLDOWN = { ak: 260, awp: 750, grenade: 1000, taser: 550 };
  const providers = new Map(); let equipPolicy = null;
  function registerWeapon(name, provider) {
    if (!/^[a-z][a-z0-9-]{1,24}$/.test(name) || !provider || typeof provider.draw !== 'function') return false;
    providers.set(name, provider); if (!WEAPONS.includes(name)) WEAPONS.push(name);
    COLOR[name] = provider.color || '#bfe5ee'; COOLDOWN[name] = Math.max(120, Number(provider.cooldown) || 550);
    for (const lang of Object.keys(JOKES)) JOKES[lang][name] = provider.jokes?.[lang] || provider.jokes?.en || 'For the loot!';
    return true;
  }
  const JOKES = {
    en: { ak: 'Heresy!', awp: 'The King did not approve this.', grenade: 'What sorcery is this?', taser: 'Thou art grounded!' },
    pt: { ak: 'Heresia!', awp: 'O rei não aprovou isso.', grenade: 'Que feitiçaria é essa?', taser: 'Tu estás de castigo!' },
    es: { ak: '¡Herejía!', awp: 'El rey no aprobó esto.', grenade: '¿Qué brujería es esta?', taser: '¡Estás castigado!' },
    fil: { ak: 'Kalapastanganan!', awp: 'Hindi ito inaprubahan ng hari.', grenade: 'Anong salamangka ito?', taser: 'Bawal kang gumalaw!' }
  };
  const actors = new Map(), equipped = new Map(), poofs = new Map(), frames = new WeakMap();
  const flashes = [], cameraAnimations = new Set();
  const colorStyle = doc.createElement('style'); colorStyle.id = 'oweq-color-pass';
  colorStyle.textContent = '#heist-map[data-owe-era="future"][data-oweq-preserve-blue]{filter:none}';
  doc.head.appendChild(colorStyle);
  let enabled = true, maintenance = 0, sequence = 0, roundRobin = 0;
  const clock = () => root.performance.now();
  const prefs = () => root.OutlawsJuice?.getState?.() || { effects: true, reducedMotion: false };
  const reduced = () => Boolean(media?.matches || prefs().reducedMotion);
  const joke = (weapon) => { const language = root.I18N?.lang?.() || doc.documentElement.lang || 'en'; return (JOKES[language === 'ph' || language === 'tl' ? 'fil' : language] || JOKES.en)[weapon]; };
  const idOf = (value) => {
    if (typeof value === 'string' && /^sprite:[a-f0-9]{1,16}$/i.test(value)) return value;
    const n = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
    return Number.isSafeInteger(n) && n >= 0 ? n : null;
  };
  const number = (value, fallback) => Number.isFinite(value) ? value : fallback;
  function onScreen(canvas) {
    if (doc.hidden) return false;
    if (!canvas?.getClientRects || !canvas.getClientRects().length) return false;
    const r = canvas.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 20 && r.top < root.innerHeight - 20 && r.right > 0 && r.left < root.innerWidth;
  }
  function sound(name) { if (!doc.hidden && prefs().effects) root.OutlawsEquippedSFX?.play?.(name); }
  function syncColorPass() {
    const map = doc.getElementById('heist-map'); if (!map) return;
    // Keep the Taser blue while the old future palette rotates the whole canvas.
    if (equipped.size) map.setAttribute('data-oweq-preserve-blue', '');
    else map.removeAttribute('data-oweq-preserve-blue');
  }
  function copyPoint(value) {
    if (!value || typeof value !== 'object') return null;
    const x = number(value.x, value.cx), y = number(value.y, value.cy);
    return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
  }
  function pixel(ctx, color, x, y, width = 1, height = 1) {
    ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), width, height);
  }
  function drawWeapon(ctx, type, scale = 1) {
    ctx.save(); ctx.scale(scale, scale);
    if (providers.has(type)) { providers.get(type).draw(ctx); ctx.restore(); return; }
    // Chunky original silhouettes, intentionally a little too big for medieval hands.
    if (type === 'ak') {
      pixel(ctx, '#161b22', -10, -4, 32, 7); pixel(ctx, '#a46c3d', -9, -2, 7, 5);
      pixel(ctx, '#657061', -2, -3, 15, 4); pixel(ctx, '#b88345', 9, 1, 8, 4);
      pixel(ctx, '#303641', 2, 1, 4, 8); pixel(ctx, '#657067', 3, 8, 5, 3);
      pixel(ctx, '#121c24', 21, -2, 10, 2); pixel(ctx, '#ced2b1', 18, -3, 3, 1);
    } else if (type === 'awp') {
      pixel(ctx, '#161c22', -11, -4, 36, 8); pixel(ctx, '#74896c', -10, -2, 11, 6);
      pixel(ctx, '#9caa8a', 1, -3, 17, 5); pixel(ctx, '#1b2528', 18, -2, 17, 3);
      pixel(ctx, '#202a2d', 4, -9, 13, 5); pixel(ctx, '#c3dcba', 14, -8, 3, 2);
      pixel(ctx, '#2a352d', 1, 3, 4, 7); pixel(ctx, '#b0bc91', 8, 3, 9, 1);
    } else if (type === 'grenade') {
      pixel(ctx, '#d4cd99', 1, -6, 4, 3); pixel(ctx, '#b0b894', 5, -7, 4, 2);
      pixel(ctx, '#1c2825', -3, -3, 13, 13); pixel(ctx, '#839259', -2, -2, 11, 11);
      pixel(ctx, '#c0bd7a', -1, -2, 3, 8); pixel(ctx, '#455841', -2, 2, 11, 2);
      pixel(ctx, '#455841', 3, -2, 2, 11); pixel(ctx, '#29362b', 0, 9, 7, 2);
    } else if (type === 'taser') {
      pixel(ctx, '#142433', -7, -6, 22, 11); pixel(ctx, '#537485', -6, -5, 18, 8);
      pixel(ctx, '#e5b55d', -4, -3, 8, 5); pixel(ctx, '#182c3c', -3, 4, 6, 11);
      pixel(ctx, '#8cf4f3', 12, -6, 7, 3); pixel(ctx, '#8cf4f3', 12, 1, 7, 3);
      pixel(ctx, '#39bccc', 3, -4, 7, 1); pixel(ctx, '#b7ffff', 17, -5, 3, 1);
    }
    ctx.restore();
  }
  function muzzle(actor, weapon) {
    const face = actor.face, reach = providers.get(weapon)?.reach || (weapon === 'awp' ? 39 : weapon === 'ak' ? 35 : weapon === 'taser' ? 22 : 15);
    return { x: actor.x + actor.width / 2 + face * reach, y: actor.y + actor.height * .57 - 2 };
  }
  function drawSightline(ctx, actor, recoil = 0) {
    const from = muzzle(actor, 'awp'); from.x -= actor.face * recoil;
    const target = actor.target;
    let dx = target ? target.x - from.x : actor.face, dy = target ? target.y - from.y : 0;
    let distance = Math.hypot(dx, dy);
    if (distance < 1 || dx * actor.face <= 0) { dx = actor.face; dy = 0; distance = 1; }
    // Presentation range only. This line never changes an attack, target, or chance.
    const length = Math.max(110, Math.min(180, distance)), steps = Math.ceil(length);
    ctx.save(); ctx.globalAlpha *= reduced() ? .3 : .46;
    for (let i = 0; i <= steps; i++) pixel(ctx, '#e4ecc9', from.x + dx / distance * i, from.y + dy / distance * i, 1, 1);
    ctx.restore();
  }
  function expire(id, options = {}) {
    const ids = id === undefined || id === null ? [...equipped.keys()] : [idOf(id)];
    let count = 0;
    for (const key of ids) {
      const gear = equipped.get(key); if (!gear) continue;
      const actor = actors.get(key); equipped.delete(key); count++;
      if (!options.silent && actor && onScreen(actor.canvas) && prefs().effects) {
        if (!reduced()) poofs.set(key, { started: clock(), color: COLOR[gear.weapon], x: actor.x + actor.width / 2, y: actor.y + actor.height / 2 });
        sound('poof');
      }
    }
    if (count) { syncColorPass(); ensureMaintenance(); }
    return count;
  }
  function clear() { equipped.clear(); syncColorPass(); poofs.clear(); flashes.length = 0; for (const animation of cameraAnimations) animation.cancel(); cameraAnimations.clear(); root.clearTimeout(maintenance); maintenance = 0; }
  function stopMotion() { for (const gear of equipped.values()) gear.shots = []; poofs.clear(); flashes.length = 0; for (const animation of cameraAnimations) animation.cancel(); cameraAnimations.clear(); }
  function prune(now = clock()) {
    if (doc.hidden || !prefs().effects) { clear(); return; }
    for (const [id, gear] of equipped) if (now >= gear.expiresAt || now - (actors.get(id)?.lastSeen ?? 0) > 1200) expire(id, { silent: now - (actors.get(id)?.lastSeen ?? 0) > 1200 });
    for (const [id, puff] of poofs) if (now - puff.started > 420) poofs.delete(id);
    for (const [id, actor] of actors) if (now - actor.lastSeen > 20000) actors.delete(id);
    while (flashes.length && now - flashes[0].started > 150) flashes.shift();
  }
  function ensureMaintenance() {
    if (maintenance || !equipped.size && !poofs.size) return;
    maintenance = root.setTimeout(() => {
      maintenance = 0; prune();
      const now = clock();
      for (const [id, gear] of equipped) if (gear.previewAt && now >= gear.previewAt) { gear.previewAt = 0; fire(id, { showcase: true }); }
      if (equipped.size || poofs.size) ensureMaintenance();
    }, 120);
  }
  function candidates(now) {
    return [...actors.values()].filter((actor) => actor.working && now - actor.lastSeen < 1000 && onScreen(actor.canvas)).sort((a, b) => typeof a.id === 'number' && typeof b.id === 'number' ? a.id - b.id : String(a.id).localeCompare(String(b.id)));
  }
  function equip(weapon, options = {}) {
    if (!options || typeof options !== 'object') options = {};
    if (equipPolicy) { const result = equipPolicy(weapon, { ...options }); if (result) { weapon = result.weapon || weapon; options = { ...options, ...result }; } }
    if (!WEAPONS.includes(weapon) || !prefs().effects || doc.hidden || !enabled && !options.preview) return null;
    const now = clock(); prune(now);
    const list = candidates(now); if (!list.length) return null;
    let actor;
    if (options.id !== undefined) actor = list.find((item) => item.id === idOf(options.id));
    else {
      // Repeated preview buttons change the weapon in the same real outlaw's hands.
      const current = [...equipped.keys()].find((key) => list.some((item) => item.id === key));
      if (current !== undefined) actor = list.find((item) => item.id === current);
      else { const ready = list.filter((item) => item.target) || []; const pool = ready.length ? ready : list; actor = pool[roundRobin++ % pool.length]; }
    }
    if (!actor) return null;
    if (!equipped.has(actor.id) && equipped.size >= 4) expire(equipped.keys().next().value, { silent: true });
    const durationMs = Math.max(5000, Math.min(8000, number(options.durationMs, 7000)));
    const gear = { id: actor.id, weapon, started: now, expiresAt: now + durationMs, preview: options.preview === true, previewAt: options.preview === true ? now + 300 : 0, lastFire: -Infinity, fireCount: 0, lastObserved: false, shots: [], lastSerial: actor.actionSerial, lastSwing: actor.swing || 0, lastState: actor.state, outlinedUntil: now + 400 };
    gear.rarity = Math.max(0, Math.min(5, Math.trunc(Number(options.rarity) || 0)));
    gear.rarityColor = options.rarityColor || COLOR[weapon]; gear.family = options.family || null;
    equipped.set(actor.id, gear); syncColorPass(); poofs.delete(actor.id); sound('equip'); ensureMaintenance();
    root.dispatchEvent(new CustomEvent('outlaws:gear-equipped',{detail:{id:actor.id,weapon,visualOnly:true}}));
    return { id: actor.id, weapon, expiresAt: gear.expiresAt };
  }
  function fire(id, options = {}) {
    if (!options || typeof options !== 'object') options = {};
    const key = idOf(id), gear = equipped.get(key), actor = actors.get(key), now = clock();
    if (!gear || !actor || now >= gear.expiresAt || !prefs().effects || !onScreen(actor.canvas) || now - gear.lastFire < COOLDOWN[gear.weapon]) return false;
    gear.lastFire = now; gear.fireCount++; gear.lastObserved = options.observed === true; gear.outlinedUntil = now + 140;
    const from = muzzle(actor, gear.weapon), supplied = copyPoint(options.target);
    const target = supplied || actor.target || { x: from.x + actor.face * 76, y: from.y };
    const shot = { serial: ++sequence, started: now, weapon: gear.weapon, from, target: { ...target }, face: actor.face, canvas: actor.canvas, impacted: false, rarity: gear.rarity, rarityColor: gear.rarityColor };
    providers.get(gear.weapon)?.onFire?.(shot, gear, actor, reduced());
    if (!reduced()) {
      gear.shots.push(shot);
      if (gear.shots.length > 6) gear.shots.shift();
      flashes.push({ started: now, color: gear.weapon === 'taser' ? '#99edf5' : '#ffe6ba', strength: gear.weapon === 'awp' ? .055 : gear.weapon === 'grenade' ? .06 : .025 });
      if (flashes.length > 4) flashes.shift();
      cameraPunch(actor.canvas, gear.weapon);
    }
    if (!root.OutlawsEpochSFX && !providers.has(gear.weapon)) sound(gear.weapon); ensureMaintenance();
    root.dispatchEvent(new CustomEvent('outlaws:visual-shot', { detail: { id: actor.id, weapon: gear.weapon, cue: shot.cue || gear.weapon, magic: shot.magic || null, arrowKind: shot.arrowKind || null, rarity: gear.rarity, target: { ...target }, from: { ...from }, observed: options.observed === true, reducedMotion: reduced(), visualOnly: true } })); return true;
  }
  function cameraPunch(canvas, weapon) {
    if (reduced() || !canvas?.animate) return;
    const strength = weapon === 'awp' ? 3 : weapon === 'grenade' ? 3 : weapon === 'ak' ? 1.5 : 1;
    let animation;
    try { animation = canvas.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${-strength}px,1px)` }, { transform: `translate(${strength}px,-1px)` }, { transform: 'translate(0,0)' }], { duration: 150, easing: 'steps(4,end)', composite: 'add' }); } catch { return; }
    cameraAnimations.add(animation); animation.finished.then(() => cameraAnimations.delete(animation), () => cameraAnimations.delete(animation));
  }
  function outline(ctx, actor, gear, now) {
    if (reduced() || now > gear.outlinedUntil) return;
    const color = COLOR[gear.weapon], x = actor.x - 2, y = actor.y - 2, width = actor.width + 4, height = actor.height + 4;
    for (const corner of [[x, y], [x + width - 5, y], [x, y + height - 2], [x + width - 5, y + height - 2]]) pixel(ctx, color, corner[0], corner[1], 5, 2);
    pixel(ctx, color, x, y, 2, 5); pixel(ctx, color, x + width - 2, y, 2, 5); pixel(ctx, color, x, y + height - 5, 2, 5); pixel(ctx, color, x + width - 2, y + height - 5, 2, 5);
  }
  function icon(ctx, actor, gear) {
    const x = Math.round(actor.x + actor.width / 2 - 6), y = Math.round(actor.y - 20);
    pixel(ctx, '#121b21', x - 2, y - 2, 17, 13); pixel(ctx, COLOR[gear.weapon], x - 2, y - 2, 17, 1);
    ctx.save(); ctx.translate(x + 3, y + 4); drawWeapon(ctx, gear.weapon, .27); ctx.restore();
  }
  function drawCache(ctx, actor, gear, now) {
    if (reduced()) return;
    const age = now - gear.started;
    if (age < 0 || age > 550) return;
    const x = actor.x + actor.width / 2 + actor.face * 22, floor = actor.y + actor.height - 2;
    if (age < 200) {
      const p = age / 200, y = floor - 16 - Math.pow(1 - p, 3) * 34;
      pixel(ctx, '#152023', x - 11, y, 22, 16); pixel(ctx, '#6c7854', x - 10, y + 1, 20, 14);
      pixel(ctx, '#adb084', x - 8, y + 2, 3, 12); pixel(ctx, '#adb084', x + 5, y + 2, 3, 12);
      pixel(ctx, '#424d39', x - 10, y + 11, 20, 3); pixel(ctx, COLOR[gear.weapon], x - 2, y + 5, 4, 5);
      pixel(ctx, '#c4cba0', x - 1, y + 6, 2, 3);
    } else {
      const p = (age - 200) / 350;
      ctx.save(); ctx.globalAlpha *= 1 - p;
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6, distance = 7 + p * (18 + i % 3 * 4);
        const pieceX = x + Math.cos(a) * distance, pieceY = floor - 8 + Math.sin(a) * distance - Math.sin(p * Math.PI) * 8 + p * 6;
        pixel(ctx, i % 3 === 0 ? COLOR[gear.weapon] : i % 2 ? '#8b9769' : '#34433c', pieceX, pieceY, i % 2 ? 4 : 3, i % 3 === 0 ? 2 : 4);
        if (i % 3 === 1) pixel(ctx, '#c0c3a0', pieceX, pieceY, 1, 2);
      }
      if (p < .22) { pixel(ctx, '#ead9a0', x - 8, floor - 13, 16, 7); pixel(ctx, '#fff1c3', x - 3, floor - 15, 6, 11); }
      ctx.restore();
    }
  }
  function drawJoke(ctx, actor, gear, now) {
    const age = now - gear.started;
    if (age < 0 || age >= 780) return;
    const message = joke(gear.weapon), transform = ctx.getTransform?.();
    const scale = Math.abs(transform?.a) || 1, roomWidth = actor.canvas.width / scale;
    ctx.save(); ctx.font = 'bold 8px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    const width = Math.min(230, Math.ceil(ctx.measureText(message).width) + 12);
    let x = actor.face > 0 ? actor.x + actor.width + 9 : actor.x - width - 9;
    x = Math.max(5, Math.min(roomWidth - width - 5, x));
    const y = Math.max(31, actor.y - 19);
    pixel(ctx, '#403525', x - 1, y - 1, width + 2, 18); pixel(ctx, '#e0d1ad', x, y, width, 16);
    const tailX = actor.face > 0 ? x : x + width - 4;
    pixel(ctx, '#e0d1ad', tailX, y + 15, 4, 3);
    ctx.fillStyle = '#352a1d'; ctx.fillText(message, x + 6, y + 4); ctx.restore();
  }
  function drawShot(ctx, shot, now) {
    if (!providers.has(shot.weapon)) root.OutlawsTemporalArsenal?.drawImpact?.(ctx, shot, now);
    if (providers.has(shot.weapon)) { providers.get(shot.weapon).drawShot?.(ctx, shot, now); return; }
    const age = (now - shot.started) / 1000, type = shot.weapon, color = COLOR[type];
    const x = shot.from.x, y = shot.from.y, face = shot.face;
    if (age < 0 || age > 1) return;
    if (type === 'ak' || type === 'awp') {
      if (age < .09) {
        pixel(ctx, type === 'awp' ? '#f3f0ce' : '#f1ba53', x - (face < 0 ? 12 : 0), y - 4, 12, 7);
        pixel(ctx, '#fff6bd', x + face * 3, y - 2, 9, 3);
      }
      if (age < .5) {
        const shellX = x - face * (23 + age * 17), shellY = y - Math.sin(age / .5 * Math.PI) * 16 + age * 10;
        pixel(ctx, '#ebc26f', shellX, shellY, 3, 2); pixel(ctx, '#7f632e', shellX + 1, shellY + 2, 2, 1);
      }
      if (type === 'awp' && age < .32) {
        const tx = shot.target.x, ty = shot.target.y;
        ctx.globalAlpha *= 1 - age / .32;
        pixel(ctx, '#cedeb6', tx - 7, ty, 14, 1); pixel(ctx, '#cedeb6', tx, ty - 7, 1, 14);
        pixel(ctx, '#eff1cb', tx - 5, ty - 5, 3, 1); pixel(ctx, '#eff1cb', tx + 3, ty + 5, 3, 1);
        ctx.globalAlpha = 1;
      }
    } else if (type === 'grenade') {
      const travel = .48, p = Math.min(1, age / travel);
      if (age < travel) {
        const gx = x + (shot.target.x - x) * p, gy = y + (shot.target.y - y) * p - Math.sin(p * Math.PI) * 35;
        ctx.save(); ctx.translate(Math.round(gx), Math.round(gy)); drawWeapon(ctx, 'grenade', .48); ctx.restore();
      } else if (age < .78) {
        if (!shot.impacted) {
          shot.impacted = true; flashes.push({ started: now, color: '#ffe6ba', strength: .075 }); if (flashes.length > 4) flashes.shift(); cameraPunch(shot.canvas, 'grenade');
        }
        const spread = (age - travel) / .3;
        for (let i = 0; i < 12; i++) {
          const a = i * Math.PI / 6, smokeSize = Math.max(4, Math.floor(11 - spread * 5));
          pixel(ctx, i % 2 ? '#272627' : '#413b35', shot.target.x + Math.cos(a) * spread * 30 - smokeSize / 2, shot.target.y + Math.sin(a) * spread * 23 - smokeSize / 2, smokeSize, smokeSize);
          pixel(ctx, i % 3 ? '#c49a6b' : '#e9b75e', shot.target.x + Math.cos(a) * spread * 42, shot.target.y + Math.sin(a) * spread * 35, 4, 3);
        }
        if (spread < .35) { pixel(ctx, '#edaa4b', shot.target.x - 12, shot.target.y - 9, 24, 18); pixel(ctx, '#ffe8ad', shot.target.x - 6, shot.target.y - 5, 12, 10); }
      }
    } else if (type === 'taser' && age < .28) {
      const length = Math.min(100, Math.hypot(shot.target.x - x, shot.target.y - y)), segments = 9;
      const angle = Math.atan2(shot.target.y - y, shot.target.x - x);
      ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(angle);
      for (let i = 0; i < segments; i++) pixel(ctx, i % 2 ? '#6ce3ed' : '#deffff', i * length / segments, i % 2 ? 3 : -2, Math.ceil(length / segments) + 1, 2);
      ctx.restore();
    }
  }
  function drawPoof(ctx, puff, now) {
    if (reduced()) return;
    const p = (now - puff.started) / 420;
    if (p < 0 || p > 1) return;
    ctx.save(); ctx.globalAlpha *= 1 - p;
    for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7; pixel(ctx, i % 2 ? '#b1a48e' : puff.color, puff.x + Math.cos(a) * (5 + p * 16), puff.y + Math.sin(a) * (5 + p * 12), 4, 4); }
    ctx.restore();
  }
  function renderActor(ctx, actor, now) {
    if (reduced() && (flashes.length || cameraAnimations.size || poofs.size)) stopMotion();
    const gear = equipped.get(actor.id), puff = poofs.get(actor.id);
    if (puff) drawPoof(ctx, puff, now);
    if (!gear || !prefs().effects || doc.hidden) return false;
    if (now >= gear.expiresAt) { expire(actor.id); return false; }
    // Only supplied attack observations produce repeated shots. Bobbing is never an attack.
    const serialChanged = actor.actionSerial !== null && actor.actionSerial !== gear.lastSerial;
    const swingRaised = actor.actionSerial === null && actor.swing > gear.lastSwing + .015;
    const hitEntered = actor.actionSerial === null && actor.swing === 0 && actor.state === 'hit' && gear.lastState !== 'hit';
    if (serialChanged || swingRaised || hitEntered) fire(actor.id);
    gear.lastSerial = actor.actionSerial; gear.lastSwing = actor.swing; gear.lastState = actor.state;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    drawCache(ctx, actor, gear, now); outline(ctx, actor, gear, now); icon(ctx, actor, gear);
    const recoilAge = now - gear.lastFire, recoil = !reduced() && recoilAge < 110 ? 3 * (1 - recoilAge / 110) : 0;
    if (reduced() || now - gear.started >= 200) {
      if (gear.weapon === 'awp') drawSightline(ctx, actor, recoil);
      ctx.save(); ctx.translate(Math.round(actor.x + actor.width / 2 - actor.face * recoil), Math.round(actor.y + actor.height * .57)); ctx.scale(actor.face, 1);
      drawWeapon(ctx, gear.weapon, gear.weapon === 'grenade' ? 1 : gear.weapon === 'taser' ? 1.05 : 1.1); ctx.restore();
    }
    gear.shots = gear.shots.filter((shot) => now - shot.started < 1000);
    if (!reduced()) for (const shot of gear.shots) { ctx.save(); drawShot(ctx, shot, now); ctx.restore(); }
    drawJoke(ctx, actor, gear, now);
    providers.get(gear.weapon)?.drawHeld?.(ctx, actor, gear, now, reduced());
    root.OutlawsTemporalArsenal?.drawRarity?.(ctx, actor, gear, now, reduced());
    ctx.restore(); return true;
  }
  function snapshot(input, now) {
    if (!input || typeof input !== 'object') return null;
    const id = idOf(input.id), x = number(input.x, NaN), y = number(input.y, NaN);
    if (id === null || !Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { id, x, y, face: input.face < 0 || input.facing < 0 ? -1 : 1, width: Math.max(8, Math.min(96, number(input.width, 34))), height: Math.max(8, Math.min(96, number(input.height, 34))), state: typeof input.state === 'string' ? input.state : typeof input.action === 'string' ? input.action : 'idle', working: input.working !== false, swing: Math.max(0, number(input.swing, 0)), actionSerial: Number.isSafeInteger(input.actionSerial) ? input.actionSerial : null, target: copyPoint(input.target), canvas: input.canvas || null, identity: typeof input.identity === 'string' ? input.identity : typeof id === 'number' ? 'token' : 'pixels', lastSeen: now };
  }
  function beginFrame(ctx, info = {}) {
    if (!ctx?.save || !ctx?.fillRect) return false;
    const now = number(info.now, clock()); prune(now);
    frames.set(ctx, { now, canvas: info.canvas || ctx.canvas, width: info.width, height: info.height, queue: new Map() }); return true;
  }
  function drawActor(ctx, input, time) {
    if (!ctx?.save || !ctx?.fillRect) return false;
    const now = number(time, clock()), frame = frames.get(ctx), actor = snapshot(input, now);
    if (!actor) return false;
    actor.canvas = actor.canvas || frame?.canvas || ctx.canvas;
    actors.set(actor.id, actor);
    while (actors.size > 64) actors.delete(actors.keys().next().value);
    if (!onScreen(actor.canvas) || !prefs().effects) { if (equipped.size || poofs.size) clear(); return false; }
    if (frame) { frame.queue.set(actor.id, actor); return equipped.has(actor.id); }
    prune(now); return renderActor(ctx, actor, now);
  }
  function endFrame(ctx, time) {
    const frame = frames.get(ctx); if (!frame) return false;
    frames.delete(ctx); const now = number(time, frame.now);
    let drawn = false;
    root.OutlawsEnemyStage?.endFrame?.(ctx, now);
    for (const actor of frame.queue.values()) drawn = renderActor(ctx, actor, now) || drawn;
    if (!reduced() && prefs().effects && flashes.length) {
      const transform = ctx.getTransform?.(), scale = Math.abs(transform?.a) || 1;
      ctx.save();
      for (const flash of flashes) {
        const p = (now - flash.started) / 150;
        if (p < 0 || p > 1) continue;
        ctx.globalAlpha = flash.strength * (1 - p);
        pixel(ctx, flash.color, 0, 0, number(frame.width, frame.canvas.width / scale), number(frame.height, frame.canvas.height / scale));
      }
      ctx.restore();
    }
    return root.OutlawsFightScene?.render?.(ctx, now) || drawn;
  }
  function draw(ctx, input, time) {
    if (!input || typeof input !== 'object') return false;
    const size = number(input.size, 34);
    return drawActor(ctx, { ...input, x: number(input.cx, NaN) - size / 2, y: number(input.cy, NaN) - size / 2, width: size, height: size, face: input.facing }, time);
  }
  function setEnabled(on) { enabled = Boolean(on); if (!enabled) clear(); return enabled; }
  function getState() {
    prune();
    if (reduced()) stopMotion();
    return { enabled, actorCount: actors.size, active: equipped.size > 0, equippedCount: equipped.size, poofCount: poofs.size, flashCount: flashes.length, cameraAnimations: cameraAnimations.size, reducedMotion: reduced(), timerActive: Boolean(maintenance), equipped: [...equipped.values()].map((gear) => { const actor = actors.get(gear.id), age = clock() - gear.started; return { id: gear.id, weapon: gear.weapon, preview: gear.preview, expiresAt: gear.expiresAt, expiresInMs: Math.max(0, gear.expiresAt - clock()), x: actor?.x, y: actor?.y, face: actor?.face, identity: actor?.identity, shots: gear.shots.length, fireCount: gear.fireCount, lastFire: Number.isFinite(gear.lastFire) ? gear.lastFire : null, lastObserved: gear.lastObserved, lootboxActive: !reduced() && age < 550, speechActive: age < 780, speech: age < 780 ? joke(gear.weapon) : null }; }), actors: [...actors.values()].map((actor) => { const gear = equipped.get(actor.id); return { id: actor.id, x: actor.x, y: actor.y, face: actor.face, width: actor.width, height: actor.height, identity: actor.identity, working: actor.working, state: actor.state, actionSerial: actor.actionSerial, target: actor.target ? { ...actor.target } : null, lastSeen: actor.lastSeen, armed: Boolean(gear), weapon: gear?.weapon || null, fireCount: gear?.fireCount || 0, lastFire: Number.isFinite(gear?.lastFire) ? gear.lastFire : null, expiresAt: gear?.expiresAt || null }; }), poofs: [...poofs.values()].map((puff) => ({ ...puff })) };
  }
  function attachCrusadeState() {
    const crusade = root.OutlawsCrusade;
    if (!crusade?.getState || crusade.__equippedState) return;
    const original = crusade.getState;
    crusade.getState = function () {
      const base = original.call(crusade), state = getState(), active = state.equipped[0];
      return active ? { ...base, active: true, weapon: active.weapon, preview: active.preview, remainingMs: active.expiresInMs, realActorId: active.id, equipped: true } : { ...base, equipped: false };
    };
    crusade.__equippedState = true;
  }
  doc.addEventListener('visibilitychange', clear);
  doc.addEventListener('change', (event) => { if (event.target.dataset?.owjSetting === 'effects' && !event.target.checked) clear(); if (event.target.dataset?.owjSetting === 'motion') stopMotion(); if (event.target.matches?.('[data-owc-toggle]') && !event.target.checked) clear(); });
  media?.addEventListener?.('change', stopMotion);
  root.addEventListener('outlaws:equipped-weapon', (event) => { if (event.detail?.weapon) equip(event.detail.weapon, event.detail); });
  function transformAll(resolve) {
    let count = 0; for (const gear of equipped.values()) {
      const update = resolve({ id: gear.id, weapon: gear.weapon, family: gear.family, rarity: gear.rarity, expiresAt: gear.expiresAt });
      if (!update || !WEAPONS.includes(update.weapon) || update.weapon === gear.weapon) continue;
      gear.weapon = update.weapon; gear.family = update.family || gear.family; gear.shots = []; gear.started = clock(); gear.outlinedUntil = clock() + 400; count++;
    } syncColorPass(); return count;
  }
  const getLoadouts = () => [...equipped.values()].map(({id,weapon,rarity,rarityColor,family,expiresAt})=>({id,weapon,rarity,rarityColor,family,expiresAt}));
  root.OutlawsEquippedWeapons = { beginFrame, drawActor, endFrame, draw, equip, fire, expire, clear, setEnabled, getState, getLoadouts, registerWeapon, setEquipPolicy: fn => { equipPolicy = typeof fn === 'function' ? fn : null; }, transformAll, art: { drawWeapon } };
  attachCrusadeState(); root.addEventListener('outlaws:crusade-ready', attachCrusadeState);
})(window);

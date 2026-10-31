/* Original pixel gear providers. Draw-only input, separate cosmetic randomness.
 * Spells, healing, freezing and transformed guards are visual previews only.
 * No simulation, target health, actor identity, odds or rewards are changed.
 */
(function (root) {
  'use strict';
  if (root.OutlawsEpochWeapons) return;
  const equipped = root.OutlawsEquippedWeapons;
  if (!equipped?.registerWeapon) return;
  const colors = { staff: '#d7a8fa', sword: '#e2e3c1', flamesword: '#ffaf3d', bow: '#d6b96d', laser: '#9beafb', beam: '#e8a6ff', energyblade: '#70fff1', kamikaze: '#edb568', combatdrone: '#85e1ff' };
  const spells = ['fire', 'lightning', 'ice', 'heal', 'frog'];
  const arrows = ['normal', 'explosive', 'fire', 'triple', 'lightning'];
  const magicColor = { fire: '#ffac3d', lightning: '#a5dfff', ice: '#a8f4ff', heal: '#95e78a', frog: '#b4da63' };
  const registered = [];
  const pixel = (ctx, color, x, y, width = 1, height = 1) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(width)), Math.max(1, Math.round(height))); };
  const pick = (length) => { const bytes = new Uint32Array(1); root.crypto.getRandomValues(bytes); return bytes[0] % length; };
  const hash = (n) => { n = Math.imul(n ^ n >>> 16, 0x45d9f3b); n = Math.imul(n ^ n >>> 16, 0x45d9f3b); return (n ^ n >>> 16) >>> 0; };
  const fraction = (seed, index) => hash((seed + Math.imul(index + 1, 2654435761)) >>> 0) / 4294967296;
  function segment(ctx, color, from, target, thickness = 1, dash = 1) {
    const dx = target.x - from.x, dy = target.y - from.y, length = Math.min(500, Math.max(1, Math.hypot(dx, dy)));
    for (let i = 0; i <= length; i += dash) pixel(ctx, color, from.x + dx * i / length, from.y + dy * i / length, thickness, thickness);
  }
  function ring(ctx, color, x, y, radius, thickness = 2) {
    for (let i = 0; i < 24; i++) { const angle = i / 24 * Math.PI * 2; pixel(ctx, color, x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, thickness, thickness); }
  }
  function targetPoint(shot, minimum = 62) {
    let dx = shot.target.x - shot.from.x, dy = shot.target.y - shot.from.y;
    let length = Math.hypot(dx, dy);
    if (length < 1 || dx * shot.face <= 0) { dx = shot.face; dy = 0; length = 1; }
    const reach = Math.min(160, Math.max(minimum, length));
    return { x: shot.from.x + dx / length * reach, y: shot.from.y + dy / length * reach };
  }
  function burst(ctx, shot, now, at, color, start = 180, duration = 430, count = 16, fiery = false) {
    const age = now - shot.started - start, p = age / duration;
    if (p < 0 || p >= 1) return;
    ctx.save(); ctx.globalAlpha *= 1 - p;
    if (fiery) {
      const radius = 6 + Math.sin(p * Math.PI) * 15;
      pixel(ctx, '#272a30', at.x - radius, at.y - radius - p * 12, radius * 2, radius * 1.6);
      pixel(ctx, '#ee642a', at.x - radius * .72, at.y - radius * .76, radius * 1.44, radius * 1.1);
      pixel(ctx, '#ffbd43', at.x - radius * .5, at.y - radius * .55, radius, radius * .85);
      pixel(ctx, '#fff1a0', at.x - radius * .2, at.y - radius * .3, radius * .4, radius * .5);
    }
    for (let i = 0; i < count; i++) {
      const angle = fraction(shot.serial || 1, i) * Math.PI * 2, reach = 10 + fraction(shot.serial || 1, i + 30) * 27;
      const x = at.x + Math.cos(angle) * reach * p, y = at.y + Math.sin(angle) * reach * p + 12 * p * p;
      pixel(ctx, fiery && i % 3 === 0 ? '#292a31' : i % 3 === 1 ? '#fff0af' : color, x, y, i % 4 === 0 ? 4 : 2, 2 + (i % 3));
    }
    ctx.restore();
  }
  function drawSword(ctx, fire = false) {
    pixel(ctx, '#272a30', -13, -4, 51, 8); pixel(ctx, '#cad6c4', 1, -3, 33, 6);
    pixel(ctx, '#f7f4d3', 5, -3, 31, 2); pixel(ctx, '#738c98', 7, 2, 24, 2);
    pixel(ctx, '#c69b47', -2, -11, 4, 21); pixel(ctx, '#f1ce64', -3, -10, 3, 6);
    pixel(ctx, '#8c5747', -12, -2, 10, 4); pixel(ctx, '#f0b875', -14, -3, 3, 6);
    pixel(ctx, fire ? '#ffb94c' : '#e6eee3', 36, -2, 4, 3);
    if (fire) for (let i = 0; i < 6; i++) { pixel(ctx, '#ef692f', 5 + i * 5, -7 - i % 3 * 2, 5, 9); pixel(ctx, '#ffe76c', 6 + i * 5, -6 - i % 2 * 3, 2, 6); }
  }
  function drawStaff(ctx) {
    pixel(ctx, '#3c263d', 3, -27, 7, 47); pixel(ctx, '#96704d', 4, -24, 4, 43);
    pixel(ctx, '#d2ad66', 5, -20, 2, 20); pixel(ctx, '#5a315f', -1, -34, 15, 14);
    pixel(ctx, '#dab56e', 0, -34, 3, 13); pixel(ctx, '#dab56e', 11, -34, 3, 13);
    pixel(ctx, '#bd88eb', 3, -34, 8, 11); pixel(ctx, '#f6d7ff', 4, -33, 3, 5);
    pixel(ctx, '#804db5', 7, -26, 4, 4); pixel(ctx, '#f6d7ff', 6, -38, 2, 3);
  }
  function drawBow(ctx) {
    pixel(ctx, '#6a452c', 7, -24, 4, 8); pixel(ctx, '#b99553', 10, -18, 4, 7);
    pixel(ctx, '#d7ae65', 14, -12, 4, 25); pixel(ctx, '#b99553', 10, 13, 4, 7);
    pixel(ctx, '#6a452c', 7, 20, 4, 7); pixel(ctx, '#f4dfa5', 7, -22, 1, 47);
    pixel(ctx, '#765a37', -8, -1, 41, 2); pixel(ctx, '#dfe5d5', 31, -3, 5, 6);
    pixel(ctx, '#8d98a4', 36, -1, 3, 2); pixel(ctx, '#c69460', -10, -4, 5, 3); pixel(ctx, '#c69460', -10, 2, 5, 3);
  }
  function drawLaser(ctx, cannon = false) {
    pixel(ctx, '#182d43', -8, -8, cannon ? 51 : 30, 14); pixel(ctx, '#405c78', -7, -7, cannon ? 43 : 25, 10);
    pixel(ctx, '#8aa6b9', -5, -6, cannon ? 35 : 17, 3); pixel(ctx, '#1e324d', -4, 5, 8, 13);
    pixel(ctx, '#74d8ea', 5, -7, cannon ? 26 : 11, 3); pixel(ctx, '#182d43', cannon ? 32 : 18, -5, 13, 8);
    pixel(ctx, cannon ? '#e3a1ff' : '#8af8ff', cannon ? 36 : 21, -4, 9, 5);
    if (cannon) { pixel(ctx, '#9364b9', 1, -13, 15, 5); pixel(ctx, '#f2c6ff', 3, -12, 9, 2); }
  }
  function drawEnergyBlade(ctx) {
    pixel(ctx, '#1b3151', -12, -5, 14, 10); pixel(ctx, '#927dce', -10, -4, 9, 7);
    pixel(ctx, '#eff9ff', 0, -3, 41, 6); pixel(ctx, '#6ff8eb', 2, -6, 34, 3);
    pixel(ctx, '#5ebdcf', 2, 3, 34, 3); pixel(ctx, '#a7fafa', 40, -1, 5, 3);
    pixel(ctx, '#efadff', -1, -9, 4, 4); pixel(ctx, '#efadff', -1, 5, 4, 4);
  }
  function drawRemote(ctx, future = false) {
    pixel(ctx, '#192c3c', -7, -9, 17, 20); pixel(ctx, future ? '#648aaa' : '#82725a', -6, -8, 15, 17);
    pixel(ctx, future ? '#7ed9f3' : '#dcb964', -4, -6, 11, 8); pixel(ctx, '#263441', -3, 4, 3, 3); pixel(ctx, '#b1b8aa', 4, 4, 3, 3);
    pixel(ctx, '#d8e2c4', 3, -14, 2, 5);
  }
  function drone(ctx, x, y, future, spin = 0, face = 1) {
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(face, 1);
    pixel(ctx, '#172837', -14, -5, 28, 11); pixel(ctx, future ? '#587693' : '#8a785c', -12, -4, 24, 8);
    pixel(ctx, future ? '#abdded' : '#c3ac78', -8, -4, 14, 3); pixel(ctx, future ? '#93f5ff' : '#f0bd67', 6, -1, 8, 3);
    pixel(ctx, '#253443', -21, -3, 9, 3); pixel(ctx, '#253443', 13, -3, 9, 3);
    for (const side of [-1, 1]) { const sx = side * 19; pixel(ctx, '#455667', sx - 6, -6, 13, 3); pixel(ctx, '#151d2b', sx - 5, -10, 11, 2); pixel(ctx, '#b1b6a7', sx - (spin % 2 ? 3 : 8), -11, spin % 2 ? 7 : 17, 1); }
    pixel(ctx, '#223348', -8, 7, 3, 5); pixel(ctx, '#223348', 7, 7, 3, 5); ctx.restore();
  }
  function heldDrone(ctx, actor, gear, now, reduced) {
    const future = gear.weapon === 'combatdrone', age = now - gear.started;
    const last = gear.lastFire, launch = Number.isFinite(last) ? now - last : Infinity;
    if (gear.weapon === 'kamikaze' && launch >= 0 && launch < 700 && !reduced) return;
    const phase = reduced ? 0 : age / 470, orbit = future && !reduced ? Math.sin(phase) * 11 : 0;
    const x = actor.x + actor.width / 2 + actor.face * (27 + orbit), y = actor.y - 8 + (reduced ? 0 : Math.cos(phase) * 4);
    ctx.save(); ctx.globalAlpha *= .2; pixel(ctx, '#0b1723', x - 15, actor.y + actor.height - 3, 31, 4); ctx.restore();
    drone(ctx, x, y, future, reduced ? 0 : Math.floor(age / 75), actor.face);
  }
  function projectile(ctx, shot, now, kind) {
    const age = now - shot.started, p = Math.max(0, Math.min(1, age / 250)), at = shot.end;
    if (age < 250) {
      const x = shot.from.x + (at.x - shot.from.x) * p, y = shot.from.y + (at.y - shot.from.y) * p;
      const count = kind === 'triple' ? 3 : 1;
      for (let i = 0; i < count; i++) {
        const spread = (i - (count - 1) / 2) * 11 * p;
        segment(ctx, kind === 'fire' ? '#ffbd5d' : '#bfac72', { x: x - shot.face * 17, y: y + spread }, { x, y: y + spread }, 2);
        pixel(ctx, '#e7eddd', x, y - 2 + spread, 5, 5);
        if (kind === 'fire') pixel(ctx, '#eb6530', x - shot.face * 8, y - 4 + spread, 6, 8);
      }
    }
    burst(ctx, shot, now, at, kind === 'lightning' ? '#a0e6ff' : '#eac974', 250, kind === 'explosive' ? 500 : 290, kind === 'explosive' ? 22 : 10, kind === 'explosive' || kind === 'fire');
    if (kind === 'lightning' && age > 200 && age < 360) lightning(ctx, shot.from, at, age, '#bdf4ff');
  }
  function lightning(ctx, from, end, age, color) {
    let previous = from;
    for (let i = 1; i <= 7; i++) {
      const next = { x: from.x + (end.x - from.x) * i / 7, y: from.y + (end.y - from.y) * i / 7 + (i === 7 ? 0 : ((i + Math.floor(age / 45)) % 2 ? 7 : -7)) };
      segment(ctx, '#5060a3', { x: previous.x, y: previous.y + 1 }, { x: next.x, y: next.y + 1 }, 3);
      segment(ctx, color, previous, next, 2); previous = next;
    }
  }
  function slash(ctx, shot, now, color, fiery = false) {
    const p = (now - shot.started) / 290; if (p < 0 || p >= 1) return;
    ctx.save(); ctx.globalAlpha *= 1 - p;
    const radius = 24 + p * 12;
    for (let i = 0; i < 13; i++) { const a = -.95 + i / 12 * 1.9; pixel(ctx, color, shot.from.x + shot.face * Math.cos(a) * radius, shot.from.y + Math.sin(a) * radius, 4, 4); if (fiery) pixel(ctx, '#fff2b1', shot.from.x + shot.face * Math.cos(a) * (radius - 4), shot.from.y + Math.sin(a) * (radius - 4), 2, 2); }
    ctx.restore();
  }
  function spellHeld(ctx, actor, gear, now, reduced) {
    if (reduced || !gear.epochSpells) return;
    gear.epochSpells = gear.epochSpells.filter((spell) => now < spell.until);
    for (const spell of gear.epochSpells) {
      if (now < spell.started) continue;
      const x = spell.at.x, y = spell.at.y, age = now - spell.started;
      ctx.save(); ctx.globalAlpha *= Math.min(1, (spell.until - now) / 220);
      if (spell.magic === 'frog') {
        // An outlined magic proxy, never a replacement for the game's guard sprite.
        ring(ctx, '#b4da63', x, y + 3, 19, 1);
        pixel(ctx, '#45654c', x - 9, y - 5, 19, 12); pixel(ctx, '#94cb6a', x - 7, y - 8, 15, 11);
        pixel(ctx, '#cee889', x - 7, y - 11, 5, 5); pixel(ctx, '#cee889', x + 3, y - 11, 5, 5);
        pixel(ctx, '#1e3135', x - 5, y - 10, 2, 2); pixel(ctx, '#1e3135', x + 5, y - 10, 2, 2);
        pixel(ctx, '#6aa859', x - 12, y + 4, 8, 4); pixel(ctx, '#6aa859', x + 5, y + 4, 8, 4);
        pixel(ctx, '#e3d68f', x - 3, y - 16, 6, 3);
      } else if (spell.magic === 'ice') {
        for (let i = 0; i < 5; i++) { const dx = (i - 2) * 7; pixel(ctx, '#6dc3dd', x + dx, y - 18 + i % 2 * 5, 4, 27 - i % 2 * 5); pixel(ctx, '#d1ffff', x + dx, y - 17 + i % 2 * 5, 1, 20); }
        ring(ctx, '#b1edff', x, y + 7, 21, 1);
      } else if (spell.magic === 'heal') {
        const cy = y - 8 - Math.min(12, age / 40); pixel(ctx, '#294a45', x - 6, cy - 2, 13, 6); pixel(ctx, '#294a45', x - 2, cy - 6, 6, 14);
        pixel(ctx, '#b6f9a1', x - 5, cy - 1, 11, 4); pixel(ctx, '#b6f9a1', x - 1, cy - 5, 4, 12); ring(ctx, '#95df83', x, y, 14 + age / 55, 1);
      }
      ctx.restore();
    }
  }
  function staffShot(ctx, shot, now) {
    const age = now - shot.started, at = shot.end, c = magicColor[shot.magic];
    if (age < 270) {
      if (shot.magic === 'lightning') lightning(ctx, shot.from, at, age, '#e1faff');
      else { const p = Math.max(0, age / 250), x = shot.from.x + (at.x - shot.from.x) * p, y = shot.from.y + (at.y - shot.from.y) * p; pixel(ctx, c, x - 4, y - 4, 9, 9); pixel(ctx, '#fff1e1', x - 1, y - 2, 3, 4); ring(ctx, c, x, y, 9, 1); }
    }
    burst(ctx, shot, now, at, c, 180, 430, 18, shot.magic === 'fire');
  }
  function energyShot(ctx, shot, now, beam) {
    const age = now - shot.started, duration = beam ? 390 : 210;
    if (age >= 0 && age < duration) {
      const color = beam ? '#bd91ec' : '#59cbea';
      ctx.save(); ctx.globalAlpha *= 1 - age / duration;
      segment(ctx, color, shot.from, shot.end, beam ? 8 : 4); segment(ctx, '#ebffff', shot.from, shot.end, beam ? 3 : 1);
      ring(ctx, color, shot.from.x, shot.from.y, beam ? 9 : 5, 2); ctx.restore();
    }
    burst(ctx, shot, now, shot.end, beam ? '#e3b7ff' : '#aaf5ff', 100, 390, beam ? 23 : 12, false);
  }
  function droneShot(ctx, shot, now, future) {
    const age = now - shot.started;
    if (future) { energyShot(ctx, shot, now, false); return; }
    if (age < 390) {
      const p = Math.max(0, age / 390), x = shot.from.x + (shot.end.x - shot.from.x) * p, y = shot.from.y - 14 + (shot.end.y - shot.from.y + 14) * p - Math.sin(p * Math.PI) * 17;
      ctx.save(); ctx.globalAlpha *= .2; pixel(ctx, '#0c1927', x - 11, y + 19, 23, 4); ctx.restore();
      drone(ctx, x, y, false, Math.floor(age / 50), shot.face);
    }
    burst(ctx, shot, now, shot.end, '#ffbf4f', 350, 510, 24, true);
  }
  const lines = {
    staff: ['What sorcery is this?', 'Que feitiçaria é essa?', '¿Qué brujería es esta?', 'Anong salamangka ito?'],
    sword: ['For the loot!', 'Pelo saque!', '¡Por el botín!', 'Para sa loot!'],
    flamesword: ['Thy sword is on fire!', 'Tua espada pegou fogo!', '¡Tu espada arde!', 'Nag-aapoy ang espada!'],
    bow: ['A very suspicious arrow.', 'Uma flecha suspeita.', 'Una flecha sospechosa.', 'Kahina-hinalang palaso.'],
    laser: ['The King did not approve this.', 'O rei não aprovou isso.', 'El rey no aprobó esto.', 'Hindi ito inaprubahan ng hari.'],
    beam: ['Behold my portable sun!', 'Eis meu sol portátil!', '¡Mi sol portátil!', 'Ang aking bitbit na araw!'],
    energyblade: ['Heresy, but stylish.', 'Heresia com estilo.', 'Herejía con estilo.', 'Kalapastanganan na may estilo.'],
    kamikaze: ['Fly, little trouble!', 'Voa, pequena encrenca!', '¡Vuela, pequeño problema!', 'Lumipad, munting gulo!'],
    combatdrone: ['My squire has propellers.', 'Meu escudeiro tem hélices.', 'Mi escudero tiene hélices.', 'May propeller ang aking alalay.']
  };
  function register(name, draw, cooldown, reach, onFire, drawShot, drawHeld) {
    const joke = lines[name];
    const provider = { color: colors[name], cooldown, reach, jokes: { en: joke[0], pt: joke[1], es: joke[2], fil: joke[3] }, draw, onFire(shot, gear, actor, reduced) { shot.end = targetPoint(shot, name === 'beam' ? 110 : 62); shot.cue = name === 'flamesword' ? 'flameblade' : name; onFire?.(shot, gear, actor, reduced); }, drawShot, drawHeld };
    if (equipped.registerWeapon(name, provider)) registered.push(name);
  }
  register('sword', (ctx) => drawSword(ctx), 500, 30, null, (ctx, shot, now) => { slash(ctx, shot, now, '#edf0cf'); burst(ctx, shot, now, { x: shot.from.x + shot.face * 23, y: shot.from.y }, '#f1d691', 70, 280, 9); });
  register('flamesword', (ctx) => drawSword(ctx, true), 600, 30, null, (ctx, shot, now) => { slash(ctx, shot, now, '#ffb358', true); burst(ctx, shot, now, { x: shot.from.x + shot.face * 26, y: shot.from.y }, '#ffb358', 100, 400, 16, true); });
  register('staff', drawStaff, 760, 10, (shot, gear, actor, reduced) => {
    shot.magic = spells[pick(spells.length)]; shot.cue = shot.magic;
    if (!reduced && ['frog', 'heal', 'ice'].includes(shot.magic)) {
      const at = shot.magic === 'heal' ? { x: actor.x + actor.width / 2, y: actor.y - 3 } : { ...shot.target };
      const proxy = { magic: shot.magic, at, started: shot.started + 200, until: shot.started + (shot.magic === 'frog' ? 2200 : 800) };
      gear.epochSpells = [...(gear.epochSpells || []).filter((x) => x.until > shot.started), proxy].slice(-2);
    }
  }, staffShot, spellHeld);
  register('bow', drawBow, 640, 39, (shot) => { shot.arrowKind = shot.rarity > 0 ? arrows[pick(arrows.length)] : 'normal'; shot.cue = ({ normal: 'bow', explosive: 'explosivearrow', fire: 'firearrow', triple: 'triplearrow', lightning: 'lightning' })[shot.arrowKind]; }, (ctx, shot, now) => projectile(ctx, shot, now, shot.arrowKind));
  register('laser', (ctx) => drawLaser(ctx), 350, 29, null, (ctx, shot, now) => energyShot(ctx, shot, now, false));
  register('beam', (ctx) => drawLaser(ctx, true), 700, 48, null, (ctx, shot, now) => energyShot(ctx, shot, now, true));
  register('energyblade', drawEnergyBlade, 490, 42, null, (ctx, shot, now) => { slash(ctx, shot, now, '#7effed'); burst(ctx, shot, now, { x: shot.from.x + shot.face * 22, y: shot.from.y }, '#b5fdf5', 65, 340, 14); });
  register('kamikaze', (ctx) => drawRemote(ctx), 950, 22, null, (ctx, shot, now) => droneShot(ctx, shot, now, false), heldDrone);
  register('combatdrone', (ctx) => drawRemote(ctx, true), 470, 29, (shot, gear, actor) => { shot.from = { x: actor.x + actor.width / 2 + actor.face * 36, y: actor.y - 9 }; shot.end = targetPoint(shot, 85); }, (ctx, shot, now) => droneShot(ctx, shot, now, true), heldDrone);
  root.OutlawsEpochWeapons = Object.freeze({ ready: true, list: () => [...registered], getState: () => ({ ready: true, registered: [...registered], spells: [...spells], arrows: [...arrows], visualOnly: true }) });
  root.dispatchEvent(new CustomEvent('outlaws:epoch-weapons-ready', { detail: { weapons: [...registered] } }));
})(window);

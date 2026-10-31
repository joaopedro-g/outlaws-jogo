/* Final V4 presentation bridge, with a clean unavailable-asset fallback. */
(function (root) {
  'use strict';
  if (root.OutlawsFightArt) return;

  const doc = root.document;
  const reduced = root.matchMedia ? root.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const eras = ['medieval', 'modern', 'future'];
  const states = ['idle', 'walk', 'attack', 'hit', 'fall'];
  const ranks = [
    ['#657481', '#a3b3ba', '#d8e0dc'],
    ['#316e51', '#6fb877', '#b2db96'],
    ['#36648f', '#70a9d0', '#c0dfed'],
    ['#6c4886', '#af83c6', '#e1bae8'],
    ['#8d6533', '#ddb45b', '#ffdf94'],
    ['#813e60', '#cd7798', '#ffc1cd']
  ];
  const skins = ['#dfb28b', '#bd885f', '#f0c9a5', '#9b6849', '#d69a73', '#b77854'];
  const ink = '#171e25';
  const watched = new WeakSet();
  let backend = null;
  let legacyReady = false;
  let revision = 0;
  let backendErrors = 0;

  function integer(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.round(n) : fallback;
  }
  function eraOf(value) { return eras.includes(value) ? value : 'medieval'; }
  function scaleOf(value) { return Math.max(1, Math.min(12, Math.floor(Number(value) || 1))); }
  function faceOf(value) { return value === 'left' || Number(value) < 0 ? -1 : 1; }
  function rankOf(value) { return Math.min(5, Math.max(0, integer(value, 0))); }
  function preferences(options) {
    let p = {};
    try { p = root.OutlawsJuice?.getState?.() || {}; } catch (_) { /* Static fallback remains available. */ }
    return {
      motion: options?.motion !== false && p.motion !== false && !p.reducedMotion && !reduced?.matches,
      effects: options?.effects !== false && p.effects !== false
    };
  }
  function rect(ctx, color, x, y, w, h) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  function identity(id) {
    // A stable face feature from the existing ID, never a random roll or a new ID.
    let value = 0;
    for (const char of String(id ?? '')) value += char.codePointAt(0);
    return value % 6;
  }
  function publish(reason) {
    revision += 1;
    if (typeof root.CustomEvent === 'function') {
      root.dispatchEvent(new root.CustomEvent('outlaws:fight-art-ready', {
        detail: { reason, revision, visualOnly: true, provisional: !backend?.ready,
          backend: backend?.ready ? backend.contract : 'clean-fallback' }
      }));
    }
  }
  function observeLegacy() {
    const art = root.OutlawsEraArt;
    const promise = art?.whenReady;
    try { legacyReady = Boolean(art?.getState?.().ready); } catch (_) { legacyReady = false; }
    if (!promise || typeof promise.then !== 'function' || watched.has(promise)) return;
    watched.add(promise);
    Promise.resolve(promise).then(() => {
      try { legacyReady = Boolean(art.getState?.().ready); } catch (_) { legacyReady = false; }
      publish('era-art-ready');
    }, () => { legacyReady = false; publish('era-art-unavailable'); });
  }
  // API signatures and anchors read from assets/propostas/arte-v4/api.js + manifest.js.
  // The artist owns these assets. Consumers never overwrite them or wait before staging.
  function registerV4() {
    const api=root.OutlawsSpriteV4;if(!api?.getState?.().ready)return;
    const quality=source=>source&&root.OutlawsEraArt?.processArcadeFrame?.(source)||source;
    registerArt({
      drawOutlaw(ctx,o){
        const source=quality(api.getCrewFrame({...o,style:root.OutlawsArcade?.getStyle?.()||'arcade',direction:o.face<0?'left':'right',frame:Math.min(7,o.state==='attack'?Math.round((o.frame||0)*7/5):o.frame||0)}));if(!source)return false;
        ctx.drawImage(source,Math.round(o.x+4),Math.round(o.y+7),24*o.scale,24*o.scale);return true;
      },
      drawWeapon(ctx,o){
        const attack=o.state==='attack',manifest=api.getManifest();
        const variant={froststaff:'ice',shockstaff:'lightning',flamearrow:'fire',frostarrow:'normal',shockarrow:'lightning'}[o.rawWeapon];
        const source=quality(attack?api.getAttackFrame({...o,variant,frame:Math.min(7,Math.round((o.frame||0)*7/5))}):api.getHeldFrame(o));if(!source)return false;
        const anchor=attack?manifest.attacks.hand:manifest.held.anchor;
        ctx.save();ctx.translate(Math.round(o.x),Math.round(o.y));if(o.face<0)ctx.scale(-1,1);
        ctx.drawImage(source,-anchor[0]*o.scale,-anchor[1]*o.scale,source.width*o.scale,source.height*o.scale);ctx.restore();return true;
      },
      drawScene(ctx,o){
        if(typeof api.getWorldTile!=='function')return false;
        // Complete presentation room on the same32px grid, without decorative NPCs.
        const cols=Math.ceil(o.width/32),rows=Math.ceil(o.height/32);
        for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
          const edge=x===0||y===0||x===cols-1||y===rows-1;
          const name=edge?(x===0&&y===Math.floor(rows/2)?'arrival':y===0&&x>0&&x<cols-1&&x%3===1?'window':'wall_edge'):'floor_'+['a','b','c'][(x+y)%3];
          const tile=quality(api.getWorldTile(name,{era:o.era}));if(tile)ctx.drawImage(tile,x*32,y*32,32,32);
        }
        // Architecture belongs to this scene, never an extra enemy or free loot.
        for(const [name,x,y] of [['vault_closed',cols-2,1],['lamp',1,1],['light_strip',cols-2,rows-2]]){
          const tile=quality(api.getWorldTile(name,{era:o.era}));if(tile)ctx.drawImage(tile,x*32,y*32,32,32);
        }
        return true;
      }
    },{contract:'outlaws.sprite-v4.1 / api.js + manifest.js',backgroundOnly:true});
  }
  function delegate(method, ctx, options) {
    if (!backend?.ready || typeof backend.adapter[method] !== 'function') return false;
    ctx.save();
    try {
      // An approved adapter may explicitly decline an unsupported asset with false.
      return backend.adapter[method](ctx, options) !== false;
    } catch (_) {
      backendErrors += 1;
      return false;
    } finally { ctx.restore(); }
  }

  function drawOutlaw(ctx, options = {}) {
    if (!ctx || typeof ctx.fillRect !== 'function') return false;
    const prefs = preferences(options);
    const o = {
      id: options.id, rank: rankOf(options.rank), era: eraOf(options.era),
      x: integer(options.x, 0), y: integer(options.y, 0),
      state: states.includes(options.state) ? options.state : 'idle',
      face: faceOf(options.face), frame: prefs.motion ? Math.max(0, integer(options.frame, 0)) : 0,
      scale: scaleOf(options.scale), motion: prefs.motion, effects: prefs.effects
    };
    if (delegate('drawOutlaw', ctx, o)) return true;

    const colors = ranks[o.rank], person = identity(o.id), skin = skins[person];
    const walking = o.state === 'walk' && prefs.motion && o.frame % 2 === 1;
    const attacking = o.state === 'attack';
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(o.x, o.y);
    ctx.scale(o.scale, o.scale);
    if (o.face < 0) { ctx.translate(32, 0); ctx.scale(-1, 1); }
    if (o.state === 'fall') { ctx.translate(16, 16); ctx.rotate(Math.PI / 2); ctx.translate(-16, -16); }

    // Shared proportions and face identity: clothing changes, the crew member does not.
    rect(ctx, ink, 9, 2, 14, 13);
    rect(ctx, colors[0], 10, 3, 12, 11);
    rect(ctx, colors[1], 11, 3, 9, 3);
    rect(ctx, skin, 11, 7, 10, 5);
    rect(ctx, ink, 12, 8, 2, 2);
    rect(ctx, '#f7e6bc', 18, 8, 2, 1);
    rect(ctx, ink, 18, 9, 2, 1);
    // Six fixed face details remain visible through hood, mask or visor.
    rect(ctx, person % 2 ? colors[2] : '#825740', 11 + person % 3, 11, 2, 1);
    rect(ctx, ink, 10, 14, 12, 13);
    rect(ctx, colors[0], 11, 15, 10, 11);
    rect(ctx, colors[1], 12, 15, 5, 9);

    if (o.era === 'medieval') {
      rect(ctx, ink, 7, 15, 3, 11); rect(ctx, ink, 22, 15, 3, 11);
      rect(ctx, colors[0], 8, 16, 3, 10); rect(ctx, colors[1], 21, 16, 3, 10);
      rect(ctx, colors[2], 12, 14, 2, 2);
      rect(ctx, '#604733', 11, 23, 10, 2);
    } else if (o.era === 'modern') {
      rect(ctx, ink, 10, 11, 12, 3); // Balaclava around the same visible eyes.
      rect(ctx, '#28333b', 11, 16, 10, 7);
      rect(ctx, colors[1], 12, 17, 3, 4); rect(ctx, colors[0], 17, 17, 3, 4);
      rect(ctx, '#66727a', 12, 22, 8, 1);
      rect(ctx, ink, 8, 16, 2, 7); rect(ctx, ink, 22, 16, 2, 7);
    } else {
      rect(ctx, ink, 8, 1, 16, 14); rect(ctx, colors[1], 9, 2, 14, 12);
      rect(ctx, '#263a48', 10, 6, 12, 6);
      rect(ctx, skin, 11, 7, 10, 4); rect(ctx, ink, 12, 8, 2, 2);
      rect(ctx, '#f7e6bc', 18, 8, 2, 1); rect(ctx, ink, 18, 9, 2, 1);
      rect(ctx, colors[2], 10, 4, 3, 1); rect(ctx, colors[0], 10, 12, 12, 1);
      rect(ctx, '#c0d3d9', 12, 16, 8, 5); rect(ctx, '#263a48', 13, 17, 6, 3);
      rect(ctx, colors[2], 8, 16, 3, 6); rect(ctx, colors[0], 21, 16, 3, 6);
    }
    // Rank pin always occupies the same place. It is not a loot or rank calculation.
    rect(ctx, colors[2], 18, 16, 2, 2);
    rect(ctx, ink, 7, 18, 3, 7); rect(ctx, colors[0], 8, 19, 2, 5);
    if (attacking) {
      const armY = prefs.motion && o.frame % 6 > 2 ? 15 : 18;
      rect(ctx, ink, 21, armY, 8, 4); rect(ctx, colors[1], 22, armY + 1, 5, 2);
      rect(ctx, skin, 27, armY + 1, 2, 2);
    } else {
      rect(ctx, ink, 22, 18, 3, 7); rect(ctx, colors[1], 22, 19, 2, 5);
    }
    rect(ctx, ink, 11, 26, 5, walking ? 4 : 5);
    rect(ctx, ink, 17, 26, 5, walking ? 5 : 4);
    rect(ctx, '#443c36', 10, walking ? 29 : 30, 6, 1);
    rect(ctx, '#443c36', 17, walking ? 30 : 29, 6, 1);
    if (o.state === 'hit' && prefs.effects) rect(ctx, colors[2], 10, 15, 1, 8);
    ctx.restore();
    return true;
  }

  function line(ctx, color, x0, y0, x1, y1, thickness) {
    // Integer Bresenham pixels; no antialiased canvas stroke.
    let x = x0, y = y0;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let error = dx + dy;
    while (true) {
      rect(ctx, color, x, y, thickness, thickness);
      if (x === x1 && y === y1) break;
      const twice = 2 * error;
      if (twice >= dy) { error += dy; x += sx; }
      if (twice <= dx) { error += dx; y += sy; }
    }
  }
  const aliases = {
    flameblade: 'flamesword', 'flame-sword': 'flamesword', 'flame-blade': 'flamesword',
    firearrow: 'bow', explosivearrow: 'bow', triplearrow: 'bow', lightningarrow: 'bow',
    combatDrone: 'combatdrone', energyBlade: 'energyblade',ak47:'ak',sabre:'energyblade',
    froststaff:'staff',shockstaff:'staff',flamearrow:'bow',frostarrow:'bow',shockarrow:'bow'
  };
  const weapons = ['sword', 'flamesword', 'bow', 'staff', 'ak', 'awp', 'grenade', 'taser',
    'laser', 'beam', 'energyblade', 'kamikaze', 'combatdrone'];
  function drawWeapon(ctx, options = {}) {
    if (!ctx || typeof ctx.fillRect !== 'function') return false;
    const rawWeapon = String(options.weapon || '');
    const weapon = aliases[rawWeapon] || rawWeapon.toLowerCase();
    const prefs = preferences(options);
    const o = {
      weapon, rawWeapon, era: eraOf(options.era), x: integer(options.x, 0), y: integer(options.y, 0),
      state: states.includes(options.state) ? options.state : 'idle', face: faceOf(options.face),
      frame: prefs.motion ? Math.max(0, integer(options.frame, 0)) % 6 : 0,
      scale: scaleOf(options.scale), motion: prefs.motion, effects: prefs.effects
    };
    if (delegate('drawWeapon', ctx, o)) return true;
    if (!weapons.includes(weapon)) return false;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(o.x, o.y);
    ctx.scale(o.face * o.scale, o.scale);
    ctx.translate(-16, -38); // Hand/grip anchor, not the top-left of the cell.

    if (weapon === 'sword' || weapon === 'flamesword' || weapon === 'energyblade') {
      const glowing = weapon === 'energyblade';
      line(ctx, ink, 22, 28, 42, 6, 5);
      line(ctx, glowing ? '#3e859c' : '#778b98', 23, 28, 43, 6, 3);
      line(ctx, glowing ? '#a3f4e4' : '#e1e7e1', 23, 27, 42, 6, 1);
      rect(ctx, glowing ? '#d1fff0' : '#f2f1da', 44, 4, 2, 3);
      line(ctx, ink, 14, 27, 25, 37, 3);
      line(ctx, '#d7ac59', 15, 27, 26, 37, 1);
      line(ctx, ink, 15, 38, 23, 30, 3); line(ctx, '#7d513b', 16, 38, 24, 30, 1);
      rect(ctx, '#dec080', 14, 38, 3, 3);
      if (weapon === 'flamesword') {
        // Visible steel stays between short flame tongues on both blade edges.
        const shift = prefs.motion && prefs.effects ? o.frame % 3 : 0;
        for (let i = 0; i < 5; i += 1) {
          const bx = 25 + i * 4, by = 24 - i * 4;
          const length = 2 + (i + shift) % 3;
          rect(ctx, '#b94a30', bx - 3, by - length, 2, length + 2);
          rect(ctx, '#ec8b38', bx - 2, by - length + 1, 1, length);
          rect(ctx, '#ffd878', bx + 4, by + 2, 2, length);
          rect(ctx, '#d7652d', bx + 5, by + 3, 1, length + 1);
        }
      }
    } else if (weapon === 'bow') {
      line(ctx, ink, 30, 7, 38, 15, 3); line(ctx, ink, 38, 15, 38, 28, 3);
      line(ctx, ink, 38, 28, 29, 37, 3);
      line(ctx, '#b98b52', 31, 8, 39, 16, 1); line(ctx, '#b98b52', 39, 16, 39, 28, 1);
      line(ctx, '#b98b52', 39, 28, 30, 37, 1);
      line(ctx, '#d8d8bd', 30, 9, 25, 22, 1); line(ctx, '#d8d8bd', 25, 22, 29, 37, 1);
      line(ctx, '#d6bd78', 15, 23, 44, 23, 1); rect(ctx, '#d8e0df', 42, 21, 4, 3);
      line(ctx, '#614832', 16, 38, 25, 24, 2);
    } else if (weapon === 'staff') {
      line(ctx, ink, 15, 38, 34, 9, 4); line(ctx, '#987148', 16, 38, 35, 9, 2);
      rect(ctx, ink, 30, 3, 11, 9); rect(ctx, '#a277be', 32, 4, 7, 6);
      rect(ctx, '#e6c7ed', 33, 4, 2, 2); rect(ctx, '#d7b471', 30, 11, 8, 2);
    } else if (weapon === 'ak' || weapon === 'awp') {
      rect(ctx, ink, 12, 21, 24, 7); rect(ctx, '#707d81', 16, 22, 18, 4);
      rect(ctx, '#56636c', 33, 23, 12, 2); rect(ctx, ink, 44, 22, 3, 4);
      rect(ctx, weapon === 'ak' ? '#906443' : '#536d5e', 9, 23, 8, 6);
      rect(ctx, '#373f42', 21, 28, 5, 8); rect(ctx, '#8f7853', 16, 30, 3, 9);
      if (weapon === 'awp') {
        rect(ctx, ink, 22, 16, 14, 5); rect(ctx, '#91aab0', 23, 17, 12, 2);
        rect(ctx, '#40505a', 25, 20, 3, 2);
      } else { rect(ctx, '#947050', 29, 26, 10, 2); rect(ctx, ink, 22, 15, 2, 6); }
    } else if (weapon === 'grenade') {
      rect(ctx, ink, 12, 20, 12, 16); rect(ctx, '#657b51', 13, 22, 10, 12);
      rect(ctx, '#98aa6d', 14, 23, 3, 9); rect(ctx, '#303d31', 18, 23, 1, 10);
      rect(ctx, '#adb6aa', 15, 18, 7, 3); rect(ctx, ink, 20, 17, 5, 2);
      rect(ctx, '#7d8f8d', 22, 18, 2, 8); rect(ctx, '#81715e', 15, 36, 3, 3);
    } else if (weapon === 'taser') {
      rect(ctx, ink, 13, 21, 14, 9); rect(ctx, '#d3b64f', 14, 22, 12, 6);
      rect(ctx, '#3d474d', 15, 29, 5, 10); rect(ctx, '#e3e9d8', 26, 21, 5, 2);
      rect(ctx, '#e3e9d8', 26, 26, 5, 2); rect(ctx, '#4b747d', 20, 23, 4, 3);
    } else if (weapon === 'laser' || weapon === 'beam') {
      rect(ctx, ink, 11, 20, 26, 10); rect(ctx, '#617b91', 13, 21, 22, 7);
      rect(ctx, '#c2dbdf', 16, 21, 13, 2); rect(ctx, '#353f52', 15, 29, 5, 10);
      rect(ctx, '#75dace', 24, 25, 7, 2); rect(ctx, '#44536c', 35, 22, 10, 5);
      rect(ctx, '#b2f0cf', 44, 23, 2, 3);
      if (weapon === 'beam') { rect(ctx, '#8eb7cf', 24, 17, 10, 3); rect(ctx, '#273947', 25, 18, 8, 1); }
    } else {
      // Two small recognizable drone silhouettes. This draws the held visual only.
      rect(ctx, ink, 14, 17, 22, 10); rect(ctx, '#667d87', 16, 18, 18, 7);
      rect(ctx, weapon === 'kamikaze' ? '#d6a75b' : '#76ced1', 22, 20, 7, 3);
      rect(ctx, '#293943', 8, 13, 8, 3); rect(ctx, '#293943', 34, 13, 8, 3);
      rect(ctx, '#aebfc2', 6, 12, 12, 1); rect(ctx, '#aebfc2', 32, 12, 12, 1);
      line(ctx, '#394951', 16, 25, 16, 38, 2);
      if (weapon === 'combatdrone') { rect(ctx, '#34404e', 29, 27, 12, 3); }
    }
    ctx.restore();
    return true;
  }

  function drawScene(ctx, options = {}) {
    if (!ctx || typeof ctx.fillRect !== 'function') return false;
    const prefs = preferences(options);
    const o = {
      era: eraOf(options.era), width: Math.max(1, integer(options.width, ctx.canvas?.width || 1)),
      height: Math.max(1, integer(options.height, ctx.canvas?.height || 1)),
      time: prefs.motion ? Math.max(0, Number(options.time) || 0) : 0,
      motion: prefs.motion, effects: prefs.effects, sceneEnemies: false
    };
    // Only an explicitly approved background-only adapter may receive this call.
    if (backend?.backgroundOnly && delegate('drawScene', ctx, o)) return true;
    const w = o.width, h = o.height, floor = Math.round(h * 0.64);
    const unit = Math.max(2, Math.floor(Math.min(w / 80, h / 44)));
    const doorW = Math.max(8, Math.round(w * 0.2)), doorH = Math.max(10, Math.round(h * 0.42));
    const doorX = Math.round(w * 0.68), doorY = floor - doorH;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (o.era === 'medieval') {
      rect(ctx, '#313d43', 0, 0, w, floor); rect(ctx, '#484b42', 0, floor, w, h - floor);
      const rowH = Math.max(8, Math.round(floor / 6)), brickW = Math.max(16, Math.round(w / 12));
      for (let row = 0, y = rowH; y < floor; row += 1, y += rowH) {
        rect(ctx, '#222e34', 0, y, w, unit);
        for (let x = row % 2 ? brickW / 2 : 0; x < w; x += brickW) rect(ctx, '#222e34', x, y - rowH + unit, unit, rowH - unit);
      }
      rect(ctx, '#1d292e', doorX, doorY, doorW, doorH);
      rect(ctx, '#697166', doorX - unit, doorY + unit * 2, unit, doorH - unit * 2);
      rect(ctx, '#697166', doorX + doorW, doorY + unit * 2, unit, doorH - unit * 2);
      rect(ctx, '#758074', doorX + unit * 2, doorY - unit, doorW - unit * 4, unit);
      rect(ctx, '#697166', doorX, doorY, doorW, unit);
      for (let x = doorX + unit * 2; x < doorX + doorW - unit; x += unit * 3) rect(ctx, '#68716c', x, doorY + unit * 2, unit, doorH - unit * 2);
    } else if (o.era === 'modern') {
      rect(ctx, '#41545b', 0, 0, w, floor); rect(ctx, '#5c6a66', 0, floor, w, h - floor);
      rect(ctx, '#819394', 0, Math.round(floor * 0.2), w, unit);
      rect(ctx, '#27383f', doorX, doorY, doorW, doorH);
      rect(ctx, '#789195', doorX + unit, doorY + unit, doorW - unit * 2, doorH - unit);
      rect(ctx, '#aab8af', doorX + unit * 2, doorY + unit * 2, doorW - unit * 4, unit);
      const lockX = doorX + Math.round(doorW * 0.55), lockY = doorY + Math.round(doorH * 0.5);
      rect(ctx, '#34484e', lockX, lockY, unit * 4, unit * 4);
      rect(ctx, '#b7c6bb', lockX + unit, lockY - unit, unit, unit * 6);
      rect(ctx, '#b7c6bb', lockX - unit, lockY + unit, unit * 6, unit);
      rect(ctx, '#23373b', Math.round(w * 0.08), Math.round(floor * 0.6), Math.round(w * 0.32), Math.round(floor * 0.35));
      rect(ctx, '#879b92', Math.round(w * 0.08), Math.round(floor * 0.6), Math.round(w * 0.32), unit * 2);
      rect(ctx, '#c0c6a8', Math.round(w * 0.18), Math.round(floor * 0.43), Math.round(w * 0.11), Math.round(floor * 0.17));
    } else {
      rect(ctx, '#233443', 0, 0, w, floor); rect(ctx, '#394d5a', 0, floor, w, h - floor);
      rect(ctx, '#5f8591', 0, Math.round(floor * 0.22), w, unit);
      rect(ctx, '#172936', Math.round(w * 0.08), Math.round(floor * 0.28), Math.round(w * 0.42), Math.round(floor * 0.34));
      rect(ctx, '#86b2b4', Math.round(w * 0.08), Math.round(floor * 0.28), Math.round(w * 0.42), unit);
      rect(ctx, '#4b6877', Math.round(w * 0.3), Math.round(floor * 0.28), unit, Math.round(floor * 0.34));
      rect(ctx, '#7996a1', doorX, doorY, doorW, doorH);
      rect(ctx, '#3b5666', doorX + unit, doorY + unit, doorW - unit * 2, doorH - unit);
      rect(ctx, '#8dd0c2', doorX + Math.round(doorW / 2), doorY + unit * 2, unit, doorH - unit * 3);
      rect(ctx, '#506e7d', Math.round(w * 0.12), Math.round(floor * 0.76), Math.round(w * 0.26), Math.round(floor * 0.2));
      rect(ctx, '#9cb6b8', Math.round(w * 0.13), Math.round(floor * 0.77), Math.round(w * 0.24), unit);
    }
    rect(ctx, '#1e3035', 0, floor, w, unit);
    for (let row = 1; row <= 3; row += 1) {
      const y = floor + Math.round((h - floor) * row / 4);
      rect(ctx, o.era === 'future' ? '#58737d' : '#374c4b', 0, y, w, 1);
    }
    ctx.restore();
    return true;
  }

  function registerArt(adapter, approval = {}) {
    // This is OUR adapter contract, not an assumed name/signature in final ART V4.
    // Root/final art registers a mapping only after reading its actual contract.
    const contract = typeof approval.contract === 'string' ? approval.contract.trim() : '';
    if (!adapter || !contract || !['drawOutlaw', 'drawWeapon', 'drawScene'].some(k => typeof adapter[k] === 'function')) return false;
    const entry = { adapter, contract, backgroundOnly: approval.backgroundOnly === true, ready: false };
    backend = entry;
    const promise = adapter.whenReady;
    if (promise && typeof promise.then === 'function') {
      Promise.resolve(promise).then(() => {
        if (backend !== entry) return;
        entry.ready = true; publish('approved-art-ready');
      }, () => {
        if (backend !== entry) return;
        backend = null; publish('approved-art-unavailable');
      });
    } else { entry.ready = true; publish('approved-art-registered'); }
    return true;
  }
  root.OutlawsFightArt = {
    drawOutlaw, drawWeapon, drawScene, registerArt,
    getState: () => ({
      ready: true, visualOnly: true, provisional: !backend?.ready,
      backend: backend?.ready ? backend.contract : 'clean-fallback', legacyReady,
      sceneEnemies: false, revision, backendErrors,
      cell: { outlaw: 32, weapon: 48 }, weaponAnchor: { x: 16, y: 38 },
      eras: eras.slice(), weapons: weapons.slice()
    })
  };
  root.addEventListener('outlaws:era-art-ready', observeLegacy);
  root.addEventListener('outlaws:sprite-v4-ready',registerV4);
  if(root.OutlawsSpriteV4?.whenReady)root.OutlawsSpriteV4.whenReady.then(registerV4).catch(()=>{});
  registerV4();
  observeLegacy();
  // Asynchronous initial notification lets a loader attach after this script runs.
  Promise.resolve().then(() => publish('bridge-ready'));
})(window);

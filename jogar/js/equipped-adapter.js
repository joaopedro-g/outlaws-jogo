/* Readonly pixel-render adapter. No game source edit, simulation call, clock/key capture or provider access. */
(function (root) {
  'use strict';
  if (root.OutlawsEquippedAdapter) return;
  const doc = root.document, proto = root.CanvasRenderingContext2D.prototype;
  const native = { drawImage: proto.drawImage, setTransform: proto.setTransform, arc: proto.arc, fillRect: proto.fillRect };
  const sources = new WeakMap(), frames = new WeakMap(), cards = new Map(), expected = new Map();
  const rejectedProps = new WeakSet();
  const scannedCards = new WeakMap();
  const probe = doc.createElement('canvas'); probe.width = probe.height = 32;
  const probeCtx = probe.getContext('2d', { willReadFrequently: true });
  let busy = false, frameSerial = 0, draws = 0, attacks = 0, latestActors = [];
  const SP = root.OutlawsLib?.sprite, originalBuild = SP?.build;
  const rankEdges = new Set();
  for (const rank of root.OutlawsLib?.traits?.RANKS || []) for (const color of rank.rarity || []) {
    const rgb = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16));
    for (const lit of [false, true]) rankEdges.add(rgb.map((c, i) => Math.round(c * (lit ? .78 : .38) + [18, 23, 18][i] * (lit ? .22 : .62))).join(','));
  }
  function hash(data, mirror = false) {
    let h = 2166136261;
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const i = (y * 32 + (mirror ? 31 - x : x)) * 4;
      // Ignore rank-coloured outlines: use the interior, opaque sprite body.
      if (x < 1 || x > 30 || y < 1 || y > 30 || !data[i + 3]) continue;
      // Internal concavities may be surrounded by opaque pixels too.
      if (rankEdges.has(data[i] + ',' + data[i + 1] + ',' + data[i + 2])) continue;
      const near = [i - 4, i + 4, i - 128, i + 128];
      if (near.some(j => !data[j + 3])) continue;
      for (let k = 0; k < 4; k++) h = Math.imul(h ^ data[i + k], 16777619);
    }
    return h >>> 0;
  }
  function match(pixels, candidate, face) {
    let count = 0;
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const i = (y * 32 + x) * 4; if (!candidate[i + 3]) continue;
      const j = (y * 32 + (face < 0 ? 31 - x : x)) * 4;
      if (pixels[j + 3] !== candidate[i + 3] || pixels[j] !== candidate[i] || pixels[j + 1] !== candidate[i + 1] || pixels[j + 2] !== candidate[i + 2]) return false;
      count++;
    }
    return count > 35;
  }
  function scanCards() {
    // Existing public portraits bootstrap cached heist bitmaps before the next update.
    for (const card of doc.querySelectorAll('.card')) {
      const id = Number(card.querySelector('[data-act="select"]')?.dataset.id);
      const image = card.querySelector('img');
      if (!Number.isFinite(id) || !image?.complete || image.naturalWidth !== 32 || !image.src.startsWith('data:image/')) continue;
      if (scannedCards.get(image) === image.src) continue;
      try {
        busy = true; probeCtx.clearRect(0, 0, 32, 32); native.drawImage.call(probeCtx, image, 0, 0);
        cards.set(id, probeCtx.getImageData(0, 0, 32, 32).data);
        scannedCards.set(image, image.src);
      } catch {} finally { busy = false; }
    }
  }
  function capture(outlaws) {
    for (const o of outlaws || []) {
      if (!Number.isFinite(o.id) || !o.iso || expected.has(o.id)) continue;
      // Derive presentation pixels only. Do not retain update payload or any other field.
      const grid = originalBuild.call(SP, o.iso), pal = SP.palette(o.iso), data = new Uint8ClampedArray(32 * 32 * 4);
      for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
        const color = pal[grid[y][x]]; if (!color || grid[y][x] === '.') continue;
        const i = (y * 32 + x) * 4; data.set(color, i); data[i + 3] = 255;
      }
      expected.set(o.id, data);
    }
    while (expected.size > 64) expected.delete(expected.keys().next().value);
  }
  if (root.Heist?.update) {
    const update = root.Heist.update;
    root.Heist.update = function (p) { capture(p?.outlaws); return update.apply(this, arguments); };
  }
  function identify(source, actorSlice) {
    if (rejectedProps.has(source)) return null;
    let cached = sources.get(source); if (cached) return cached;
    if (source?.width !== 34 || source.height !== 34 || !source.getContext) return null;
    try {
      const sourceCtx = source.getContext('2d'), face = sourceCtx.getTransform().a < 0 ? -1 : 1;
      const pixels = sourceCtx.getImageData(1, 1, 32, 32).data;
      for (const [id, data] of [...expected, ...cards]) {
        if (match(pixels, data, face)) { cached = { id, face, identity: 'outlaw' }; sources.set(source, cached); return cached; }
      }
      // The renderer's sprite bitmaps have only transparent/opaque pixels.
      // All 34px crate/chest/vault bitmaps have translucent ground shadows.
      // This also bootstraps normal-facing, reduced-motion actors with Arcade persisted.
      if (!actorSlice && face > 0) {
        const all = sourceCtx.getImageData(0, 0, 34, 34).data;
        let opaque = 0;
        for (let i = 3; i < all.length; i += 4) {
          if (all[i] && all[i] !== 255) { rejectedProps.add(source); return null; }
          if (all[i] === 255) opaque++;
        }
        if (opaque < 35) { rejectedProps.add(source); return null; }
      }
      const a = hash(pixels), b = hash(pixels, true);
      // A stable identity for the actual drawn bitmap, even before a public update.
      cached = { id: 'sprite:' + Math.min(a, b).toString(16), face, identity: 'pixels' };
      sources.set(source, cached); return cached;
    } catch { return null; }
  }
  function api() { return root.OutlawsEquippedWeapons; }
  function begin(ctx) {
    if (!api() || busy || ctx.canvas.id !== 'heist-map') return;
    const transform = ctx.getTransform(), scale = Math.abs(transform.a) || 1;
    const frame = { serial: ++frameSerial, actors: new Map(), now: performance.now() };
    frames.set(ctx, frame);
    root.OutlawsEnemyStage?.beginFrame?.(ctx, frame.now);
    api().beginFrame(ctx, { canvas: ctx.canvas, now: frame.now, width: ctx.canvas.width / scale, height: ctx.canvas.height / scale });
    // Finish after the complete synchronous game paint, before browser composition.
    queueMicrotask(() => { if (frames.get(ctx) !== frame || !api()) return; latestActors = [...frame.actors.values()].map(({id,x,y,face,working,identity})=>({id,x,y,face,working,identity})); busy = true; try { api().endFrame(ctx, frame.now); } finally { busy = false; } });
  }
  proto.setTransform = function (...args) { const result = native.setTransform.apply(this, args); begin(this); return result; };
  proto.drawImage = function (source, ...args) {
    const alpha = this.globalAlpha;
    const result = native.drawImage.call(this, source, ...args);
    if (busy || this.canvas.id !== 'heist-map' || !api()) return result;
    const sliced = args.length === 8;
    const actorSlice = sliced && args[2] === 34 && args[6] === 34 && [0, 20, 29].includes(args[1]);
    const info = identify(source, actorSlice), frame = frames.get(this);
    if (!info && !sliced && [32,34].includes(source?.width) && source?.height === source.width && args.length === 2) root.OutlawsEnemyStage?.observeProp?.(this, source, args[0], args[1]);
    if (!info || !frame) return result;
    const x = sliced ? args[4] - args[0] : args[0], y = sliced ? args[5] - args[1] : args[1];
    if (!Number.isFinite(x) || !Number.isFinite(y)) return result;
    let actor = frame.actors.get(info.id);
    if (!actor) {
      actor = { id: info.id, x, y, face: info.face, width: 34, height: 34, working: alpha > .9, state: 'idle', canvas: this.canvas, identity: info.identity };
      frame.actors.set(info.id, actor);
    }
    if (!sliced || args[1] >= 29) { api().drawActor(this, actor, frame.now); draws++; }
    return result;
  };
  function attack(ctx, x, y, target) {
    const frame = frames.get(ctx); if (!frame || !api()) return;
    let nearest, distance = 40;
    for (const actor of frame.actors.values()) {
      const d = Math.hypot(actor.x + 17 - x, actor.y + 17 - y);
      if (actor.working && d < distance) { nearest = actor; distance = d; }
    }
    if (nearest) root.OutlawsFightScene?.observeAttack?.({id:nearest.id,target,observed:true});
    if (nearest && api().fire(nearest.id, { target, observed: true })) attacks++;
  }
  proto.arc = function (x, y, radius, start, end, ...rest) {
    const result = native.arc.call(this, x, y, radius, start, end, ...rest);
    if (!busy && this.canvas.id === 'heist-map' && radius === 13 && Math.abs(end - start - 2.2) < .001) {
      const angle = (start + end) / 2, ax = x - Math.cos(angle) * 12, ay = y - Math.sin(angle) * 12;
      attack(this, ax, ay, { x: ax + Math.cos(angle) * 40, y: ay + Math.sin(angle) * 40 });
    }
    return result;
  };
  proto.fillRect = function (x, y, width, height) {
    const result = native.fillRect.call(this, x, y, width, height);
    if (!busy && this.canvas.id === 'heist-map' && x === -12 && y === -1 && width === 12 && height === 2) {
      const m = this.getTransform(), scale = Math.hypot(m.a, m.b) || 1;
      attack(this, m.e / scale, m.f / scale, { x: (m.e + m.a * 55) / scale, y: (m.f + m.b * 55) / scale });
    }
    return result;
  };
  scanCards();
  const observer = new MutationObserver(() => { if (cards.size < 64) scanCards(); });
  observer.observe(doc.getElementById('band-list') || doc.body, { childList: true, subtree: true });
  root.OutlawsEquippedAdapter = { getState: () => ({ frameSerial, actorDraws: draws, observedAttacks: attacks, knownOutlaws: expected.size, portraitMatches: cards.size, actors: latestActors.map(a=>({...a})) }) };
})(window);

/* OUTLAWS epochs: original, deterministic short western/pixel-action cues.
 * No downloaded media, network work, game data or transaction logic.
 * Browser: OutlawsEpochSFX.play(name,{rarity:0..5}), stop(), getState(), unlock(event).
 * Node: synthesize(name,{rarity}), recipes, names, resolveName, rarityOf, sampleRate.
 */
(function (host, factory) {
  'use strict';
  const kit = factory();
  if (typeof module === 'object' && module.exports) module.exports = kit;
  if (!host?.document || host.OutlawsEpochSFX) return;
  const doc = host.document, voices = [], buffers = new Map(), lastPlayed = new Map();
  let context = null, master = null, resuming = null, generation = 0, guardTimer = null;
  let available = Boolean(host.AudioContext || host.webkitAudioContext);
  function preferences() {
    try { const state = host.OutlawsSFX?.getState?.(); if (state) return { muted: state.muted === true, volume: Math.max(0, Math.min(.65, Number(state.volume) || 0)) }; } catch (_) {}
    return { muted: true, volume: 0 };
  }
  function effectsEnabled() {
    try { const state = host.OutlawsJuice?.getState?.(); return state ? state.effects !== false : host.localStorage.getItem('outlaws:juice:effects') !== 'off'; } catch (_) { return true; }
  }
  function enabled() { const state = preferences(); return !doc.hidden && !state.muted && state.volume > 0 && effectsEnabled(); }
  function getState() {
    const state = preferences();
    return Object.freeze({ available, unlocked: Boolean(context), running: context?.state === 'running', muted: state.muted,
      volume: state.volume, effects: effectsEnabled(), hidden: doc.hidden, activeVoices: voices.length, cachedVariants: buffers.size });
  }
  function stopVoice(voice) { try { voice.stop(); } catch (_) {} try { voice.disconnect(); } catch (_) {} }
  function stop() { generation++; voices.splice(0).forEach(stopVoice); if (guardTimer !== null) { host.clearInterval(guardTimer); guardTimer = null; } }
  function reconcile() {
    if (master && context) { master.gain.cancelScheduledValues(context.currentTime); master.gain.setValueAtTime(enabled() ? preferences().volume : 0, context.currentTime); }
    if (!enabled()) stop();
  }
  function unlock(event) {
    if (!(event instanceof host.Event) || event.type !== 'click' || !event.isTrusted || doc.hidden || !available || !enabled()) return Promise.resolve(false);
    if (!context) {
      try { const AudioContext = host.AudioContext || host.webkitAudioContext; context = new AudioContext({ latencyHint: 'interactive' }); master = context.createGain(); master.gain.value = preferences().volume; master.connect(context.destination); }
      catch (_) { available = false; return Promise.resolve(false); }
    }
    reconcile();
    if (context.state === 'running') return Promise.resolve(true);
    if (!resuming) resuming = context.resume().then(() => { resuming = null; reconcile(); return context.state === 'running' && enabled(); }).catch(() => { resuming = null; return false; });
    return resuming;
  }
  function play(value, options) {
    const name = kit.resolveName(value), rarity = kit.rarityOf(options?.rarity);
    if (!name || !context || !enabled()) return false;
    if (context.state !== 'running') {
      const requestedGeneration = generation;
      if (resuming) resuming.then(ready => { if (ready && requestedGeneration === generation) play(name, { rarity }); });
      return false;
    }
    const now = host.performance.now(), key = name + ':' + rarity;
    if (now - (lastPlayed.get(name) ?? -10000) < 100) return false;
    lastPlayed.set(name, now); reconcile();
    // A single weapon layer owns the cue budget, avoiding doubled shots from
    // earlier proposals. Only documented public stop methods are invoked.
    host.OutlawsArsenalSFX?.stop?.(); host.OutlawsEquippedSFX?.stop?.();
    if (voices.length >= 4) stopVoice(voices.shift());
    let buffer = buffers.get(key);
    if (!buffer) { const rendered = kit.synthesize(name, { rarity }); buffer = context.createBuffer(1, rendered.samples.length, rendered.sampleRate); buffer.getChannelData(0).set(rendered.samples); buffers.set(key, buffer); }
    const voice = context.createBufferSource(); voice.buffer = buffer; voice.connect(master); voices.push(voice);
    voice.onended = () => { const index = voices.indexOf(voice); if (index !== -1) voices.splice(index, 1); try { voice.disconnect(); } catch (_) {} if (!voices.length && guardTimer !== null) { host.clearInterval(guardTimer); guardTimer = null; } };
    voice.start();
    if (guardTimer === null) guardTimer = host.setInterval(reconcile, 60);
    return true;
  }
  doc.addEventListener('click', event => { if (event.isTrusted) unlock(event); }, true);
  doc.addEventListener('change', reconcile); host.addEventListener('outlaws:sfx-state', reconcile);
  doc.addEventListener('visibilitychange', () => { if (doc.hidden) { reconcile(); if (context?.state === 'running') context.suspend().catch(() => {}); } });
  host.addEventListener('pagehide', stop);
  host.OutlawsEpochSFX = Object.freeze({ play, stop, unlock, getState, names: kit.names, recipes: kit.recipes, synthesize: kit.synthesize,
    resolveName: kit.resolveName, rarityOf: kit.rarityOf, sampleRate: kit.sampleRate });
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const RATE = 44100, TAU = Math.PI * 2, LIMIT = .055;
  // [start, length, initial Hz, final Hz, gain, waveform]. No cue >800ms.
  const RECIPES = {
    staff: { duration: .27, notes: [[0,.045,1200,700,.12,'crack'],[.035,.16,587,587,.1,'triangle'],[.09,.14,1175,1175,.055,'ring']] },
    fire: { duration: .53, notes: [[0,.24,900,1800,.11,'air'],[.07,.16,587,880,.12,'pulse'],[.19,.27,1175,587,.08,'ring'],[.25,.14,2100,900,.1,'crack']] },
    lightning: { duration: .34, notes: [[0,.055,2600,1175,.18,'crack'],[.075,.05,2200,880,.14,'crack'],[.15,.055,3000,1175,.16,'crack'],[.19,.12,1760,1175,.07,'metal']] },
    ice: { duration: .60, notes: [[0,.20,1760,1760,.12,'ring'],[.055,.23,2349,2349,.085,'ring'],[.13,.29,1175,1175,.08,'metal'],[.23,.28,1760,1760,.04,'ring']] },
    heal: { duration: .66, notes: [[0,.18,587,587,.1,'triangle'],[.10,.18,740,740,.1,'triangle'],[.20,.2,880,880,.1,'ring'],[.32,.29,1175,1175,.09,'ring']] },
    frog: { duration: .48, notes: [[0,.18,330,494,.15,'frog'],[.16,.23,392,587,.12,'frog'],[.30,.13,1175,880,.03,'ring']] },
    sword: { duration: .28, notes: [[0,.12,1800,800,.13,'air'],[.07,.035,2400,1000,.16,'crack'],[.075,.17,1175,880,.1,'metal']] },
    flameblade: { duration: .43, notes: [[0,.17,1800,700,.12,'air'],[.07,.05,2400,900,.16,'crack'],[.095,.24,880,587,.085,'metal'],[.17,.20,1200,1600,.08,'air']] },
    bow: { duration: .26, notes: [[0,.06,880,440,.1,'pulse'],[.025,.15,1800,700,.12,'air'],[.085,.11,1175,880,.03,'ring']] },
    explosivearrow: { duration: .51, notes: [[0,.07,880,440,.075,'pulse'],[.025,.15,1900,740,.075,'air'],[.18,.20,1600,500,.18,'crack'],[.18,.21,494,330,.09,'pulse'],[.24,.20,880,587,.06,'ring']] },
    firearrow: { duration: .40, notes: [[0,.06,880,440,.08,'pulse'],[.025,.20,2100,800,.11,'air'],[.13,.19,587,880,.07,'pulse'],[.19,.13,2000,900,.10,'crack']] },
    triplearrow: { duration: .36, notes: [[0,.05,880,440,.09,'pulse'],[.015,.10,1800,700,.09,'air'],[.09,.05,988,494,.09,'pulse'],[.105,.10,2000,880,.09,'air'],[.18,.05,1175,587,.09,'pulse'],[.195,.12,2200,1000,.09,'air']] },
    kamikaze: { duration: .58, notes: [[0,.30,440,880,.12,'buzz'],[.10,.25,880,1760,.075,'rise'],[.30,.19,2100,500,.17,'crack'],[.33,.19,587,392,.08,'pulse']] },
    combatdrone: { duration: .65, notes: [[0,.52,440,587,.14,'rotor'],[.02,.47,1000,1600,.075,'air'],[.38,.055,2200,1000,.08,'crack'],[.47,.055,2200,1000,.075,'crack']] },
    laser: { duration: .31, notes: [[0,.17,2349,587,.15,'pulse'],[.06,.17,1760,440,.085,'triangle'],[.145,.13,1175,494,.045,'ring']] },
    beam: { duration: .62, notes: [[0,.49,880,1175,.11,'buzz'],[.055,.44,1175,1760,.08,'rise'],[.36,.20,1760,880,.06,'ring']] },
    energyblade: { duration: .38, notes: [[0,.22,440,740,.10,'buzz'],[.065,.12,2000,880,.12,'air'],[.12,.16,1175,880,.11,'metal']] },
    transform: { duration: .60, notes: [[0,.19,587,1175,.09,'rise'],[.13,.22,880,1760,.085,'ring'],[.25,.24,1175,1175,.09,'metal'],[.33,.23,1760,1760,.06,'ring']] },
    mythic: { duration: .78, notes: [[0,.15,587,587,.10,'pulse'],[.08,.15,740,740,.10,'pulse'],[.16,.15,880,880,.10,'pulse'],[.24,.15,1175,1175,.11,'pulse'],[.34,.38,1175,1175,.095,'ring'],[.34,.38,740,740,.04,'triangle']] },
    bossenter: { duration: .73, notes: [[0,.14,294,294,.10,'pulse'],[.15,.14,440,440,.10,'pulse'],[.30,.14,587,587,.11,'pulse'],[.43,.24,880,587,.09,'metal'],[.43,.18,1300,800,.05,'crack']] },
    bossfight: { duration: .53, notes: [[0,.08,440,440,.11,'pulse'],[.11,.08,587,587,.11,'pulse'],[.22,.09,440,440,.11,'pulse'],[.34,.14,740,587,.12,'metal'],[0,.035,1600,900,.07,'crack'],[.22,.035,1600,900,.07,'crack']] },
    boxreveal: { duration: .58, notes: [[0,.05,1500,880,.10,'crack'],[.035,.09,440,587,.085,'triangle'],[.13,.16,880,880,.10,'ring'],[.24,.23,1175,1175,.10,'ring'],[.33,.19,1760,1760,.065,'ring']] },
    ak: { duration: .29, notes: [[0,.052,2200,1100,.20,'crack'],[0,.063,740,494,.09,'pulse'],[.073,.052,2200,1100,.19,'crack'],[.073,.063,740,494,.09,'pulse'],[.146,.060,2200,1100,.20,'crack'],[.146,.10,740,494,.075,'pulse']] },
    awp: { duration: .42, notes: [[0,.075,1175,1760,.045,'rise'],[.095,.034,3000,900,.23,'crack'],[.095,.13,587,392,.11,'pulse'],[.105,.16,1760,1175,.07,'metal'],[.19,.19,1175,880,.04,'ring']] },
    grenade: { duration: .53, notes: [[0,.055,1175,740,.05,'rise'],[.085,.025,1760,1175,.05,'metal'],[.16,.20,1800,500,.23,'crack'],[.16,.18,494,330,.12,'pulse'],[.195,.27,1200,500,.08,'air']] },
    taser: { duration: .33, notes: [[0,.29,587,880,.14,'buzz'],[0,.045,2200,1500,.075,'crack'],[.08,.045,1760,1175,.05,'metal'],[.175,.085,2349,1760,.035,'ring']] }
  };
  const ALIASES = Object.freeze({ stafffire:'fire', 'staff-fire':'fire', stafflightning:'lightning', 'staff-lightning':'lightning', staffice:'ice', 'staff-ice':'ice', staffheal:'heal', 'staff-heal':'heal', stafffrog:'frog', 'staff-frog':'frog', 'flame-blade':'flameblade', 'explosive-arrow':'explosivearrow', 'fire-arrow':'firearrow', 'triple-arrow':'triplearrow', 'combat-drone':'combatdrone', 'energy-blade':'energyblade', saber:'energyblade', ray:'beam', 'boss-enter':'bossenter', 'boss-fight':'bossfight', 'box-reveal':'boxreveal' });
  Object.values(RECIPES).forEach(recipe => { recipe.notes.forEach(Object.freeze); Object.freeze(recipe.notes); Object.freeze(recipe); }); Object.freeze(RECIPES);
  function resolveName(value) { const name = typeof value === 'string' ? value.toLowerCase() : ''; return Object.prototype.hasOwnProperty.call(RECIPES,name) ? name : Object.prototype.hasOwnProperty.call(ALIASES,name) ? ALIASES[name] : null; }
  function rarityOf(value) { const number = Number(value); return Number.isFinite(number) ? Math.max(0,Math.min(5,Math.floor(number))) : 0; }
  function randomFor(value) { let seed = 2166136261; for (let index = 0; index < value.length; index++) seed = Math.imul(seed ^ value.charCodeAt(index),16777619); return () => { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed/2147483648-1; }; }
  function synthesize(value, options) {
    const name = resolveName(value); if (!name) throw new RangeError('Unknown epoch sound: '+value);
    const rarity = rarityOf(options?.rarity), pitch = Math.pow(2,rarity/12), recipe = RECIPES[name];
    const samples = new Float32Array(Math.round(recipe.duration*RATE)), random = randomFor(name+':'+rarity);
    for (const note of recipe.notes) {
      const offset = Math.round(note[0]*RATE), count = Math.round(note[1]*RATE); let phase = 0, smooth = 0, noiseLow = 0;
      for (let index = 0; index < count && offset+index < samples.length; index++) {
        const time = index/RATE, progress = time/note[1], frequency = (note[2]+(note[3]-note[2])*progress)*pitch; phase += frequency/RATE;
        let wave;
        if (note[5]==='air' || note[5]==='crack') { const white = random(); noiseLow += (note[5]==='air'?.13:.25)*(white-noiseLow); wave = white-noiseLow; if (note[5]==='crack') wave = .82*wave+.18*Math.sin(TAU*phase); }
        else if (note[5]==='ring') wave = .76*Math.sin(TAU*phase)+.24*Math.sin(TAU*phase*2);
        else if (note[5]==='metal') wave = .58*Math.sin(TAU*phase)+.26*Math.sin(TAU*phase*2)+.16*Math.sin(TAU*phase*2.75);
        else if (note[5]==='triangle') wave = 1-4*Math.abs(Math.round(phase)-phase);
        else if (note[5]==='rise') wave = Math.sin(TAU*phase);
        else if (note[5]==='frog') wave = Math.sin(TAU*phase)*(.25+.75*Math.max(0,Math.sin(TAU*22*time)))+.15*Math.sin(TAU*phase*2);
        else { wave = phase%1<.30?.7:-.30; if (note[5]==='buzz' || note[5]==='rotor') wave *= .3+.7*Math.max(0,Math.sin(TAU*(note[5]==='rotor'?24:42)*time)); }
        smooth += .48*(wave-smooth);
        const attack = Math.min(1,time/(note[5]==='crack'?.002:.004)), release = Math.min(1,(note[1]-time)/.016);
        const body = note[5]==='rise' ? Math.sin(Math.PI*progress) : Math.exp(-(note[5]==='crack'?2.9:1.9)*progress);
        // Cheap soft saturation increases the body-to-peak ratio at a fixed
        // output ceiling. Rarity changes pitch/timbre, never the peak budget.
        const drive = smooth*1.7, compressed = drive/(1+Math.abs(drive))*(2.7/1.7);
        samples[offset+index] += compressed*note[4]*attack*release*body;
      }
    }
    const filter = 1-Math.exp(-TAU*220/RATE); let low=0, peak=0;
    for (let index=0;index<samples.length;index++) { low+=filter*(samples[index]-low); samples[index]=(samples[index]-low)*Math.min(1,(samples.length-index-1)/(RATE*.012)); peak=Math.max(peak,Math.abs(samples[index])); }
    if (peak>LIMIT) for (let index=0;index<samples.length;index++) samples[index]*=LIMIT/peak;
    let measured=0,squared=0; for (const sample of samples) { measured=Math.max(measured,Math.abs(sample)); squared+=sample*sample; }
    return { samples, sampleRate:RATE, duration:recipe.duration, peak:measured, rms:Math.sqrt(squared/samples.length), rarity, name };
  }
  return Object.freeze({ names:Object.freeze(Object.keys(RECIPES)), recipes:RECIPES, resolveName, rarityOf, sampleRate:RATE, synthesize });
});

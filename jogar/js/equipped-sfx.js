/* OUTLAWS equipped actor: original pixel-action cues, synthesized locally.
 * Low peaks, firm transients and a fuller middle; no remote audio or sub-bass.
 * Browser: OutlawsEquippedSFX.play(name), stop(), unlock(trustedClick), getState().
 * Node: { names, recipes, sampleRate, synthesize(name) } for identical WAVs.
 */
(function (host, factory) {
  'use strict';
  const kit = factory();
  if (typeof module === 'object' && module.exports) module.exports = kit;
  if (!host?.document || host.OutlawsEquippedSFX) return;
  const doc = host.document, voices = [], buffers = new Map(), lastPlayed = new Map();
  let context = null, master = null, resuming = null, epoch = 0, guardTimer = null;
  let available = Boolean(host.AudioContext || host.webkitAudioContext);
  function preferences() {
    try {
      const base = host.OutlawsSFX?.getState?.();
      if (base) return { muted: base.muted === true, volume: Math.max(0, Math.min(.65, Number(base.volume) || 0)) };
    } catch (_) {}
    return { muted: true, volume: 0 };
  }
  function effectsEnabled() {
    try {
      const juice = host.OutlawsJuice?.getState?.();
      return juice ? juice.effects !== false : host.localStorage.getItem('outlaws:juice:effects') !== 'off';
    } catch (_) { return true; }
  }
  function enabled() { const prefs = preferences(); return !doc.hidden && !prefs.muted && prefs.volume > 0 && effectsEnabled(); }
  function getState() {
    const prefs = preferences();
    return Object.freeze({ available, unlocked: Boolean(context), running: context?.state === 'running', muted: prefs.muted,
      volume: prefs.volume, effects: effectsEnabled(), hidden: doc.hidden, activeVoices: voices.length });
  }
  function stopVoice(voice) { try { voice.stop(); } catch (_) {} try { voice.disconnect(); } catch (_) {} }
  function stop() {
    epoch++; voices.splice(0).forEach(stopVoice);
    if (guardTimer !== null) { host.clearInterval(guardTimer); guardTimer = null; }
  }
  function reconcile() {
    if (master && context) {
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setValueAtTime(enabled() ? preferences().volume : 0, context.currentTime);
    }
    if (!enabled()) stop();
  }
  function unlock(event) {
    if (!(event instanceof host.Event) || event.type !== 'click' || !event.isTrusted || doc.hidden || !available || !enabled()) return Promise.resolve(false);
    if (!context) {
      try {
        const AudioContext = host.AudioContext || host.webkitAudioContext;
        context = new AudioContext({ latencyHint: 'interactive' });
        master = context.createGain(); master.gain.value = preferences().volume; master.connect(context.destination);
      } catch (_) { available = false; return Promise.resolve(false); }
    }
    reconcile();
    if (context.state === 'running') return Promise.resolve(true);
    if (!resuming) resuming = context.resume().then(() => {
      resuming = null; reconcile(); return context.state === 'running' && enabled();
    }).catch(() => { resuming = null; return false; });
    return resuming;
  }
  function play(name) {
    if (!kit.names.includes(name) || !context || !enabled()) return false;
    if (context.state !== 'running') {
      const requestedEpoch = epoch;
      if (resuming) resuming.then(ready => { if (ready && requestedEpoch === epoch) play(name); });
      return false;
    }
    const now = host.performance.now();
    if (now - (lastPlayed.get(name) ?? -10000) < (name === 'ak' ? 110 : 130)) return false;
    lastPlayed.set(name, now); reconcile();
    // Equipped cues supersede the older weapon proposal rather than doubling
    // its voice budget. Use its public API; never patch its graph or methods.
    host.OutlawsArsenalSFX?.stop?.();
    if (voices.length >= 4) stopVoice(voices.shift());
    let buffer = buffers.get(name);
    if (!buffer) {
      const rendered = kit.synthesize(name);
      buffer = context.createBuffer(1, rendered.samples.length, rendered.sampleRate);
      buffer.getChannelData(0).set(rendered.samples); buffers.set(name, buffer);
    }
    const voice = context.createBufferSource();
    voice.buffer = buffer; voice.connect(master); voices.push(voice);
    voice.onended = () => {
      const index = voices.indexOf(voice); if (index !== -1) voices.splice(index, 1);
      try { voice.disconnect(); } catch (_) {}
      if (!voices.length && guardTimer !== null) { host.clearInterval(guardTimer); guardTimer = null; }
    };
    voice.start();
    if (guardTimer === null) guardTimer = host.setInterval(reconcile, 60);
    return true;
  }
  doc.addEventListener('click', event => { if (event.isTrusted) unlock(event); }, true);
  doc.addEventListener('change', reconcile);
  host.addEventListener('outlaws:sfx-state', reconcile);
  doc.addEventListener('visibilitychange', () => {
    if (!doc.hidden) return;
    reconcile(); if (context?.state === 'running') context.suspend().catch(() => {});
  });
  host.addEventListener('pagehide', stop);
  host.OutlawsEquippedSFX = Object.freeze({ play, stop, unlock, getState, names: kit.names, recipes: kit.recipes,
    synthesize: kit.synthesize, sampleRate: kit.sampleRate });
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const RATE = 44100, TAU = Math.PI * 2, PEAK_LIMIT = .055;
  // [start seconds, length, start Hz, end Hz, gain, kind]. Original D/A chip
  // metal notes, compact noise attacks, gently saturated bodies, no bass boom.
  const RECIPES = {
    equip: { duration: .21, notes: [[0, .045, 1760, 1175, .10, 'metal'], [.022, .055, 1600, 1000, .055, 'crack'], [.055, .125, 880, 880, .09, 'metal'], [.075, .115, 1175, 1175, .06, 'ring']] },
    ak: { duration: .29, notes: [[0, .052, 2200, 1100, .20, 'crack'], [0, .063, 740, 494, .09, 'pulse'], [.073, .052, 2200, 1100, .19, 'crack'], [.073, .063, 740, 494, .09, 'pulse'], [.146, .06, 2200, 1100, .20, 'crack'], [.146, .10, 740, 494, .075, 'pulse'], [.19, .075, 1760, 1175, .035, 'metal']] },
    awp: { duration: .42, notes: [[0, .075, 1175, 1760, .045, 'rise'], [.095, .034, 3000, 900, .23, 'crack'], [.095, .13, 587, 392, .11, 'pulse'], [.105, .16, 1760, 1175, .07, 'metal'], [.19, .19, 1175, 880, .04, 'ring']] },
    grenade: { duration: .53, notes: [[0, .055, 1175, 740, .05, 'rise'], [.085, .025, 1760, 1175, .05, 'metal'], [.16, .20, 1800, 500, .23, 'crack'], [.16, .18, 494, 330, .12, 'pulse'], [.195, .27, 1200, 500, .08, 'air'], [.24, .20, 880, 587, .035, 'metal']] },
    taser: { duration: .33, notes: [[0, .29, 587, 880, .14, 'buzz'], [0, .045, 2200, 1500, .075, 'crack'], [.08, .045, 1760, 1175, .05, 'metal'], [.175, .085, 2349, 1760, .035, 'ring']] },
    poof: { duration: .25, notes: [[0, .19, 1200, 500, .14, 'air'], [0, .085, 659, 440, .075, 'triangle'], [.035, .12, 1760, 1175, .035, 'ring']] },
    escape: { duration: .58, notes: [[0, .09, 294, 440, .065, 'triangle'], [.045, .12, 440, 440, .095, 'pulse'], [.13, .12, 587, 587, .10, 'pulse'], [.225, .13, 740, 740, .095, 'pulse'], [.32, .20, 880, 1175, .085, 'ring'], [0, .11, 1600, 2200, .025, 'air']] }
  };
  Object.values(RECIPES).forEach(recipe => { recipe.notes.forEach(Object.freeze); Object.freeze(recipe.notes); Object.freeze(recipe); }); Object.freeze(RECIPES);
  function randomFor(name) {
    let seed = 2166136261;
    for (let index = 0; index < name.length; index++) seed = Math.imul(seed ^ name.charCodeAt(index), 16777619);
    return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2147483648 - 1; };
  }
  function synthesize(name) {
    if (!Object.prototype.hasOwnProperty.call(RECIPES, name)) throw new RangeError('Unknown equipped sound: ' + name);
    const recipe = RECIPES[name], samples = new Float32Array(Math.round(recipe.duration * RATE)), random = randomFor(name);
    for (const note of recipe.notes) {
      const offset = Math.round(note[0] * RATE), count = Math.round(note[1] * RATE);
      let phase = 0, smoothed = 0, noiseLow = 0;
      for (let index = 0; index < count && offset + index < samples.length; index++) {
        const time = index / RATE, progress = time / note[1], frequency = note[2] + (note[3] - note[2]) * progress;
        phase += frequency / RATE;
        let wave;
        if (note[5] === 'crack' || note[5] === 'air') {
          const white = random(); noiseLow += (note[5] === 'air' ? .11 : .27) * (white - noiseLow); wave = white - noiseLow;
          if (note[5] === 'crack') wave = .8 * wave + .2 * Math.sin(TAU * phase);
        } else if (note[5] === 'metal') wave = .54 * Math.sin(TAU * phase) + .28 * Math.sin(TAU * phase * 2) + .18 * Math.sin(TAU * phase * 2.75);
        else if (note[5] === 'ring') wave = .75 * Math.sin(TAU * phase) + .25 * Math.sin(TAU * phase * 2);
        else if (note[5] === 'triangle') wave = 1 - 4 * Math.abs(Math.round(phase) - phase);
        else if (note[5] === 'rise') wave = Math.sin(TAU * phase);
        else { wave = phase % 1 < .30 ? .7 : -.30; if (note[5] === 'buzz') wave *= .3 + .7 * Math.max(0, Math.sin(TAU * 48 * time)); }
        smoothed += .50 * (wave - smoothed);
        const attack = Math.min(1, time / (note[5] === 'crack' ? .0015 : .003));
        const release = Math.min(1, (note[1] - time) / .016);
        const body = note[5] === 'rise' ? Math.sin(Math.PI * progress) : Math.exp(-(note[5] === 'crack' ? 2.9 : 1.75) * progress);
        // Saturation raises the body-to-peak ratio; it does not raise the final
        // peak ceiling. This makes hits firmer at the same quiet volume.
        const compressed = Math.tanh(smoothed * 1.7) / Math.tanh(1.7);
        samples[offset + index] += compressed * note[4] * attack * release * body;
      }
    }
    const highPass = 1 - Math.exp(-TAU * 240 / RATE);
    let low = 0, peak = 0;
    for (let index = 0; index < samples.length; index++) {
      low += highPass * (samples[index] - low);
      samples[index] = (samples[index] - low) * Math.min(1, (samples.length - index - 1) / (RATE * .012));
      peak = Math.max(peak, Math.abs(samples[index]));
    }
    if (peak > PEAK_LIMIT) for (let index = 0; index < samples.length; index++) samples[index] *= PEAK_LIMIT / peak;
    let measured = 0, squared = 0;
    for (const sample of samples) { measured = Math.max(measured, Math.abs(sample)); squared += sample * sample; }
    return { samples, sampleRate: RATE, duration: recipe.duration, peak: measured, rms: Math.sqrt(squared / samples.length) };
  }
  return Object.freeze({ names: Object.freeze(Object.keys(RECIPES)), recipes: RECIPES, sampleRate: RATE, synthesize });
});

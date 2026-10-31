/* OUTLAWS arsenal: short original western/chiptune proposals, no audio files
 * fetched at runtime. Browser and Node use exactly the same PCM recipes.
 * OutlawsArsenalSFX: play(name), stop(), unlock(trustedClick), getState().
 * CommonJS: names, recipes, sampleRate, synthesize(name).
 */
(function (host, factory) {
  'use strict';
  const kit = factory();
  if (typeof module === 'object' && module.exports) module.exports = kit;
  if (!host || !host.document || host.OutlawsArsenalSFX) return;
  const doc = host.document;
  let context = null, master = null, resuming = null, guardTimer = null, epoch = 0;
  const voices = [], buffers = new Map(), lastPlayed = new Map();
  let available = Boolean(host.AudioContext || host.webkitAudioContext);

  function preferences() {
    try {
      const base = host.OutlawsSFX?.getState?.();
      if (base) return { muted: base.muted === true, volume: Math.max(0, Math.min(0.65, Number(base.volume) || 0)) };
    } catch (_) {}
    // Fail closed if the base has not loaded. Its settings are the authority.
    return { muted: true, volume: 0 };
  }
  function effectsEnabled() {
    try {
      const juice = host.OutlawsJuice?.getState?.();
      if (juice) return juice.effects !== false;
      return host.localStorage.getItem('outlaws:juice:effects') !== 'off';
    } catch (_) { return true; }
  }
  function enabled() {
    const prefs = preferences();
    return !doc.hidden && !prefs.muted && prefs.volume > 0 && effectsEnabled();
  }
  function state() {
    const prefs = preferences();
    return Object.freeze({ available, unlocked: Boolean(context), running: context?.state === 'running',
      muted: prefs.muted, volume: prefs.volume, effects: effectsEnabled(), hidden: doc.hidden, activeVoices: voices.length });
  }
  function stopVoice(voice) {
    try { voice.stop(); } catch (_) {}
    try { voice.disconnect(); } catch (_) {}
  }
  function stop() {
    epoch++;
    voices.splice(0).forEach(stopVoice);
    if (guardTimer !== null) { host.clearInterval(guardTimer); guardTimer = null; }
  }
  function reconcile() {
    if (context && master) {
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
        master = context.createGain(); master.gain.value = preferences().volume;
        master.connect(context.destination);
      } catch (_) { available = false; return Promise.resolve(false); }
    }
    reconcile();
    if (context.state === 'running') return Promise.resolve(true);
    if (!resuming) resuming = context.resume().then(() => {
      resuming = null;
      reconcile();
      return context.state === 'running' && enabled();
    }).catch(() => { resuming = null; return false; });
    return resuming;
  }
  function play(name) {
    if (!kit.names.includes(name) || !enabled() || !context) return false;
    if (context.state !== 'running') {
      const whenRequested = epoch;
      if (resuming) resuming.then(ready => { if (ready && whenRequested === epoch) play(name); });
      return false;
    }
    const now = host.performance.now();
    if (now - (lastPlayed.get(name) ?? -10000) < (name === 'ak' ? 110 : 150)) return false;
    lastPlayed.set(name, now);
    reconcile();
    if (voices.length >= 4) stopVoice(voices.shift());
    let buffer = buffers.get(name);
    if (!buffer) {
      const rendered = kit.synthesize(name);
      buffer = context.createBuffer(1, rendered.samples.length, rendered.sampleRate);
      buffer.getChannelData(0).set(rendered.samples);
      buffers.set(name, buffer);
    }
    const voice = context.createBufferSource();
    voice.buffer = buffer; voice.connect(master); voices.push(voice);
    voice.onended = () => {
      const index = voices.indexOf(voice);
      if (index !== -1) voices.splice(index, 1);
      try { voice.disconnect(); } catch (_) {}
      if (!voices.length && guardTimer !== null) { host.clearInterval(guardTimer); guardTimer = null; }
    };
    voice.start();
    // Juice's public setEffects() has no event. Poll only while a short cue is
    // alive; native control changes and base mute events cut it immediately.
    if (guardTimer === null) guardTimer = host.setInterval(reconcile, 60);
    return true;
  }
  doc.addEventListener('click', event => { if (event.isTrusted) unlock(event); }, true);
  doc.addEventListener('change', reconcile);
  host.addEventListener('outlaws:sfx-state', reconcile);
  doc.addEventListener('visibilitychange', () => {
    if (!doc.hidden) return; // No restart when a hidden tab becomes visible.
    reconcile();
    if (context?.state === 'running') context.suspend().catch(() => {});
  });
  host.addEventListener('pagehide', stop);
  host.OutlawsArsenalSFX = Object.freeze({ play, stop, unlock, getState: state,
    names: kit.names, recipes: kit.recipes, synthesize: kit.synthesize, sampleRate: kit.sampleRate });
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const RATE = 44100, TAU = Math.PI * 2, PEAK_LIMIT = 0.055;
  // [start, length, start Hz, end Hz, gain, kind]. Every cue <=760ms.
  const RECIPES = {
    ak: { duration: 0.22, notes: [[0, 0.046, 1500, 790, .19, 'noise'], [0, 0.043, 740, 470, .09, 'pulse'], [.065, .046, 1500, 790, .17, 'noise'], [.065, .043, 740, 470, .08, 'pulse'], [.13, .065, 1500, 790, .18, 'noise'], [.13, .055, 740, 470, .075, 'pulse']] },
    awp: { duration: 0.39, notes: [[0, .16, 880, 1760, .055, 'rise'], [.055, .10, 1175, 2349, .045, 'triangle'], [.175, .045, 2700, 900, .23, 'noise'], [.175, .105, 1175, 392, .11, 'pulse'], [.23, .14, 1760, 880, .075, 'ring']] },
    grenade: { duration: .60, notes: [[0, .035, 1175, 880, .06, 'pulse'], [.09, .035, 1175, 880, .06, 'pulse'], [.18, .035, 1175, 880, .06, 'pulse'], [.285, .265, 1200, 350, .20, 'noise'], [.285, .16, 440, 294, .09, 'triangle'], [.32, .23, 880, 587, .06, 'ring']] },
    taser: { duration: .30, notes: [[0, .265, 440, 740, .16, 'buzz'], [.02, .04, 1760, 1175, .035, 'ring'], [.16, .07, 2349, 1760, .04, 'ring']] },
    laser: { duration: .29, notes: [[0, .15, 2349, 587, .13, 'pulse'], [.05, .17, 1760, 440, .07, 'triangle'], [.14, .13, 1175, 392, .045, 'ring']] },
    rift: { duration: .64, notes: [[0, .19, 587, 1760, .11, 'rise'], [.15, .32, 587, 880, .085, 'ring'], [.19, .32, 880, 1175, .08, 'ring'], [.25, .36, 1175, 1760, .055, 'rise'], [.15, .18, 1200, 2000, .02, 'noise']] },
    abduction: { duration: .76, notes: [[0, .53, 587, 1175, .12, 'rise'], [.08, .48, 880, 1760, .09, 'rise'], [.24, .45, 1175, 2349, .06, 'ring'], [.49, .23, 1760, 1760, .08, 'triangle']] },
    jetpack: { duration: .44, notes: [[0, .36, 800, 1800, .09, 'noise'], [0, .38, 294, 659, .14, 'buzz'], [.11, .30, 587, 1175, .06, 'triangle']] }
  };
  Object.values(RECIPES).forEach(recipe => {
    recipe.notes.forEach(Object.freeze); Object.freeze(recipe.notes); Object.freeze(recipe);
  }); Object.freeze(RECIPES);
  function randomFor(name) {
    let seed = 2166136261;
    for (let index = 0; index < name.length; index++) seed = Math.imul(seed ^ name.charCodeAt(index), 16777619);
    return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2147483648 - 1; };
  }
  function synthesize(name) {
    if (!Object.prototype.hasOwnProperty.call(RECIPES, name)) throw new RangeError('Unknown arsenal sound: ' + name);
    const recipe = RECIPES[name], samples = new Float32Array(Math.round(recipe.duration * RATE));
    const random = randomFor(name);
    for (const note of recipe.notes) {
      const offset = Math.round(note[0] * RATE), count = Math.round(note[1] * RATE);
      let phase = 0, smooth = 0, noiseLow = 0;
      for (let index = 0; index < count && offset + index < samples.length; index++) {
        const t = index / RATE, progress = t / note[1], hz = note[2] + (note[3] - note[2]) * progress;
        phase += hz / RATE;
        let wave;
        if (note[5] === 'noise') { const white = random(); noiseLow += .20 * (white - noiseLow); wave = white - noiseLow; }
        else if (note[5] === 'ring') wave = .72 * Math.sin(TAU * phase) + .22 * Math.sin(TAU * phase * 2) + .06 * Math.sin(TAU * phase * 3);
        else if (note[5] === 'triangle') wave = 1 - 4 * Math.abs(Math.round(phase) - phase);
        else if (note[5] === 'rise') wave = .8 * Math.sin(TAU * phase) + .2 * Math.sin(TAU * phase * 2);
        else { wave = phase % 1 < .25 ? .8 : -.2666667; if (note[5] === 'buzz') wave *= .35 + .65 * Math.max(0, Math.sin(TAU * 35 * t)); }
        smooth += .43 * (wave - smooth);
        const attack = Math.min(1, t / .004), release = Math.min(1, (note[1] - t) / .016);
        const body = note[5] === 'rise' ? Math.pow(Math.sin(Math.PI * progress), 1.4) : Math.exp(-3.5 * progress);
        samples[offset + index] += smooth * note[4] * attack * release * body;
      }
    }
    let low = 0, peak = 0;
    const highPass = 1 - Math.exp(-TAU * 220 / RATE);
    for (let index = 0; index < samples.length; index++) {
      low += highPass * (samples[index] - low);
      samples[index] = (samples[index] - low) * Math.min(1, (samples.length - index - 1) / (RATE * .012));
      peak = Math.max(peak, Math.abs(samples[index]));
    }
    if (peak > PEAK_LIMIT) for (let index = 0; index < samples.length; index++) samples[index] *= PEAK_LIMIT / peak;
    let measured = 0;
    for (const sample of samples) measured = Math.max(measured, Math.abs(sample));
    return { samples, sampleRate: RATE, duration: recipe.duration, peak: measured };
  }
  return Object.freeze({ names: Object.freeze(Object.keys(RECIPES)), recipes: RECIPES, sampleRate: RATE, synthesize });
});

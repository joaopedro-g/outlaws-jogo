/* OUTLAWS sound proposal. Original, deterministic synthesis; no remote assets.
 * The same recipes render in WebAudio and in assets/propostas/sons/generate.cjs.
 * Browser API: OutlawsSFX.init/mount/unlock/play/setMuted/setAmbient/setVolume/getState.
 * CommonJS API: { names, recipes, synthesize, sampleRate } for offline WAV review.
 */
(function (host, factory) {
  'use strict';
  var kit = factory();
  if (typeof module === 'object' && module.exports) module.exports = kit;
  if (!host || !host.document) return;

  var doc = host.document;
  var KEY = 'outlaws:sfx:v1';
  var defaults = { muted: false, ambient: false, volume: 0.28 };
  var prefs = Object.assign({}, defaults);
  try {
    var saved = JSON.parse(host.localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') {
      prefs.muted = saved.muted === true;
      prefs.ambient = saved.ambient === true;
      if (Number.isFinite(saved.volume)) prefs.volume = Math.min(0.65, Math.max(0, saved.volume));
    }
  } catch (_) {}

  var context = null;
  var master = null;
  var ambientSource = null;
  var resumePending = null;
  var voices = [];
  var buffers = new Map();
  var lastPlayed = new Map();
  var initialized = false;
  var controls = null;
  var controlsHome = null;
  var openDialogs = [];
  var watchedDialogs = new WeakSet();
  var available = !!(host.AudioContext || host.webkitAudioContext);
  var translations = {
    en: { on: 'Sound on', off: 'Muted', settings: 'Sound settings', mix: 'Mix', volume: 'Volume', ambient: 'Wind & crickets', unavailable: 'Sound unavailable' },
    pt: { on: 'Som ligado', off: 'Mudo', settings: 'Ajustes de som', mix: 'Som', volume: 'Volume', ambient: 'Vento e grilos', unavailable: 'Som indisponível' },
    es: { on: 'Sonido activo', off: 'Silencio', settings: 'Ajustes de sonido', mix: 'Sonido', volume: 'Volumen', ambient: 'Viento y grillos', unavailable: 'Sonido no disponible' },
    fil: { on: 'May tunog', off: 'Naka-mute', settings: 'Mga setting ng tunog', mix: 'Tunog', volume: 'Volume', ambient: 'Hangin at kuliglig', unavailable: 'Hindi magagamit ang tunog' }
  };

  function strings() {
    var language = host.I18N && typeof host.I18N.lang === 'function' ? host.I18N.lang() : doc.documentElement.lang;
    var code = String(language || 'en').toLowerCase();
    return translations[/^(fil|ph|tl)(-|$)/.test(code) ? 'fil' : code.slice(0, 2)] || translations.en;
  }
  function state() {
    return Object.freeze({ muted: prefs.muted, ambient: prefs.ambient, volume: prefs.volume, available: available,
      unlocked: !!context, running: !!context && context.state === 'running', hidden: doc.hidden });
  }
  function notify() {
    try { host.localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (_) {}
    updateControls();
    host.dispatchEvent(new CustomEvent('outlaws:sfx-state', { detail: state() }));
  }
  function volumeGain() {
    return prefs.muted || doc.hidden ? 0 : prefs.volume;
  }
  function updateGain() {
    if (!master || !context) return;
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setValueAtTime(volumeGain(), context.currentTime);
  }
  function stopVoice(entry) {
    try { entry.source.stop(); } catch (_) {}
    try { entry.source.disconnect(); } catch (_) {}
  }
  function stopAll() {
    voices.splice(0).forEach(stopVoice);
    stopAmbient();
  }
  function stopAmbient() {
    if (!ambientSource) return;
    try { ambientSource.stop(); } catch (_) {}
    try { ambientSource.disconnect(); } catch (_) {}
    ambientSource = null;
  }
  function bufferFor(name, streak) {
    var step = Math.max(1, Math.min(6, Math.floor(Number(streak) || 1)));
    var key = name + ':' + (name === 'combo' ? step : 0);
    if (buffers.has(key)) return buffers.get(key);
    var rendered = kit.synthesize(name, { streak: step });
    var buffer = context.createBuffer(1, rendered.samples.length, rendered.sampleRate);
    buffer.getChannelData(0).set(rendered.samples);
    buffers.set(key, buffer);
    return buffer;
  }
  function startAmbient() {
    if (!context || context.state !== 'running' || doc.hidden || prefs.muted || !prefs.ambient || !prefs.volume || ambientSource) return;
    ambientSource = context.createBufferSource();
    ambientSource.buffer = bufferFor('ambient');
    ambientSource.loop = true;
    ambientSource.connect(master);
    ambientSource.start();
  }
  function unlock(event) {
    // A trusted click also covers keyboard activation of a real button.
    // No AudioContext, resume or audible work is attempted before that click.
    if (!(event instanceof host.Event) || event.type !== 'click' || !event.isTrusted || doc.hidden || !available) return Promise.resolve(false);
    if (!context) {
      try {
        var AudioContext = host.AudioContext || host.webkitAudioContext;
        context = new AudioContext({ latencyHint: 'interactive' });
        master = context.createGain();
        master.gain.value = volumeGain();
        master.connect(context.destination);
      } catch (_) {
        available = false;
        updateControls();
        return Promise.resolve(false);
      }
    }
    if (context.state === 'running') {
      updateGain();
      startAmbient();
      return Promise.resolve(true);
    }
    if (!resumePending) {
      resumePending = context.resume().then(function () {
        resumePending = null;
        updateGain();
        startAmbient();
        return context.state === 'running';
      }).catch(function () { resumePending = null; return false; });
    }
    return resumePending;
  }
  function play(name, options) {
    options = options || {};
    if (!kit.names.includes(name) || name === 'ambient' || !context || doc.hidden || prefs.muted || !prefs.volume) return false;
    if (context.state !== 'running') {
      // Only a resume already initiated by a trusted click may defer a sound.
      // There is no queue to replay rewards from a hidden/locked tab.
      if (resumePending) resumePending.then(function (ready) { if (ready) play(name, options); });
      return false;
    }
    var now = host.performance.now();
    var spacing = { click: 45, hover: 100, coin: 80, count: 65, combo: 100 }[name] || 120;
    if (now - (lastPlayed.get(name) || -10000) < spacing) return false;
    if ((name === 'click' || name === 'hover' || name === 'count') && voices.length >= 3) return false;
    lastPlayed.set(name, now);
    if (voices.length >= 6) stopVoice(voices.shift());
    var source = context.createBufferSource();
    source.buffer = bufferFor(name, options.streak);
    source.connect(master);
    var entry = { source: source, name: name };
    voices.push(entry);
    source.onended = function () {
      var index = voices.indexOf(entry);
      if (index !== -1) voices.splice(index, 1);
      try { source.disconnect(); } catch (_) {}
    };
    source.start();
    return true;
  }
  function setMuted(value) {
    prefs.muted = !!value;
    updateGain();
    if (prefs.muted) stopAll();
    else startAmbient();
    notify();
    return state();
  }
  function setAmbient(value) {
    prefs.ambient = !!value;
    if (prefs.ambient) startAmbient();
    else stopAmbient();
    notify();
    return state();
  }
  function setVolume(value) {
    if (!Number.isFinite(Number(value))) return state();
    prefs.volume = Math.min(0.65, Math.max(0, Number(value)));
    updateGain();
    if (!prefs.volume) stopAll();
    else startAmbient();
    notify();
    return state();
  }
  function updateControls() {
    if (!controls) return;
    var text = strings();
    var toggle = controls.querySelector('[data-sfx-mute]');
    toggle.textContent = (prefs.muted ? '♬ ' : '♪ ') + (available ? prefs.muted ? text.off : text.on : text.unavailable);
    toggle.setAttribute('aria-pressed', String(prefs.muted));
    toggle.disabled = !available;
    controls.querySelector('summary').textContent = text.mix;
    controls.querySelector('summary').setAttribute('aria-label', text.settings);
    controls.querySelector('[data-sfx-volume-label]').textContent = text.volume;
    controls.querySelector('[data-sfx-volume]').value = String(prefs.volume);
    controls.querySelector('[data-sfx-ambient-label]').textContent = text.ambient;
    controls.querySelector('[data-sfx-ambient]').checked = prefs.ambient;
  }
  function portalControls(records) {
    if (!controls) return;
    (records || []).forEach(function (record) {
      var dialog = record.target;
      if (dialog.tagName !== 'DIALOG') return;
      openDialogs = openDialogs.filter(function (item) { return item !== dialog; });
      if (dialog.open && dialog.isConnected) openDialogs.push(dialog);
    });
    openDialogs = openDialogs.filter(function (dialog) { return dialog.open && dialog.isConnected; });
    openDialogs.forEach(function (dialog) {
      if (watchedDialogs.has(dialog)) return;
      watchedDialogs.add(dialog);
      // Result templates may replace a dialog's children while it remains open.
      // Restore this same control node if that template removed it.
      new MutationObserver(function () {
        if (controls && !controls.isConnected) portalControls();
      }).observe(dialog, { childList: true });
    });
    var destination = openDialogs[openDialogs.length - 1] || (controlsHome && controlsHome.isConnected ? controlsHome : doc.body);
    // Native modal dialogs make the body inert. Move this one instance into
    // the latest open dialog so mute/mix remain usable throughout a reveal.
    // Preferences, focusable elements and their listeners stay on that node.
    if (destination && controls.parentNode !== destination) destination.appendChild(controls);
  }
  function mount(parent) {
    if (controls || !doc.body) return controls;
    var css = doc.createElement('style');
    css.id = 'outlaws-sfx-style';
    css.textContent = '.outlaws-sfx{position:fixed;right:12px;bottom:calc(96px + env(safe-area-inset-bottom,0px));z-index:61;display:flex;gap:4px;align-items:stretch;color:#f3dfb4;font:12px/1.4 ui-monospace,monospace;filter:drop-shadow(0 2px 0 #160d07)}' +
      '.outlaws-sfx[data-landing]{bottom:calc(16px + env(safe-area-inset-bottom,0px))}.outlaws-sfx button,.outlaws-sfx summary{border:2px solid #997039;border-radius:0;background:#271b11;color:inherit;font:inherit;min-height:36px;padding:7px 9px;cursor:pointer;box-shadow:inset 0 1px 0 #51381d}' +
      '.outlaws-sfx button:focus-visible,.outlaws-sfx summary:focus-visible,.outlaws-sfx input:focus-visible{outline:2px solid #f1ca6b;outline-offset:3px}.outlaws-sfx button:hover,.outlaws-sfx summary:hover{border-color:#dfb76b}.outlaws-sfx summary{list-style:none}.outlaws-sfx summary::-webkit-details-marker{display:none}.outlaws-sfx details[open] summary{border-color:#e2b760}.outlaws-sfx-panel{position:absolute;right:0;bottom:calc(100% + 8px);width:210px;padding:12px;background:#271b11;border:2px solid #997039;display:grid;gap:11px;box-shadow:3px 3px 0 #160d07}.outlaws-sfx-panel label{display:grid;gap:7px}.outlaws-sfx-panel label:last-child{display:flex;align-items:center;gap:8px}.outlaws-sfx input{accent-color:#e0b664}.outlaws-sfx input[type=range]{width:100%;margin:0}.outlaws-sfx input[type=checkbox]{min-width:17px;min-height:17px;margin:0}@media(max-width:480px){.outlaws-sfx{right:8px;bottom:calc(92px + env(safe-area-inset-bottom,0px));font-size:11px}.outlaws-sfx button,.outlaws-sfx summary{padding:6px 7px}}';
    doc.head.appendChild(css);
    controls = doc.createElement('div');
    controls.className = 'outlaws-sfx';
    controls.dataset.sfxControl = 'true';
    if (!/\/jogar(?:\/|$)/.test(host.location.pathname)) controls.dataset.landing = 'true';
    var toggle = doc.createElement('button');
    toggle.type = 'button';
    toggle.dataset.sfxMute = '';
    toggle.addEventListener('click', function () { setMuted(!prefs.muted); });
    var details = doc.createElement('details');
    var summary = doc.createElement('summary');
    details.appendChild(summary);
    var panel = doc.createElement('div');
    panel.className = 'outlaws-sfx-panel';
    var volumeLabel = doc.createElement('label');
    var volumeTitle = doc.createElement('span');
    volumeTitle.dataset.sfxVolumeLabel = '';
    var slider = doc.createElement('input');
    slider.type = 'range'; slider.min = '0'; slider.max = '0.65'; slider.step = '0.01'; slider.dataset.sfxVolume = '';
    slider.addEventListener('input', function () { setVolume(slider.value); });
    volumeLabel.append(volumeTitle, slider);
    var ambientLabel = doc.createElement('label');
    var checkbox = doc.createElement('input');
    checkbox.type = 'checkbox'; checkbox.dataset.sfxAmbient = '';
    checkbox.addEventListener('change', function () { setAmbient(checkbox.checked); });
    var ambientTitle = doc.createElement('span');
    ambientTitle.dataset.sfxAmbientLabel = '';
    ambientLabel.append(checkbox, ambientTitle);
    panel.append(volumeLabel, ambientLabel);
    details.appendChild(panel);
    controls.append(toggle, details);
    controlsHome = parent || doc.body;
    if (!parent) controlsHome = doc.getElementById('game-tools') || controlsHome;
    controlsHome.appendChild(controls);
    openDialogs = Array.from(doc.querySelectorAll('dialog[open]'));
    new MutationObserver(portalControls).observe(doc.body, { subtree: true, attributes: true, attributeFilter: ['open'] });
    portalControls();
    updateControls();
    return controls;
  }
  function targetButton(target) {
    return target instanceof host.Element ? target.closest('button,a[href],summary,[role="button"]') : null;
  }
  function init(options) {
    options = options || {};
    if (!initialized) {
      initialized = true;
      doc.addEventListener('click', function (event) {
        if (!event.isTrusted) return;
        // Always unlock on a real click, including empty space and our controls.
        unlock(event);
        var button = targetButton(event.target);
        if (options.delegated === false || !button || button.disabled || button.closest('[data-sfx-control],[data-sfx="off"]') || button.getAttribute('aria-disabled') === 'true') return;
        play('click');
      }, true);
      doc.addEventListener('pointerover', function (event) {
        if (options.delegated === false || !event.isTrusted || event.pointerType === 'touch') return;
        var button = targetButton(event.target);
        if (!button || button.disabled || button.closest('[data-sfx-control],[data-sfx="off"]') || button.contains(event.relatedTarget) || button.getAttribute('aria-disabled') === 'true') return;
        play('hover');
      }, { passive: true });
      doc.addEventListener('visibilitychange', function () {
        if (!doc.hidden) return; // Resume only on the next trusted click.
        updateGain();
        stopAll();
        if (context && context.state === 'running') context.suspend().catch(function () {});
      });
      host.addEventListener('pagehide', function () { stopAll(); });
      if (host.I18N && typeof host.I18N.onChange === 'function') host.I18N.onChange(updateControls);
      new MutationObserver(updateControls).observe(doc.documentElement, { attributes: true, attributeFilter: ['lang'] });
    }
    if (options.mount !== false) mount(options.parent);
    return state();
  }

  host.OutlawsSFX = Object.freeze({ init: init, mount: mount, unlock: unlock, play: play, setMuted: setMuted,
    setAmbient: setAmbient, setVolume: setVolume, getState: state, state: state, names: kit.names,
    // Exposed for the auditable, dependency-free review page and WAV generator.
    recipes: kit.recipes, synthesize: kit.synthesize, sampleRate: kit.sampleRate });
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { init(); }, { once: true });
  else init();
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  var SAMPLE_RATE = 44100;
  var TAU = Math.PI * 2;
  // [start seconds, duration, start Hz, end Hz, amplitude, waveform].
  // All effects last <=800ms. Notes use a western D pentatonic palette.
  var RECIPES = {
    click: { duration: 0.065, notes: [[0, 0.055, 880, 660, 0.19, 'pulse'], [0, 0.022, 1600, 1000, 0.035, 'noise']] },
    hover: { duration: 0.048, notes: [[0, 0.042, 1174.66, 1318.51, 0.072, 'triangle']] },
    coin: { duration: 0.29, notes: [[0, 0.13, 1174.66, 1174.66, 0.19, 'ring'], [0.066, 0.21, 1760, 1760, 0.17, 'ring'], [0, 0.018, 2200, 1800, 0.035, 'noise']] },
    count: { duration: 0.16, notes: [[0, 0.06, 587.33, 587.33, 0.09, 'pulse'], [0.043, 0.06, 659.26, 659.26, 0.095, 'pulse'], [0.086, 0.062, 739.99, 739.99, 0.10, 'pulse']] },
    heist: { duration: 0.48, notes: [[0, 0.11, 293.66, 293.66, 0.16, 'pulse'], [0.095, 0.12, 440, 440, 0.15, 'pulse'], [0.195, 0.12, 523.25, 523.25, 0.13, 'pulse'], [0.29, 0.17, 587.33, 659.26, 0.17, 'triangle'], [0, 0.10, 900, 1500, 0.035, 'noise']] },
    success: { duration: 0.43, notes: [[0, 0.12, 587.33, 587.33, 0.18, 'pulse'], [0.082, 0.12, 739.99, 739.99, 0.18, 'pulse'], [0.164, 0.13, 880, 880, 0.18, 'pulse'], [0.246, 0.17, 1174.66, 1174.66, 0.20, 'triangle']] },
    fail: { duration: 0.37, notes: [[0, 0.14, 392, 349.23, 0.13, 'triangle'], [0.12, 0.23, 349.23, 293.66, 0.14, 'triangle']] },
    rank: { duration: 0.74, notes: [[0, 0.15, 587.33, 587.33, 0.17, 'pulse'], [0.09, 0.15, 659.26, 659.26, 0.17, 'pulse'], [0.18, 0.15, 739.99, 739.99, 0.18, 'pulse'], [0.27, 0.15, 880, 880, 0.18, 'pulse'], [0.36, 0.15, 987.77, 987.77, 0.17, 'pulse'], [0.45, 0.27, 1174.66, 1174.66, 0.20, 'ring']] },
    unlock: { duration: 0.48, notes: [[0, 0.14, 440, 440, 0.14, 'triangle'], [0.1, 0.15, 587.33, 587.33, 0.16, 'pulse'], [0.20, 0.25, 880, 880, 0.18, 'ring']] },
    combo: { duration: 0.23, notes: [[0, 0.08, 587.33, 587.33, 0.12, 'pulse'], [0.055, 0.16, 880, 880, 0.17, 'triangle']] },
    milestone: { duration: 0.8, notes: [[0, 0.12, 440, 440, 0.16, 'pulse'], [0.08, 0.12, 587.33, 587.33, 0.17, 'pulse'], [0.16, 0.12, 739.99, 739.99, 0.17, 'pulse'], [0.24, 0.12, 880, 880, 0.18, 'pulse'], [0.35, 0.4, 587.33, 587.33, 0.07, 'triangle'], [0.35, 0.4, 739.99, 739.99, 0.065, 'triangle'], [0.35, 0.42, 1174.66, 1174.66, 0.18, 'ring']] },
    ambient: { duration: 8, notes: [], loop: true }
  };
  Object.keys(RECIPES).forEach(function (name) {
    RECIPES[name].notes.forEach(Object.freeze);
    Object.freeze(RECIPES[name].notes);
    Object.freeze(RECIPES[name]);
  });
  Object.freeze(RECIPES);

  function seedFor(name) {
    var seed = 2166136261;
    for (var i = 0; i < name.length; i++) seed = Math.imul(seed ^ name.charCodeAt(i), 16777619);
    return seed >>> 0;
  }
  function randomFactory(seed) {
    return function () { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2147483648 - 1; };
  }
  function envelope(time, length, waveform) {
    var attack = waveform === 'noise' ? 0.003 : 0.004;
    var decay = waveform === 'ring' ? 5.8 : 3.6;
    return Math.min(1, time / attack) * Math.exp(-decay * time / length) * Math.min(1, (length - time) / 0.012);
  }
  function synthesize(name, options) {
    if (!Object.prototype.hasOwnProperty.call(RECIPES, name)) throw new RangeError('Unknown sound: ' + name);
    options = options || {};
    var recipe = RECIPES[name];
    // Ambient has no content above 3.3kHz; 11.025kHz keeps generation cheap.
    var renderRate = name === 'ambient' ? 11025 : SAMPLE_RATE;
    var samples = new Float32Array(Math.round(recipe.duration * renderRate));
    var random = randomFactory(seedFor(name));
    if (name === 'ambient') {
      // Seamless 8-second periodic wind, all partials above 160Hz; soft cricket
      // chirps fade to zero away from the loop seam. No sub-bass or start crack.
      var harmonicCount = 22;
      var sine = new Float64Array(harmonicCount);
      var cosine = new Float64Array(harmonicCount);
      var sinStep = new Float64Array(harmonicCount);
      var cosStep = new Float64Array(harmonicCount);
      var amplitude = new Float64Array(harmonicCount);
      for (var partial = 0; partial < harmonicCount; partial++) {
        var phase = random() * Math.PI;
        var increment = TAU * (1312 + partial * 173) / samples.length;
        sine[partial] = Math.sin(phase); cosine[partial] = Math.cos(phase);
        sinStep[partial] = Math.sin(increment); cosStep[partial] = Math.cos(increment);
        amplitude[partial] = 1 / (1 + partial * 0.18);
      }
      for (var a = 0; a < samples.length; a++) {
        var time = a / renderRate;
        var wind = 0;
        // Harmonic recurrence avoids millions of Math.sin calls on a click.
        for (var h = 0; h < harmonicCount; h++) {
          wind += sine[h] * amplitude[h];
          var nextSin = sine[h] * cosStep[h] + cosine[h] * sinStep[h];
          cosine[h] = cosine[h] * cosStep[h] - sine[h] * sinStep[h];
          sine[h] = nextSin;
        }
        var gust = 0.65 + 0.22 * Math.sin(TAU * time / 8) + 0.13 * Math.sin(TAU * time / 4);
        var chirpTime = time % 2;
        var cricket = chirpTime > 0.45 && chirpTime < 0.82 ? Math.pow(Math.sin(Math.PI * (chirpTime - 0.45) / 0.37), 2) * Math.pow(Math.max(0, Math.sin(TAU * 30 * chirpTime)), 3) * Math.sin(TAU * 3300 * time) : 0;
        samples[a] = wind * gust * 0.0045 + cricket * 0.019;
      }
    } else {
      var step = name === 'combo' ? [0, 2, 4, 7, 9, 12][Math.max(0, Math.min(5, Math.floor(Number(options.streak) || 1) - 1))] : 0;
      var pitch = Math.pow(2, step / 12);
      recipe.notes.forEach(function (note) {
        var offset = Math.round(note[0] * SAMPLE_RATE);
        var count = Math.round(note[1] * SAMPLE_RATE);
        var phase = 0;
        var smoothed = 0;
        var noiseLow = 0;
        for (var n = 0; n < count && offset + n < samples.length; n++) {
          var t = n / SAMPLE_RATE;
          var frequency = (note[2] + (note[3] - note[2]) * t / note[1]) * pitch;
          phase += frequency / SAMPLE_RATE;
          var wave;
          if (note[5] === 'noise') {
            var white = random();
            noiseLow += 0.14 * (white - noiseLow);
            wave = white - noiseLow;
          } else if (note[5] === 'ring') wave = 0.72 * Math.sin(TAU * phase) + 0.21 * Math.sin(TAU * phase * 2) + 0.07 * Math.sin(TAU * phase * 3);
          else if (note[5] === 'triangle') wave = 1 - 4 * Math.abs(Math.round(phase) - phase);
          else wave = (phase % 1) < 0.25 ? 0.8 : -0.2666667;
          // Round the chip edges to avoid a sharp, fatiguing top end.
          smoothed += 0.46 * (wave - smoothed);
          samples[offset + n] += smoothed * note[4] * envelope(t, note[1], note[5]);
        }
      });
      var low = 0;
      var peak = 0;
      var filter = 1 - Math.exp(-TAU * 140 / SAMPLE_RATE);
      for (var i = 0; i < samples.length; i++) {
        low += filter * (samples[i] - low);
        samples[i] = (samples[i] - low) * Math.min(1, (samples.length - i - 1) / (SAMPLE_RATE * 0.008));
        peak = Math.max(peak, Math.abs(samples[i]));
      }
      if (peak > 0.48) for (var p = 0; p < samples.length; p++) samples[p] *= 0.48 / peak;
    }
    var measuredPeak = 0;
    for (var k = 0; k < samples.length; k++) measuredPeak = Math.max(measuredPeak, Math.abs(samples[k]));
    return { samples: samples, sampleRate: renderRate, duration: recipe.duration, peak: measuredPeak };
  }
  return Object.freeze({ names: Object.freeze(Object.keys(RECIPES)), recipes: RECIPES, synthesize: synthesize, sampleRate: SAMPLE_RATE });
});

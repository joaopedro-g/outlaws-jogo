(function () {
  'use strict';
  const base = window.OutlawsSFX, arsenal = window.OutlawsArsenalSFX;
  let wav = null;
  const dictionary = {
    en: {
      title: 'Arsenal sound desk', intro: 'Short, original cues for the western arsenal and optional Chaos scenes. Listen to live synthesis and the matching WAV.', quiet: 'LOW VOLUME · ORIGINAL SYNTHESIS · CLICK TO LISTEN',
      on: 'Sound on', muted: 'Muted', volume: 'Volume', effects: 'Special effects', synth: 'Synthesize', wav: 'Play WAV', file: 'WAV file', chaos: 'CHAOS',
      footer: 'Mute and volume use the same preferences as the game. Special effects can be switched off. No sound before your first real click. No downloaded audio.', generate: 'Generate or verify WAVs:',
      blocked: 'Turn sound and special effects on, then click to listen.', playing: 'Playing', live: 'live synthesis', failed: 'This WAV could not be played.',
      ak: ['AK burst', 'Three dry chip snaps, with a tiny metallic tail.'], awp: ['AWP', 'A short zoom whistle, a crack and a clear falling ring.'], grenade: ['Grenade', 'Three fuse ticks and a compact, airy puff. No sub-bass.'], taser: ['Taser', 'A brief electric buzz with two high chip sparks.'],
      laser: ['Laser', 'A bright descending beam with a small digital echo.'], rift: ['Rift', 'A rising western chime opens into a soft shimmer.'], abduction: ['Abduction', 'An upward tractor-beam sweep with a clean final note.'], jetpack: ['Jetpack', 'A short, sputtering rise with a light exhaust hiss.']
    },
    pt: {
      title: 'Mesa de sons do arsenal', intro: 'Efeitos curtos e originais para as armas do faroeste e as cenas opcionais de Chaos. Ouça a síntese ao vivo e o WAV correspondente.', quiet: 'VOLUME BAIXO · SÍNTESE ORIGINAL · CLIQUE PARA OUVIR',
      on: 'Som ligado', muted: 'Mudo', volume: 'Volume', effects: 'Efeitos especiais', synth: 'Sintetizar', wav: 'Ouvir WAV', file: 'Arquivo WAV', chaos: 'CHAOS',
      footer: 'Mudo e volume usam as mesmas preferências do jogo. Os efeitos especiais podem ser desligados. Nada toca antes do primeiro clique real. Sem áudio baixado.', generate: 'Gerar ou verificar os WAVs:',
      blocked: 'Ligue o som e os efeitos especiais, depois clique para ouvir.', playing: 'Tocando', live: 'síntese ao vivo', failed: 'Não foi possível ouvir este WAV.',
      ak: ['Rajada de AK', 'Três estalos secos de chip, com uma cauda metálica curta.'], awp: ['AWP', 'Um assobio de zoom, um estalo e um toque que desce.'], grenade: ['Granada', 'Três toques do pavio e uma explosão pequena e leve. Sem subgrave.'], taser: ['Taser', 'Um zumbido elétrico curto com duas faíscas agudas.'],
      laser: ['Laser', 'Um raio agudo que desce com um pequeno eco digital.'], rift: ['Fenda', 'Um sino de faroeste subindo abre um brilho suave.'], abduction: ['Abdução', 'Um raio de tração que sobe e termina numa nota limpa.'], jetpack: ['Jetpack', 'Uma subida curta, picotada, com um sopro de exaustão leve.']
    },
    es: {
      title: 'Mesa de sonidos del arsenal', intro: 'Efectos cortos y originales para las armas del oeste y las escenas opcionales de Chaos. Escucha la síntesis en vivo y su WAV.', quiet: 'VOLUMEN BAJO · SÍNTESIS ORIGINAL · HAZ CLIC PARA ESCUCHAR',
      on: 'Sonido activo', muted: 'Silencio', volume: 'Volumen', effects: 'Efectos especiales', synth: 'Sintetizar', wav: 'Escuchar WAV', file: 'Archivo WAV', chaos: 'CHAOS',
      footer: 'Silencio y volumen usan las mismas preferencias del juego. Los efectos especiales se pueden desactivar. Nada suena antes del primer clic real. Sin audio descargado.', generate: 'Generar o verificar los WAV:',
      blocked: 'Activa el sonido y los efectos especiales; después haz clic para escuchar.', playing: 'Sonando', live: 'síntesis en vivo', failed: 'No se pudo reproducir este WAV.',
      ak: ['Ráfaga AK', 'Tres chasquidos secos con una pequeña cola metálica.'], awp: ['AWP', 'Un breve silbido de zoom, un chasquido y un tono descendente.'], grenade: ['Granada', 'Tres toques de mecha y una explosión ligera. Sin subgraves.'], taser: ['Taser', 'Un zumbido eléctrico corto con dos chispas agudas.'],
      laser: ['Láser', 'Un rayo agudo descendente con un pequeño eco digital.'], rift: ['Grieta', 'Una campana ascendente del oeste abre un brillo suave.'], abduction: ['Abducción', 'Un rayo tractor ascendente que termina en una nota clara.'], jetpack: ['Jetpack', 'Una subida breve y entrecortada con un soplo ligero.']
    },
    ph: {
      title: 'Mga tunog ng arsenal', intro: 'Maiikli at orihinal na tunog para sa western arsenal at mga opsyonal na eksena ng Chaos. Pakinggan ang live synthesis at ang katumbas na WAV.', quiet: 'MAHINANG VOLUME · ORIHINAL NA SYNTHESIS · I-CLICK PARA MAKINIG',
      on: 'May tunog', muted: 'Naka-mute', volume: 'Volume', effects: 'Mga espesyal na epekto', synth: 'I-synthesize', wav: 'Pakinggan WAV', file: 'WAV file', chaos: 'CHAOS',
      footer: 'Pareho sa laro ang mute at volume preferences. Puwedeng patayin ang special effects. Walang tunog bago ang unang tunay na click. Walang audio na na-download.', generate: 'Gumawa o suriin ang WAV:',
      blocked: 'Buksan ang tunog at special effects, saka i-click para makinig.', playing: 'Tumutunog', live: 'live synthesis', failed: 'Hindi mapatugtog ang WAV na ito.',
      ak: ['AK burst', 'Tatlong tuyong chip snap na may maikling metal na dulo.'], awp: ['AWP', 'Maikling zoom whistle, isang snap at pababang malinaw na tono.'], grenade: ['Granada', 'Tatlong fuse tick at maliit na pagsabog na magaan. Walang sub-bass.'], taser: ['Taser', 'Maikling electric buzz na may dalawang matinis na spark.'],
      laser: ['Laser', 'Matinis na pababang beam na may maliit na digital echo.'], rift: ['Rift', 'Pataas na western chime na nagbubukas sa banayad na shimmer.'], abduction: ['Abduction', 'Pataas na tractor beam na nagtatapos sa malinaw na nota.'], jetpack: ['Jetpack', 'Maikling putol-putol na pag-angat na may mahinang exhaust hiss.']
    }
  };
  const navigation = {
    en: { back: 'Back to OUTLAWS', demo: 'Try the demo', nav: 'Preview navigation', language: 'Language', grid: 'Arsenal sound previews' },
    pt: { back: 'Voltar ao OUTLAWS', demo: 'Experimentar a demo', nav: 'Navegação da prévia', language: 'Idioma', grid: 'Prévias de som do arsenal' },
    es: { back: 'Volver a OUTLAWS', demo: 'Probar la demo', nav: 'Navegación de la vista previa', language: 'Idioma', grid: 'Vistas previas de sonido del arsenal' },
    ph: { back: 'Bumalik sa OUTLAWS', demo: 'Subukan ang demo', nav: 'Nabigasyon ng preview', language: 'Wika', grid: 'Mga preview ng tunog ng arsenal' }
  };
  function normalized(value) { const code = String(value || 'en').toLowerCase(); return /^(fil|ph|tl)(-|$)/.test(code) ? 'ph' : dictionary[code.slice(0, 2)] ? code.slice(0, 2) : 'en'; }
  let language = normalized(new URLSearchParams(location.search).get('lang') || window.I18N?.lang?.() || document.documentElement.lang);
  const words = () => dictionary[language];
  function effectsEnabled() { try { return localStorage.getItem('outlaws:juice:effects') !== 'off'; } catch (_) { return true; } }
  function stopWav() { if (wav) { wav.pause(); wav.currentTime = 0; wav = null; } }
  function status(value) { document.getElementById('arsenal-status').textContent = value; }
  function sync() {
    const state = base.getState(), button = document.getElementById('arsenal-mute');
    button.textContent = state.muted ? words().muted : words().on; button.setAttribute('aria-pressed', String(state.muted));
    document.getElementById('arsenal-volume').value = String(state.volume);
    document.getElementById('arsenal-effects').checked = effectsEnabled();
    if (wav) { wav.volume = state.volume; if (state.muted || !state.volume || !effectsEnabled()) stopWav(); }
  }
  function render() {
    document.documentElement.lang = language === 'ph' ? 'fil' : language;
    document.title = 'OUTLAWS · ' + words().title;
    document.getElementById('arsenal-language').value = language;
    document.querySelectorAll('[data-text]').forEach(element => { element.textContent = words()[element.dataset.text]; });
    document.querySelectorAll('[data-nav]').forEach(element => { element.textContent = navigation[language][element.dataset.nav]; });
    document.querySelector('.desk-nav').setAttribute('aria-label', navigation[language].nav);
    document.getElementById('arsenal-language').setAttribute('aria-label', navigation[language].language);
    document.getElementById('arsenal-grid').setAttribute('aria-label', navigation[language].grid);
    const grid = document.getElementById('arsenal-grid'); grid.replaceChildren();
    arsenal.names.forEach(name => {
      const card = document.createElement('article'); card.className = 'card'; card.dataset.sound = name;
      if (['laser', 'rift', 'abduction', 'jetpack'].includes(name)) card.dataset.chaos = '';
      const heading = document.createElement('h2'); heading.textContent = words()[name][0];
      const description = document.createElement('p'); description.textContent = words()[name][1];
      const duration = document.createElement('small'); duration.textContent = Math.round(arsenal.recipes[name].duration * 1000) + ' ms' + (card.hasAttribute('data-chaos') ? ' · ' + words().chaos : '');
      const actions = document.createElement('div'); actions.className = 'actions';
      for (const type of ['synth', 'wav']) { const button = document.createElement('button'); button.type = 'button'; button.dataset.preview = type; button.textContent = words()[type]; button.setAttribute('aria-label', words()[type] + ': ' + heading.textContent); actions.appendChild(button); }
      const file = document.createElement('a'); file.href = name + '.wav'; file.download = name + '.wav'; file.textContent = words().file; actions.appendChild(file);
      card.append(heading, description, duration, actions); grid.appendChild(card);
    });
    sync(); status('');
  }
  document.getElementById('arsenal-mute').addEventListener('click', () => base.setMuted(!base.getState().muted));
  document.getElementById('arsenal-volume').addEventListener('input', event => base.setVolume(event.target.value));
  document.getElementById('arsenal-effects').addEventListener('change', event => {
    try { localStorage.setItem('outlaws:juice:effects', event.target.checked ? 'on' : 'off'); } catch (_) {}
    if (!event.target.checked) { arsenal.stop(); stopWav(); }
    sync();
  });
  document.getElementById('arsenal-language').addEventListener('change', event => {
    language = normalized(event.target.value);
    if (window.I18N?.set) window.I18N.set(language === 'ph' ? 'fil' : language);
    else render();
  });
  window.I18N?.onChange?.(() => { language = normalized(window.I18N.lang()); render(); });
  document.getElementById('arsenal-grid').addEventListener('click', async event => {
    const button = event.target.closest('[data-preview]');
    if (!button || !event.isTrusted) return;
    const ready = await arsenal.unlock(event), state = arsenal.getState();
    if (!ready || state.muted || !state.volume || !state.effects) { status(words().blocked); return; }
    // The desk compares one cue at a time, including a previously opted-in
    // base ambience. Use the base's public control; never alter its graph.
    if (base.getState().ambient) base.setAmbient(false);
    arsenal.stop(); stopWav();
    const name = button.closest('[data-sound]').dataset.sound;
    if (button.dataset.preview === 'synth') {
      arsenal.play(name); status(words().playing + ': ' + words()[name][0] + ' · ' + words().live);
    } else {
      wav = new Audio(name + '.wav'); wav.volume = base.getState().volume;
      try { await wav.play(); status(words().playing + ': ' + words()[name][0] + ' · WAV'); }
      catch (_) { status(words().failed); }
    }
  });
  window.addEventListener('outlaws:sfx-state', sync);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopWav(); });
  window.addEventListener('pagehide', stopWav);
  render();
})();

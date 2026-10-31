(function () {
  'use strict';
  const base = window.OutlawsSFX, sound = window.OutlawsEquippedSFX;
  let wav = null;
  const dictionary = {
    en: { title: 'Equipped sounds', intro: 'Firm pixel-action hits with quiet peaks. Compare live synthesis with the same PCM rendered as WAV.', quiet: 'LOW VOLUME · ORIGINAL SYNTHESIS · CLICK TO LISTEN', on: 'Sound on', muted: 'Muted', volume: 'Volume', effects: 'Special effects', synth: 'Synthesize', wav: 'Play WAV', file: 'WAV file', footer: "Uses the game's mute, volume and effects preferences. No sound before a real click. No downloaded media.", blocked: 'Turn sound and effects on, then click to listen.', playing: 'Playing', live: 'live synthesis', failed: 'This WAV could not be played.', equip: ['Equip', 'A metal latch clicks into place with a short bright clink.'], ak: ['AK burst', 'Three firm, dry chip hits with a small metallic finish.'], awp: ['AWP', 'Quick aim, a sharp crack and a compact ringing tail.'], grenade: ['Grenade', 'A throw, a snap and a dense airy impact. No bass boom.'], taser: ['Taser', 'A clipped electrical buzz with bright sparks.'], poof: ['Poof', 'A short dust puff for an actor disappearing.'], escape: ['Escape', 'A quick western climb as the actor gets away.'] },
    pt: { title: 'Sons das armas equipadas', intro: 'Impactos firmes de ação pixel com picos baixos. Compare a síntese ao vivo com o mesmo áudio em WAV.', quiet: 'VOLUME BAIXO · SÍNTESE ORIGINAL · CLIQUE PARA OUVIR', on: 'Som ligado', muted: 'Mudo', volume: 'Volume', effects: 'Efeitos especiais', synth: 'Sintetizar', wav: 'Ouvir WAV', file: 'Arquivo WAV', footer: 'Usa as preferências de mudo, volume e efeitos do jogo. Nada toca antes de um clique real. Sem áudio baixado.', blocked: 'Ligue o som e os efeitos, depois clique para ouvir.', playing: 'Tocando', live: 'síntese ao vivo', failed: 'Não foi possível ouvir este WAV.', equip: ['Equipar', 'Um trinco metálico encaixa com um toque curto e claro.'], ak: ['Rajada de AK', 'Três impactos secos e firmes de chip, com final metálico.'], awp: ['AWP', 'Mira rápida, um estalo preciso e uma cauda curta.'], grenade: ['Granada', 'Arremesso, estalo e impacto de ar encorpado. Sem grave estourado.'], taser: ['Taser', 'Um zumbido elétrico picotado com faíscas agudas.'], poof: ['Poof', 'Uma pequena nuvem de poeira quando o ator some.'], escape: ['Fuga', 'Uma subida rápida de faroeste quando o ator escapa.'] },
    es: { title: 'Sonidos de armas equipadas', intro: 'Impactos firmes de acción pixel con picos bajos. Compara la síntesis en vivo con el mismo audio en WAV.', quiet: 'VOLUMEN BAJO · SÍNTESIS ORIGINAL · HAZ CLIC PARA ESCUCHAR', on: 'Sonido activo', muted: 'Silencio', volume: 'Volumen', effects: 'Efectos especiales', synth: 'Sintetizar', wav: 'Escuchar WAV', file: 'Archivo WAV', footer: 'Usa las preferencias de silencio, volumen y efectos del juego. Nada suena antes de un clic real. Sin audio descargado.', blocked: 'Activa sonido y efectos; después haz clic para escuchar.', playing: 'Sonando', live: 'síntesis en vivo', failed: 'No se pudo reproducir este WAV.', equip: ['Equipar', 'Un pestillo metálico encaja con un toque corto y claro.'], ak: ['Ráfaga AK', 'Tres impactos secos de chip con un final metálico.'], awp: ['AWP', 'Apunta rápido, un chasquido y una cola corta.'], grenade: ['Granada', 'Un lanzamiento, un chasquido y un impacto denso de aire. Sin graves fuertes.'], taser: ['Taser', 'Un zumbido eléctrico entrecortado con chispas agudas.'], poof: ['Poof', 'Una pequeña nube de polvo cuando desaparece el actor.'], escape: ['Escape', 'Una subida rápida del oeste cuando el actor escapa.'] },
    fil: { title: 'Tunog ng mga gamit na armas', intro: 'Matitibay na pixel-action hit na mahina ang peak. Ihambing ang live synthesis sa kaparehong audio sa WAV.', quiet: 'MAHINANG VOLUME · ORIHINAL NA SYNTHESIS · I-CLICK PARA MAKINIG', on: 'May tunog', muted: 'Naka-mute', volume: 'Volume', effects: 'Mga espesyal na epekto', synth: 'I-synthesize', wav: 'Pakinggan WAV', file: 'WAV file', footer: 'Gamit ang mute, volume at effects preferences ng laro. Walang tunog bago ang tunay na click. Walang na-download na audio.', blocked: 'Buksan ang tunog at effects, saka i-click para makinig.', playing: 'Tumutunog', live: 'live synthesis', failed: 'Hindi mapatugtog ang WAV na ito.', equip: ['Equip', 'Isang metal latch na kumakabit na may maikling malinaw na tunog.'], ak: ['AK burst', 'Tatlong matitibay na chip hit na may maikling metal na dulo.'], awp: ['AWP', 'Mabilis na aim, matalim na snap at maikling ringing tail.'], grenade: ['Granada', 'Isang hagis, snap at makapal na air impact. Walang bass boom.'], taser: ['Taser', 'Putol-putol na electric buzz na may matining na sparks.'], poof: ['Poof', 'Maikling ulap ng alikabok kapag nawawala ang actor.'], escape: ['Pagtakas', 'Mabilis na western climb habang tumatakas ang actor.'] }
  };
  const navigation = {
    en: { back: 'Back to OUTLAWS', demo: 'Try the demo', nav: 'Preview navigation', language: 'Language', grid: 'Equipped sound previews' },
    pt: { back: 'Voltar ao OUTLAWS', demo: 'Experimentar a demo', nav: 'Navegação da prévia', language: 'Idioma', grid: 'Prévias de som das armas equipadas' },
    es: { back: 'Volver a OUTLAWS', demo: 'Probar la demo', nav: 'Navegación de la vista previa', language: 'Idioma', grid: 'Vistas previas de sonido de armas equipadas' },
    fil: { back: 'Bumalik sa OUTLAWS', demo: 'Subukan ang demo', nav: 'Nabigasyon ng preview', language: 'Wika', grid: 'Mga preview ng tunog ng gamit na armas' }
  };
  function normalize(value) { const code = String(value || 'en').toLowerCase(); if (/^(fil|ph|tl)(-|$)/.test(code)) return 'fil'; return dictionary[code.slice(0, 2)] ? code.slice(0, 2) : 'en'; }
  let language = normalize(window.I18N?.lang?.() || document.documentElement.lang);
  const words = () => dictionary[language];
  function effectsEnabled() { try { return localStorage.getItem('outlaws:juice:effects') !== 'off'; } catch (_) { return true; } }
  function stopWav() { if (wav) { wav.pause(); wav.currentTime = 0; wav = null; } }
  const status = value => { document.getElementById('equipped-status').textContent = value; };
  function sync() {
    const state = base.getState(), button = document.getElementById('equipped-mute');
    button.textContent = state.muted ? words().muted : words().on; button.setAttribute('aria-pressed', String(state.muted));
    document.getElementById('equipped-volume').value = String(state.volume);
    document.getElementById('equipped-effects').checked = effectsEnabled();
    if (wav) { wav.volume = state.volume; if (state.muted || !state.volume || !effectsEnabled()) stopWav(); }
  }
  function render() {
    document.documentElement.lang = language; document.title = 'OUTLAWS · ' + words().title;
    document.getElementById('equipped-language').value = language;
    document.querySelectorAll('[data-word]').forEach(node => { node.textContent = words()[node.dataset.word]; });
    document.querySelectorAll('[data-nav]').forEach(node => { node.textContent = navigation[language][node.dataset.nav]; });
    document.querySelector('.desk-nav').setAttribute('aria-label', navigation[language].nav);
    document.getElementById('equipped-language').setAttribute('aria-label', navigation[language].language);
    document.getElementById('equipped-grid').setAttribute('aria-label', navigation[language].grid);
    const grid = document.getElementById('equipped-grid'); grid.replaceChildren();
    for (const name of sound.names) {
      const card = document.createElement('article'); card.className = 'card'; card.dataset.sound = name;
      const title = document.createElement('h2'); title.textContent = words()[name][0];
      const description = document.createElement('p'); description.textContent = words()[name][1];
      const duration = document.createElement('small'); duration.textContent = Math.round(sound.recipes[name].duration * 1000) + ' ms';
      const actions = document.createElement('div'); actions.className = 'actions';
      for (const mode of ['synth', 'wav']) { const button = document.createElement('button'); button.type = 'button'; button.dataset.preview = mode; button.textContent = words()[mode]; button.setAttribute('aria-label', words()[mode] + ': ' + title.textContent); actions.appendChild(button); }
      const link = document.createElement('a'); link.href = name + '.wav'; link.download = name + '.wav'; link.textContent = words().file; actions.appendChild(link);
      card.append(title, description, duration, actions); grid.appendChild(card);
    }
    sync(); status('');
  }
  document.getElementById('equipped-mute').addEventListener('click', () => base.setMuted(!base.getState().muted));
  document.getElementById('equipped-volume').addEventListener('input', event => base.setVolume(event.target.value));
  document.getElementById('equipped-effects').addEventListener('change', event => {
    try { localStorage.setItem('outlaws:juice:effects', event.target.checked ? 'on' : 'off'); } catch (_) {}
    if (!event.target.checked) { sound.stop(); stopWav(); } sync();
  });
  document.getElementById('equipped-language').addEventListener('change', event => {
    language = normalize(event.target.value); if (window.I18N?.set) window.I18N.set(language); else render();
  });
  window.I18N?.onChange?.(() => { language = normalize(window.I18N.lang()); render(); });
  document.getElementById('equipped-grid').addEventListener('click', async event => {
    const button = event.target.closest('[data-preview]'); if (!button || !event.isTrusted) return;
    const ready = await sound.unlock(event), state = sound.getState();
    if (!ready || state.muted || !state.volume || !state.effects) { status(words().blocked); return; }
    if (base.getState().ambient) base.setAmbient(false);
    sound.stop(); stopWav(); const name = button.closest('[data-sound]').dataset.sound;
    if (button.dataset.preview === 'synth') { sound.play(name); status(words().playing + ': ' + words()[name][0] + ' · ' + words().live); }
    else { wav = new Audio(name + '.wav'); wav.volume = state.volume; try { await wav.play(); status(words().playing + ': ' + words()[name][0] + ' · WAV'); } catch (_) { status(words().failed); } }
  });
  window.addEventListener('outlaws:sfx-state', sync);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopWav(); });
  window.addEventListener('pagehide', stopWav); render();
})();

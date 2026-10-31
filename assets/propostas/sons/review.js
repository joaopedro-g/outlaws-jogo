(function () {
  'use strict';
  var sfx = window.OutlawsSFX;
  var currentWav = null;
  var language = 'en';
  var copy = {
    en: {
      title: 'Sound desk', intro: 'A small western pocket orchestra. Hear each cue as live synthesis or its matching WAV.',
      quiet: 'LOW VOLUME · OPTIONAL AMBIENCE · CLICK TO LISTEN', synth: 'Synthesize', wav: 'Play WAV', file: 'WAV file', loop: 'Start loop', stop: 'Stop loop', streak: 'Combo step',
      footer: 'Original sounds, made here. No downloaded audio. The sound button remembers mute and volume. Nothing plays until you click.', recipe: 'Generate or verify the WAV files:',
      playing: 'Playing', synthesized: 'live synthesis', recording: 'WAV', muted: 'Unmute with the sound button to listen.', blocked: 'Use a real click to start sound.', failed: 'This WAV could not be played.',
      click: ['Button click', 'A dry, tiny chip tick. Immediate and light.'], hover: ['Hover', 'A barely audible hint for the next action.'], coin: ['Coin', 'Two bright metal notes as loot reaches the counter.'],
      count: ['Counter', 'Three quick rising ticks. Short enough to stay out of the way.'], heist: ['Heist begins', 'A low-key western call before the band heads out.'], success: ['Success', 'A four-note climb for a confirmed good result.'],
      fail: ['Failure', 'A gentle downward phrase, without a harsh alarm.'], rank: ['Rank up', 'A pentatonic flourish and a small bell at the top.'], unlock: ['Unlock', 'A latch opening into two warm notes.'],
      combo: ['Combo', 'Six pitch steps. Each streak lifts the same little phrase.'], milestone: ['Milestone', 'A small fanfare for a real, important achievement.'], ambient: ['Wind & crickets', 'An optional quiet, seamless eight-second desert loop.']
    },
    pt: {
      title: 'Mesa de sons', intro: 'Uma pequena orquestra de bolso do faroeste. Ouça cada efeito sintetizado ou seu WAV correspondente.',
      quiet: 'VOLUME BAIXO · AMBIENTE OPCIONAL · CLIQUE PARA OUVIR', synth: 'Sintetizar', wav: 'Ouvir WAV', file: 'Arquivo WAV', loop: 'Ligar ambiente', stop: 'Parar ambiente', streak: 'Etapa do combo',
      footer: 'Sons originais, feitos aqui. Sem áudio baixado. O botão de som lembra mudo e volume. Nada toca antes de um clique.', recipe: 'Gerar ou verificar os WAVs:',
      playing: 'Tocando', synthesized: 'síntese ao vivo', recording: 'WAV', muted: 'Tire do mudo no botão de som para ouvir.', blocked: 'Clique de verdade para iniciar o som.', failed: 'Não foi possível ouvir este WAV.',
      click: ['Clique de botão', 'Um toque seco e pequeno. Imediato e leve.'], hover: ['Ao passar o mouse', 'Uma pista bem sutil para a próxima ação.'], coin: ['Moeda', 'Duas notas metálicas quando o saque chega ao contador.'],
      count: ['Contagem', 'Três toques rápidos que sobem, sem ocupar espaço.'], heist: ['Assalto começa', 'Uma chamada discreta de faroeste antes de o bando sair.'], success: ['Sucesso', 'Quatro notas subindo para um bom resultado confirmado.'],
      fail: ['Falha', 'Uma frase suave descendo, sem alarme agressivo.'], rank: ['Subir de rank', 'Uma sequência pentatônica com um sininho no fim.'], unlock: ['Desbloqueio', 'Um trinco abrindo para duas notas quentes.'],
      combo: ['Combo', 'Seis alturas. Cada sequência sobe a mesma frase curta.'], milestone: ['Marco importante', 'Uma pequena fanfarra para uma conquista real.'], ambient: ['Vento e grilos', 'Um ambiente opcional, baixo, de oito segundos sem emenda.']
    },
    es: {
      title: 'Mesa de sonidos', intro: 'Una pequeña orquesta del oeste. Escucha cada efecto sintetizado o su WAV correspondiente.',
      quiet: 'VOLUMEN BAJO · AMBIENTE OPCIONAL · HAZ CLIC PARA ESCUCHAR', synth: 'Sintetizar', wav: 'Escuchar WAV', file: 'Archivo WAV', loop: 'Iniciar ambiente', stop: 'Parar ambiente', streak: 'Paso del combo',
      footer: 'Sonidos originales, hechos aquí. Sin audio descargado. El botón de sonido recuerda silencio y volumen. Nada suena antes de un clic.', recipe: 'Generar o verificar los WAV:',
      playing: 'Sonando', synthesized: 'síntesis en vivo', recording: 'WAV', muted: 'Activa el sonido con el botón para escuchar.', blocked: 'Haz un clic real para iniciar el sonido.', failed: 'No se pudo reproducir este WAV.',
      click: ['Clic de botón', 'Un toque seco y pequeño. Inmediato y ligero.'], hover: ['Al pasar el cursor', 'Una pista muy sutil para la próxima acción.'], coin: ['Moneda', 'Dos notas metálicas cuando el botín llega al contador.'],
      count: ['Contador', 'Tres toques rápidos ascendentes, sin ocupar espacio.'], heist: ['Comienza el atraco', 'Una llamada discreta del oeste antes de salir.'], success: ['Éxito', 'Cuatro notas ascendentes para un buen resultado confirmado.'],
      fail: ['Fallo', 'Una frase suave descendente, sin alarma agresiva.'], rank: ['Subir de rango', 'Una secuencia pentatónica y una pequeña campana al final.'], unlock: ['Desbloqueo', 'Un pestillo que se abre con dos notas cálidas.'],
      combo: ['Combo', 'Seis alturas. Cada racha eleva la misma frase corta.'], milestone: ['Hito importante', 'Una pequeña fanfarria para un logro real.'], ambient: ['Viento y grillos', 'Un ambiente opcional y suave de ocho segundos sin corte.']
    },
    fil: {
      title: 'Mesa ng tunog', intro: 'Isang maliit na orkestra ng kanluran. Pakinggan ang bawat live na tunog at ang katumbas nitong WAV.',
      quiet: 'MAHINANG VOLUME · OPSYONAL NA AMBIENTE · I-CLICK PARA MAKINIG', synth: 'I-synthesize', wav: 'Pakinggan WAV', file: 'WAV na file', loop: 'Buksan ang ambiente', stop: 'Patayin ang ambiente', streak: 'Hakbang ng combo',
      footer: 'Mga orihinal na tunog na ginawa rito. Walang na-download na audio. Naaalala ng sound button ang mute at volume. Walang tutunog bago ang isang click.', recipe: 'Gumawa o suriin ang mga WAV:',
      playing: 'Tumutunog', synthesized: 'live synthesis', recording: 'WAV', muted: 'Alisin ang mute sa sound button para makinig.', blocked: 'Gumamit ng tunay na click para simulan ang tunog.', failed: 'Hindi mapatugtog ang WAV na ito.',
      click: ['Click ng button', 'Maikli at tuyong chip tick. Mabilis at magaan.'], hover: ['Pagdaan ng cursor', 'Isang napakahinang pahiwatig para sa susunod na kilos.'], coin: ['Barya', 'Dalawang malinaw na metal na nota kapag dumating ang samsam.'],
      count: ['Bilang', 'Tatlong mabilis at pataas na tick. Maikli at banayad.'], heist: ['Simula ng heist', 'Maikling western call bago lumabas ang bando.'], success: ['Tagumpay', 'Apat na pataas na nota para sa kumpirmadong magandang resulta.'],
      fail: ['Kabiguan', 'Banayad na pababang tono, walang malakas na alarm.'], rank: ['Pagtaas ng ranggo', 'Pataas na pentatonic notes na may maliit na bell sa dulo.'], unlock: ['Pag-unlock', 'Isang latch na bumubukas sa dalawang mainit na nota.'],
      combo: ['Combo', 'Anim na taas ng tono. Bawat sunod na tagumpay ay nagpapataas sa maikling himig.'], milestone: ['Mahalagang tagumpay', 'Maikling fanfare para sa tunay na mahalagang tagumpay.'], ambient: ['Hangin at kuliglig', 'Opsyonal at mahinang walong segundong ambiente na walang putol.']
    }
  };
  var navigation = {
    en: { back: 'Back to OUTLAWS', demo: 'Try the demo', nav: 'Preview navigation', language: 'Language', grid: 'Sound previews', loopTag: 'LOOP' },
    pt: { back: 'Voltar ao OUTLAWS', demo: 'Experimentar a demo', nav: 'Navegação da prévia', language: 'Idioma', grid: 'Prévias de som', loopTag: 'CICLO' },
    es: { back: 'Volver a OUTLAWS', demo: 'Probar la demo', nav: 'Navegación de la vista previa', language: 'Idioma', grid: 'Vistas previas de sonido', loopTag: 'BUCLE' },
    fil: { back: 'Bumalik sa OUTLAWS', demo: 'Subukan ang demo', nav: 'Nabigasyon ng preview', language: 'Wika', grid: 'Mga preview ng tunog', loopTag: 'PAULIT-ULIT' }
  };
  function normalize(value) { var code = String(value || 'en').toLowerCase(); if (/^(fil|ph|tl)(-|$)/.test(code)) return 'fil'; return copy[code.slice(0, 2)] ? code.slice(0, 2) : 'en'; }
  language = normalize(window.I18N?.lang?.() || document.documentElement.lang);
  function text() { return copy[language]; }
  function status(message) { document.getElementById('review-status').textContent = message; }
  function stopWav() { if (currentWav) { currentWav.pause(); currentWav.currentTime = 0; currentWav = null; } }
  function render() {
    document.documentElement.lang = language;
    document.title = 'OUTLAWS · ' + text().title;
    document.querySelectorAll('[data-text]').forEach(function (element) { element.textContent = text()[element.dataset.text]; });
    document.querySelectorAll('[data-nav]').forEach(function (element) { element.textContent = navigation[language][element.dataset.nav]; });
    document.querySelector('.desk-nav').setAttribute('aria-label', navigation[language].nav);
    document.getElementById('review-language').value = language;
    document.getElementById('review-language').setAttribute('aria-label', navigation[language].language);
    document.getElementById('sound-grid').setAttribute('aria-label', navigation[language].grid);
    var grid = document.getElementById('sound-grid');
    grid.replaceChildren();
    sfx.names.forEach(function (name) {
      var card = document.createElement('article'); card.className = 'card'; card.dataset.sound = name;
      var title = document.createElement('h2'); title.textContent = text()[name][0];
      var description = document.createElement('p'); description.textContent = text()[name][1];
      var duration = document.createElement('small'); duration.textContent = Math.round(sfx.recipes[name].duration * 1000) + ' ms' + (name === 'ambient' ? ' · ' + navigation[language].loopTag : '');
      var actions = document.createElement('div'); actions.className = 'actions';
      var synth = document.createElement('button'); synth.type = 'button'; synth.dataset.preview = 'synth';
      synth.textContent = name === 'ambient' ? sfx.getState().ambient ? text().stop : text().loop : text().synth;
      synth.setAttribute('aria-label', synth.textContent + ': ' + title.textContent);
      var wav = document.createElement('button'); wav.type = 'button'; wav.className = 'wav'; wav.dataset.preview = 'wav'; wav.textContent = text().wav;
      wav.setAttribute('aria-label', text().wav + ': ' + title.textContent);
      actions.append(synth, wav);
      if (name === 'combo') {
        var select = document.createElement('select'); select.dataset.streak = ''; select.setAttribute('aria-label', text().streak);
        for (var index = 1; index <= 6; index++) { var option = document.createElement('option'); option.value = String(index); option.textContent = '×' + index; select.appendChild(option); }
        actions.appendChild(select);
      }
      var file = document.createElement('a'); file.href = name + '.wav'; file.download = name + '.wav'; file.textContent = text().file; file.dataset.wavFile = '';
      actions.appendChild(file);
      card.append(title, description, duration, actions); grid.appendChild(card);
    });
    status('');
  }
  document.getElementById('review-language').addEventListener('change', function (event) { language = normalize(event.target.value); if (window.I18N?.set) window.I18N.set(language); else render(); });
  window.I18N?.onChange?.(function () { language = normalize(window.I18N.lang()); render(); });
  document.getElementById('sound-grid').addEventListener('change', function (event) {
    if (!event.target.matches('[data-streak]')) return;
    var file = event.target.closest('.card').querySelector('[data-wav-file]');
    file.href = event.target.value === '1' ? 'combo.wav' : 'combo-' + event.target.value + '.wav';
    file.download = file.getAttribute('href');
  });
  document.getElementById('sound-grid').addEventListener('click', async function (event) {
    var button = event.target.closest('[data-preview]');
    if (!button || !event.isTrusted) return;
    var ready = await sfx.unlock(event);
    if (!ready) { status(text().blocked); return; }
    if (sfx.getState().muted || !sfx.getState().volume) { status(text().muted); return; }
    stopWav();
    var card = button.closest('.card');
    var name = card.dataset.sound;
    var step = card.querySelector('[data-streak]');
    var streak = step ? Number(step.value) : 1;
    if (button.dataset.preview === 'synth') {
      if (name === 'ambient') { sfx.setAmbient(!sfx.getState().ambient); button.textContent = sfx.getState().ambient ? text().stop : text().loop; }
      else sfx.play(name, { streak: streak });
      status(text().playing + ': ' + text()[name][0] + ' · ' + text().synthesized);
    } else {
      if (sfx.getState().ambient) sfx.setAmbient(false);
      currentWav = new Audio(name === 'combo' && streak > 1 ? 'combo-' + streak + '.wav' : name + '.wav');
      currentWav.volume = sfx.getState().volume;
      try { await currentWav.play(); status(text().playing + ': ' + text()[name][0] + ' · ' + text().recording); }
      catch (_) { status(text().failed); }
    }
  });
  window.addEventListener('outlaws:sfx-state', function (event) {
    if (currentWav) {
      currentWav.volume = event.detail.volume;
      if (event.detail.muted || !event.detail.volume) stopWav();
    }
    var loopButton = document.querySelector('[data-sound="ambient"] [data-preview="synth"]');
    if (loopButton) { loopButton.textContent = event.detail.ambient ? text().stop : text().loop; loopButton.setAttribute('aria-label', loopButton.textContent + ': ' + text().ambient[0]); }
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stopWav(); });
  window.addEventListener('pagehide', stopWav);
  render();
})();

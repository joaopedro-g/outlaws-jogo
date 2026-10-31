/* OUTLAWS UI polish: readable cards, touch targets and one settings destination.
 * Existing controls are moved as complete nodes. Their handlers and preferences survive.
 * Sound and map previews use the public visual/audio APIs; no game state is changed.
 */
(function (root) {
  'use strict';
  if (root.OutlawsUIPolish) return;
  const doc = root.document;
  let initialized = false, dialog, settings, header, footer, style, nav, navStatus, observer, scheduled = false;
  let previewTicket = 0, graphicsReturn = false, graphicsObserver;
  const graphicsBindings = new WeakSet();
  const groups = new Map(), moves = new Map();
  const dictionaries = {
    en: { appearance: 'Appearance', appearanceHelp: 'Choose Classic or Arcade artwork. Stats stay the same.', motion: 'Motion', motionHelp: 'Control movement and extra effects. Your system’s reduced-motion preference is respected.', sound: 'Sound', soundHelp: 'Soft sound by default. Nothing plays before your first click.', arsenal: 'CRUSADE OF DUTY', arsenalHelp: 'Modern warfare, 1347 edition. Temporal weapons are visual gear. Preview one on a real outlaw.', chaos: 'Chaos Mode', chaosHelp: 'Off by default. Cycle through medieval, modern and future. The default interval is 60 seconds and can be changed.', advanced: 'Claims and network', volume: 'Volume', ambient: 'Wind and crickets', soundOn: 'Sound enabled', soundPreview: 'Hear a coin', mute: 'Mute', unmute: 'Unmute', on: 'On', off: 'Off', classic: 'Classic', arcade: 'Arcade', ak: 'AK', awp: 'AWP', grenade: 'Grenade', taser: 'Taser', modern: 'Modern', future: 'Future', medieval: 'Medieval', preview: 'Preview', back: 'Back to Settings', previewHelp: 'The preview opens on the heist map.', previewBlocked: 'Enable special effects and bring an outlaw into view to preview gear.', eraBlocked: 'Enable special effects to preview this era.', soundMuted: 'Sound is muted. Turn it on to listen.', heard: 'Coin sound preview.' },
    pt: { appearance: 'Aparência', appearanceHelp: 'Escolha a arte Classic ou Arcade. Os stats continuam iguais.', motion: 'Movimento', motionHelp: 'Controle o movimento e os efeitos extras. A preferência de movimento reduzido do sistema é respeitada.', sound: 'Som', soundHelp: 'Som baixo por padrão. Nada toca antes do primeiro clique.', arsenal: 'CRUSADE OF DUTY', arsenalHelp: 'Guerra moderna, edição 1347. Armas temporais são equipamento visual. Veja uma no bandido real.', chaos: 'Modo Chaos', chaosHelp: 'Desligado por padrão. Alterne entre medieval, moderno e futuro. O intervalo padrão é de 60 segundos e pode ser ajustado.', advanced: 'Saques e rede', volume: 'Volume', ambient: 'Vento e grilos', soundOn: 'Som ligado', soundPreview: 'Ouvir moeda', mute: 'Mudo', unmute: 'Ligar som', on: 'Ligado', off: 'Desligado', classic: 'Classic', arcade: 'Arcade', ak: 'AK', awp: 'AWP', grenade: 'Granada', taser: 'Taser', modern: 'Moderno', future: 'Futuro', medieval: 'Medieval', preview: 'Prévia', back: 'Voltar às configurações', previewHelp: 'A prévia abre no mapa do assalto.', previewBlocked: 'Ative os efeitos especiais e deixe um bandido visível para ver a arma.', eraBlocked: 'Ative os efeitos especiais para ver esta era.', soundMuted: 'O som está no mudo. Ligue para ouvir.', heard: 'Prévia do som de moeda.' },
    es: { appearance: 'Apariencia', appearanceHelp: 'Elige el arte Classic o Arcade. Los stats siguen iguales.', motion: 'Movimiento', motionHelp: 'Controla el movimiento y los efectos extra. Se respeta la preferencia de movimiento reducido del sistema.', sound: 'Sonido', soundHelp: 'Sonido suave por defecto. Nada suena antes del primer clic.', arsenal: 'CRUSADE OF DUTY', arsenalHelp: 'Guerra moderna, edición 1347. Las armas temporales son equipo visual. Prueba una en un bandido real.', chaos: 'Modo Chaos', chaosHelp: 'Desactivado por defecto. Alterna entre medieval, moderno y futuro. El intervalo predeterminado es de 60 segundos y se puede ajustar.', advanced: 'Retiros y red', volume: 'Volumen', ambient: 'Viento y grillos', soundOn: 'Sonido activado', soundPreview: 'Oír moneda', mute: 'Silenciar', unmute: 'Activar sonido', on: 'Activado', off: 'Desactivado', classic: 'Classic', arcade: 'Arcade', ak: 'AK', awp: 'AWP', grenade: 'Granada', taser: 'Taser', modern: 'Moderno', future: 'Futuro', medieval: 'Medieval', preview: 'Vista previa', back: 'Volver a ajustes', previewHelp: 'La vista previa abre en el mapa del atraco.', previewBlocked: 'Activa los efectos especiales y deja visible un bandido para ver el arma.', eraBlocked: 'Activa los efectos especiales para ver esta era.', soundMuted: 'El sonido está silenciado. Actívalo para escuchar.', heard: 'Vista previa del sonido de moneda.' },
    fil: { appearance: 'Hitsura', appearanceHelp: 'Piliin ang Classic o Arcade na artwork. Pareho pa rin ang stats.', motion: 'Galaw', motionHelp: 'Kontrolin ang galaw at dagdag na effects. Sinusunod ang reduced-motion preference ng system.', sound: 'Tunog', soundHelp: 'Mahinang tunog ang default. Walang tutunog bago ang unang click.', arsenal: 'CRUSADE OF DUTY', arsenalHelp: 'Makabagong digmaan, edisyon 1347. Biswal na kagamitan ang mga armas mula sa ibang panahon. Silipin sa totoong bandido.', chaos: 'Chaos Mode', chaosHelp: 'Naka-off bilang default. Magpalit sa medieval, moderno at hinaharap. Ang default na pagitan ay 60 segundo at puwedeng baguhin.', advanced: 'Pag-claim at network', volume: 'Lakas ng tunog', ambient: 'Hangin at kuliglig', soundOn: 'Tunog naka-on', soundPreview: 'Pakinggan ang barya', mute: 'Mute', unmute: 'I-on ang tunog', on: 'Naka-on', off: 'Naka-off', classic: 'Classic', arcade: 'Arcade', ak: 'AK', awp: 'AWP', grenade: 'Granada', taser: 'Taser', modern: 'Moderno', future: 'Hinaharap', medieval: 'Medieval', preview: 'Silip', back: 'Bumalik sa Settings', previewHelp: 'Bubukas ang preview sa mapa ng heist.', previewBlocked: 'I-on ang special effects at ipakita ang isang bandido para masilip ang armas.', eraBlocked: 'I-on ang special effects para masilip ang panahong ito.', soundMuted: 'Naka-mute ang tunog. I-on para makinig.', heard: 'Preview ng tunog ng barya.' }
  };
  function language() { const value = root.I18N?.lang?.() || doc.documentElement.lang || 'en'; return value === 'ph' || value === 'tl' ? 'fil' : value; }
  function words() { return dictionaries[language()] || dictionaries.en; }
  function previewName(choice) { const names = root.OutlawsTemporalArsenal?.weaponNames; return names?.[language()]?.[choice] || words()[choice] || names?.en?.[choice] || ''; }
  function write(el, value) { if (el && el.textContent !== String(value)) el.textContent = value; }
  function labelled(tag, key, className) { const el = doc.createElement(tag); el.dataset.oupWord = key; if (className) el.className = className; return el; }
  function move(el, destination) {
    if (!el || destination.contains(el)) return;
    if (!moves.has(el)) moves.set(el, { parent: el.parentNode, next: el.nextSibling });
    destination.appendChild(el);
  }
  function group(id, help) {
    const el = doc.createElement('details'); el.id = 'oup-' + id; el.className = 'oup-group';
    const summary = doc.createElement('summary'); summary.appendChild(labelled('span', id));
    const value = doc.createElement('small'); value.dataset.oupValue = id; summary.appendChild(value); el.appendChild(summary);
    const body = doc.createElement('div'); body.className = 'oup-group-body';
    if (help) body.appendChild(labelled('p', help, 'oup-help'));
    el.appendChild(body); settings.appendChild(el); groups.set(id, { el, body, value }); return body;
  }
  function button(key, action, value) {
    const el = labelled('button', key); el.type = 'button'; el.dataset.oupAction = action; if (value) el.dataset.oupChoice = value; return el;
  }
  function option(key, field, type = 'checkbox') {
    const label = doc.createElement('label'); label.className = 'oup-option';
    const input = doc.createElement('input'); input.type = type; input.id = 'oup-sound-' + field; input.dataset.oupSound = field;
    const title = labelled('span', key); label.append(input, title); return { label, input, title };
  }
  function relocate() {
    if (!initialized) return;
    move(doc.querySelector('.arcade-setting'), groups.get('appearance').body);
    const feel = doc.querySelector('#owj-controls');
    if (feel) { move(feel, groups.get('motion').body); feel.open = true; }
    move(doc.querySelector('#owc-settings'), groups.get('arsenal').body);
    move(doc.querySelector('#owe-settings'), groups.get('chaos').body);
    const graphics = doc.querySelector('#outlaws-graphics-upgrade');
    if (graphics) { graphics.classList.add('oup-graphics-launch'); move(graphics, groups.get('appearance').body); }
    const graphicsDialog = doc.querySelector('#outlaws-graphics-dialog');
    if (graphicsDialog && !graphicsBindings.has(graphicsDialog)) {
      graphicsBindings.add(graphicsDialog);
      graphicsDialog.addEventListener('close', () => {
        if (!graphicsReturn) return;
        graphicsReturn = false;
        root.requestAnimationFrame(() => {
          if (doc.hidden) return;
          openSettings('appearance');
          doc.querySelector('#outlaws-graphics-upgrade')?.focus({ preventScroll: true });
        });
      });
    }
  }
  function translate() {
    for (const el of doc.querySelectorAll('[data-oup-word]')) write(el, words()[el.dataset.oupWord] || el.dataset.oupWord);
    if (navStatus?.dataset.oupStatusKey) write(navStatus, words()[navStatus.dataset.oupStatusKey]);
    if (navStatus?.dataset.oupPreviewChoice) write(navStatus, `${words().preview}: ${previewName(navStatus.dataset.oupPreviewChoice)}`);
    sync();
  }
  function sync() {
    if (!initialized) return;
    // Keep the quick controls large when the shared sound portal changes parents.
    for (const control of doc.querySelectorAll('.outlaws-sfx button,.outlaws-sfx summary')) {
      control.style.setProperty('min-height', '44px', 'important');
      control.style.setProperty('min-width', '44px', 'important');
    }
    const sound = root.OutlawsSFX?.getState?.() || {}, motion = root.OutlawsJuice?.getState?.() || {};
    const arsenal = root.OutlawsCrusade?.getState?.() || {}, chaos = root.OutlawsEras?.getState?.() || {};
    const temporal = root.OutlawsTemporalArsenal, era = temporal?.currentEra?.() || chaos.era || 'medieval';
    const available = temporal?.arsenal?.[era];
    for (const control of doc.querySelectorAll('[data-oup-action="weapon"]')) {
      if (available) control.hidden = !available.includes(control.dataset.oupChoice);
    }
    const mute = doc.querySelector('#oup-quick-mute');
    write(mute, sound.muted ? words().unmute : words().mute); mute?.setAttribute('aria-pressed', String(Boolean(sound.muted)));
    const soundOn = doc.querySelector('[data-oup-sound="enabled"]'); if (soundOn) soundOn.checked = !sound.muted;
    const ambient = doc.querySelector('[data-oup-sound="ambient"]'); if (ambient) ambient.checked = Boolean(sound.ambient);
    const volume = doc.querySelector('[data-oup-sound="volume"]'); if (volume && doc.activeElement !== volume) volume.value = String(sound.volume ?? .22);
    write(doc.querySelector('#oup-volume-value'), Math.round((sound.volume ?? .22) * 100) + '%');
    write(groups.get('appearance').value, words()[root.OutlawsArcade?.getStyle?.() || 'classic']);
    write(groups.get('motion').value, motion.motion === false ? words().off : words().on);
    write(groups.get('sound').value, sound.muted ? words().off : Math.round((sound.volume ?? .22) * 100) + '%');
    write(groups.get('arsenal').value, arsenal.enabled === false ? words().off : words().on);
    write(groups.get('chaos').value, chaos.enabled ? words().on : words().off);
  }
  function openSettings(groupId) { if (!dialog) return false; if (groups.has(groupId)) groups.get(groupId).el.open = true; if (!dialog.open) dialog.showModal(); sync(); return true; }
  function captureSettingsRoute(event) {
    const mix = event.target.closest?.('.outlaws-sfx details>summary');
    if (mix) {
      event.preventDefault(); event.stopPropagation();
      mix.closest('details').open = false;
      openSettings('sound');
      root.requestAnimationFrame(() => groups.get('sound').el.querySelector('summary')?.scrollIntoView({ block: 'nearest', behavior: 'instant' }));
      return;
    }
    const graphics = event.target.closest?.('#outlaws-graphics-upgrade');
    if (!graphics || !dialog.open || !groups.get('appearance').body.contains(graphics) || !root.OutlawsGraphicsUI?.open) return;
    event.preventDefault(); event.stopPropagation();
    graphicsReturn = true;
    dialog.close();
    root.OutlawsGraphicsUI.open();
  }
  function showStatus(key, choice) {
    if (!nav) return;
    nav.hidden = false;
    navStatus.dataset.oupStatusKey = key;
    if (choice) { navStatus.dataset.oupStatusKey = ''; navStatus.dataset.oupPreviewChoice = choice; write(navStatus, `${words().preview}: ${previewName(choice)}`); }
    else { delete navStatus.dataset.oupPreviewChoice; write(navStatus, words()[key] || key); }
  }
  function preview(kind, choice) {
    if (!initialized) init();
    const map = doc.querySelector('#heist-map'); if (!map) return false;
    const ticket = ++previewTicket;
    if (dialog.open) dialog.close();
    map.scrollIntoView({ block: 'center', behavior: 'instant' });
    // Let the existing heist render provide fresh real-actor coordinates after scrolling.
    root.requestAnimationFrame(() => root.requestAnimationFrame(() => {
      if (ticket !== previewTicket || doc.hidden) return;
      const ok = kind === 'weapon' ? (root.OutlawsTemporalArsenal?.preview ? root.OutlawsTemporalArsenal.preview(choice) : root.OutlawsCrusade?.trigger?.(choice, { preview: true })) : root.OutlawsEras?.shift?.(choice, { preview: true });
      showStatus(ok ? '' : kind === 'weapon' ? 'previewBlocked' : 'eraBlocked', ok ? choice : null);
      sync();
    }));
    return true;
  }
  function mountSound() {
    const body = groups.get('sound').body; body.dataset.sfxControl = 'true';
    const sound = option('soundOn', 'enabled'), ambient = option('ambient', 'ambient');
    const volume = option('volume', 'volume', 'range'); volume.label.classList.add('oup-volume');
    volume.input.min = '0'; volume.input.max = '.65'; volume.input.step = '.01';
    const value = doc.createElement('output'); value.id = 'oup-volume-value'; value.htmlFor = volume.input.id; volume.label.appendChild(value);
    const controls = doc.createElement('div'); controls.className = 'oup-options'; controls.append(sound.label, volume.label, ambient.label);
    const row = doc.createElement('div'); row.className = 'oup-preview-buttons'; row.appendChild(button('soundPreview', 'hear'));
    const status = doc.createElement('p'); status.id = 'oup-sound-status'; status.className = 'oup-local-status'; status.setAttribute('role', 'status');
    body.append(controls, row, status);
  }
  function init() {
    if (initialized) return true;
    dialog = doc.querySelector('#ajustes'); if (!dialog || !doc.body) return false;
    initialized = true; doc.documentElement.classList.add('oup-enabled'); dialog.classList.add('oup-dialog');
    const tabs = doc.querySelector('.hud-tabs'), hud = doc.querySelector('.hud');
    if (tabs && hud) hud.before(tabs);
    // Late fight modules insert their caption before the canvas. Keep the scene first.
    const sceneFirst = () => {
      const map = doc.querySelector('#heist-map'), caption = doc.querySelector('#outlaws-visual-evolution'), tools = doc.querySelector('#game-tools');
      if (map && caption && tools) (map.closest('.olv5-stage') || map).after(caption, tools);
    };
    root.addEventListener('outlaws:fight-scene-ready', sceneFirst);
    root.addEventListener('outlaws:feel-ready', sceneFirst);
    sceneFirst();
    style = doc.createElement('style'); style.id = 'oup-style'; style.textContent = `
      .oup-enabled :is(#banner a[href],.oup-preview-nav a[href],[data-flags] a){display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;min-width:44px!important;min-height:44px!important;max-width:100%;padding:8px;white-space:normal}.oup-enabled #banner a[href]{vertical-align:middle}
      .oup-enabled :is(button,.btn,.lang,summary,select){min-height:44px;min-width:44px;box-sizing:border-box}.oup-enabled :is(input[type=number],input[type=range]){min-height:44px;box-sizing:border-box}.oup-enabled :is(.owj-switches label,.owc-toggle,.owe-toggle,.outlaws-sfx-panel label){min-height:44px}.oup-enabled .hud-top :is(.btn,.lang),.oup-enabled .outlaws-sfx :is(button,summary){min-height:44px!important;min-width:44px!important}.oup-enabled .hud-top .brand{min-height:44px}.oup-enabled [data-flags]{gap:4px}.oup-enabled #band .pick{min-width:44px;min-height:44px;display:grid;place-items:center}.oup-enabled #band .card{container-type:inline-size}
      .oup-enabled #ajustes.oup-dialog{width:min(680px,calc(100vw - 24px));min-width:0;max-width:calc(100vw - 24px);max-height:calc(100dvh - 28px);overflow-y:auto;padding:16px;box-sizing:border-box;scrollbar-color:#a98a4d #251b12}.oup-settings-header{position:sticky;top:-16px;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:12px;background:#271e14;padding:12px 0;border-bottom:1px solid #6b5939;margin-bottom:12px}.oup-settings-header h3{margin:0!important}.oup-settings-header button{font:12px/1.4 var(--ui,system-ui,sans-serif);color:#edce88;background:#30251a;border:1px solid #967543;padding:7px 12px}.oup-dialog>.outlaws-sfx{display:none!important}.oup-settings{display:grid;gap:9px}.oup-group{border:1px solid #6e5937;background:#241e15;min-width:0}.oup-group>summary{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;font:700 13px/1.4 var(--ui,system-ui,sans-serif);color:#e6cb8b;cursor:pointer;list-style-position:inside}.oup-group>summary small{font-weight:400;font-size:11px;color:#c2b799;text-align:right;flex:none}.oup-group>summary::before{content:'+';font:16px monospace;color:#b1a080}.oup-group[open]>summary::before{content:'−'}.oup-group>summary>span{margin-right:auto}.oup-group[open]>summary{border-bottom:1px solid #594931}.oup-group-body{padding:10px 12px;min-width:0}.oup-dialog .oup-help{font:12px/1.55 var(--ui,system-ui,sans-serif);color:#c6bda7;margin:0 0 9px;max-width:100%}.oup-dialog :is(.arcade-setting,#owj-controls){margin:0;padding:0;border:0;background:transparent}.oup-dialog .arcade-setting label{margin:0 0 5px}.oup-dialog #owj-controls>summary{display:none}.oup-dialog .owj-switches{gap:8px;margin-top:0}.oup-dialog .owj-switches label{flex:1 1 180px;padding:5px 7px;background:#30291d;border:1px solid #655435}.oup-dialog :is(.owc-toggle,.owe-toggle){margin:0 0 8px;padding:5px 7px;border:1px solid #655435;background:#30291d}.oup-dialog input[type=checkbox]{width:20px;height:20px;flex:none;accent-color:#d6b265}.oup-preview-buttons{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.oup-preview-buttons button,.oup-preview-nav button{font:12px/1.4 var(--ui,system-ui,sans-serif);color:#edd7a2;background:#33291a;border:1px solid #927849;padding:8px 10px}.oup-options{display:grid;gap:5px}.oup-option{display:flex;align-items:center;gap:9px;min-height:44px;font:12px/1.5 var(--ui,system-ui,sans-serif);color:#e0d6be}.oup-volume{display:grid;grid-template-columns:1fr auto;gap:4px 10px}.oup-volume>span{grid-column:1;grid-row:1}.oup-volume>output{grid-column:2;grid-row:1;font-variant-numeric:tabular-nums}.oup-volume>input{grid-column:1/-1;grid-row:2;width:100%;margin:0;accent-color:#d6b265}.oup-local-status{min-height:18px;font-size:11px!important;line-height:1.5!important;color:#c8bba2;margin:6px 0 0!important}.oup-footer{position:sticky;bottom:-16px;z-index:3;background:#271e14;border-top:1px solid #6b5939;margin-top:12px;padding:10px 0}.oup-footer>.btn{width:100%;min-height:44px}.oup-dialog :is(button,summary,select,input):focus-visible,.oup-preview-nav button:focus-visible{outline:2px solid #f1ca6b;outline-offset:3px}.oup-preview-nav{max-width:680px;margin:9px auto 0;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px;border:1px solid #665435;background:#262015;color:#d9c7a1;font:12px/1.5 var(--ui,system-ui,sans-serif)}.oup-preview-nav[hidden],.oup-preview-buttons button[hidden]{display:none!important}.oup-preview-nav [role=status]{flex:1 1 180px}
      @container(max-width:320px){.oup-enabled #band .c-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 14px}.oup-enabled #band .c-stats>div{min-width:0;text-align:left}.oup-enabled #band .c-stats dt{font-size:12px;line-height:1.4;white-space:normal}.oup-enabled #band .c-stats dd{font-size:15px;line-height:1.5;font-variant-numeric:tabular-nums;margin:3px 0 0;white-space:nowrap}}
      @media(max-width:760px){.oup-enabled #band .c-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 14px}.oup-enabled #band .c-stats>div{min-width:0;text-align:left}.oup-enabled #band .c-stats dt{font-size:12px;line-height:1.4;white-space:normal}.oup-enabled #band .c-stats dd{font-size:15px;line-height:1.5;font-variant-numeric:tabular-nums;margin:3px 0 0;white-space:nowrap}.oup-enabled .outlaws-sfx{bottom:calc(92px + env(safe-area-inset-bottom,0px))}}
      @media(max-width:460px){.oup-enabled #band{grid-template-columns:minmax(0,1fr);gap:14px}.oup-enabled #band .card{padding:16px 14px 12px}.oup-enabled #band .c-stats{gap:12px 18px}.oup-enabled #band .c-stats dd{font-size:16px}.oup-enabled #band .c-acts{gap:8px}.oup-enabled .hud-top{gap:7px}.oup-enabled .hud-top .lang{padding:8px 7px}.oup-dialog .oup-group-body{padding:10px}.oup-dialog .oup-preview-buttons button{flex:1 1 70px}.oup-dialog .owj-demo-buttons button{flex:1 1 88px}.oup-dialog .owj-switches label{flex-basis:100%}.oup-preview-nav button{width:100%}}
      .oup-dialog .oup-graphics-launch{width:100%;max-width:100%;min-width:44px;min-height:44px;box-sizing:border-box;margin-top:12px}.oup-dialog .oup-graphics-launch .owg-launch-title{min-width:0}.oup-dialog .oup-graphics-launch .owg-launch-title b{white-space:normal}
      .oup-enabled .outlaws-sfx>details{display:none!important}
      .oup-enabled footer a[href]{display:inline-flex;align-items:center;justify-content:center;min-width:44px;min-height:44px;box-sizing:border-box;padding:8px}
    `; doc.head.appendChild(style);
    header = doc.createElement('div'); header.className = 'oup-settings-header'; header.id = 'oup-settings-header';
    const heading = dialog.querySelector('h3'); if (heading) move(heading, header);
    const mute = button('mute', 'mute'); mute.id = 'oup-quick-mute'; mute.dataset.sfxControl = 'true'; header.appendChild(mute); dialog.prepend(header);
    settings = doc.createElement('div'); settings.id = 'oup-settings'; settings.className = 'oup-settings'; header.after(settings);
    group('appearance', 'appearanceHelp'); groups.get('appearance').el.open = true;
    group('motion', 'motionHelp'); group('sound', 'soundHelp'); group('arsenal', 'arsenalHelp'); group('chaos', 'chaosHelp');
    const advanced = group('advanced');
    for (const el of [...dialog.children]) if (el.matches?.('p.muted,label.alarm,.vault-tools')) move(el, advanced);
    mountSound();
    for (const [id, names, kind] of [['arsenal', ['ak', 'awp', 'grenade', 'taser'], 'weapon'], ['chaos', ['modern', 'future', 'medieval'], 'era']]) {
      const row = doc.createElement('div'); row.className = 'oup-preview-buttons';
      for (const name of names) row.appendChild(button(name, kind, name));
      groups.get(id).body.append(row, labelled('p', 'previewHelp', 'oup-local-status'));
    }
    footer = doc.createElement('div'); footer.className = 'oup-footer'; const close = dialog.querySelector('[data-act="close-ajustes"]'); if (close) move(close, footer); dialog.appendChild(footer);
    nav = doc.createElement('div'); nav.id = 'oup-preview-nav'; nav.className = 'oup-preview-nav'; nav.hidden = true;
    navStatus = doc.createElement('span'); navStatus.id = 'oup-preview-status'; navStatus.setAttribute('role', 'status'); nav.append(navStatus, button('back', 'settings'));
    (doc.querySelector('#heist')?.parentElement || doc.querySelector('#assalto')).appendChild(nav);
    relocate(); translate();
    doc.addEventListener('click', captureSettingsRoute, true);
    doc.addEventListener('keydown', (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && event.target.closest?.('.outlaws-sfx details>summary')) captureSettingsRoute(event);
    }, true);
    doc.addEventListener('click', handleClick);
    doc.addEventListener('input', handleInput);
    doc.addEventListener('change', handleChange);
    doc.addEventListener('visibilitychange', () => { previewTicket++; });
    root.I18N?.onChange?.(translate);
    observer = new MutationObserver((records) => {
      if (scheduled || !records.some((record) => !record.target.closest?.('.owj-layer'))) return;
      scheduled = true; root.requestAnimationFrame(() => { scheduled = false; relocate(); sync(); });
    }); observer.observe(dialog, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
    root.addEventListener('outlaws:arcade-ready', relocate); root.addEventListener('outlaws:crusade-ready', relocate); root.addEventListener('outlaws:eras-ready', relocate);
    root.addEventListener('outlaws:era-change', sync);
    root.addEventListener('outlaws:art-ready', relocate);
    const graphicsSection = doc.querySelector('#assalto');
    if (graphicsSection) { graphicsObserver = new MutationObserver(relocate); graphicsObserver.observe(graphicsSection, { childList: true }); }
    root.dispatchEvent(new CustomEvent('outlaws:ui-polish-ready'));
    return true;
  }
  function handleClick(event) {
    const buttonEl = event.target.closest?.('[data-oup-action]'); if (!buttonEl) return;
    const action = buttonEl.dataset.oupAction;
    if (action === 'settings') openSettings();
    if (action === 'mute') { const api = root.OutlawsSFX; api?.setMuted?.(!api.getState().muted); sync(); }
    if (action === 'weapon' || action === 'era') preview(action, buttonEl.dataset.oupChoice);
    if (action === 'hear') {
      const api = root.OutlawsSFX, muted = api?.getState?.().muted;
      if (!muted) api?.play?.('coin');
      const status = doc.querySelector('#oup-sound-status'); status.dataset.oupWord = muted ? 'soundMuted' : 'heard'; write(status, words()[status.dataset.oupWord]);
    }
  }
  function handleInput(event) { if (event.target.dataset?.oupSound === 'volume') { root.OutlawsSFX?.setVolume?.(event.target.value); sync(); } }
  function handleChange(event) {
    if (event.target.dataset?.oupSound === 'enabled') root.OutlawsSFX?.setMuted?.(!event.target.checked);
    if (event.target.dataset?.oupSound === 'ambient') root.OutlawsSFX?.setAmbient?.(event.target.checked);
    if (event.target.matches?.('[data-oup-sound],[data-owj-setting],[data-owc-toggle],[data-owe-toggle],#outlaws-art-style')) root.requestAnimationFrame(sync);
  }
  root.OutlawsUIPolish = { init, sync, openSettings, preview, getState: () => ({ initialized, groups: [...groups.keys()], settingsOpen: Boolean(dialog?.open), previewsOnMap: Boolean(nav && !nav.hidden), movedControls: [...moves.keys()].map((el) => el.id || el.className) }) };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})(window);

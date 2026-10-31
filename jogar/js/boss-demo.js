/* OUTLAWS boss preview. Isolated demo credit and original procedural pixel art.
 * No gameplay, NFT, wallet, contract, provider or network calls.
 */
(function (root) {
  'use strict';
  if (root.OutlawsBossDemo) return;
  if (!new URLSearchParams(root.location.search).has('demo')) {
    root.OutlawsBossDemo = Object.freeze({ enabled: false, getState: () => ({ enabled: false, demo: false }) });
    return;
  }
  const doc = root.document, STAKE = 400, WIN_CHANCE = .40;
  const COLORS = ['#8d9ba6', '#69b58c', '#77a9d9', '#b198df', '#e3ac62', '#f2da76'];
  const RANK_ODDS = [.45, .27, .15, .08, .04, .01];
  const media = root.matchMedia?.('(prefers-reduced-motion: reduce)');
  const W = 320, H = 244, INTRO_MS = 650, FIGHT_MS = 40000, FINAL_MS = 37650;
  const STAGE_MARKS = [INTRO_MS, 12650, 25650, FINAL_MS], BOSS_IDS = ['king_tyrant', 'swat_chief', 'alien_emperor'];
  const ERA_IDS = ['medieval', 'modern', 'future'], timers = new Set(), animations = new Set();
  let initialized = false, panel, stage, canvas, ctx, map, scheduler = 0, raf = 0, generation = 0, maintenance = 0, lastPrefs = '';
  let phase = 'idle', opponent = null, reward = null, lastOutcome = null, balance = STAKE * 3;
  let debited = false, collection = [], started = 0, lastInvite = 0, interrupted = false;
  let bossImage, outlawImage, resizeObserver, artReady = false, artDraws = 0;
  let fightCrew = [], crewSource = 'fallback', crewDraws = 0, lastFightCue = 0;
  const fightText = {
    en: { phase: 'Phase', intro: 'Boss incoming', telegraph: 'Incoming strike', dodge: 'Spread out', counter: 'Strike back', recover: 'Regroup', victory: 'Boss defeated', defeat: 'Gang defeated', bosses: ['TYRANT KING', 'SWAT CHIEF', 'ALIEN EMPEROR'], stages: [['Crown strike', 'Royal fury', 'Last stand'], ['Breach', 'Suppress', 'Final order'], ['Pulse', 'Orbital storm', 'Last protocol']] },
    pt: { phase: 'Fase', intro: 'O boss chegou', telegraph: 'Golpe anunciado', dodge: 'Espalhar e desviar', counter: 'Contra-atacar', recover: 'Reagrupar', victory: 'Boss derrotado', defeat: 'Bando derrotado', bosses: ['REI TIRANO', 'CHEFE DA SWAT', 'IMPERADOR ALIEN'], stages: [['Golpe da coroa', 'Fúria real', 'Última resistência'], ['Entrada', 'Supressão', 'Ordem final'], ['Pulso', 'Tempestade orbital', 'Último protocolo']] },
    es: { phase: 'Fase', intro: 'Llega el jefe', telegraph: 'Golpe anunciado', dodge: 'Dispersarse y esquivar', counter: 'Contraatacar', recover: 'Reagruparse', victory: 'Jefe derrotado', defeat: 'Banda derrotada', bosses: ['REY TIRANO', 'JEFE DE LA SWAT', 'EMPERADOR ALIEN'], stages: [['Golpe de corona', 'Furia real', 'Última resistencia'], ['Entrada', 'Supresión', 'Orden final'], ['Pulso', 'Tormenta orbital', 'Último protocolo']] },
    fil: { phase: 'Yugto', intro: 'Dumating ang boss', telegraph: 'Paparating na atake', dodge: 'Kumalat at umiwas', counter: 'Gumanti', recover: 'Muling magsama', victory: 'Natalo ang boss', defeat: 'Natalo ang gang', bosses: ['MALUPIT NA HARI', 'HEPE NG SWAT', 'EMPERADOR ALIEN'], stages: [['Atake ng korona', 'Galit ng hari', 'Huling pagtindig'], ['Pagpasok', 'Pagsupil', 'Huling utos'], ['Pulso', 'Bagyong orbital', 'Huling protocol']] }
  };
  const text = {
    en: { title: 'Boss challenge', demo: 'Demo BOUNTY and characters only. No real value.', find: 'Find a boss', challenge: 'Challenge', repeat: 'Another encounter', close: 'Return to the map', open: 'Open the character box', reset: 'Restore demo credit', balance: 'Demo credit', odds: '400 demo BOUNTY per attempt, spent on wins and losses. 40% win chance: an economic scenario, not a live game rule.', idle: 'An optional boss may appear in the current era.', invited: 'A boss is waiting. Challenge only when you choose.', fight: 'Demo fight', won: 'Victory. Your character box is ready.', lost: 'Defeat. 400 demo BOUNTY spent; no character.', opening: 'Opening your character box…', revealed: 'Original demo character revealed', interrupted: 'Preview interrupted. Demo credit restored.', empty: 'Not enough demo credit. You can restore practice credit.', invisible: 'Bring the heist map into view to preview.', collection: 'Demo character collection', health: 'Boss health', settings: 'Settings', practice: 'Three practice attempts restored.', eras: ['Medieval', 'Modern', 'Future'], ranks: ['Nobody', 'Thief', 'Outlaw', 'Wanted', 'Enemy of the Crown', 'Legend'], names: ['Garruk, Ash King', 'Tamar, Iron Regent', 'Commander Ferrox', 'Captain Nyra', 'Emperor Nox', 'Archon Aster'], loot: ['Sable, Dust Rider', 'Vexa, Night Courier', 'Orin, Star Wanderer'] },
    pt: { title: 'Desafio do boss', demo: 'BOUNTY e personagens da demo. Sem valor real.', find: 'Encontrar um boss', challenge: 'Desafiar', repeat: 'Outro encontro', close: 'Voltar ao mapa', open: 'Abrir a caixa de personagem', reset: 'Restaurar crédito da demo', balance: 'Crédito da demo', odds: '400 BOUNTY fictícios por tentativa, gastos na vitória e na derrota. Chance de 40%: cenário econômico, não regra do jogo real.', idle: 'Um boss opcional pode aparecer na época atual.', invited: 'Um boss está esperando. Você decide se vai desafiar.', fight: 'Luta da demo', won: 'Vitória. Sua caixa de personagem está pronta.', lost: 'Derrota. 400 BOUNTY fictícios gastos; nenhum personagem.', opening: 'Abrindo sua caixa de personagem…', revealed: 'Personagem original da demo revelado', interrupted: 'Prévia interrompida. Crédito fictício devolvido.', empty: 'Crédito fictício insuficiente. Você pode restaurar o crédito de treino.', invisible: 'Deixe o mapa do assalto visível para ver a prévia.', collection: 'Coleção de personagens da demo', health: 'Vida do boss', settings: 'Ajustes', practice: 'Três tentativas de treino restauradas.', eras: ['Medieval', 'Moderna', 'Futura'], ranks: ['Ninguém', 'Ladrão', 'Foragido', 'Procurado', 'Inimigo da Coroa', 'Lenda'], names: ['Garruk, Rei das Cinzas', 'Tamar, Regente de Ferro', 'Comandante Ferrox', 'Capitã Nyra', 'Imperador Nox', 'Arconte Aster'], loot: ['Sable, Cavaleira da Poeira', 'Vexa, Mensageira da Noite', 'Orin, Viajante das Estrelas'] },
    es: { title: 'Desafío del jefe', demo: 'BOUNTY y personajes de la demo. Sin valor real.', find: 'Encontrar un jefe', challenge: 'Desafiar', repeat: 'Otro encuentro', close: 'Volver al mapa', open: 'Abrir la caja de personaje', reset: 'Restaurar crédito de demo', balance: 'Crédito de demo', odds: '400 BOUNTY ficticios por intento, gastados al ganar y al perder. Probabilidad del 40%: escenario económico, no regla del juego real.', idle: 'Puede aparecer un jefe opcional de la época actual.', invited: 'Un jefe espera. Tú decides si lo desafías.', fight: 'Combate de demo', won: 'Victoria. Tu caja de personaje está lista.', lost: 'Derrota. 400 BOUNTY ficticios gastados; sin personaje.', opening: 'Abriendo tu caja de personaje…', revealed: 'Personaje original de demo revelado', interrupted: 'Vista previa interrumpida. Crédito ficticio devuelto.', empty: 'Crédito ficticio insuficiente. Puedes restaurar el crédito de práctica.', invisible: 'Muestra el mapa del asalto para ver la vista previa.', collection: 'Colección de personajes de demo', health: 'Vida del jefe', settings: 'Ajustes', practice: 'Tres intentos de práctica restaurados.', eras: ['Medieval', 'Moderna', 'Futura'], ranks: ['Don nadie', 'Ladrón', 'Fugitivo', 'Buscado', 'Enemigo de la Corona', 'Leyenda'], names: ['Garruk, Rey de Ceniza', 'Tamar, Regente de Hierro', 'Comandante Ferrox', 'Capitana Nyra', 'Emperador Nox', 'Arconte Aster'], loot: ['Sable, Jinete del Polvo', 'Vexa, Mensajera Nocturna', 'Orin, Viajero Estelar'] },
    fil: { title: 'Hamunin ang boss', demo: 'Demo BOUNTY at mga tauhan lamang. Walang tunay na halaga.', find: 'Humanap ng boss', challenge: 'Hamunin', repeat: 'Isa pang pagkikita', close: 'Bumalik sa mapa', open: 'Buksan ang kahon ng tauhan', reset: 'Ibalik ang demo credit', balance: 'Demo credit', odds: '400 demo BOUNTY bawat laban, gagastusin sa panalo o talo. 40% tsansang manalo: halimbawa ng ekonomiya, hindi tuntunin ng tunay na laro.', idle: 'Maaaring lumitaw ang isang boss sa kasalukuyang panahon.', invited: 'May boss na naghihintay. Ikaw ang pipili kung lalaban.', fight: 'Laban sa demo', won: 'Panalo. Handa na ang kahon ng tauhan.', lost: 'Talo. Nagamit ang 400 demo BOUNTY; walang tauhan.', opening: 'Binubuksan ang kahon ng tauhan…', revealed: 'Ipinakita ang orihinal na tauhan ng demo', interrupted: 'Naantala ang preview. Ibinalik ang demo credit.', empty: 'Kulang ang demo credit. Maaari mong ibalik ang credit para sa ensayo.', invisible: 'Ipakita ang mapa ng heist para makita ang preview.', collection: 'Koleksiyon ng mga tauhan ng demo', health: 'Buhay ng boss', settings: 'Mga setting', practice: 'Ibinalik ang tatlong laban para sa ensayo.', eras: ['Gitnang Panahon', 'Makabagong Panahon', 'Hinaharap'], ranks: ['Walang Pangalan', 'Magnanakaw', 'Takas', 'Hinahanap', 'Kaaway ng Korona', 'Alamat'], names: ['Garruk, Hari ng Abo', 'Tamar, Regenteng Bakal', 'Kumander Ferrox', 'Kapitan Nyra', 'Emperador Nox', 'Arkonte Aster'], loot: ['Sable, Mangangabayo ng Alikabok', 'Vexa, Mensahero ng Gabi', 'Orin, Manlalakbay sa mga Bituin'] }
  };
  const words = () => text[root.I18N?.lang?.()] || text.en;
  const combatWords = () => fightText[root.I18N?.lang?.()] || fightText.en;
  const rankColor = i => root.OutlawsLib?.traits?.RANKS?.[i]?.rarity?.[0] || COLORS[i];
  function rankName(i) { const key='rank.'+i,value=root.I18N?.t?.(key);return value&&value!==key?value:words().ranks[i]; }
  const artStyle = () => root.OutlawsArcade?.getStyle?.() || 'classic';
  function drawArt(method, ...args) { if(!artReady||!root.OutlawsEraArt?.[method])return false;try{const ok=root.OutlawsEraArt[method](...args);if(ok)artDraws++;return ok===true;}catch{return false;} }
  function readyArt() { artReady=Boolean(root.OutlawsEraArt?.getState?.().ready);if(panel)update();if(stage&&!stage.hidden)draw(currentProgress()); }
  const prefs = () => root.OutlawsJuice?.getState?.() || { effects: true, reducedMotion: false, motion: true };
  const reduced = () => Boolean(media?.matches || prefs().reducedMotion || prefs().motion === false);
  const effects = () => prefs().effects !== false;
  const now = () => root.performance.now();
  function later(fn, ms) { const id = root.setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; }
  function sound(name, rarity = 0) { if (effects() && !doc.hidden) root.OutlawsEpochSFX?.play?.(name, { rarity }); }
  function cancelWork() { generation++; for (const id of timers) root.clearTimeout(id); timers.clear(); if (raf) root.cancelAnimationFrame(raf); raf = 0; for (const animation of animations) animation.cancel(); animations.clear(); }
  function watchPrefs() { if(maintenance||!initialized||phase==='idle'||doc.hidden)return;lastPrefs=effects()+':'+reduced();maintenance=root.setTimeout(()=>{maintenance=0;const key=effects()+':'+reduced();if(key!==lastPrefs)syncPrefs();watchPrefs();},150); }
  function visible() { if (!map || doc.hidden || !map.getClientRects().length) return false; const r = map.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < root.innerHeight && r.right > 0 && r.left < root.innerWidth; }
  function currentEra() { const value = root.OutlawsTemporalArsenal?.getState?.().era || root.TemporalArsenal?.getState?.().era || root.OutlawsArcade?.getState?.().era || root.OutlawsEras?.getState?.().era || map?.dataset.oweEra; return value === 'future' ? 2 : value === 'modern' ? 1 : 0; }
  function announce(key) { panel.querySelector('[data-ob-status]').textContent = words()[key]; panel.dataset.obStatus = key; }
  function place() { if (!stage || stage.hidden || !map) return; const r = map.getBoundingClientRect(), left = Math.max(0, r.left), top = Math.max(0, r.top), right = Math.min(root.innerWidth, r.right), bottom = Math.min(root.innerHeight, r.bottom); if (right <= left || bottom <= top) { stage.hidden = true; return; } Object.assign(stage.style, { left: left + 'px', top: top + 'px', width: (right-left) + 'px', height: (bottom-top) + 'px' }); }
  function px(c, color, x, y, w = 1, h = 1) { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function sprite(kind, era, variant = 0, rank = 0) {
    const image = doc.createElement('canvas'); image.width = 40; image.height = 48;
    const c = image.getContext('2d'); c.imageSmoothingEnabled = false;
    const boss = kind === 'boss', coat = boss ? ['#5d3837', '#344b53', '#4d3a68'][era] : ['#9b6744', '#486c79', '#57528d'][era];
    const skin = era === 2 && boss ? '#88c4a0' : '#d7aa83', edge = '#151923';
    px(c, edge, 12, 38, 7, 7); px(c, edge, 22, 38, 7, 7); px(c, '#44434c', 13, 36, 5, 5); px(c, '#44434c', 23, 36, 5, 5);
    px(c, edge, 9, 21, 23, 17); px(c, coat, 11, 22, 19, 14); px(c, '#cfb18a', 12, 33, 18, 2);
    px(c, edge, 8, 9, 25, 13); px(c, skin, 11, 11, 19, 10); px(c, '#201d29', 15, 15, 3, 2); px(c, '#201d29', 24, 15, 3, 2);
    px(c, edge, 5, 24, 5, 12); px(c, edge, 31, 24, 5, 12); px(c, skin, 6, 32, 3, 4); px(c, skin, 32, 32, 3, 4);
    if (era === 0) { px(c, boss ? '#b6a267' : '#7b533b', 7, 8, 27, 4); px(c, boss ? '#d6bb68' : '#9a6745', 12, 3, 17, 7); if (boss) { for (const x of [12, 19, 26]) px(c, '#e6c875', x, 0, 3, 4); px(c, '#9d514f', 20, 5, 3, 2); } else px(c, '#cfb58a', 6, 22, 28, 3); }
    if (era === 1) { px(c, '#1f303e', 8, 6, 25, 7); px(c, '#84afc7', 12, 10, 18, 3); px(c, '#b8c5cc', 17, 24, 8, 7); px(c, '#586e7b', 19, 25, 4, 5); if (boss) { px(c, '#24404b', 31, 19, 8, 20); px(c, '#9fb8bd', 33, 22, 4, 12); } }
    if (era === 2) { px(c, '#99cbd3', 8, 7, 25, 4); px(c, '#6b799e', 11, 3, 19, 4); px(c, '#c2e9e4', 18, 24, 7, 9); px(c, '#8176ac', 19, 26, 5, 4); if (boss) { px(c, '#93d4a6', 3, 12, 7, 6); px(c, '#93d4a6', 31, 12, 7, 6); px(c, '#e4d88b', 20, 10, 2, 3); } }
    px(c, variant ? '#a2d4c2' : '#e4c785', 20, 29, 3, 2);
    if (!boss) { px(c, rankColor(rank), 3, 42, 34, 2); px(c, rankColor(rank), 3, 4, 2, 40); px(c, rankColor(rank), 35, 4, 2, 40); }
    return image;
  }
  function currentProgress() {
    if (phase === 'fighting') return Math.max(0, Math.min(1, (now() - started) / FIGHT_MS));
    if (phase === 'opening') return Math.max(0, Math.min(1, (now() - started) / 1100));
    return 0;
  }
  function captureCrew() {
    try {
      const snapshot = root.OutlawsFightScene?.getCrewSnapshot?.();
      const list = Array.isArray(snapshot) ? snapshot : snapshot?.crew;
      if (!Array.isArray(list)) return [];
      return list.slice(0, 6).map(item => ({
        id: typeof item?.id === 'number' || typeof item?.id === 'string' ? item.id : null,
        rank: Number.isInteger(item?.rank) && item.rank >= 0 && item.rank <= 5 ? item.rank : null
      }));
    } catch { return []; }
  }
  function fightFrame(elapsed) {
    const ms = Math.max(0, Math.min(FIGHT_MS, elapsed));
    if (ms < INTRO_MS) return { elapsed: ms, stage: 0, step: 'intro', beat: ms / INTRO_MS, strike: false, next: INTRO_MS };
    if (ms >= FINAL_MS) return { elapsed: ms, stage: 3, step: lastOutcome === 'win' ? 'victory' : 'defeat', beat: (ms - FINAL_MS) / (FIGHT_MS - FINAL_MS), strike: false, next: FIGHT_MS };
    const index = ms < STAGE_MARKS[1] ? 0 : ms < STAGE_MARKS[2] ? 1 : 2;
    const stageStart = STAGE_MARKS[index], length = STAGE_MARKS[index + 1] - stageStart, cycle = length / 3;
    const local = ms - stageStart, cycleIndex = Math.min(2, Math.floor(local / cycle));
    const position = (local - cycleIndex * cycle) / cycle;
    const begin = position < .27 ? 0 : position < .47 ? .27 : position < .84 ? .47 : .84;
    const end = position < .27 ? .27 : position < .47 ? .47 : position < .84 ? .84 : 1;
    const step = position < .27 ? 'telegraph' : position < .47 ? 'dodge' : position < .84 ? 'counter' : 'recover';
    return { elapsed: ms, stage: index + 1, step, beat: Math.max(0, Math.min(1, (position - begin) / (end - begin))), strike: position >= .35 && position < .41, cycle: cycleIndex, next: Math.min(STAGE_MARKS[index + 1], stageStart + cycleIndex * cycle + end * cycle) };
  }
  function frameAt(progress) {
    if (phase === 'fighting') return fightFrame(progress * FIGHT_MS);
    if (phase === 'lost') return { elapsed: FIGHT_MS, stage: 3, step: 'defeat', beat: 1, strike: false, next: FIGHT_MS };
    return { elapsed: 0, stage: 0, step: 'intro', beat: 0, strike: false, next: INTRO_MS };
  }
  function syncFightCaption(frame) {
    const label = panel?.querySelector('[data-ob-fight-caption]'); if (!label) return;
    label.hidden = phase !== 'fighting';
    if (label.hidden) return;
    const w = combatWords(), name = frame.stage ? `${w.phase} ${frame.stage}/3 · ${w.stages[opponent.era][frame.stage - 1]}` : w.bosses[opponent.era];
    const value = `${name} · ${w[frame.step]} · ${Math.max(0, Math.ceil((FIGHT_MS - frame.elapsed) / 1000))} s`;
    if (label.textContent !== value) label.textContent = value;
    panel.dataset.obFightStage = String(frame.stage); panel.dataset.obFightBeat = frame.step;
  }
  function runFightPresentation(token) {
    if (token !== generation || phase !== 'fighting' || doc.hidden) return;
    const elapsed = Math.min(FIGHT_MS, now() - started), frame = fightFrame(elapsed);
    syncFightCaption(frame);
    health(lastOutcome === 'win' ? (elapsed>=FINAL_MS?0:Math.max(1,Math.round(100 * (1 - elapsed / FINAL_MS)))) : Math.round(100 - 72 * elapsed / FIGHT_MS));
    if (frame.elapsed < FINAL_MS && elapsed - lastFightCue >= 1600) { lastFightCue = elapsed; sound('bossfight'); }
    if (reduced() && effects()) draw(elapsed / FIGHT_MS);
    if (elapsed >= FIGHT_MS) return;
    const next = Math.min(frame.next, lastFightCue + 1600, FIGHT_MS);
    // A late callback advances to the present beat. It never replays missed sounds.
    later(() => runFightPresentation(token), Math.max(40, next - elapsed));
  }
  function drawFightArt(method, ...args) {
    try { if (root.OutlawsFightArt?.[method]?.(...args) === true) { artDraws++; return true; } } catch {}
    return drawArt(method, ...args);
  }
  function drawArena(moving) {
    const era = ERA_IDS[opponent?.era ?? reward?.era ?? 0];
    try {
      if (root.OutlawsFightArt?.drawScene?.(ctx, { era, width: W, height: H, time: now(), motion: moving, graphics: root.OutlawsEraArt?.getState?.().graphics || 'arcade', style: artStyle() }) === true) return;
    } catch {}
    // Clean placeholder room, with no decorative NPC or unrelated crew.
    px(ctx, ['#29231d', '#253036', '#222b3c'][opponent?.era ?? reward?.era ?? 0], 0, 0, W, H);
    px(ctx, '#181e26', 0, 198, W, 46); px(ctx, '#60605a', 10, 210, W - 20, 2);
    for (let i = 0; i < 6; i++) px(ctx, '#353b40', 10 + i * 52, 228, 38, 1);
    px(ctx, '#111b24', 228, 72, 75, 124); px(ctx, ['#8c764c', '#627c86', '#57759b'][opponent?.era ?? reward?.era ?? 0], 228, 72, 75, 3);
  }
  function drawFallbackCrew(frame, moving) {
    const originals = [[24, 122], [69, 122], [115, 122], [24, 169], [69, 169], [115, 169]];
    const spread = [[14, 101], [61, 94], [142, 105], [14, 179], [67, 186], [145, 177]];
    for (let i = 0; i < 6; i++) {
      const slot = fightCrew[i], rank = slot?.rank, color = rank === null || rank === undefined ? '#a89a7b' : rankColor(rank);
      let [x, y] = originals[i];
      if (moving && frame.step === 'dodge') { const t = Math.min(1, frame.beat * 1.6); x += (spread[i][0] - x) * t; y += (spread[i][1] - y) * t; }
      if (moving && frame.step === 'counter') x += Math.sin(frame.beat * Math.PI) * (12 + i % 3 * 2);
      if (frame.step === 'defeat') { px(ctx, '#111925', x, y + 27, 33, 5); px(ctx, '#685a50', x + 5, y + 22, 23, 6); px(ctx, color, x + 3, y + 21, 4, 7); continue; }
      px(ctx, '#101821', x + 3, y + 30, 25, 3); px(ctx, '#101821', x + 6, y + 17, 20, 13);
      px(ctx, ['#665648', '#526c73', '#526c86'][opponent.era], x + 8, y + 18, 16, 11);
      px(ctx, '#121e28', x + 5, y + 2, 23, 16); px(ctx, '#a89981', x + 10, y + 8, 14, 8);
      px(ctx, '#101821', x + 10, y + 11, 5, 2); px(ctx, '#101821', x + 20, y + 11, 4, 2);
      px(ctx, color, x + 7, y + 2, 4, 13); px(ctx, '#111925', x + 9, y + 29, 5, 4); px(ctx, '#111925', x + 22, y + 29, 5, 4);
    }
  }
  function drawCrew(frame, moving) {
    const options = { era: ERA_IDS[opponent.era], phase: frame.step === 'recover' ? 'idle' : frame.step, time: frame.elapsed / 1000, outcome: frame.step === 'victory' || frame.step === 'defeat' ? lastOutcome : null, width: W, height: H, stage: frame.stage, beat: frame.beat, motion: moving, effects: effects(), crew: fightCrew.length ? fightCrew : undefined, target: { x: 230, y: 144 }, bounds: { x: 14, y: 96, width: 176, height: 112 } };
    try { if (root.OutlawsFightScene?.drawCrew?.(ctx, options) === true) { crewSource = 'shared'; crewDraws++; return; } } catch {}
    crewSource = 'fallback'; drawFallbackCrew(frame, moving);
  }
  function drawDanger(frame, moving) {
    if (!['telegraph', 'dodge'].includes(frame.step)) return;
    const era = opponent.era, color = ['#f0ba64', '#ffb363', '#a8cbfa'][era];
    ctx.save(); ctx.globalAlpha = moving ? .15 + (frame.step === 'telegraph' ? frame.beat * .12 : .15) : .23;
    if (frame.stage === 1) px(ctx, color, 19, 151, 186, 16);
    else if (frame.stage === 2) { px(ctx, color, 19, 137, 186, 12); px(ctx, color, 19, 181, 186, 12); }
    else { px(ctx, color, 40, 116, 125, 76); px(ctx, '#182838', 48, 125, 109, 57); }
    ctx.restore();
    if (frame.stage < 3) { const lines = frame.stage === 1 ? [151] : [137, 181]; for (const y of lines) for (let i = 0; i < 16; i++) px(ctx, color, 19 + i * 12, y, 5, 1); }
    else for (let i = 0; i < 12; i++) { px(ctx, color, 40 + i * 11, 116, 4, 1); px(ctx, color, 40 + i * 11, 191, 4, 1); }
    if (frame.strike && moving) {
      // One local impact, already announced by the same visible danger zone.
      ctx.save(); ctx.globalAlpha = .35; px(ctx, '#fff0c3', 30, frame.stage === 2 ? 137 : 151, 164, frame.stage === 3 ? 33 : 10); ctx.restore();
      if (era === 0) for (let i = 0; i < 10; i++) px(ctx, '#fff0cc', 202 - i * 15, 143 + Math.round(Math.sin(i / 9 * Math.PI) * 25), 5, 2);
      if (era === 1) { px(ctx, '#f7e2b3', 202, 148, 7, 5); px(ctx, '#e9ce94', 32, 151, 165, 2); }
      if (era === 2) for (let i = 0; i < 12; i++) px(ctx, '#bfeafd', 28 + i * 14, 149 + (i % 2 ? 3 : -3), 7, 2);
    }
  }
  function drawBossFallback(x, y, state, moving, frame) {
    const era = opponent.era, edge = '#101923', coat = ['#6c3d3d', '#36505a', '#4e4a76'][era];
    if (state === 'fall') { px(ctx, edge, x - 7, 188, 86, 16); px(ctx, coat, x + 5, 188, 65, 11); px(ctx, '#c6a674', x + 3, 185, 20, 5); return; }
    px(ctx, edge, x + 14, y + 77, 16, 26); px(ctx, edge, x + 49, y + 77, 16, 26);
    px(ctx, edge, x + 10, y + 39, 61, 46); px(ctx, coat, x + 14, y + 42, 53, 39);
    px(ctx, '#d0b06f', x + 14, y + 69, 53, 5); px(ctx, edge, x + 10, y + 13, 61, 30);
    px(ctx, era === 2 ? '#91c2a9' : '#cab392', x + 15, y + 19, 50, 23);
    px(ctx, edge, x + 23, y + 25, 9, 3); px(ctx, edge, x + 49, y + 25, 9, 3);
    if (era === 0) { px(ctx, '#dcba67', x + 11, y + 8, 59, 10); for (const dx of [12, 33, 59]) px(ctx, '#dcba67', x + dx, y, 8, 10); px(ctx, '#efd895', x + 11, y + 11, 59, 2); }
    if (era === 1) { px(ctx, '#1b3544', x + 9, y + 7, 62, 13); px(ctx, '#82bbcf', x + 14, y + 18, 53, 8); px(ctx, '#1d3544', x - 6, y + 43, 22, 49); px(ctx, '#9bc5d1', x - 4, y + 46, 18, 2); }
    if (era === 2) { px(ctx, '#829ec4', x + 8, y + 7, 64, 13); px(ctx, '#b8e1e9', x + 31, y + 45, 15, 22); px(ctx, '#102d44', x + 35, y + 51, 7, 9); }
    if (moving && state === 'attack') px(ctx, ['#e1c9a3', '#a0bbc9', '#bdeaff'][era], x - 25, y + 50, 36, 6);
    if (moving && state === 'hit') { ctx.save(); ctx.globalAlpha = .28; px(ctx, '#fff1bd', x + 11, y + 14, 58, 66); ctx.restore(); }
  }
  function drawEncounter(frame, moving) {
    drawDanger(frame, moving); drawCrew(frame, moving);
    const fallen = frame.step === 'victory', hit = frame.step === 'counter' && moving && frame.beat < .14;
    const bossState = fallen ? 'fall' : frame.strike ? 'attack' : hit ? 'hit' : 'idle';
    const x = Math.round(207 + (moving && frame.step === 'intro' ? (1 - frame.beat) * 18 : moving && hit ? 3 : 0));
    const y = 98;
    ctx.save();
    if (fallen && moving) ctx.globalAlpha = 1 - Math.max(0, frame.beat - .4) * .6;
    if (!drawFightArt('drawBoss', ctx, BOSS_IDS[opponent.era], x, y, { style: artStyle(), state: bossState, direction: 'left', frame: fallen?Math.min(7,Math.floor(Math.max(0,frame.elapsed-FINAL_MS)/550*7)):moving?Math.floor(frame.beat*7):0, scale: 2 })) drawBossFallback(x, y, bossState, moving, frame);
    ctx.restore();
    if (hit) for (let i = 0; i < 5; i++) px(ctx, '#ead5a0', 208 + i * 8, 145 + (i % 2 ? -6 : 6), 3, 2);
    const w = combatWords();
    ctx.save();
    if (frame.step === 'intro') { ctx.fillStyle = 'rgba(5,8,15,.42)'; ctx.fillRect(0, 0, W, H); }
    px(ctx, '#111923', 10, 8, 300, 38); px(ctx, ['#bfa268', '#9bb5c4', '#aab9e0'][opponent.era], 10, 8, 3, 38);
    ctx.font = 'bold 12px ui-monospace,monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#f4dfb4';
    ctx.fillText(w.bosses[opponent.era], 21, 15, 275);
    ctx.font = '10px ui-monospace,monospace'; ctx.fillStyle = '#d1d4d7';
    const caption = frame.stage ? `${w.phase} ${frame.stage}/3 · ${w.stages[opponent.era][frame.stage - 1]}` : w.intro;
    ctx.fillText(caption, 21, 31, 275);
    if (frame.step === 'victory' || frame.step === 'defeat') {
      px(ctx, '#111923', 44, 66, 232, 28); ctx.fillStyle = frame.step === 'victory' ? '#e6cd91' : '#e7b4aa'; ctx.font = 'bold 13px ui-monospace,monospace'; ctx.textAlign = 'center'; ctx.fillText(w[frame.step], 160, 73, 218);
    } else {
      const value = phase === 'fighting' ? lastOutcome === 'win' ? Math.round(100 * (1 - frame.elapsed / FIGHT_MS)) : Math.round(100 - 72 * frame.elapsed / FIGHT_MS) : 100;
      px(ctx, '#1b2430', 21, 50, 278, 5); if (value > 0) px(ctx, '#bf8d67', 21, 50, Math.round(278 * value / 100), 5);
    }
    ctx.restore();
  }
  function draw(progress = 0) {
    if (!ctx || !['invited','fighting','lost','box','opening','revealed'].includes(phase) || !effects() || !visible()) { if (stage) stage.hidden = true; return; }
    stage.hidden = false; place(); ctx.clearRect(0, 0, W, H); ctx.imageSmoothingEnabled = false;
    const moving = !reduced(), fight = phase === 'fighting', opening = phase === 'opening';
    drawArena(moving);
    if (phase === 'box' || opening || phase === 'revealed') {
      const color = rankColor(reward.rank), shake = moving && opening && progress < .33 ? Math.round(Math.sin(progress*95)*2) : 0;
      const state=phase==='box'?'closed':phase==='revealed'?'reveal':progress<.33?'shake':progress<.56?'crack':progress<.72?'burst':'reveal';
      if(drawArt('drawLootbox',ctx,112,112,{style:artStyle(),rarity:reward.rank,state,frame:moving?Math.floor(progress*10):0,scale:2})) {
        if(state==='reveal'){const size=artStyle()==='arcade'?24:32;if(!drawArt('drawReveal',ctx,(W-size*2)/2,78,{style:artStyle(),rarity:reward.rank,scale:2}))ctx.drawImage(outlawImage,120,88,80,96);}
        return;
      }
      if (phase === 'revealed' || opening && progress > .72) {
        px(ctx, color, 108, 83, 104, 3); px(ctx, color, 108, 188, 104, 3);
        ctx.drawImage(outlawImage, 120, 88, 80, 96);
        if (moving && opening) for (let i=0; i<10; i++) { const spread = Math.max(0, progress-.72)*150; px(ctx, color, 160 + Math.round(Math.cos(i*2.4)*spread), 136 + Math.round(Math.sin(i*2.4)*spread), 2, 2); }
      } else {
        px(ctx, '#151725', 118+shake, 133, 84, 53); px(ctx, '#a46f42', 121+shake, 136, 78, 47); px(ctx, '#d4a165', 118+shake, 126, 84, 12); px(ctx, '#f0c881', 118+shake, 130, 84, 3); px(ctx, '#694730', 158+shake, 137, 5, 46); px(ctx, '#dbc88d', 154+shake, 145, 14, 13); px(ctx, '#463e40', 159+shake, 149, 4, 6);
        if (opening && progress > .32) { px(ctx, color, 122, 138, 76, 2); px(ctx, color, 161, 138, 3, 43); px(ctx, color, 170, 150, 14, 2); }
      }
      return;
    }
    if (!opponent) return;
    drawEncounter(frameAt(progress), moving);
  }
  function visualLoop(duration, mode, resume=false) { const token = generation; if(!resume)started = now(); if (reduced() || !effects()) { draw(mode === 'opening' ? 1 : currentProgress()); return; } const frame = () => { if (token !== generation || doc.hidden || !effects() || reduced()) { raf=0; draw(mode==='opening'?1:currentProgress()); return; } const p=Math.min(1,(now()-started)/duration); draw(p); if(p<1)raf=root.requestAnimationFrame(frame);else raf=0; }; raf=root.requestAnimationFrame(frame); }
  function health(value) { const bar = panel.querySelector('[data-ob-health]'); bar.hidden = !opponent || !['invited','fighting','lost'].includes(phase); bar.setAttribute('aria-valuenow', String(value)); bar.querySelector('i').style.width = value+'%'; panel.querySelector('[data-ob-hp]').textContent = value+'%'; }
  function update() {
    if (!panel) return; const w=words();
    panel.querySelector('[data-ob-title]').textContent=w.title; panel.querySelector('[data-ob-demo]').textContent=w.demo; panel.querySelector('[data-ob-odds]').textContent=w.odds;
    const lang=root.I18N?.lang?.()||'en',short={en:['400 demo BOUNTY','Win chance','Practice rules'],pt:['400 BOUNTY fictícios','Chance de vitória','Regras do treino'],es:['400 BOUNTY ficticios','Probabilidad de victoria','Reglas de práctica'],fil:['400 demo BOUNTY','Tsansang manalo','Mga tuntunin ng ensayo']}[lang]||['400 demo BOUNTY','Win chance','Practice rules'];
    panel.querySelector('[data-ob-cost]').textContent=short[0]+' · '+short[1]+': 40%';panel.querySelector('[data-ob-rules-title]').textContent=short[2];
    panel.querySelector('[data-ob-balance]').textContent=w.balance+': '+balance.toLocaleString(root.I18N?.locale?.()||'en-US')+' BOUNTY';
    panel.querySelector('[data-ob-opponent]').textContent=opponent?w.names[opponent.index]+' · '+w.eras[opponent.era]:'';
    const busy=['fighting','opening'].includes(phase);
    for(const button of panel.querySelectorAll('[data-ob-action]')) { const action=button.dataset.obAction;button.textContent= action==='challenge'?w.challenge+' · 400 demo BOUNTY':w[action];button.hidden=action==='open'?phase!=='box':action==='challenge'?phase!=='invited':action==='repeat'?!['lost','revealed'].includes(phase):action==='find'?!['idle','cancelled'].includes(phase):action==='reset'?balance>=STAKE:action==='close'?phase==='idle':false;button.disabled=busy&&(action==='reset'||action==='repeat'||action==='find')||action==='challenge'&&balance<STAKE; }
    panel.querySelector('[data-ob-health-label]').textContent=w.health;panel.querySelector('[data-ob-health-label]').hidden=!opponent||!['invited','fighting','lost'].includes(phase);panel.querySelector('[data-ob-health]').setAttribute('aria-label',w.health);
    panel.querySelector('[data-ob-collection-title]').textContent=w.collection;panel.querySelector('[data-ob-status]').textContent=w[panel.dataset.obStatus]||'';
    const items=panel.querySelector('[data-ob-collection]');items.replaceChildren();
    for(const item of collection.slice(-12).reverse()) { const card=doc.createElement('div');card.className='obd-character';card.style.setProperty('--ob-rank',rankColor(item.rank));let image=sprite('outlaw',item.era,item.variant,item.rank);if(artReady){const art=doc.createElement('canvas');art.width=40;art.height=48;const size=artStyle()==='arcade'?24:32;if(drawArt('drawReveal',art.getContext('2d'),(40-size)/2,(48-size)/2,{style:artStyle(),rarity:item.rank,scale:1}))image=art;}image.setAttribute('aria-hidden','true');const label=doc.createElement('span');label.textContent=w.loot[item.era]+' · '+rankName(item.rank);card.append(image,label);items.appendChild(card); }
    if(phase==='revealed'&&reward)panel.querySelector('[data-ob-opponent]').textContent=w.loot[reward.era]+' · '+rankName(reward.rank);
  }
  function chooseRank() { const r=Math.random();let sum=0;for(let i=0;i<RANK_ODDS.length;i++){sum+=RANK_ODDS[i];if(r<sum)return i;}return 5; }
  function show() {
    if(root.OutlawsLoopV5?.ownsPresentation?.())return false;
    if(!initialized)init();if(!initialized||['fighting','opening','box'].includes(phase))return false;
    if(!visible()){announce('invisible');return false;}
    cancelWork();interrupted=false;reward=null;lastOutcome=null;const era=currentEra(),variant=Math.random()<.5?0:1;opponent={era,index:era*2+variant,variant};phase='invited';lastInvite=now();
    bossImage=sprite('boss',era,variant);outlawImage=sprite('outlaw',era);announce('invited');update();health(100);draw();sound('bossenter');watchPrefs();const token=generation;later(()=>{if(token===generation&&phase==='invited')stage.hidden=true;},650);return true;
  }
  function challenge() {
    if(phase!=='invited'||!visible())return false;
    if(balance<STAKE){announce('empty');update();return false;}
    root.OutlawsEras?.shift?.(ERA_IDS[opponent.era],{preview:true,persistent:true});
    cancelWork();balance-=STAKE;debited=true;phase='fighting';lastOutcome=Math.random()<WIN_CHANCE?'win':'loss';fightCrew=captureCrew();lastFightCue=0;announce('fight');update();health(100);sound('bossfight');visualLoop(FIGHT_MS,'fighting');
    const token=generation;runFightPresentation(token);
    later(()=>{if(token!==generation)return;cancelWork();debited=false;
      if(lastOutcome==='win'){phase='box';reward={era:opponent.era,variant:opponent.variant,rank:chooseRank(),opened:false,collected:false};outlawImage=sprite('outlaw',reward.era,reward.variant,reward.rank);announce('won');health(0);draw();}
      else{phase='lost';announce('lost');health(28);draw();}
      update();
    },FIGHT_MS);return true;
  }
  function openBox() {
    if(phase!=='box'||!reward||reward.opened)return false;
    cancelWork();reward.opened=true;phase='opening';announce('opening');update();sound('boxreveal',reward.rank);visualLoop(1100,'opening');const token=generation;
    later(()=>{if(token!==generation)return;cancelWork();phase='revealed';collectReward();announce('revealed');update();draw(1);},1100);return true;
  }
  function collectReward() { if(!reward||reward.collected)return;reward.collected=true;collection.push({era:reward.era,variant:reward.variant,rank:reward.rank});while(collection.length>48)collection.shift(); }
  function clear(options = {}) {
    if(!initialized)return false;if(reward&&['box','opening'].includes(phase))collectReward();
    const refund=debited;cancelWork();if(maintenance)root.clearTimeout(maintenance);maintenance=0;root.OutlawsEpochSFX?.stop?.();if(refund)balance+=STAKE;debited=false;phase='idle';opponent=null;reward=null;lastOutcome=null;stage.hidden=true;ctx.clearRect(0,0,W,H);interrupted=Boolean(refund);announce(refund?'interrupted':'idle');update();health(100);return true;
  }
  function restoreCredit() { if(['fighting','opening'].includes(phase))return false;balance=STAKE*3;announce('practice');update();return true; }
  function pauseSchedule() { if(scheduler)root.clearTimeout(scheduler);scheduler=0; }
  function syncPrefs() { if(!initialized)return;for(const animation of animations)animation.cancel();animations.clear();if(raf)root.cancelAnimationFrame(raf);raf=0;if(!effects()){stage.hidden=true;ctx.clearRect(0,0,W,H);root.OutlawsEpochSFX?.stop?.();pauseSchedule();}else if(!doc.hidden){draw(currentProgress());if(phase==='fighting')visualLoop(FIGHT_MS,'fighting',true);if(!scheduler)schedule();} }
  function schedule() { if(scheduler||!initialized||doc.hidden||!effects()||root.OutlawsLoopV5?.ownsPresentation?.())return;const wait=25000+Math.random()*20000;scheduler=root.setTimeout(()=>{scheduler=0;if(phase==='idle'&&visible()&&now()-lastInvite>25000&&effects())show();schedule();},wait); }
  function getState() { const frame=fightFrame(Math.max(0,now()-started));return { enabled:true,demo:true,initialized,phase,battlePhase:phase==='fighting'?frame.stage:null,fightStep:phase==='fighting'?frame.step:null,fightDurationMs:FIGHT_MS,fightElapsedMs:phase==='fighting'?Math.min(FIGHT_MS,now()-started):null,crewSource,crewDraws,crew:fightCrew.map(a=>({...a})),opponent:opponent?{name:combatWords().bosses[opponent.era],era:opponent.era,index:opponent.index}:null,stake:STAKE,winChance:WIN_CHANCE,fictitiousBalance:balance,collectionCount:collection.length,lootRank:reward?.rank??null,reduced:reduced(),effects:effects(),visible:visible(),rafActive:Boolean(raf),pendingTimers:timers.size,randomTimerActive:Boolean(scheduler),maintenanceActive:Boolean(maintenance),artReady:Boolean(artReady&&root.OutlawsEraArt?.getState?.().ready),artDraws,lastOutcome:phase==='fighting'?null:lastOutcome,interrupted }; }
  function init() {
    if(initialized)return true;map=doc.getElementById('heist-map');if(!map)return false;initialized=true;
    const css=doc.createElement('style');css.id='outlaws-boss-demo-style';css.textContent=`
      .obd-panel{margin:10px 0;border:2px solid #796449;background:#211e19;padding:12px;color:var(--text,#e8e0cc);font:13px/1.5 var(--ui,system-ui,sans-serif);box-sizing:border-box;max-width:100%;min-width:0}.obd-panel h3{font-size:15px;margin:0 0 5px;color:#e1ca96}.obd-panel p{margin:5px 0;overflow-wrap:anywhere}.obd-demo,.obd-odds{font-size:12px;color:#c3b79e}.obd-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.obd-actions button{min-width:44px;min-height:44px;padding:10px 12px;border:2px solid #8c7856;background:#342c21;color:#eddbb0;font:inherit;cursor:pointer;white-space:normal;max-width:100%;box-sizing:border-box}.obd-actions button[hidden]{display:none}.obd-actions button:disabled{opacity:.5;cursor:default}.obd-actions button:focus-visible{outline:3px solid #e7ca7e;outline-offset:2px}.obd-status{min-height:22px;color:#e4d4b2}.obd-opponent{font-weight:700;color:#e3c797}.obd-health{height:22px;border:2px solid #b89269;background:#31242a;margin:8px 0;position:relative;overflow:hidden}.obd-health[hidden]{display:none}.obd-health i{display:block;height:100%;background:#a77b62;width:100%}.obd-health span{position:absolute;inset:0;text-align:center;font-size:12px;line-height:22px;color:#fff;text-shadow:1px 1px #281b1c}.obd-stage{position:fixed;pointer-events:none;z-index:30;overflow:hidden;contain:layout paint}.obd-stage[hidden]{display:none}.obd-stage canvas{display:block;width:100%;height:100%;image-rendering:pixelated;box-shadow:none;border:0;background:transparent}.obd-collection{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}.obd-character{display:flex;align-items:center;gap:8px;border:2px solid var(--ob-rank);padding:6px;background:#1a1c23;max-width:100%;box-sizing:border-box}.obd-character canvas{width:40px;height:48px;image-rendering:pixelated;border:0;box-shadow:none;background:transparent}.obd-character span{font-size:12px;overflow-wrap:anywhere}.obd-panel summary{cursor:pointer;min-height:44px;display:flex;align-items:center;font-weight:700}.obd-health-label{font-size:12px;color:#c5b592}
    `;doc.head.appendChild(css);
    panel=doc.createElement('section');panel.id='outlaws-boss-demo';panel.className='obd-panel';panel.setAttribute('aria-labelledby','obd-title');
    panel.innerHTML='<h3 id="obd-title" data-ob-title></h3><p class="obd-demo" data-ob-demo></p><p class="obd-odds" data-ob-odds></p><p data-ob-balance></p><p class="obd-opponent" data-ob-opponent></p><p class="obd-health-label" data-ob-health-label></p><div class="obd-health" data-ob-health role="progressbar" aria-valuemin="0" aria-valuemax="100"><i></i><span data-ob-hp>100%</span></div><p class="obd-status" data-ob-status role="status" aria-live="polite"></p><div class="obd-actions"></div><details><summary data-ob-collection-title></summary><div class="obd-collection" data-ob-collection></div></details>';
    const actions=panel.querySelector('.obd-actions');for(const action of ['find','challenge','open','repeat','close','reset','settings']){const button=doc.createElement('button');button.type='button';button.dataset.obAction=action;actions.appendChild(button);}
    const fightCaption=doc.createElement('p');fightCaption.dataset.obFightCaption='';fightCaption.setAttribute('aria-live','off');fightCaption.hidden=true;actions.before(fightCaption);
    const cost=doc.createElement('p');cost.dataset.obCost='';cost.className='obd-demo';panel.querySelector('h3').after(cost);cost.after(actions);
    const rules=doc.createElement('details'),summary=doc.createElement('summary');summary.dataset.obRulesTitle='';rules.append(summary,panel.querySelector('[data-ob-demo]'),panel.querySelector('[data-ob-odds]'));panel.insertBefore(rules,panel.querySelector('details'));
    map.after(panel);
    stage=doc.createElement('div');stage.id='outlaws-boss-demo-stage';stage.className='obd-stage';stage.hidden=true;stage.setAttribute('aria-hidden','true');canvas=doc.createElement('canvas');canvas.width=W;canvas.height=H;stage.appendChild(canvas);doc.body.appendChild(stage);ctx=canvas.getContext('2d');
    panel.addEventListener('click',event=>{const action=event.target.closest?.('[data-ob-action]')?.dataset.obAction;if(!action)return;if(action==='find'||action==='repeat')show();else if(action==='challenge')challenge();else if(action==='open')openBox();else if(action==='close')clear();else if(action==='reset')restoreCredit();else if(action==='settings'){if(root.OutlawsUIPolish?.openSettings)root.OutlawsUIPolish.openSettings();else{const dialog=doc.getElementById('ajustes');if(dialog?.showModal&&!dialog.open)dialog.showModal();}}});
    doc.addEventListener('visibilitychange',()=>{if(doc.hidden){clear();pauseSchedule();}else schedule();});doc.addEventListener('change',event=>{if(event.target.dataset?.owjSetting)syncPrefs();});media?.addEventListener?.('change',syncPrefs);
    root.addEventListener('scroll',()=>{if(!stage.hidden){if(!visible())clear();else place();}},{passive:true});root.addEventListener('resize',()=>{if(!stage.hidden)place();});root.addEventListener('outlaws:era-change',()=>{if(phase==='invited')clear();else update();});root.I18N?.onChange?.(update);
    if(root.ResizeObserver){resizeObserver=new ResizeObserver(()=>{if(!stage.hidden)place();});resizeObserver.observe(map);}
    root.addEventListener('outlaws:era-art-ready',readyArt);root.addEventListener('outlaws:style-change',()=>{if(panel)update();if(!stage.hidden)draw(phase==='opening'?1:0);});root.OutlawsEraArt?.whenReady?.then(readyArt).catch(()=>{});
    announce('idle');update();health(100);schedule();return true;
  }
  root.OutlawsBossDemo={enabled:true,init,getState,show,challenge,openBox,clear};
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);

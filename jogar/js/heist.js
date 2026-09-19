/*
 * OUTLAWS — o assalto: o mapa onde o bando em serviço quebra caixote e abre baú.
 *
 * É vitrine, não jogo de habilidade. Quanto cada um ganha é o contrato que
 * decide (peso ÷ peso em serviço × emissão da época); os baús só distribuem na
 * tela essa mesma estimativa, e o que vale é o "Sacar" do cartaz.
 *
 * O mapa é FUNÇÃO DO RELÓGIO. Tudo que acontece numa época sai de três coisas:
 * a seed sha256(carteira, época), quem está em serviço nela e o tempo desde o
 * início dela — nada de Math.random na simulação, e o passo é fixo. Ao abrir a
 * página, a época é simulada do começo até agora; por isso F5, outra aba ou
 * outro aparelho mostram o mesmo mapa no mesmo ponto. O bando de uma época não
 * muda no meio dela (turno só começa e termina na virada, e boneco em serviço
 * não troca de dono), então a simulação não tem o que adivinhar. Época nova,
 * assalto novo.
 *
 * Os stats aparecem no jeito de trabalhar: Furtividade é a velocidade, Força o
 * dano por golpe, Pontaria a chance da flecha acertar. Arco e besta atiram de
 * duas casas; o resto bate de perto. O terreno sai do gerador de lib/map.js — o
 * mesmo do Node, conferido pixel a pixel no build.
 *
 *   Heist.mount(canvas)
 *   Heist.update({ key, genesis, epochLength, maxLife,
 *                  outlaws: [{ id, iso, shiftStart, shiftEnd, lifeUsed, perEpoch }] })   // os em serviço
 */
(function (root) {
  'use strict';
  const { map: MAP, rng: RNG, sprite: SP, sha256 } = root.OutlawsLib;

  const T = MAP.TILE; //                        16 px por casa no gerador
  const K = 2; //                               na tela, 1 casa = 32 px: o tamanho do boneco
  const CELL = T * K;
  const DT = 0.05; //                           passo fixo da simulação, igual em qualquer máquina
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const RANGED = new Set(['bow', 'crossbow', 'both']);
  const HIT_EVERY = 0.6, ARROW_TIME = 0.2, TRAP_STUN = 0.9, CLEAR_PAUSE = 1.6;
  const PIXEL = '"Press Start 2P", monospace';
  const t = (k, v) => root.I18N.t(k, v);
  const roomName = (sim) => t('h.room', { terrain: t('terrain.' + sim.room.m.terrain.id).toUpperCase(), n: sim.roomNo + 1 });

  const seedOf = (text) => '0x' + [...sha256(new TextEncoder().encode(text))].map((b) => b.toString(16).padStart(2, '0')).join('');

  /* =================================================== a simulação (pura) */

  /** Casas de nascer: os cantos primeiro, depois o L de cada canto (o gerador deixa todas livres). */
  const spawns = (w, h) => [[1, 1], [w - 2, h - 2], [w - 2, 1], [1, h - 2], [2, 1], [w - 3, h - 2],
    [w - 3, 1], [2, h - 2], [1, 2], [w - 2, h - 3], [w - 2, 2], [1, h - 3]];

  function createSim(key, epoch, crew) {
    const sim = {
      key, epoch, t: 0, roomNo: -1, room: null, emit: null,
      rnd: RNG.stream(seedOf(`assalto:${key}:${epoch}`), 'acao'),
      actors: crew.map((o) => {
        const s = o.iso.stats;
        return {
          id: o.id,
          ranged: RANGED.has(o.iso.cosmetic.gear),
          speed: 2.2 + s.furtividade / 40, //   casas por segundo
          power: s.forca / 20, //                 dano por golpe: Ninguém ~1–2, Lenda ~4–5
          miss: (100 - s.pontaria) / 250, //     chance da flecha errar
          x: 0, y: 0, cx: 0, cy: 0, face: 1, path: [], target: null, state: 'idle',
          cool: 0, stun: 0, shot: null, since: 0,
        };
      }),
    };
    nextRoom(sim);
    return sim;
  }

  const fire = (sim, type, ev) => sim.emit && sim.emit(type, ev);

  function nextRoom(sim) {
    sim.roomNo++;
    const seed = seedOf(`assalto:${sim.key}:${sim.epoch}:${sim.roomNo}`);
    // o assalto viaja: cada sala limpa leva ao terreno seguinte (Estrada → … → Castelo) e recomeça
    const m = MAP.generate(seed, (sim.roomNo % 5) + 1);
    const maxHp = 4 + (m.terrain.id - 1) * 2; // 4 na Estrada … 12 no Castelo: a Força faz diferença
    const hp = new Map(); //                      chaves das casas: y * largura + x
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.grid[y][x] === 'o') hp.set(y * m.w + x, maxHp);
    sim.room = {
      seed, m, hp, maxHp, w: m.w,
      grid: m.grid.map((r) => r.slice()),
      hidden: new Set(m.hidden.map(([x, y]) => y * m.w + x)),
      taken: new Map(), left: hp.size, cleared: 0,
    };
    const spawn = spawns(m.w, m.h);
    sim.actors.forEach((a, i) => {
      const [x, y] = spawn[i % spawn.length];
      Object.assign(a, { x, y, px: x, py: y, cx: x, cy: y, path: [], target: null, state: 'idle', cool: 0, stun: 0, shot: null });
    });
    fire(sim, 'room', {});
  }

  function release(sim, a) {
    if (a.target && sim.room.taken.get(a.target.k) === a.id) sim.room.taken.delete(a.target.k);
    a.target = null;
  }

  /** De que casa dá pra bater em quê: do lado, ou a duas casas com o arco e o caminho livre. */
  function aimFrom(sim, a, x, y, share) {
    const g = sim.room.grid, w = sim.room.w, taken = sim.room.taken;
    for (const [dx, dy] of DIRS) {
      const tx = x + dx, ty = y + dy, k = ty * w + tx, c = g[ty]?.[tx];
      if ((c === 'o' || c === '$') && (share || !taken.has(k))) return { x: tx, y: ty, k };
    }
    if (a.ranged) {
      for (const [dx, dy] of DIRS) {
        const tx = x + 2 * dx, ty = y + 2 * dy, k = ty * w + tx;
        if (g[ty]?.[tx] === 'o' && g[y + dy][x + dx] === '.' && (share || !taken.has(k))) return { x: tx, y: ty, k };
      }
    }
    return null;
  }

  /**
   * Busca em largura até a casa mais perto de onde dá pra bater. Primeiro um
   * alvo que ninguém pegou; se não houver, pisa em armadilha; se ainda não
   * houver, ajuda a quebrar o de outro. Sem alvo nenhum, espera meio segundo
   * antes de procurar de novo.
   */
  function plan(sim, a) {
    release(sim, a);
    const r = sim.room, g = r.grid, w = r.w;
    for (const [traps, share] of [[false, false], [true, false], [true, true]]) {
      const from = new Int32Array(w * r.m.h).fill(-2);
      const start = a.cy * w + a.cx;
      from[start] = -1;
      const queue = [start];
      for (let qi = 0; qi < queue.length; qi++) {
        const at = queue[qi], x = at % w, y = (at - x) / w;
        const hit = aimFrom(sim, a, x, y, share);
        if (hit) {
          const path = [];
          for (let k = at; from[k] !== -1; k = from[k]) path.unshift([k % w, Math.floor(k / w)]);
          a.path = path;
          a.target = hit;
          if (!share) r.taken.set(hit.k, a.id);
          a.state = 'walk';
          return true;
        }
        for (const [dx, dy] of DIRS) {
          const nx = x + dx, ny = y + dy, k = ny * w + nx, c = g[ny]?.[nx];
          if (from[k] !== -2 || !(c === '.' || (traps && c === '~'))) continue;
          from[k] = at;
          queue.push(k);
        }
      }
    }
    a.state = 'idle';
    a.cool = 0.5;
    return false;
  }

  const alive = (sim, t) => {
    const c = sim.room.grid[t.y][t.x];
    return c === 'o' || c === '$';
  };

  function walk(sim, a) {
    if (!alive(sim, a.target)) return void ((a.state = 'idle'), release(sim, a));
    if (!a.path.length) {
      a.state = 'hit';
      a.cool = 0.12;
      if (a.target.x !== a.cx) a.face = Math.sign(a.target.x - a.cx);
      return;
    }
    const [nx, ny] = a.path[0];
    const dx = nx - a.x, dy = ny - a.y;
    const d = Math.abs(dx) + Math.abs(dy); // sempre em linha reta de casa pra casa vizinha
    const s = a.speed * DT;
    if (dx) a.face = Math.sign(dx);
    if (d > s) {
      a.x += (dx / d) * s;
      a.y += (dy / d) * s;
      return;
    }
    a.x = a.cx = nx;
    a.y = a.cy = ny;
    a.path.shift();
    if (sim.room.grid[ny][nx] === '~') {
      a.stun = TRAP_STUN;
      fire(sim, 'trap', { a });
    }
  }

  function hit(sim, a) {
    const t = a.target;
    if (!alive(sim, t)) return void ((a.state = 'idle'), release(sim, a));
    a.cool -= DT;
    if (a.cool > 0) return;
    a.cool = HIT_EVERY;
    if (a.ranged && sim.room.grid[t.y][t.x] === 'o') {
      const miss = sim.rnd.float() < a.miss;
      a.shot = { t, miss, left: ARROW_TIME };
      fire(sim, 'arrow', { a, t, miss });
    } else {
      fire(sim, 'slash', { a, t });
      damage(sim, a, t);
    }
  }

  function damage(sim, a, t) {
    const r = sim.room;
    if (!alive(sim, t)) return;
    if (r.grid[t.y][t.x] === '$') { //          abrir o baú
      r.grid[t.y][t.x] = '.';
      r.left--;
      fire(sim, 'open', { a, t, elapsed: sim.t - a.since });
      a.since = sim.t;
      a.state = 'idle';
      return release(sim, a);
    }
    const hp = r.hp.get(t.k) - a.power;
    fire(sim, 'chip', { t, dmg: a.power });
    if (hp > 0) return void r.hp.set(t.k, hp);
    r.hp.delete(t.k);
    if (r.hidden.has(t.k)) {
      r.grid[t.y][t.x] = '$'; //                 o baú salta de dentro; alguém vem abrir
      fire(sim, 'reveal', { t });
    } else {
      r.grid[t.y][t.x] = '.';
      r.left--;
      fire(sim, 'break', { t });
    }
    a.state = 'idle';
    release(sim, a);
  }

  function tick(sim) {
    sim.t += DT;
    for (const a of sim.actors) {
      a.px = a.x; //                             de onde saiu neste passo (o desenho interpola)
      a.py = a.y;
      if (a.shot && (a.shot.left -= DT) <= 0) {
        const s = a.shot;
        a.shot = null;
        if (s.miss) fire(sim, 'miss', { t: s.t });
        else damage(sim, a, s.t);
      }
      if (a.stun > 0) {
        a.stun -= DT;
        continue;
      }
      if (a.state === 'idle' && ((a.cool -= DT) > 0 || !plan(sim, a))) continue;
      if (a.state === 'walk') walk(sim, a);
      else if (a.state === 'hit') hit(sim, a);
    }
    const r = sim.room;
    if (r.left <= 0 && (r.cleared += DT) >= CLEAR_PAUSE) nextRoom(sim);
  }

  /** Anda até `seconds` desde o início da época, em passos fixos. */
  function advance(sim, seconds) {
    while (sim.t + DT <= seconds) tick(sim);
  }

  /* ====================================================== o desenho */
  let cv = null, ctx = null, running = false, last = 0;
  let data = null, sim = null, simSig = '';
  const looks = new Map(); //                    id -> sprite (normal e espelhado)
  let art = null; //                             ladrilhos da sala em curso
  const vis = new Map(); //                      id -> { t, swing } (só animação)
  let fx = [], shake = new Map(), born = new Map();

  const fmt = (n) => n.toLocaleString(root.I18N.locale(), { maximumFractionDigits: n < 10 ? 2 : n < 100 ? 1 : 0 });
  const rand = (a, b) => a + Math.random() * (b - a); // só efeito visual, nunca na simulação
  function dur(sec) {
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
  }

  function bitmap(w, h, paint) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const x = c.getContext('2d');
    const img = x.createImageData(w, h);
    paint(img.data);
    x.putImageData(img, 0, 0);
    return c;
  }

  /**
   * O boneco com um contorno de 1 pixel na cor da raridade (34×34: o sprite no
   * meio). Uma versão por cor — a Lenda tem duas e o desenho alterna.
   */
  function look(o) {
    if (looks.has(o.id)) return looks.get(o.id);
    const grid = SP.build(o.iso), pal = SP.palette(o.iso);
    const on = (x, y) => x >= 0 && y >= 0 && x < SP.W && y < SP.H && grid[y][x] !== '.' && !!pal[grid[y][x]];
    const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const frames = o.iso.rank.rarity.map((color) => {
      const rc = hex(color);
      const img = bitmap(SP.W + 2, SP.H + 2, (px) => {
        for (let y = -1; y <= SP.H; y++)
          for (let x = -1; x <= SP.W; x++) {
            const i = ((y + 1) * (SP.W + 2) + x + 1) * 4;
            let c = null;
            if (on(x, y)) c = pal[grid[y][x]];
            else if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) c = rc;
            if (!c) continue;
            [px[i], px[i + 1], px[i + 2]] = c;
            px[i + 3] = 255;
          }
      });
      const flip = document.createElement('canvas');
      flip.width = img.width;
      flip.height = img.height;
      const f = flip.getContext('2d');
      f.scale(-1, 1);
      f.drawImage(img, -img.width, 0);
      return { img, flip };
    });
    looks.set(o.id, frames);
    return frames;
  }

  /** Ladrilhos da sala: chão, árvores/pedras e armadilhas num desenho só; caixote e baú vão por cima. */
  function roomArt(room) {
    if (art && art.seed === room.seed) return art;
    const m = room.m, rnd = RNG.stream(room.seed, 'render');
    const base = bitmap(m.w * T, m.h * T, (px) => {
      for (let y = 0; y < m.h; y++)
        for (let x = 0; x < m.w; x++) {
          const k = m.grid[y][x];
          MAP.drawTile(px, m.w * T, x * T, y * T, k === '#' || k === '~' ? k : '.', m.terrain, rnd);
        }
    });
    const tile = (kind) => bitmap(T, T, (px) => MAP.drawTile(px, T, 0, 0, kind, m.terrain, RNG.stream(room.seed, kind)));
    art = { seed: room.seed, base, crate: tile('o'), chest: tile('$') };
    if (cv.width !== m.w * CELL || cv.height !== m.h * CELL) {
      cv.width = m.w * CELL;
      cv.height = m.h * CELL;
      fit();
    }
    return art;
  }

  const byId = (id) => data.outlaws.find((o) => o.id === id);
  const perSec = (id) => (byId(id)?.perEpoch || 0) / data.epochLength;
  const center = (c) => (c + 0.5) * CELL;

  /** Eventos da simulação viram efeito na tela (e só quando é ao vivo, não no avanço rápido). */
  function onEvent(type, ev) {
    const t = ev.t, v = ev.a && vis.get(ev.a.id);
    if (v && (type === 'slash' || type === 'arrow')) v.swing = 0.14;
    if (type === 'room') {
      shake = new Map();
      born = new Map();
      fx = fx.filter((f) => f.kind === 'text');
      fx.push({ kind: 'banner', text: roomName(sim), age: 0, life: 1.8 });
    } else if (type === 'arrow') {
      fx.push({
        kind: 'arrow', age: 0, life: ARROW_TIME,
        x0: center(ev.a.cx), y0: center(ev.a.cy) - 2,
        x1: center(t.x) + (ev.miss ? rand(-12, 12) : 0), y1: center(t.y) + (ev.miss ? rand(-12, 12) : 0),
      });
    } else if (type === 'slash') {
      fx.push({ kind: 'slash', age: 0, life: 0.14, x: center(ev.a.cx), y: center(ev.a.cy), ang: Math.atan2(t.y - ev.a.cy, t.x - ev.a.cx) });
    } else if (type === 'chip') {
      shake.set(t.k, 0.18);
      burst(t.x, t.y, 'chip', 3);
      // o dano do golpe sobe do caixote: dá pra ver quem bate forte
      say(t.x, t.y + 0.35, '-' + ev.dmg.toLocaleString(root.I18N.locale(), { maximumFractionDigits: 1 }), '#E8E0CC');
    } else if (type === 'break') {
      burst(t.x, t.y, 'chip', 12);
    } else if (type === 'reveal') {
      burst(t.x, t.y, 'chip', 12);
      burst(t.x, t.y, 'spark', 6);
      born.set(t.k, performance.now());
    } else if (type === 'open') {
      burst(t.x, t.y, 'coin', 14);
      say(t.x, t.y, '+' + fmt(perSec(ev.a.id) * ev.elapsed), '#F2CE7E', true);
    } else if (type === 'miss') {
      say(t.x, t.y, root.I18N.t('h.miss'), '#949D86');
    } else if (type === 'trap') {
      say(ev.a.cx, ev.a.cy, root.I18N.t('h.ouch'), '#F2A493');
    }
  }

  const COLORS = { chip: ['#92683E', '#B98A57', '#5E3F22'], coin: ['#EBBE46', '#FFEC9F', '#C99A2E'], spark: ['#FFF6D0', '#F2CE7E'] };
  function burst(x, y, kind, n) {
    for (let i = 0; i < n; i++) {
      fx.push({
        kind, age: 0, life: kind === 'coin' ? rand(0.7, 1.1) : rand(0.35, 0.7),
        x: center(x) + rand(-6, 6), y: center(y) + rand(-6, 6),
        vx: rand(-90, 90), vy: -(kind === 'coin' ? rand(160, 260) : rand(60, 170)),
        color: COLORS[kind][i % COLORS[kind].length],
      });
    }
  }
  function say(x, y, text, color, big = false) {
    fx.push({ kind: 'text', text, color, big, age: 0, life: big ? 1.6 : 0.9, x: center(x), y: y * CELL });
  }

  function text(s, x, y, color, size = 8, align = 'left') {
    ctx.font = `${size}px ${PIXEL}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#0B0F08';
    for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) ctx.fillText(s, x + ox, y + oy);
    ctx.fillStyle = color;
    ctx.fillText(s, x, y);
  }

  /** Rachaduras que crescem com o dano. */
  const CRACK = [[8, 6], [7, 7], [7, 8], [6, 9], [9, 8], [10, 9], [10, 10], [5, 10], [11, 11], [4, 11], [8, 11], [8, 12]];

  function drawRoom(now) {
    const r = sim.room, a = roomArt(r);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(a.base, 0, 0, a.base.width * K, a.base.height * K);
    for (let y = 0; y < r.m.h; y++) {
      for (let x = 0; x < r.m.w; x++) {
        const c = r.grid[y][x];
        if (c !== 'o' && c !== '$') continue;
        const k = y * r.w + x;
        const ox = shake.has(k) ? Math.round(rand(-2, 2)) : 0;
        if (c === 'o') {
          ctx.drawImage(a.crate, x * CELL + ox, y * CELL, CELL, CELL);
          const n = Math.floor((1 - r.hp.get(k) / r.maxHp) * CRACK.length);
          ctx.fillStyle = '#2A1A0C';
          for (let i = 0; i < n; i++) ctx.fillRect(x * CELL + ox + CRACK[i][0] * K, y * CELL + CRACK[i][1] * K, K, K);
        } else {
          const b = born.get(k);
          const p = b === undefined ? 1 : Math.min(1, (now - b) / 350);
          const oy = -Math.round(Math.sin(p * Math.PI) * 10);
          ctx.drawImage(a.chest, x * CELL, y * CELL + oy, CELL, CELL);
          if (Math.sin(now / 330 + x + y) > 0.85) { //  brilho de vez em quando
            ctx.fillStyle = '#FFF6D0';
            ctx.fillRect(x * CELL + 9, y * CELL + 11 + oy, 2, 2);
          }
        }
      }
    }
  }

  /** Vida contínua, em épocas: desce durante o turno e bate com o contrato na virada. */
  function lifeNow(o, nowEpochs) {
    const worked = Math.min(Math.max(nowEpochs - o.shiftStart, 0), o.shiftEnd - o.shiftStart);
    return Math.max(0, data.maxLife - o.lifeUsed - worked);
  }

  function drawOutlaw(o, x, y, st) {
    const px = x * CELL, py = y * CELL;
    const frames = look(o), v = vis.get(o.id);
    const lk = frames[frames.length > 1 ? Math.floor(performance.now() / 700) % frames.length : 0];
    const moving = st.working && st.a.state === 'walk' && st.a.stun <= 0;
    const bob = moving ? -Math.abs(Math.sin(v.t * 12)) * 3 : Math.sin(v.t * 2.2);
    let lx = 0, ly = 0;
    if (v.swing > 0 && st.a?.target) { //         avança no golpe
      const p = v.swing / 0.14;
      lx = Math.sign(st.a.target.x - st.a.cx) * 4 * p;
      ly = Math.sign(st.a.target.y - st.a.cy) * 4 * p;
    }
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath();
    ctx.ellipse(px + CELL / 2, py + CELL - 3, 10, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = st.working ? 1 : 0.55;
    ctx.drawImage(st.a && st.a.face < 0 ? lk.flip : lk.img, Math.round(px - 1 + lx), Math.round(py - 6 + bob + ly)); // -1: o contorno
    ctx.globalAlpha = 1;

    // barra de vida sobre a cabeça
    const life = lifeNow(o, st.nowEpochs) / data.maxLife;
    const bx = Math.round(px + 5), by = Math.round(py - 9), bw = CELL - 10;
    ctx.fillStyle = '#0B0F08';
    ctx.fillRect(bx - 1, by - 1, bw + 2, 5);
    ctx.fillStyle = life > 0.5 ? '#6E9A42' : life > 0.2 ? '#C99A2E' : '#B4462F';
    ctx.fillRect(bx, by, Math.max(1, Math.round(bw * life)), 3);

    if (!st.working) text(t('h.in', { t: dur(data.genesis + o.shiftStart * data.epochLength - Date.now() / 1000) }), px + CELL / 2, py - 21, '#F2CE7E', 7, 'center');
    if (st.a && st.a.stun > 0) text('*', px + CELL / 2 + Math.sin(v.t * 14) * 6, py - 20, '#FFF6D0', 8, 'center');
  }

  function drawFx(f) {
    const p = f.age / f.life;
    if (f.kind === 'chip' || f.kind === 'coin' || f.kind === 'spark') {
      ctx.globalAlpha = 1 - Math.max(0, p - 0.6) / 0.4;
      ctx.fillStyle = f.color;
      const s = f.kind === 'coin' ? 4 : 3;
      ctx.fillRect(Math.round(f.x), Math.round(f.y), s, s);
      if (f.kind === 'coin') {
        ctx.fillStyle = '#FFF6D0';
        ctx.fillRect(Math.round(f.x), Math.round(f.y), 2, 2);
      }
      ctx.globalAlpha = 1;
    } else if (f.kind === 'arrow') {
      const x = f.x0 + (f.x1 - f.x0) * p, y = f.y0 + (f.y1 - f.y0) * p;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.atan2(f.y1 - f.y0, f.x1 - f.x0));
      ctx.fillStyle = '#8C6A3A';
      ctx.fillRect(-12, -1, 12, 2);
      ctx.fillStyle = '#D8DCE2';
      ctx.fillRect(0, -2, 3, 4);
      ctx.fillStyle = '#E8E0CC';
      ctx.fillRect(-14, -2, 3, 1);
      ctx.fillRect(-14, 1, 3, 1);
      ctx.restore();
    } else if (f.kind === 'slash') {
      ctx.strokeStyle = `rgba(255,250,235,${1 - p})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(f.x + Math.cos(f.ang) * 12, f.y + Math.sin(f.ang) * 12, 13, f.ang - 1.1, f.ang + 1.1);
      ctx.stroke();
    } else if (f.kind === 'text') {
      ctx.globalAlpha = 1 - Math.max(0, p - 0.7) / 0.3;
      text(f.text, f.x, f.y - 6 - p * 22, f.color, f.big ? 10 : 7, 'center');
      ctx.globalAlpha = 1;
    } else if (f.kind === 'banner') {
      ctx.globalAlpha = Math.min(1, (1 - p) * 3);
      ctx.fillStyle = 'rgba(11,15,8,.7)';
      ctx.fillRect(0, cv.height / 2 - 20, cv.width, 40);
      text(f.text, cv.width / 2, cv.height / 2 - 6, '#F2CE7E', 12, 'center');
      ctx.globalAlpha = 1;
    }
  }

  function draw(now, crew, waiting, nowEpochs, alpha) {
    drawRoom(now);
    const spots = spawns(sim.room.m.w, sim.room.m.h);
    const list = [
      ...crew.map((o) => ({ o, a: sim.actors.find((a) => a.id === o.id), working: true })),
      ...waiting.map((o, i) => { const [x, y] = spots[(crew.length + i) % spots.length]; return { o, x, y, working: false }; }),
    ];
    for (const st of list) {
      if (!vis.has(st.o.id)) vis.set(st.o.id, { t: st.o.id * 1.7, swing: 0 });
      st.x = st.a ? st.a.px + (st.a.x - st.a.px) * alpha : st.x;
      st.y = st.a ? st.a.py + (st.a.y - st.a.py) * alpha : st.y;
      st.nowEpochs = nowEpochs;
    }
    list.sort((p, q) => p.y - q.y);
    for (const st of list) drawOutlaw(st.o, st.x, st.y, st);
    for (const f of fx) drawFx(f);

    // letreiro de cima
    ctx.fillStyle = 'rgba(11,15,8,.72)';
    ctx.fillRect(0, 0, cv.width, 22);
    text(roomName(sim), 8, 7, '#DCE0D2', 8);
    if (crew.length) {
      const total = crew.reduce((s, o) => s + o.perEpoch, 0);
      text(t('h.perEpoch', { v: fmt(total) }), cv.width - 8, 7, '#F2CE7E', 8, 'right');
    }
    if (!crew.length && !waiting.length) {
      ctx.fillStyle = 'rgba(11,15,8,.66)';
      ctx.fillRect(0, 0, cv.width, cv.height);
      text(t('h.none'), cv.width / 2, cv.height / 2 - 16, '#F2CE7E', 10, 'center');
      text(t('h.noneSub'), cv.width / 2, cv.height / 2 + 6, '#DCE0D2', 7, 'center');
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    if (!data || !cv.isConnected || cv.closest('[hidden]')) return;

    // que época é agora, pelo relógio, e quem trabalha nela
    const clock = Date.now() / 1000;
    const nowEpochs = (clock - data.genesis) / data.epochLength;
    const epoch = Math.floor(nowEpochs);
    const crew = data.outlaws.filter((o) => o.shiftStart <= epoch && epoch < o.shiftEnd).sort((p, q) => p.id - q.id);
    const waiting = data.outlaws.filter((o) => o.shiftStart > epoch).sort((p, q) => p.id - q.id);

    const sig = `${data.key}:${epoch}:${crew.map((o) => o.id).join(',')}`;
    if (sig !== simSig) {
      sim = createSim(data.key, epoch, crew);
      simSig = sig;
      fx = [];
      shake = new Map();
      born = new Map();
    }
    // avança até agora: o atraso grande (página recém-aberta, aba escondida) vai sem efeitos
    const target = Math.min(clock - (data.genesis + epoch * data.epochLength), data.epochLength);
    if (target - sim.t > 1) {
      sim.emit = null;
      advance(sim, target - 0.2);
    }
    sim.emit = onEvent;
    advance(sim, target);

    for (const v of vis.values()) {
      v.t += dt;
      v.swing = Math.max(0, v.swing - dt);
    }
    for (const [k, s] of shake) (s - dt > 0 ? shake.set(k, s - dt) : shake.delete(k));
    for (const f of fx) {
      f.age += dt;
      if (f.vy !== undefined) {
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.vy += 520 * dt;
      }
    }
    fx = fx.filter((f) => f.age < f.life);
    draw(now, crew, waiting, nowEpochs, Math.min(1, Math.max(0, (target - sim.t) / DT)));
  }

  /** Cabe na coluna e em ~60% da altura da tela, sem passar de 2x. */
  function fit() {
    if (!cv || !cv.parentElement) return;
    const s = Math.min(cv.parentElement.clientWidth / cv.width, (innerHeight * 0.6) / cv.height, 2);
    cv.style.width = Math.floor(cv.width * s) + 'px';
  }

  /* ---------------------------------------------------------------- API */
  function mount(canvas) {
    cv = canvas;
    ctx = cv.getContext('2d');
    addEventListener('resize', fit);
  }

  function update(p) {
    if (!cv) return;
    if (data && data.key !== p.key) simSig = ''; //  outra carteira: outro assalto
    data = p;
    fit();
    if (!running) {
      running = true;
      requestAnimationFrame(frame);
    }
  }

  root.Heist = { mount, update, _sim: { createSim, advance } }; // _sim: pra conferir o determinismo
})(window);

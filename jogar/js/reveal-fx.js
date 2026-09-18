/*
 * OUTLAWS — as revelações animadas: o baú que abre e a fusão.
 *
 * Desenhado por código, em canvas, no mesmo pixel do resto do jogo — nada de GIF
 * pronto, porque a cor muda com o que saiu. A luz que vaza pelas frestas do baú
 * já é a cor da maior raridade do saco: o jogador sente antes de ver. A cena é
 * só a cena: quando ela começa, o resultado já está decidido na blockchain (vem
 * do recibo da transação).
 *
 *   const show = RevealFX.play(canvas, spec)
 *   await show.revealed    // o estouro: hora de mostrar os cartazes
 *   show.skip()            // pula pro estouro
 *   show.stop()            // a janela fechou
 *
 *   spec = { kind: 'chest', rarity }
 *        | { kind: 'fusion', a: iso, b: iso, outcome: 0 sucesso | 1 falha | 2 crítica, born: iso | null, rarity }
 */
(function (root) {
  'use strict';
  const SP = root.OutlawsLib.sprite;

  /** Cor de cada raridade (rank 0..5): a escala que todo jogador já conhece. */
  const RARITY = ['#A7ADB2', '#6CC24A', '#4AA3F0', '#B06CF0', '#F5A623', '#FF4F5E'];
  const MYTHIC_ALT = '#FFD166'; //  a Lenda alterna vermelho e ouro
  const W = 360, H = 220; //         tamanho lógico do palco
  const TAU = Math.PI * 2;

  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const rgba = (hex, a) => `rgba(${rgb(hex).join(',')},${Math.max(0, Math.min(1, a))})`;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const easeOutBack = (p) => 1 + 2.7 * (p - 1) ** 3 + 1.7 * (p - 1) ** 2;

  /* ------------------------------------------------------------ sprites */
  function spriteOf(iso) {
    const grid = SP.build(iso), pal = SP.palette(iso);
    const c = document.createElement('canvas');
    c.width = SP.W;
    c.height = SP.H;
    const x = c.getContext('2d');
    const img = x.createImageData(SP.W, SP.H);
    for (let y = 0; y < SP.H; y++)
      for (let i = 0; i < SP.W; i++) {
        const ch = grid[y][i], o = (y * SP.W + i) * 4;
        if (ch === '.' || !pal[ch]) continue;
        [img.data[o], img.data[o + 1], img.data[o + 2]] = pal[ch];
        img.data[o + 3] = 255;
      }
    x.putImageData(img, 0, 0);
    return c;
  }

  function drawSprite(ctx, spr, cx, cy, s, alpha = 1) {
    if (s <= 0) return;
    ctx.globalAlpha = alpha;
    ctx.drawImage(spr, Math.round(cx - 16 * s), Math.round(cy - 16 * s), Math.round(32 * s), Math.round(32 * s));
    ctx.globalAlpha = 1;
  }

  /** Um sprite que se desfaz em pó: cada pixel vira uma partícula, de cima pra baixo. */
  function dust(spr, cx, cy, s) {
    const d = spr.getContext('2d').getImageData(0, 0, SP.W, SP.H).data, out = [];
    for (let y = 0; y < SP.H; y++)
      for (let x = 0; x < SP.W; x++) {
        const o = (y * SP.W + x) * 4;
        if (!d[o + 3]) continue;
        out.push({
          x: cx + (x - 16) * s, y: cy + (y - 16) * s, vx: rand(-30, 30), vy: rand(-70, -10),
          delay: (y / SP.H) * 0.45 + rand(0, 0.12), life: rand(0.7, 1.2), age: 0, size: s,
          color: `rgb(${d[o]},${d[o + 1]},${d[o + 2]})`,
        });
      }
    return out;
  }

  /* ------------------------------------------------------------ efeitos comuns */
  function rays(ctx, cx, cy, color, t, strength, alt) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const n = 12, len = 260;
    for (let i = 0; i < n; i++) {
      const a = t * 0.55 + (i * TAU) / n, w = 0.11 + 0.03 * Math.sin(t * 2 + i);
      const c = alt && i % 2 ? alt : color;
      const g = ctx.createRadialGradient(cx, cy, 6, cx, cy, len);
      g.addColorStop(0, rgba(c, 0.55 * strength));
      g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a - w) * len, cy + Math.sin(a - w) * len);
      ctx.lineTo(cx + Math.cos(a + w) * len, cy + Math.sin(a + w) * len);
      ctx.closePath();
      ctx.fill();
    }
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, 90);
    halo.addColorStop(0, rgba(color, 0.6 * strength));
    halo.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(cx - 90, cy - 90, 180, 180);
    ctx.restore();
  }

  /** Apaga o que foi desenhado até aqui (os raios) num degradê até a borda: a cena não tem quina. */
  function fadeEdges(ctx, cx, cy) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    const r = Math.min(cy, H - cy, cx) + 6;
    const g = ctx.createRadialGradient(cx, cy, r * 0.45, cx, cy, r);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  /** Clarão redondo, que some antes da borda (pintar o quadro inteiro mostraria a caixa da cena). */
  function flash(ctx, cx, cy, color, a) {
    if (a <= 0) return;
    const r = Math.min(cy, H - cy, cx) + 6;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, rgba(color, a));
    g.addColorStop(0.55, rgba(color, a * 0.6));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  /** Faísca em cruz de pixel, que pisca enquanto sobe. */
  function sparkle(ctx, p) {
    const k = 1 - p.age / p.life, arm = Math.round((1 + Math.sin(p.age * 18 + p.seed) * 0.5) * p.size);
    ctx.globalAlpha = clamp01(k * 1.4);
    ctx.fillStyle = p.color;
    const x = Math.round(p.x), y = Math.round(p.y), u = 2;
    ctx.fillRect(x - u / 2, y - u / 2 - arm * u, u, u * (arm * 2 + 1));
    ctx.fillRect(x - u / 2 - arm * u, y - u / 2, u * (arm * 2 + 1), u);
    ctx.globalAlpha = 1;
  }

  function spark(list, cx, cy, color, n, speed = 1) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), v = rand(40, 160) * speed;
      list.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: rand(0.6, 1.3), age: 0, size: rand(1, 3), seed: rand(0, 9), color: Math.random() < 0.3 ? '#FFFFFF' : color });
    }
  }

  function step(list, dt, gravity = 60) {
    for (const p of list) {
      p.age += dt;
      if (p.delay && p.age < p.delay) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += gravity * dt;
    }
    return list.filter((p) => p.age < (p.delay || 0) + p.life);
  }

  /* ------------------------------------------------------------ o baú */
  const WOOD = { out: '#1A0F08', wood: '#8A5A2B', woodD: '#5E3A1A', woodL: '#B07A3E', gold: '#E9B949', goldL: '#FFE08A', goldD: '#A8781F', cav: '#0B0705', lid: '#4A2C12' };

  /** Baú de 32×28 casas, fechado ou aberto, com a luz da raridade vazando. */
  function drawChest(ctx, cx, cy, s, open, color, leak, t) {
    const ox = Math.round(cx - 16 * s), oy = Math.round(cy - 14 * s);
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(ox + x * s, oy + y * s, w * s, h * s); };
    // corpo
    R(2, 12, 28, 16, WOOD.out);
    R(3, 13, 26, 14, WOOD.wood);
    R(3, 17, 26, 1, WOOD.woodD);
    R(3, 21, 26, 1, WOOD.woodD);
    R(3, 26, 26, 1, WOOD.woodD);
    R(7, 13, 2, 14, WOOD.gold);
    R(8, 13, 1, 14, WOOD.goldD);
    R(23, 13, 2, 14, WOOD.gold);
    R(24, 13, 1, 14, WOOD.goldD);
    if (!open) {
      // tampa fechada, arredondada
      R(6, 3, 20, 1, WOOD.out);
      R(4, 4, 24, 1, WOOD.out);
      R(2, 5, 28, 8, WOOD.out);
      R(7, 4, 18, 1, WOOD.woodL);
      R(5, 5, 22, 1, WOOD.woodL);
      R(3, 6, 26, 5, WOOD.wood);
      R(3, 6, 26, 1, WOOD.woodL);
      R(7, 4, 2, 7, WOOD.gold);
      R(23, 4, 2, 7, WOOD.gold);
      R(3, 11, 26, 2, WOOD.gold);
      R(3, 11, 26, 1, WOOD.goldL);
      // fechadura
      R(13, 9, 6, 7, WOOD.out);
      R(14, 10, 4, 5, WOOD.gold);
      R(14, 10, 4, 1, WOOD.goldL);
      R(15, 12, 2, 2, WOOD.cav);
      // a luz que vaza pelas frestas
      if (leak > 0) {
        const pulse = 0.65 + 0.35 * Math.sin(t * 22);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        R(3, 13, 26, 1, rgba(color, leak * pulse));
        R(15, 12, 2, 2, rgba(color, Math.min(1, leak * 1.4)));
        const g = ctx.createRadialGradient(cx, oy + 13 * s, 2, cx, oy + 13 * s, 70 * leak + 10);
        g.addColorStop(0, rgba(color, 0.45 * leak));
        g.addColorStop(1, rgba(color, 0));
        ctx.fillStyle = g;
        ctx.fillRect(cx - 90, oy - 20, 180, 120);
        ctx.restore();
      }
    } else {
      // tampa aberta pra trás: o lado de dentro aparece, com a borda dourada
      R(2, 0, 28, 12, WOOD.out);
      R(3, 1, 26, 1, WOOD.gold);
      R(3, 2, 26, 9, WOOD.lid);
      R(3, 10, 26, 1, WOOD.woodD);
      R(3, 11, 26, 1, WOOD.goldL);
      // o interior, aceso
      R(3, 12, 26, 4, WOOD.cav);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      R(4, 12, 24, 3, rgba(color, 0.9));
      R(6, 12, 20, 2, rgba('#FFFFFF', 0.55));
      ctx.restore();
    }
  }

  function chestScene(spec) {
    const color = RARITY[spec.rarity] || RARITY[0];
    const alt = spec.rarity === 5 ? MYTHIC_ALT : null;
    const BURST = 1.6, S = 5, cx = W / 2, cy = H / 2 + 22;
    let fx = [], burst = false;
    return {
      burst: BURST,
      end: BURST + 1.2,
      draw(ctx, t, dt) {
        ctx.clearRect(0, 0, W, H);
        const mouth = cy - 2 * S;
        if (t < BURST) {
          // tremendo cada vez mais, a luz subindo; um pulinho no fim
          const k = t / BURST, amp = k * k * 2.2;
          const dx = Math.sin(t * 55) * amp * S * 0.5, hop = k > 0.85 ? -Math.sin(((k - 0.85) / 0.15) * Math.PI) * 6 : 0;
          drawChest(ctx, cx + dx, cy + hop, S, false, color, k * k, t);
          return;
        }
        if (!burst) {
          burst = true;
          spark(fx, cx, mouth, color, 46, 1.2);
          if (alt) spark(fx, cx, mouth, alt, 24, 1.1);
        }
        const since = t - BURST;
        rays(ctx, cx, mouth, color, t, clamp01(since / 0.35) * (0.85 + 0.15 * Math.sin(t * 3)), alt);
        fadeEdges(ctx, cx, mouth);
        const bob = Math.sin(t * 2.4) * 1.5;
        drawChest(ctx, cx, cy + bob, S, true, color, 0, t);
        if (Math.random() < 0.18) spark(fx, cx + rand(-40, 40), mouth - rand(0, 20), Math.random() < 0.5 && alt ? alt : color, 1, 0.4);
        fx = step(fx, dt);
        for (const p of fx) sparkle(ctx, p);
        if (since < 0.45) flash(ctx, cx, mouth, '#FFFFFF', 0.9 * (1 - since / 0.45)); // o clarão
      },
    };
  }

  /* ------------------------------------------------------------ a fusão */
  const MAGIC = '#A58BDB';

  function fusionScene(spec) {
    const sa = spriteOf(spec.a), sb = spriteOf(spec.b), born = spec.born ? spriteOf(spec.born) : null;
    const good = spec.outcome === 0, crit = spec.outcome === 2;
    const color = good ? RARITY[spec.rarity] || RARITY[0] : crit ? '#FF3B3B' : '#C9C9C9';
    const alt = good && spec.rarity === 5 ? MYTHIC_ALT : null;
    const BURST = 2.1, cx = W / 2, cy = H / 2 + 6;
    let fx = [], ashes = [], burst = false;
    return {
      burst: BURST,
      end: BURST + 1.6,
      draw(ctx, t, dt) {
        ctx.clearRect(0, 0, W, H);
        ctx.imageSmoothingEnabled = false;
        if (t < BURST) {
          let ax, ay, bx, by, s = 3;
          if (t < 0.8) { //                           chegando dos lados
            const p = 1 - (1 - t / 0.8) ** 3;
            ax = W * 0.14 + (W * 0.36 - W * 0.14) * p;
            bx = W * 0.86 - (W * 0.86 - W * 0.64) * p;
            ay = by = cy + Math.sin(t * 9) * 2;
          } else { //                                 em órbita, cada vez mais rápido e mais perto
            const p = (t - 0.8) / (BURST - 0.8), ang = (t - 0.8) ** 2 * 7, r = 65 * (1 - p) ** 1.4;
            ax = cx - Math.cos(ang) * r;
            ay = cy - Math.sin(ang) * r * 0.45;
            bx = cx + Math.cos(ang) * r;
            by = cy + Math.sin(ang) * r * 0.45;
            s = 3 - 1.6 * p;
            const orb = 30 * p; //                    a esfera de energia no meio
            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, orb + 20);
            g.addColorStop(0, rgba('#FFFFFF', 0.9 * p));
            g.addColorStop(0.35, rgba(MAGIC, 0.8 * p));
            g.addColorStop(1, rgba(MAGIC, 0));
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = g;
            ctx.fillRect(cx - 80, cy - 80, 160, 160);
            ctx.restore();
            if (Math.random() < 0.6) {
              const a = rand(0, TAU), d = rand(60, 110);
              fx.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d * 0.6, vx: -Math.cos(a) * d * 1.6, vy: -Math.sin(a) * d, life: 0.6, age: 0, size: 1, seed: rand(0, 9), color: MAGIC });
            }
          }
          for (const [x, y] of [[ax, ay], [bx, by]]) { //  anel mágico embaixo de cada um
            ctx.strokeStyle = rgba(MAGIC, 0.6);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(x, y + 16 * s, 14 * s * 0.6, 4, 0, 0, TAU);
            ctx.stroke();
          }
          drawSprite(ctx, sa, ax, ay, s);
          drawSprite(ctx, sb, bx, by, s);
          fx = step(fx, dt, 0);
          for (const p of fx) sparkle(ctx, p);
          return;
        }

        if (!burst) {
          burst = true;
          fx = [];
          if (good) {
            spark(fx, cx, cy, color, 50, 1.3);
            if (alt) spark(fx, cx, cy, alt, 26, 1.2);
          } else {
            if (!crit) ashes = dust(sb, W * 0.62, cy, 3);
            else ashes = [...dust(sa, W * 0.4, cy, 3), ...dust(sb, W * 0.6, cy, 3)];
          }
        }
        const since = t - BURST;
        const shake = crit && since < 0.45 ? rand(-4, 4) : 0;
        ctx.save();
        ctx.translate(shake, 0);
        if (good) {
          rays(ctx, cx, cy, color, t, clamp01(since / 0.35), alt);
          fadeEdges(ctx, cx, cy);
          const p = clamp01(since / 0.5);
          drawSprite(ctx, born, cx, cy + Math.sin(t * 2.4) * 2, 3 * easeOutBack(p));
          if (Math.random() < 0.15) spark(fx, cx + rand(-45, 45), cy - rand(0, 40), alt && Math.random() < 0.5 ? alt : color, 1, 0.4);
        } else if (!crit) {
          drawSprite(ctx, sa, W * 0.4, cy + Math.sin(t * 2.4) * 2, 3, clamp01(since / 0.3)); // o que ficou
        }
        ashes = step(ashes, dt, 140);
        for (const a of ashes) { //                   o pó dos consumidos
          if (a.age < a.delay) {
            ctx.fillStyle = a.color;
            ctx.fillRect(Math.round(a.x), Math.round(a.y), a.size, a.size);
            continue;
          }
          ctx.globalAlpha = clamp01(1 - (a.age - a.delay) / a.life);
          ctx.fillStyle = a.color;
          ctx.fillRect(Math.round(a.x), Math.round(a.y), a.size, a.size);
          ctx.globalAlpha = 1;
        }
        fx = step(fx, dt);
        for (const p of fx) sparkle(ctx, p);
        ctx.restore();
        if (since < 0.45) flash(ctx, cx, cy, good ? '#FFFFFF' : color, (good ? 0.9 : 0.7) * (1 - since / 0.45)); // na cor do desfecho
      },
    };
  }

  /* ------------------------------------------------------------ o palco */
  function play(canvas, spec) {
    const dpr = Math.min(2, root.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;

    const scene = spec.kind === 'chest' ? chestScene(spec) : fusionScene(spec);
    let done;
    const revealed = new Promise((ok) => (done = ok));
    let t = 0, last = null, raf = 0, stopped = false, fired = false;

    // Quem pediu menos movimento vê direto o quadro final, parado.
    if (root.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      scene.draw(ctx, scene.burst - 0.0001, 0);
      scene.draw(ctx, scene.end, scene.end - scene.burst);
      done();
      return { revealed, skip() {}, stop() {} };
    }

    function frame(now) {
      if (stopped) return;
      const dt = last === null ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      scene.draw(ctx, t, dt);
      if (!fired && t >= scene.burst) {
        fired = true;
        done();
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return {
      revealed,
      skip() { if (t < scene.burst) t = scene.burst - 0.001; },
      stop() { stopped = true; cancelAnimationFrame(raf); },
    };
  }

  root.RevealFX = { play, RARITY };
})(window);

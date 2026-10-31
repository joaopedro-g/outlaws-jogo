/*
 * OUTLAWS — a estrada até o castelo.
 *
 * Enquanto o sorteio do saco não cai, um vulto encapuzado caminha pela estrada
 * em direção ao castelo; quando cai, ele chega no portão e a tocha acende.
 * É enfeite, e só: quem decide o que vem dentro do saco é o contrato. A cena
 * é desenhada com o mesmo pixel do resto do jogo (ladrilho do lib/map.js,
 * boneco do lib/sprite.js) e a silhueta é preta de propósito — mostrar a
 * aparência aqui estragaria a surpresa da abertura.
 *
 *   Road.mount(canvas, id)          prepara a cena de um saco
 *   Road.sync([{ id, progress, ready }])   diz onde cada um está
 */
(function (root) {
  const { map: MAP, rng: RNG, sprite: SP, traits: T, sha256 } = root.OutlawsLib;

  const ESCALA = 2; //                           pixel dobrado, como no resto do painel
  const LARG = 148, ALT = 48; //                 tamanho real da cena, antes da escala
  const CHAO = ALT - 8; //                       linha onde os pés pisam
  const ESTRADA = MAP.TERRAINS[0]; //            "A Estrada"
  const PORTAO = LARG - 30; //                   onde o vulto para: a entrada do castelo

  const cenas = new Map(); //                    id -> { cv, ctx, fundo, vulto, prog, ready, t }
  let rodando = false;
  const calm = root.matchMedia ? root.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const castelos = new Map(); // visual states, painted once instead of every frame

  const seedDe = (texto) => '0x' + [...sha256(new TextEncoder().encode(texto))]
    .map((b) => b.toString(16).padStart(2, '0')).join('');

  /** Pixel silhouettes in separate planes; no asset or game state is changed. */
  function paisagemDe(id) {
    const seed = seedDe(`paisagem:${id}`), phase = parseInt(seed.slice(2, 8), 16) / 1000;
    const rnd = RNG.stream(seed, 'arte:estrada');
    const plano = (pinta) => {
      const c = document.createElement('canvas');
      c.width = LARG + 32;
      c.height = ALT;
      pinta(c.getContext('2d'), c.width);
      return c;
    };
    const distante = plano((x, w) => {
      x.fillStyle = '#3C5048';
      for (let i = 0; i < w; i += 3) {
        const topo = 16 + Math.round(Math.sin(i * 0.055 + phase) * 3 + Math.sin(i * 0.11) * 2);
        x.fillRect(i, topo, 3, 13);
      }
    });
    const copas = plano((x, w) => {
      for (let i = 0; i < w; i += 7) {
        const h = 7 + Math.floor(rnd.float() * 9), base = 29, top = base - h;
        x.fillStyle = i % 3 ? '#273F32' : '#2E4737';
        x.fillRect(i + 3, top, 2, h);
        x.fillRect(i + 1, top + 3, 6, h - 3);
        x.fillRect(i - 1, top + 7, 10, Math.max(2, h - 7));
        x.fillStyle = '#39543B';
        x.fillRect(i + 2, top + 3, 2, 1);
      }
    });
    return { distante, copas };
  }

  function ceu(ctx, agora) {
    const faixas = ['#1D2C2E', '#293C37', '#3A4B3B', '#526044', '#7E7950'];
    for (let i = 0; i < faixas.length; i++) {
      ctx.fillStyle = faixas[i];
      ctx.fillRect(0, i * 6, LARG, 6);
    }
    // Small stepped sunset disk and cloud bands, all in art pixels.
    ctx.fillStyle = '#D8BC75';
    for (const [row, left, width] of [[0, 3, 2], [1, 1, 6], [2, 0, 8], [3, 0, 8], [4, 1, 6], [5, 3, 2]]) ctx.fillRect(17 + left, 7 + row, width, 1);
    const drift = calm.matches ? 0 : Math.floor(agora / 3400) % (LARG + 36);
    ctx.fillStyle = 'rgba(198,205,171,.14)';
    for (let i = 0; i < 3; i++) {
      const x = ((i * 61 + drift) % (LARG + 36)) - 24, y = 4 + i * 4;
      ctx.fillRect(x, y, 23, 1);
      ctx.fillRect(x + 4, y - 1, 11, 1);
    }
  }

  function bitmap(w, h, pinta) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const x = c.getContext('2d');
    const img = x.createImageData(w, h);
    pinta(img.data);
    x.putImageData(img, 0, 0);
    return c;
  }

  /** O chão da estrada, ladrilho por ladrilho, com o mato do terreno. */
  function fundoDe(id) {
    const rnd = RNG.stream(seedDe(`estrada:${id}`), 'chao');
    const colunas = Math.ceil(LARG / MAP.TILE), linhas = Math.ceil(ALT / MAP.TILE);
    return bitmap(LARG, ALT, (px) => {
      for (let y = 0; y < linhas; y++) {
        for (let x = 0; x < colunas; x++) {
          //                                     mato só nas beiradas: o meio é caminho limpo
          const beira = y === 0 || y === linhas - 1;
          MAP.drawTile(px, LARG, x * MAP.TILE, y * MAP.TILE, beira && rnd.float() < 0.45 ? '#' : '.', ESTRADA, rnd);
        }
      }
    });
  }

  /**
   * O castelo no fim da estrada: duas torres, ameias, portão em arco e a
   * bandeira da Coroa. Desenhado à mão porque é o destino da cena inteira.
   */
  function castelo(acesa) {
    if (castelos.has(acesa)) return castelos.get(acesa);
    const c = document.createElement('canvas');
    c.width = 34;
    c.height = ALT;
    const x = c.getContext('2d');
    const pedra = '#5F5D68', pedraEscura = '#3E3C46', sombra = '#2A2830';
    const base = CHAO + 2;
    x.fillStyle = pedraEscura;
    x.fillRect(2, base - 22, 30, 22); //          corpo
    x.fillStyle = pedra;
    x.fillRect(2, base - 22, 30, 3); //           topo iluminado
    for (let i = 0; i < 6; i++) x.fillRect(3 + i * 5, base - 26, 3, 4); //  ameias
    x.fillStyle = sombra;
    x.fillRect(0, base - 30, 7, 30); //           torre esquerda
    x.fillRect(27, base - 30, 7, 30); //          torre direita
    x.fillStyle = pedra;
    x.fillRect(0, base - 30, 7, 2);
    x.fillRect(27, base - 30, 7, 2);
    x.fillStyle = '#1A1109'; //                   o portão
    x.fillRect(13, base - 14, 8, 14);
    x.fillRect(14, base - 16, 6, 3);
    if (acesa) { //                               tocha acesa: chegou a hora de abrir
      x.fillStyle = 'rgba(242,206,126,.55)';
      x.fillRect(13, base - 14, 8, 14);
      x.fillStyle = '#F2CE7E';
      x.fillRect(9, base - 18, 2, 3);
      x.fillRect(23, base - 18, 2, 3);
    }
    x.fillStyle = acesa ? '#D9A441' : '#8C6A29'; //  a bandeira
    x.fillRect(30, base - 36, 1, 7);
    x.fillRect(31, base - 36, 3, 3);
    castelos.set(acesa, c);
    return c;
  }

  /**
   * O viajante: o boneco de verdade do lib/sprite.js, escurecido como quem
   * anda ao entardecer e com um fio de luz na borda. Escurecer em vez de
   * encher de preto é o que faz a forma continuar legível — capuz, porte e
   * arma aparecem, sem virar mancha.
   */
  function vultoDe(id) {
    const iso = T.deriveWithRank(seedDe(`vulto:${id}`), 0);
    const grid = SP.build(iso), pal = SP.palette(iso);
    const tem = (x, y) => x >= 0 && y >= 0 && x < SP.W && y < SP.H && grid[y][x] !== '.' && !!pal[grid[y][x]];
    const anoitecer = ([r, g, b]) => [Math.round(r * 0.5), Math.round(g * 0.52), Math.round(b * 0.6)];
    const quadro = (borda) => bitmap(SP.W + 2, SP.H + 2, (px) => {
      for (let y = -1; y <= SP.H; y++) {
        for (let x = -1; x <= SP.W; x++) {
          const i = ((y + 1) * (SP.W + 2) + x + 1) * 4;
          let cor = null;
          if (tem(x, y)) cor = anoitecer(pal[grid[y][x]]);
          else if (tem(x - 1, y) || tem(x + 1, y) || tem(x, y - 1) || tem(x, y + 1)) cor = borda;
          if (!cor) continue;
          [px[i], px[i + 1], px[i + 2]] = cor;
          px[i + 3] = 255;
        }
      }
    });
    return { andando: quadro([90, 68, 26]), chegou: quadro([242, 206, 126]) };
  }

  function desenha(cena, agora) {
    const { ctx } = cena;
    const passo = cena.ready ? 1 : Math.max(0, Math.min(1, cena.prog));
    const x = 6 + (PORTAO - 6) * passo;
    //                                           o balanço do passo (parado quando chegou)
    const balanco = cena.ready || calm.matches
      ? 0 : Math.round(Math.sin(agora / 140) * 1.5);

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, LARG, ALT);
    ceu(ctx, agora);
    ctx.drawImage(cena.paisagem.distante, -Math.round(passo * 3), 0);
    ctx.drawImage(cena.paisagem.copas, -Math.round(passo * 9), 0);
    ctx.drawImage(cena.fundo, 0, 27, LARG, ALT - 27, 0, 27, LARG, ALT - 27);
    ctx.fillStyle = '#34402C';
    ctx.fillRect(0, 27, LARG, 1);
    ctx.fillStyle = 'rgba(231,195,113,.17)';
    ctx.fillRect(0, 28, LARG, 1);
    const shade = ctx.createLinearGradient(0, 27, 0, ALT);
    shade.addColorStop(0, 'rgba(20,36,28,.14)');
    shade.addColorStop(1, 'rgba(12,22,19,.30)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 29, LARG, ALT - 29);
    ctx.drawImage(castelo(cena.ready), LARG - 34, 0);
    if (cena.ready) {
      const glow = ctx.createRadialGradient(LARG - 17, 26, 1, LARG - 17, 26, 19);
      glow.addColorStop(0, 'rgba(242,194,95,.18)');
      glow.addColorStop(1, 'rgba(242,194,95,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(LARG - 36, 7, 38, 38);
    }

    const arte = cena.ready ? cena.vulto.chegou : cena.vulto.andando;
    ctx.globalAlpha = 0.28; //                   a sombra no chão
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 4, CHAO + 1, 12, 2);
    ctx.globalAlpha = 1;
    ctx.drawImage(arte, Math.round(x), CHAO - SP.H + 2 + balanco);
    const tm = calm.matches ? 0 : agora / 1000;
    for (let i = 0; i < 5; i++) {
      const px = Math.round(13 + i * 24 + Math.sin(tm * 0.35 + i * 2) * 3);
      const py = Math.round(22 + (i % 3) * 6 + Math.cos(tm * 0.25 + i) * 2);
      ctx.fillStyle = `rgba(230,207,140,${0.13 + (Math.sin(tm + i) + 1) * 0.08})`;
      ctx.fillRect(px, py, 1, 1);
    }
  }

  function quadro() {
    if (calm.matches) { rodando = false; return; }
    if (document.hidden) { requestAnimationFrame(quadro); return; }
    const agora = performance.now();
    let faltaAlguem = false;
    for (const cena of cenas.values()) {
      if (!cena.cv.isConnected) continue;
      desenha(cena, agora);
      if (!cena.ready) faltaAlguem = true;
    }
    rodando = faltaAlguem;
    if (rodando) requestAnimationFrame(quadro);
  }

  /** Prepara a cena de um saco. Chamar de novo com o mesmo canvas não custa nada. */
  function mount(cv, id) {
    const existente = cenas.get(id);
    if (existente && existente.cv === cv) return existente;
    cv.width = LARG * ESCALA;
    cv.height = ALT * ESCALA;
    const ctx = cv.getContext('2d');
    ctx.scale(ESCALA, ESCALA);
    ctx.imageSmoothingEnabled = false;
    const cena = { cv, ctx, fundo: fundoDe(id), paisagem: paisagemDe(id), vulto: vultoDe(id), prog: 0, ready: false };
    cenas.set(id, cena);
    desenha(cena, performance.now());
    return cena;
  }

  /** Diz onde cada vulto está. O que sumiu da tela sai da lista. */
  function sync(lista) {
    for (const id of [...cenas.keys()]) {
      if (!lista.some((s) => s.id === id) || !cenas.get(id).cv.isConnected) cenas.delete(id);
    }
    for (const { id, progress, ready } of lista) {
      const cena = cenas.get(id);
      if (!cena) continue;
      cena.prog = progress;
      cena.ready = ready;
      if (ready || calm.matches) desenha(cena, performance.now()); //  parado: um quadro basta
    }
    if (!rodando && !calm.matches && lista.some((s) => !s.ready)) {
      rodando = true;
      requestAnimationFrame(quadro);
    }
  }

  root.Road = { mount, sync, LARG, ALT, ESCALA };
})(window);

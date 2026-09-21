/*
 * OUTLAWS — o painel do jogo.
 *
 *   ?carteira=0x…   mostra o bando de qualquer carteira, só leitura
 *   ?demo           bando de exemplo, sem tocar na rede (pra ver o visual)
 */
(function () {
  'use strict';
  const { Chain, OutlawsLib, Heist, I18N } = window;
  const t = I18N.t;
  const loc = () => I18N.locale();
  const C = Chain.CFG;
  const T = OutlawsLib.traits;
  const SP = OutlawsLib.sprite;
  const $ = (s, el = document) => el.querySelector(s);
  const params = new URLSearchParams(location.search);

  const BOUNTY_NAME = 'Outlaws Bounty'; //                                  nome no permit (EIP-712)
  const RANK = new Proxy([], { get: (_, i) => t('rank.' + String(i)) }); //   raridade: Common… Mythic
  const TITLE = new Proxy([], { get: (_, i) => t('title.' + String(i)) }); // o nome de fora-da-lei do posto
  const STATUS = new Proxy([], { get: (_, i) => t('status.' + String(i)) });
  const STATUS_KEY = ['livre', 'servico', 'capturado', 'fusao'];
  const L1_SECONDS = 12; //   contrato antigo: contava blocos da L1 (Sepolia), ~12 s cada
  const FAST_SECONDS = 0.25; // contrato novo: bloco da própria Robinhood, ~4 por segundo
  const FAST_WINDOW = 8191; //  quantos blocos o histórico da rede guarda
  /** Segundos por bloco e tamanho da janela, conforme o relógio do contrato. */
  const blockSecs = () => (S.glob && S.glob.fast ? FAST_SECONDS : L1_SECONDS);
  const drawWindow = () => (S.glob && S.glob.fast ? FAST_WINDOW : 256);

  const S = {
    filter: null, fuseFilter: null, //          filtros por raridade (bando e fusão)
    alarm: 0, alarmed: false, //                aviso de saque: valor em $BOUNTY inteiro, e se já avisou
    me: null,
    view: null,
    readOnly: false,
    demo: params.has('demo'),
    cfg: null,
    glob: null,
    user: null,
    odds: null,
    selected: new Set(),
    busy: false,
    log: [],
    qty: 1,
    shiftLen: 10,
    reveal: null, //   o que saiu do último saco/fusão, mostrado depois da leitura
    demoRoll: 0,
  };

  /* -------------------------------------------------------- carteira */
  // Quem clicou em Desconectar não é reconectado sozinho ao abrir de novo.
  const LEFT = 'outlaws:desconectou';
  const leftOn = (on) => { try { on ? localStorage.setItem(LEFT, '1') : localStorage.removeItem(LEFT); } catch {} };
  const hasLeft = () => { try { return localStorage.getItem(LEFT) === '1'; } catch { return false; } };

  /** Troca a carteira em uso (null = nenhuma) e apaga o que era da anterior. */
  function useAccount(a) {
    S.me = a || null;
    S.view = S.me;
    S.readOnly = false;
    S.user = null;
    S.selected.clear();
  }

  /* ------------------------------------------------------ formatação */
  const WEI = 10n ** 18n;
  function fmtB(wei, digits = 2) {
    const neg = wei < 0n;
    const v = neg ? -wei : wei;
    const n = Number(v / 10n ** 14n) / 10_000;
    return (neg ? '-' : '') + n.toLocaleString(loc(), { maximumFractionDigits: digits, minimumFractionDigits: 0 });
  }
  /** Número com casas fixas, no formato do idioma (46.08 / 46,08). */
  const dec = (v, d = 2) => Number(v).toLocaleString(loc(), { minimumFractionDigits: d, maximumFractionDigits: d });
  const short = (a) => (a ? a.slice(0, 6) + '…' + a.slice(-4) : '');
  /** Segundos até o sorteio sair, descontando o tempo desde a última leitura. */
  const drawIn = (target) => (target - S.glob.block + 1) * blockSecs() - (Date.now() - S.glob.at) / 1000;
  const drawText = (target) => {
    const left = drawIn(target);
    return left > 0 ? t('p.draw.in', { t: dur(left) }) : t('p.draw.now');
  };

  /** Cores da raridade como variáveis de CSS (--rc, e --rc2 pra quem alterna). */
  const rarityStyle = (rank) => {
    const [a, b = a] = T.RANKS[rank].rarity;
    return `--rc:${a};--rc2:${b}`;
  };
  const rarityClass = (rank) => `r-${rank}${T.RANKS[rank].rarity.length > 1 ? ' myth' : ''}`;
  const gem = '<i class="gem" aria-hidden="true"></i>';

  function dur(sec) {
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    if (h > 0) return `${h}h${String(m).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  /* ------------------------------------------------------------ arte */
  const artCache = new Map();
  function isoOf(o) {
    return T.deriveWithRank(o.seed, o.rank, o.id, { minimal: (o.flags & 1) === 1 });
  }
  function art(o) {
    const key = o.seed + ':' + o.rank + ':' + o.flags;
    if (artCache.has(key)) return artCache.get(key);
    const iso = isoOf(o);
    const grid = SP.build(iso), pal = SP.palette(iso);
    const cv = document.createElement('canvas');
    cv.width = SP.W;
    cv.height = SP.H;
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(SP.W, SP.H);
    for (let y = 0; y < SP.H; y++) {
      for (let x = 0; x < SP.W; x++) {
        const ch = grid[y][x], i = (y * SP.W + x) * 4;
        if (ch === '.' || !pal[ch]) continue;
        [img.data[i], img.data[i + 1], img.data[i + 2]] = pal[ch];
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const url = cv.toDataURL();
    artCache.set(key, { url, iso });
    return artCache.get(key);
  }

  /* ---------------------------------------------------------- leitura */
  async function loadConfig() {
    const [[price], [len], [life], [gen], cap] = await Chain.calls([
      [C.game, 'sackPrice()'],
      [C.game, 'epochLength()'],
      [C.game, 'maxLife()'],
      [C.game, 'genesis()'],
      [C.game, 'MAX_ACTIVE()'],
    ], { partial: true });
    // contrato sem limite (os antigos): cap fica 0 e o painel não conta
    S.cfg = { price, epochLength: Number(len), maxLife: Number(life), genesis: Number(gen), maxActive: cap ? Number(cap[0]) : 0 };
  }

  /*
   * O contrato só lança as épocas fechadas quando alguém transaciona. Todo lote
   * de leitura começa chamando checkpoint() — é simulação (eth_call), não grava
   * nada nem custa gás — então o painel enxerga exatamente o que um saque
   * pagaria agora, mesmo que ninguém tenha mexido desde a virada.
   */
  const SETTLE = () => [C.game, 'checkpoint(uint256)', [Chain.MAX_UINT]];

  async function loadGlobal() {
    const [, [epoch], [running], [owed], [avg], [pool], [block], [settle]] = await Chain.calls([
      SETTLE(),
      [C.game, 'currentEpoch()'],
      [C.game, 'runningWeight()'],
      [C.game, 'outstanding()'],
      [C.game, 'avgPerWeight()'],
      [C.bounty, 'balanceOf(address)', [C.game]],
      [C.multicall, 'getBlockNumber()'], // o bloco da L1 (contrato antigo, e reserva)
      [C.game, 'nextToSettle()'],
    ]);
    // o relógio do sorteio é o que o contrato usa: o bloco da própria Robinhood
    // quando ele acha o ArbSys, senão o da L1 (o mesmo do multicall)
    const [fast, own] = await Chain.calls([[C.game, 'fastDraw()'], [C.game, 'drawBlock()']], { partial: true });
    const v3 = fast !== null && fast !== undefined; //  contrato novo: tem sorteio próprio, lote e abrir+trabalhar
    const fastDraw = !!(fast && fast[0] === 1n);
    // runningWeight só anda quando alguém transaciona. O peso da época atual é
    // ele mais as entradas e saídas agendadas nas épocas que ainda não fecharam.
    let weight = running;
    const open = [];
    for (let e = Number(settle); e <= Number(epoch) && open.length < 600; e++) open.push(e);
    if (open.length) {
      for (const [d] of await Chain.calls(open.map((e) => [C.game, 'weightDelta(uint256)', [e]]))) {
        weight += d >= 1n << 255n ? d - (1n << 256n) : d; // int256
      }
    }
    /* Uma RPC atrás de um balanceador às vezes responde de um nó atrasado, e
       o bloco volta no tempo — a espera do sorteio aparecia como dezenas de
       segundos quando já tinha passado. O relógio do sorteio só anda pra
       frente: guardo o maior que já vi na mesma referência. */
    let blocoAgora = Number(fastDraw && own ? own[0] : block);
    if (S.glob && S.glob.fast === fastDraw) blocoAgora = Math.max(blocoAgora, S.glob.block);
    S.glob = {
      epoch: Number(epoch), weight, owed, avg, pool, free: pool - owed,
      block: blocoAgora, fast: fastDraw, v3, at: Date.now(),
    };
  }

  const asOutlaw = (id, w) => ({
    id,
    seed: Chain.asHex32(w[0]),
    rank: Number(w[1]),
    flags: Number(w[2]),
    weight: Number(w[3]),
    lifeUsed: Number(w[4]),
    ransoms: Number(w[5]),
    shiftStart: Number(w[6]),
    shiftEnd: Number(w[7]),
    fusion: Number(w[9]),
    lifeLeft: Number(w[10]),
    status: Number(w[11]),
    pending: w[12],
  });

  /** Tudo da carteira em 4 chamadas, qualquer que seja o tamanho do bando. */
  async function loadUser(a) {
    const [[bounty], [eth], [allowance], [n], [nextSack], [nextFusion], [tapNext], [tapAmount], [tapLeft]] = await Chain.calls([
      [C.bounty, 'balanceOf(address)', [a]],
      [C.multicall, 'getEthBalance(address)', [a]],
      [C.bounty, 'allowance(address,address)', [a, C.game]],
      [C.game, 'balanceOf(address)', [a]],
      [C.game, 'nextSackId()'],
      [C.game, 'nextFusionId()'],
      [C.faucet, 'nextClaimAt(address)', [a]],
      [C.faucet, 'amount()'],
      [C.bounty, 'balanceOf(address)', [C.faucet]],
    ]);
    // sem torneira no endereço (antes do deploy, ou numa rede sem ela) a leitura volta vazia
    const tap = tapAmount === undefined ? null : { next: Number(tapNext), amount: tapAmount, left: tapLeft };

    // sacos e fusões pendentes desta carteira (varre os 120 mais recentes de cada)
    const recent = (next) => {
      const list = [];
      for (let id = Number(next) - 1; id >= Math.max(1, Number(next) - 120); id--) list.push(id);
      return list;
    };
    const sackIds = recent(nextSack), fusionIds = recent(nextFusion);
    const idx = [...Array(Number(n)).keys()];
    const rows = await Chain.calls([
      ...idx.map((i) => [C.game, 'tokenOfOwnerByIndex(address,uint256)', [a, i]]),
      ...sackIds.map((id) => [C.game, 'sacks(uint256)', [id]]),
      ...fusionIds.map((id) => [C.game, 'fusions(uint256)', [id]]),
    ], { partial: true });
    const ids = rows.slice(0, idx.length).filter(Boolean).map((w) => Number(w[0])).sort((x, y) => x - y);
    const me = a.toLowerCase();
    const mine = (w) => w && Chain.asAddr(w[0]).toLowerCase() === me;
    const sacks = sackIds
      .map((id, i) => [id, rows[idx.length + i]])
      .filter(([, w]) => mine(w))
      .map(([id, w]) => ({ id, count: Number(w[1]), target: Number(w[2]) }))
      .reverse();
    const fusions = fusionIds
      .map((id, i) => [id, rows[idx.length + sackIds.length + i]])
      .filter(([, w]) => mine(w))
      .map(([id, w]) => ({ id, a: Number(w[1]), b: Number(w[2]), rank: Number(w[3]), success: Number(w[4]), critical: Number(w[5]), target: Number(w[6]) }))
      .reverse();

    const outlaws = (await Chain.calls([SETTLE(), ...ids.map((id) => [C.game, 'outlaw(uint256)', [id]])], { partial: true }))
      .slice(1)
      .map((w, i) => w && asOutlaw(ids[i], w))
      .filter(Boolean);

    // custo de conserto / resgate de quem precisa
    const costs = [];
    for (const o of outlaws) {
      const used = S.cfg.maxLife - o.lifeLeft;
      if (o.status === 0 && used > 0) costs.push([o, 'repair', [C.game, 'repairCost(uint256,uint256)', [o.id, used]]]);
      if (o.status === 2) costs.push([o, 'ransom', [C.game, 'ransomCost(uint256)', [o.id]]]);
    }
    if (costs.length) {
      const got = await Chain.calls(costs.map((c) => c[2]), { partial: true });
      costs.forEach(([o, key], i) => { if (got[i]) o[key] = got[i][0]; });
    }

    S.user = { bounty, eth, allowance, outlaws, sacks, fusions, tap };
    for (const id of [...S.selected]) if (!outlaws.some((o) => o.id === id)) S.selected.delete(id);
  }

  let loading = false;
  async function refresh() {
    if (S.demo) return render();
    if (loading) return;
    loading = true;
    try {
      if (!S.cfg) await loadConfig();
      await loadGlobal();
      if (S.view) await loadUser(S.view);
      await loadOdds();
    } catch (e) {
      toast(t('p.err.read', { e: Chain.humanError(e) }), 'erro');
    } finally {
      loading = false;
    }
    render();
  }

  /* ----------------------------------------------------------- demo */
  /** Seed determinística que sorteia o rank pedido — a demonstração é sempre a mesma. */
  function seedFor(rank, salt) {
    for (let i = 0; ; i++) {
      const b = OutlawsLib.sha256(new TextEncoder().encode(`demo:${salt}:${i}`));
      const seed = '0x' + [...b].map((v) => v.toString(16).padStart(2, '0')).join('');
      if (T.derive(seed).rank.id === rank) return seed;
    }
  }

  function demoState() {
    // #1 e #8 são Ladrões livres: dá pra marcar os dois e ver a fusão.
    const ranks = [1, 3, 1, 0, 2, 3, 4, 1, 5];
    const st = [0, 1, 1, 2, 0, 1, 3, 0, 1];
    const seeds = ranks.map((r, i) => seedFor(r, i));
    S.cfg = { price: 1000n * WEI, epochLength: 3600, maxLife: 30, maxActive: 10, genesis: Math.floor(Date.now() / 1000) - 5 * 3600 - 1200 };
    S.glob = { epoch: 5, weight: 88_000n, owed: 1n, avg: 0n, pool: 101_675n * WEI, free: 101_675n * WEI, block: 1000, at: Date.now() };
    const outlaws = seeds.map((seed, i) => {
      const rank = ranks[i];
      const lifeLeft = st[i] === 2 ? 0 : 30 - ((i * 7) % 24);
      return {
        id: i + 1, seed, rank, flags: 0, weight: T.derive(seed).raw.weightBps, lifeUsed: 30 - lifeLeft, ransoms: 0,
        shiftStart: st[i] === 1 ? 4 : 0, shiftEnd: st[i] === 1 ? 4 + 6 + i : 0, fusion: st[i] === 3 ? 1 : 0, lifeLeft, status: st[i],
        pending: st[i] === 1 ? BigInt(40 + i * 17) * WEI : 0n,
        repair: st[i] === 0 && lifeLeft < 30 ? BigInt(15 + i * 3) * WEI : undefined,
        ransom: st[i] === 2 ? 900n * WEI : undefined,
      };
    });
    S.user = {
      bounty: 12_450n * WEI, eth: 47n * 10n ** 15n, allowance: 0n, outlaws,
      sacks: [{ id: 7, count: 3, target: 1003 }, { id: 8, count: 1, target: 998 }],
      fusions: [{ id: 3, a: 1, b: 8, rank: 1, success: 5400, critical: 0, target: 990 }],
    };
    S.view = '0xdemo000000000000000000000000000000000000';
    S.readOnly = true;
  }

  /* --------------------------------------------------------- revelação */
  const OUTCOME = new Proxy([], { get: (_, i) => t('p.rv.outcome.' + String(i)) });

  function revealCard(o, cls = '', i = 0) {
    const { url, iso } = art(o);
    const st = iso.stats;
    return `<figure class="rv-card ${rarityClass(o.rank)} ${cls}" style="--i:${i};${rarityStyle(o.rank)}">
      <img src="${url}" alt="${esc(t('p.card.alt', { id: o.id }))}" width="128" height="128">
      <figcaption><span class="rv-id">#${o.id}</span><b>${gem}${esc(RANK[o.rank])}</b><i>${esc(TITLE[o.rank])}</i>
        <small>${esc(t('p.rv.stats', { a: st.pontaria.toFixed(0), s: st.forca.toFixed(0), t: st.furtividade.toFixed(0) }))}<br>${esc(t('p.rv.weight', { w: dec(o.weight / 10_000) }))}</small>
      </figcaption></figure>`;
  }

  /** O boneco pelo id: do bando já lido, ou direto do contrato se a leitura ainda não o pegou. */
  async function outlawById(id) {
    const have = S.user?.outlaws.find((o) => o.id === id);
    if (have || S.demo) return have || demoResult(id);
    const [w] = await Chain.calls([[C.game, 'outlaw(uint256)', [id]]], { partial: true });
    return w && asOutlaw(id, w);
  }

  /** Na demonstração, o "resultado" da fusão é um Foragido inventado com seed fixa. */
  function demoResult(id) {
    const seed = seedFor(2, 'fusao');
    return { id, seed, rank: 2, flags: 0, weight: T.deriveWithRank(seed, 2).raw.weightBps };
  }

  const stage = { show: null, onClose: null }; // a cena que está no palco da revelação

  async function showReveal(rv) {
    let title, lead, body, bad = false;
    let got = [];
    if (rv.kind === 'sack') {
      got = (await Promise.all(rv.ids.map(outlawById))).filter(Boolean);
      title = t('p.rv.sackTitle', { id: rv.id });
      lead = rv.expired ? t('p.rv.expired') : t('p.rv.joined', { n: got.length });
      body = got.map((o, i) => revealCard(o, 'is-new', i)).join('');
      toast(t('p.rv.toastSack', { id: rv.id, list: got.map((o) => `#${o.id} ${RANK[o.rank]}`).join(', ') }), 'ok');
    } else {
      const { a, b } = rv;
      const names = a && b ? t('p.rv.names', { a: a.id, b: b.id, rank: RANK[rv.rank] }) : t('p.rv.both');
      title = t('p.rv.fuseTitle', { id: rv.id, outcome: OUTCOME[rv.outcome] });
      bad = rv.outcome !== 0;
      if (rv.outcome === 0) {
        const born = await outlawById(rv.newId);
        lead = t('p.rv.became', { names, rank: RANK[rv.rank + 1] });
        body = (a ? revealCard(a, 'is-gone small') : '') + '<span class="rv-op">+</span>' + (b ? revealCard(b, 'is-gone small') : '') +
          '<span class="rv-op">→</span>' + (born ? revealCard(born, 'is-new', 1) : '');
        if (born) toast(t('p.rv.toastOk', { id: rv.id, nid: born.id, rank: RANK[born.rank] }), 'ok');
      } else if (rv.outcome === 1) {
        lead = a && b ? t('p.rv.failLead', { a: a.id, b: b.id }) : t('p.rv.failLeadAnon');
        body = (a ? revealCard(a) : '') + (b ? revealCard(b, 'is-gone') : '');
        toast(t('p.rv.toastFail', { id: rv.id, a: a?.id, b: b?.id }), 'aviso');
      } else {
        lead = t('p.rv.critLead', { names });
        body = (a ? revealCard(a, 'is-gone') : '') + (b ? revealCard(b, 'is-gone') : '');
        toast(t('p.rv.toastCrit', { id: rv.id, names }), 'erro');
      }
    }
    // A cena: baú na cor da maior raridade que saiu, ou a fusão com o desfecho.
    let spec, suspense;
    if (rv.kind === 'sack') {
      const best = Math.max(0, ...got.map((o) => o.rank));
      spec = { kind: 'chest', rarity: best };
      suspense = t('p.rv.opening', { id: rv.id });
    } else {
      const born = rv.outcome === 0 ? await outlawById(rv.newId) : null;
      spec = {
        kind: 'fusion', outcome: rv.outcome,
        a: rv.a ? art(rv.a).iso : null, b: rv.b ? art(rv.b).iso : null,
        born: born ? art(born).iso : null, rarity: born ? born.rank : rv.rank,
      };
      suspense = rv.a && rv.b ? t('p.rv.fusing', { a: rv.a.id, b: rv.b.id }) : t('p.rv.fusingAnon');
    }
    const canAnimate = spec.kind === 'chest' || (spec.a && spec.b && (spec.outcome !== 0 || spec.born));

    const dlg = $('#reveal');
    dlg.innerHTML = `<h3 id="reveal-title" class="rv-title">${esc(canAnimate ? suspense : title)}</h3>
      <p class="rv-lead">${canAnimate ? `<small class="muted">${esc(t('p.rv.skip'))}</small>` : esc(lead)}</p>
      ${canAnimate ? '<canvas class="rv-stage" aria-hidden="true"></canvas>' : ''}
      <div class="rv-row" ${canAnimate ? 'hidden' : ''}>${body}</div>
      <form method="dialog" class="rv-actions"><button class="btn btn-gold">${esc(t('p.rv.ok'))}</button></form>`;
    dlg.showModal();
    if (!canAnimate) return;

    // Uma cena por vez: a anterior para aqui. E o aviso de "fechou" chega atrasado —
    // se a janela já reabriu com outra cena, ele não é com esta.
    stage.show?.stop();
    if (stage.onClose) dlg.removeEventListener('close', stage.onClose);
    const show = RevealFX.play($('.rv-stage', dlg), spec);
    stage.show = show;
    stage.onClose = () => { if (!dlg.open) show.stop(); };
    dlg.addEventListener('close', stage.onClose);
    $('.rv-stage', dlg).addEventListener('click', () => show.skip());
    await show.revealed;
    if (!dlg.open) return;
    const h = $('#reveal-title', dlg);
    h.textContent = title;
    h.classList.toggle('bad', bad);
    $('.rv-lead', dlg).textContent = lead;
    const row = $('.rv-row', dlg);
    row.hidden = false;
    row.classList.add('rv-in');
  }

  /* -------------------------------------------------------------- ações */
  function toast(msg, kind = 'ok', hash) {
    S.log.unshift({ msg, kind, hash, at: new Date() });
    S.log = S.log.slice(0, 60);
    saveLog();
    renderLog();
  }

  async function run(label, fn) {
    if (S.demo) return toast(t('p.demo.noop'), 'aviso');
    if (S.readOnly) return toast(t('p.readonly.noop'), 'aviso');
    if (S.busy) return;
    S.busy = true;
    render();
    try {
      await fn();
    } catch (e) {
      toast(`${label}: ${e.message || Chain.humanError(e)}`, 'erro');
    } finally {
      S.busy = false;
      await refresh();
      if (S.reveal) {
        const rv = S.reveal;
        S.reveal = null;
        await showReveal(rv);
      }
    }
  }

  async function tx(label, to, sig, args) {
    toast(t('p.tx.confirm', { label }), 'aviso');
    const hash = await Chain.send(S.me, to, sig, args);
    toast(t('p.tx.sent', { label }), 'aviso', hash);
    const receipt = await Chain.waitReceipt(hash);
    toast(t('p.tx.done', { label }), 'ok', hash);
    return receipt;
  }

  /**
   * Autoriza o jogo a usar exatamente o $BOUNTY desta ação — nunca "ilimitado".
   * Autorização ilimitada é o padrão dos golpes de drenar carteira: o MetaMask
   * alerta, e um contrato com defeito levaria o saldo inteiro, não só o valor
   * da compra. Custa uma confirmação a mais por ação; vale.
   */
  async function ensureAllowance(amount) {
    if (S.user.allowance >= amount) return;
    await tx(t('p.approve', { amount: fmtB(amount) }), C.bounty, 'approve(address,uint256)', [C.game, amount]);
    S.user.allowance = amount;
  }

  /** Janelinha de aviso: título, um número grande e uma linha de explicação. */
  function showNote(title, big, lines) {
    const dlg = $('#note');
    dlg.innerHTML = `<h3>${esc(title)}</h3>${big ? `<p class="big">${esc(big)}</p>` : ''}`
      + lines.filter(Boolean).map((l) => `<p>${esc(l)}</p>`).join('')
      + `<button class="btn btn-gold" data-act="close-note" style="margin-top:10px">${esc(t('p.note.ok'))}</button>`;
    dlg.showModal();
  }

  /** Escolha da carteira: uma linha por extensão instalada, com ícone e nome. */
  function pickWallet() {
    const dlg = $('#wallets');
    const ultima = Chain.current()?.info.rdns; //  a do último acesso vai marcada
    dlg.innerHTML = `<h3>${esc(t('p.wallet.pick'))}</h3><p class="muted">${esc(t('p.wallet.pick.sub'))}</p>
      <ul class="wlist">${Chain.wallets().map((w) => `<li><button class="btn" data-act="use-wallet" data-rdns="${esc(w.info.rdns)}">
        ${w.info.icon ? `<img src="${esc(w.info.icon)}" alt="" width="28" height="28">` : ''}<span>${esc(w.info.name)}<small class="wrdns">${esc(w.info.rdns)}</small></span>${
          w.info.rdns === ultima ? `<small class="wlast">${esc(t('p.wallet.last'))}</small>` : ''}</button></li>`).join('')}</ul>
      <button class="btn" data-act="close-wallets">${esc(t('p.wallet.cancel'))}</button>`;
    dlg.showModal();
  }

  /* ---------------------------------------------------------- ranking */
  /**
   * O ranking sai só da rede, sem servidor: todo boneco que existe, quem é o
   * dono e quanto ele pesa, somados por carteira. São 3 leituras por boneco,
   * todas em lote pelo Multicall; o resultado vale um minuto e só é buscado
   * quando alguém abre a aba.
   */
  async function loadBoard() {
    const [[total]] = await Chain.calls([[C.game, 'totalSupply()']]);
    const n = Math.min(Number(total), 3000); //   teto de segurança na leitura
    const idx = [...Array(n).keys()];
    const ids = (await Chain.calls(idx.map((i) => [C.game, 'tokenByIndex(uint256)', [i]]), { partial: true }))
      .map((w) => (w ? Number(w[0]) : 0)).filter(Boolean);
    const owners = await Chain.calls(ids.map((id) => [C.game, 'ownerOf(uint256)', [id]]), { partial: true });
    const outs = await Chain.calls(ids.map((id) => [C.game, 'outlaw(uint256)', [id]]), { partial: true });

    const by = new Map();
    ids.forEach((id, i) => {
      const ow = owners[i], w = outs[i];
      if (!ow || !w) return;
      const who = Chain.asAddr(ow[0]);
      const o = asOutlaw(id, w);
      const g = by.get(who) || { who, n: 0, weight: 0, duty: 0, best: 0, bounty: 0 };
      g.n++;
      g.weight += o.weight / 10_000;
      if (o.status === 1) g.duty++;
      if (o.rank > g.best) g.best = o.rank;
      g.bounty += T.RANKS[o.rank].bounty;
      by.set(who, g);
    });
    const list = [...by.values()].sort((a, b) => b.weight - a.weight || b.n - a.n);
    list.forEach((g, i) => (g.pos = i + 1));
    S.board = { list, total: Number(total), at: Date.now() };
  }

  /** Pede o ranking quando a aba abre (ou quando o dado já envelheceu). */
  function wantBoard(force) {
    if (S.demo || S.boardBusy) return;
    if (!force && S.board && Date.now() - S.board.at < 60_000) return;
    S.boardBusy = true;
    renderBoard();
    loadBoard()
      .catch((e) => toast(t('p.board.err', { e: Chain.humanError(e) }), 'erro'))
      .finally(() => { S.boardBusy = false; renderBoard(); });
  }

  function renderBoard() {
    const box = $('#board');
    if (!box) return;
    if (S.demo) return void (box.innerHTML = `<p class="muted">${esc(t('p.board.demo'))}</p>`);
    if (!S.board) return void (box.innerHTML = `<p class="muted">${esc(t(S.boardBusy ? 'p.board.loading' : 'p.board.empty'))}</p>`);
    const { list, total } = S.board;
    const me = S.view && list.find((g) => g.who.toLowerCase() === S.view.toLowerCase());
    const top = list.slice(0, 25);
    if (me && !top.includes(me)) top.push(me); //  a sua linha aparece mesmo fora do topo
    const row = (g) => `<tr class="${me === g ? 'is-me' : ''}" style="${rarityStyle(g.best)}">
      <td class="pos">${g.pos}</td>
      <td class="who">${esc(short(g.who))}${me === g ? ` <span class="tag">${esc(t('p.board.you'))}</span>` : ''}</td>
      <td>${g.n}</td>
      <td>${dec(g.weight)}×</td>
      <td>${g.duty}</td>
      <td class="best"><i class="gem"></i>${esc(RANK[g.best])}</td>
    </tr>`;
    box.innerHTML = `<p class="muted board-sub">${esc(t('p.board.sub', { n: list.length, o: total }))}
        ${S.boardBusy ? esc(t('p.board.loading')) : `<button class="btn" data-act="board-refresh">${esc(t('p.board.refresh'))}</button>`}</p>
      <div class="board-scroll"><table class="board">
        <thead><tr><th>#</th><th>${esc(t('p.board.wallet'))}</th><th>${esc(t('p.board.outlaws'))}</th>
          <th>${esc(t('p.board.weight'))}</th><th>${esc(t('p.board.duty'))}</th><th>${esc(t('p.board.best'))}</th></tr></thead>
        <tbody>${top.map(row).join('')}</tbody>
      </table></div>`;
  }

  /** Abas de baixo: trocam o que aparece no meio do HUD. */
  function showTab(name) {
    S.tab = name;
    try { localStorage.setItem('outlaws:tab', name); } catch {}
    for (const el of document.querySelectorAll('.col-main .tab')) el.hidden = el.id !== 'tab-' + name;
    for (const el of document.querySelectorAll('.tab-btn')) el.setAttribute('aria-selected', String(el.dataset.tab === name));
    if (name === 'ranking') wantBoard();
  }

  /** O registro fica salvo: sacar, recarregar ou trocar de aba não apaga nada. */
  const LOG_KEY = 'outlaws:log';
  const ALARM_KEY = 'outlaws:avisar'; //        de quanto em quanto o painel chama pro saque
  const GAME_KEY = 'outlaws:game'; //          qual contrato este navegador viu por último

  /**
   * Toda vez que o jogo muda de contrato, o guardado aqui deixa de fazer
   * sentido (o registro fala de bonecos que não existem mais). Então limpa,
   * uma vez só, e anota o contrato novo. A carteira escolhida fica: essa é da
   * pessoa, não do jogo.
   */
  function resetOnNewGame() {
    try {
      const seen = localStorage.getItem(GAME_KEY);
      const now = C.game.toLowerCase();
      if (seen === now) return false;
      localStorage.removeItem(LOG_KEY);
      localStorage.removeItem('outlaws:tab');
      localStorage.setItem(GAME_KEY, now);
      return !!seen; //                        primeira visita não é "mudou de jogo"
    } catch {
      return false;
    }
  }
  function saveLog() {
    try {
      localStorage.setItem(LOG_KEY, JSON.stringify(S.log.map((l) => ({ ...l, at: +l.at }))));
    } catch {}
  }
  function loadLog() {
    try {
      const raw = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
      S.log = raw.slice(0, 60).map((l) => ({ ...l, at: new Date(l.at) }));
    } catch {}
  }

  /**
   * O sorteio sai no bloco seguinte (~1 s na Robinhood). Em vez de deixar o
   * jogador caçar o botão de abrir, o painel espera o bloco e já faz sozinho.
   * Se a carteira recusar, não tem drama: o botão continua lá.
   */
  async function autoReveal(fn, target) {
    for (let i = 0; i < 90 && !S.demo; i++) {
      await new Promise((ok) => setTimeout(ok, 700));
      if (S.glob?.v3) {
        const [b] = await Chain.calls([[C.game, 'drawBlock()']], { partial: true });
        if (b && Number(b[0]) > target) break;
      } else if (drawIn(target) <= 0) { //       contrato antigo: conta pelo bloco da L1
        break;
      } else if (i % 8 === 7) {
        await refresh(); //                      atualiza o bloco de referência
      }
    }
    if (S.demo) return;
    await refresh();
    await fn();
  }

  const byId = (id) => S.user.outlaws.find((o) => o.id === id);
  const selectedOutlaws = () => [...S.selected].map(byId).filter(Boolean);

  /** Guarda o saco recém-comprado pra abrir sozinho quando o sorteio sair. */
  function afterBuy(receipt) {
    const [ev] = Chain.logsOf(receipt, 'SackBought'); // (sackId) buyer, count, target
    if (!ev) return;
    const id = Number(ev.topics[1]), target = Number(ev.data[2]);
    S.pending = autoReveal(() => actions.open(id), target).catch(() => {});
  }

  const actions = {
    /**
     * A carteira pode demorar ou nem abrir: se a janela estiver em segundo
     * plano, a extensão às vezes engole o pedido e fica esperando. Então: um
     * pedido de cada vez, aviso quando demora e o botão volta sozinho em vez
     * de ficar morto até o F5.
     */
    async connect(rdns) {
      if (S.connecting) {
        //                                       a extensão às vezes engole o pedido e nunca responde
        if (Date.now() - (S.connectAt || 0) < 4000) return toast(t('p.conn.waiting'), 'aviso');
        S.connecting = false;
      }
      S.connectAt = Date.now();
      Chain.rediscover(); //                     extensão que entrou depois
      if (!Chain.hasWallet()) return toast(t('p.noWallet'), 'erro');
      // clicar em conectar sempre abre a lista: quem escolhe a carteira é o jogador
      if (!rdns) return pickWallet();
      S.connecting = true;
      render();
      const slow = setTimeout(() => toast(t('p.conn.slow'), 'aviso'), 8000);
      const dead = setTimeout(() => {
        if (!S.connecting) return;
        S.connecting = false;
        toast(t('p.conn.timeout'), 'erro');
        render();
      }, 30_000);
      try {
        const a = await Chain.connect(rdns);
        useAccount(a);
        leftOn(false);
        history.replaceState(null, '', location.pathname);
        const nome = Chain.walletName(), real = Chain.realName();
        toast(nome ? t('p.connected.by', { a: short(S.me), w: nome }) : t('p.connected', { a: short(S.me) }));
        //                                     extensão que se passa por outra: a pessoa tem que saber
        if (nome && real && !nome.toLowerCase().includes(real.toLowerCase())) {
          toast(t('p.wallet.mismatch', { picked: nome, real }), 'aviso');
        }
        render();
        await refresh();
      } catch (e) {
        toast(t('p.connErr', { e: Chain.humanError(e) }), 'erro');
      } finally {
        clearTimeout(slow);
        clearTimeout(dead);
        S.connecting = false;
        render();
      }
    },
    /** Esquece a atual e abre a lista de novo. */
    async 'switch-wallet'() {
      leftOn(true); //                           não reconectar sozinho enquanto ele escolhe
      useAccount(null);
      render();
      await Chain.forget();
      pickWallet();
    },
    async disconnect() {
      leftOn(true);
      useAccount(null);
      toast(t('p.disconnected'));
      render();
      await Chain.forget(); //                    a carteira também esquece a permissão deste site
      await refresh();
    },
    /** A carteira está usando uma RPC que limita o envio: reoferece as nossas. */
    async 'fix-rpc'() {
      try {
        await Chain.fixChain();
        toast(t('p.rpc.fixed'));
      } catch (e) {
        toast(t('p.rpc.fixErr', { e: Chain.humanError(e) }), 'erro');
      }
    },
    async 'copy-address'() {
      try {
        await navigator.clipboard.writeText(S.me);
        toast(t('p.copied', { a: short(S.me) }));
      } catch {
        prompt(t('p.copyPrompt'), S.me);
      }
    },
    faucet() {
      return run(t('p.act.faucet'), () => tx(t('p.act.faucetTx'), C.faucet, 'claim()', []));
    },
    qty(delta) {
      S.qty = Math.min(10, Math.max(1, S.qty + delta));
      renderTavern();
    },
    buy() {
      return run(t('p.act.buy'), async () => {
        const total = S.cfg.price * BigInt(S.qty);
        if (S.user.bounty < total) throw new Error(t('p.err.noBounty'));
        // caminho curto: assinar a autorização é de graça e some com uma transação
        if (S.user.allowance < total) {
          try {
            const p = await Chain.signPermit(C.bounty, S.me, C.game, total, BOUNTY_NAME);
            const r = await tx(t('p.act.buyTx', { n: S.qty }), C.game,
              'buySacksWithPermit(uint256,uint256,uint8,bytes32,bytes32)', [S.qty, p.deadline, p.v, p.r, p.s]);
            afterBuy(r);
            return;
          } catch (e) {
            if (e.code === 4001 || /rejeit|recus|denied|rejected/i.test(e.message || '')) throw e;
            toast(t('p.tavern.permitOff'), 'aviso'); //  carteira sem assinatura de tipo: volta pro approve
          }
        }
        await ensureAllowance(total);
        afterBuy(await tx(t('p.act.buyTx', { n: S.qty }), C.game, 'buySacks(uint256)', [S.qty]));
      });
    },
    open(id) {
      if (S.demo) return showReveal({ kind: 'sack', id, expired: false, ids: [1] });
      return run(t('p.act.open'), async () => {
        // "já mandar trabalhar" numa transação só, quando cabe no limite do bando
        const sack = S.user?.sacks.find((k) => k.id === id);
        const auto = S.glob?.v3 && $('#auto-work')?.checked && sack && sack.count <= room();
        const r = auto
          ? await tx(t('p.act.openWorkTx', { id }), C.game, 'openAndWork(uint256,uint256)',
            [id, Math.min(S.shiftLen, S.cfg.maxLife)])
          : await tx(t('p.act.openTx', { id }), C.game, 'openSack(uint256)', [id]);
        const [ev] = Chain.logsOf(r, 'SackOpened'); // (sackId) expired, firstTokenId, count
        if (ev) S.reveal = { kind: 'sack', id, expired: ev.data[0] === 1n, ids: [...Array(Number(ev.data[2])).keys()].map((i) => Number(ev.data[1]) + i) };
      });
    },
    work(ids) {
      return run(t('p.act.work'), async () => {
        const list = ids.map(byId).filter((o) => o && o.status === 0 && o.lifeLeft > 0);
        if (!list.length) throw new Error(t('p.err.noFree'));
        // o contrato recusaria a chamada inteira; melhor dizer antes, com a conta
        if (list.length > room()) throw new Error(t('p.err.cap', { max: S.cfg.maxActive, n: onDuty(), room: room() }));
        const minLeft = Math.min(...list.map((o) => o.lifeLeft));
        const epochs = Math.min(S.shiftLen, minLeft);
        const zera = list.filter((o) => o.lifeLeft === epochs);
        if (zera.length && !confirm(t('p.confirm.zero', { e: epochs, ids: zera.map((o) => '#' + o.id).join(', ') }))) return;
        await tx(t('p.act.workTx', { e: epochs, ids: list.map((o) => '#' + o.id).join(', ') }), C.game,
          'startShift(uint256[],uint256)', [list.map((o) => o.id), epochs]);
      });
    },
    stop(ids) {
      return run(t('p.act.stop'), async () => {
        const list = ids.map(byId).filter((o) => o && o.status === 1);
        if (!list.length) throw new Error(t('p.err.noWorking'));
        await tx(t('p.act.stopTx', { ids: list.map((o) => '#' + o.id).join(', ') }), C.game, 'endShift(uint256[])', [list.map((o) => o.id)]);
      });
    },
    claim(ids) {
      return run(t('p.act.claim'), async () => {
        let list = ids.map(byId).filter((o) => o && o.pending > 0n);
        if (!list.length) { //                   talvez a época tenha virado agorinha: relê antes de desistir
          await refresh();
          list = ids.map(byId).filter((o) => o && o.pending > 0n);
        }
        if (!list.length) {
          showNote(t('p.act.claim'), null, [t('p.claim.notYet', { t: dur(nextEpochIn()) })]);
          return;
        }
        const total = list.reduce((s, o) => s + o.pending, 0n);
        await tx(t('p.act.claimTx', { amount: fmtB(total) }), C.game, 'claim(uint256[])', [list.map((o) => o.id)]);
        showNote(t('p.claim.done'), fmtB(total) + ' $BOUNTY', [
          t('p.claim.next', { t: dur(nextEpochIn()) }),
          t('p.claim.free'),
        ]);
      });
    },
    /** Conserta todo mundo que dá, numa transação só. */
    'repair-all'() {
      return run(t('p.act.repairAll'), async () => {
        const list = (S.user?.outlaws || []).filter((o) => o.status === 0 && o.lifeLeft < S.cfg.maxLife && o.lifeLeft > 0);
        if (!list.length) throw new Error(t('p.err.noRepair'));
        const costs = await Chain.calls(list.map((o) => [C.game, 'repairCost(uint256,uint256)', [o.id, S.cfg.maxLife - o.lifeLeft]]));
        const total = costs.reduce((s, c) => s + c[0], 0n);
        if (S.user.bounty < total) throw new Error(t('p.err.noBounty'));
        if (!confirm(t('p.confirm.repairAll', { n: list.length, cost: fmtB(total) }))) return;
        await ensureAllowance(total);
        await tx(t('p.act.repairAllTx', { n: list.length, cost: fmtB(total) }), C.game, 'repairMany(uint256[],uint256[])',
          [list.map((o) => o.id), list.map((o) => S.cfg.maxLife - o.lifeLeft)]);
      });
    },
    /**
     * Monta o melhor time possível para as vagas que existem — peso primeiro
     * (é ele que decide a paga), vida como desempate — e deixa marcado na
     * tela. NÃO manda trabalhar: quem confirma é a pessoa, no botão verde,
     * depois de ver quem foi escolhido e quanto o time rende.
     */
    'work-best'() {
      const vagas = room();
      if (!vagas) return toast(t('p.bar.why.full', { max: S.cfg.maxActive }), 'aviso');
      const livres = (S.user?.outlaws || [])
        .filter((o) => o.status === 0 && o.lifeLeft > 0)
        .sort((a, b) => b.weight - a.weight || b.lifeLeft - a.lifeLeft);
      if (!livres.length) return toast(t('p.bar.why.noFree'), 'aviso');
      const time = livres.slice(0, Math.min(vagas, livres.length));
      S.selected = new Set(time.map((o) => o.id));
      S.filter = null; //                        tira o filtro pra o time aparecer inteiro
      renderBand();
      renderFusion();
      toast(t('p.lineup.built', { n: time.length }));
    },

    /** Escolhe sozinho um par pronto (o rank mais alto, com mais vida). */
    'fuse-auto'() {
      const pairs = fusePairs();
      if (!pairs.length) return toast(t('p.fuse.none'), 'aviso');
      const [a, b] = pairs[0];
      S.selected = new Set([a.id, b.id]);
      S.filter = null; //                        tira o filtro pra o par aparecer na lista
      renderBand();
      renderFusion();
      loadOdds().then(renderFusion).catch(() => {});
      toast(t('p.fuse.picked', { a: a.id, b: b.id, rank: RANK[a.rank] }));
    },
    /** Todos os pares possíveis numa transação só. */
    'fuse-all'() {
      return run(t('p.act.fuseAll'), async () => {
        const pairs = fusePairs();
        if (!pairs.length) throw new Error(t('p.fuse.none'));
        const total = pairs.reduce((s, [a]) => s + (S.cfg.price * BigInt(a.rank + 1)) / 2n, 0n);
        if (S.user.bounty < total) throw new Error(t('p.err.noBounty'));
        if (!confirm(t('p.confirm.fuseAll', { n: pairs.length, cost: fmtB(total) }))) return;
        await ensureAllowance(total);
        await tx(t('p.act.fuseAllTx', { n: pairs.length }), C.game, 'startFusions(uint256[],uint256[])',
          [pairs.map(([a]) => a.id), pairs.map(([, b]) => b.id)]);
        S.selected.clear();
      });
    },
    /** A torneira, chamada do painel do caixa. */
    'faucet-vault'() {
      return actions.faucet();
    },
    repair(id) {
      return run(t('p.act.repair'), async () => {
        const o = byId(id);
        const used = S.cfg.maxLife - o.lifeLeft;
        const cost = (await Chain.call(C.game, 'repairCost(uint256,uint256)', [id, used]))[0];
        await ensureAllowance(cost);
        await tx(t('p.act.repairTx', { id, used, cost: fmtB(cost) }), C.game, 'repair(uint256,uint256)', [id, used]);
      });
    },
    ransom(id) {
      return run(t('p.act.ransom'), async () => {
        const cost = (await Chain.call(C.game, 'ransomCost(uint256)', [id]))[0];
        await ensureAllowance(cost);
        await tx(t('p.act.ransomTx', { id, cost: fmtB(cost) }), C.game, 'ransom(uint256)', [id]);
      });
    },
    fuse() {
      return run(t('p.act.fuse'), async () => {
        const [a, b] = selectedOutlaws();
        const fee = (S.cfg.price * BigInt(a.rank + 1)) / 2n;
        await ensureAllowance(fee);
        const r = await tx(t('p.act.fuseTx', { a: a.id, b: b.id }), C.game, 'startFusion(uint256,uint256)', [a.id, b.id]);
        const [ev] = Chain.logsOf(r, 'FusionStarted'); //  (fusionId) a, b, success, critical
        if (ev) {
          const fid = Number(ev.topics[1]);
          const [k] = await Chain.calls([[C.game, 'fusions(uint256)', [fid]]], { partial: true });
          if (k) S.pending = autoReveal(() => actions.finish(fid), Number(k[6])).catch(() => {});
        }
        S.selected.clear();
      });
    },
    finish(id) {
      const f = S.user.fusions.find((x) => x.id === id);
      const before = { kind: 'fusion', id, rank: f?.rank, a: byId(f?.a), b: byId(f?.b) }; // os dois, antes de sumirem
      if (S.demo) return showReveal({ ...before, outcome: S.demoRoll++ % 3, newId: 10 });
      return run(t('p.act.finish'), async () => {
        const r = await tx(t('p.act.finishTx', { id }), C.game, 'finishFusion(uint256)', [id]);
        const [ev] = Chain.logsOf(r, 'FusionFinished'); // (fusionId) outcome, newTokenId
        if (ev) S.reveal = { ...before, outcome: Number(ev.data[0]), newId: Number(ev.data[1]) };
      });
    },
  };

  /* ------------------------------------------------------------ fusão */
  function fusionPair() {
    const sel = selectedOutlaws();
    if (sel.length !== 2) return null;
    const [a, b] = sel;
    if (a.rank !== b.rank) return { a, b, invalid: t('p.fuse.sameRank') };
    if (a.rank >= 5) return { a, b, invalid: t('p.fuse.legend') };
    if (a.status !== 0 || b.status !== 0) return { a, b, invalid: t('p.fuse.free') };
    return { a, b };
  }

  /**
   * A chance EXATA que o startFusion vai gravar — mesma conta inteira do
   * contrato. Não usa a leitura fusionOdds() de propósito: ela olha a vida já
   * fechada, e se um turno terminou sem ninguém fechar, mostraria a chance
   * antiga (maior). O startFusion fecha o turno antes; a vida restante do
   * outlaw() já conta esse turno, então esta conta bate com o que vai valer.
   */
  async function loadOdds() {
    const p = fusionPair();
    S.odds = null;
    if (!p || p.invalid) return;
    const full = 2 * S.cfg.maxLife;
    const left = p.a.lifeLeft + p.b.lifeLeft;
    const success = Math.floor(((2000 * full + 4000 * left) * (10 - p.a.rank)) / (10 * full));
    const critical = Math.floor((2500 * (full - left)) / full);
    S.odds = { key: `${p.a.id}-${p.b.id}`, success, fail: 10_000 - success - critical, critical };
  }

  /* ------------------------------------------------------------- aviso */

  /**
   * Saque automático de verdade não existe sem entregar a chave a alguém: cada
   * saque é uma assinatura. O que dá pra fazer bem é avisar — o painel fica de
   * olho no acumulado e chama quando passa do valor, mesmo com a aba no fundo,
   * e o botão de sacar já está aceso ao lado.
   */
  function loadAlarm() {
    try { S.alarm = Number(localStorage.getItem(ALARM_KEY)) || 0; } catch { S.alarm = 0; }
    const campo = $('#alarm-at');
    if (campo && S.alarm) campo.value = String(S.alarm);
  }

  function setAlarm(valor) {
    S.alarm = Number.isFinite(valor) && valor > 0 ? Math.floor(valor) : 0;
    S.alarmed = false;
    try {
      if (S.alarm) localStorage.setItem(ALARM_KEY, String(S.alarm));
      else localStorage.removeItem(ALARM_KEY);
    } catch {}
    if (!S.alarm) return toast(t('p.alarm.off'), 'aviso');
    toast(t('p.alarm.on', { amount: S.alarm.toLocaleString(loc()) }));
    //                                          permissão só depois do clique da pessoa
    try {
      if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    } catch {}
  }

  /** Chama quando o acumulado passa do valor; só uma vez por subida. */
  function checkAlarm() {
    const u = S.user;
    if (!S.alarm || !u || S.demo || S.readOnly) return;
    const parado = u.outlaws.reduce((s, o) => s + o.pending, 0n);
    const alvo = BigInt(S.alarm) * WEI;
    if (parado < alvo) return void (S.alarmed = false); //  saiu do valor: pode avisar de novo
    if (S.alarmed) return;
    S.alarmed = true;
    const recado = t('p.alarm.hit', { amount: fmtB(parado) });
    toast(recado, 'aviso');
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('OUTLAWS', { body: recado, icon: '../site/assets/icon-coin.png' });
      }
    } catch {}
  }

  /* ------------------------------------------------------- próximo passo */

  /**
   * O que fazer agora. A ordem é a do ciclo do jogo — ligar, abastecer, abrir
   * o saco, sacar, trabalhar, comprar, consertar — e o primeiro item que
   * estiver faltando vira a dica. Quem já sabe jogar ignora; quem chegou
   * agora tem sempre um botão óbvio.
   */
  function nextStep() {
    const u = S.user, c = S.cfg;
    if (S.demo || S.readOnly) return null;
    if (!S.me) return { act: 'connect', msg: t('p.next.connect') };
    if (!u || !c || !S.glob) return null;
    if (u.eth === 0n) return { act: 'faucet-vault', msg: t('p.next.eth') };

    const pronto = u.sacks.find((k) => S.glob.block > k.target && S.glob.block <= k.target + drawWindow());
    if (pronto) return { act: 'open', id: pronto.id, msg: t('p.next.open', { id: pronto.id }) };

    const parado = u.outlaws.reduce((s, o) => s + o.pending, 0n);
    if (parado > 0n) return { act: 'b-claim', msg: t('p.next.claim', { amount: fmtB(parado) }) };

    const livres = u.outlaws.filter((o) => o.status === 0 && o.lifeLeft > 0);
    if (livres.length && room() > 0) {
      return { act: 'work-best', msg: t('p.next.work', { n: Math.min(livres.length, room()) }) };
    }
    if (u.bounty >= c.price) return { act: 'buy', msg: t('p.next.buy') };
    if (!u.outlaws.length) return { act: 'faucet-vault', msg: t('p.next.tap') };

    const surrados = u.outlaws.filter((o) => o.status === 0 && o.lifeLeft > 0 && o.lifeLeft < c.maxLife);
    if (surrados.length && S.glob.v3) return { act: 'repair-all', msg: t('p.next.repair', { n: surrados.length }) };
    return null;
  }

  /** Em que aba mora cada ação, pra acender também a aba quando ela está fechada. */
  const TAB_DA_ACAO = { buy: 'taverna', 'fuse-auto': 'fusao', 'fuse-all': 'fusao' };

  /** Escreve a dica no caixa e acende o botão (e a aba) a que ela leva. */
  function renderNextStep() {
    const btn = $('#next-step');
    if (!btn) return;
    for (const el of document.querySelectorAll('.is-next')) el.classList.remove('is-next');
    const passo = nextStep();
    //                                          o saque já tem botão grande logo abaixo: só acende
    btn.hidden = !passo || passo.act === 'b-claim';
    if (!passo) return;

    btn.textContent = passo.msg;
    btn.dataset.act = passo.act;
    if (passo.id === undefined) delete btn.dataset.id;
    else btn.dataset.id = passo.id;
    btn.disabled = !!S.busy;
    btn.classList.add('is-next');

    const alvo = passo.id === undefined
      ? `[data-act="${passo.act}"]`
      : `[data-act="${passo.act}"][data-id="${passo.id}"]`;
    for (const el of document.querySelectorAll(alvo)) el.classList.add('is-next');

    const aba = TAB_DA_ACAO[passo.act];
    if (aba && aba !== S.tab) {
      const chave = document.querySelector(`[data-act="tab"][data-tab="${aba}"]`);
      if (chave) chave.classList.add('is-next');
    }
  }

  /* ----------------------------------------------------------- render */
  function render() {
    renderHeader();
    renderStats();
    renderVaultClaim();
    renderHeist();
    renderStart();
    renderTavern();
    renderBand();
    renderFusion();
    renderLog();
    renderNextStep();
    checkAlarm();
  }

  /**
   * Passo a passo do tester: carteira, ETH pro gás (faucet da Robinhood) e
   * $BOUNTY (a nossa torneira). Some sozinho quando não falta nada, e a
   * torneira fica como uma linha só.
   */
  const SAFETY = () => esc(t('p.safety'));

  /** Os dois jeitos de conseguir ETH de teste, com o endereço à mão pra colar. */
  function ethWays() {
    const copy = S.me ? `<button class="btn" data-act="copy-address">${esc(t('p.eth.copy'))}</button>` : '';
    return `<div class="eth-ways">
      <div><a class="btn btn-gold" href="${C.ethFaucet}" target="_blank" rel="noopener">${esc(t('p.eth.robinhood'))}</a>
        <small>${esc(t('p.eth.robinhoodNote'))}</small></div>
      <div><a class="btn" href="${C.googleFaucet}" target="_blank" rel="noopener">${esc(t('p.eth.google'))}</a>
        <a class="btn" href="${C.bridge}" target="_blank" rel="noopener">${esc(t('p.eth.bridge'))}</a>
        <small>${esc(t('p.eth.googleNote'))}</small></div>
      ${copy}
    </div>`;
  }

  function renderStart() {
    const box = $('#start'), u = S.user;
    const open = !!box.querySelector('.more-eth')?.open; // o redesenho a cada leitura não fecha o que a pessoa abriu
    if (S.readOnly && !S.demo) return void (box.hidden = true);
    box.hidden = false;
    const price = S.cfg?.price || 0n;
    const connected = !!S.me || S.demo;
    const hasEth = !!u && u.eth > 0n;
    const hasBounty = !!u && u.bounty >= price && price > 0n;
    const now = Date.now() / 1000;
    const tap = u?.tap;
    const waitTap = tap && tap.next > now;
    const dry = tap && tap.left < tap.amount;
    const tapLabel = esc(tap ? t('p.tap.get', { amount: fmtB(tap.amount, 0) }) : t('p.tap.getPlain'));

    const tapBtn = !connected || S.demo ? '' : waitTap
      ? `<small class="muted">${esc(t('p.tap.againIn'))} <span data-until="${tap.next}">${dur(tap.next - now)}</span></small>`
      : `<button class="btn ${hasBounty ? '' : 'btn-gold'}" data-act="faucet" ${S.busy || dry || !hasEth ? 'disabled' : ''}
           title="${esc(dry ? t('p.tap.dry') : !hasEth ? t('p.tap.needEth') : t('p.tap.every'))}">${tapLabel}</button>`;

    if (connected && hasEth && hasBounty) { //   já deu os primeiros passos: o painel some
      box.hidden = true; //                      a torneira continua no painel do caixa
      return;
    }
    const step = (ok, n, html) => `<li class="${ok ? 'ok' : ''}"><span class="n">${ok ? '✓' : n}</span><div>${html}</div></li>`;
    box.innerHTML = `<h2>${esc(t('p.start.title'))}</h2><div class="pbody"><p class="safety">${SAFETY()}</p><ol class="steps">
      ${step(connected, 1, connected ? esc(t('p.step1.done')) : `${esc(t('p.step1'))}<br><button class="btn btn-gold" data-act="connect">${esc(t('p.connect'))}</button>`)}
      ${step(hasEth, 2, `${esc(t('p.step2'))}${hasEth ? '' : ethWays()}`)}
      ${step(hasBounty, 3, `${esc(t('p.step3', { price: fmtB(price, 0) }))}<br>${hasEth ? tapBtn : `<small class="muted">${esc(t('p.step3.after'))}</small>`}`)}
    </ol></div>`;
  }

  /**
   * Quem está em serviço vai pro mapa, com o turno (o mapa calcula sozinho, pelo
   * relógio, quem trabalha em cada época) e o que o contrato deve pagar a cada
   * um por época.
   */
  /** Quanto cada um em serviço rende por época, em BOUNTY: 0,5% do caixa livre × peso ÷ peso em serviço. */
  function shares() {
    const u = S.user, g = S.glob;
    const perEpoch = Number((g.free * 50n) / 10_000n / 10n ** 14n) / 10_000; // BOUNTY da época inteira
    const working = u.outlaws.filter((o) => o.status === 1);
    // o peso total nunca é menor que o do próprio bando: a fatia não passa de 100%
    const mine = working.filter((o) => g.epoch >= o.shiftStart).reduce((s, o) => s + o.weight, 0);
    const total = Math.max(Number(g.weight), mine);
    return new Map(working.map((o) => [o.id, total > 0 ? (perEpoch * o.weight) / total : 0]));
  }

  /**
   * O que a época corrente já rendeu, contado a cada segundo (de um boneco, ou
   * do bando). O contrato só paga época fechada: isto entra no saque na virada.
   */
  function accruing(only) {
    const u = S.user, c = S.cfg;
    if (!u || !c || !S.glob) return 0;
    const now = Date.now() / 1000, e = Math.floor((now - c.genesis) / c.epochLength);
    const into = (now - (c.genesis + e * c.epochLength)) / c.epochLength;
    const sh = shares();
    let sum = 0;
    for (const o of u.outlaws) {
      if (only !== undefined && o.id !== only) continue;
      if (o.shiftStart && o.shiftStart <= e && e < o.shiftEnd) sum += (sh.get(o.id) || 0) * into;
    }
    return sum;
  }

  function renderHeist() {
    const u = S.user, g = S.glob, c = S.cfg, box = $('#heist');
    box.hidden = !u || !g || !c;
    if (box.hidden) return;
    const working = u.outlaws.filter((o) => o.status === 1);
    const share = shares();
    Heist.update({
      key: S.view.toLowerCase(),
      genesis: c.genesis,
      epochLength: c.epochLength,
      maxLife: c.maxLife,
      outlaws: working.map((o) => ({
        id: o.id,
        iso: art(o).iso,
        shiftStart: o.shiftStart,
        shiftEnd: o.shiftEnd,
        lifeUsed: o.lifeUsed,
        perEpoch: share.get(o.id) || 0,
      })),
    });
  }

  function renderHeader() {
    const w = $('#wallet');
    if (S.demo) w.innerHTML = `<span class="chip chip-fusao">${esc(t('p.demoChip'))}</span>`;
    else if (S.me) {
      const nome = Chain.walletName();
      w.innerHTML = `<span class="chip chip-livre" title="${esc(S.me)}">${nome ? esc(nome) + ' · ' : ''}${esc(short(S.me))}</span>
      <button class="btn" data-act="switch-wallet">${esc(t('p.wallet.switch'))}</button>
      <button class="btn" data-act="disconnect" title="${esc(t('p.disconnect.title'))}">${esc(t('p.disconnect'))}</button>`;
    }
    else if (S.connecting) w.innerHTML = `<button class="btn" disabled>${esc(t('p.conn.opening'))}</button>`;
    else w.innerHTML = `<button class="btn btn-gold" data-act="connect">${esc(t('p.connect'))}</button>`;

    const banner = $('#banner');
    if (S.demo) {
      banner.hidden = false;
      banner.innerHTML = t('p.banner.demo');
    } else if (S.readOnly && S.view) {
      banner.hidden = false;
      banner.innerHTML = t('p.banner.readonly', { a: esc(short(S.view)) });
    } else banner.hidden = true;

    const u = S.user;
    $('#balances').innerHTML = u
      ? `<span class="pill"><img src="../site/assets/icon-coin.png" alt="" width="22" height="22"><span><span class="k">$BOUNTY</span><span class="v">${fmtB(u.bounty)}</span></span></span>
         <span class="pill"><i></i><span><span class="k">ETH</span><span class="v">${fmtB(u.eth, 4)}</span></span></span>`
      : '';
  }

  /** O saque na tela principal: o que já rendeu, subindo, e o botão. */
  function renderVaultClaim() {
    const box = $('#vault-claim'), u = S.user;
    if (!box) return;
    if (!u || S.readOnly) return void (box.innerHTML = '');
    const pending = u.outlaws.reduce((s, o) => s + o.pending, 0n);
    const earning = u.outlaws.some((o) => o.status === 1 && S.glob.epoch >= o.shiftStart);
    if (!pending && !earning) return void (box.innerHTML = '');
    box.innerHTML = `<button class="btn btn-gold" data-act="b-claim" ${S.busy ? 'disabled' : ''}>${
      pending > 0n ? esc(t('p.bar.claimAllN', { amount: fmtB(pending) })) : esc(t('p.bar.accruing'))}</button>`
      + (earning ? `<span class="live"><span data-accrue>+${dec(accruing())}</span> ${esc(t('p.vault.live'))}</span>` : '');
  }

  function renderStats() {
    const g = S.glob, c = S.cfg;
    if (!g || !c) return;
    const perEpoch = (g.free * 50n) / 10_000n;
    $('#stat-pool').textContent = fmtB(g.free, 0);
    $('#stat-pool-2').textContent = fmtB(g.free, 0);
    $('#stat-emission').textContent = fmtB(perEpoch, 1);
    $('#stat-weight').textContent = (Number(g.weight) / 10_000).toLocaleString(loc(), { maximumFractionDigits: 2 }) + '×';
    $('#stat-epoch').textContent = g.epoch;
    tick();
  }

  /** Segundos até a próxima época (quando o turno começa e quando a vida desce). */
  function nextEpochIn() {
    const c = S.cfg, now = Date.now() / 1000;
    return c.genesis + (Math.floor((now - c.genesis) / c.epochLength) + 1) * c.epochLength - now;
  }

  function tick() {
    const c = S.cfg;
    if (!c) return;
    const left = dur(nextEpochIn());
    $('#stat-next').textContent = left;
    for (const el of document.querySelectorAll('[data-next]')) el.textContent = left;
    for (const el of document.querySelectorAll('[data-until]')) el.textContent = dur(Number(el.dataset.until) - Date.now() / 1000);
    for (const el of document.querySelectorAll('[data-accrue]')) {
      const id = el.dataset.accrue ? Number(el.dataset.accrue) : undefined;
      const v = dec(accruing(id));
      el.textContent = id === undefined ? '+' + v : t('p.card.accrue', { amount: v });
    }
    // a época virou: o que ela rendeu já é sacável — relê agora em vez de esperar os 20 s
    const e = Math.floor((Date.now() / 1000 - c.genesis) / c.epochLength);
    if (S.glob && !S.demo && !S.busy && e > S.glob.epoch && S.turned !== e && nextEpochIn() < c.epochLength - 4) {
      S.turned = e;
      refresh();
    }

    const u = S.user;
    if (S.demo || S.busy || !u) return;
    const waiting = [...u.sacks, ...u.fusions].some((k) => S.glob.block <= k.target);
    if (!waiting) return;
    for (const el of document.querySelectorAll('[data-draw]')) el.textContent = drawText(Number(el.dataset.draw));
    andaNaEstrada();
    if (Date.now() - S.glob.at > 6000) refresh();
  }

  function renderTavern() {
    const c = S.cfg, u = S.user;
    if (!c) return;
    const total = c.price * BigInt(S.qty);
    $('#qty').textContent = S.qty;
    $('#price').textContent = fmtB(total, 0);
    const semGrana = !!u && u.bounty < total;
    $('#buy').disabled = S.busy || S.readOnly || !u || semGrana;
    const faltaGrana = $('#buy-why');
    if (faltaGrana) {
      faltaGrana.hidden = !semGrana;
      if (semGrana) faltaGrana.textContent = t('p.tavern.short', { falta: fmtB(total - u.bounty, 0) });
    }
    $('#buy').title = semGrana ? t('p.tavern.short', { falta: fmtB(total - u.bounty, 0) }) : '';
    $('#approve-note').hidden = !(u && !S.readOnly && u.allowance < total);

    const list = $('#sacks'), quadro = $('#sacks-panel');
    if (!u || !u.sacks.length) { //             sem saco por abrir, o quadro nem aparece
      list.innerHTML = '';
      if (quadro) quadro.hidden = true;
      return;
    }
    if (quadro) quadro.hidden = false;
    const block = S.glob.block;
    const sig = u.sacks.map((k) => `${k.id}:${block > k.target}`).join(',');
    if (list.dataset.sig !== sig) { //            só redesenha quando muda de verdade: a cena é animada
      list.dataset.sig = sig;
      list.innerHTML = u.sacks.map((k) => {
        const ready = block > k.target;
        const expired = block > k.target + drawWindow();
        let state;
        if (!ready) state = `<span data-draw="${k.target}">${drawText(k.target)}</span>`;
        else if (expired) state = t('p.sack.expired');
        else state = t('p.sack.ready', { t: dur((k.target + drawWindow() - block) * blockSecs()) });
        return `<div class="sack ${ready ? 'is-ready' : ''}">
          <canvas data-road="${k.id}" role="img" aria-label="${esc(t('p.road.aria'))}"></canvas>
          <div class="sack-foot">
            <div><b>${esc(t('p.sack.row', { id: k.id }))} · ${esc(t('p.sack.count', { n: k.count }))}</b><small>${state}</small></div>
            <button class="btn ${ready ? 'btn-gold' : ''}" data-act="open" data-id="${k.id}" ${!ready || S.busy ? 'disabled' : ''}>${esc(t('p.open'))}</button>
          </div>
        </div>`;
      }).join('');
      for (const cv of list.querySelectorAll('[data-road]')) window.Road.mount(cv, Number(cv.dataset.road));
    }
    andaNaEstrada();
  }

  /**
   * Onde cada vulto está na estrada: o quanto já andou da espera do sorteio.
   * Espera curta (o contrato novo sorteia em ~1 s) vira uma corrida rápida;
   * quando o sorteio cai, ele fica parado no portão até alguém abrir o saco.
   */
  function andaNaEstrada() {
    if (!window.Road || !S.user || !S.glob) return;
    window.Road.sync(S.user.sacks.map((k) => {
      const ready = S.glob.block > k.target;
      const total = 3 * blockSecs(); //        a espera inteira: o sorteio sai 2 blocos depois da compra
      const falta = Math.max(0, drawIn(k.target));
      return { id: k.id, ready, progress: ready ? 1 : Math.max(0, Math.min(1, 1 - falta / total)) };
    }));
  }

  /** Quantos contam pro limite de um turno que comece agora (a conta de activeCount no contrato). */
  function onDuty() {
    return S.user ? S.user.outlaws.filter((o) => o.shiftStart !== 0 && o.shiftEnd > S.glob.epoch + 1).length : 0;
  }
  /** Vagas pra mandar trabalhar; Infinity num contrato sem limite. */
  const room = () => (S.cfg.maxActive ? Math.max(0, S.cfg.maxActive - onDuty()) : Infinity);

  function lifeClass(o, max) {
    const r = o.lifeLeft / max;
    return r > 0.5 ? 'ok' : r > 0.2 ? 'mid' : 'low';
  }

  function card(o) {
    const c = S.cfg;
    const { url, iso } = art(o);
    const sel = S.selected.has(o.id);
    const bounty = T.RANKS[o.rank].bounty.toLocaleString(loc());
    const endsAt = c.genesis + o.shiftEnd * c.epochLength;
    let info = '';
    const next = '<span data-next>' + dur(nextEpochIn()) + '</span>';
    if (o.status === 1) {
      const started = S.glob.epoch >= o.shiftStart;
      info = started
        ? esc(t('p.card.until', { e: o.shiftEnd - 1, t: dur(endsAt - Date.now() / 1000) })) +
          (S.glob.epoch + 1 < o.shiftEnd ? '<br>' + t('p.card.lifeIn', { next }) : '')
        : t('p.card.startsIn', { next });
    }
    if (o.status === 1 && S.glob.epoch >= o.shiftStart && o.shiftEnd === S.glob.epoch + 1) info += '<br>' + esc(t('p.card.leaving'));
    if (o.status === 2) info = esc(t('p.card.captured'));
    if (o.status === 3) info = esc(t('p.card.inFusion', { id: o.fusion }));

    const acts = [];
    if (o.pending > 0n) acts.push(`<button class="btn btn-gold" data-act="claim" data-id="${o.id}">${esc(t('p.card.claim', { amount: fmtB(o.pending) }))}</button>`);
    if (o.status === 0 && o.lifeLeft > 0) {
      const full = room() === 0;
      acts.push(`<button class="btn" data-act="work" data-id="${o.id}"${full ? ` disabled title="${esc(t('p.card.capFull', { max: c.maxActive }))}"` : ''}>${esc(t('p.card.work'))}</button>`);
    }
    if (o.status === 0 && o.repair !== undefined) acts.push(`<button class="btn" data-act="repair" data-id="${o.id}" title="${esc(t('p.card.repair.title'))}">${esc(t('p.card.repair', { cost: fmtB(o.repair) }))}</button>`);
    if (o.status === 1 && S.glob.epoch >= o.shiftStart) acts.push(`<span class="accrue-chip" data-accrue="${o.id}" title="${esc(t('p.bar.accrue.title'))}">${esc(t('p.card.accrue', { amount: dec(accruing(o.id)) }))}</span>`);
    if (o.status === 1) acts.push(`<button class="btn" data-act="stop" data-id="${o.id}">${esc(t('p.card.stop'))}</button>`);
    if (o.status === 2 && o.ransom !== undefined) acts.push(`<button class="btn btn-danger" data-act="ransom" data-id="${o.id}">${esc(t('p.card.ransom', { cost: fmtB(o.ransom) }))}</button>`);

    return `<article class="card ${rarityClass(o.rank)} ${sel ? 'is-sel' : ''} st-${STATUS_KEY[o.status]}" style="${rarityStyle(o.rank)}">
      <label class="pick" title="${esc(t('p.card.select'))}"><input type="checkbox" data-act="select" data-id="${o.id}" ${sel ? 'checked' : ''}></label>
      <img src="${url}" alt="${esc(t('p.card.alt', { id: o.id }))}" width="96" height="96">
      <div class="c-id">#${o.id}</div>
      <div class="c-rank">${gem}${esc(RANK[o.rank])}</div>
      <div class="c-title">${esc(TITLE[o.rank])}</div>
      <div class="c-bounty">${bounty} $BOUNTY</div>
      <dl class="c-stats">
        <div><dt>${esc(t('p.card.aim'))}</dt><dd>${dec(iso.stats.pontaria)}</dd></div>
        <div><dt>${esc(t('p.card.str'))}</dt><dd>${dec(iso.stats.forca)}</dd></div>
        <div><dt>${esc(t('p.card.stl'))}</dt><dd>${dec(iso.stats.furtividade)}</dd></div>
        <div><dt>${esc(t('p.card.wt'))}</dt><dd>${dec(o.weight / 10_000)}×</dd></div>
      </dl>
      <div class="life ${lifeClass(o, c.maxLife)}" title="${esc(t('p.card.life'))}">
        <span style="width:${(o.lifeLeft / c.maxLife) * 100}%"></span>
        <em>${esc(t('p.card.lifeN', { n: o.lifeLeft, max: c.maxLife }))}</em>
      </div>
      <div class="c-status"><span class="chip chip-${STATUS_KEY[o.status]}">${
        o.status === 1 && o.shiftEnd === S.glob.epoch + 1 ? esc(t('p.st.leaving')) : STATUS[o.status]}</span><small>${info}</small></div>
      <div class="c-acts">${acts.join('')}</div>
    </article>`;
  }

  function renderBand() {
    const u = S.user, box = $('#band');
    if (!S.view) {
      box.innerHTML = `<div class="empty"><p>${esc(t('p.band.connect'))}</p>
        <button class="btn btn-gold" data-act="connect">${esc(t('p.connect'))}</button></div>`;
      $('#bar').hidden = true;
      return;
    }
    if (!u) {
      box.innerHTML = `<p class="muted">${esc(t('p.band.reading'))}</p>`;
      return;
    }
    if (!u.outlaws.length) {
      box.innerHTML = `<div class="empty"><p>${esc(t('p.band.empty'))}</p></div>`;
      $('#bar').hidden = true;
      return;
    }
    renderFilters($('#band-filter'), u.outlaws, S.filter, (r) => { S.filter = r; renderBand(); });
    const ORDEM = { 1: 0, 0: 1, 3: 2, 2: 3 }; //  em serviço, livre, em fusão, capturado
    const shown = (S.filter === null ? u.outlaws : u.outlaws.filter((o) => o.rank === S.filter))
      .slice()
      .sort((a, b) => ORDEM[a.status] - ORDEM[b.status] || b.weight - a.weight || a.id - b.id);
    box.innerHTML = shown.length ? shown.map(card).join('')
      : `<div class="empty"><p>${esc(t('p.filter.none'))}</p></div>`;

    const sel = selectedOutlaws();
    const free = sel.filter((o) => o.status === 0 && o.lifeLeft > 0);
    const working = sel.filter((o) => o.status === 1);
    const pending = u.outlaws.reduce((s, o) => s + o.pending, 0n);
    $('#bar').hidden = S.readOnly;
    $('#bar-count').textContent = sel.length ? t('p.bar.count', { n: sel.length }) : t('p.bar.none');
    const duty = $('#bar-duty'), max = S.cfg.maxActive;
    duty.hidden = !max;
    /* "Mais de 10 trabalhando" é o turno que termina nesta época: ele ainda
       rende hoje, mas já não ocupa vaga pro turno seguinte — que é o que o
       contrato conta. A tela diz os dois números pra ninguém achar que o
       limite furou. */
    const saindo = u.outlaws.filter((o) => o.status === 1 && o.shiftEnd === S.glob.epoch + 1).length;
    if (max) {
      duty.textContent = t('p.bar.duty', { n: onDuty(), max }) + (saindo ? ' · ' + t('p.bar.leaving', { n: saindo }) : '');
      duty.classList.toggle('is-full', room() === 0);
    }
    $('#shift').value = S.shiftLen;
    const livres = u.outlaws.filter((o) => o.status === 0 && o.lifeLeft > 0);
    const cheio = room() === 0;
    /* Botão apagado sem explicação parece botão quebrado — foi o que aconteceu
       com o bando cheio. Agora a barra diz o motivo e cada botão repete no título. */
    const vagas = room();
    const demais = free.length > vagas; //        o contrato recusa; a tela nem deixa tentar
    const motivo = cheio ? t('p.bar.why.full', { max })
      : !livres.length ? t('p.bar.why.noFree')
      : !free.length ? t('p.bar.why.noSel')
      : demais ? t('p.bar.why.over', { n: free.length, room: vagas, x: free.length - vagas })
      : '';
    const porque = $('#bar-why');
    if (porque) {
      porque.textContent = motivo;
      porque.hidden = !motivo || S.readOnly; //  sem barra de ações, não há botão pra explicar
    }
    $('#b-work').disabled = S.busy || !free.length || cheio || demais;
    $('#b-work').title = motivo;
    const melhores = $('#b-best');
    if (melhores) {
      melhores.disabled = S.busy || !livres.length || cheio;
      melhores.title = cheio ? t('p.bar.why.full', { max }) : !livres.length ? t('p.bar.why.noFree') : '';
    }
    const repairAll = $('#b-repair');
    if (repairAll) {
      repairAll.hidden = !S.glob?.v3; //          conserto em lote só existe no contrato novo
      const surrados = u.outlaws.filter((o) => o.status === 0 && o.lifeLeft > 0 && o.lifeLeft < S.cfg.maxLife);
      repairAll.disabled = S.busy || !surrados.length;
      repairAll.title = surrados.length ? '' : t('p.bar.why.noRepair');
    }
    $('#b-stop').disabled = S.busy || !working.length;
    $('#b-stop').title = working.length ? '' : t('p.bar.why.noWorking');
    /* O resumo da escalação: quem está marcado, quanto pesa e o que isso
       deve render por época. É o que faltava pra "escolher os melhores" ser
       uma decisão e não um chute. */
    const resumo = $('#lineup-sum');
    if (resumo) {
      const podem = free.filter((o) => !S.selected.size || S.selected.has(o.id));
      const peso = podem.reduce((s, o) => s + o.weight, 0);
      resumo.hidden = !podem.length;
      if (podem.length) {
        const total = Number(S.glob.weight) + peso;
        const porEpoca = total > 0 ? (Number(S.glob.free / WEI) * 0.005 * peso) / total : 0;
        resumo.innerHTML = t('p.lineup.sum', {
          n: podem.length,
          w: dec(peso / 10_000),
          b: Math.round(porEpoca).toLocaleString(loc()),
          e: S.shiftLen,
        });
      }
    }
  }

  /**
   * Fileira de filtros por raridade: "todos" e um por rank que a pessoa tem,
   * com a contagem. Serve pro bando e pra fusão.
   */
  function renderFilters(box, list, active, onPick) {
    if (!box) return;
    const counts = new Map();
    for (const o of list) counts.set(o.rank, (counts.get(o.rank) || 0) + 1);
    const ranks = [...counts.keys()].sort((a, b) => a - b);
    box.innerHTML = `<button data-filter="" aria-pressed="${active === null}">${esc(t('p.filter.all'))} <span class="n">${list.length}</span></button>`
      + ranks.map((r) => `<button data-filter="${r}" aria-pressed="${active === r}" style="${rarityStyle(r)}">
          <i class="gem"></i>${esc(RANK[r])} <span class="n">${counts.get(r)}</span></button>`).join('');
    box.onclick = (e) => {
      const b = e.target.closest('[data-filter]');
      if (!b) return;
      onPick(b.dataset.filter === '' ? null : Number(b.dataset.filter));
    };
  }

  /**
   * Os pares que dá pra fundir agora: mesmo rank, livres e com vida, do rank
   * mais alto pro mais baixo e com a vida mais alta primeiro (melhor chance).
   */
  function fusePairs() {
    const free = (S.user?.outlaws || []).filter(fusable);
    const byRank = new Map();
    for (const o of free) {
      if (!byRank.has(o.rank)) byRank.set(o.rank, []);
      byRank.get(o.rank).push(o);
    }
    const pairs = [];
    for (const r of [...byRank.keys()].sort((a, b) => b - a)) {
      const list = byRank.get(r).sort((a, b) => b.lifeLeft - a.lifeLeft);
      for (let i = 0; i + 1 < list.length; i += 2) pairs.push([list[i], list[i + 1]]);
    }
    return pairs;
  }

  /** Quem pode entrar numa fusão: livre, com vida e abaixo de Lenda. */
  const fusable = (o) => o.status === 0 && o.lifeLeft > 0 && o.rank < 5;

  /** A lista de candidatos da aba Fusão: clicar escolhe (no máximo dois). */
  function renderFuseList() {
    const box = $('#fuse-list'), u = S.user;
    const all = document.querySelector('[data-act="fuse-all"]');
    if (all) all.hidden = !S.glob?.v3; //          fusão em lote idem
    if (!box) return;
    if (!u) return void (box.innerHTML = '');
    const free = u.outlaws.filter(fusable);
    renderFilters($('#fuse-filter'), free, S.fuseFilter, (r) => { S.fuseFilter = r; renderFuseList(); });
    const shown = S.fuseFilter === null ? free : free.filter((o) => o.rank === S.fuseFilter);
    // mesma lista na tela: só remarca quem está escolhido (redesenhar tirava o clique do lugar)
    const sig = shown.map((o) => o.id).join(",");
    if (box.dataset.sig === sig && shown.length) {
      for (const b of box.querySelectorAll(".fuse-pick")) b.setAttribute("aria-pressed", String(S.selected.has(Number(b.dataset.id))));
      return;
    }
    box.dataset.sig = sig;
    box.innerHTML = shown.length
      ? shown.map((o) => `<button class="fuse-pick" data-act="pick-fuse" data-id="${o.id}" aria-pressed="${S.selected.has(o.id)}" style="${rarityStyle(o.rank)}">
          <img src="${art(o).url}" alt="" width="64" height="64"><b>${esc(RANK[o.rank])}</b><small>#${o.id}</small></button>`).join('')
      : `<p class="muted">${esc(t(free.length ? 'p.filter.none' : 'p.fuse.none'))}</p>`;
  }

  function renderFusion() {
    renderFuseList();
    const box = $('#fusion');
    const emLote = $('#b-fuse-all');
    if (emLote) emLote.hidden = !S.glob?.v3; //   fundir tudo de uma vez só existe no contrato novo
    const podeFundir = (S.user?.outlaws || []).filter(fusable).length >= 2;
    const faltaPar = podeFundir ? '' : t('p.bar.why.noFuse');
    const auto = $('#b-fuse-auto');
    if (auto) { auto.disabled = S.busy || !podeFundir; auto.title = faltaPar; }
    if (emLote) { emLote.disabled = S.busy || !podeFundir; emLote.title = faltaPar; }

    const p = S.user ? fusionPair() : null;
    const pendentes = S.user?.fusions || [];
    let html = '';
    if (!p) {
      html = `<p class="muted">${t('p.fuse.pick')}</p>`;
    } else if (p.invalid) {
      html = `<p class="t-danger">${esc(p.invalid)}</p>`;
    } else {
      const fee = (S.cfg.price * BigInt(p.a.rank + 1)) / 2n;
      const o = S.odds && S.odds.key === `${p.a.id}-${p.b.id}` ? S.odds : null;
      const pct = (v) => (v / 100).toLocaleString(loc(), { maximumFractionDigits: 1 }) + '%';
      html = `<p>#${p.a.id} + #${p.b.id} → <b>${esc(RANK[p.a.rank + 1])}</b></p>` + (o ? `
        <div class="odds">
          <span class="o-ok" style="flex:${o.success}"></span><span class="o-mid" style="flex:${o.fail}"></span><span class="o-bad" style="flex:${o.critical || 0.0001}"></span>
        </div>
        <dl class="odds-legend">
          <div><dt>${esc(t('p.fuse.success'))}</dt><dd>${pct(o.success)}</dd></div>
          <div><dt>${esc(t('p.fuse.fail', { id: p.b.id }))}</dt><dd>${pct(o.fail)}</dd></div>
          <div><dt>${esc(t('p.fuse.crit'))}</dt><dd>${pct(o.critical)}</dd></div>
        </dl>` : `<p class="muted">${esc(t('p.fuse.calc'))}</p>`) + `
        <p class="muted">${esc(t('p.fuse.fee', { fee: fmtB(fee, 0) }))}</p>
        <button class="btn btn-gold" data-act="fuse" ${S.busy || !o || S.readOnly ? 'disabled' : ''}>${esc(t('p.fuse.start'))}</button>`;
    }
    if (pendentes.length) {
      const block = S.glob.block;
      html += (html ? '<div class="sep"></div>' : '') + pendentes.map((f) => {
        const ready = block > f.target;
        return `<div class="row"><div><b>${esc(t('p.fuse.row', { id: f.id }))}</b> · #${f.a} + #${f.b}<br><small>${!ready ? `<span data-draw="${f.target}">${drawText(f.target)}</span>`
          : block > f.target + 256 ? t('p.fuse.expired')
          : t('p.fuse.ready', { t: dur((f.target + drawWindow() - block) * blockSecs()) })}</small></div>
          <button class="btn ${ready ? 'btn-gold' : ''}" data-act="finish" data-id="${f.id}" ${!ready || S.busy ? 'disabled' : ''}>${esc(t('p.fuse.reveal'))}</button></div>`;
      }).join('');
    }
    box.innerHTML = html;
  }

  function renderLog() {
    $('#log').innerHTML = S.log.length
      ? S.log.map((l) => `<li class="log-${l.kind}"><time>${l.at.toLocaleTimeString(loc())}</time> ${esc(l.msg)}${
        /^0x[0-9a-fA-F]{64}$/.test(l.hash || '') ? ` <a href="${C.explorer}/tx/${l.hash}" target="_blank" rel="noopener">${esc(t('p.log.view'))}</a>` : ''}</li>`).join('')
      : `<li class="muted">${esc(t('p.log.empty'))}</li>`;
  }

  /* ----------------------------------------------------------- eventos */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const act = b.dataset.act, id = Number(b.dataset.id);
    if (act === 'select') {
      if (b.checked) S.selected.add(id);
      else S.selected.delete(id);
      renderBand();
      renderFusion();
      loadOdds().then(renderFusion).catch(() => {});
      return;
    }
    if (act === 'qty-') return actions.qty(-1);
    if (act === 'qty+') return actions.qty(1);
    if (act === 'select-free') {
      S.selected = new Set(S.user.outlaws.filter((o) => o.status === 0 && o.lifeLeft > 0).map((o) => o.id));
      renderBand();
      renderFusion();
      return;
    }
    if (act === 'clear') {
      S.selected.clear();
      renderBand();
      renderFusion();
      return;
    }
    if (act === 'tab') return showTab(b.dataset.tab);
    if (act === 'board-refresh') return wantBoard(true);
    if (act === 'pick-fuse') { //                no máximo dois escolhidos: o terceiro empurra o mais antigo
      if (S.selected.has(id)) S.selected.delete(id);
      else {
        const keep = [...S.selected].filter((x) => byId(x) && fusable(byId(x)));
        while (keep.length >= 2) S.selected.delete(keep.shift());
        S.selected.add(id);
      }
      renderFuseList();
      renderBand();
      renderFusion();
      loadOdds().then(renderFusion).catch(() => {});
      return;
    }
    if (act === 'fix-rpc') return actions['fix-rpc']();
    if (act === 'use-wallet') { $('#wallets').close(); return actions.connect(b.dataset.rdns); }
    if (act === 'close-wallets') return $('#wallets').close();
    if (act === 'close-note') return $('#note').close();
    if (act === 'ajustes') return $('#ajustes').showModal();
    if (act === 'close-ajustes') return $('#ajustes').close();
    if (act === 'b-work') return actions.work([...S.selected]);
    if (act === 'b-stop') return actions.stop([...S.selected]);
    if (act === 'b-claim') return actions.claim(S.user.outlaws.map((o) => o.id));
    if (act === 'claim') return actions.claim([id]);
    if (act === 'work') return actions.work([id]);
    if (act === 'stop') return actions.stop([id]);
    if (actions[act]) return actions[act](id);
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'alarm-at') return setAlarm(Number(e.target.value));
    if (e.target.id === 'shift') {
      const v = Math.max(1, Math.min(S.cfg?.maxLife || 30, Number(e.target.value) || 1));
      S.shiftLen = v;
    }
  });

  // carteira que se anunciou depois do carregamento (aba em segundo plano)
  window.addEventListener('outlaws:wallets', () => { if (!S.me && !S.demo && !S.readOnly) render(); });

  // ao voltar pra aba: talvez a permissão tenha sido dada na extensão, sem a página ver
  document.addEventListener('visibilitychange', async () => {
    if (document.hidden || S.demo || S.readOnly || S.me || S.connecting || !Chain.hasWallet()) return;
    const acc = await Chain.accounts();
    if (!acc[0]) return;
    useAccount(acc[0]);
    toast(t('p.connected', { a: short(S.me) }));
    render();
    refresh();
  });

  if (Chain.hasWallet()) {
    Chain.onWallet('accountsChanged', (acc) => {
      if (!S.me || S.readOnly) return; // só segue a carteira que está conectada aqui
      if (acc[0]?.toLowerCase() === S.me.toLowerCase()) return;
      useAccount(acc[0]);
      toast(S.me ? t('p.acc.switched', { a: short(S.me) }) : t('p.acc.gone'), 'aviso');
      render();
      refresh();
    });
    Chain.onWallet('chainChanged', () => refresh());
  }

  /* ------------------------------------------------------------ início */
  async function start() {
    // O GitHub Pages não deixa mandar cabeçalho anti-moldura; então o próprio
    // painel se recusa a rodar dentro de outra página.
    if (window.top !== window.self) {
      document.body.innerHTML = '<p style="padding:24px;font:16px sans-serif;color:#DCE0D2">' + esc(t('p.framed')) + ' <a style="color:#F2CE7E" target="_top" href="' + esc(location.href) + '">' + esc(t('p.framed.open')) + '</a></p>';
      return;
    }
    const watch = params.get('carteira');
    if (S.demo) demoState();
    else if (watch && /^0x[0-9a-fA-F]{40}$/.test(watch)) {
      S.view = watch;
      S.readOnly = true;
    } else if (Chain.hasWallet() && !hasLeft()) {
      try {
        const acc = await Chain.accounts(); //      sem pop-up: só se já autorizou
        if (acc[0]) {
          S.me = acc[0];
          S.view = acc[0];
        }
      } catch {}
    }
    const trocou = resetOnNewGame();
    loadLog();
    loadAlarm();
    Heist.mount($('#heist-map'));
    let tab = 'bando';
    try { tab = localStorage.getItem('outlaws:tab') || tab; } catch {}
    tab = params.get('tab') || tab;
    showTab(document.getElementById('tab-' + tab) ? tab : 'bando');
    if (trocou) toast(t('p.newGame'), 'aviso'); //  o jogo recomeçou noutro contrato
    I18N.onChange(() => render());
    render();
    await refresh();
    setInterval(tick, 1000);
    setInterval(() => { if (!S.busy) refresh(); }, 20_000);
    setInterval(() => { if (!S.busy && S.tab === 'ranking') wantBoard(); }, 60_000);
  }
  start();
})();

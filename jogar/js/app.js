/*
 * OUTLAWS — o painel do jogo.
 *
 *   ?carteira=0x…   mostra o bando de qualquer carteira, só leitura
 *   ?demo           bando de exemplo, sem tocar na rede (pra ver o visual)
 */
(function () {
  'use strict';
  const { Chain, OutlawsLib, Heist } = window;
  const C = Chain.CFG;
  const T = OutlawsLib.traits;
  const SP = OutlawsLib.sprite;
  const $ = (s, el = document) => el.querySelector(s);
  const params = new URLSearchParams(location.search);

  const RANK = ['Ninguém', 'Ladrão', 'Foragido', 'Procurado', 'Inimigo da Coroa', 'Lenda'];
  const STATUS = ['Livre', 'Em serviço', 'Capturado', 'Na fusão'];
  const STATUS_KEY = ['livre', 'servico', 'capturado', 'fusao'];
  const L1_SECONDS = 12; // o contrato conta blocos da L1 (Sepolia): ~12 s cada

  const S = {
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

  /* ------------------------------------------------------ formatação */
  const WEI = 10n ** 18n;
  function fmtB(wei, digits = 2) {
    const neg = wei < 0n;
    const v = neg ? -wei : wei;
    const n = Number(v / 10n ** 14n) / 10_000;
    return (neg ? '-' : '') + n.toLocaleString('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
  }
  const short = (a) => (a ? a.slice(0, 6) + '…' + a.slice(-4) : '');
  /** Segundos até o sorteio sair, descontando o tempo desde a última leitura. */
  const drawIn = (target) => (target - S.glob.block + 1) * L1_SECONDS - (Date.now() - S.glob.at) / 1000;
  const drawText = (target) => {
    const left = drawIn(target);
    return left > 0 ? `sorteio em ~${dur(left)}` : 'sorteio saindo…';
  };

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
    const [[price], [len], [life], [gen]] = await Chain.calls([
      [C.game, 'sackPrice()'],
      [C.game, 'epochLength()'],
      [C.game, 'maxLife()'],
      [C.game, 'genesis()'],
    ]);
    S.cfg = { price, epochLength: Number(len), maxLife: Number(life), genesis: Number(gen) };
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
      [C.multicall, 'getBlockNumber()'], // o bloco da L1, o mesmo que o contrato enxerga
      [C.game, 'nextToSettle()'],
    ]);
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
    S.glob = { epoch: Number(epoch), weight, owed, avg, pool, free: pool - owed, block: Number(block), at: Date.now() };
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
      toast('Não consegui ler a rede: ' + Chain.humanError(e), 'erro');
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
    S.cfg = { price: 1000n * WEI, epochLength: 3600, maxLife: 30, genesis: Math.floor(Date.now() / 1000) - 5 * 3600 - 1200 };
    S.glob = { epoch: 5, weight: 88_000n, owed: 1n, avg: 0n, pool: 101_675n * WEI, free: 101_675n * WEI, block: 1000, at: Date.now() };
    const outlaws = seeds.map((seed, i) => {
      const rank = ranks[i];
      const lifeLeft = st[i] === 2 ? 0 : 30 - ((i * 7) % 24);
      return {
        id: i + 1, seed, rank, flags: 0, weight: T.derive(seed).raw.weightBps, lifeUsed: 30 - lifeLeft, ransoms: 0,
        shiftStart: 4, shiftEnd: 4 + 6 + i, fusion: st[i] === 3 ? 1 : 0, lifeLeft, status: st[i],
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
  const OUTCOME = ['SUCESSO', 'FALHOU', 'CRÍTICA'];

  function revealCard(o, cls = '') {
    const { url, iso } = art(o);
    const st = iso.stats;
    return `<figure class="rv-card ${cls}">
      <img src="${url}" alt="Fora-da-lei #${o.id}" width="128" height="128">
      <figcaption><span class="rv-id">#${o.id}</span><b>${esc(RANK[o.rank])}</b>
        <small>Pont. ${st.pontaria.toFixed(0)} · Força ${st.forca.toFixed(0)} · Furt. ${st.furtividade.toFixed(0)}<br>Peso ${(o.weight / 10_000).toFixed(2)}×</small>
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

  async function showReveal(rv) {
    let title, lead, body, bad = false;
    if (rv.kind === 'sack') {
      const got = (await Promise.all(rv.ids.map(outlawById))).filter(Boolean);
      title = `SACO #${rv.id} ABERTO`;
      lead = rv.expired
        ? 'O prazo tinha vencido: saiu no piso (Ninguém, stats mínimos).'
        : got.length === 1 ? 'Entrou no bando:' : `Entraram ${got.length} no bando:`;
      body = got.map((o) => revealCard(o, 'is-new')).join('');
      toast(`Saco #${rv.id}: ${got.map((o) => `#${o.id} ${RANK[o.rank]}`).join(', ')}`, 'ok');
    } else {
      const { a, b } = rv;
      const names = a && b ? `#${a.id} e #${b.id} (${RANK[rv.rank]})` : 'os dois';
      title = `FUSÃO #${rv.id} · ${OUTCOME[rv.outcome]}`;
      bad = rv.outcome !== 0;
      if (rv.outcome === 0) {
        const born = await outlawById(rv.newId);
        lead = `${names} viraram um ${RANK[rv.rank + 1]}:`;
        body = (a ? revealCard(a, 'is-gone small') : '') + '<span class="rv-op">+</span>' + (b ? revealCard(b, 'is-gone small') : '') +
          '<span class="rv-op">→</span>' + (born ? revealCard(born, 'is-new') : '');
        if (born) toast(`Fusão #${rv.id}: sucesso → #${born.id} ${RANK[born.rank]}`, 'ok');
      } else if (rv.outcome === 1) {
        lead = a && b ? `O #${b.id} foi consumido. O #${a.id} sobreviveu e voltou livre.` : 'Um foi consumido, o outro voltou livre.';
        body = (a ? revealCard(a) : '') + (b ? revealCard(b, 'is-gone') : '');
        toast(`Fusão #${rv.id}: falhou — #${b?.id} consumido, #${a?.id} voltou`, 'aviso');
      } else {
        lead = `Os dois foram consumidos: ${names}. Fusão revelada depois do prazo também cai aqui.`;
        body = (a ? revealCard(a, 'is-gone') : '') + (b ? revealCard(b, 'is-gone') : '');
        toast(`Fusão #${rv.id}: crítica — perdeu ${names}`, 'erro');
      }
    }
    const dlg = $('#reveal');
    dlg.innerHTML = `<h3 id="reveal-title" class="rv-title ${bad ? 'bad' : ''}">${esc(title)}</h3><p class="rv-lead">${esc(lead)}</p>
      <div class="rv-row">${body}</div>
      <form method="dialog" class="rv-actions"><button class="btn btn-gold">Beleza</button></form>`;
    dlg.showModal();
  }

  /* -------------------------------------------------------------- ações */
  function toast(msg, kind = 'ok', hash) {
    S.log.unshift({ msg, kind, hash, at: new Date() });
    S.log = S.log.slice(0, 12);
    renderLog();
  }

  async function run(label, fn) {
    if (S.demo) return toast('Isto é uma demonstração: nada vai pra rede.', 'aviso');
    if (S.readOnly) return toast('Só leitura: conecte sua carteira pra jogar.', 'aviso');
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
    toast(`${label}: confirme no MetaMask…`, 'aviso');
    const hash = await Chain.send(S.me, to, sig, args);
    toast(`${label}: enviado, esperando a rede…`, 'aviso', hash);
    const receipt = await Chain.waitReceipt(hash);
    toast(`${label}: feito.`, 'ok', hash);
    return receipt;
  }

  /** Autoriza o jogo a usar $BOUNTY uma vez, se ainda não tiver saldo aprovado. */
  async function ensureAllowance(amount) {
    if (S.user.allowance >= amount) return;
    await tx('Autorizar o jogo a usar seu $BOUNTY (uma vez só)', C.bounty, 'approve(address,uint256)', [C.game, Chain.MAX_UINT]);
    S.user.allowance = Chain.MAX_UINT;
  }

  const byId = (id) => S.user.outlaws.find((o) => o.id === id);
  const selectedOutlaws = () => [...S.selected].map(byId).filter(Boolean);

  const actions = {
    async connect() {
      if (!Chain.hasWallet()) return toast('Não achei o MetaMask neste navegador.', 'erro');
      try {
        S.me = await Chain.connect();
        S.view = S.me;
        S.readOnly = false;
        history.replaceState(null, '', location.pathname);
        toast('Carteira conectada: ' + short(S.me));
        await refresh();
      } catch (e) {
        toast('Conexão: ' + Chain.humanError(e), 'erro');
      }
    },
    faucet() {
      return run('Torneira', () => tx('Pegar $BOUNTY de teste', C.faucet, 'claim()', []));
    },
    qty(delta) {
      S.qty = Math.min(10, Math.max(1, S.qty + delta));
      renderTavern();
    },
    buy() {
      return run('Comprar sacos', async () => {
        const total = S.cfg.price * BigInt(S.qty);
        if (S.user.bounty < total) throw new Error('Saldo de $BOUNTY insuficiente.');
        await ensureAllowance(total);
        await tx(`Comprar ${S.qty} saco(s)`, C.game, 'buySacks(uint256)', [S.qty]);
      });
    },
    open(id) {
      if (S.demo) return showReveal({ kind: 'sack', id, expired: false, ids: [1] });
      return run('Abrir saco', async () => {
        const r = await tx(`Abrir o saco #${id}`, C.game, 'openSack(uint256)', [id]);
        const [ev] = Chain.logsOf(r, 'SackOpened'); // (sackId) expired, firstTokenId, count
        if (ev) S.reveal = { kind: 'sack', id, expired: ev.data[0] === 1n, ids: [...Array(Number(ev.data[2])).keys()].map((i) => Number(ev.data[1]) + i) };
      });
    },
    work(ids) {
      return run('Mandar pro serviço', async () => {
        const list = ids.map(byId).filter((o) => o && o.status === 0 && o.lifeLeft > 0);
        if (!list.length) throw new Error('Nenhum fora-da-lei livre selecionado.');
        const minLeft = Math.min(...list.map((o) => o.lifeLeft));
        const epochs = Math.min(S.shiftLen, minLeft);
        const zera = list.filter((o) => o.lifeLeft === epochs);
        if (zera.length && !confirm(
          `Esse turno de ${epochs} época(s) ZERA a vida de ${zera.map((o) => '#' + o.id).join(', ')}.\n` +
          'Eles terminam CAPTURADOS e só voltam pagando resgate (2x o conserto completo).\n\nContinuar?')) return;
        await tx(`Serviço de ${epochs} época(s) pra ${list.map((o) => '#' + o.id).join(', ')}`, C.game,
          'startShift(uint256[],uint256)', [list.map((o) => o.id), epochs]);
      });
    },
    stop(ids) {
      return run('Encerrar turno', async () => {
        const list = ids.map(byId).filter((o) => o && o.status === 1);
        if (!list.length) throw new Error('Nenhum fora-da-lei em serviço selecionado.');
        await tx(`Encerrar o turno de ${list.map((o) => '#' + o.id).join(', ')}`, C.game, 'endShift(uint256[])', [list.map((o) => o.id)]);
      });
    },
    claim(ids) {
      return run('Sacar', async () => {
        const list = ids.map(byId).filter((o) => o && o.pending > 0n);
        if (!list.length) throw new Error('Nada pra sacar ainda.');
        const total = list.reduce((s, o) => s + o.pending, 0n);
        await tx(`Sacar ${fmtB(total)} $BOUNTY`, C.game, 'claim(uint256[])', [list.map((o) => o.id)]);
      });
    },
    repair(id) {
      return run('Consertar', async () => {
        const o = byId(id);
        const used = S.cfg.maxLife - o.lifeLeft;
        const cost = (await Chain.call(C.game, 'repairCost(uint256,uint256)', [id, used]))[0];
        await ensureAllowance(cost);
        await tx(`Consertar o #${id} (${used} época(s), ${fmtB(cost)} $BOUNTY)`, C.game, 'repair(uint256,uint256)', [id, used]);
      });
    },
    ransom(id) {
      return run('Resgate', async () => {
        const cost = (await Chain.call(C.game, 'ransomCost(uint256)', [id]))[0];
        await ensureAllowance(cost);
        await tx(`Pagar o resgate do #${id} (${fmtB(cost)} $BOUNTY)`, C.game, 'ransom(uint256)', [id]);
      });
    },
    fuse() {
      return run('Fusão', async () => {
        const [a, b] = selectedOutlaws();
        const fee = (S.cfg.price * BigInt(a.rank + 1)) / 2n;
        await ensureAllowance(fee);
        await tx(`Começar a fusão de #${a.id} com #${b.id}`, C.game, 'startFusion(uint256,uint256)', [a.id, b.id]);
        S.selected.clear();
      });
    },
    finish(id) {
      const f = S.user.fusions.find((x) => x.id === id);
      const before = { kind: 'fusion', id, rank: f?.rank, a: byId(f?.a), b: byId(f?.b) }; // os dois, antes de sumirem
      if (S.demo) return showReveal({ ...before, outcome: S.demoRoll++ % 3, newId: 10 });
      return run('Revelar fusão', async () => {
        const r = await tx(`Revelar a fusão #${id}`, C.game, 'finishFusion(uint256)', [id]);
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
    if (a.rank !== b.rank) return { a, b, invalid: 'Precisam ser do mesmo rank.' };
    if (a.rank >= 5) return { a, b, invalid: 'Lenda não funde: já é o rank mais alto.' };
    if (a.status !== 0 || b.status !== 0) return { a, b, invalid: 'Os dois precisam estar livres (nem em serviço, nem capturados).' };
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

  /* ----------------------------------------------------------- render */
  function render() {
    renderHeader();
    renderStats();
    renderHeist();
    renderStart();
    renderTavern();
    renderBand();
    renderFusion();
    renderLog();
  }

  /**
   * Passo a passo do tester: carteira, ETH pro gás (faucet da Robinhood) e
   * $BOUNTY (a nossa torneira). Some sozinho quando não falta nada, e a
   * torneira fica como uma linha só.
   */
  function renderStart() {
    const box = $('#start'), u = S.user;
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
    const tapLabel = tap ? `Pegar ${fmtB(tap.amount, 0)} $BOUNTY` : 'Pegar $BOUNTY';

    const tapBtn = !connected || S.demo ? '' : waitTap
      ? `<small class="muted">de novo em <span data-until="${tap.next}">${dur(tap.next - now)}</span></small>`
      : `<button class="btn ${hasBounty ? '' : 'btn-gold'}" data-act="faucet" ${S.busy || dry || !hasEth ? 'disabled' : ''}>${tapLabel}</button>`;

    if (connected && hasEth && hasBounty) { //   tudo certo: só a torneira, pra quem quiser mais
      box.innerHTML = `<div class="row" style="border:0;padding:0"><div><b>Torneira de teste</b><br><small>${
        dry ? 'secou: avise no grupo' : 'a cada 24 h, de graça'}</small></div>${tapBtn}</div>`;
      return;
    }
    const step = (ok, n, html) => `<li class="${ok ? 'ok' : ''}"><span class="n">${ok ? '✓' : n}</span><div>${html}</div></li>`;
    box.innerHTML = `<h2>Primeiros passos</h2><ol class="steps">
      ${step(connected, 1, connected ? 'Carteira conectada' : 'Conecte o MetaMask. A rede da Robinhood entra sozinha.<br><button class="btn btn-gold" data-act="connect">Conectar MetaMask</button>')}
      ${step(hasEth, 2, `ETH de teste pro gás (cada ação custa menos de 0,00001).<br><a href="${C.ethFaucet}" target="_blank" rel="noopener">Pegar no faucet da Robinhood</a>`)}
      ${step(hasBounty, 3, `$BOUNTY pra comprar sacos (1 saco = ${fmtB(price, 0)}).<br>${hasEth ? tapBtn : '<small class="muted">depois do ETH</small>'}`)}
    </ol>`;
  }

  /**
   * Quem está em serviço vai pro mapa, com o turno (o mapa calcula sozinho, pelo
   * relógio, quem trabalha em cada época) e o que o contrato deve pagar a cada
   * um por época.
   */
  function renderHeist() {
    const u = S.user, g = S.glob, c = S.cfg, box = $('#heist');
    box.hidden = !u || !g || !c;
    if (box.hidden) return;
    const perEpoch = Number((g.free * 50n) / 10_000n / 10n ** 14n) / 10_000; // BOUNTY da época inteira
    const working = u.outlaws.filter((o) => o.status === 1);
    // o peso total nunca é menor que o do próprio bando: a fatia não passa de 100%
    const mine = working.filter((o) => g.epoch >= o.shiftStart).reduce((s, o) => s + o.weight, 0);
    const total = Math.max(Number(g.weight), mine);
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
        perEpoch: total > 0 ? (perEpoch * o.weight) / total : 0,
      })),
    });
  }

  function renderHeader() {
    const w = $('#wallet');
    if (S.demo) w.innerHTML = '<span class="chip chip-fusao">Demonstração</span>';
    else if (S.me) w.innerHTML = `<span class="chip chip-livre">${esc(short(S.me))}</span>`;
    else w.innerHTML = `<button class="btn btn-gold" data-act="connect">Conectar MetaMask</button>`;

    const banner = $('#banner');
    if (S.demo) {
      banner.hidden = false;
      banner.textContent = 'Demonstração: bonecos de exemplo, nada disto está na rede. Tire o ?demo do endereço pra jogar.';
    } else if (S.readOnly && S.view) {
      banner.hidden = false;
      banner.innerHTML = `Vendo a carteira <b>${esc(short(S.view))}</b> só pra leitura. Conecte a sua pra jogar.`;
    } else banner.hidden = true;

    const u = S.user;
    $('#balances').innerHTML = u
      ? `<span><b>${fmtB(u.bounty)}</b> $BOUNTY</span><span><b>${fmtB(u.eth, 4)}</b> ETH</span>`
      : '';
  }

  function renderStats() {
    const g = S.glob, c = S.cfg;
    if (!g || !c) return;
    const perEpoch = (g.free * 50n) / 10_000n;
    $('#stat-pool').textContent = fmtB(g.free, 0);
    $('#stat-emission').textContent = fmtB(perEpoch, 1);
    $('#stat-weight').textContent = (Number(g.weight) / 10_000).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '×';
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

    const u = S.user;
    if (S.demo || S.busy || !u) return;
    const waiting = [...u.sacks, ...u.fusions].some((k) => S.glob.block <= k.target);
    if (!waiting) return;
    for (const el of document.querySelectorAll('[data-draw]')) el.textContent = drawText(Number(el.dataset.draw));
    if (Date.now() - S.glob.at > 6000) refresh();
  }

  function renderTavern() {
    const c = S.cfg, u = S.user;
    if (!c) return;
    const total = c.price * BigInt(S.qty);
    $('#qty').textContent = S.qty;
    $('#price').textContent = fmtB(total, 0);
    $('#buy').disabled = S.busy || S.readOnly || !u;
    $('#approve-note').hidden = !(u && !S.readOnly && u.allowance < total);

    const list = $('#sacks');
    if (!u || !u.sacks.length) {
      list.innerHTML = '<p class="muted">Nenhum saco esperando pra abrir.</p>';
      return;
    }
    const block = S.glob.block;
    list.innerHTML = u.sacks.map((k) => {
      const ready = block > k.target;
      const expired = block > k.target + 256;
      let state;
      if (!ready) state = `<span data-draw="${k.target}">${drawText(k.target)}</span>`;
      else if (expired) state = '<b class="t-danger">venceu</b>: abre como Ninguém no mínimo';
      else state = `<b class="t-gold">pronto</b> · vence em ~${dur((k.target + 256 - block) * L1_SECONDS)}`;
      return `<div class="row">
        <div><b>Saco #${k.id}</b> · ${k.count} fora(s)-da-lei<br><small>${state}</small></div>
        <button class="btn ${ready ? 'btn-gold' : ''}" data-act="open" data-id="${k.id}" ${!ready || S.busy ? 'disabled' : ''}>Abrir</button>
      </div>`;
    }).join('');
  }

  function lifeClass(o, max) {
    const r = o.lifeLeft / max;
    return r > 0.5 ? 'ok' : r > 0.2 ? 'mid' : 'low';
  }

  function card(o) {
    const c = S.cfg;
    const { url, iso } = art(o);
    const sel = S.selected.has(o.id);
    const bounty = T.RANKS[o.rank].bounty.toLocaleString('pt-BR');
    const endsAt = c.genesis + o.shiftEnd * c.epochLength;
    let info = '';
    const next = '<span data-next>' + dur(nextEpochIn()) + '</span>';
    if (o.status === 1) {
      const started = S.glob.epoch >= o.shiftStart;
      info = started
        ? `trabalha até a época ${o.shiftEnd - 1} (~${dur(endsAt - Date.now() / 1000)})` +
          (S.glob.epoch + 1 < o.shiftEnd ? `<br>−1 de vida em ${next}` : '')
        : `começa em ${next}`;
    }
    if (o.status === 2) info = 'capturado: sai pagando resgate';
    if (o.status === 3) info = `preso na fusão #${o.fusion}`;

    const acts = [];
    if (o.pending > 0n) acts.push(`<button class="btn btn-gold" data-act="claim" data-id="${o.id}">Sacar ${fmtB(o.pending)}</button>`);
    if (o.status === 0 && o.lifeLeft > 0) acts.push(`<button class="btn" data-act="work" data-id="${o.id}">Trabalhar</button>`);
    if (o.status === 0 && o.repair !== undefined) acts.push(`<button class="btn" data-act="repair" data-id="${o.id}" title="Devolve toda a vida gasta">Consertar · ${fmtB(o.repair)}</button>`);
    if (o.status === 1) acts.push(`<button class="btn" data-act="stop" data-id="${o.id}">Encerrar</button>`);
    if (o.status === 2 && o.ransom !== undefined) acts.push(`<button class="btn btn-danger" data-act="ransom" data-id="${o.id}">Resgate · ${fmtB(o.ransom)}</button>`);

    return `<article class="card ${sel ? 'is-sel' : ''} st-${STATUS_KEY[o.status]}">
      <label class="pick" title="Selecionar"><input type="checkbox" data-act="select" data-id="${o.id}" ${sel ? 'checked' : ''}></label>
      <img src="${url}" alt="Fora-da-lei #${o.id}" width="96" height="96">
      <div class="c-id">#${o.id}</div>
      <div class="c-rank">${esc(RANK[o.rank])}</div>
      <div class="c-bounty">${bounty} $BOUNTY</div>
      <dl class="c-stats">
        <div><dt>Pont.</dt><dd>${iso.stats.pontaria.toFixed(2)}</dd></div>
        <div><dt>Força</dt><dd>${iso.stats.forca.toFixed(2)}</dd></div>
        <div><dt>Furt.</dt><dd>${iso.stats.furtividade.toFixed(2)}</dd></div>
        <div><dt>Peso</dt><dd>${(o.weight / 10_000).toFixed(2)}×</dd></div>
      </dl>
      <div class="life ${lifeClass(o, c.maxLife)}" title="Vida útil">
        <span style="width:${(o.lifeLeft / c.maxLife) * 100}%"></span>
        <em>vida ${o.lifeLeft}/${c.maxLife}</em>
      </div>
      <div class="c-status"><span class="chip chip-${STATUS_KEY[o.status]}">${STATUS[o.status]}</span><small>${info}</small></div>
      <div class="c-acts">${acts.join('')}</div>
    </article>`;
  }

  function renderBand() {
    const u = S.user, box = $('#band');
    if (!S.view) {
      box.innerHTML = `<div class="empty"><p>Conecte o MetaMask pra ver e comandar o seu bando.</p>
        <button class="btn btn-gold" data-act="connect">Conectar MetaMask</button></div>`;
      $('#bar').hidden = true;
      return;
    }
    if (!u) {
      box.innerHTML = '<p class="muted">Lendo a rede…</p>';
      return;
    }
    if (!u.outlaws.length) {
      box.innerHTML = '<div class="empty"><p>Nenhum fora-da-lei ainda. Compre um saco na taverna.</p></div>';
      $('#bar').hidden = true;
      return;
    }
    box.innerHTML = u.outlaws.map(card).join('');

    const sel = selectedOutlaws();
    const free = sel.filter((o) => o.status === 0 && o.lifeLeft > 0);
    const working = sel.filter((o) => o.status === 1);
    const pending = u.outlaws.reduce((s, o) => s + o.pending, 0n);
    $('#bar').hidden = S.readOnly;
    $('#bar-count').textContent = sel.length ? `${sel.length} selecionado(s)` : 'Nenhum selecionado';
    $('#shift').value = S.shiftLen;
    $('#b-work').disabled = S.busy || !free.length;
    $('#b-stop').disabled = S.busy || !working.length;
    $('#b-claim').disabled = S.busy || pending === 0n;
    // sem nada a sacar ainda: diz quando cai o próximo (o rendimento de cada época entra quando ela fecha)
    const earning = u.outlaws.some((o) => o.status === 1 && S.glob.epoch >= o.shiftStart);
    $('#b-claim').innerHTML = pending > 0n
      ? `Sacar tudo · ${fmtB(pending)}`
      : earning ? `Sacar · rende em <span data-next>${dur(nextEpochIn())}</span>` : 'Sacar tudo';
  }

  function renderFusion() {
    const box = $('#fusion');
    const p = S.user ? fusionPair() : null;
    let html = '';
    if (!p) {
      html = '<p class="muted">Selecione <b>dois</b> foras-da-lei livres do mesmo rank pra ver a chance.</p>';
    } else if (p.invalid) {
      html = `<p class="t-danger">${esc(p.invalid)}</p>`;
    } else {
      const fee = (S.cfg.price * BigInt(p.a.rank + 1)) / 2n;
      const o = S.odds && S.odds.key === `${p.a.id}-${p.b.id}` ? S.odds : null;
      const pct = (v) => (v / 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';
      html = `<p>#${p.a.id} + #${p.b.id} → <b>${esc(RANK[p.a.rank + 1])}</b></p>` + (o ? `
        <div class="odds">
          <span class="o-ok" style="flex:${o.success}"></span><span class="o-mid" style="flex:${o.fail}"></span><span class="o-bad" style="flex:${o.critical || 0.0001}"></span>
        </div>
        <dl class="odds-legend">
          <div><dt>Sucesso</dt><dd>${pct(o.success)}</dd></div>
          <div><dt>Falha: perde o #${p.b.id}</dt><dd>${pct(o.fail)}</dd></div>
          <div><dt>Crítica: perde os dois</dt><dd>${pct(o.critical)}</dd></div>
        </dl>` : '<p class="muted">Calculando a chance…</p>') + `
        <p class="muted">Taxa: ${fmtB(fee, 0)} $BOUNTY (vai pro caixa). Vida mais baixa = mais risco.</p>
        <button class="btn btn-gold" data-act="fuse" ${S.busy || !o || S.readOnly ? 'disabled' : ''}>Começar fusão</button>`;
    }
    const pend = S.user?.fusions || [];
    if (pend.length) {
      const block = S.glob.block;
      html += '<div class="sep"></div>' + pend.map((f) => {
        const ready = block > f.target;
        return `<div class="row"><div><b>Fusão #${f.id}</b> · #${f.a} + #${f.b}<br><small>${!ready ? `<span data-draw="${f.target}">${drawText(f.target)}</span>`
          : block > f.target + 256 ? '<b class="t-danger">venceu</b>: revelar agora conta como crítica (perde os dois)'
          : `<b class="t-gold">pronta pra revelar</b> · vence em ~${dur((f.target + 256 - block) * L1_SECONDS)}`}</small></div>
          <button class="btn ${ready ? 'btn-gold' : ''}" data-act="finish" data-id="${f.id}" ${!ready || S.busy ? 'disabled' : ''}>Revelar</button></div>`;
      }).join('');
    }
    box.innerHTML = html;
  }

  function renderLog() {
    $('#log').innerHTML = S.log.length
      ? S.log.map((l) => `<li class="log-${l.kind}"><time>${l.at.toLocaleTimeString('pt-BR')}</time> ${esc(l.msg)}${
        l.hash ? ` <a href="${C.explorer}/tx/${l.hash}" target="_blank" rel="noopener">ver</a>` : ''}</li>`).join('')
      : '<li class="muted">As transações aparecem aqui.</li>';
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
    if (act === 'b-work') return actions.work([...S.selected]);
    if (act === 'b-stop') return actions.stop([...S.selected]);
    if (act === 'b-claim') return actions.claim(S.user.outlaws.map((o) => o.id));
    if (act === 'claim') return actions.claim([id]);
    if (act === 'work') return actions.work([id]);
    if (act === 'stop') return actions.stop([id]);
    if (actions[act]) return actions[act](id);
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'shift') {
      const v = Math.max(1, Math.min(S.cfg?.maxLife || 30, Number(e.target.value) || 1));
      S.shiftLen = v;
    }
  });

  if (Chain.hasWallet()) {
    window.ethereum.on?.('accountsChanged', (acc) => {
      if (!S.me) return;
      S.me = acc[0] || null;
      S.view = S.me;
      S.selected.clear();
      refresh();
    });
    window.ethereum.on?.('chainChanged', () => refresh());
  }

  /* ------------------------------------------------------------ início */
  async function start() {
    const watch = params.get('carteira');
    if (S.demo) demoState();
    else if (watch && /^0x[0-9a-fA-F]{40}$/.test(watch)) {
      S.view = watch;
      S.readOnly = true;
    } else if (Chain.hasWallet()) {
      try {
        const acc = await window.ethereum.request({ method: 'eth_accounts' }); // sem pop-up: só se já autorizou
        if (acc[0]) {
          S.me = acc[0];
          S.view = acc[0];
        }
      } catch {}
    }
    Heist.mount($('#heist-map'));
    render();
    await refresh();
    setInterval(tick, 1000);
    setInterval(() => { if (!S.busy) refresh(); }, 20_000);
  }
  start();
})();

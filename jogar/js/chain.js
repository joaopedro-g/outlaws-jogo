/*
 * OUTLAWS — conversa com a Robinhood Chain, sem biblioteca.
 *
 * Leitura: direto no RPC, então o painel funciona mesmo sem carteira. O oficial
 * vem primeiro (CORS liberado e sem limite apertado); a thirdweb é a reserva —
 * resolve em qualquer DNS, mas corta em ~30 chamadas seguidas. Tudo que dá pra
 * juntar vai numa chamada só pelo Multicall3.
 * Escrita: pela carteira do navegador (MetaMask, Rabby, qualquer uma que se
 * anuncie pelo EIP-6963). Toda transação é SIMULADA antes — se for reverter,
 * o motivo aparece em português e a assinatura nem é pedida.
 * Seletores: gerados do compilador (abi.js), nunca digitados à mão — exceto os
 * do Multicall3, que não é nosso (conferidos no bytecode da testnet).
 */
(function (root) {
  'use strict';

  const CFG = {
    chainId: 46630,
    chainHex: '0xb626',
    chainName: 'Robinhood Chain Testnet',
    /* Oficial primeiro; depois o publicnode (listado no registro oficial de
     * redes, CORS liberado, aguentou 50 seguidas); a thirdweb por último, porque
     * corta em ~30 seguidas. Onde o DNS não resolve o domínio da Robinhood (a
     * rede do JP), a primeira chamada falha na hora e o painel passa adiante.
     * Mudou a lista: mude também o connect-src do CSP em panel/index.html. */
    rpcs: ['https://rpc.testnet.chain.robinhood.com/rpc', 'https://robinhood-sepolia-rpc.publicnode.com', 'https://46630.rpc.thirdweb.com'],
    explorer: 'https://explorer.testnet.chain.robinhood.com',
    bounty: '0xb714EfEa333C292Fd79faaD77eaf8AC64Ca35428',
    game: '0x45E384F93bd1CeD2CE9EC2F244DBc0447F68F92a',
    multicall: '0xcA11bde05977b3631167028862bE2a173976CA11',
    faucet: '0x21a10A8bCD4Dee550437B756AA5D27bd8550C07C', //  torneira de $BOUNTY (só testnet)
    ethFaucet: 'https://faucet.testnet.chain.robinhood.com', // ETH de teste pro gás, da Robinhood
    /* Plano B: o Google dá 0,05 ETH na Ethereum Sepolia (não tem a Robinhood) e a
     * ponte oficial da Arbitrum leva pra testnet em ~10 min — foi assim que a
     * carteira de dev ganhou o ETH dela. Endereço da ponte conferido em 18/09/2026. */
    googleFaucet: 'https://cloud.google.com/application/web3/faucet/ethereum/sepolia',
    bridge: 'https://portal.arbitrum.io/bridge?sourceChain=sepolia&destinationChain=robinhood-chain-testnet',
  };
  const ABI = root.OutlawsABI;
  const MAX_UINT = (1n << 256n) - 1n;
  /* Multicall3 não é nosso: seletores conferidos no bytecode publicado na testnet. */
  const SEL = { ...ABI.sel, 'getBlockNumber()': '42cbb15c', 'getEthBalance(address)': '4d2301cc' };
  const AGGREGATE3 = '82ad56cb';
  const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));

  /* ----------------------------------------------------------- rpc */
  let seq = 0;
  let pick = 0; // servidor em uso; troca sozinho quando um falha

  /** Servidor fora do ar, sem DNS ou no limite: tenta o outro, esperando cada vez mais. */
  const busy = (err) => err && (err.code === 429 || err.code === -32005 || /rate limit|too many/i.test(err.message || ''));

  async function rpc(method, params) {
    const body = JSON.stringify({ jsonrpc: '2.0', id: ++seq, method, params });
    for (let attempt = 0; attempt < 6; attempt++) {
      if (attempt > 1) await sleep(300 * 2 ** attempt);
      const i = pick;
      let j;
      try {
        const r = await fetch(CFG.rpcs[i], { method: 'POST', headers: { 'content-type': 'application/json' }, body });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        j = await r.json(); // o limite da thirdweb chega em texto puro, não em JSON
        if (busy(j.error)) throw new Error(j.error.message);
      } catch {
        if (pick === i) pick = (i + 1) % CFG.rpcs.length;
        continue;
      }
      if (j.error) {
        // revert e afins: resposta de verdade da rede, não adianta repetir
        const e = new Error(j.error.message || 'erro no RPC');
        e.data = j.error.data;
        throw e;
      }
      return j.result;
    }
    throw new Error(tr('e.noNetwork'));
  }

  /* ----------------------------------------------------------- abi */
  const word = (hex) => hex.replace(/^0x/, '').padStart(64, '0');
  const uint = (n) => word(BigInt(n).toString(16));
  const addr = (a) => word(a.toLowerCase().replace(/^0x/, ''));

  /** Codifica uma chamada. Tipos suportados: uintN, address, uint256[]. */
  function encode(sig, args = []) {
    const s = SEL[sig];
    if (!s) throw new Error('funcao desconhecida no contrato: ' + sig);
    const types = sig.slice(sig.indexOf('(') + 1, -1).split(',').filter(Boolean);
    const headSize = types.length * 32;
    const head = [], tail = [];
    types.forEach((t, i) => {
      const v = args[i];
      if (t.endsWith('[]')) {
        head.push(uint(headSize + tail.length * 32));
        tail.push(uint(v.length), ...v.map(uint));
      } else if (t === 'address') head.push(addr(v));
      else head.push(uint(v));
    });
    return '0x' + s + head.join('') + tail.join('');
  }

  /** Resposta em palavras de 32 bytes, como BigInt. */
  function words(hex) {
    const h = (hex || '0x').replace(/^0x/, '');
    const out = [];
    for (let i = 0; i + 64 <= h.length; i += 64) out.push(BigInt('0x' + h.slice(i, i + 64)));
    return out;
  }

  const asAddr = (w) => '0x' + w.toString(16).padStart(40, '0');
  const asHex32 = (w) => '0x' + w.toString(16).padStart(64, '0');

  /* ------------------------------------------------------ erros */
  /* As frases de cada erro do contrato estão no dicionário (i18n.js), com a
   * assinatura do erro como chave: 'e.CedoDemais()', 'e.EmServico(uint256)'… */
  const tr = (k, v) => (root.I18N ? root.I18N.t(k, v) : k);

  function explain(data) {
    if (typeof data !== 'string' || data.length < 10) return null;
    const sig = ABI.errors[data.slice(0, 10).toLowerCase()];
    if (!sig) return null;
    const params = words('0x' + data.slice(10));
    const msg = tr('e.' + sig, { id: params[0] !== undefined ? params[0].toString() : '?' });
    return msg === 'e.' + sig ? sig : msg; // sem frase no dicionário: mostra o nome do erro
  }

  /** Transforma qualquer erro de RPC ou carteira em frase legível. */
  function humanError(e) {
    if (!e) return tr('e.unknown');
    if (e.code === 4001 || /user (rejected|denied)/i.test(e.message || '')) return tr('e.rejected');
    if (e.code === -32002) return tr('e.pending'); //  já tem pedido aberto na extensão
    if (e.code === -32005 || /rate.?limit/i.test(e.message || '')) return tr('e.rateLimit');
    const data = e.data?.data || e.data?.originalError?.data || e.data;
    return explain(typeof data === 'string' ? data : null) || e.message || String(e);
  }

  /* ------------------------------------------------------ leitura */
  async function call(to, sig, args = [], from) {
    const tx = { to, data: encode(sig, args) };
    if (from) tx.from = from;
    return words(await rpc('eth_call', [tx, 'latest']));
  }

  /**
   * Várias leituras numa chamada só (Multicall3.aggregate3), em lotes de 150,
   * cada lote lido num bloco só. `list` = [[to, sig, args], …]. Devolve as
   * palavras de cada uma, na ordem; com `partial`, a que reverter vira null
   * em vez de derrubar o lote.
   */
  async function calls(list, { partial = false } = {}) {
    const out = [];
    for (let at = 0; at < list.length; at += 150) {
      const chunk = list.slice(at, at + 150);
      const parts = chunk.map(([to, sig, args]) => {
        const d = encode(sig, args).slice(2);
        return addr(to) + uint(1) + uint(0x60) + uint(d.length / 2) + d.padEnd(Math.ceil(d.length / 64) * 64, '0');
      });
      let off = parts.length * 32;
      const heads = parts.map((p) => {
        const h = uint(off);
        off += p.length / 2;
        return h;
      });
      const data = '0x' + AGGREGATE3 + uint(0x20) + uint(parts.length) + heads.join('') + parts.join('');
      const h = (await rpc('eth_call', [{ to: CFG.multicall, data }, 'latest'])).slice(2);

      // resposta: (bool ok, bytes data)[]
      const num = (byte) => Number(BigInt('0x' + h.slice(byte * 2, byte * 2 + 64)));
      const base = num(0) + 32;
      for (let i = 0; i < num(num(0)); i++) {
        const t = base + num(base + i * 32);
        const d = t + num(t + 32);
        const ret = '0x' + h.slice((d + 32) * 2, (d + 32 + num(d)) * 2);
        if (num(t) === 1) out.push(words(ret));
        else if (partial) out.push(null);
        else throw Object.assign(new Error('leitura recusada pelo contrato: ' + chunk[i][1]), { data: ret });
      }
    }
    return out;
  }

  /** Número do bloco como o CONTRATO enxerga (o da L1 — não o da Robinhood). */
  async function contractBlock() {
    // bytecode: NUMBER, MSTORE(0), RETURN(0, 32)
    return Number(BigInt(await rpc('eth_call', [{ data: '0x4360005260206000f3' }, 'latest'])));
  }

  const ethBalance = async (a) => BigInt(await rpc('eth_getBalance', [a, 'latest']));

  /* ------------------------------------------------------ carteira */
  /**
   * Qualquer carteira do navegador, não só a MetaMask. Pelo EIP-6963 cada
   * extensão instalada se anuncia com nome, ícone e um identificador (rdns);
   * o jogador escolhe qual usar e a escolha fica salva. Carteira antiga, que
   * não se anuncia, ainda entra pelo window.ethereum.
   */
  const announced = new Map(); //                rdns -> { info, provider }
  let chosen = null;
  const PICKED = 'outlaws:wallet';

  root.addEventListener('eip6963:announceProvider', (e) => {
    const d = e.detail;
    if (!d || !d.info || !d.provider || announced.has(d.info.rdns)) return;
    announced.set(d.info.rdns, { info: d.info, provider: d.provider });
    root.dispatchEvent(new Event('outlaws:wallets')); //  o painel se redesenha
  });
  /** Pergunta de novo quem está aí: extensão que acordou depois (aba em segundo plano). */
  const rediscover = () => root.dispatchEvent(new Event('eip6963:requestProvider'));
  rediscover();

  /** Nome de uma extensão antiga, que só aparece como window.ethereum. */
  function legacyName(p) {
    if (p.isRabby) return 'Rabby';
    if (p.isMetaMask) return 'MetaMask';
    if (p.isCoinbaseWallet) return 'Coinbase Wallet';
    if (p.isTrust) return 'Trust';
    return tr('p.wallet.browser');
  }

  /** As carteiras achadas neste navegador. */
  function wallets() {
    const list = [...announced.values()];
    if (!list.length && root.ethereum) {
      list.push({ info: { rdns: 'injected', name: legacyName(root.ethereum), icon: '' }, provider: root.ethereum });
    }
    return list;
  }

  /** Escolhe pelo rdns (ou a única que existir); devolve a escolhida. */
  function use(rdns) {
    const list = wallets();
    chosen = list.find((w) => w.info.rdns === rdns) || (list.length === 1 ? list[0] : chosen);
    if (chosen) { try { localStorage.setItem(PICKED, chosen.info.rdns); } catch {} }
    return chosen;
  }

  /** A carteira em uso: a escolhida, a lembrada do último acesso, ou a única. */
  function current() {
    if (chosen) return chosen;
    let saved = null;
    try { saved = localStorage.getItem(PICKED); } catch {}
    const list = wallets();
    return (saved && list.find((w) => w.info.rdns === saved)) || (list.length === 1 ? list[0] : null);
  }

  const wallet = () => {
    const w = current();
    if (!w) throw new Error(tr('p.noWallet'));
    return w.provider;
  };
  const hasWallet = () => wallets().length > 0;

  /** Eventos da carteira em uso (troca de conta, troca de rede). */
  function onWallet(event, fn) {
    const w = current();
    w && w.provider.on && w.provider.on(event, fn);
  }

  /** Contas já autorizadas, sem abrir pop-up. */
  async function accounts() {
    const w = current();
    if (!w) return [];
    try { return await w.provider.request({ method: 'eth_accounts' }); } catch { return []; }
  }

  /** Tira a permissão deste site (carteira antiga não tem a chamada: tudo bem). */
  async function forget() {
    const w = current();
    chosen = null;
    try { localStorage.removeItem(PICKED); } catch {}
    try { await w.provider.request({ method: 'wallet_revokePermissions', params: [{ eth_accounts: {} }] }); } catch {}
  }

  /**
   * Põe a carteira na Robinhood. "Rede desconhecida" devia vir com o código
   * 4902, mas nem toda carteira usa esse código — a Rabby devolve erro genérico
   * com o texto "Unrecognized chain ID", e aí a rede nunca era adicionada e o
   * jogador ficava preso. Agora qualquer erro que não seja recusa da pessoa
   * vira tentativa de adicionar a rede, e depois troca de novo.
   */
  async function ensureChain() {
    if (await wallet().request({ method: 'eth_chainId' }) === CFG.chainHex) return;
    try {
      await wallet().request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CFG.chainHex }] });
      if (await wallet().request({ method: 'eth_chainId' }) === CFG.chainHex) return;
    } catch (e) {
      if (e.code === 4001) throw e;
    }
    try {
      await fixChain(); //                      adiciona (ou reoferece) a rede
    } catch (e) {
      if (e.code === 4001) throw e;
      throw new Error(tr('e.chain', { name: CFG.chainName, id: CFG.chainId }));
    }
    if (await wallet().request({ method: 'eth_chainId' }) === CFG.chainHex) return;
    try {
      await wallet().request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CFG.chainHex }] });
    } catch (e) {
      if (e.code === 4001) throw e;
    }
    if (await wallet().request({ method: 'eth_chainId' }) !== CFG.chainHex) {
      throw new Error(tr('e.chain', { name: CFG.chainName, id: CFG.chainId }));
    }
  }

  /**
   * Autorização por assinatura (EIP-2612): em vez de uma transação de approve,
   * a pessoa assina de graça e a compra vai numa transação só. Devolve o que o
   * contrato precisa pra usar a assinatura.
   */
  async function signPermit(token, owner, spender, value, name) {
    const [[nonce]] = await calls([[token, 'nonces(address)', [owner]]]);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const data = {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' }, { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' },
        ],
        Permit: [
          { name: 'owner', type: 'address' }, { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
      },
      primaryType: 'Permit',
      domain: { name, version: '1', chainId: CFG.chainId, verifyingContract: token },
      message: {
        owner, spender, value: value.toString(), nonce: nonce.toString(), deadline: deadline.toString(),
      },
    };
    await ensureChain();
    const sig = await wallet().request({ method: 'eth_signTypedData_v4', params: [owner, JSON.stringify(data)] });
    const h = sig.slice(2);
    let v = parseInt(h.slice(128, 130), 16);
    if (v < 27) v += 27; //                     carteira que assina com 0/1
    return { deadline, v, r: '0x' + h.slice(0, 64), s: '0x' + h.slice(64, 128) };
  }

  /** Reoferece a rede com as nossas RPCs (a carteira pode estar numa que limita). */
  async function fixChain() {
    await wallet().request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: CFG.chainHex,
        chainName: CFG.chainName,
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: CFG.rpcs.slice(0, 2),
        blockExplorerUrls: [CFG.explorer],
      }],
    });
  }

  async function connect(rdns) {
    if (rdns) use(rdns);
    else if (!current()) use(); //                 uma só instalada: essa mesmo
    const [a] = await wallet().request({ method: 'eth_requestAccounts' });
    await ensureChain();
    return a;
  }

  /**
   * Simula; se passar, pede a assinatura. Devolve o hash da transação.
   * Simulação que reverte é tentada de novo antes de desistir: logo depois de
   * uma transação (a autorização antes da compra, a compra antes de abrir), o
   * servidor que responde pode estar um bloco atrás e ainda não enxergá-la.
   */
  async function send(from, to, sig, args = []) {
    await ensureChain();
    const data = encode(sig, args);
    for (let attempt = 1; ; attempt++) {
      try {
        await rpc('eth_call', [{ from, to, data }, 'latest']);
        break;
      } catch (e) {
        if (attempt === 3) throw new Error(humanError(e));
        await sleep(1500);
      }
    }
    try {
      return await wallet().request({ method: 'eth_sendTransaction', params: [{ from, to, data }] });
    } catch (e) {
      throw new Error(humanError(e));
    }
  }

  /** Eventos do jogo num recibo: [{ topics: [indexados…], data: [palavras…] }], como BigInt. */
  function logsOf(receipt, name) {
    const topic = ABI.events[name];
    return (receipt.logs || [])
      .filter((l) => l.address.toLowerCase() === CFG.game.toLowerCase() && l.topics[0] === topic)
      .map((l) => ({ topics: l.topics.slice(1).map((t) => BigInt(t)), data: words(l.data) }));
  }

  async function waitReceipt(hash) {
    for (let i = 0; i < 120; i++) {
      const r = await rpc('eth_getTransactionReceipt', [hash]);
      if (r) {
        if (r.status !== '0x1') throw new Error(tr('e.txFailed'));
        return r;
      }
      await new Promise((ok) => setTimeout(ok, 1500));
    }
    throw new Error(tr('e.slow'));
  }

  root.Chain = {
    CFG, MAX_UINT, rpc, encode, words, asAddr, asHex32, call, calls, contractBlock, ethBalance,
    hasWallet, wallets, use, current, onWallet, accounts, forget, rediscover,
    connect, ensureChain, fixChain, signPermit, send, waitReceipt, logsOf, humanError,
  };
})(window);

/* GERADO por tools/build-panel.js a partir de lib/ — não editar à mão. */
(function (root) {
'use strict';

/* sha256 em JS puro — conferido contra o crypto do Node no build. */
const K256 = new Uint32Array([
  0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
const ror = (x, n) => (x >>> n) | (x << (32 - n));
function sha256(bytes) {
  const len = bytes.length, blocks = (len + 9 + 63) >> 6;
  const buf = new Uint8Array(blocks * 64);
  buf.set(bytes); buf[len] = 0x80;
  const dv = new DataView(buf.buffer);
  const bits = len * 8;
  dv.setUint32(buf.length - 4, bits >>> 0);
  dv.setUint32(buf.length - 8, Math.floor(bits / 0x100000000));
  const Hs = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const W = new Uint32Array(64);
  for (let blk = 0; blk < blocks; blk++) {
    for (let i = 0; i < 16; i++) W[i] = dv.getUint32(blk * 64 + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = ror(W[i - 15], 7) ^ ror(W[i - 15], 18) ^ (W[i - 15] >>> 3);
      const s1 = ror(W[i - 2], 17) ^ ror(W[i - 2], 19) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }
    let a = Hs[0], b = Hs[1], c = Hs[2], d = Hs[3], e = Hs[4], f = Hs[5], g = Hs[6], h = Hs[7];
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (ror(e, 6) ^ ror(e, 11) ^ ror(e, 25)) + ((e & f) ^ (~e & g)) + K256[i] + W[i]) >>> 0;
      const t2 = ((ror(a, 2) ^ ror(a, 13) ^ ror(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    Hs[0] = (Hs[0] + a) >>> 0; Hs[1] = (Hs[1] + b) >>> 0; Hs[2] = (Hs[2] + c) >>> 0; Hs[3] = (Hs[3] + d) >>> 0;
    Hs[4] = (Hs[4] + e) >>> 0; Hs[5] = (Hs[5] + f) >>> 0; Hs[6] = (Hs[6] + g) >>> 0; Hs[7] = (Hs[7] + h) >>> 0;
  }
  const out = new Uint8Array(32), dvo = new DataView(out.buffer);
  Hs.forEach((v, i) => dvo.setUint32(i * 4, v));
  return out;
}

/* Buffer mínimo: só o que o gerador usa. */
class Buffer extends Uint8Array {
  static from(x, enc) {
    if (typeof x === 'string') {
      if (enc === 'hex') {
        const b = new Buffer(x.length >> 1);
        for (let i = 0; i < b.length; i++) b[i] = parseInt(x.substr(i * 2, 2), 16);
        return b;
      }
      const u = new TextEncoder().encode(x), b = new Buffer(u.length);
      b.set(u);
      return b;
    }
    const b = new Buffer(x.length);
    for (let i = 0; i < x.length; i++) b[i] = x[i] & 255;
    return b;
  }
  static alloc(n) { return new Buffer(n); }
  static isBuffer(x) { return x instanceof Buffer; }
  readUInt32BE(o) { return ((this[o] << 24) >>> 0) + (this[o + 1] << 16) + (this[o + 2] << 8) + this[o + 3]; }
  toString(enc) {
    if (enc !== 'hex') return new TextDecoder().decode(this);
    let s = '';
    for (const v of this) s += v.toString(16).padStart(2, '0');
    return s;
  }
}

const cryptoShim = {
  createHash() {
    const parts = [];
    return {
      update(d) { parts.push(d); return this; },
      digest() {
        const all = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
        let o = 0;
        for (const p of parts) { all.set(p, o); o += p.length; }
        return Buffer.from(sha256(all));
      },
    };
  },
  randomBytes(n) {
    const b = new Buffer(n);
    globalThis.crypto.getRandomValues(b);
    return b;
  },
};

const mods = {}, cache = {};
function require(n) {
  if (cache[n]) return cache[n].exports;
  if (!mods[n]) throw new Error('modulo ausente no pacote: ' + n);
  const m = { exports: {} };
  cache[n] = m;
  mods[n](m, m.exports, require);
  return m.exports;
}
mods['crypto'] = function (module) { module.exports = cryptoShim; };
mods['./png'] = function (module) { module.exports = { encodePNG() { throw new Error('PNG indisponivel no navegador'); } }; };
mods["./rng"] = function (module, exports, require) {
/*
 * OUTLAWS — RNG determinístico a partir de uma seed.
 *
 * Usa sha256 de propósito, não keccak: sha256 existe nativo no Node (zero
 * dependência) E existe como builtin barato no Solidity (precompile 0x02).
 * Então o contrato consegue reproduzir exatamente os mesmos traços que este
 * gerador produz off-chain — mesma seed, mesmo isótopo, sempre.
 *
 * Equivalente em Solidity (bytes32 seed, string label, uint8 contador):
 *   bytes32 bloco = sha256(abi.encodePacked(seed, label, contador));
 */
const crypto = require('crypto');

/**
 * Seed em bytes. Seed de mint (0x + 64 hex) entra como os 32 bytes crus — é o
 * que o contrato tem num bytes32. Qualquer outra string (as texturas de marca
 * usam 'parchment', 'wood'...) entra como texto UTF-8.
 */
function seedBytes(seed) {
  if (Buffer.isBuffer(seed)) return seed;
  if (typeof seed === 'string' && /^0x[0-9a-fA-F]{64}$/.test(seed)) return Buffer.from(seed.slice(2), 'hex');
  return Buffer.from(String(seed), 'utf8');
}

/**
 * Uma "torneira" de bits derivada de (seed, rótulo). Cada saque é independente.
 * Bloco = sha256(seed ‖ rótulo ‖ contador de 1 byte), lido em palavras de 32
 * bits big-endian — exatamente o que OutlawsTraits.sol faz.
 */
function stream(seed, label) {
  const seedBuf = seedBytes(seed);
  let counter = 0;
  let buf = Buffer.alloc(0);
  let off = 0;

  const refill = () => {
    buf = crypto
      .createHash('sha256')
      .update(seedBuf)
      .update(Buffer.from(String(label), 'utf8'))
      .update(Buffer.from([counter++ & 0xff]))
      .digest();
    off = 0;
  };

  /** Próximos 4 bytes como inteiro sem sinal de 32 bits. */
  const next = () => {
    if (off + 4 > buf.length) refill();
    const v = buf.readUInt32BE(off);
    off += 4;
    return v >>> 0;
  };

  return {
    next,
    /** Float em [0,1). */
    float: () => next() / 0x100000000,
    /** Inteiro em [min, max] inclusivo. */
    int: (min, max) => min + (next() % (max - min + 1)),
    /** Escolhe um item de uma lista. */
    pick: (arr) => arr[next() % arr.length],
    /** true com probabilidade p. */
    chance: (p) => next() / 0x100000000 < p,
  };
}

/** Seed canônica: 32 bytes em hex, do jeito que viria de um mint on-chain. */
function randomSeed() {
  return '0x' + crypto.randomBytes(32).toString('hex');
}

module.exports = { stream, randomSeed };

};
mods["./traits"] = function (module, exports, require) {
/*
 * OUTLAWS — seed -> fora-da-lei.
 *
 * Tudo que define um personagem sai daqui: a recompensa que o Xerife paga pela
 * cabeça dele (a raridade), os três stats e os traços do sprite. Uma seed, um
 * fora-da-lei, para sempre.
 *
 * Os números econômicos desta tabela são os que a gente calibrou:
 *  - `weight` é o multiplicador de FATIA na emissão, não um canudo extra.
 *    A emissão total é sempre r x Pool, dividida por peso. Raridade disputa
 *    fatia, não aumenta o dreno.
 *  - `repairPct` é o custo de consertar o equipamento como % do que o
 *    fora-da-lei rende no ciclo. Escala com o tier de propósito: comprime a
 *    vantagem do topo de 8x para ~6x e devolve mais token ao pool vindo de
 *    quem mais extrai.
 *  - `life` (vida útil) é IGUAL para todos e medida em TRABALHO, não em dias.
 *    Quem fica parado não desgasta — some por 3 meses e volta com tudo como
 *    deixou. E a fazenda rodando 24/7 gasta arco no dobro da velocidade do
 *    humano, logo paga o dobro de conserto.
 */
const { stream } = require('./rng');

/* ----------------------------------------------------------------- ranks */
/* A raridade é a recompensa que a Coroa paga pela cabeça dele. Quanto mais
 * famoso o fora-da-lei, mais raro — e mais caro de manter. */
const RANKS = [
  {
    id: 0, tier: 'NINGUÉM', bounty: 5,
    drop: 45, weight: 1.0, repairPct: 0.15,
    cloth: ['#7d6a4f', '#9c876a', '#4e4133'],   // estopa crua
    accent: ['#b9a77f', '#d8c8a4'],
  },
  {
    id: 1, tier: 'LADRÃO', bounty: 25,
    drop: 27, weight: 1.5, repairPct: 0.18,
    cloth: ['#6b7a4e', '#889a67', '#414b2f'],   // musgo
    accent: ['#b6a05a', '#d6c079'],
  },
  {
    id: 2, tier: 'FORAGIDO', bounty: 100,
    drop: 15, weight: 2.2, repairPct: 0.21,
    cloth: ['#4a7a52', '#679b70', '#2c4a31'],   // verde da mata
    accent: ['#c9a23f', '#e8c163'],
  },
  {
    id: 3, tier: 'PROCURADO', bounty: 500,
    drop: 8, weight: 3.2, repairPct: 0.25,
    cloth: ['#2f6b57', '#468a72', '#1b4032'],   // verde profundo
    accent: ['#d8a93a', '#f2cc66'],
  },
  {
    id: 4, tier: 'INIMIGO DA COROA', bounty: 2500,
    drop: 4, weight: 5.0, repairPct: 0.30,
    cloth: ['#3b4a6b', '#55688c', '#232c42'],   // azul da noite
    accent: ['#e2bc46', '#ffe08a'],
  },
  {
    id: 5, tier: 'LENDA', bounty: 10000,
    drop: 1, weight: 8.0, repairPct: 0.36,
    cloth: ['#5e2233', '#803044', '#36121e'],   // carmesim
    accent: ['#f0c95a', '#fff0b0'],
  },
];

/* Faixa de cada stat por tier. O jogo lê a faixa (balanceamento sob controle),
 * o mercado precifica o número exato (valor de colecionador). */
const STAT_BANDS = [
  { pontaria: [20, 45], forca: [20, 45], furtividade: [20, 45] },
  { pontaria: [35, 60], forca: [35, 60], furtividade: [35, 60] },
  { pontaria: [48, 72], forca: [48, 72], furtividade: [48, 72] },
  { pontaria: [60, 82], forca: [60, 82], furtividade: [60, 82] },
  { pontaria: [72, 92], forca: [72, 92], furtividade: [72, 92] },
  { pontaria: [84, 99], forca: [84, 99], furtividade: [84, 99] },
];

/* Cosméticos — não afetam nada no jogo, só raridade visual.
 *
 * O que dá sensação de variedade é a FORMA mudar, não a cor. `build` e `hood`
 * mudam a silhueta; o resto são camadas por cima. */
const BUILDS = ['slim', 'normal', 'stout'];
const HOODS = ['peak', 'fold', 'cowl', 'cap', 'bare'];
const EYES = ['round', 'narrow', 'wide', 'angry'];
const TUNICS = ['plain', 'laced', 'vest', 'sash'];
const FEATHERS = ['none', 'short', 'long', 'double'];
const GEAR = ['bow', 'crossbow', 'quiver', 'both', 'cloak', 'dagger', 'none'];
const MASKS = ['none', 'scarf', 'band', 'patch'];
const BEARDS = ['none', 'stubble', 'full', 'long'];
const SKINS = [
  ['#f0c8a0', '#c99b74'], ['#dfae82', '#b4855c'], ['#c68d62', '#9a6743'],
  ['#9e6b45', '#77492c'], ['#7a4f33', '#573523'], ['#5a3a26', '#3d2416'],
];
const HAIRS = ['#2e2119', '#4a3120', '#6b4423', '#8f6a35', '#b08d4f'];

/** Vida útil base, em unidades de trabalho. Igual para todos os ranks. */
const BASE_LIFE = 1000;

function rollRank(rnd) {
  const total = RANKS.reduce((s, e) => s + e.drop, 0);
  let r = rnd.int(1, total);
  for (const e of RANKS) {
    r -= e.drop;
    if (r <= 0) return e;
  }
  return RANKS[0];
}

/**
 * Rola dentro da faixa com 2 casas de precisão — é isso que torna cada um único.
 * Devolve CENTÉSIMOS inteiros (4523 = 45,23), que é como o contrato guarda.
 */
function rollStat(rnd, [lo, hi]) {
  return lo * 100 + rnd.int(0, (hi - lo) * 100);
}

/**
 * Peso de emissão em pontos-base (10.000 = 1,0x), só com conta inteira — a
 * mesma, operação por operação, de OutlawsTraits.weightOf(). Os stats acima ou
 * abaixo do meio da faixa ajustam o peso do rank entre 0,9x e 1,1x.
 */
function weightBps(rankId, sum) {
  const [lo, hi] = STAT_BANDS[rankId].pontaria;
  const rankBps = Math.round(RANKS[rankId].weight * 10000);
  const mid3 = (lo + hi) * 150;            // 3 x meio da faixa, em centésimos
  const spread3 = (hi - lo) * 150;         // 3 x meia-largura da faixa, em centésimos
  const effBps = 10000 + Math.trunc(((sum - mid3) * 1000) / spread3);
  return Math.floor((rankBps * effBps) / 10000);
}

/**
 * Deriva o fora-da-lei completo de uma seed — o rank sai do sorteio da própria seed.
 * @param {string} seed  32 bytes em hex, como viria do mint
 * @param {number} tokenId
 */
function derive(seed, tokenId = 0) {
  return deriveWithRank(seed, rollRank(stream(seed, 'rank')).id, tokenId);
}

/**
 * O mesmo, com o rank imposto de fora. Usado pela fusão (dois do rank r viram
 * um do rank r+1) e pelo saco que venceu sem ser aberto. Stats e aparência
 * continuam vindo da seed; só a faixa dos stats é a do rank imposto.
 *
 * `minimal`: stats cravados no mínimo da faixa. É o castigo do saco que não foi
 * aberto a tempo — o pior resultado possível, pra que deixar vencer nunca seja
 * uma forma de sortear de novo.
 */
function deriveWithRank(seed, rankId, tokenId = 0, { minimal = false } = {}) {
  const rank = RANKS[rankId];
  const band = STAT_BANDS[rank.id];
  const s = stream(seed, 'stats');

  /* A ordem dos saques é contrato: mudar a ordem muda todo boneco já mintado. */
  const p100 = minimal ? band.pontaria[0] * 100 : rollStat(s, band.pontaria);
  const f100 = minimal ? band.forca[0] * 100 : rollStat(s, band.forca);
  const t100 = minimal ? band.furtividade[0] * 100 : rollStat(s, band.furtividade);

  const c = stream(seed, 'cosmetic');
  const idx = {
    build: c.next() % BUILDS.length,
    hood: c.next() % HOODS.length,
    eyes: c.next() % EYES.length,
    tunic: c.next() % TUNICS.length,
    feather: c.next() % FEATHERS.length,
    gear: c.next() % GEAR.length,
    mask: c.next() % MASKS.length,
    beard: c.next() % BEARDS.length,
    skin: c.next() % SKINS.length,
    hair: c.next() % HAIRS.length,
    /* desvio de matiz do pano, em graus — garante que nem a cor repete */
    hueShift: c.int(-14, 14),
  };
  const cosmetic = {
    build: BUILDS[idx.build], hood: HOODS[idx.hood], eyes: EYES[idx.eyes], tunic: TUNICS[idx.tunic],
    feather: FEATHERS[idx.feather], gear: GEAR[idx.gear], mask: MASKS[idx.mask], beard: BEARDS[idx.beard],
    skin: idx.skin, hair: idx.hair, hueShift: idx.hueShift,
  };

  const wBps = weightBps(rank.id, p100 + f100 + t100);

  return {
    tokenId,
    seed,
    rank,
    stats: { pontaria: p100 / 100, forca: f100 / 100, furtividade: t100 / 100 },
    cosmetic,
    /* Economia */
    weight: wBps / 10000,
    repairPct: rank.repairPct,
    life: { max: BASE_LIFE, current: BASE_LIFE },
    /* Os mesmos valores em inteiros, do jeito que o contrato devolve. */
    raw: { rank: rank.id, pontaria: p100, forca: f100, furtividade: t100, weightBps: wBps, ...idx },
  };
}

/** Quantas combinações distintas existem — a prova de que "nunca haverá dois iguais". */
function combinationSpace() {
  const statCombos = STAT_BANDS.reduce((sum, b) => {
    const n = (v) => (v[1] - v[0]) * 100 + 1;
    return sum + n(b.pontaria) * n(b.forca) * n(b.furtividade);
  }, 0);
  const cosmetics = BUILDS.length * HOODS.length * EYES.length * TUNICS.length
                  * FEATHERS.length * GEAR.length * MASKS.length * BEARDS.length
                  * SKINS.length * HAIRS.length * 29;
  return statCombos * cosmetics;
}

/** Só as combinações de aparência — quantos bonecos visualmente distintos existem. */
function lookSpace() {
  return RANKS.length * BUILDS.length * HOODS.length * EYES.length * TUNICS.length
       * FEATHERS.length * GEAR.length * MASKS.length * BEARDS.length
       * SKINS.length * HAIRS.length * 29;
}

module.exports = {
  RANKS, STAT_BANDS, BUILDS, HOODS, EYES, TUNICS, FEATHERS, GEAR, MASKS, BEARDS,
  SKINS, HAIRS, BASE_LIFE, derive, deriveWithRank, weightBps, combinationSpace, lookSpace,
};

};
mods["./sprite"] = function (module, exports, require) {
/*
 * OUTLAWS — traços -> pixel art 32x32 -> PNG.
 *
 * Nada de IA aqui: o sprite é desenhado por código, pixel a pixel, a partir dos
 * mesmos traços que saíram da seed. Isso dá três coisas que gerador de imagem
 * não dá: pixel de verdade (grade limpa, sem borrão), determinismo (mesma seed
 * = mesma arte, sempre) e a porta aberta pra renderizar on-chain depois.
 *
 * O que faz o boneco ter carisma, e faltou na primeira versão: cabeça grande,
 * ROSTO VISÍVEL e olhos com brilho. Capuz pontudo com a ponta caída dá a
 * silhueta que se reconhece a 32 pixels.
 */
const { encodePNG } = require('./png');

const W = 32, H = 32;

/* --------------------------------------------------------------- cor */
const hex = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const lighten = (c, n) => c.map((v) => Math.min(255, v + n));
const darken = (c, n) => c.map((v) => Math.max(0, v - n));

function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}
function hslToRgb([h, s, l]) {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255));
}
const shiftHue = (rgb, deg) => {
  const [h, s, l] = rgbToHsl(rgb);
  return hslToRgb([(h + deg / 360 + 1) % 1, s, l]);
};

/* ------------------------------------------------------------ desenho */
const canvas = () => Array.from({ length: H }, () => Array(W).fill('.'));
const put = (c, x, y, ch) => { if (x >= 0 && x < W && y >= 0 && y < H) c[y][x] = ch; };
const rect = (c, x0, y0, x1, y1, ch) => {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(c, x, y, ch);
};
function ellipse(c, cx, cy, rx, ry, ch) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) put(c, x, y, ch);
    }
}
const inEllipse = (x, y, cx, cy, rx, ry) => {
  const dx = (x - cx) / rx, dy = (y - cy) / ry;
  return dx * dx + dy * dy <= 1;
};
function outline(c) {
  const src = c.map((r) => r.slice());
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (src[y][x] === '.') continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (ny >= 0 && ny < H && nx >= 0 && nx < W && src[ny][nx] === '.' && c[ny][nx] === '.') c[ny][nx] = '#';
      }
    }
}

/* ------------------------------------------------------------- sprite */
const FACE = { cx: 15.5, cy: 11.5, rx: 4.4, ry: 3.9 };
/** Cabeça descoberta é maior que a abertura de um capuz. */
const HEAD = { cx: 15.5, cy: 10.5, rx: 6.2, ry: 6.2 };

/* O porte muda a silhueta — é o que mais dá sensação de variedade. */
const BUILD_GEOM = {
  slim:   { tunic: [10, 21], shoulder: [7, 24], armL: 7, armR: 22, legs: [[12, 15], [17, 20]] },
  normal: { tunic: [9, 22],  shoulder: [6, 25], armL: 6, armR: 23, legs: [[11, 15], [17, 21]] },
  stout:  { tunic: [8, 23],  shoulder: [5, 26], armL: 5, armR: 24, legs: [[10, 15], [17, 22]] },
};

/* Pinta de `from` para `to` numa faixa de linhas — usado por barba, lenço, cabelo. */
function recolor(c, y0, y1, from, to) {
  for (let y = y0; y <= y1; y++)
    for (let x = 0; x < W; x++)
      if (from.includes(c[y][x])) c[y][x] = to;
}

function build(iso) {
  const c = canvas();
  const co = iso.cosmetic;
  const g = BUILD_GEOM[co.build] || BUILD_GEOM.normal;
  const bare = co.hood === 'cap' || co.hood === 'bare';

  /* --- aljava e flechas, atrás de tudo */
  if (co.gear === 'quiver' || co.gear === 'both') {
    rect(c, 24, 16, 27, 25, 'Q');
    rect(c, 25, 17, 25, 25, 'l');
    for (let i = 0; i < 3; i++) {
      const x = 25 + i;
      rect(c, x, 10 - i, x, 16, 'B');
      put(c, x - 1, 9 - i, 'R'); put(c, x, 9 - i, 'R'); put(c, x, 8 - i, 'R');
    }
  }

  /* --- arco, na lateral esquerda */
  if (co.gear === 'bow' || co.gear === 'both') {
    for (let y = 11; y <= 29; y++) {
      const bulge = Math.sin(((y - 11) / 18) * Math.PI);
      const x = Math.round(5 - bulge * 3.4);
      rect(c, x, y, x + 1, y, 'B');
    }
    for (let y = 12; y <= 28; y++) put(c, 5, y, 's');
  }

  /* --- capa atrás dos ombros */
  if (co.gear === 'cloak') {
    rect(c, g.shoulder[0], 17, g.shoulder[1], 30, 'j');
    rect(c, g.shoulder[0], 17, g.shoulder[0] + 2, 30, 'K');
    rect(c, g.shoulder[1] - 2, 17, g.shoulder[1], 30, 'K');
  }

  /* --- pernas e botas */
  const [L, Rg] = g.legs;
  rect(c, L[0] + 1, 25, L[1], 29, 'T'); rect(c, L[0], 28, L[1], 31, 'L');
  rect(c, Rg[0], 25, Rg[1] - 1, 29, 't'); rect(c, Rg[0], 28, Rg[1], 31, 'L');
  rect(c, L[0], 30, L[1], 31, 'l'); rect(c, Rg[0], 30, Rg[1], 31, 'l');

  /* --- braços, por fora da túnica */
  rect(c, g.armL, 18, g.armL + 2, 23, 'T');  rect(c, g.armL, 23, g.armL + 2, 25, 'F');
  rect(c, g.armR, 18, g.armR + 2, 23, 't');  rect(c, g.armR, 23, g.armR + 2, 25, 'F');

  /* --- túnica */
  const [T0, T1] = g.tunic;
  rect(c, T0, 17, T1, 26, 'T');
  rect(c, 17, 17, T1, 26, 't');              // meia-sombra do lado direito
  if (co.tunic === 'vest')  { rect(c, T0 + 2, 17, T1 - 2, 22, 'j'); }
  if (co.tunic === 'laced') { rect(c, 14, 17, 17, 22, 'L'); for (let y = 18; y <= 21; y++) { put(c, 14, y, 'A'); put(c, 17, y, 'A'); } }
  if (co.tunic === 'sash')  { for (let i = 0; i < 9; i++) rect(c, T0 + i, 17 + i, T0 + i + 2, 18 + i, 'A'); }
  rect(c, T0, 22, T1, 23, 'L');              // cinto
  rect(c, 15, 22, 16, 23, 'A');              // fivela
  if (co.tunic === 'plain') rect(c, 13, 17, 14, 21, 'j');

  /* --- ombros / gola */
  rect(c, g.shoulder[0], 16, g.shoulder[1], 18, 'K');
  rect(c, 17, 16, g.shoulder[1], 18, 'j');
  rect(c, g.shoulder[0], 16, g.shoulder[1], 16, 'k');

  /* --- pena (atrás da cabeça) */
  if (co.feather !== 'none') {
    const len = co.feather === 'long' ? 4 : 3;
    for (let i = 0; i < len; i++) { put(c, 11 - i, 6 - i, 'A'); put(c, 11 - i, 7 - i, 'A'); }
    if (co.feather === 'double') for (let i = 0; i < 4; i++) put(c, 12 - i, 8 - i, 'A');
  }

  /* --- cabeça: 5 silhuetas diferentes */
  if (co.hood === 'peak') {
    for (let y = 2; y <= 16; y++) {
      const half = Math.round(8 * Math.pow((y - 1) / 15, 0.8));
      const cx = 15.5 + Math.max(0, 8 - y) * 0.38;
      const x0 = Math.round(cx - half), x1 = Math.round(cx + half);
      rect(c, x0, y, x1, y, 'K');
      rect(c, Math.round(cx), y, x1, y, 'j');
      rect(c, x0, y, x0 + 1, y, 'k');
    }
  }
  if (co.hood === 'fold') {
    for (let y = 5; y <= 16; y++) {
      const half = Math.round(8 * Math.sqrt((y - 4) / 12));
      rect(c, 16 - half, y, 15 + half, y, 'K');
      rect(c, 16, y, 15 + half, y, 'j');
      rect(c, 16 - half, y, 16 - half + 1, y, 'k');
    }
    rect(c, 7, 13, 10, 21, 'j');             // aba dobrada caindo no ombro
    rect(c, 7, 13, 8, 21, 'K');
  }
  if (co.hood === 'cowl') {
    for (let y = 6; y <= 17; y++) {
      const half = Math.round(8 * Math.sqrt((y - 5) / 12));
      rect(c, 16 - half, y, 15 + half, y, 'K');
      rect(c, 16, y, 15 + half, y, 'j');
      rect(c, 16 - half, y, 16 - half + 1, y, 'k');
    }
  }
  if (bare) {
    ellipse(c, HEAD.cx, HEAD.cy, HEAD.rx, HEAD.ry, 'F');
    recolor(c, 0, 8, 'F', 'N');              // cabelo no topo
    put(c, 10, 9, 'N'); put(c, 11, 9, 'N'); put(c, 20, 9, 'N'); put(c, 21, 9, 'N');
    rect(c, 9, 9, 10, 13, 'N'); rect(c, 21, 9, 22, 13, 'N');   // costeletas
    if (co.hood === 'cap') {
      ellipse(c, 15.5, 5.5, 7, 3, 'K');
      rect(c, 9, 6, 22, 7, 'j');             // aba do chapéu
      rect(c, 10, 3, 21, 4, 'k');
    }
  }

  /* --- rosto */
  if (!bare) {
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (inEllipse(x, y, FACE.cx, FACE.cy, FACE.rx, FACE.ry)) put(c, x, y, 'F');
    recolor(c, 8, 8, 'F', 'f');              // sombra do capuz na testa
  }

  /* --- olhos: 4 formatos */
  const eye = (x0, x1, mirror) => {
    if (co.eyes === 'round') { rect(c, x0, 11, x1, 13, 'E'); put(c, mirror ? x1 : x0, 11, 'W'); }
    if (co.eyes === 'wide')  { rect(c, x0 - 1, 11, x1, 13, 'E'); put(c, mirror ? x1 : x0 - 1, 11, 'W'); }
    if (co.eyes === 'narrow'){ rect(c, x0, 12, x1, 13, 'E'); rect(c, x0 - 1, 11, x1 + 1, 11, 'N'); }
    if (co.eyes === 'angry') { rect(c, x0, 12, x1, 13, 'E'); put(c, mirror ? x1 + 1 : x0 - 1, 11, 'N'); put(c, mirror ? x0 : x1, 10, 'N'); }
  };
  eye(12, 13, false);
  eye(18, 19, true);

  /* --- barba */
  if (co.beard !== 'none') {
    const top = { stubble: 15, full: 14, long: 13 }[co.beard];
    recolor(c, top, bare ? 17 : 15, 'Ff', 'N');
  }

  /* --- lenço, faixa, tapa-olho */
  if (co.mask === 'scarf') recolor(c, 14, bare ? 16 : 15, 'FfN', 'A');
  if (co.mask === 'band')  recolor(c, 10, 11, 'Ff', 'L');
  if (co.mask === 'patch') { rect(c, 11, 11, 13, 13, 'E'); rect(c, 10, 10, 20, 10, 'L'); }

  /* --- equipamento na frente */
  if (co.gear === 'crossbow') {
    for (let i = 0; i <= 9; i++) { put(c, 10 + i, 26 - i, 'B'); put(c, 11 + i, 26 - i, 'B'); }   // haste na diagonal
    for (let i = 0; i <= 4; i++) { put(c, 16 + i, 13 + i, 'B'); put(c, 21 - i, 13 + i, 'B'); }         // limbo
    rect(c, 10, 25, 11, 27, 'L');                                                                      // coronha
  }
  if (co.gear === 'dagger') { rect(c, 20, 23, 21, 27, 's'); rect(c, 20, 23, 21, 24, 'A'); }

  outline(c);
  return c;
}

/* ------------------------------------------------------------ paleta */
function palette(iso) {
  const [cloth, clothLight, clothDark] = iso.rank.cloth.map((h) => shiftHue(hex(h), iso.cosmetic.hueShift));
  const [accent, accentLight] = iso.rank.accent.map(hex);
  const [skin, skinShade] = require('./traits').SKINS[iso.cosmetic.skin].map(hex);
  const leather = [92, 62, 40];
  return {
    '#': [17, 14, 12],
    K: cloth,
    k: clothLight,
    j: clothDark,
    T: darken(cloth, 12),
    t: darken(clothDark, 6),
    F: skin,
    f: skinShade,
    E: [34, 24, 20],
    W: [252, 250, 245],
    L: leather,
    l: lighten(leather, 26),
    A: accent,
    B: [120, 84, 46],
    s: [226, 216, 196],
    Q: darken(leather, 18),
    R: [150, 52, 46],
    N: require('./traits').HAIRS[iso.cosmetic.hair] ? hex(require('./traits').HAIRS[iso.cosmetic.hair]) : [46, 33, 25],
  };
}

/** Renderiza para PNG RGBA, escalado por nearest-neighbor. */
function render(iso, scale = 16) {
  const c = build(iso);
  const pal = palette(iso);
  const w = W * scale, h = H * scale;
  const px = Buffer.alloc(w * h * 4);

  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const ch = c[Math.floor(y / scale)][Math.floor(x / scale)];
      const o = (y * w + x) * 4;
      if (ch === '.' || !pal[ch]) { px[o + 3] = 0; continue; }
      const [r, g, b] = pal[ch];
      px[o] = r; px[o + 1] = g; px[o + 2] = b; px[o + 3] = 255;
    }
  return encodePNG(w, h, px, 4);
}

module.exports = { render, build, palette, W, H };

};
mods["./map"] = function (module, exports, require) {
/*
 * OUTLAWS — gerador de terrenos (os mapas).
 *
 * Grade estilo Bomberman: obstáculos fixos nas coordenadas pares, caixotes
 * destrutíveis espalhados no resto, cantos limpos pro spawn. A seed do terreno
 * sai da mesma função que a seed do fora-da-lei, então o mapa de um assalto é
 * reproduzível e auditável — importante quando o butim vale dinheiro.
 *
 * Tiles:
 *   '#' obstáculo fixo (árvore no campo, pedra dentro dos muros)
 *   'o' caixote        (quebra com carga, pode esconder baú)
 *   '.' chão
 *   '$' baú            (o butim)
 *   '~' armadilha      (dano / consome vida útil extra)
 */
const { stream } = require('./rng');
const { encodePNG } = require('./png');

const TILE = 16;

/* Quanto mais perto do castelo, mais caixote, mais baú e mais armadilha. */
const TERRAINS = [
  { id: 1, name: 'A Estrada', crate: 0.42, chest: 0.06, trap: 0.00, indoor: false, ground: '#6b5a3e', prop: '#3f5a33' },
  { id: 2, name: 'A Mata',    crate: 0.50, chest: 0.09, trap: 0.03, indoor: false, ground: '#4f5a35', prop: '#2f4a28' },
  { id: 3, name: 'A Ponte',   crate: 0.56, chest: 0.13, trap: 0.07, indoor: false, ground: '#5a5348', prop: '#46402f' },
  { id: 4, name: 'A Vila',    crate: 0.62, chest: 0.17, trap: 0.12, indoor: true,  ground: '#5c5145', prop: '#6b6258' },
  { id: 5, name: 'O Castelo', crate: 0.68, chest: 0.22, trap: 0.18, indoor: true,  ground: '#4a4750', prop: '#5f5d68' },
];

/**
 * Gera a grade de um terreno.
 * @param {string} seed
 * @param {number} terrainId 1..5
 */
function generate(seed, terrainId = 1, w = null, h = null) {
  const t = TERRAINS[Math.max(0, Math.min(TERRAINS.length - 1, terrainId - 1))];
  const rnd = stream(seed, `terrain:${terrainId}`);

  /* Dimensão também sai da seed: um assalto nunca tem o mesmo tamanho de sala
   * que o anterior, então o jogador não decora a planta. */
  if (w === null) w = rnd.pick([13, 15, 15, 17]);
  if (h === null) h = rnd.pick([11, 13, 13]);

  const g = Array.from({ length: h }, () => Array(w).fill('.'));

  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) { g[y][x] = '#'; continue; }
      /* Os pilares da grade caem nas coordenadas pares, mas 1 em cada 6 é
       * derrubado — é o que quebra a leitura decorada do mapa sem perder a
       * navegabilidade em grade que o gênero precisa. */
      if (x % 2 === 0 && y % 2 === 0) {
        if (rnd.float() < 0.17) { g[y][x] = '.'; } else { g[y][x] = '#'; continue; }
      }
      if (rnd.float() < t.crate) g[y][x] = 'o';
      else if (rnd.float() < t.trap) g[y][x] = '~';
    }

  /* cantos de spawn sempre livres (o L de 3 casas de cada canto) */
  const clear = [[1, 1], [2, 1], [1, 2], [w - 2, 1], [w - 3, 1], [w - 2, 2],
                 [1, h - 2], [1, h - 3], [2, h - 2], [w - 2, h - 2], [w - 3, h - 2], [w - 2, h - 3]];
  for (const [x, y] of clear) if (g[y]?.[x] && g[y][x] !== '#') g[y][x] = '.';

  /* baús escondidos dentro dos caixotes — só aparecem quando quebra */
  const hidden = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (g[y][x] === 'o' && rnd.float() < t.chest) hidden.push([x, y]);

  return { terrain: t, grid: g, hidden, w, h, seed };
}

/* --------------------------------------------------------------- render */
const hex = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

function drawTile(px, W, ox, oy, kind, t, rnd) {
  const ground = hex(t.ground);
  const prop = hex(t.prop);
  const set = (x, y, c) => {
    if (x < 0 || y < 0 || x >= TILE || y >= TILE) return;
    const o = ((oy + y) * W + ox + x) * 4;
    px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255;
  };
  const fill = (c) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) set(x, y, c); };

  const dirt = mix(ground, [22, 20, 18], 0.42);

  if (kind === '.') {
    fill(dirt);
    for (let i = 0; i < 7; i++) set(rnd.int(1, 14), rnd.int(1, 14), mix(dirt, [0, 0, 0], 0.16));
    if (!t.indoor && rnd.float() < 0.35) {          // tufo de mato
      const x = rnd.int(3, 11), y = rnd.int(9, 13);
      const g2 = mix(prop, [120, 180, 90], 0.35);
      set(x, y, g2); set(x + 1, y - 1, g2); set(x + 2, y, g2);
    }
  }

  if (kind === '#' && !t.indoor) {                  /* árvore */
    fill(dirt);
    const leaf = prop, leafHi = mix(prop, [170, 220, 130], 0.4), leafLo = mix(prop, [0, 0, 0], 0.35);
    for (let y = 0; y <= 11; y++)
      for (let x = 0; x < TILE; x++) {
        const d = Math.hypot(x - 7.5, (y - 5.5) * 1.15);
        if (d <= 7.2) set(x, y, d > 5.8 ? leafLo : leaf);
      }
    for (let i = 0; i < 9; i++) { const x = rnd.int(2, 9), y = rnd.int(1, 7); set(x, y, leafHi); }
    const bark = [84, 58, 36];
    for (let y = 11; y < TILE; y++) { set(7, y, bark); set(8, y, mix(bark, [0, 0, 0], 0.3)); }
  }

  if (kind === '#' && t.indoor) {                   /* bloco de pedra */
    fill(prop);
    const hi = mix(prop, [255, 255, 255], 0.16), lo = mix(prop, [0, 0, 0], 0.38);
    for (let x = 0; x < TILE; x++) { set(x, 0, hi); set(x, 15, lo); }
    for (let y = 0; y < TILE; y++) { set(0, y, hi); set(15, y, lo); }
    for (const y of [5, 10]) for (let x = 1; x < 15; x++) set(x, y, lo);
    for (let y = 1; y < 5; y++) set(7, y, lo);
    for (let y = 6; y < 10; y++) set(11, y, lo);
    for (let y = 11; y < 15; y++) set(4, y, lo);
  }

  if (kind === 'o') {                               /* caixote de madeira */
    fill(dirt);
    const wood = [146, 104, 62], hi = mix(wood, [255, 230, 190], 0.32), lo = mix(wood, [0, 0, 0], 0.42);
    for (let y = 2; y < TILE - 1; y++) for (let x = 1; x < TILE - 1; x++) set(x, y, wood);
    for (let x = 1; x < TILE - 1; x++) { set(x, 2, hi); set(x, TILE - 2, lo); }
    for (let y = 2; y < TILE - 1; y++) { set(1, y, hi); set(14, y, lo); }
    for (let i = 0; i < 12; i++) { set(2 + i, 3 + i, lo); set(13 - i, 3 + i, lo); }   // cruzeta
    for (const y of [7, 11]) for (let x = 2; x < 14; x++) set(x, y, mix(wood, [0, 0, 0], 0.22));
  }

  if (kind === '~') {                               /* armadilha de dentes */
    fill(dirt);
    const pit = mix(dirt, [0, 0, 0], 0.55), iron = [150, 152, 160];
    for (let y = 5; y <= 12; y++) for (let x = 2; x < 14; x++) set(x, y, pit);
    for (let i = 0; i < 6; i++) {                   // dentes de cima e de baixo
      const x = 3 + i * 2;
      set(x, 5, iron); set(x, 6, mix(iron, [0, 0, 0], 0.3));
      set(x + 1, 12, iron); set(x + 1, 11, mix(iron, [0, 0, 0], 0.3));
    }
    for (let x = 2; x < 14; x++) { set(x, 4, iron); set(x, 13, mix(iron, [0, 0, 0], 0.25)); }
  }

  if (kind === '$') {                               /* baú */
    fill(dirt);
    const wood = [122, 78, 44], gold = [235, 190, 70], goldHi = [255, 236, 160], lo = [64, 38, 20];
    for (let y = 5; y <= 13; y++) for (let x = 2; x < 14; x++) set(x, y, wood);
    for (let x = 2; x < 14; x++) { set(x, 5, mix(wood, [255, 220, 170], 0.3)); set(x, 13, lo); }
    for (let x = 2; x < 14; x++) set(x, 8, lo);     // linha da tampa
    for (let y = 5; y <= 13; y++) { set(7, y, gold); set(8, y, mix(gold, lo, 0.35)); }
    set(7, 9, goldHi); set(8, 9, goldHi);           // fechadura
    set(3, 6, goldHi);
  }
}

/** Renderiza o terreno inteiro num PNG. `reveal` mostra os baús escondidos. */
function render(map, scale = 2, reveal = false) {
  const bw = map.w * TILE, bh = map.h * TILE;
  const base = Buffer.alloc(bw * bh * 4);
  const rnd = stream(map.seed, 'render');

  const hiddenSet = new Set(map.hidden.map(([x, y]) => `${x},${y}`));
  for (let y = 0; y < map.h; y++)
    for (let x = 0; x < map.w; x++) {
      let k = map.grid[y][x];
      if (reveal && hiddenSet.has(`${x},${y}`)) k = '$';
      drawTile(base, bw, x * TILE, y * TILE, k, map.terrain, rnd);
    }

  if (scale === 1) return encodePNG(bw, bh, base, 4);
  const W2 = bw * scale, H2 = bh * scale;
  const px = Buffer.alloc(W2 * H2 * 4);
  for (let y = 0; y < H2; y++)
    for (let x = 0; x < W2; x++) {
      const s = (Math.floor(y / scale) * bw + Math.floor(x / scale)) * 4;
      const o = (y * W2 + x) * 4;
      px[o] = base[s]; px[o + 1] = base[s + 1]; px[o + 2] = base[s + 2]; px[o + 3] = base[s + 3];
    }
  return encodePNG(W2, H2, px, 4);
}

/* drawTile vai pro painel: ele desenha o chão uma vez e anima caixote e baú por cima. */
module.exports = { TERRAINS, TILE, generate, render, drawTile };

};

root.OutlawsLib = { traits: require('./traits'), sprite: require('./sprite'), rng: require('./rng'), map: require('./map'), sha256 };
})(typeof window !== 'undefined' ? window : globalThis);

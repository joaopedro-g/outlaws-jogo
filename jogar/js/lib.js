/* GERADO por tools/build-panel.js a partir de lib/ — não editar à mão. */
(function (root) {
'use strict';
/* Math local: no contexto isolado da conferência (vm do Node), todo acesso a um
   global passa por um interceptador e a pintura do mapa fica ~50x mais lenta. */
const Math = globalThis.Math;

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
 * famoso o fora-da-lei, mais raro — e mais caro de manter.
 * `rarity` é a cor da raridade na tela (borda do cartaz, contorno no mapa, luz
 * do baú): a escala que todo jogador conhece, cinza → verde → azul → roxo →
 * laranja, e a Lenda alternando vermelho e ouro. Só visual — não entra no
 * contrato nem no teste de paridade. */
const RANKS = [
  {
    id: 0, tier: 'NINGUÉM', bounty: 5,
    drop: 45, weight: 1.0, repairPct: 0.15,
    cloth: ['#7d6a4f', '#9c876a', '#4e4133'],   // estopa crua
    accent: ['#b9a77f', '#d8c8a4'],
    rarity: ['#A7ADB2'],
  },
  {
    id: 1, tier: 'LADRÃO', bounty: 25,
    drop: 27, weight: 1.5, repairPct: 0.18,
    cloth: ['#6b7a4e', '#889a67', '#414b2f'],   // musgo
    accent: ['#b6a05a', '#d6c079'],
    rarity: ['#6CC24A'],
  },
  {
    id: 2, tier: 'FORAGIDO', bounty: 100,
    drop: 15, weight: 2.2, repairPct: 0.21,
    cloth: ['#4a7a52', '#679b70', '#2c4a31'],   // verde da mata
    accent: ['#c9a23f', '#e8c163'],
    rarity: ['#4AA3F0'],
  },
  {
    id: 3, tier: 'PROCURADO', bounty: 500,
    drop: 8, weight: 3.2, repairPct: 0.25,
    cloth: ['#2f6b57', '#468a72', '#1b4032'],   // verde profundo
    accent: ['#d8a93a', '#f2cc66'],
    rarity: ['#B06CF0'],
  },
  {
    id: 4, tier: 'INIMIGO DA COROA', bounty: 2500,
    drop: 4, weight: 5.0, repairPct: 0.30,
    cloth: ['#3b4a6b', '#55688c', '#232c42'],   // azul da noite
    accent: ['#e2bc46', '#ffe08a'],
    rarity: ['#F5A623'],
  },
  {
    id: 5, tier: 'LENDA', bounty: 10000,
    drop: 1, weight: 8.0, repairPct: 0.36,
    cloth: ['#5e2233', '#803044', '#36121e'],   // carmesim
    accent: ['#f0c95a', '#fff0b0'],
    rarity: ['#FF4F5E', '#FFD166'],
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
mods["./mapart"] = function (module, exports, require) {
/*
 * OUTLAWS — a arte do mapa do assalto, em 32 px por casa.
 *
 * O gerador (lib/map.js) decide o que tem em cada casa; aqui só se pinta. A
 * casa tem 32 px, a mesma densidade do boneco (lib/sprite.js): chão e gente
 * com o mesmo tamanho de pixel. A luz vem de cima à esquerda em tudo — sombra
 * projetada pra baixo e pra direita, brilho no canto de cima.
 *
 * O chão é pintado em coordenada de MUNDO, não de ladrilho: a textura corre de
 * uma casa pra outra sem emenda. Tudo sai da seed (hash inteiro semeado pelo
 * rng), nada de Math.random — Node e navegador pintam o mesmo pixel, e o build
 * confere.
 *
 *   paintRoom(map)                 -> { w, h, px, lights, water }  chão + o que não quebra
 *   paintProp(kind, terrain, seed) -> { w, h, px, face }           caixote 'o', baú '$', cofre 'gold'
 *   crackPixels(k)                 -> [[x, y], ...]                a rachadura, do 1º golpe ao último
 */
const { stream } = require('./rng');

const HD = 32;

/* ----------------------------------------------------------- pincéis */
function surface(w, h) {
  const px = new Uint8Array(w * h * 4);
  const ok = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
  return {
    w, h, px,
    set(x, y, c) {
      if (!ok(x, y)) return;
      const o = (y * w + x) * 4;
      px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255;
    },
    /** Tinta por cima com transparência `a` (0..1), compondo com o que já existe. */
    over(x, y, c, a) {
      if (!ok(x, y) || a <= 0) return;
      const o = (y * w + x) * 4, da = px[o + 3] / 255, oa = a + da * (1 - a);
      for (let i = 0; i < 3; i++) px[o + i] = Math.round((c[i] * a + px[o + i] * da * (1 - a)) / oa);
      px[o + 3] = Math.round(oa * 255);
    },
    /** Multiplica a cor que já está ali (f < 1 escurece). */
    mul(x, y, f) {
      if (!ok(x, y)) return;
      const o = (y * w + x) * 4;
      for (let i = 0; i < 3; i++) px[o + i] = Math.min(255, Math.round(px[o + i] * f));
    },
    /** Soma luz (a tocha acesa clareia o chão em volta). */
    add(x, y, c, a) {
      if (!ok(x, y)) return;
      const o = (y * w + x) * 4;
      for (let i = 0; i < 3; i++) px[o + i] = Math.min(255, Math.round(px[o + i] + c[i] * a));
    },
  };
}

const hex = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const ramp = (...hs) => hs.map(hex);
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);

/** Hash inteiro de (x, y, k), semeado pela sala: o mesmo pixel sempre dá o mesmo número. */
function hasher(seed) {
  const s = stream(seed, 'arte').next() | 0;
  return (x, y, k) => {
    let h = s ^ Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul(k | 0, 0x2c1b3c6d);
    h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
}

/** Ruído de valor suave, célula de `cell` px. */
function noise(H, x, y, cell, k) {
  const fx0 = x / cell, fy0 = y / cell, gx = Math.floor(fx0), gy = Math.floor(fy0);
  const fx = fx0 - gx, fy = fy0 - gy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = H(gx, gy, k), b = H(gx + 1, gy, k), c = H(gx, gy + 1, k), d = H(gx + 1, gy + 1, k);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
/** Três oitavas, esticado pra ocupar 0..1 de verdade. */
const fbm = (H, x, y, k, s = 1) =>
  clamp((0.5 * noise(H, x, y, 28 * s, k) + 0.3 * noise(H, x, y, 11 * s, k + 1) + 0.2 * noise(H, x, y, 4 * s, k + 2) - 0.5) * 1.9 + 0.5);

/* Pontilhado ordenado: a passagem de um tom pro outro vira textura, não degrau. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dither = (x, y) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16 - 0.5;
function pick(r, v, x, y, d = 0.7) {
  const i = Math.floor(v * r.length + dither(x, y) * d);
  return r[i < 0 ? 0 : i >= r.length ? r.length - 1 : i];
}

const SHADOW = [8, 6, 12];
const WARM = [255, 176, 92];

/** Sombra no chão, elipse de borda macia. */
function shadow(cv, cx, cy, rx, ry, a) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
      if (d <= 1) cv.over(x, y, SHADOW, a * (d > 0.55 ? 0.55 : 1));
    }
}

/* ----------------------------------------------------------- paletas */
const P = {
  grassE: ramp('#263a1d', '#304822', '#3c5829', '#4a6a30', '#5b7e38', '#6f9443', '#87aa52'),
  dirtE: ramp('#35261a', '#443120', '#533d27', '#634a2f', '#745838', '#866843', '#997a50'),
  grassM: ramp('#17271a', '#1e3320', '#264027', '#2f4e2d', '#395d34', '#456d3c', '#548046'),
  litter: ramp('#2a1f15', '#382a1b', '#473622', '#57432a', '#6a5233'),
  oak: ramp('#132216', '#1b301c', '#243f22', '#2f5029', '#3c6230', '#4c7638', '#628c42', '#7ea553'),
  oakM: ramp('#0f1d15', '#15291a', '#1d3620', '#264527', '#30552e', '#3d6736', '#4e7b40', '#66924d'),
  pine: ramp('#0b1a16', '#10251d', '#163224', '#1d402c', '#264f35', '#305f3f', '#3f724b', '#528659'),
  bark: ramp('#1f140d', '#301f13', '#43301c', '#584025', '#6e5230', '#85663d'),
  rock: ramp('#232226', '#302f34', '#3e3d43', '#4e4d53', '#605f65', '#75747a', '#8d8c90'),
  moss: ramp('#2c4424', '#3b5a2c', '#4d7236'),
  plank: ramp('#2a1b10', '#3a2615', '#4b331c', '#5e4124', '#71502d', '#865f36', '#9a7042', '#ae8350'),
  water: ramp('#0d1f30', '#122a40', '#183651', '#1f4463', '#285574', '#346986', '#4c85a0', '#79abc2'),
  cobble: ramp('#26221f', '#332e29', '#403a33', '#4e473e', '#5d544a', '#6d6356', '#7f7464', '#938775'),
  roof: ramp('#3f160f', '#581f15', '#72291b', '#8b3523', '#a3442e', '#b9583c'),
  plaster: ramp('#6e6250', '#85775f', '#9b8d72', '#b0a287', '#c3b69b'),
  timber: ramp('#22160d', '#342214', '#47301c'),
  hay: ramp('#5a431b', '#765a23', '#94742d', '#b08e39', '#c9a749', '#dfc063'),
  flag: ramp('#1c1b23', '#24232c', '#2d2c36', '#373641', '#42414c', '#4e4d59', '#5c5b67', '#6b6a76'),
  brick: ramp('#1f1e26', '#28272f', '#32313a', '#3d3c46', '#494852', '#57565f', '#66656e'),
  carpet: ramp('#330a10', '#4a1016', '#61161d', '#7a1e24', '#92282d', '#a83537'),
  gold: ramp('#5a3f0e', '#7d5a16', '#a37a22', '#c99a2e', '#e3b640', '#f5d26a', '#fff0b0'),
  iron: ramp('#16161b', '#24242b', '#35353e', '#4a4a55', '#62626e', '#7e7e8a', '#a0a0ab'),
  flame: ramp('#6e220c', '#b3421a', '#e67424', '#ffab3d', '#ffd873', '#fff4c4'),
  crate: ramp('#3a2311', '#523218', '#6a4220', '#83542a', '#9b6734', '#b27c42', '#c89454', '#dbad6d'),
  crateDark: ramp('#241509', '#35200f', '#472c16', '#5a391d', '#6d4726', '#825730', '#97683b'),
};

/* --------------------------------------------------- miudezas do chão */
function pebble(cv, x, y, r) {
  cv.set(x + 1, y, r[5]); cv.set(x + 2, y, r[4]);
  cv.set(x, y + 1, r[4]); cv.set(x + 1, y + 1, r[3]); cv.set(x + 2, y + 1, r[3]); cv.set(x + 3, y + 1, r[2]);
  cv.set(x + 1, y + 2, r[1]); cv.set(x + 2, y + 2, r[1]);
  cv.over(x + 1, y + 3, SHADOW, 0.35); cv.over(x + 2, y + 3, SHADOW, 0.35); cv.over(x + 3, y + 2, SHADOW, 0.35);
}
function tuft(cv, x, y, r, H, k) {
  for (let i = 0; i < 5; i++) {
    const bx = x + i - 2, hgt = 2 + Math.floor(H(bx, y, k + i) * 3) + (i === 2 ? 1 : 0);
    const lean = i < 2 ? -1 : i > 2 ? 1 : 0;
    for (let j = 0; j < hgt; j++) cv.set(bx + (j === hgt - 1 ? lean : 0), y - j, r[Math.min(r.length - 1, 2 + j + (i === 2 ? 1 : 0))]);
  }
  cv.over(x - 2, y + 1, SHADOW, 0.25); cv.over(x - 1, y + 1, SHADOW, 0.3); cv.over(x, y + 1, SHADOW, 0.3); cv.over(x + 1, y + 1, SHADOW, 0.25);
}
function flower(cv, x, y, petal, heart) {
  cv.set(x, y - 1, petal); cv.set(x - 1, y, petal); cv.set(x + 1, y, petal); cv.set(x, y + 1, petal);
  cv.set(x, y, heart);
  cv.over(x + 1, y + 1, SHADOW, 0.3);
}
function mushroom(cv, x, y) {
  const cap = ramp('#6e1712', '#a22a1f', '#cf4a34'), stem = hex('#d8ccb0');
  cv.set(x, y + 1, stem); cv.set(x, y + 2, stem);
  for (let i = -2; i <= 2; i++) cv.set(x + i, y, cap[i < 0 ? 2 : i > 0 ? 0 : 1]);
  for (let i = -1; i <= 1; i++) cv.set(x + i, y - 1, cap[i < 0 ? 2 : 1]);
  cv.set(x - 1, y, hex('#f1e6cf'));
  cv.over(x + 1, y + 2, SHADOW, 0.35); cv.over(x + 2, y + 1, SHADOW, 0.35);
}

/* ------------------------------------------------------------ árvores */
function trunk(cv, ox, oy, y0, y1, x0, x1, H, k) {
  for (let y = y0; y <= y1; y++) {
    const flare = y >= y1 - 2 ? y - (y1 - 3) : 0;
    const a = x0 - flare, b = x1 + flare;
    for (let x = a; x <= b; x++) {
      const u = (x - a) / Math.max(1, b - a);
      const v = 0.88 - u * 0.78 + (H(ox + x, oy + y * 3, k) - 0.5) * 0.3;
      cv.set(ox + x, oy + y, x === b ? P.bark[0] : pick(P.bark, v, ox + x, oy + y));
    }
  }
}

/** Copa redonda feita de cachos: cada cacho tem o próprio brilho, como folha de verdade. */
function canopy(cv, ox, oy, leaf, H, k, cx, cy, big, y0, y1) {
  const blobs = [[cx, cy, big]];
  const n = 4 + Math.floor(H(k, 1, 7) * 3);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + H(k, i, 8) * 1.3;
    const d = big * (0.45 + H(k, i, 9) * 0.3);
    blobs.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.78, big * (0.5 + H(k, i, 10) * 0.22)]);
  }
  const inside = (x, y) => blobs.some(([bx, by, br]) => (x - bx) ** 2 + (y - by) ** 2 <= br * br);
  for (let y = y0; y <= y1; y++)
    for (let x = -3; x <= HD + 2; x++) {
      let best = -1, lx = 0, ly = 0;
      for (const [bx, by, br] of blobs) {
        const d = Math.hypot(x - bx, y - by) / br;
        if (d <= 1 && 1 - d > best) {
          best = 1 - d;
          lx = (bx - x) / br;
          ly = (by - y) / br;
        }
      }
      if (best < 0) continue;
      let v = 0.4 + (lx * 0.8 + ly) * 0.3 + best * 0.2;
      v += (noise(H, ox + x, oy + y, 2.6, k + 11) - 0.5) * 0.42; //     folhas
      v -= clamp((y - cy - 2) / 10) * 0.3; //                           a barriga da copa fica na sombra
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      const c = edge ? (y > cy - 2 || x > cx + 2 ? leaf[0] : leaf[1]) : pick(leaf, v, ox + x, oy + y);
      cv.set(ox + x, oy + y, c);
    }
  for (let i = 0; i < 9; i++) { //                                      pontas de luz
    const bx = Math.round(cx - big * 0.55 + H(k, i, 21) * big * 0.8), by = Math.round(cy - big * 0.6 + H(k, i, 22) * big * 0.55);
    if (inside(bx, by) && inside(bx - 1, by) && inside(bx, by - 1)) cv.set(ox + bx, oy + by, leaf[leaf.length - 1]);
  }
}

function oak(cv, ox, oy, leaf, H, k) {
  shadow(cv, ox + 18, oy + 28, 13, 4.5, 0.5);
  trunk(cv, ox, oy, 17, 29, 13, 18, H, k);
  canopy(cv, ox, oy, leaf, H, k, 16, 11, 11, -5, 25);
}
function bush(cv, ox, oy, leaf, H, k, berries) {
  shadow(cv, ox + 17, oy + 27, 13, 4, 0.5);
  canopy(cv, ox, oy, leaf, H, k, 16, 18, 9.5, 5, 30);
  if (!berries) return;
  const berry = ramp('#6a1420', '#a8243a', '#e25a6a');
  for (let i = 0; i < 6; i++) {
    const bx = ox + 9 + Math.floor(H(k, i, 31) * 14), by = oy + 13 + Math.floor(H(k, i, 32) * 10);
    cv.set(bx, by, berry[1]); cv.set(bx - 1, by - 1, berry[2]); cv.set(bx + 1, by + 1, berry[0]);
  }
}
function pine(cv, ox, oy, leaf, H, k) {
  shadow(cv, ox + 18, oy + 28, 12, 4.2, 0.5);
  trunk(cv, ox, oy, 24, 29, 14, 17, H, k);
  const tiers = [[-5, 8, 7], [1, 16, 10.5], [8, 25, 14.5]];
  for (const [t0, t1, hw] of tiers) {
    for (let y = t0; y <= t1; y++) {
      const p = (y - t0) / (t1 - t0), half = 1.2 + (hw - 1.2) * p;
      const a = Math.floor(16 - half), b = Math.ceil(15 + half);
      for (let x = a; x <= b; x++) {
        if (y === t1 && (x + k) % 3 === 0) continue; //         ponta de galho serrilhada
        if (y === t1 - 1 && (x === a || x === b)) continue;
        const u = (x - a) / Math.max(1, b - a);
        let v = 0.82 - u * 0.66 - p * 0.16 + (H(ox + x, oy + y, k) - 0.5) * 0.2;
        if (((x - y * 2 + k) & 3) === 0 && u > 0.2) v -= 0.14; //  agulhas em diagonal
        const edge = x === a || x === b || y === t1 || (y === t1 - 1 && (x + k) % 3 === 0);
        cv.set(ox + x, oy + y, edge ? leaf[u < 0.5 ? 1 : 0] : pick(leaf, v, ox + x, oy + y));
      }
    }
  }
  cv.set(ox + 15, oy - 5, leaf[6]); cv.set(ox + 15, oy - 4, leaf[5]);
}
function boulder(cv, ox, oy, H, k, mossy) {
  shadow(cv, ox + 18, oy + 27, 14, 4.8, 0.55);
  const cx = 16, cy = 17, rx = 12.5, ry = 10.5;
  const radius = (x, y) => 1 + (H(k, Math.floor((Math.atan2(y - cy, x - cx) + Math.PI) * 2.2), 5) - 0.5) * 0.22;
  const inside = (x, y) => Math.hypot((x - cx) / rx, (y - cy) / ry) <= radius(x, y);
  for (let y = 4; y <= 30; y++)
    for (let x = 1; x <= 31; x++) {
      if (!inside(x, y)) continue;
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      const facet = H(k, Math.floor((Math.atan2(dy, dx) + Math.PI) * 2.2), 6) - 0.5;
      let v = 0.5 - (dx + dy * 1.1) * 0.32 + facet * 0.2 + (H(ox + x, oy + y, k) - 0.5) * 0.12;
      const edge = !inside(x + 1, y) || !inside(x, y + 1) || !inside(x - 1, y) || !inside(x, y - 1);
      let c = edge ? P.rock[dx + dy > -0.3 ? 0 : 1] : pick(P.rock, v, ox + x, oy + y);
      if (mossy && !edge && dy < -0.25 && noise(H, ox + x, oy + y, 3, k + 3) > 0.45) c = pick(P.moss, v, ox + x, oy + y);
      cv.set(ox + x, oy + y, c);
    }
  for (let i = 0; i < 5; i++) { //                                    rachaduras da pedra
    const x = ox + 10 + Math.floor(H(k, i, 40) * 12), y = oy + 15 + Math.floor(H(k, i, 41) * 8);
    cv.set(x, y, P.rock[1]); cv.set(x + 1, y + 1, P.rock[1]);
  }
}
function stump(cv, ox, oy, H, k) {
  shadow(cv, ox + 17, oy + 27, 11, 4, 0.5);
  for (let y = 14; y <= 28; y++)
    for (let x = 7; x <= 25; x++) {
      const top = ((x - 16) / 9) ** 2 + ((y - 16) / 4) ** 2 <= 1;
      const body = y >= 16 && y <= 27 && x >= 7 && x <= 25;
      if (top) {
        const r = Math.hypot((x - 16) / 9, (y - 16) / 4);
        const ring = Math.floor(r * 4 + H(x, y, k) * 0.4) % 2;
        cv.set(ox + x, oy + y, r > 0.86 ? P.bark[4] : ring ? hex('#a58558') : hex('#c4a26c'));
      } else if (body) {
        const u = (x - 7) / 18;
        cv.set(ox + x, oy + y, x === 25 || y === 27 ? P.bark[0] : pick(P.bark, 0.85 - u * 0.75 + (H(ox + x, oy + y * 2, k) - 0.5) * 0.3, ox + x, oy + y));
      }
    }
}

/* ------------------------------------------------------------ pedra e ferro */
/** Coluna redonda: base, fuste com caneluras e capitel. */
function pillar(cv, ox, oy, r, H, k) {
  for (let y = 12; y <= 37; y++)
    for (let x = 14; x <= 34; x++) {
      const sx = x - Math.max(0, y - 30) * 0.5; //                      a ponta da sombra arredonda
      if (sx < 17 || sx > 32 || (y > 34 && (sx < 20 || sx > 29))) continue;
      cv.over(ox + x, oy + y, SHADOW, 0.34);
    }
  const band = (y0, y1, x0, x1, light) => {
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const u = (x - x0) / (x1 - x0);
        let v = light - u * 0.55 + (y === y0 ? 0.25 : 0) - (y === y1 ? 0.2 : 0);
        v += (H(ox + x, oy + y, k) - 0.5) * 0.08;
        cv.set(ox + x, oy + y, x === x1 || y === y1 ? r[0] : pick(r, v, ox + x, oy + y));
      }
  };
  band(25, 30, 3, 28, 0.78); //                                        plinto
  band(22, 25, 5, 26, 0.72);
  for (let y = 8; y <= 22; y++) //                                     fuste com caneluras
    for (let x = 8; x <= 23; x++) {
      const u = (x - 8) / 15;
      let v = 0.9 - u * 0.8 - Math.max(0, 0.15 - u) * 1.2 + ((x - 8) % 4 === 3 ? -0.14 : 0);
      v += (H(ox + x, oy + y * 2, k) - 0.5) * 0.06;
      cv.set(ox + x, oy + y, x === 23 ? r[0] : x === 8 ? r[3] : pick(r, v, ox + x, oy + y));
    }
  band(4, 8, 5, 26, 0.8); //                                           capitel
  band(1, 4, 7, 24, 1); //                                             topo
  if (H(k, 0, 50) < 0.35) //                                           trepadeira
    for (let i = 0; i < 14; i++) {
      const y = 9 + i, x = 9 + Math.round(Math.sin(i * 0.9 + k) * 2 + 2);
      cv.set(ox + x, oy + y, P.moss[i % 3]);
      if (i % 4 === 1) cv.set(ox + x + 1, oy + y, P.moss[2]);
    }
}
/** Braseiro de ferro num pedestal: a chama é animada no painel; aqui fica a luz. */
function brazier(cv, ox, oy, H, k, out) {
  shadow(cv, ox + 18, oy + 28, 11, 4, 0.55);
  const stone = P.rock;
  for (let y = 18; y <= 29; y++)
    for (let x = 11; x <= 21; x++) cv.set(ox + x, oy + y, x === 21 || y === 29 ? stone[0] : pick(stone, 0.8 - (x - 11) / 14, ox + x, oy + y));
  for (let y = 10; y <= 17; y++) //                                     a bacia
    for (let x = 6; x <= 26; x++) {
      const w = 10 - (y - 10) * 0.7;
      if (Math.abs(x - 16) > w) continue;
      cv.set(ox + x, oy + y, y === 10 ? P.iron[5] : pick(P.iron, 0.7 - (x - 6) / 26 - (y - 10) * 0.04, ox + x, oy + y));
    }
  for (let x = 8; x <= 24; x++) cv.set(ox + x, oy + 11, P.flame[x % 3 === 0 ? 1 : 0]); // brasa
  out.lights.push({ x: ox + 16, y: oy + 8, r: 58, kind: 'fire' });
}
function barrel(cv, ox, oy, cx, cy, H, k) {
  const rx = 6.5;
  for (let y = cy - 6; y <= cy + 7; y++)
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const u = (x - (cx - rx)) / (2 * rx);
      const bulge = Math.abs(y - (cy + 1)) < 4 ? 1 : 0;
      if (x < cx - rx + (bulge ? 0 : 1) || x > cx + rx - (bulge ? 0 : 1)) continue;
      const hoop = y === cy - 3 || y === cy + 4;
      let v = 0.85 - Math.abs(u - 0.3) * 1.1 + ((x - Math.floor(cx)) % 3 === 0 ? -0.1 : 0);
      const c = hoop ? pick(P.iron, v, ox + x, oy + y) : pick(P.crate, v - 0.05, ox + x, oy + y);
      cv.set(ox + x, oy + y, y === cy + 7 ? P.crate[0] : c);
    }
  for (let y = cy - 9; y <= cy - 5; y++) //                             a tampa, vista de cima
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const d = ((x - cx) / rx) ** 2 + ((y - (cy - 7)) / 2.6) ** 2;
      if (d > 1) continue;
      cv.set(ox + x, oy + y, d > 0.7 ? P.crate[1] : pick(P.crate, 0.7 - (x - cx) / 20 + (y % 2 ? 0.08 : 0), ox + x, oy + y));
    }
}
function barrels(cv, ox, oy, H, k) {
  shadow(cv, ox + 18, oy + 27, 14, 4.5, 0.5);
  barrel(cv, ox, oy, 10, 18, H, k);
  barrel(cv, ox, oy, 22, 20, H, k + 1);
}
function haystack(cv, ox, oy, H, k) {
  shadow(cv, ox + 18, oy + 27, 14, 4.8, 0.5);
  for (let y = 6; y <= 29; y++)
    for (let x = 2; x <= 30; x++) {
      const dx = (x - 16) / 14, dy = (y - 21) / 15;
      if (y > 21 ? Math.abs(dx) > 1 - ((y - 21) / 9) ** 3 * 0.15 : dx * dx + dy * dy > 1) continue;
      let v = 0.62 - dx * 0.3 - (y - 14) * 0.02 + (H(ox + x, Math.floor((oy + y) / 2), k) - 0.5) * 0.45;
      if ((x * 3 + y) % 7 === 0) v += 0.12; //                          palha solta
      cv.set(ox + x, oy + y, y === 29 ? P.hay[0] : pick(P.hay, v, ox + x, oy + y));
    }
  for (let i = 0; i < 8; i++) cv.set(ox + 6 + Math.floor(H(k, i, 60) * 20), oy + 29 + (i % 2), P.hay[3]);
}
function well(cv, ox, oy, H, k) {
  shadow(cv, ox + 18, oy + 27, 14, 5, 0.5);
  for (let y = 6; y <= 29; y++)
    for (let x = 2; x <= 30; x++) {
      const d = Math.hypot((x - 16) / 13.5, (y - 16) / 10);
      if (d > 1) continue;
      if (d < 0.62) { //                                               água funda
        const v = 0.25 + (1 - d) * 0.25 + (H(ox + x, oy + y, k) > 0.93 ? 0.3 : 0);
        cv.set(ox + x, oy + y, pick(P.water, v - (y < 12 ? 0.15 : 0), ox + x, oy + y));
        continue;
      }
      const a = Math.atan2(y - 16, x - 16), brick = Math.floor((a + Math.PI) * 3.2);
      const seam = Math.abs(((a + Math.PI) * 3.2) % 1) < 0.14 || Math.abs(d - 0.81) < 0.04;
      const v = 0.6 - ((x - 16) / 13.5 + (y - 16) / 10) * 0.28 + (H(brick, 0, k) - 0.5) * 0.2;
      cv.set(ox + x, oy + y, seam ? P.rock[1] : d > 0.95 ? P.rock[0] : pick(P.rock, v, ox + x, oy + y));
    }
  for (let y = 11; y <= 14; y++) for (let x = 20; x <= 23; x++) cv.set(ox + x, oy + y, pick(P.crate, 0.6 - (x - 20) * 0.12, ox + x, oy + y)); // o balde
  cv.set(ox + 21, oy + 10, P.iron[4]); cv.set(ox + 22, oy + 10, P.iron[4]);
}
/** Floreira de pedra da Vila: a cor que faltava no calçamento cinza. */
function planter(cv, ox, oy, H, k) {
  shadow(cv, ox + 18, oy + 28, 14, 4, 0.5);
  for (let y = 16; y <= 29; y++) //                                       o caixote de pedra
    for (let x = 3; x <= 28; x++) {
      const top = y <= 18;
      const v = top ? 0.8 - (x - 3) * 0.01 : 0.55 - (x - 3) * 0.012 + ((x + (y > 23 ? 4 : 0)) % 9 === 0 ? -0.2 : 0);
      cv.set(ox + x, oy + y, x === 28 || y === 29 ? P.cobble[0] : y === 19 ? P.cobble[2] : pick(P.cobble, v + (H(ox + x, oy + y, k) - 0.5) * 0.1, ox + x, oy + y));
    }
  for (let y = 12; y <= 18; y++) for (let x = 5; x <= 26; x++) cv.set(ox + x, oy + y, pick(P.litter, 0.35 + (H(ox + x, oy + y, k + 1) - 0.5) * 0.3, ox + x, oy + y)); // a terra
  canopy(cv, ox, oy, P.oak, H, k, 16, 12, 8.5, 2, 18); //                     a folhagem
  const petals = [['#e8e4d0', '#fff7e0'], ['#d65a78', '#f29ab0'], ['#e6c34a', '#fff1a8'], ['#9b7fd1', '#c9b6f0']];
  const [a, b] = petals[Math.floor(H(k, 0, 170) * petals.length)];
  for (let i = 0; i < 9; i++) {
    const fx = ox + 7 + Math.floor(H(k, i, 171) * 18), fy = oy + 5 + Math.floor(H(k, i, 172) * 11);
    cv.set(fx, fy, hex(b)); cv.set(fx + 1, fy, hex(a)); cv.set(fx, fy + 1, hex(a)); cv.set(fx + 1, fy + 1, hex('#8a3a2a'));
  }
}
function lamppost(cv, ox, oy, H, k, out) {
  shadow(cv, ox + 19, oy + 29, 8, 3, 0.55);
  for (let y = 12; y <= 29; y++) for (let x = 15; x <= 17; x++) cv.set(ox + x, oy + y, P.iron[x === 15 ? 4 : x === 16 ? 3 : 1]);
  for (let x = 13; x <= 19; x++) cv.set(ox + x, oy + 29, P.iron[x < 16 ? 3 : 1]);
  for (let y = 3; y <= 11; y++) //                                       a lanterna
    for (let x = 12; x <= 20; x++) {
      const frame = x === 12 || x === 20 || y === 3 || y === 11 || x === 16;
      cv.set(ox + x, oy + y, frame ? P.iron[x < 16 ? 4 : 2] : P.flame[y < 6 ? 5 : y < 9 ? 4 : 3]);
    }
  for (let x = 11; x <= 21; x++) cv.set(ox + x, oy + 2, P.iron[3]);
  out.lights.push({ x: ox + 16, y: oy + 7, r: 50, kind: 'lamp' });
}
/** Poste de amarra da ponte, com a corda enrolada. */
function bollard(cv, ox, oy, H, k) {
  shadow(cv, ox + 19, oy + 28, 11, 4, 0.55);
  for (let y = 6; y <= 28; y++)
    for (let x = 10; x <= 22; x++) {
      const u = (x - 10) / 12;
      let v = 0.9 - u * 0.8 + (H(ox + x, oy + y * 3, k) - 0.5) * 0.18;
      cv.set(ox + x, oy + y, x === 22 || y === 28 ? P.plank[0] : pick(P.plank, v, ox + x, oy + y));
    }
  for (let y = 3; y <= 8; y++) //                                        o topo cortado
    for (let x = 10; x <= 22; x++) {
      const d = ((x - 16) / 6.5) ** 2 + ((y - 6) / 2.8) ** 2;
      if (d <= 1) cv.set(ox + x, oy + y, d > 0.7 ? P.plank[3] : (Math.floor(Math.hypot(x - 16, (y - 6) * 2.2)) % 2 ? P.plank[6] : P.plank[7]));
    }
  const rope = ramp('#5c4a2c', '#8a7248', '#b39a68', '#d4bf8c');
  for (let turn = 0; turn < 3; turn++)
    for (let x = 9; x <= 23; x++) {
      const y = 14 + turn * 3 + Math.round(((x - 16) / 7) ** 2 * 1.2);
      const t = (x + turn) % 3;
      cv.set(ox + x, oy + y, rope[x < 14 ? 3 - t % 2 : x > 19 ? 1 - (t % 2) : 2]);
      cv.set(ox + x, oy + y + 1, rope[0]);
    }
  for (let y = 22; y <= 26; y++) cv.set(ox + 9 - (y - 22), oy + y, rope[y % 2 ? 1 : 2]); // a ponta solta
}

/* ------------------------------------------------------------ chãos */
const plankAt = (H, x, y) => {
  const row = Math.floor(y / 8), iy = y - row * 8;
  const off = Math.floor(H(row, 0, 70) * 64), seg = Math.floor((x + off) / 64), ix = (x + off) - seg * 64;
  return { row, iy, seg, ix };
};
const GROUND = {
  /* A Estrada: terra batida com o mato fechando nas beiradas */
  1(H, x, y, env) {
    const dB = Math.min(x - HD, y - HD, env.W - HD - 1 - x, env.H - HD - 1 - y);
    const g = fbm(H, x, y, 20) * 0.8 + clamp(1 - dB / 30) * 0.55;
    if (g > 0.72) {
      let v = 0.35 + fbm(H, x, y, 30, 0.5) * 0.4 + (H(x, y >> 1, 40) > 0.86 ? 0.22 : 0) - (H(x, y, 41) < 0.06 ? 0.2 : 0);
      return pick(P.grassE, v, x, y);
    }
    if (g > 0.69) return P.dirtE[1]; //                                 a borda do mato
    const rut = Math.abs(((y % HD) - 16) / 16);
    const v = 0.3 + fbm(H, x, y, 10) * 0.55 - (rut > 0.55 && rut < 0.68 ? 0.12 : 0);
    return pick(P.dirtE, v, x, y);
  },
  /* A Mata: capim fechado, clareiras de folha seca */
  2(H, x, y) {
    const litter = fbm(H, x, y, 20);
    if (litter < 0.3) {
      if (H(x, y, 42) > 0.93) return hex(H(x, y, 43) > 0.5 ? '#a8622a' : '#8a4a22'); // folha caída
      return pick(P.litter, 0.3 + fbm(H, x, y, 12, 0.6) * 0.5, x, y);
    }
    if (litter < 0.33) return P.litter[0];
    let v = 0.25 + fbm(H, x, y, 30, 0.5) * 0.5 + (H(x, y >> 1, 40) > 0.84 ? 0.2 : 0) - (H(x, y, 41) < 0.08 ? 0.2 : 0);
    return pick(P.grassM, v, x, y);
  },
  /* A Ponte: tabuado com fresta, e a água correndo embaixo da fresta */
  3(H, x, y) {
    const { row, iy, seg, ix } = plankAt(H, x, y);
    if (iy === 7) return pick(P.water, 0.1 + noise(H, x, y, 6, 72) * 0.25, x, y);
    if (ix === 0) return P.plank[0];
    const base = 0.35 + H(seg, row, 71) * 0.3;
    let v = base + (noise(H, x, y * 7, 18, 73) - 0.5) * 0.35 + (iy === 0 ? 0.18 : 0) - (iy === 6 ? 0.2 : 0);
    if (ix === 1) v += 0.12;
    if ((ix === 3 || ix === 60) && (iy === 2 || iy === 5)) return P.iron[iy === 2 ? 5 : 3]; // prego
    const knot = Math.hypot(ix - (20 + H(seg, row, 74) * 24), (iy - 3.5) * 1.6);
    if (H(seg, row, 75) > 0.6 && knot < 2.4) v = knot < 1.2 ? 0.05 : v - 0.2;
    return pick(P.plank, v, x, y, 0.5);
  },
  /* A Vila: calçamento de pedra redonda */
  4(H, x, y) {
    const cell = 8, gx = Math.floor(x / cell), gy = Math.floor(y / cell);
    let d1 = 1e9, d2 = 1e9, cx = 0, cy = 0, id = 0;
    for (let j = -1; j <= 1; j++)
      for (let i = -1; i <= 1; i++) {
        const px = (gx + i + 0.2 + H(gx + i, gy + j, 80) * 0.6) * cell;
        const py = (gy + j + 0.2 + H(gx + i, gy + j, 81) * 0.6) * cell;
        const d = Math.hypot(x + 0.5 - px, y + 0.5 - py);
        if (d < d1) { d2 = d1; d1 = d; cx = px; cy = py; id = H(gx + i, gy + j, 82); } else if (d < d2) d2 = d;
      }
    if (d2 - d1 < 1.25) return noise(H, x, y, 16, 83) > 0.8 ? P.moss[0] : hex('#1a1714');
    const lit = ((cx - x) + (cy - y)) / 8;
    const v = 0.3 + id * 0.35 + lit * 0.3 - (d2 - d1 < 2.2 ? 0.12 : 0) + (H(x, y, 84) - 0.5) * 0.1;
    return pick(P.cobble, v, x, y, 0.5);
  },
  /* O Castelo: laje de pedra em fiada, e o tapete da Coroa no meio */
  5(H, x, y, env) {
    const cxl = Math.floor(x / HD), cyl = Math.floor(y / HD), ly = y - cyl * HD;
    if (cyl === env.carpet && cxl >= 1 && cxl <= env.m.w - 2 && ly >= 3 && ly <= 28) {
      const lx = x - HD;
      if (ly <= 4 || ly >= 27) return P.gold[ly === 3 || ly === 28 ? 2 : 4];
      if (ly === 5 || ly === 26) return P.carpet[0];
      const mx = ((lx % 16) + 16) % 16, my = ly - 16;
      const diamond = Math.abs(mx - 8) + Math.abs(my) * 0.9;
      if (Math.abs(diamond - 6) < 0.8) return P.gold[3];
      if (diamond < 2.5) return P.gold[mx < 8 ? 4 : 2];
      return pick(P.carpet, 0.45 + (noise(H, x, y, 3, 90) - 0.5) * 0.3 + (diamond < 6 ? 0.12 : 0), x, y, 0.5);
    }
    const row = Math.floor(y / 16), iy = y - row * 16;
    const sx = x + (row % 2) * 8 + Math.floor(H(row, 0, 91) * 3) * 16;
    const col = Math.floor(sx / 16), ix = sx - col * 16;
    if (ix === 0 || iy === 0) return P.flag[0];
    const tone = 0.3 + H(col, row, 92) * 0.3;
    let v = tone + (noise(H, x, y, 5, 93) - 0.5) * 0.18 + (ix === 1 || iy === 1 ? 0.2 : 0) - (ix === 15 || iy === 15 ? 0.18 : 0);
    if (H(col, row, 94) > 0.82 && Math.abs(ix - iy - Math.floor(H(col, row, 95) * 6) + 3) < 0.6 && ix > 2 && ix < 14) v = 0.05; // trinca
    return pick(P.flag, v, x, y, 0.6);
  },
};

/* ------------------------------------------------------------ armadilhas */
function bearTrap(cv, ox, oy) {
  shadow(cv, ox + 17, oy + 18, 12, 8, 0.45);
  const r = P.iron;
  for (let y = 8; y <= 25; y++)
    for (let x = 4; x <= 28; x++) {
      const d = Math.hypot((x - 16) / 11, (y - 16) / 7.5);
      if (d > 1 || d < 0.78) continue;
      cv.set(ox + x, oy + y, pick(r, 0.75 - ((x - 16) / 11 + (y - 16) / 7.5) * 0.3, ox + x, oy + y));
    }
  for (let i = 0; i < 7; i++) { //                                     os dentes, de cima e de baixo
    const x = ox + 7 + i * 3;
    cv.set(x, oy + 10, r[6]); cv.set(x, oy + 11, r[5]); cv.set(x + 1, oy + 11, r[3]); cv.set(x, oy + 12, r[4]);
    cv.set(x + 1, oy + 22, r[5]); cv.set(x + 1, oy + 21, r[4]); cv.set(x + 2, oy + 21, r[2]); cv.set(x + 1, oy + 20, r[3]);
  }
  for (let y = 14; y <= 18; y++) for (let x = 13; x <= 19; x++) cv.set(ox + x, oy + y, pick(r, 0.6 - (x - 13) * 0.07, ox + x, oy + y)); // o gatilho
  cv.set(ox + 14, oy + 15, r[6]);
  for (let i = 0; i < 5; i++) { cv.set(ox + 28 + (i % 2), oy + 17 + i, r[i % 2 ? 2 : 4]); } //   corrente até a estaca
  for (let y = 21; y <= 25; y++) cv.set(ox + 29, oy + y, P.bark[3]);
}
function spikes(cv, ox, oy, H, k) {
  const r = P.iron;
  for (let y = 5; y <= 27; y++)
    for (let x = 5; x <= 27; x++) {
      const edge = x === 5 || y === 5 || x === 27 || y === 27;
      cv.set(ox + x, oy + y, edge ? r[x === 5 || y === 5 ? 4 : 0] : pick(r, 0.32 + (H(ox + x, oy + y, k) - 0.5) * 0.1, ox + x, oy + y));
    }
  for (let j = 0; j < 3; j++)
    for (let i = 0; i < 3; i++) {
      const cx = ox + 10 + i * 6, cy = oy + 11 + j * 6;
      cv.set(cx - 1, cy + 2, r[0]); cv.set(cx, cy + 2, r[0]); cv.set(cx + 1, cy + 2, r[0]);
      cv.set(cx - 1, cy + 1, r[5]); cv.set(cx, cy + 1, r[4]); cv.set(cx + 1, cy + 1, r[2]);
      cv.set(cx, cy, r[6]); cv.set(cx, cy - 1, r[6]); cv.set(cx + 1, cy, r[3]);
      cv.over(cx + 2, cy + 2, SHADOW, 0.4);
    }
}

/* ------------------------------------------------------------ bordas */
function waterCell(cv, ox, oy, H) {
  for (let y = 0; y < HD; y++)
    for (let x = 0; x < HD; x++) {
      const gx = ox + x, gy = oy + y;
      const w = noise(H, gx, gy * 2.5, 14, 100) * 0.6 + noise(H, gx + gy, gy, 5, 101) * 0.4;
      let v = 0.2 + w * 0.45;
      if (Math.abs(((gx * 0.35 + gy * 1.3 + H(Math.floor(gx / 9), gy, 102) * 3) % 7) - 3.5) < 0.35 && w > 0.5) v += 0.3; // marola
      cv.set(gx, gy, pick(P.water, v, gx, gy));
    }
}
function railing(cv, ox, oy, top) {
  const beam = top ? 24 : 2;
  for (let y = beam; y <= beam + 4; y++)
    for (let x = 0; x < HD; x++) cv.set(ox + x, oy + y, pick(P.plank, 0.75 - (y - beam) * 0.14 + ((x + y) % 11 === 0 ? -0.15 : 0), ox + x, oy + y));
  for (let y = beam + 5; y <= beam + 7; y++) for (let x = 0; x < HD; x++) cv.over(ox + x, oy + y, SHADOW, 0.35);
  const post = (top ? 13 : 0);
  for (let y = post; y <= post + 18; y++)
    for (let x = 13; x <= 18; x++) cv.set(ox + x, oy + y, x === 18 ? P.plank[0] : pick(P.plank, 0.85 - (x - 13) * 0.13, ox + x, oy + y));
  for (let x = 13; x <= 18; x++) cv.set(ox + x, oy + post, P.plank[7]);
}
function masonry(cv, ox, oy, H, k, r) {
  for (let y = 0; y < HD; y++) {
    const row = Math.floor((oy + y) / 10), iy = (oy + y) - row * 10;
    for (let x = 0; x < HD; x++) {
      const sx = ox + x + (row % 2) * 9, col = Math.floor(sx / 18), ix = sx - col * 18;
      if (iy === 9 || ix === 17) { cv.set(ox + x, oy + y, r[0]); continue; }
      const v = 0.35 + H(col, row, k) * 0.3 + (iy === 0 || ix === 0 ? 0.22 : 0) - (iy === 8 || ix === 16 ? 0.15 : 0) + (H(ox + x, oy + y, k + 1) - 0.5) * 0.12;
      cv.set(ox + x, oy + y, pick(r, v, ox + x, oy + y, 0.5));
    }
  }
}
/** Fachada de casa da Vila: beiral de telha, parede de pau-a-pique, janela acesa ou porta. */
function houseFront(cv, ox, oy, H, k, out, x) {
  for (let y = 0; y < HD; y++)
    for (let i = 0; i < HD; i++) {
      const gx = ox + i;
      if (y < 12) { //                                                  telhado em escama
        const row = Math.floor(y / 4), iy = y - row * 4, sx = gx + (row % 2) * 4, ix = sx % 8;
        const v = 0.55 - row * 0.12 + (iy === 0 ? 0.2 : 0) - (iy === 3 ? 0.25 : 0) - Math.abs(ix - 3.5) * 0.03 + (H(Math.floor(sx / 8), row, k) - 0.5) * 0.2;
        cv.set(gx, oy + y, ix === 7 && iy > 0 ? P.roof[0] : pick(P.roof, v, gx, oy + y));
        continue;
      }
      if (y === 12) { cv.set(gx, oy + y, P.timber[0]); continue; }
      const beam = i <= 1 || i >= 30 || y === 13 || y === 31;
      cv.set(gx, oy + y, beam ? P.timber[i <= 1 || y === 13 ? 2 : 1] : pick(P.plaster, 0.55 + (noise(H, gx, oy + y, 4, k) - 0.5) * 0.4 - (y - 13) * 0.012, gx, oy + y));
    }
  const kind = H(x, 0, 110);
  if (kind < 0.62) { //                                                 janela com luz de vela
    for (let y = 16; y <= 26; y++)
      for (let i = 10; i <= 21; i++) {
        const frame = i === 10 || i === 21 || y === 16 || y === 26 || i === 15 || i === 16 || y === 21;
        cv.set(ox + i, oy + y, frame ? P.timber[frame && (i === 10 || y === 16) ? 2 : 1] : P.flame[y < 19 ? 5 : y < 23 ? 4 : 3]);
      }
    for (let i = 9; i <= 22; i++) cv.set(ox + i, oy + 27, P.timber[2]);
    out.lights.push({ x: ox + 16, y: oy + 34, r: 30, kind: 'window' });
  } else if (kind < 0.8) { //                                           porta em arco
    for (let y = 15; y <= 31; y++)
      for (let i = 10; i <= 21; i++) {
        if (y < 18 && Math.hypot(i - 15.5, (y - 18) * 1.3) > 6) continue;
        cv.set(ox + i, oy + y, i === 10 || i === 21 ? P.timber[0] : pick(P.crate, 0.45 - (i - 11) * 0.02 + (i % 3 === 0 ? -0.12 : 0), ox + i, oy + y));
      }
    cv.set(ox + 19, oy + 24, P.gold[5]);
  } else { //                                                           placa de taverna
    for (let y = 17; y <= 24; y++) for (let i = 8; i <= 23; i++) cv.set(ox + i, oy + y, y === 17 || y === 24 || i === 8 || i === 23 ? P.timber[1] : pick(P.crate, 0.6, ox + i, oy + y));
    for (let i = 12; i <= 19; i++) cv.set(ox + i, oy + 20 + (i % 2), P.gold[4]);
  }
}
/** Muro do castelo visto de frente: tijolo em fiada, bandeira da Coroa e tocha. */
function castleFace(cv, ox, oy, H, k, out, x, w) {
  for (let y = 0; y < HD; y++)
    for (let i = 0; i < HD; i++) {
      const gx = ox + i;
      if (y < 4) { cv.set(gx, oy + y, pick(P.brick, y === 0 ? 0.95 : 0.75 - y * 0.08, gx, oy + y)); continue; }
      const row = Math.floor((y - 4) / 6), iy = (y - 4) - row * 6, sx = gx + (row % 2) * 6, col = Math.floor(sx / 12), ix = sx - col * 12;
      if (iy === 5 || ix === 11) { cv.set(gx, oy + y, P.brick[0]); continue; }
      const v = 0.3 + H(col, row, k) * 0.3 + (iy === 0 ? 0.18 : 0) - (y > 26 ? 0.2 : 0) + (H(gx, oy + y, k + 1) - 0.5) * 0.1;
      cv.set(gx, oy + y, pick(P.brick, v, gx, oy + y, 0.5));
    }
  if (x > 0 && x < w - 1 && x % 4 === 2) { //                           bandeira
    for (let y = 3; y <= 27; y++)
      for (let i = 9; i <= 22; i++) {
        const tail = y > 22 ? Math.abs(i - 15.5) < (y - 22) * 1.3 : false;
        if (tail) continue;
        const trim = i === 9 || i === 22 || y === 5;
        const fold = Math.sin((i - 9) * 0.9) * 0.12;
        cv.set(ox + i, oy + y, y < 5 ? P.iron[3] : trim ? P.gold[3] : pick(P.carpet, 0.6 + fold - (i - 9) * 0.02, ox + i, oy + y));
      }
    const crown = ['.x.x.x.', '.xxxxx.', '.xRxRx.', '.xxxxx.'];
    crown.forEach((row, j) => [...row].forEach((c, i) => { if (c !== '.') cv.set(ox + 12 + i, oy + 11 + j, c === 'R' ? hex('#e04858') : P.gold[j === 0 ? 5 : 4]); }));
    for (let i = 9; i <= 22; i++) cv.over(ox + i, oy + 28, SHADOW, 0.3);
  } else if (x > 0 && x < w - 1 && x % 4 === 0) { //                    tocha na parede
    for (let y = 15; y <= 22; y++) cv.set(ox + 15, oy + y, P.iron[3]), cv.set(ox + 16, oy + y, P.iron[1]);
    for (let i = 13; i <= 18; i++) cv.set(ox + i, oy + 14, P.iron[i < 16 ? 4 : 2]);
    for (let y = 11; y <= 13; y++) for (let i = 14; i <= 17; i++) cv.set(ox + i, oy + y, P.bark[i < 16 ? 3 : 1]);
    out.lights.push({ x: ox + 16, y: oy + 9, r: 70, kind: 'torch' });
  }
}
/** Topo do muro (laterais e fundo), com as ameias do lado de fora. */
function wallTop(cv, ox, oy, H, k, side) {
  masonry(cv, ox, oy, H, k, P.brick);
  for (let y = 0; y < HD; y++)
    for (let x = 0; x < HD; x++) {
      const along = side === 'l' || side === 'r' ? y : x;
      const across = side === 'l' ? x : side === 'r' ? HD - 1 - x : side === 'b' ? HD - 1 - y : y;
      if (across > 7 || (along % 12) >= 7) continue; //                 ameia: dente de 7, vão de 5
      const edge = across === 7 || (along % 12) === 6 || (along % 12) === 0;
      cv.set(ox + x, oy + y, edge ? P.brick[1] : pick(P.brick, 0.85 - across * 0.05, ox + x, oy + y));
    }
}

/* ------------------------------------------------------------ o que ocupa a casa */
function obstacle(cv, x, y, m, H, rnd, out) {
  const ox = x * HD, oy = y * HD, k = y * m.w + x + 1, id = m.terrain.id;
  const w = m.w, h = m.h, border = x === 0 || y === 0 || x === w - 1 || y === h - 1;
  const roll = rnd.float();
  if (id === 1) {
    if (border) for (let j = 0; j < HD; j++) for (let i = 0; i < HD; i++) cv.mul(ox + i, oy + j, 0.72);
    if (border) return roll < 0.72 ? oak(cv, ox, oy, P.oak, H, k) : bush(cv, ox, oy, P.oak, H, k, roll > 0.92);
    return roll < 0.55 ? oak(cv, ox, oy, P.oak, H, k) : roll < 0.8 ? boulder(cv, ox, oy, H, k, false) : bush(cv, ox, oy, P.oak, H, k, roll > 0.9);
  }
  if (id === 2) {
    if (border) for (let j = 0; j < HD; j++) for (let i = 0; i < HD; i++) cv.mul(ox + i, oy + j, 0.62);
    if (border) return roll < 0.7 ? pine(cv, ox, oy, P.pine, H, k) : oak(cv, ox, oy, P.oakM, H, k);
    return roll < 0.45 ? pine(cv, ox, oy, P.pine, H, k) : roll < 0.7 ? oak(cv, ox, oy, P.oakM, H, k)
      : roll < 0.88 ? boulder(cv, ox, oy, H, k, true) : stump(cv, ox, oy, H, k);
  }
  if (id === 3) {
    if (border) {
      if (x === 0 || x === w - 1) { //                                 cabeceira de pedra
        masonry(cv, ox, oy, H, k, P.rock);
        if (y === 0 || y === h - 1) out.lights.push({ x: ox + 16, y: oy + 16, r: 54, kind: 'lamp' }), lanternOnPost(cv, ox, oy);
        return;
      }
      waterCell(cv, ox, oy, H);
      out.water.push([x, y]);
      return railing(cv, ox, oy, y === 0);
    }
    return roll < 0.55 ? bollard(cv, ox, oy, H, k) : barrels(cv, ox, oy, H, k);
  }
  if (id === 4) {
    if (border) return y === 0 ? houseFront(cv, ox, oy, H, k, out, x) : lowWall(cv, ox, oy, H, k, x, y, w, h);
    // poste é ponto de luz: mais de três lava o calçamento de amarelo
    const lamps = out.lights.filter((l) => l.kind === 'lamp').length;
    return roll < 0.3 ? barrels(cv, ox, oy, H, k) : roll < 0.52 ? haystack(cv, ox, oy, H, k)
      : roll < 0.78 ? planter(cv, ox, oy, H, k) : roll < 0.9 || lamps >= 3 ? well(cv, ox, oy, H, k) : lamppost(cv, ox, oy, H, k, out);
  }
  if (border) return y === 0 ? castleFace(cv, ox, oy, H, k, out, x, w) : wallTop(cv, ox, oy, H, k, x === 0 ? 'l' : x === w - 1 ? 'r' : 'b');
  return roll < 0.78 ? pillar(cv, ox, oy, P.flag, H, k) : brazier(cv, ox, oy, H, k, out);
}
function lanternOnPost(cv, ox, oy) {
  for (let y = 10; y <= 24; y++) cv.set(ox + 15, oy + y, P.iron[4]), cv.set(ox + 16, oy + y, P.iron[1]);
  for (let y = 5; y <= 11; y++) for (let x = 12; x <= 19; x++) cv.set(ox + x, oy + y, x === 12 || x === 19 || y === 5 || y === 11 ? P.iron[x < 16 ? 4 : 2] : P.flame[y < 8 ? 5 : 4]);
}
/** Mureta de pedra com cerca-viva (as laterais e o fundo da Vila). */
function lowWall(cv, ox, oy, H, k, x, y, w, h) {
  masonry(cv, ox, oy, H, k, P.cobble);
  const inner = x === 0 ? 'r' : x === w - 1 ? 'l' : 't';
  for (let j = 0; j < HD; j++)
    for (let i = 0; i < HD; i++) {
      const d = inner === 'r' ? HD - 1 - i : inner === 'l' ? i : j;
      if (d > 11 - Math.floor(H(ox + i, oy + j, k) * 3)) {
        const v = 0.3 + noise(H, ox + i, oy + j, 3, k + 5) * 0.5 + (d > 11 ? -0.1 : 0);
        cv.set(ox + i, oy + j, pick(P.oak, v, ox + i, oy + j));
      }
    }
  void y; void h;
}

/* ------------------------------------------------------------ a sala inteira */
function paintRoom(m) {
  const W = m.w * HD, Hh = m.h * HD;
  const cv = surface(W, Hh);
  const H = hasher(m.seed);
  const rnd = stream(m.seed, 'arte:objetos');
  const id = m.terrain.id, g = m.grid;
  let carpet = Math.floor(m.h / 2);
  if (carpet % 2 === 0) carpet--; //                                    o tapete corre na fileira sem pilar
  const env = { W, H: Hh, m, carpet };
  const out = { lights: [], water: [] };
  const solid = (x, y) => g[y]?.[x] === '#';

  // 1. o chão, em coordenada de mundo
  const ground = GROUND[id];
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) cv.set(x, y, ground(H, x, y, env));

  // 2. miudezas e armadilhas, casa a casa
  for (let y = 1; y < m.h - 1; y++)
    for (let x = 1; x < m.w - 1; x++) {
      const c = g[y][x], ox = x * HD, oy = y * HD, k = y * m.w + x + 1;
      if (c === '#') continue;
      if (c === '~') { (id >= 4 ? spikes(cv, ox, oy, H, k) : bearTrap(cv, ox, oy)); continue; }
      if (id === 5 && y === carpet) continue;
      const n = Math.floor(H(x, y, 120) * 4);
      for (let i = 0; i < n; i++) {
        const px = ox + 4 + Math.floor(H(x, y, 121 + i) * 23), py = oy + 5 + Math.floor(H(x, y, 131 + i) * 22), r = H(x, y, 141 + i);
        if (id === 1) r < 0.45 ? pebble(cv, px, py, P.rock) : r < 0.85 ? tuft(cv, px, py, P.grassE, H, k + i) : flower(cv, px, py, hex('#e6c34a'), hex('#fff1a8'));
        else if (id === 2) r < 0.4 ? tuft(cv, px, py, P.grassM, H, k + i) : r < 0.65 ? flower(cv, px, py, hex(r < 0.52 ? '#e8e4d0' : '#9b7fd1'), hex('#f2d45a')) : r < 0.78 ? mushroom(cv, px, py) : pebble(cv, px, py, P.rock);
        else if (id === 4 && r < 0.3) pebble(cv, px, py, P.cobble);
        else if (id === 5 && r < 0.18) pebble(cv, px, py, P.flag);
      }
      if (id === 4 && H(x, y, 150) > 0.9) puddle(cv, ox, oy, H, k);
    }

  // 3. sombra projetada pela borda (luz de cima à esquerda). O que fica no meio
  //    da sala projeta a própria sombra, com o formato dele — quadrado aqui viraria mancha.
  const deep = id >= 4 ? 1 : 0.8;
  const wall = (x, y) => solid(x, y) && (x === 0 || y === 0 || x === m.w - 1 || y === m.h - 1);
  for (let y = 1; y < m.h - 1; y++)
    for (let x = 1; x < m.w - 1; x++) {
      if (solid(x, y)) continue;
      const ox = x * HD, oy = y * HD;
      const up = wall(x, y - 1), left = wall(x - 1, y), corner = wall(x - 1, y - 1);
      const tall = y - 1 === 0 && (id === 4 || id === 5); //         a fachada e o muro de frente são altos
      const reachY = tall ? 12 : 7, reachX = 6;
      for (let j = 0; j < HD; j++)
        for (let i = 0; i < HD; i++) {
          let s = 0;
          if (up && j < reachY) s = Math.max(s, (1 - j / reachY) * 0.5);
          if (left && i < reachX) s = Math.max(s, (1 - i / reachX) * 0.38);
          if (corner && !up && !left && i < reachX && j < reachY) s = Math.max(s, (1 - Math.max(i / reachX, j / reachY)) * 0.3);
          if (s > 0) cv.mul(ox + i, oy + j, 1 - s * deep);
        }
    }

  // 4. o que não quebra: de cima pra baixo, pra copa da frente cobrir o tronco de trás
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (solid(x, y)) obstacle(cv, x, y, m, H, rnd, out);

  // 5. a luz das tochas, lampiões e janelas, assada no chão
  for (const l of out.lights) {
    const r = l.r, a0 = l.kind === 'window' ? 0.12 : l.kind === 'lamp' ? 0.13 : 0.2;
    for (let y = Math.floor(l.y - r); y <= l.y + r; y++)
      for (let x = Math.floor(l.x - r); x <= l.x + r; x++) {
        const d = Math.hypot(x - l.x, (y - l.y) * 1.15) / r;
        if (d < 1) cv.add(x, y, WARM, a0 * (1 - d) * (1 - d));
      }
  }

  // 6. vinheta: a borda da sala cai pra sombra
  for (let y = 0; y < Hh; y++)
    for (let x = 0; x < W; x++) {
      const nx = (x - W / 2) / (W / 2), ny = (y - Hh / 2) / (Hh / 2);
      const r = nx * nx * 0.75 + ny * ny * 0.85;
      if (r > 0.3) cv.mul(x, y, 1 - 0.24 * clamp((r - 0.3) / 1.1));
    }

  return { w: W, h: Hh, px: cv.px, lights: out.lights, water: out.water };
}
function puddle(cv, ox, oy, H, k) {
  const cx = ox + 10 + Math.floor(H(k, 0, 151) * 12), cy = oy + 12 + Math.floor(H(k, 0, 152) * 10);
  for (let y = cy - 4; y <= cy + 4; y++)
    for (let x = cx - 8; x <= cx + 8; x++) {
      const d = Math.hypot((x - cx) / 7.5, (y - cy) / 3.6);
      if (d > 1) continue;
      cv.set(x, y, d > 0.8 ? P.water[1] : pick(P.water, 0.3 + (y < cy ? 0.25 : 0) + (x - cx === y - cy ? 0.3 : 0), x, y));
    }
}

/* ------------------------------------------------------------ o que quebra */
/** Caixote 3/4, baú e cofre, 34×34 com a sombra vazando pra direita e pra baixo. */
function paintProp(kind, terrain, seed) {
  const S = 34, cv = surface(S, S), H = hasher(String(seed) + ':' + kind);
  const id = terrain?.id || 1;
  const drop = (x0, y0, x1, y1, a) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) cv.over(x, y, SHADOW, a); };
  let face = null;
  if (kind === 'o') {
    const wood = id === 5 ? P.crateDark : P.crate;
    drop(5, 29, 32, 32, 0.42); drop(30, 7, 32, 28, 0.42);
    const x0 = 2, x1 = 29, top = 4, mid = 11, bot = 29;
    for (let y = top; y <= bot; y++)
      for (let x = x0; x <= x1; x++) {
        let c;
        if (y < mid) { //                                             a tampa
          const v = 0.78 - (x - x0) * 0.008 + (y === top ? 0.12 : 0) + (noise(H, x, y * 6, 9, 1) - 0.5) * 0.25 - (y === 7 ? 0.35 : 0);
          c = pick(wood, v, x, y, 0.5);
        } else { //                                                   a frente
          const plank = Math.floor((x - x0) / 7), px = (x - x0) - plank * 7;
          let v = 0.45 + H(plank, 0, 2) * 0.12 + (noise(H, x * 5, y, 10, 3) - 0.5) * 0.25 + (px === 0 ? 0.1 : 0) - (px === 6 ? 0.18 : 0);
          const batten = id !== 5 && ((y >= 13 && y <= 15) || (y >= 25 && y <= 27));
          const brace = id !== 5 && Math.abs((x - x0) - ((bot - 3) - y) * (27 / 12)) < 1.6 && y > 15 && y < 25;
          if (batten) v = 0.66 + (y === 13 || y === 25 ? 0.14 : 0) - (y === 15 || y === 27 ? 0.16 : 0);
          if (brace) v = 0.6 + (Math.abs((x - x0) - ((bot - 3) - y) * (27 / 12)) < 0.6 ? 0.1 : -0.05);
          c = pick(wood, v, x, y, 0.5);
          if (batten && (x === x0 + 3 || x === x1 - 3) && y === 14 || batten && (x === x0 + 3 || x === x1 - 3) && y === 26) c = P.iron[5];
        }
        const edge = x === x0 || x === x1 || y === top || y === bot;
        if (edge) c = y === top || x === x0 ? wood[2] : wood[0];
        if (y === mid) c = wood[1];
        cv.set(x, y, c);
      }
    if (id === 5) { //                                                 cantoneira de ferro no castelo
      for (let y = mid; y <= bot; y++) for (const x of [x0, x0 + 1, x1 - 1, x1]) cv.set(x, y, P.iron[x <= x0 + 1 ? 4 : 1]);
      for (const by of [15, 24]) for (let x = x0; x <= x1; x++) {
        cv.set(x, by, P.iron[x < 16 ? 5 : 3]); cv.set(x, by + 1, P.iron[x < 16 ? 3 : 1]);
        if ((x - x0) % 6 === 3) cv.set(x, by, P.iron[6]);
      }
    } else {
      for (const [x, y] of [[x0, mid], [x1 - 2, mid], [x0, bot - 2], [x1 - 2, bot - 2]])
        for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) if (i === 0 || j === 0 || (x === x0 && i === 0)) cv.set(x + i, y + j, P.iron[i + j === 0 ? 5 : 3]);
    }
  } else if (kind === '$') {
    drop(6, 28, 32, 31, 0.42); drop(29, 12, 31, 27, 0.4);
    const x0 = 4, x1 = 27;
    for (let y = 7; y <= 28; y++)
      for (let x = x0; x <= x1; x++) {
        const u = (x - x0) / (x1 - x0);
        let c;
        if (y <= 15) { //                                             a tampa curva
          const dome = Math.sqrt(Math.max(0, 1 - ((15 - y) / 8.5) ** 2));
          if (y < 9 && (x < x0 + 2 || x > x1 - 2)) continue;
          c = pick(P.crate, 0.35 + dome * 0.45 - u * 0.25 + (y % 3 === 0 ? -0.08 : 0), x, y, 0.5);
        } else c = pick(P.crate, 0.5 - u * 0.3 + (noise(H, x * 4, y, 8, 4) - 0.5) * 0.2, x, y, 0.5);
        const band = x === 8 || x === 9 || x === 22 || x === 23 || y === 15 || y === 16 || y === 27;
        if (band) c = pick(P.gold, 0.8 - u * 0.4 + (y === 15 ? 0.1 : 0), x, y);
        if (x === x0 || x === x1 || y === 28) c = P.crate[0];
        cv.set(x, y, c);
      }
    for (let y = 13; y <= 20; y++) for (let x = 13; x <= 18; x++) cv.set(x, y, pick(P.gold, 0.95 - (x - 13) * 0.08 - (y - 13) * 0.03, x, y)); // fechadura
    cv.set(15, 16, P.iron[0]); cv.set(16, 16, P.iron[0]); cv.set(15, 17, P.iron[0]); cv.set(16, 18, P.iron[0]); cv.set(15, 18, P.iron[0]);
    cv.set(14, 14, P.gold[6]); cv.set(8, 17, P.gold[6]); cv.set(6, 9, P.crate[7]);
  } else { //                                                           o cofre dourado da Coroa
    drop(5, 29, 32, 32, 0.45); drop(30, 8, 32, 28, 0.45);
    const x0 = 3, x1 = 28, top = 5, mid = 12, bot = 29;
    for (let y = top; y <= bot; y++)
      for (let x = x0; x <= x1; x++) {
        const u = (x - x0) / (x1 - x0);
        let c = y < mid
          ? pick(P.gold, 0.85 - u * 0.25 + (y === top ? 0.1 : 0), x, y)
          : pick(P.gold, 0.72 - u * 0.5 + (Math.abs(x - y * 0.6 - 4) < 2.5 ? 0.25 : 0), x, y);
        const strap = y >= mid && (x <= x0 + 2 || x >= x1 - 2 || y === mid + 1 || y >= bot - 1);
        if (strap) c = P.iron[x <= x0 + 2 ? 4 : y === mid + 1 ? 3 : 1];
        if (x === x0 || x === x1 || y === top || y === bot) c = P.gold[0];
        if (y === mid) c = P.gold[1];
        cv.set(x, y, c);
      }
    const crown = ['x..x..x', 'xx.x.xx', 'xxxxxxx', 'xRxRxRx', 'xxxxxxx'];
    crown.forEach((row, j) => [...row].forEach((c, i) => { if (c !== '.') cv.set(12 + i, 15 + j, c === 'R' ? hex('#d22c40') : P.gold[j < 2 ? 6 : 5]); }));
    for (let x = 12; x <= 18; x++) cv.set(x, 20, P.gold[1]);
    for (let y = 22; y <= 26; y++) for (let x = 14; x <= 17; x++) cv.set(x, y, y === 22 ? P.iron[4] : P.iron[1]); // fechadura
    cv.set(15, 24, P.gold[6]);
    face = [x0 + 3, top + 1, x1 - 3, bot - 2];
  }
  return { w: S, h: S, px: cv.px, face };
}

/** A rachadura do caixote, do primeiro golpe ao último: sai do meio e ramifica. */
function crackPixels(k) {
  let s = (k * 2654435761) >>> 0;
  const r = () => ((s = (Math.imul(s ^ (s >>> 15), 2246822519) + 0x6d2b79f5) >>> 0) / 4294967296);
  const pts = [], seen = new Set();
  const put = (x, y) => { const key = x * 64 + y; if (seen.has(key) || x < 4 || x > 27 || y < 12 || y > 28) return false; seen.add(key); pts.push([x, y]); return true; };
  const arms = [[16, 20, -1, -1], [16, 20, 1, 1], [16, 20, 1, -1], [16, 20, -1, 1]];
  for (let step = 0; step < 12; step++)
    for (const a of arms) {
      if (r() < 0.6) a[0] += a[2]; else a[1] += a[3];
      if (r() < 0.12) a[2] = -a[2];
      put(a[0], a[1]);
    }
  return pts;
}

module.exports = { HD, paintRoom, paintProp, crackPixels };

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
const ART = require('./mapart');

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

/**
 * Renderiza o terreno inteiro num PNG, na arte de 32 px por casa (lib/mapart.js):
 * o chão com o que não quebra e, por cima, caixotes e baús — os escondidos só
 * com `reveal`.
 */
function render(map, scale = 1, reveal = false) {
  const room = ART.paintRoom(map);
  const bw = room.w, bh = room.h, base = room.px;
  const props = { o: ART.paintProp('o', map.terrain, map.seed), $: ART.paintProp('$', map.terrain, map.seed) };
  const hiddenSet = new Set(map.hidden.map(([x, y]) => `${x},${y}`));
  for (let y = 0; y < map.h; y++)
    for (let x = 0; x < map.w; x++) {
      let k = map.grid[y][x];
      if (reveal && hiddenSet.has(`${x},${y}`)) k = '$';
      const p = props[k];
      if (!p) continue;
      for (let j = 0; j < p.h; j++)
        for (let i = 0; i < p.w; i++) {
          const s = (j * p.w + i) * 4, a = p.px[s + 3] / 255, X = x * ART.HD + i, Y = y * ART.HD + j;
          if (!a || X >= bw || Y >= bh) continue;
          const o = (Y * bw + X) * 4;
          for (let c = 0; c < 3; c++) base[o + c] = Math.round(p.px[s + c] * a + base[o + c] * (1 - a));
        }
    }
  if (scale === 1) return encodePNG(bw, bh, Buffer.from(base), 4);
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

/* drawTile (16 px) segue pra cena da estrada dos sacos; o assalto usa a arte de 32 px. */
module.exports = { TERRAINS, TILE, HD: ART.HD, generate, render, drawTile, paintRoom: ART.paintRoom, paintProp: ART.paintProp, crackPixels: ART.crackPixels };

};

root.OutlawsLib = { traits: require('./traits'), sprite: require('./sprite'), rng: require('./rng'), map: require('./map'), sha256 };
})(typeof window !== 'undefined' ? window : globalThis);

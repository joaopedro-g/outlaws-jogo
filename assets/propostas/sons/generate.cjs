/* Run: node assets/propostas/sons/generate.cjs
 * Check existing outputs without writes: append --check.
 * Built-in Node only. No downloads. The browser renders these same recipes.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const kit = require(path.resolve(__dirname, '../../../jogar/js/sfx.js'));
const checkOnly = process.argv.includes('--check');
const variations = kit.names.map(name => ({ name, file: `${name}.wav`, streak: 1 }));
for (let streak = 2; streak <= 6; streak++) variations.push({ name: 'combo', file: `combo-${streak}.wav`, streak });

function wav(rendered) {
  const bytes = Buffer.alloc(44 + rendered.samples.length * 2);
  bytes.write('RIFF', 0); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WAVE', 8);
  bytes.write('fmt ', 12); bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22); bytes.writeUInt32LE(rendered.sampleRate, 24);
  bytes.writeUInt32LE(rendered.sampleRate * 2, 28); bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36); bytes.writeUInt32LE(rendered.samples.length * 2, 40);
  for (let i = 0; i < rendered.samples.length; i++) {
    const value = rendered.samples[i];
    if (!Number.isFinite(value) || Math.abs(value) > 0.48) throw new Error(`Invalid or clipped sample at ${i}`);
    bytes.writeInt16LE(Math.round(value * 32767), 44 + i * 2);
  }
  return bytes;
}

const manifest = { format: 'PCM mono, 16-bit little-endian; effects 44100Hz, ambient 11025Hz', browserDefaultVolume: 0.28,
  synthesis: 'Original deterministic chiptune/western recipes in jogar/js/sfx.js; no external media.', sounds: [] };
for (const variant of variations) {
  const rendered = kit.synthesize(variant.name, { streak: variant.streak });
  if (rendered.peak < 0.01) throw new Error(`Unexpected silence: ${variant.file}`);
  if (variant.name !== 'ambient' && (rendered.duration > 0.8 || rendered.samples.at(-1) !== 0)) throw new Error(`Envelope mismatch: ${variant.file}`);
  if (variant.name === 'ambient' && Math.abs(rendered.samples[0] - rendered.samples.at(-1)) > 0.015) throw new Error('Ambient loop seam is too large');
  const bytes = wav(rendered);
  const destination = path.join(__dirname, variant.file);
  if (checkOnly) {
    if (!fs.existsSync(destination) || !fs.readFileSync(destination).equals(bytes)) throw new Error(`WAV differs from shared synthesis: ${variant.file}`);
  } else fs.writeFileSync(destination, bytes);
  manifest.sounds.push({ name: variant.name, file: variant.file, ...(variant.name === 'combo' ? { streak: variant.streak } : {}),
    sampleRate: rendered.sampleRate, durationSeconds: rendered.duration, peak: Number(rendered.peak.toFixed(6)), peakAtDefaultVolume: Number((rendered.peak * 0.28).toFixed(6)),
    sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
}
const manifestFile = path.join(__dirname, 'manifest.json');
const serializedManifest = JSON.stringify(manifest, null, 2) + '\n';
if (checkOnly) {
  if (fs.readFileSync(manifestFile, 'utf8') !== serializedManifest) throw new Error('Manifest differs from current recipes');
} else fs.writeFileSync(manifestFile, serializedManifest);
const maxPeak = Math.max(...manifest.sounds.map(sound => sound.peak));
console.log(`${checkOnly ? 'Verified' : 'Generated'} ${variations.length} WAV files; peak ${maxPeak.toFixed(4)}; zero clipping; shared recipe parity OK.`);

/* Original local synthesis. Node built-ins only. Run with --check for no writes. */
'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const kit = require(path.resolve(__dirname, '../../../../jogar/js/arsenal-sfx.js'));
const checkOnly = process.argv.includes('--check');
const manifest = { format: 'PCM mono 44100Hz 16-bit', defaultVolume: .28, maximumVolume: .65, maximumVoices: 4,
  description: 'Original short western/chiptune synthesis, shared with jogar/js/arsenal-sfx.js. No downloaded media. No sub-bass.', sounds: [] };
for (const name of kit.names) {
  const rendered = kit.synthesize(name), bytes = Buffer.alloc(44 + rendered.samples.length * 2);
  if (rendered.duration > .8 || rendered.peak > .055001 || rendered.peak < .01 || rendered.samples.at(-1) !== 0) throw new Error('Invalid envelope/headroom: ' + name);
  bytes.write('RIFF', 0); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WAVE', 8); bytes.write('fmt ', 12);
  bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22); bytes.writeUInt32LE(rendered.sampleRate, 24);
  bytes.writeUInt32LE(rendered.sampleRate * 2, 28); bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36); bytes.writeUInt32LE(rendered.samples.length * 2, 40);
  for (let index = 0; index < rendered.samples.length; index++) {
    if (!Number.isFinite(rendered.samples[index])) throw new Error('Non-finite PCM: ' + name);
    bytes.writeInt16LE(Math.round(rendered.samples[index] * 32767), 44 + index * 2);
  }
  const destination = path.join(__dirname, name + '.wav');
  if (checkOnly) { if (!fs.readFileSync(destination).equals(bytes)) throw new Error('WAV differs: ' + name); }
  else fs.writeFileSync(destination, bytes);
  manifest.sounds.push({ name, file: name + '.wav', durationSeconds: rendered.duration, peak: Number(rendered.peak.toFixed(6)),
    peakAtDefaultVolume: Number((rendered.peak * .28).toFixed(6)), sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
}
const json = JSON.stringify(manifest, null, 2) + '\n', destination = path.join(__dirname, 'manifest.json');
if (checkOnly) { if (fs.readFileSync(destination, 'utf8') !== json) throw new Error('Manifest differs'); }
else fs.writeFileSync(destination, json);
console.log(`${checkOnly ? 'Verified' : 'Generated'} ${kit.names.length} original WAVs, peak <=0.055, zero clipping, runtime parity OK.`);

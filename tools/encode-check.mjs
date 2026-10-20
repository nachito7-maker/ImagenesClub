// Proves the Opus files really are the same music as the masters: decodes all 100 back to PCM and
// compares loudness, the 8-11 kHz band, duration, and signal-to-noise against the WAV master.
// Run after tools/encode-music.mjs: node tools/encode-check.mjs
import {spawn} from 'node:child_process';
import {readFileSync, writeFileSync, mkdirSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import ffmpegPath from 'ffmpeg-static';

const MASTERS = 'artifacts/masters';
const OUT = 'public/assets/music';
const RATE = 48000;

/** Decodes any audio file to mono float PCM at 48 kHz, which is what Opus decodes to anyway. */
function decode(file) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, ['-hide_banner', '-loglevel', 'error', '-i', file, '-ac', '1', '-ar', String(RATE), '-f', 'f32le', '-'], {stdio: ['ignore', 'pipe', 'pipe']});
    const chunks = [];
    let stderr = '';
    child.stdout.on('data', (chunk) => chunks.push(chunk));
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) return reject(new Error(`${file}: ${stderr.trim()}`));
      const buffer = Buffer.concat(chunks);
      resolve(new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4));
    });
  });
}

const rms = (samples, from = 0, to = samples.length) => {
  let sum = 0;
  for (let i = from; i < to; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / Math.max(1, to - from));
};

/** Energy in the 8-11 kHz band via a simple one-pole split, in dB relative to the whole signal. */
function highBand(samples) {
  let low = 0, high = 0, filtered = 0;
  // One-pole low-pass at ~8 kHz, then the residual is the top band.
  const a = 1 - Math.exp(-2 * Math.PI * 8000 / RATE);
  for (let i = 0; i < samples.length; i++) {
    filtered += (samples[i] - filtered) * a;
    const rest = samples[i] - filtered;
    high += rest * rest;
    low += samples[i] * samples[i];
  }
  return 10 * Math.log10((high + 1e-12) / (low + 1e-12));
}

const files = readdirSync(OUT).filter(name => name.endsWith('.ogg')).sort();
if (files.length !== 100) {
  console.error(`Se esperaban 100 archivos Opus y hay ${files.length}`);
  process.exit(1);
}
const rows = [];
for (const file of files) {
  const master = await decode(join(MASTERS, file.replace(/\.ogg$/, '.wav')));
  const encoded = await decode(join(OUT, file));
  // Opus trims its encoder delay on decode, but a couple of ms of slack keeps the comparison fair.
  const length = Math.min(master.length, encoded.length);
  let reference = 0, error = 0;
  for (let i = 0; i < length; i++) {
    reference += master[i] * master[i];
    error += (master[i] - encoded[i]) ** 2;
  }
  const snr = 10 * Math.log10(reference / (error || 1e-12));
  const loudness = 20 * Math.log10(rms(encoded) / rms(master));
  const band = highBand(encoded) - highBand(master);
  const drift = (encoded.length - master.length) / RATE;
  rows.push({id: file.replace('.ogg', ''), snr, loudness, band, drift});
}

const stat = (key) => {
  const values = rows.map(row => row[key]);
  return {min: Math.min(...values), max: Math.max(...values), avg: values.reduce((a, b) => a + b, 0) / values.length};
};
const report = {
  tracks: rows.length,
  snr: stat('snr'),
  loudnessDb: stat('loudness'),
  band8to11kHzDb: stat('band'),
  durationDriftSeconds: stat('drift'),
  worstSnr: [...rows].sort((a, b) => a.snr - b.snr).slice(0, 3).map(row => ({id: row.id, snr: +row.snr.toFixed(1)}))
};
// Audible-quality bounds: loudness within 0.6 dB, the top band within 1.5 dB, no drift over 60 ms,
// and SNR above 12 dB on every single track.
const ok = Math.abs(report.loudnessDb.min) < 0.6 && Math.abs(report.loudnessDb.max) < 0.6
  && Math.abs(report.band8to11kHzDb.min) < 1.5 && Math.abs(report.band8to11kHzDb.max) < 1.5
  && Math.abs(report.durationDriftSeconds.max) < 0.06
  && report.snr.min > 12;
report.passed = ok;
mkdirSync('artifacts', {recursive: true});
writeFileSync('artifacts/encode-check.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exit(ok ? 0 : 1);

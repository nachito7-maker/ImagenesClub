// Encodes the 100 WAV masters to Ogg/Opus, which is what the app actually ships.
//
// Why Opus: the masters are 358 MB of 16-bit PCM. Opus at 28 kbps mono keeps everything the
// synthesis produces (the material is band-limited to 11 kHz, well inside Opus' range) and brings
// the bundle down by more than an order of magnitude. Browsers and Android WebView decode Ogg/Opus
// natively, so decodeAudioData needs no extra decoder.
//
// Run after tools/generate-catalog.mjs: node tools/encode-music.mjs
import {spawn} from 'node:child_process';
import {readdirSync, mkdirSync, statSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import ffmpegPath from 'ffmpeg-static';

const MASTERS = 'artifacts/masters';
const OUT = 'public/assets/music';
// 28 kbps mono at 24 kHz: the masters are 22 050 Hz, so 24 kHz covers their whole band (up to
// 12 kHz) and no bit is wasted encoding silence above it. 40 kbps at 48 kHz sounds no better here
// and costs almost twice the size; 20 kbps starts to smear the cymbals.
// Override for experiments: MUSIC_BITRATE=20k node tools/encode-music.mjs
export const BITRATE = process.env.MUSIC_BITRATE ?? '28k';
export const SAMPLE_RATE = '24000';
const JOBS = 4;

/** Encodes one master. VBR keeps the quiet passages cheap and spends bits on the choruses. */
function encode(input, output) {
  return new Promise((resolve, reject) => {
    const args = [
      '-hide_banner', '-loglevel', 'error', '-y',
      '-i', input,
      '-c:a', 'libopus', '-b:a', BITRATE, '-vbr', 'on', '-compression_level', '10',
      '-application', 'audio', '-ac', '1', '-ar', SAMPLE_RATE,
      output
    ];
    const child = spawn(ffmpegPath, args, {stdio: ['ignore', 'ignore', 'pipe']});
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`${input}: ${stderr.trim()}`)));
  });
}

if (!existsSync(MASTERS)) {
  console.error(`No hay masters en ${MASTERS}. Ejecuta antes: node tools/generate-catalog.mjs`);
  process.exit(1);
}
mkdirSync(OUT, {recursive: true});
const masters = readdirSync(MASTERS).filter(name => name.endsWith('.wav')).sort();
if (masters.length !== 100) {
  console.error(`Se esperaban 100 masters y hay ${masters.length}. Regenera el catálogo.`);
  process.exit(1);
}

let next = 0;
let done = 0;
const started = Date.now();
async function worker() {
  while (next < masters.length) {
    const name = masters[next++];
    const output = join(OUT, name.replace(/\.wav$/, '.ogg'));
    await encode(join(MASTERS, name), output);
    done++;
    if (done % 20 === 0) process.stdout.write(`${done}/100 temas codificados\n`);
  }
}
await Promise.all(Array.from({length: JOBS}, worker));

let total = 0;
for (const name of masters) total += statSync(join(OUT, name.replace(/\.wav$/, '.ogg'))).size;
const seconds = (Date.now() - started) / 1000;
console.log(`\n100 temas en Ogg/Opus (${BITRATE} mono, ${Number(SAMPLE_RATE) / 1000} kHz): ${(total / 1048576).toFixed(1)} MB en ${seconds.toFixed(0)} s`);
console.log(`media ${(total / masters.length / 1024).toFixed(0)} kB por tema`);

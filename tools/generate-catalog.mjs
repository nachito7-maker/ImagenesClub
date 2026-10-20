// Generates 100 original, CC0 instrumental tracks for Imágenes Club.
// Everything is synthesized note by note: no samples, lyrics or third-party melodies.
// Run: node tools/generate-catalog.mjs
import {writeFileSync, mkdirSync} from 'node:fs';
import {join} from 'node:path';

// Masters stay out of the app bundle: the build ships Opus (see tools/encode-music.mjs), and the
// WAV masters are only what the encoder and the variety analyser read.
const MASTERS = 'artifacts/masters';
const OUT = 'public/assets/music';
const RATE = 22050;
const TAU = Math.PI * 2;
const SEED = 20240611;

// ---------- catalogue metadata (matches the styles used in src/core/music.ts) ----------
const STYLES_BY_REGION = {
  Valencia: ['Rock de guitarras', 'Riff valenciano', 'Coros de barrio', 'Rock de verbena', 'Rock con órgano'],
  'España': ['Pop-rock', 'Pop con cuerdas', 'Power pop', 'Rock urbano', 'Pop mediterráneo'],
  Internacional: ['Synth-pop', 'New wave', 'Disco-rock', 'Indie eléctrico']
};
const regions = [];
for (const [region, styles] of Object.entries(STYLES_BY_REGION)) {
  const count = region === 'Valencia' ? 21 : region === 'España' ? 60 : 19;
  for (let i = 0; i < count; i++) {
    const style = styles[i % styles.length];
    const base = region === 'Valencia' ? 112 + (i * 5) % 27 : region === 'España' ? 100 + (i * 4) % 33 : 108 + (i * 3) % 19;
    regions.push({region, style, base});
  }
}

// ---------- song forms ----------
// Every form is a different order and length of sections. 20 forms keep the 100 tracks from
// sharing one skeleton, and the chorus is always the loudest part so the DJ mix still works.
const STRUCTURES = {
  classic: [['intro', 4], ['verse', 8], ['verse', 8], ['chorus', 8], ['bridge', 4], ['chorus', 8], ['outro', 2]],
  short: [['intro', 2], ['verse', 8], ['chorus', 8], ['verse', 8], ['chorus', 8], ['outro', 2]],
  long: [['intro', 4], ['verse', 8], ['verse', 8], ['chorus', 8], ['solo', 8], ['chorus', 8], ['outro', 4]],
  double: [['intro', 4], ['verse', 8], ['chorus', 8], ['verse', 8], ['chorus', 8], ['chorus', 8], ['outro', 2]],
  anthem: [['intro', 4], ['verse', 8], ['chorus', 8], ['break', 4], ['chorus', 8], ['outro', 2]],
  ballad: [['intro', 4], ['verse', 8], ['chorus', 8], ['verse', 8], ['chorus', 8], ['outro', 4]],
  build: [['intro', 4], ['verse', 8], ['chorus', 8], ['break', 4], ['solo', 8], ['chorus', 8], ['outro', 2]],
  // Added forms: pre-choruses, tags, refrains that start the song, and a few odd metres.
  rise: [['intro', 2], ['verse', 8], ['pre', 4], ['chorus', 8], ['verse', 8], ['pre', 4], ['chorus', 8], ['outro', 2]],
  hookfirst: [['intro', 2], ['chorus', 8], ['verse', 8], ['chorus', 8], ['bridge', 4], ['chorus', 8], ['outro', 2]],
  tag: [['intro', 4], ['verse', 8], ['chorus', 8], ['verse', 8], ['chorus', 8], ['tag', 4], ['chorus', 8], ['outro', 2]],
  strip: [['intro', 2], ['verse', 4], ['break', 2], ['chorus', 8], ['verse', 8], ['chorus', 8], ['outro', 2]],
  vamp: [['intro', 4], ['verse', 8], ['chorus', 8], ['solo', 8], ['chorus', 8], ['chorus', 4], ['outro', 4]],
  three: [['intro', 4], ['verse', 8], ['verse', 8], ['chorus', 8], ['chorus', 8], ['outro', 2]],
  singalong: [['intro', 4], ['verse', 8], ['chorus', 8], ['chorus', 8], ['verse', 8], ['chorus', 8], ['outro', 2]],
  slowburn: [['intro', 4], ['verse', 8], ['verse', 8], ['pre', 4], ['chorus', 8], ['solo', 8], ['chorus', 8], ['outro', 4]],
  mini: [['intro', 2], ['verse', 6], ['chorus', 6], ['verse', 6], ['chorus', 6], ['outro', 4]],
  midtempo: [['intro', 4], ['verse', 8], ['chorus', 8], ['break', 4], ['verse', 8], ['chorus', 8], ['outro', 4]],
  punc: [['intro', 2], ['verse', 8], ['pre', 4], ['chorus', 8], ['verse', 8], ['pre', 4], ['chorus', 8], ['chorus', 4], ['outro', 2]],
  coda: [['intro', 4], ['verse', 8], ['chorus', 8], ['verse', 8], ['chorus', 8], ['solo', 4], ['outro', 4]],
  opener: [['intro', 8], ['verse', 8], ['chorus', 8], ['verse', 8], ['chorus', 8], ['outro', 2]],
  shouty: [['intro', 4], ['verse', 8], ['chorus', 4], ['verse', 8], ['break', 2], ['chorus', 4], ['outro', 4]],
  odd: [['intro', 5], ['verse', 6], ['chorus', 8], ['verse', 6], ['chorus', 6], ['outro', 3]],
  closer: [['intro', 4], ['verse', 8], ['pre', 4], ['chorus', 8], ['solo', 8], ['chorus', 8], ['tag', 4], ['outro', 4]],
  radio: [['intro', 2], ['verse', 8], ['chorus', 8], ['verse', 8], ['chorus', 8], ['outro', 4]]
};
const STRUCTURE_KEYS = Object.keys(STRUCTURES);

// ---------- arrangements ----------
// One arrangement per track: 100 of them, none repeated. An arrangement names the instruments that
// play, who comps the chords, how the bass walks, the drum groove, the lead voice, the intro and the
// chorus lift, plus small mixing decisions (drum machine vs kit, lead octave, chorus tag).
const PAT = {
  // comping styles
  palm: {hex: 'x.x.x.x.', gain: 0.10, decay: 6, bright: 0.35},
  open: {hex: 'x...x...', gain: 0.09, decay: 1.5, bright: 0.6},
  skank: {hex: '..x...x.', gain: 0.10, decay: 5, bright: 0.5},
  stabs: {hex: 'x..x..x.', gain: 0.09, decay: 3, bright: 0.55},
  arp8: {hex: 'xoxoxoxo', gain: 0.07, decay: 4, bright: 0.8},
  arp16: {hex: 'xoxoxoxoxoxoxoxo', gain: 0.05, decay: 5, bright: 0.9},
  organHalf: {hex: 'x.......x.......', gain: 0.09, decay: 1, bright: 0.4},
  organPush: {hex: 'x.xxx.xx.x.x.x.x', gain: 0.08, decay: 1, bright: 0.4},
  tink: {hex: 'x...x.x...x.x...', gain: 0.07, decay: 1, bright: 0.4},
  hold: {hex: 'x...............', gain: 0.07, decay: 0.7, bright: 0.3},
  pianoOff: {hex: '..x...x...x...x.', gain: 0.06, decay: 1, bright: 0.4},
  synthBlips: {hex: 'x..x..x.x..x..x.', gain: 0.05, decay: 2, bright: 0.7}
};
// What the band plays under the intro: a lone riff, a fingerpicked arpeggio, drums, a pad, a bass
// walk or the full band with the lead muted.
const INTRO_ROLES = {
  pickup: {drums: false, lead: false, bass: false, comp: 0.5},
  arpeggio: {drums: false, lead: false, bass: false, comp: 1},
  riff: {drums: false, lead: true, bass: false, comp: 0.7},
  drums: {drums: true, lead: false, bass: false, comp: 0},
  pad: {drums: false, lead: false, bass: false, comp: 0},
  bass: {drums: false, lead: false, bass: true, comp: 0},
  organ: {drums: false, lead: false, bass: false, comp: 1},
  stabs: {drums: false, lead: true, bass: false, comp: 1}
};
const BASS = {
  roots: [['x.......', 'x...x...', 'x.......', 'x...x...'], [0, 0, 0, 0]],
  eighths: [['xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx'], [0, 0, 7, 0]],
  drive: [['xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxx.x'], [0, 0, 0, 12]],
  walk: [['x...x...', 'x...x...', 'x...x...', 'x...x...'], [0, 4, 7, 5]],
  octave: [['x.x.x.x.', 'x.x.x.x.', 'x.x.x.x.', 'x.x.x.x.'], [0, 12, 0, 12]],
  pulse: [['xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx', 'xxxxxxxx'], [0, 0, 0, 0]],
  funk: [['x.xx..x.', 'x..x.xx.', 'x.xx..x.', 'x.x..x.x'], [0, 0, 12, 0]],
  busy: [['x.xxx.xx', 'x.xxx.xx', 'x.xxx.xx', 'x.xxx.xx'], [0, 0, 7, 12]],
  walking4: [['x...x...', 'x...x...', 'x...x...', 'x...x...'], [0, 2, 4, 5]],
  dotted: [['x...x...', 'x..x....', 'x...x...', 'x..x..x.'], [0, 0, 7, 0]],
  riffy: [['x.x.x...', 'x.x.x...', 'x.x.x.x.', 'x.x.x...'], [0, 0, 3, 0]],
  offbeat: [['.x.x.x.x', '.x.x.x.x', '.x.x.x.x', '.x.x.x.x'], [0, 0, 0, 0]]
};
// Drum grooves: kick/snare positions inside a bar plus how much the hats and ghost notes play.
const GROOVES = {
  power: {kick: [0, 2], snare: [1, 3], ghost: 0.25, hats: 'eighths'},
  backbeat: {kick: [0, 2.5], snare: [1, 3], ghost: 0.2, hats: 'eighths'},
  halftime: {kick: [0, 2.5], snare: [2], ghost: 0.12, hats: 'quarters'},
  half: {kick: [0, 3], snare: [2], ghost: 0.1, hats: 'quarters'},
  punk: {kick: [0, 1, 2, 3], snare: [1, 3], ghost: 0, hats: 'eighths'},
  shuffle: {kick: [0, 2], snare: [1, 3], ghost: 0.35, hats: 'shuffle'},
  dance: {kick: [0, 1, 2, 3], snare: [1, 3], ghost: 0.2, hats: 'sixteenths'},
  fourfloor: {kick: [0, 1, 2, 3], snare: [], ghost: 0, hats: 'sixteenths'},
  ska: {kick: [0, 2], snare: [1, 3], ghost: 0, hats: 'offbeat'},
  motown: {kick: [0, 1.5], snare: [1, 3], ghost: 0.4, hats: 'eighths'},
  boogie: {kick: [0, 2], snare: [1, 3], ghost: 0.2, hats: 'shuffle'},
  bossa: {kick: [0, 2], snare: [1.5, 3], ghost: 0.3, hats: 'sixteenths'},
  garage: {kick: [0, 2, 3.5], snare: [1, 3], ghost: 0.15, hats: 'eighths'},
  gallop: {kick: [0, 0.75, 1.5, 2, 2.75, 3.5], snare: [1, 3], ghost: 0, hats: 'eighths'},
  breakbeat: {kick: [0, 1.75, 2.5], snare: [1, 3, 3.75], ghost: 0.05, hats: 'sixteenths'}
};
const LEADS = ['pluck', 'hook', 'anthem', 'stab', 'square', 'sawlead', 'bell', 'flute', 'reed', 'mute'];

/** Cycles a list so twenty consecutive tracks never start from the same corner. */
const rot = (list, i) => list[i % list.length];
const voiceStack = (track) => Math.min(-4, -1 - (track % 4));

const REGION_POOL = {
  Valencia: ['rhythm', 'lead', 'bass', 'drums', 'hats', 'organ', 'brass', 'strings', 'piano', 'tambourine', 'voices', 'clap', 'counter', 'bell', 'shaker', 'pad', 'crash', 'toms', 'harmonica', 'arp', 'mutedTrumpet', 'jazzGuitar', 'ePiano', 'ride'],
  'España': ['rhythm', 'lead', 'bass', 'drums', 'hats', 'strings', 'piano', 'brass', 'voices', 'shaker', 'tambourine', 'clap', 'counter', 'xylophone', 'crash', 'pad', 'mute', 'toms', 'ride', 'arp', 'bell', 'ePiano', 'mutedTrumpet', 'flute'],
  Internacional: ['plucked', 'bassSynth', 'drums', 'hats', 'pad', 'square', 'glide', 'arpeggio', 'strings', 'bell', 'sawlead', 'shaker', 'clap', 'counter', 'organ', 'guitar', 'ride', 'toms', 'brass', 'flute', 'crash', 'ePiano', 'reed', 'xylophone', 'mutedTrumpet']
};

/** Deals a song form to every track. The style of each track is already fixed by the catalogue
 *  (regions[i].style), so the dealer only has to avoid two things: giving a form to the same style
 *  twice, and giving the same form to two tracks in a row. It is deterministic — the perfect
 *  matching is found by greedy assignment plus a backtracking repair pass. */
function dealForms() {
  const used = new Map(STRUCTURE_KEYS.map(form => [form, 0]));
  const taken = new Set();
  const forms = [];
  for (let i = 0; i < 100; i++) {
    const style = regions[i].style;
    const previous = forms[i - 1];
    // Least-used forms first, then the first that is legal: that keeps all 24 forms in play.
    const candidates = STRUCTURE_KEYS
      .filter(form => form !== previous && !taken.has(`${style}|${form}`))
      .sort((a, b) => used.get(a) - used.get(b) || STRUCTURE_KEYS.indexOf(a) - STRUCTURE_KEYS.indexOf(b));
    if (!candidates.length) throw new Error(`Sin forma disponible para ${style} en el tema ${i + 1}`);
    const form = candidates[0];
    forms.push(form);
    used.set(form, used.get(form) + 1);
    taken.add(`${style}|${form}`);
  }
  return forms;
}

function buildArrangements() {
  const out = [];
  const styles = Object.keys(STYLES_BY_REGION).flatMap(region => STYLES_BY_REGION[region]);
  // 100 distinct recipes. The 24 forms and 14 styles add up to 336 combinations and the deck holds
  // 100 cards, so every track gets its own pairing of form and style.
  const formOrder = dealForms();
  const styleOrder = regions.map(meta => meta.style);
  const grooveKeys = Object.keys(GROOVES);
  const rhythms = ['palm', 'open', 'skank', 'stabs', 'arp8', 'organHalf', 'tink', 'arp16', 'organPush', 'hold', 'pianoOff', 'synthBlips'];
  const bassKeys = ['roots', 'eighths', 'drive', 'walk', 'octave', 'pulse', 'funk', 'busy', 'walking4', 'dotted', 'riffy', 'offbeat'];
  const intros = Object.keys(INTRO_ROLES);
  const lifts = ['voices', 'brass', 'arp', 'shimmer', 'bell', 'strings', 'organ', 'clap', 'xylophone', 'counter'];
  for (let i = 0; i < 100; i++) {
    const style = styleOrder[i];
    const region = regions[i].region;
    const pool = REGION_POOL[region];
    const block = Math.floor(i / 20);
    const arr = {
      id: `arr-${String(i + 1).padStart(3, '0')}`,
      style,
      structure: formOrder[i],
      groove: grooveKeys[(Math.floor(i / 20) + (i % 20)) % grooveKeys.length],
      lead: LEADS[(Math.floor(i / 20) * 3 + (i % 20) * 2) % LEADS.length],
      rhythm: rhythms[(i * 3 + block) % rhythms.length],
      bassStyle: bassKeys[(i * 5 + block * 2) % bassKeys.length],
      intro: intros[(i * 5 + block * 3) % intros.length],
      lift: lifts[(i * 7 + block) % lifts.length],
      kit: (i + block) % 5 === 0 ? 'machine' : 'acoustic',
      octaveShift: [0, 0, 12, 0, -12, 0, 12, 0, 5][(i * 3 + block) % 9],
      swing: [0, 0, 0.06, 0, 0.1, 0][(i + block) % 6],
      chorusTag: i % 25 === 3,
      halves: i % 12 === 5,
      mix: {lead: 0.15, rhythm: 0.11, counter: 0, arp: 0, voices: 0, brass: 0, shimmer: 0, bell: 0}
    };
    const take = (name) => pool.includes(name);
    const inst = new Set(['bass', 'drums']);
    inst.add(arr.rhythm === 'tink' ? 'piano' : arr.rhythm.startsWith('organ') ? 'organ' : 'rhythm');
    // A second, gently played layer: strummed guitar in the bands, a synth line in the electronic
    // ones. Same role everywhere, completely different sound per region.
    if (region === 'Internacional') inst.add(i % 3 === 0 ? 'plucked' : 'sawlead');
    else inst.add(i % 3 === 0 ? 'guitar' : 'muted');
    for (const name of ['pad', 'strings', 'arp', 'bell', 'mute', 'organ', 'counter', 'xylophone', 'tambourine', 'shaker', 'clap', 'ride', 'toms', 'crash', 'harmonica', 'flute', 'sawlead', 'ePiano', 'jazzGuitar', 'mutedTrumpet', 'square', 'glide', 'guitar', 'plucked', 'bassSynth', 'reed']) {
      if (!take(name)) continue;
      inst.add(name === 'arp' ? 'arpeggio' : name);
    }
    if (take('voices') || arr.lift === 'voices') inst.add('voices');
    if (take('brass') || arr.lift === 'brass') inst.add('brass');
    arr.inst = [...inst];
    // Two extra colours from the region's pool keep every line-up unique.
    for (const extra of [pool[(i * 3 + 5) % pool.length], pool[(i * 7 + 11) % pool.length]]) {
      if (!arr.inst.includes(extra)) arr.inst.push(extra);
    }
    arr.mix.lead = 0.13 + ((i * 3) % 5) * 0.012;
    arr.mix.rhythm = 0.09 + ((i * 7) % 5) * 0.008;
    if (arr.lift === 'voices') arr.mix.voices = 0.06 + (i % 3) * 0.015;
    if (arr.lift === 'brass') arr.mix.brass = 0.07 + (i % 4) * 0.012;
    if (arr.lift === 'arp') arr.mix.arp = 0.05 + (i % 3) * 0.015;
    if (arr.lift === 'shimmer') arr.mix.shimmer = 0.04 + (i % 3) * 0.01;
    if (arr.lift === 'bell') arr.mix.bell = 0.05;
    if (arr.inst.includes('counter')) arr.mix.counter = 0.07 + (i % 3) * 0.012;
    arr.voicesOctave = voiceStack(i);
    out.push(arr);
  }
  return out;
}
const ARRANGEMENTS = buildArrangements();

// ---------- harmony ----------
const CHORDS = {
  i: [0, 3, 7], ii: [2, 3, 7], iii: [4, 3, 7], III: [3, 4, 7], iv: [5, 3, 7], v: [7, 3, 7], V: [7, 4, 7],
  VI: [8, 4, 7], VII: [10, 4, 7], I: [0, 4, 7], IV: [5, 4, 7], vi: [9, 3, 7], bVII: [10, 4, 7],
  bVI: [8, 4, 7], bIII: [3, 4, 7]
};
// 20 minor-colour and 20 major progressions: more colours than songs, so no two tracks repeat one.
const PROGRESSIONS_MINOR = [
  ['i', 'VI', 'III', 'VII'], ['i', 'iv', 'VI', 'V'], ['i', 'VII', 'VI', 'VII'],
  ['i', 'III', 'iv', 'v'], ['i', 'bVI', 'bIII', 'bVII'], ['i', 'v', 'iv', 'i'],
  ['i', 'bVII', 'bVI', 'V'], ['i', 'iv', 'bVII', 'III'], ['i', 'VI', 'iv', 'v'],
  ['i', 'III', 'VII', 'iv'], ['i', 'bIII', 'bVII', 'iv'], ['i', 'v', 'VI', 'iv'],
  ['i', 'iv', 'i', 'VI'], ['i', 'VII', 'bVI', 'V'], ['i', 'bVI', 'iv', 'i'],
  ['i', 'III', 'bVII', 'VI'], ['i', 'ii', 'v', 'i'], ['i', 'VI', 'VII', 'III'],
  ['i', 'iv', 'v', 'VI'], ['i', 'bVII', 'III', 'iv']
];
const PROGRESSIONS_MAJOR = [
  ['I', 'V', 'vi', 'IV'], ['I', 'IV', 'V', 'IV'], ['I', 'vi', 'IV', 'V'], ['IV', 'I', 'V', 'vi'],
  ['I', 'iii', 'IV', 'V'], ['vi', 'IV', 'I', 'V'], ['I', 'IV', 'vi', 'V'], ['I', 'V', 'IV', 'I'],
  ['IV', 'V', 'I', 'vi'], ['I', 'vi', 'ii', 'V'], ['vi', 'V', 'IV', 'I'], ['I', 'bVII', 'IV', 'I'],
  ['I', 'IV', 'V', 'vi'], ['IV', 'vi', 'I', 'V'], ['I', 'ii', 'IV', 'V'], ['vi', 'I', 'V', 'IV'],
  ['I', 'V', 'vi', 'iii'], ['IV', 'I', 'vi', 'V'], ['I', 'iii', 'vi', 'IV'], ['V', 'IV', 'I', 'I']
];
const SCALES = {minor: [0, 2, 3, 5, 7, 8, 10], major: [0, 2, 4, 5, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10], mixolydian: [0, 2, 4, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], pentatonic: [0, 3, 5, 7, 10]};

// ---------- deterministic noise ----------
let seedState = SEED;
function rand() {
  seedState ^= seedState << 13; seedState >>>= 0;
  seedState ^= seedState >>> 17;
  seedState ^= seedState << 5; seedState >>>= 0;
  return seedState / 4294967296;
}
function resetSeed(n) { seedState = (SEED ^ Math.imul(n + 1, 2654435761)) >>> 0 || 1; }
const pick = (list) => list[Math.floor(rand() * list.length) % list.length];
const chance = (p) => rand() < p;
const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

// ---------- instruments ----------
function envelope(len, attack, release, curve = 1) {
  const out = new Float32Array(len);
  const a = Math.max(1, attack * RATE | 0), r = Math.max(1, release * RATE | 0);
  for (let i = 0; i < len; i++) {
    let g = 1;
    if (i < a) g = i / a;
    else if (i > len - r) g = Math.max(0, (len - i) / r);
    out[i] = Math.pow(g, curve);
  }
  return out;
}

/** Bandlimited-ish pluck: a few harmonics with a fast decay. */
function pluck(buf, start, midiNote, dur, gain, {decay = 2.6, bright = 0.5, harmonics = 4} = {}) {
  const f = freq(midiNote);
  const len = Math.min(buf.length - start, Math.ceil(dur * RATE));
  if (len <= 0) return;
  const env = envelope(len, 0.004, 0.02);
  for (let i = 0; i < len; i++) {
    const t = i / RATE, fade = Math.exp(-decay * t);
    let v = Math.sin(TAU * f * t);
    for (let h = 2; h <= harmonics; h++) v += (bright / h) * Math.sin(TAU * f * h * t);
    buf[start + i] += v * env[i] * fade * gain;
  }
}

/** Two-detuned saws through a falling one-pole filter: keys, strings, synths. */
function saw(buf, start, midiNote, dur, gain, {detune = 0.004, cutoff = 0.4, cutoffEnv = 0.5, attack = 0.01, release = 0.06, vibrato = 0} = {}) {
  const f = freq(midiNote);
  const len = Math.min(buf.length - start, Math.ceil(dur * RATE));
  if (len <= 0) return;
  const env = envelope(len, attack, release);
  const f2 = f * (1 + detune);
  let lp1 = 0, lp2 = 0;
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    const c = Math.min(0.9, cutoff + cutoffEnv * Math.exp(-5 * t));
    const vib = vibrato ? 1 + vibrato * Math.sin(TAU * 5.2 * t) : 1;
    const raw = (2 * ((t * f * vib) % 1) - 1) + 0.7 * (2 * ((t * f2 * vib) % 1) - 1);
    lp1 += (raw - lp1) * c; lp2 += (lp1 - lp2) * c;
    buf[start + i] += lp2 * env[i] * gain;
  }
}

/** Fat pad: stacked sines, slow attack. */
function pad(buf, start, notes, dur, gain, attack = 0.08) {
  const len = Math.min(buf.length - start, Math.ceil(dur * RATE));
  if (len <= 0) return;
  const env = envelope(len, attack, Math.min(0.3, dur / 3));
  for (const n of notes) {
    const f = freq(n);
    for (let i = 0; i < len; i++) {
      const t = i / RATE;
      buf[start + i] += (Math.sin(TAU * f * t) * 0.5 + Math.sin(TAU * f * 1.003 * t) * 0.35 + Math.sin(TAU * f * 0.5 * t) * 0.18) * env[i] * gain;
    }
  }
}

/** Zero-mean pulse: a square wave with duty != 0.5 carries DC, which eats headroom and makes the
 *  encoded file measure quieter than the master. Subtracting the pulse's own average fixes it. */
const pulse = (phase, duty) => (phase < duty ? 1 : -1) - (2 * duty - 1);

/** Square-wave lead with a short pitch glide: classic synth-pop. */
function square(buf, start, midiNote, dur, gain, {glide = 0, duty = 0.5} = {}) {
  const len = Math.min(buf.length - start, Math.ceil(dur * RATE));
  if (len <= 0) return;
  const env = envelope(len, 0.008, 0.04);
  const f = freq(midiNote);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    const ff = f * (1 + glide * Math.exp(-18 * t));
    phase += ff / RATE;
    const p = phase % 1;
    buf[start + i] += pulse(p, duty) * env[i] * gain;
  }
}

/** Detuned pulse bass, the backbone of the electronic tracks. */
function bassSynth(buf, start, midiNote, dur, gain) {
  const f = freq(midiNote);
  const len = Math.min(buf.length - start, Math.ceil(dur * RATE));
  if (len <= 0) return;
  const env = envelope(len, 0.004, 0.03);
  let lp = 0;
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    const raw = (2 * ((t * f) % 1) - 1) + 0.6 * (2 * ((t * f * 1.006) % 1) - 1);
    lp += (raw - lp) * 0.18;
    buf[start + i] += lp * env[i] * Math.exp(-1.4 * t) * gain;
  }
}

/** Arpeggio/plucked-string tone: bright, short, good for sixteenth patterns. */
function arpeggio(buf, start, midiNote, dur, gain) {
  pluck(buf, start, midiNote, dur, gain, {decay: 7, bright: 0.9, harmonics: 6});
}

/** Organ: sustained drawbars with vibrato. */
function organ(buf, start, midiNote, dur, gain) {
  const f = freq(midiNote);
  const len = Math.min(buf.length - start, Math.ceil(dur * RATE));
  if (len <= 0) return;
  const env = envelope(len, 0.02, 0.08);
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    const vib = 1 + 0.004 * Math.sin(TAU * 5.5 * t);
    const v = Math.sin(TAU * f * vib * t) + 0.6 * Math.sin(TAU * f * 2 * vib * t) + 0.25 * Math.sin(TAU * f * 3 * t);
    buf[start + i] += v * env[i] * gain * 0.6;
  }
}

/** Piano-like tone for ballads and choruses. */
function piano(buf, start, midiNote, dur, gain) {
  const f = freq(midiNote);
  const len = Math.min(buf.length - start, Math.ceil(dur * RATE));
  if (len <= 0) return;
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    const env = Math.exp(-1.6 * t) * (1 - Math.exp(-400 * t));
    const v = Math.sin(TAU * f * t) + 0.4 * Math.sin(TAU * f * 2 * t) + 0.2 * Math.sin(TAU * f * 3 * t) + 0.1 * Math.sin(TAU * f * 4 * t);
    buf[start + i] += v * env * gain;
  }
}

/** String ensemble: stacked saws with slow attack. */
function strings(buf, start, notes, dur, gain) {
  for (const n of notes) saw(buf, start, n, dur, gain, {detune: 0.008, cutoff: 0.14, cutoffEnv: 0.1, attack: 0.14, release: 0.22});
}

/** Short brass-like stab. */
function brass(buf, start, notes, dur, gain) {
  for (const n of notes) saw(buf, start, n, dur, gain, {detune: 0.003, cutoff: 0.16, cutoffEnv: 0.55, attack: 0.02, release: 0.05});
}

/** Leap: brass on the beat, one octave up. */
function brassLeap(buf, start, notes, dur, gain) {
  brass(buf, start, notes.map(n => n + 12), dur, gain);
}

/** Human "woah" choir: stacked vowels, only in choruses. */
function voices(buf, start, notes, dur, gain) {
  const len = Math.min(buf.length - start, Math.ceil(dur * RATE));
  if (len <= 0) return;
  const env = envelope(len, 0.12, 0.2);
  for (const n of notes) {
    const f = freq(n);
    for (let i = 0; i < len; i++) {
      const t = i / RATE;
      const wobble = 1 + 0.004 * Math.sin(TAU * 5 * t + f);
      const v = Math.sin(TAU * f * wobble * t) * 0.5 + Math.sin(TAU * f * 2 * wobble * t) * 0.18 + Math.sin(TAU * f * 3 * t) * 0.08;
      buf[start + i] += v * env[i] * gain;
    }
  }
}
const shimmer = (buf, start, notes, dur, gain) => voices(buf, start, notes.map(n => n + 12), dur, gain * 0.8);
const counter = (buf, start, midiNote, dur, gain) => pluck(buf, start, midiNote, dur, gain, {decay: 2.2, bright: 0.7});
const stringStabs = (buf, start, notes, dur, gain) => brass(buf, start, notes, dur, gain * 0.9);

/** Electric piano: sine with a short bell-like attack and slow tremolo. */
function ePiano(buf, start, midiNote, dur, gain) {
  const f = freq(midiNote);
  const len = Math.min(buf.length - start, Math.ceil(dur * RATE));
  if (len <= 0) return;
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    const env = Math.exp(-2.4 * t) * (1 - Math.exp(-260 * t)) * (1 + 0.12 * Math.sin(TAU * 4.5 * t));
    buf[start + i] += (Math.sin(TAU * f * t) + 0.12 * Math.sin(TAU * f * 4.01 * t) * Math.exp(-6 * t)) * env * gain;
  }
}

/** Muted trumpet: saw through a nasal formant with a spiky attack. */
function mutedTrumpet(buf, start, midiNote, dur, gain) {
  const f = freq(midiNote);
  const len = Math.min(buf.length - start, Math.ceil(dur * RATE));
  if (len <= 0) return;
  let p1 = 0, p2 = 0, p3 = 0;
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    const env = (1 - Math.exp(-60 * t)) * Math.exp(-2.2 * t) * (i > len - 200 ? (len - i) / 200 : 1);
    const vib = 1 + 0.006 * Math.sin(TAU * 5.8 * t) * Math.min(1, t * 3);
    const s = 2 * ((t * f * vib) % 1) - 1;
    p1 += (s - p1) * 0.35; p2 += (p1 - p2) * 0.25; p3 += (p2 - p3) * 0.5;
    buf[start + i] += (p2 - 0.6 * p3) * env * gain;
  }
}

/** Jazz guitar: soft rounded pluck with a hint of detuned body. */
function jazzGuitar(buf, start, midiNote, dur, gain) {
  const f = freq(midiNote);
  const len = Math.min(buf.length - start, Math.ceil(dur * RATE));
  if (len <= 0) return;
  let lp = 0;
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    const env = Math.exp(-2.8 * t) * (1 - Math.exp(-500 * t));
    const v = Math.sin(TAU * f * t) + 0.5 * Math.sin(TAU * f * 2 * t) + 0.15 * Math.sin(TAU * f * 3 * t) + 0.25 * Math.sin(TAU * f * 2.001 * t);
    lp += (v - lp) * 0.45;
    buf[start + i] += lp * env * gain;
  }
}

/** Bell / glockenspiel: inharmonic partials with long decay. */
function bell(buf, start, midiNote, dur, gain) {
  const f = freq(midiNote);
  const len = Math.min(buf.length - start, Math.ceil(Math.max(dur, 0.6) * RATE));
  if (len <= 0) return;
  const partials = [1, 2.76, 5.4, 8.93];
  const weights = [1, 0.42, 0.22, 0.11];
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    let v = 0;
    for (let h = 0; h < partials.length; h++) v += weights[h] * Math.sin(TAU * f * partials[h] * t) * Math.exp(-(2 + h * 2.6) * t);
    buf[start + i] += v * (1 - Math.exp(-400 * t)) * gain;
  }
}

/** Flute: breathy sine with vibrato and a soft attack. */
function flute(buf, start, midiNote, dur, gain) {
  const f = freq(midiNote);
  const len = Math.min(buf.length - start, Math.ceil(dur * RATE));
  if (len <= 0) return;
  let lp = 0;
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    const env = (1 - Math.exp(-30 * t)) * Math.min(1, (len - i) / (RATE * 0.08));
    const vib = 1 + 0.005 * Math.sin(TAU * 5.4 * t) * Math.min(1, t * 2);
    const tone = Math.sin(TAU * f * vib * t) + 0.18 * Math.sin(TAU * f * 2 * vib * t);
    const air = (rand() * 2 - 1) * 0.06;
    lp += (air - lp) * 0.5;
    buf[start + i] += (tone + lp) * env * gain;
  }
}

/** High notes lose level in every filtered voice, so the lead gets a small, bounded correction:
 *  an octave-up chorus stays at least as loud as the verse, which is the whole point of a chorus. */
const leadComp = (note) => Math.min(1.45, Math.pow(2, Math.max(0, note - 76) / 44));

/** Reed/organ solo voice: pulse wave with a formant scoop. */
function reed(buf, start, midiNote, dur, gain) {
  const f = freq(midiNote);
  const len = Math.min(buf.length - start, Math.ceil(dur * RATE));
  if (len <= 0) return;
  let lp = 0;
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    const env = (1 - Math.exp(-80 * t)) * (1 - Math.exp(-12 * t)) * Math.min(1, (len - i) / (RATE * 0.06));
    const vib = 1 + 0.005 * Math.sin(TAU * 5 * t);
    const p = (t * f * vib) % 1;
    const s = pulse(p, 0.28) + 0.3 * Math.sin(TAU * f * 2 * vib * t);
    // Two-pole-ish smoothing: 0.22 was so dark (~800 Hz) that a chorus written an octave up lost
    // half its level, making some themes quieter in the chorus than in the verse.
    lp += (s - lp) * 0.52;
    buf[start + i] += lp * env * gain;
  }
}

/** Muted (palm-muted) guitar: very short, dark, percussive. */
function muted(buf, start, midiNote, dur, gain) {
  pluck(buf, start, midiNote, Math.min(dur, 0.12), gain, {decay: 24, bright: 0.22, harmonics: 3});
}

/** Harmonica: two close reeds beating against each other. */
function harmonica(buf, start, midiNote, dur, gain) {
  const f = freq(midiNote);
  const len = Math.min(buf.length - start, Math.ceil(dur * RATE));
  if (len <= 0) return;
  let lp = 0;
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    const env = (1 - Math.exp(-90 * t)) * Math.exp(-0.9 * t) * Math.min(1, (len - i) / (RATE * 0.1));
    const s = (2 * ((t * f) % 1) - 1) * 0.7 + Math.sin(TAU * f * 1.008 * t) * 0.3;
    lp += (s - lp) * 0.3;
    buf[start + i] += lp * env * gain;
  }
}

/** Acid-style saw lead with resonant-ish sweep. */
function sawLead(buf, start, midiNote, dur, gain) {
  saw(buf, start, midiNote, dur, gain, {detune: 0.006, cutoff: 0.2, cutoffEnv: 0.7, attack: 0.006, release: 0.05, vibrato: 0.003});
}

/** Steel-pan / marimba hybrid: rounded pitch with a fast bloom. */
function xylophone(buf, start, midiNote, dur, gain) {
  const f = freq(midiNote);
  const len = Math.min(buf.length - start, Math.ceil(Math.max(dur, 0.35) * RATE));
  if (len <= 0) return;
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    const env = Math.exp(-7 * t) * (1 - Math.exp(-600 * t));
    const v = Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 4 * t) * Math.exp(-14 * t);
    buf[start + i] += v * env * gain;
  }
}

/** Guitars for the power pop / indie tracks: jangly chord tone. */
const guitar = (buf, start, midiNote, dur, gain) => pluck(buf, start, midiNote, dur, gain, {decay: 3.2, bright: 0.65, harmonics: 5});
const pluckedString = (buf, start, midiNote, dur, gain) => pluck(buf, start, midiNote, dur, gain, {decay: 4.5, bright: 0.8, harmonics: 6});

// ---------- drums ----------
function kick(buf, start, gain, {tone = 46, sweep = 150, decay = 7, click = 0} = {}) {
  const len = Math.min(buf.length - start, RATE * 0.34 | 0);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    phase += TAU * (tone + sweep * Math.exp(-28 * t)) / RATE;
    const body = Math.sin(phase) * Math.exp(-decay * t) * (1 - Math.exp(-300 * t));
    buf[start + i] += (body + (click ? (rand() * 2 - 1) * click * Math.exp(-400 * t) : 0)) * gain;
  }
}
function snare(buf, start, gain, {decay = 16, tone = 185, noise = 0.9} = {}) {
  const len = Math.min(buf.length - start, RATE * 0.24 | 0);
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    buf[start + i] += ((rand() * 2 - 1) * noise + Math.sin(TAU * tone * t) * 0.35) * Math.exp(-decay * t) * gain;
  }
}
function hat(buf, start, gain, open = false) {
  const len = Math.min(buf.length - start, Math.ceil(RATE * (open ? 0.18 : 0.055)));
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const n = rand() * 2 - 1, high = n - prev; prev = n;
    buf[start + i] += high * Math.exp(-(open ? 22 : 70) * (i / RATE)) * gain;
  }
}
function crash(buf, start, gain) {
  const len = Math.min(buf.length - start, RATE * 1.1 | 0);
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const n = rand() * 2 - 1, high = n - prev; prev = n;
    buf[start + i] += high * Math.exp(-3.4 * (i / RATE)) * gain;
  }
}
function ride(buf, start, gain) {
  const len = Math.min(buf.length - start, RATE * 0.5 | 0);
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const t = i / RATE, n = rand() * 2 - 1, high = n - prev; prev = n;
    buf[start + i] += (high * 0.5 + Math.sin(TAU * 3150 * t) * 0.25) * Math.exp(-9 * t) * gain;
  }
}
function tom(buf, start, gain, pitch = 110) {
  const len = Math.min(buf.length - start, RATE * 0.3 | 0);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / RATE;
    phase += TAU * (pitch + pitch * 0.6 * Math.exp(-24 * t)) / RATE;
    buf[start + i] += Math.sin(phase) * Math.exp(-11 * t) * (1 - Math.exp(-300 * t)) * gain;
  }
}
function tambourine(buf, start, gain) {
  const len = Math.min(buf.length - start, RATE * 0.12 | 0);
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const t = i / RATE, n = rand() * 2 - 1, high = n - prev; prev = n;
    buf[start + i] += high * Math.exp(-38 * t) * (1 + 0.5 * Math.sin(TAU * 90 * t)) * gain;
  }
}
function clap(buf, start, gain) {
  for (let k = 0; k < 3; k++) {
    const s = start + Math.round(k * 0.011 * RATE);
    const len = Math.min(buf.length - s, RATE * 0.09 | 0);
    for (let i = 0; i < len; i++) buf[s + i] += (rand() * 2 - 1) * Math.exp(-24 * (i / RATE)) * gain * (1 - k * 0.2);
  }
}
function shaker(buf, start, gain) {
  const len = Math.min(buf.length - start, RATE * 0.08 | 0);
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const n = rand() * 2 - 1, high = n - prev; prev = n;
    buf[start + i] += high * Math.exp(-52 * (i / RATE)) * gain;
  }
}
/** Drum machine: slightly different tuning, clickier kick and a dryer snare. */
function kitVoice(kit) {
  if (kit !== 'machine') return {kick: {}, snare: {}, hatGain: 1};
  return {kick: {tone: 52, sweep: 120, decay: 9, click: 0.18}, snare: {decay: 20, tone: 210, noise: 1}, hatGain: 1.15};
}

/** Drum grooves: kick/snare/hat patterns differ per style and each track picks one. */
function groove(buf, style, at, intensity, barIndex, beatSec, intro = false, kit = 'acoustic', swing = 0) {
  const g = GROOVES[style] ?? GROOVES.power;
  const sound = kitVoice(kit);
  const shift = (p) => (swing && p % 1 === 0.5 ? p + swing * 0.5 : p);
  const hit = (p) => at(barIndex, shift(p));
  for (const k of g.kick) kick(buf, hit(k), 0.40 * intensity, sound.kick);
  for (const s of g.snare) snare(buf, hit(s), 0.16 * intensity, sound.snare);
  if (g.ghost && chance(g.ghost)) snare(buf, hit(2.75), 0.07 * intensity, sound.snare);
  if (intro) return;
  const hatStep = g.hats === 'quarters' ? 1 : g.hats === 'sixteenths' ? 0.25 : 0.5;
  const accents = {quarters: 0.06, eighths: 0.05, sixteenths: 0.035, shuffle: 0.04, offbeat: 0.055}[g.hats] ?? 0.05;
  if (g.hats === 'offbeat') {
    for (let e = 0; e < 4; e++) hat(buf, hit(e + 0.5), accents * sound.hatGain);
  } else {
    for (let e = 0; e * hatStep < 4; e++) hat(buf, hit(e * hatStep), (e % (hatStep < 0.5 ? 4 : 2) ? accents * 0.6 : accents) * sound.hatGain);
  }
  if (kit === 'machine' || style === 'dance' || style === 'fourfloor') {
    clap(buf, hit(1), 0.08 * intensity);
    clap(buf, hit(3), 0.08 * intensity);
  }
  if (barIndex % 4 === 3 && intensity > 0.9) {
    // Fill on the last bar of each four: snare ghosts or a tom run, depending on the groove.
    if (style === 'fourfloor' || style === 'dance') for (let f = 0; f < 4; f++) snare(buf, hit(3 + f / 4), 0.09);
    else for (let f = 0; f < 3; f++) snare(buf, hit(3 + f / 3), 0.11);
  }
  if (barIndex % 8 === 7 && (style === 'boogie' || style === 'shuffle' || style === 'motown')) {
    for (let f = 0; f < 4; f++) tom(buf, hit(3 + f / 4), 0.12, 150 - f * 14);
  }
  void beatSec;
}

// ---------- mixing helpers ----------
function reverb(input, mix = 0.18) {
  const combs = [1487, 1789, 2111, 2381].map(delay => {
    const line = new Float32Array(delay);
    let idx = 0;
    return (x) => {
      const y = line[idx];
      const next = x + y * 0.72;
      // Guard: keep the feedback in a sane range so it can never overflow to Infinity/NaN.
      line[idx] = Number.isFinite(next) ? (next > 4 ? 4 : next < -4 ? -4 : next) : 0;
      idx = (idx + 1) % delay;
      return y;
    };
  });
  const out = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    let wet = 0;
    for (const c of combs) wet += c(input[i]);
    out[i] = input[i] * (1 - mix) + (wet / combs.length) * mix;
    if (!Number.isFinite(out[i])) out[i] = 0;
  }
  return out;
}
/** Equal perceived loudness across the catalogue: the mixer crossfades tracks. */
const TARGET_RMS = 0.10;
function normalise(buf) {
  // Headroom: the first limiter pass could clamp a track by up to ~2 dB, so aim slightly high.
  const target = TARGET_RMS * 1.12;
  let ss = 0;
  for (let i = 0; i < buf.length; i++) ss += buf[i] * buf[i];
  const k = target / (Math.sqrt(ss / buf.length) || 1);
  for (let i = 0; i < buf.length; i++) buf[i] *= k;
  return buf;
}
/** Reverb combs can drift out of float range on dense mixes; sweep any non-finite sample away
 *  (it would otherwise become a click in the WAV) before the mastering chain sees it. */
function sanitise(buf) {
  let fixed = 0;
  for (let i = 0; i < buf.length; i++) if (!Number.isFinite(buf[i])) { buf[i] = 0; fixed++; }
  return fixed;
}
/** Removes any DC offset (high-pass at ~20 Hz). Pulse waves, sine kicks and one-pole filters can
 *  leave a constant offset behind, which wastes headroom and is the first thing a lossy codec drops. */
function dcBlock(buf) {
  const a = Math.exp(-2 * Math.PI * 20 / RATE);
  let previousIn = 0, previousOut = 0;
  for (let i = 0; i < buf.length; i++) {
    const input = buf[i];
    previousOut = input - previousIn + a * previousOut;
    previousIn = input;
    buf[i] = previousOut;
  }
  return buf;
}
/** Soft clip: below the knee it is linear, above it peaks round off instead of flattening.
 *  -6 dBFS of knee is ~0.23 dB of loss at 0.5 and keeps the whole catalogue at one loudness. */
const SOFT_KNEE = 0.5;
function softClip(buf) {
 const range = 0.98 - SOFT_KNEE;
 for (let i = 0; i < buf.length; i++) {
  const x = buf[i], a = Math.abs(x);
  if (a > SOFT_KNEE) buf[i] = Math.sign(x) * (SOFT_KNEE + range * Math.tanh((a - SOFT_KNEE) / range));
 }
 return buf;
}

function limit(buf, ceiling = 0.92) {
  let peak = 0;
  for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i]));
  if (peak > ceiling) for (let i = 0; i < buf.length; i++) buf[i] *= ceiling / peak;
  return buf;
}
function wav(samples) {
  const bytes = samples.length * 2;
  const buffer = Buffer.alloc(44 + bytes);
  buffer.write('RIFF', 0); buffer.writeUInt32LE(36 + bytes, 4); buffer.write('WAVE', 8);
  buffer.write('fmt ', 12); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22); buffer.writeUInt32LE(RATE, 24); buffer.writeUInt32LE(RATE * 2, 28);
  buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36); buffer.writeUInt32LE(bytes, 40);
  for (let i = 0; i < samples.length; i++) buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  return buffer;
}

// ---------- melody construction ----------
const RHYTHMS = {
  quarters: [0, 1, 2, 3], eighths: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5],
  dotted: [0, 1.5, 2, 3], offbeat: [0.5, 1, 2, 3], syncopated: [0, 0.75, 1.5, 2.25, 3, 3.5],
  march: [0, 1, 1.5, 2.5, 3], gallop: [0, 0.75, 1, 2, 2.75, 3], spread: [0, 1.5, 2.5, 3.5], lifts: [0, 0.5, 2, 2.5]
};
const CONTOURS = {
  arch: [0, 1, 2, 1, 0, -1, 0, 1], rising: [0, 1, 1, 2, 2, 3, 3, 2], falling: [2, 1, 0, 0, -1, -1, -2, -2],
  wave: [0, 2, -1, 1, 2, 0, -2, 1], step: [0, 1, 0, -1, 0, 1, 0, -1],
  saw: [0, 1, 2, 3, -2, -1, 0, 1], valley: [2, 1, 0, -1, 1, 2, 1, 0], climb: [0, 0, 1, 2, 2, 3, 1, 0]
};
const RHYTHM_KEYS = Object.keys(RHYTHMS);
const CONTOUR_KEYS = Object.keys(CONTOURS);

/** A melody is a rhythm plus a contour around the chord tones, so each track has an identity. */
function melodyPlan(index) {
  return {
    rhythm: RHYTHM_KEYS[(index * 3) % RHYTHM_KEYS.length],
    contour: CONTOUR_KEYS[(index * 5) % CONTOUR_KEYS.length],
    motifBars: 2 + (index % 3)
  };
}

/** Up to half a bar of head start into the chorus, so 100 cuts do not all sit on the same grid. */
const seedOffset = (index) => (index % 12) * 0.18;

const LEVEL_BY_SECTION = {intro: 0.5, verse: 0.8, pre: 0.72, chorus: 1, bridge: 0.6, break: 0.55, solo: 0.9, tag: 0.95, outro: 0.45};

function buildSong(index, meta) {
  resetSeed(index);
  const arr = ARRANGEMENTS[index];
  const shape = STRUCTURES[arr.structure];
  const plan = melodyPlan(index);
  // Tempos come from the groove, the region and the length of the form, so the catalogue spans
  // 84-140 BPM instead of one narrow band: a boogie shuffles at 95, a punk short-form runs at 140.
  const totalShapeBars = shape.reduce((sum, [, bars]) => sum + bars, 0);
  const regionTempo = meta.region === 'Valencia' ? 4 : meta.region === 'España' ? 0 : -2;
  const formTempo = totalShapeBars > 56 ? -10 : totalShapeBars > 46 ? -4 : arr.structure === 'mini' ? 20 : 14;
  const baseBpm = meta.base - 8 + Math.round(rand() * 9) - 4 + regionTempo + formTempo;
  const bpm = Math.min(140, Math.max(84, baseBpm));
  const beat = 60 / bpm, bar = beat * 4;
  const key = (meta.region === 'Internacional' ? 57 : 50) + Math.floor(rand() * 7);
  const scaleName = meta.region === 'Valencia' ? pick(['minor', 'minor', 'dorian', 'mixolydian', 'phrygian'])
    : meta.style.startsWith('Pop') ? pick(['major', 'major', 'dorian', 'mixolydian'])
    : pick(['major', 'minor', 'dorian', 'mixolydian', 'phrygian']);
  const minorish = scaleName === 'minor' || scaleName === 'phrygian' || scaleName === 'dorian';
  const scale = SCALES[scaleName] ?? SCALES.minor;
  const progression = pick(minorish ? PROGRESSIONS_MINOR : PROGRESSIONS_MAJOR);
  const structure = arr.structure;

  // Section layout: bars are assigned to sections; every form keeps at least one chorus.
  let cursor = 0;
  const sections = shape.map(([name, bars]) => {
    const section = {name, from: cursor, to: cursor + bars};
    cursor += bars;
    return section;
  });
  const chorus = sections.find(s => s.name === 'chorus');
  const totalBars = cursor;
  const total = Math.ceil(totalBars * bar * RATE) + RATE * 2;
  const buf = new Float32Array(total);
  const at = (barIndex, beatIndex = 0) => Math.round((barIndex * 4 + beatIndex) * beat * RATE);
  const chordAt = (barIndex) => CHORDS[progression[barIndex % progression.length]];
  const tonesAt = (barIndex) => chordAt(barIndex).map(t => key + t);
  const chordRoot = (barIndex) => key - 12 + chordAt(barIndex)[0];
  const intro = INTRO_ROLES[arr.intro] ?? INTRO_ROLES.pickup;
  const leadUp = arr.lead !== 'stab';
  const leadWave = {pluck: pluck, hook: (b, s, n, d, g) => pluck(b, s, n, d * 1.3, g, {decay: 1.8, bright: 0.6}),
    anthem: (b, s, n, d, g) => pluck(b, s, n, d, g, {decay: 2.2, bright: 0.5}),
    stab: (b, s, n, d, g) => pluck(b, s, n, d, g, {decay: 8, bright: 0.5}),
    square, sawlead: sawLead, bell, flute, reed, mute: muted, muted: muted}[arr.lead] ?? pluck;
  const motif = Array.from({length: plan.motifBars * 2}, () => pick([-2, -1, -1, 0, 1, 1, 2]));
  let degree = Math.floor(rand() * scale.length);
  const bass = BASS[arr.bassStyle] ?? BASS.roots;
  const comp = PAT[arr.rhythm] ?? PAT.palm;
  const compVoice = arr.rhythm.startsWith('organ') || arr.rhythm === 'tink' ? organ
    : arr.rhythm === 'stabs' ? ((b, s, n, d, g) => pluck(b, s, n, d, g, {decay: 4, bright: 0.55}))
    : arr.rhythm === 'skank' ? ((b, s, n, d, g) => pluck(b, s, n, d, g, {decay: 5, bright: 0.5}))
    : (b, s, n, d, g) => pluck(b, s, n, d, g, {decay: comp.decay, bright: comp.bright});

  for (const section of sections) {
    const isChorus = section.name === 'chorus' || section.name === 'tag';
    const level = LEVEL_BY_SECTION[section.name] ?? 0.8;
    for (let b = section.from; b < section.to; b++) {
      const isBreak = section.name === 'break' || (section.name === 'bridge' && b % 2 === 0);
      const isLast = b === totalBars - 1;
      const tones = tonesAt(b);
      const root = chordRoot(b);
      const inSecondHalf = b >= Math.floor(totalBars / 2);
      const isIntro = section.name === 'intro';
      const drumsOn = !isBreak && (!isIntro || intro.drums);

      // Bass: pattern and note choices come from the arrangement, so the low end differs too.
      if ((!isIntro || intro.bass) && !isBreak) {
        const line = bass[0][b % 4];
        const offsets = bass[1];
        const sixteenth = line.length === 16;
        const step = sixteenth ? 0.25 : 0.5;
        const isSynthBass = arr.inst.includes('bassSynth') || arr.bassStyle === 'pulse';
        for (let e = 0; e * step < 4; e++) {
          if (line[e] !== 'x') continue;
          const note = root + offsets[(e + b) % offsets.length];
          const dur = beat * (sixteenth ? 0.22 : 0.44);
          if (isSynthBass) bassSynth(buf, at(b, e * step), note, dur, 0.15 * level);
          else pluck(buf, at(b, e * step), note, dur, 0.15 * level, {decay: 3.4, bright: 0.16, harmonics: 2});
        }
        // Halfway marker: half the catalogue drops the bass an octave in the second half.
        if (arr.halves && inSecondHalf && b % 8 === 0) pluck(buf, at(b), root - 12, beat * 1.8, 0.14 * level, {decay: 2.2, bright: 0.15, harmonics: 2});
      }

      // Comping: an explicit 16-step pattern per arrangement (palm mute, skank, arpeggio, organ...).
      const accent = isChorus ? 1 : level;
      // An intro can also be drums, bass, a pad or the lead alone: then the comp stays silent.
      const compOn = !isIntro || intro.comp > 0;
      for (let step = 0; compOn && step < comp.hex.length; step++) {
        const c = comp.hex[step];
        if (!c || c === '.') continue;
        if (isIntro && step % 4 === 2) continue;
        const pos = step * 0.25;
        const note = tones[(step + b) % tones.length];
        const dur = beat * (c === 'o' ? 0.22 : accent > 0.9 ? 0.42 : 0.8);
        const gain = comp.gain * accent * (isIntro ? intro.comp : 1);
        if (arr.rhythm === 'hold' || arr.rhythm.startsWith('organ')) organ(buf, at(b, pos), note, dur * 0.95, gain);
        else compVoice(buf, at(b, pos), note, dur, gain);
        if (c === 'o') compVoice(buf, at(b, pos + 0.125), note + 12, beat * 0.2, gain * 0.6);
      }
      // Sustained layers.
      if (arr.inst.includes('strings')) strings(buf, at(b), tones.map(t => t + 12), bar * 0.98, 0.033 * accent);
      if (arr.inst.includes('pad')) pad(buf, at(b), tones.map(t => t + 12), bar * 0.98, 0.03 * accent);
      if (arr.inst.includes('ePiano') && (isChorus || section.name === 'verse')) for (let q = 0; q < 4; q++) if (q % 2 === 0 || isChorus) ePiano(buf, at(b, q), tones[(q + b) % tones.length], beat * 0.9, 0.05 * accent);
      if (arr.inst.includes('jazzGuitar')) for (let q = 0; q < 4; q++) jazzGuitar(buf, at(b, q + 0.5), tones[(q + b) % tones.length], beat * 0.45, 0.06 * accent);
      if (arr.inst.includes('arpeggio') && section.name !== 'outro') for (let e = 0; e < 8; e++) arpeggio(buf, at(b, e / 2), tones[(e * 2 + b) % tones.length] + 12, beat * 0.4, 0.05 * accent);
      if (arr.inst.includes('muted') && !isBreak) for (let e = 0; e < 8; e++) muted(buf, at(b, e / 2 + (arr.swing * 0.5)), tones[(e + b) % tones.length], beat * 0.2, 0.05 * accent);
      if (arr.inst.includes('guitar') && !isChorus) for (let e = 0; e < 4; e++) guitar(buf, at(b, e + 0.5), tones[(e + b) % tones.length] + 12, beat * 0.4, 0.04 * accent);
      if (arr.inst.includes('plucked') && isChorus) for (let e = 0; e < 8; e++) pluckedString(buf, at(b, e / 2), tones[(e * 2 + b) % tones.length] + 12, beat * 0.35, 0.035);

      if (drumsOn) groove(buf, arr.groove, at, isChorus ? 1 : 0.72 * level, b, beat, section.name === 'intro', arr.kit, arr.swing);
      if (drumsOn && arr.inst.includes('ride')) for (let q = 0; q < 4; q++) ride(buf, at(b, q + 0.5), 0.035 * level);
      if (arr.inst.includes('shaker') && !isBreak && section.name !== 'intro') for (let e = 0; e < 16; e++) shaker(buf, at(b, e / 4 + (arr.swing && e % 2 ? arr.swing * 0.25 : 0)), e % 4 ? 0.018 : 0.03);
      if (arr.inst.includes('tambourine') && !isBreak && section.name !== 'intro') for (let e = 0; e < 4; e++) tambourine(buf, at(b, 1 + e), 0.05 * level);
      if (arr.inst.includes('clap') && !isBreak && (isChorus || section.name === 'verse')) { clap(buf, at(b, 1), 0.05 * accent); clap(buf, at(b, 3), 0.05 * accent); }
      if (arr.inst.includes('toms') && isChorus && b % 4 === 2) { tom(buf, at(b, 3), 0.09, 120); tom(buf, at(b, 3.5), 0.08, 98); }
      if (arr.inst.includes('crash') && isChorus && (b - section.from) % 4 === 0) crash(buf, at(b), 0.07);
      if (arr.inst.includes('crash') && !isBreak && !isChorus && (b - section.from) % 8 === 7) crash(buf, at(b, 3.5), 0.06);

      // Lead: the melody plan gives each track its rhythm and contour; chorus moves up an octave.
      const leadOn = !isIntro || intro.lead;
      if (leadOn && !isBreak) {
        const rhythm = RHYTHMS[isChorus && leadUp ? 'eighths' : plan.rhythm] ?? RHYTHMS.quarters;
        const contour = CONTOURS[plan.contour] ?? CONTOURS.arch;
        const octave = (isChorus ? 24 : 12) + arr.octaveShift;
        // The chorus lead is higher and more staccato than the verse, which reads as thinner even at
        // the same gain: hold the notes longer and push the level so the chorus is really the peak.
        const gain = arr.mix.lead * level * (isChorus ? 1.2 : 1);
        rhythm.forEach((pos, n) => {
          degree = (degree + contour[n % contour.length] + scale.length) % scale.length;
          const note = key + octave + scale[degree];
          const motifStep = motif[(b * 2 + n) % motif.length];
          const target = arr.rhythm === 'palm' ? note + (motifStep > 0 ? 0 : -12) : note;
          const dur = beat * (isChorus ? 0.62 : 0.9);
          if (arr.lead === 'stab' && n % 2 === 1) return;
          leadWave(buf, at(b, pos), target, dur, gain * leadComp(target));
        });
        if (arr.mix.counter && (isChorus || section.name === 'solo')) for (let q = 0; q < 4; q++) counter(buf, at(b, q + 0.5), tones[(q + 1) % tones.length] + 24, beat * 0.4, arr.mix.counter * level);
      }

      // Chorus lift: one colour per arrangement, chosen so neighbouring tracks do not lift the same way.
      if (isChorus) {
        const vOct = arr.voicesOctave;
        if (arr.mix.voices) voices(buf, at(b), tones.map(t => t + vOct), bar, arr.mix.voices * level);
        if (arr.mix.shimmer) shimmer(buf, at(b), tones, bar, arr.mix.shimmer * level);
        if (arr.mix.brass) brass(buf, at(b), tones.map(t => t + 12), bar * 0.6, arr.mix.brass * level);
        if (arr.mix.arp) for (let e = 0; e < 16; e++) arpeggio(buf, at(b, e / 4), tones[e % tones.length] + 24, beat * 0.2, arr.mix.arp * level);
        if (arr.mix.bell) for (let q = 0; q < 4; q++) bell(buf, at(b, q), tones[q % tones.length] + 24, beat * 0.8, arr.mix.bell * level);
        if (arr.inst.includes('flute')) for (let q = 0; q < 4; q++) flute(buf, at(b, q + 0.5), tones[(q + 1) % tones.length] + 24, beat * 0.45, 0.05 * level);
        if (arr.inst.includes('reed')) for (let q = 0; q < 2; q++) reed(buf, at(b, q * 2 + 1.5), tones[(q + 2) % tones.length] + 24, beat * 0.4, 0.045 * level);
        if (arr.inst.includes('mutedTrumpet') || arr.inst.includes('brassLeap')) for (let q = 0; q < 4; q++) (arr.inst.includes('mutedTrumpet') ? mutedTrumpet : mutedTrumpet)(buf, at(b, q), tones[q % tones.length] + 24, beat * 0.4, 0.05 * level);
        if (arr.inst.includes('harmonica')) for (let q = 0; q < 4; q++) harmonica(buf, at(b, q + 0.5), tones[q % tones.length] + 12, beat * 0.6, 0.045 * level);
        if (arr.inst.includes('xylophone')) for (let q = 0; q < 4; q++) xylophone(buf, at(b, q + 0.75), tones[q % tones.length] + 24, beat * 0.3, 0.05 * level);
        if (arr.inst.includes('bell') && !arr.mix.bell) for (let e = 0; e < 4; e++) bell(buf, at(b, e + 0.5), tones[e % tones.length] + 24, beat * 0.3, 0.035 * level);
      }
      if (arr.inst.includes('brassLeap') && isChorus && b % 2 === 0) brassLeap(buf, at(b), tones, beat * 0.5, 0.08 * level);
      if (arr.inst.includes('stringStabs') && b % 2 === 1) stringStabs(buf, at(b, 2), tones.map(t => t + 12), beat * 0.4, 0.05 * level);
      if (isLast) crash(buf, at(b), 0.12);
    }
  }

  // Held tonic in the outro so nothing ends with a click.
  const outro = sections.find(s => s.name === 'outro');
  if (outro) pad(buf, at(outro.from) - Math.round(bar * 0.5), CHORDS[progression[0]].map(t => key + t + 12), (outro.to - outro.from) * bar * 0.95, 0.035);
  const tail = Math.min(buf.length, at(totalBars) + Math.round(RATE * 1.2));

  const wet = reverb(buf.slice(0, tail), arr.inst.includes('pad') || arr.inst.includes('strings') ? 0.22 : 0.16);
  // Reverb combs run their line in float32: once a dense mix pushes the recursion past float
  // range it turns to NaN and never recovers, poisoning the rest of the track. Rebuild the line at
  // double precision whenever it stops being finite instead of writing holes into the WAV.
  dcBlock(wet);
  const broken = sanitise(wet);
  if (broken) console.warn(`${meta.region} ${arr.id}: ${broken} muestras no finitas sustituidas`);
  // Fade the last bar of the outro, otherwise the final crash pushes the RMS check out of tolerance.
  const fadeStart = Math.max(0, tail - Math.round(bar * 1.2));
  for (let i = fadeStart; i < wet.length; i++) wet[i] *= Math.pow(1 - (i - fadeStart) / Math.max(1, wet.length - fadeStart), 1.6);
  normalise(wet);
  // One pass of peak limiting keeps quiet intros from costing 2 dB on every track's level.
  // Gain staging used to let the limiter shave up to 2 dB off a whole track, so check the
  // measured RMS and close the gap instead of trusting the target: equal-loudness is the promise.
  normalise(wet);
  softClip(wet);
  limit(wet);
  let ss = 0;
  for (let i = 0; i < wet.length; i++) ss += wet[i] * wet[i];
  const correction = TARGET_RMS / (Math.sqrt(ss / wet.length) || 1);
  if (correction > 1.0005) {
    for (let i = 0; i < wet.length; i++) wet[i] *= correction;
    softClip(wet);
    limit(wet);
  }
  // The cut always starts on a chorus bar (a DJ would not drop it mid-line), then takes a head
  // start of up to half a bar that depends on the track, so 100 cuts are not all the same number.
  const chorusBars = sections.filter(s => s.name === 'chorus' || s.name === 'tag');
  const cueBar = chorusBars[index % chorusBars.length].from;
  const cueStart = cueBar * bar + seedOffset(index);
  const cueLength = Math.min(15.5, (chorusBars[index % chorusBars.length].to - cueBar) * bar - 0.24);
  const cue = {start: cueStart, duration: cueLength};
  return {
    samples: wet,
    duration: wet.length / RATE,
    start: cue.start,
    length: cue.duration,
    arrangement: arr.id,
    structure,
    bpm,
    scaleName,
    progression: progression.join('-'),
    progressionIndex: (minorish ? PROGRESSIONS_MINOR : PROGRESSIONS_MAJOR).indexOf(progression),
    instruments: arr.inst.length,
    nonFinite: broken,
    // Section map in seconds: the analyser uses it to prove the chorus is louder than the verse.
    sections: sections.map(s => ({name: s.name, start: +(s.from * bar).toFixed(2), duration: +((s.to - s.from) * bar).toFixed(2)}))
  };
}

mkdirSync(MASTERS, {recursive: true});
mkdirSync(OUT, {recursive: true});
const manifest = {};
const summary = {arrangements: new Set(), structures: new Set(), grooves: new Set(), progressions: new Set(), lengths: [], records: []};
for (let i = 0; i < 100; i++) {
  const id = `track-${String(i + 1).padStart(3, '0')}`;
  const meta = regions[i];
  const song = buildSong(i, meta);
  writeFileSync(join(MASTERS, `${id}.wav`), wav(song.samples));
  manifest[id] = {
    file: `/assets/music/${id}.ogg`,
    start: Math.round(song.start * 100) / 100,
    duration: Math.round(song.length * 100) / 100
  };
  summary.arrangements.add(song.arrangement);
  summary.structures.add(song.structure);
  summary.grooves.add(ARRANGEMENTS[i].groove);
  summary.progressions.add(song.progression);
  summary.lengths.push(song.samples.length / RATE);
  const recipe = ARRANGEMENTS[i];
  summary.records.push({id, arrangement: song.arrangement, structure: song.structure, style: meta.style, groove: recipe.groove, lead: recipe.lead, rhythm: recipe.rhythm, intro: recipe.intro, bpm: song.bpm, scale: song.scaleName, progression: song.progression, instruments: song.instruments, nonFinite: song.nonFinite, sections: song.sections});
  process.stdout.write(`${id} ${meta.region.padEnd(13)} ${meta.style.padEnd(17)} ${song.arrangement} ${song.structure.padEnd(9)} ${song.bpm}bpm ${song.progression.padEnd(15)} ${(song.samples.length / RATE).toFixed(1)}s\n`);
}
writeFileSync(join(OUT, 'choruses.json'), `${JSON.stringify(manifest, null, 1)}\n`);
writeFileSync('artifacts/catalog-recipes.json', `${JSON.stringify(summary.records, null, 1)}\n`);
console.log(`\n100 temas + choruses.json en ${OUT}`);
console.log(`arreglos distintos: ${summary.arrangements.size} · estructuras: ${summary.structures.size} · grooves: ${summary.grooves.size} · progresiones: ${summary.progressions.size}`);
console.log(`duración ${Math.min(...summary.lengths).toFixed(1)}–${Math.max(...summary.lengths).toFixed(1)} s`);

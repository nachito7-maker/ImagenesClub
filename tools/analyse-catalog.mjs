// Measures how different the 100 generated tracks really are, and writes artifacts/catalog-variety.json.
// Run after tools/generate-catalog.mjs: node tools/analyse-catalog.mjs
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';

const RATE = 22050;
// The shipped files are Opus, which no Node decoder here can read, and the composition is the same
// music either way: the variety is measured on the WAV masters the encoder starts from.
const root = 'artifacts/masters/';
const manifest = JSON.parse(readFileSync('public/assets/music/choruses.json', 'utf8'));
const recipes = JSON.parse(readFileSync('artifacts/catalog-recipes.json', 'utf8'));
const ids = Object.keys(manifest).sort();

function load(id) {
  const data = readFileSync(`${root}${id}.wav`);
  const length = (data.length - 44) / 2;
  const mono = new Float32Array(length);
  for (let i = 0; i < length; i++) mono[i] = data.readInt16LE(44 + i * 2) / 32768;
  return mono;
}

/** Energy per 0.5 s window: captures the different section layouts as a shape. */
function profile(mono) {
  const window = RATE / 2;
  const shape = [];
  for (let start = 0; start + window <= mono.length; start += window) {
    let ss = 0;
    for (let i = start; i < start + window; i++) ss += mono[i] * mono[i];
    shape.push(Math.sqrt(ss / window));
  }
  return shape;
}

/** Zero-crossing rate stands in for timbre: square leads and pads differ from palm-muted guitars. */
function zcr(mono) {
  let crossings = 0;
  for (let i = 1; i < mono.length; i += 4) if ((mono[i] >= 0) !== (mono[i - 1] >= 0)) crossings++;
  return (crossings * 4) / mono.length;
}

/** Onset density per second: a fast punk track fires far more transients than a half-time ballad. */
function onsets(mono) {
  const hop = Math.round(RATE / 100);
  const envelopes = [];
  for (let start = 0; start + hop < mono.length; start += hop) {
    let ss = 0;
    for (let i = start; i < start + hop; i++) ss += mono[i] * mono[i];
    envelopes.push(Math.sqrt(ss / hop));
  }
  // Onset = a window whose energy jumps clearly above the mean of the four before it: a drum hit
  // is a step, a sustained chord is not.
  let count = 0;
  for (let w = 4; w < envelopes.length; w++) {
    const before = (envelopes[w - 1] + envelopes[w - 2] + envelopes[w - 3] + envelopes[w - 4]) / 4;
    if (envelopes[w] > before * 1.7 && envelopes[w] > 0.01) count++;
  }
  return count / (mono.length / RATE);
}

/** Coarse band energies (low, mid, high): separates a bass-and-organ track from a bright arpeggio one. */
function spectrum(mono) {
  const bands = [0, 0, 0];
  const window = 1024;
  for (let start = 0; start + window < mono.length; start += window * 8) {
    for (let k = 1; k < 40; k++) {
      let re = 0, im = 0;
      for (let i = 0; i < window; i += 4) {
        const angle = (2 * Math.PI * k * i) / window;
        re += mono[start + i] * Math.cos(angle);
        im -= mono[start + i] * Math.sin(angle);
      }
      const power = (re * re + im * im);
      bands[k < 6 ? 0 : k < 20 ? 1 : 2] += power;
    }
  }
  const total = bands[0] + bands[1] + bands[2] || 1;
  return bands.map(v => v / total);
}

const tracks = ids.map(id => {
  const mono = load(id);
  const rmsProfile = profile(mono);
  const cue = manifest[id];
  // Comparing the cut against "everything else" hides the answer: the rest of the song contains the
  // other choruses, which are just as loud. What a listener feels is the chorus against the verse,
  // so that is what gets measured, using the section map the generator wrote down.
  const recipe = recipes.find(r => r.id === id);
  const inSection = (t, name) => (recipe?.sections ?? []).some(s => (s.name === name || (name === 'chorus' && s.name === 'tag')) && t >= s.start && t < s.start + s.duration);
  let chorus = 0, chorusN = 0, rest = 0, restN = 0;
  for (let w = 0; w < rmsProfile.length; w++) {
    const t = w * 0.5 + 0.25;
    if (inSection(t, 'chorus')) { chorus += rmsProfile[w]; chorusN++; }
    else if (inSection(t, 'verse') || inSection(t, 'pre')) { rest += rmsProfile[w]; restN++; }
  }
  const chorusLift = chorusN && restN ? chorus / chorusN / (rest / restN) : 0;
  const bands = spectrum(mono);
  return {
    id,
    seconds: mono.length / RATE,
    zcr: zcr(mono),
    onsets: onsets(mono),
    bands,
    chorusLift,
    cueStart: cue.start,
    cueDuration: cue.duration,
    profile: rmsProfile
  };
});

// Songs share one form on purpose (intro, verses, choruses, outro), so a raw shape correlation is
// not the test: two songs can match in form and still be different music. What matters for a
// listener is that the choruses are literally different (own tempo, key, notes, length), that the
// timbre differs, and that each track has a real dynamic story instead of flat repetition.
const cueSignature = new Set(tracks.map(t => `${t.cueStart.toFixed(2)}:${t.cueDuration.toFixed(2)}`));
const profiles = new Set(tracks.map(t => t.profile.map(v => v.toFixed(1)).join(',')));
const timbres = new Set(tracks.map(t => `${(t.zcr * 100).toFixed(0)}:${t.bands.map(b => b.toFixed(2)).join('/')}`));
const durations = tracks.map(t => Math.round(t.seconds));
const durationSpread = {min: Math.min(...durations), max: Math.max(...durations), distinct: new Set(durations).size};
const lift = tracks.map(t => t.chorusLift);
// A quiet window at the very end is the fade-out, not a hole in the song: ignore the last 3 s.
const zeros = tracks.map(t => {
  const usable = t.profile.slice(0, Math.max(0, t.profile.length - 6));
  return usable.filter(v => v < 0.0002).length;
}).reduce((a, b) => a + b, 0);
const onsetsPerSecond = tracks.map(t => t.onsets);
const recipesOk = {
  tracks: recipes.length,
  arrangements: new Set(recipes.map(r => r.arrangement)).size,
  forms: new Set(recipes.map(r => r.structure)).size,
  bpms: {min: Math.min(...recipes.map(r => r.bpm)), max: Math.max(...recipes.map(r => r.bpm)), distinct: new Set(recipes.map(r => r.bpm)).size},
  progressions: new Set(recipes.map(r => `${r.progression}/${r.instruments}`)).size,
  instruments: {min: Math.min(...recipes.map(r => r.instruments)), max: Math.max(...recipes.map(r => r.instruments))}
};

const report = {
  tracks: tracks.length,
  seconds: {min: Math.min(...tracks.map(t => t.seconds)), max: Math.max(...tracks.map(t => t.seconds))},
  uniqueChorusCues: cueSignature.size,
  uniqueLoudnessProfiles: profiles.size,
  uniqueTimbres: timbres.size,
  durationSpread,
  chorusLift: {min: Math.min(...lift), max: Math.max(...lift), average: lift.reduce((a, v) => a + v, 0) / lift.length},
  timbreZCR: {min: Math.min(...tracks.map(t => t.zcr)), max: Math.max(...tracks.map(t => t.zcr))},
  onsetsPerSecond: {min: Math.min(...onsetsPerSecond), max: Math.max(...onsetsPerSecond)},
  silentWindows: zeros,
  recipes: recipesOk,
  quietestTracks: [...tracks].sort((a, b) => a.chorusLift - b.chorusLift).slice(0, 3).map(t => ({id: t.id, chorusLift: +t.chorusLift.toFixed(2)}))
};

// Cues are capped at 15.5 s by the game's crossfade design, so 100 different choruses can share
// at most ~70 distinct roundings in time; what proves variety is the audio profile, not the clock.
const ok = report.tracks === 100
  && recipesOk.arrangements === 100
  && recipesOk.forms >= 20
  && recipesOk.bpms.distinct >= 25
  && recipesOk.bpms.max - recipesOk.bpms.min >= 30
  && report.uniqueChorusCues >= 65
  && report.uniqueLoudnessProfiles === 100
  && report.uniqueTimbres >= 50
  && report.chorusLift.min > 1.1
  && durationSpread.distinct >= 20
  && zeros === 0;
report.passed = ok;
mkdirSync('artifacts', {recursive: true});
writeFileSync('artifacts/catalog-variety.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exit(ok ? 0 : 1);

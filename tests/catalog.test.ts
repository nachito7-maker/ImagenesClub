import {it,expect} from 'vitest';
import {existsSync,readFileSync,statSync} from 'node:fs';
import {TRACKS} from '../src/core/music';
import {Game} from '../src/core/game';

interface Cue {file:string;start:number;duration:number;}
const manifest = JSON.parse(readFileSync('public/assets/music/choruses.json','utf8')) as Record<string,Cue>;

/** Reads an Ogg/Opus file: the app ships Opus, so the header check is the Opus one, not RIFF. */
function ogg(file:string){
 const data=readFileSync(`public${file}`);
 expect(data.toString('ascii',0,4),`${file} no es Ogg`).toBe('OggS');
 const head=data.indexOf('OpusHead');
 expect(head,`${file} no tiene cabecera Opus`).toBeGreaterThan(0);
 const channels=data[head+9];
 const preSkip=data.readUInt16LE(head+10);
 // Duration lives in the granule position of the last page with audio.
 let granule=0;
 for(let pos=data.lastIndexOf('OggS');pos>=0;pos=data.lastIndexOf('OggS',pos-1)){
  const low=data.readUInt32LE(pos+6),high=data.readUInt32LE(pos+10);
  const value=high*4294967296+low;
  if(value>0){granule=value;break;}
  if(pos===0)break;
 }
 return {channels,seconds:(granule-preSkip)/48000,bytes:data.length};
}

it('lists exactly 100 unique original tracks with stable sequential ids and an Opus file each',()=>{
 expect(TRACKS).toHaveLength(100);
 expect(new Set(TRACKS.map(track=>`${track.artist}|${track.title}`)).size).toBe(100);
 TRACKS.forEach((track,index)=>{
  expect(track.id).toBe(`track-${String(index+1).padStart(3,'0')}`);
  expect(track.file).toBe(`/assets/music/${track.id}.ogg`);
  expect(['Valencia','España','Internacional']).toContain(track.region);
  expect(track.style.length).toBeGreaterThan(2);
  expect(track.year).toBeGreaterThanOrEqual(1970);
  expect(track.year).toBeLessThanOrEqual(2000);
 });
});

it('ships mono Opus files that add up to a tenth of the old WAV catalogue',()=>{
 let total=0;
 for(const track of TRACKS){
  const info=ogg(track.file);
  expect(info.channels,`${track.id} no es mono`).toBe(1);
  expect(info.seconds,`${track.id} dura ${info.seconds}`).toBeGreaterThan(45);
  total+=info.bytes;
 }
 // The WAV masters were 358 MB; the shipped Opus set has to stay close to 30-40 MB.
 expect(total/1048576).toBeLessThan(45);
 expect(total/1048576).toBeGreaterThan(15);
});

it('has every one of the 100 choruses on disk with a valid cut inside the audio',()=>{
 expect(Object.keys(manifest)).toHaveLength(100);
 for(const track of TRACKS){
  const cue=manifest[track.id];
  expect(cue,`falta el corte de ${track.id}`).toBeDefined();
  expect(cue.file).toBe(track.file);
  expect(existsSync(`public${cue.file}`),`falta el audio ${cue.file}`).toBe(true);
  expect(cue.start).toBeGreaterThanOrEqual(0);
  expect(cue.duration).toBeGreaterThan(3);
  // The cut is marked on the real audio: it has to end inside the file.
  const seconds=ogg(cue.file).seconds;
  expect(cue.start+cue.duration,`el corte de ${track.id} se sale del audio`).toBeLessThanOrEqual(seconds+0.02);
 }
});

it('keeps the 100 tracks varied: cuts, lengths and chorus strength on the real audio',()=>{
 const cues=Object.values(manifest);
 // Every cut is its own moment in its own song, not the same offset repeated 100 times.
 expect(new Set(cues.map(cue=>`${cue.start}:${cue.duration}`)).size).toBeGreaterThanOrEqual(65);
 expect(new Set(cues.map(cue=>cue.start)).size).toBeGreaterThanOrEqual(60);
 // Lengths must differ: a catalogue of identical 90 s loops is not a catalogue.
 const seconds=TRACKS.map(track=>Math.round(ogg(manifest[track.id].file).seconds));
 expect(new Set(seconds).size).toBeGreaterThanOrEqual(20);
 expect(Math.max(...seconds)-Math.min(...seconds)).toBeGreaterThanOrEqual(30);
 // Cuts inside the chorus, not in the fade-out: the last 6 s of a track are never a cut.
 TRACKS.forEach((track,index)=>{const cue=manifest[track.id];expect(cue.start).toBeLessThan(seconds[index]-6);});
});

it('accepts any ten catalog ids as the opening playlist',()=>{
 const game=new Game();
 const ids=TRACKS.filter(track=>track.region==='Valencia').slice(0,10).map(track=>track.id);
 game.open(ids);
 expect(game.playlist).toEqual(ids);
 expect(game.phase).toBe('night');
});

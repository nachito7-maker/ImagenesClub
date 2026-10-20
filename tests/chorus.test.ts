import {describe,it,expect,vi} from 'vitest';
import {chorusVoices,ChorusMixer} from '../src/render/chorus';
import {playlistCapacity,MAX_CUT,CROSSFADE} from '../src/core/music';

describe('aforo según la noche',()=>{
 it('cada tema necesita su corte completo más el fundido',()=>{
  expect(playlistCapacity(300)).toBe(16);
  expect(playlistCapacity(600)).toBe(32);
  expect(playlistCapacity(60)).toBe(3);
  expect(playlistCapacity(5)).toBe(1);
  expect(playlistCapacity(0)).toBe(0);
  expect(playlistCapacity(Number.NaN)).toBe(0);
 });
 it('el hueco por tema nunca se queda corto y uno más ya no cabría',()=>{
  for(const night of [120,180,300,420,600,900]){
   const capacity=playlistCapacity(night);
   expect(night/capacity).toBeGreaterThanOrEqual(MAX_CUT+CROSSFADE);
   expect(night/(capacity+1)).toBeLessThan(MAX_CUT+CROSSFADE);
  }
 });
});

describe('mezcla de diez estribillos',()=>{
 it('reparte dieciséis temas en una noche de cinco minutos',()=>{
  const night=300,count=16,slot=night/count;
  expect(slot).toBe(18.75);
  expect(chorusVoices(0,night,count)).toEqual([{index:0,offset:0,gain:1}]);
  // The first 3 s of each slot are the crossfade, so the single voice starts after them.
  expect(chorusVoices(slot+4,night,count)).toEqual([{index:1,offset:4,gain:1}]);
  const fade=chorusVoices(slot+1,night,count);
  expect(fade.map(v=>v.index)).toEqual([0,1]);
  expect(fade.reduce((sum,v)=>sum+v.gain**2,0)).toBeCloseTo(1);
 });
 it('reparte toda la noche entre diez temas y mantiene el último durante el desalojo',()=>{
  expect(chorusVoices(0,300,10)).toEqual([{index:0,offset:0,gain:1}]);
  for(let i=0;i<10;i++)expect(chorusVoices(i*30+4,300,10)[0].index).toBe(i);
  expect(chorusVoices(350,300,10)).toEqual([{index:9,offset:80,gain:1}]);
 });
 it('solapa solo dos estribillos con potencia constante',()=>{
  const voices=chorusVoices(31.5,300,10);
  expect(voices.map(v=>v.index)).toEqual([0,1]);
  expect(voices.reduce((sum,v)=>sum+v.gain**2,0)).toBeCloseTo(1);
  expect(chorusVoices(33,300,10)).toEqual([{index:1,offset:3,gain:1}]);
 });
 it('pausa, recupera el punto de corte, aplica ×2 y detiene las voces al cerrar',()=>{
  const sources:any[]=[];
  const context={currentTime:0,createBufferSource:()=>{const source={playbackRate:{value:1},connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn()};sources.push(source);return source;},createGain:()=>({gain:{value:0,setTargetAtTime:vi.fn()},connect:vi.fn(),disconnect:vi.fn()})};
  const mixer=new ChorusMixer(context as unknown as AudioContext,{} as AudioNode);
  mixer.ids=Array.from({length:10},(_,i)=>String(i));
  for(const id of mixer.ids){mixer.buffers.set(id,{} as AudioBuffer);mixer.cues.set(id,{file:'/assets/music/test.ogg',start:5,duration:12});}
  mixer.update(true,31.5,300,1,false);expect(mixer.voices.size).toBe(2);
  mixer.update(false,31.5,300,1,false);expect(mixer.voices.size).toBe(0);expect(sources[0].stop).toHaveBeenCalled();
  mixer.update(true,31.5,300,2,false);expect(sources.at(-1).start).toHaveBeenCalledWith(0,6.5);expect(sources.at(-1).playbackRate.value).toBe(2);
  mixer.update(false,31.5,300,2,false);expect(mixer.voices.size).toBe(0);
 });
 it('informa de cortes ausentes sin intentar reproducir archivos inexistentes',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({})}));
  try{const mixer=new ChorusMixer({} as AudioContext,{} as AudioNode);expect(await mixer.prepare(Array.from({length:10},(_,i)=>String(i)))).toBe(false);expect(mixer.status).toContain('Faltan estribillos');expect(mixer.buffers.size).toBe(0);}finally{vi.unstubAllGlobals();}
 });
});

export interface ChorusCue {file:string;start:number;duration:number;}
export interface MixVoice {index:number;offset:number;gain:number;}

export function chorusVoices(elapsed:number,duration:number,count:number):MixVoice[]{
 if(count<1||duration<=0)return [];
 const slot=duration/count;
 const time=Math.max(0,elapsed);
 const index=Math.min(count-1,Math.floor(time/slot));
 const offset=time-index*slot;
 const fade=Math.min(3,slot/4);
 const overlap=index>0&&offset<fade;
 return overlap?[{index:index-1,offset:slot+offset,gain:Math.cos(offset/fade*Math.PI/2)},{index,offset,gain:Math.sin(offset/fade*Math.PI/2)}]:[{index,offset,gain:1}];
}

export class ChorusMixer {
 buffers=new Map<string,AudioBuffer>();
 cues=new Map<string,ChorusCue>();
 voices=new Map<number,{source:AudioBufferSourceNode;gain:GainNode}>();
 ids:string[]=[];status='Mezcla sin preparar';generation=0;lastTime=-1;lastSpeed=1;running=false;
 constructor(private context:AudioContext,private output:AudioNode){}
 async prepare(ids:string[]){
  const generation=++this.generation;
  this.stop();this.ids=[...ids];this.status='Preparando estribillos…';
  try{
   // How many songs fit is a decision of the night (see playlistCapacity); the mixer only rejects
   // an impossible request: none, repeated, or more songs than the catalogue has.
   if(ids.length<1||ids.length>100||new Set(ids).size!==ids.length)throw new Error('Selecciona temas distintos del catálogo');
   const response=await fetch('/assets/music/choruses.json');
   if(!response.ok)throw new Error('Falta el mapa de estribillos');
   const manifest:Record<string,ChorusCue>=await response.json();
   const missing=ids.filter(id=>!manifest[id]);
   if(missing.length)throw new Error(`Faltan estribillos: ${missing.join(', ')}`);
   const buffers=new Map<string,AudioBuffer>(),cues=new Map<string,ChorusCue>();
   for(const id of ids){
    const cue=manifest[id];
    if(typeof cue.file!=='string'||!cue.file.startsWith('/assets/music/')||!Number.isFinite(cue.start)||cue.start<0||!Number.isFinite(cue.duration)||cue.duration<=0)throw new Error(`Corte no válido: ${id}`);
    const res=await fetch(cue.file);
    if(!res.ok)throw new Error(`Audio no disponible: ${id}`);
    const buffer=await this.context.decodeAudioData(await res.arrayBuffer());
    if(cue.start+cue.duration>buffer.duration+.01)throw new Error(`Estribillo fuera del audio: ${id}`);
    buffers.set(id,buffer);cues.set(id,cue);
   }
   if(generation!==this.generation)return false;
   this.buffers=buffers;this.cues=cues;this.status='Mezcla preparada';return true;
  }catch(error){if(generation===this.generation){this.buffers.clear();this.cues.clear();this.status=error instanceof Error?error.message:String(error);}return false;}
 }
 update(active:boolean,time:number,duration:number,speed:number,muted:boolean){
  if(!active||this.buffers.size<1||this.buffers.size!==this.ids.length){this.stop();return;}
  const seek=this.lastTime>=0&&(time<this.lastTime||time-this.lastTime>.5*speed);
  if(seek||speed!==this.lastSpeed)this.stop();
  const desired=chorusVoices(time,duration,this.ids.length);
  for(const [index,voice] of this.voices)if(!desired.some(v=>v.index===index)){voice.source.stop();voice.source.disconnect();voice.gain.disconnect();this.voices.delete(index);}
  for(const v of desired){
   let voice=this.voices.get(v.index);
   if(!voice){
    const id=this.ids[v.index],cue=this.cues.get(id)!,source=this.context.createBufferSource(),gain=this.context.createGain();
    source.buffer=this.buffers.get(id)!;source.loop=true;source.loopStart=cue.start;source.loopEnd=cue.start+cue.duration;source.playbackRate.value=speed;
    source.connect(gain);gain.connect(this.output);gain.gain.value=0;
    source.start(0,cue.start+v.offset%cue.duration);voice={source,gain};this.voices.set(v.index,voice);
   }
   voice.gain.gain.setTargetAtTime(muted?0:v.gain*.65,this.context.currentTime,.02);
  }
  this.running=true;this.lastTime=time;this.lastSpeed=speed;
 }
 stop(){for(const voice of this.voices.values()){voice.source.stop();voice.source.disconnect();voice.gain.disconnect();}this.voices.clear();this.running=false;this.lastTime=-1;}
}

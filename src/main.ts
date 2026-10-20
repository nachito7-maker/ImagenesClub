import './style.css';
import {Game} from './core/game';
import {ClubView} from './render/club';
import {ClubAudio} from './render/audio';
import {Interface} from './ui/interface';
const SAVE_KEY='imagenes-club.campaign.v1';
let game:Game;try{const saved=localStorage.getItem(SAVE_KEY);game=saved?Game.load(saved):new Game();}catch(error){console.warn('No se pudo recuperar la campaña:',error);game=new Game();}
game.paused=true;
const canvas=document.getElementById('scene') as HTMLCanvasElement;
const view=new ClubView(canvas);const audio=new ClubAudio();
const save=()=>{try{localStorage.setItem(SAVE_KEY,game.save());}catch(error){console.error('Error guardando la campaña',error);ui?.toast('No se pudo guardar: almacenamiento lleno o no disponible');}};
const ui=new Interface(game,view,audio,save);
let last=performance.now(),time=0,saveTime=0,hidden=false,auditCursor=game.audit.length;
function frame(now:number){const dt=Math.min((now-last)/1000,.5);last=now;time+=dt;if(!hidden){if(ui.started&&view.loaded)game.tick(dt);view.update(game,time);ui.update(time);if(game.audit.length<auditCursor)auditCursor=0;for(const entry of game.audit.slice(auditCursor)){if(['serve','pay','prepare','clean','depart','delivery'].includes(entry.type))audio.effect(entry.type);}auditCursor=game.audit.length;audio.syncMix(ui.started&&game.phase==='night'&&!game.paused,game.time,game.nightDuration,game.speed);audio.update(ui.started&&game.phase==='night'&&!game.paused,game.selectedEvent,game.active.length,game.active.filter(c=>c.path.length>0).length);if(time-saveTime>10&&ui.started){saveTime=time;save();}}requestAnimationFrame(frame);}
void view.load().then(()=>{requestAnimationFrame(frame);window.dispatchEvent(new Event('club-ready'));}).catch(error=>{console.error(error);document.getElementById('modal')!.innerHTML='<section class="dialog"><h2>No se pudo cargar el local</h2><p>Los assets 3D no están disponibles. Reinicia la aplicación.</p></section>';});
document.addEventListener('visibilitychange',()=>{hidden=document.hidden;if(hidden){save();audio.suspend();}else {last=performance.now();audio.unlock();}});
window.addEventListener('pagehide',save);
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();game.paused=true;ui.toast('Contexto gráfico pausado. Recargando el guardado…');save();});canvas.addEventListener('webglcontextrestored',()=>location.reload());
declare global {interface Window {club:{game:Game;view:ClubView;ui:Interface;save:()=>void;ready:()=>boolean;stats:()=>ReturnType<typeof readStats>};}}
function readStats(){return{...view.stats,customers:game.active.length,phase:game.phase,assets:view.assets.length};}
window.club={game,view,ui,save,ready:()=>view.loaded,stats:readStats};

import fs from 'node:fs/promises';
import {AndroidSession} from './android-session.mjs';
const s=new AndroidSession({port:19254,eventFile:'artifacts/android-profile-events.jsonl'});const report={timestamp:new Date().toISOString(),samples:[],temporaryDiagnosticOnly:true};
const keep=setInterval(()=>{},1000);
try{await s.connect('profile');
for(const mode of ['normal','render-submit-only','logic-ui-only','normal-restored']){
 const generation=s.generation;
 const r=await s.bounded('profile-window',()=>s.page.evaluate(mode=>new Promise(resolve=>{
 const g=club.game;g.spawnTimer=10000;g.nightDuration=10000;g.speed=1;const times={logic:[],view:[],ui:[],render:[],batch:[],details:[]},restore=[];
 const wrap=(object,key,label)=>{const original=object[key];object[key]=function(...args){const begin=performance.now();try{return original.apply(this,args);}finally{times[label].push(performance.now()-begin);}};restore.push(()=>object[key]=original);};
 if(mode==='logic-ui-only'){const original=club.view.renderer.render;club.view.renderer.render=()=>{};restore.push(()=>club.view.renderer.render=original);}
 if(mode==='render-submit-only'){const original=club.view.update;club.view.update=function(){this.renderer.render(this.scene,this.camera);};restore.push(()=>club.view.update=original);}
 wrap(g,'tick','logic');wrap(club.view,'update','view');wrap(club.ui,'update','ui');wrap(club.view.renderer,'render','render');wrap(club.view.batch,'update','batch');wrap(club.view.details,'update','details');
 const frames=[],start=performance.now();let last;
 function frame(now){if(last!==undefined)frames.push(now-last);last=now;if(now-start<10000)requestAnimationFrame(frame);else{for(const reset of restore.reverse())reset();const summary={};for(const [k,values] of Object.entries(times)){values.sort((a,b)=>a-b);summary[k]={samples:values.length,p50:values[Math.floor(values.length*.5)]??null,p95:values[Math.floor(values.length*.95)]??null};}frames.sort((a,b)=>a-b);resolve({mode,elapsed:now-start,fps:frames.length*1000/(now-start),p50:frames[Math.floor(frames.length*.5)],p95:frames[Math.floor(frames.length*.95)],cpu:summary,stats:club.stats()});}}
 requestAnimationFrame(frame);
 }),mode),40000);if(generation!==s.generation)throw new Error('Reconnected: invalid profile');report.samples.push(r);await fs.writeFile('artifacts/android-profile.json',JSON.stringify(report,null,2));console.log(JSON.stringify(r));}
}catch(e){report.failure=String(e);process.exitCode=1;}finally{await fs.writeFile('artifacts/android-profile.json',JSON.stringify(report,null,2));await s.close();clearInterval(keep);}

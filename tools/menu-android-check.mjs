import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {AndroidSession} from './android-session.mjs';
const s=new AndroidSession({port:19257,eventFile:'artifacts/menu-img-events.jsonl'});
const report={timestamp:new Date().toISOString(),avd:s.avd,serial:s.serial,apkSHA256:createHash('sha256').update(await fs.readFile('artifacts/imagenes-club-debug.apk')).digest('hex'),checks:{},passed:false};
const keep=setInterval(()=>{},1000);
const save=()=>fs.writeFile('artifacts/menu-img-validation.json',JSON.stringify(report,null,2));
async function step(name,fn){report.checks[name]={result:'RUNNING'};await save();try{const evidence=await fn();report.checks[name]={result:'PASS',evidence};}catch(e){report.checks[name]={result:'FAIL_OR_BLOCKED',error:String(e)};throw e;}finally{await save();}}
try{
 await step('boot-and-installed-hash',async()=>{await s.connect('menu-final');const path=s.adb('shell','pm','path','es.imagenesclub.game').replace('package:','');const hash=s.adb('shell','sha256sum',path).split(/\s+/)[0];assert.equal(hash,report.apkSHA256);return{hash,target:s.target};});
 await step('landscape-menu-copy-and-scene',async()=>{const data=await s.evaluate(()=>({width:innerWidth,height:innerHeight,phrase:document.querySelector('.title-tribute')?.textContent,logo:document.querySelector('.title-logo img')?.getAttribute('src'),menu:club.view.menuMode,djs:[...club.view.staff.keys()].filter(k=>k==='dj').length,guests:club.view.menuActors.length,loaded:club.ready()}));assert(data.width>data.height&&data.menu&&data.loaded);assert.equal(data.phrase,'Un local, un tributo, una historia');assert.equal(data.logo,'/assets/references/logo-ui.png');assert.equal(data.djs,1);return{...data,capture:await s.capture('artifacts/menu-captures/menu-img-final.png')};});
 await step('menu-does-not-change-campaign',async()=>{const before=await s.evaluate(()=>club.game.save());await new Promise(r=>setTimeout(r,1500));assert.equal(await s.evaluate(()=>club.game.save()),before);return{unchanged:true};});
 await step('touch-entry',async()=>{await s.tap('.club-entry',()=>club.ui.started&&!club.view.menuMode);return{capture:await s.capture('artifacts/menu-captures/entry-img-final.png')};});
 await step('save-force-stop-load',async()=>{await s.bounded('pause-and-save',()=>s.page.evaluate(()=>{club.game.paused=true;club.save();}));const before=await s.evaluate(()=>club.game.save());s.adb('shell','am','force-stop','es.imagenesclub.game');s.adb('shell','am','start','-n','es.imagenesclub.game/.MainActivity');await s.disconnect('reload');await s.connect('save-load');assert.equal(await s.evaluate(()=>club.game.save()),before);assert(await s.evaluate(()=>club.view.menuMode));return{exactCampaignEqual:true};});
 report.passed=true;
}catch(e){report.failure=String(e);report.diagnostics=await s.diagnose();process.exitCode=1;}finally{await save();try{await s.close();}finally{clearInterval(keep);}}
console.log(JSON.stringify(report,null,2));

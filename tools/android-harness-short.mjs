import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {AndroidSession,HarnessBlocked} from './android-session.mjs';
const session=new AndroidSession();
const path='artifacts/android-harness-short.json';
const report={timestamp:new Date().toISOString(),apkSHA256:createHash('sha256').update(await fs.readFile('artifacts/imagenes-club-debug.apk')).digest('hex'),device:session.serial,avd:session.avd,passed:false,checkpoints:{}};
const names=['BOOT','LANDSCAPE','TOUCH','PURCHASE','RECEIVE','STORAGE','RECONNECT'];
for(const name of names)report.checkpoints[`CHECKPOINT_${name}`]={timestamp:new Date().toISOString(),state:'NOT_VALIDATED',evidence:null,action:null,result:'NOT_VALIDATED',reconnected:false};
const save=()=>fs.writeFile(path,JSON.stringify(report,null,2));
async function step(name,action,fn){const gen=session.generation;const entry=report.checkpoints[`CHECKPOINT_${name}`];Object.assign(entry,{timestamp:new Date().toISOString(),state:'RUNNING',action});await save();try{entry.evidence=await fn();entry.result='PASS';entry.state='PASS_REAL';}catch(e){entry.result=e instanceof HarnessBlocked?'NOT_VALIDATED':'FAIL';entry.state=e instanceof HarnessBlocked?'BLOCKED_BY_HARNESS':'FAIL_REAL';entry.error=String(e);throw e;}finally{entry.reconnected=session.generation>gen;entry.timestamp=new Date().toISOString();await save();}}
const keep=setInterval(()=>{},1000);
try{
 await step('BOOT','discover exact appassets WebView and attach',async()=>{await session.connect();return session.target;});
 await step('LANDSCAPE','read viewport',async()=>{const v=await session.evaluate(()=>({w:innerWidth,h:innerHeight}));assert(v.w>v.h);return v;});
 // User-authorized reset of only the test save. Do not reset production logic.
 await session.evaluate(()=>{const fresh=new club.game.constructor();Object.assign(club.game,fresh);club.game.paused=true;club.save();});
 await session.page.reload();await session.wait(()=>window.club?.ready());
 session.touch=await session.page.context().newCDPSession(session.page);
 await session.tap('[data-action="start"]',()=>club.ui.started);
 await step('TOUCH','touch floor up and down',async()=>{await session.tap('[data-action="floor"]',()=>club.view.floor===1);await session.tap('[data-action="floor"]',()=>club.view.floor===0);return 'Input.dispatchTouchEvent, verified floor 0→1→0';});
 await session.tap('[data-action="cellar"]',()=>club.view.cellar);
 await session.tap('[data-target="beer"]',()=>club.ui.selected?.id==='beer');
 await session.tap('[data-action="cart-plus"]',()=>club.game.cart.beer===6);
 const before=await session.evaluate(()=>({money:club.game.campaign.money,stock:club.game.campaign.stock.beer}));
 await step('PURCHASE','touch confirm exactly once, verify money and delivery',async()=>{await session.tap('[data-action="purchase"]',()=>club.game.deliveries.length===1);const result=await session.evaluate(()=>({money:club.game.campaign.money,delivery:club.game.deliveries[0]}));assert.equal(result.money,before.money-6);return result;});
 await step('RECEIVE','touch receive and open, verify transitions',async()=>{await session.tap('[data-action="receive"]',()=>club.game.deliveries[0].state==='received');await session.tap('[data-action="unpack"]',()=>club.game.deliveries[0].state==='opened');return await session.evaluate(()=>club.game.deliveries[0]);});
 await step('RECONNECT','intentionally disconnect after RECEIVE and rediscover, without replaying purchase',async()=>{const target=session.target;const beforeSave=await session.evaluate(()=>club.game.save());await session.disconnect('controlled-test');await session.connect('controlled-test');assert.equal(await session.evaluate(()=>club.game.save()),beforeSave);return {before:target,after:session.target,saveEqual:true};});
 await step('STORAGE','touch store, observe crate, await stock incorporation',async()=>{await session.tap('[data-action="store"]',()=>club.view.boxQueue.length>0);assert.equal(await session.evaluate(()=>club.game.campaign.stock.beer),before.stock);await session.wait(()=>club.view.boxPhase==='carry'&&club.view.crate.visible,null,90000);const evidence=await session.capture('artifacts/android-short-box.png');await session.wait(()=>club.game.deliveries[0].state==='organized',null,90000);assert.equal(await session.evaluate(()=>club.game.campaign.stock.beer),before.stock+6);return {evidence,atomicStock:true};});
 report.passed=true;
}catch(e){report.failure=String(e);report.diagnostics=await session.diagnose();process.exitCode=1;}finally{await save();await session.close();clearInterval(keep);}
console.log(JSON.stringify(report,null,2));

import {chromium} from 'playwright';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const b=await chromium.launch({channel:'chrome',headless:true});const report={viewports:[],errors:[]};await fs.mkdir('artifacts/menu-captures',{recursive:true});
try{
for(const [width,height] of [[960,540],[854,393],[1280,800],[740,360]]){
 const p=await b.newPage({viewport:{width,height},hasTouch:true});p.on('pageerror',e=>report.errors.push(String(e)));await p.goto('http://127.0.0.1:5291');await p.waitForFunction(()=>club?.ready());
 const before=await p.evaluate(()=>club.game.save());await p.waitForTimeout(900);
 const layout=await p.evaluate(()=>{const r=document.querySelector('.club-entry').getBoundingClientRect(),logo=document.querySelector('.title-logo img');return{button:r.toJSON(),phrase:document.querySelector('.title-tribute').textContent,logo:logo.getAttribute('src'),menu:club.view.menuMode,guests:club.view.menuActors.length,djs:[...club.view.staff.keys()].filter(k=>k==='dj').length,blur:getComputedStyle(document.querySelector('#modal')).backdropFilter};});
 assert.equal(layout.phrase,'Un local, un tributo, una historia');assert.equal(layout.djs,1);assert(layout.guests>0&&layout.menu);assert(layout.button.height>=48&&layout.button.x>15&&layout.button.y>0&&layout.button.bottom<height-10);assert.equal(await p.evaluate(()=>club.game.save()),before,'Menu must not tick or mutate the campaign');
 await p.screenshot({path:`artifacts/menu-captures/menu-${width}x${height}.png`});await p.locator('.club-entry').tap();assert(await p.evaluate(()=>club.ui.started&&!club.view.menuMode&&!document.body.classList.contains('title-screen')));await p.evaluate(()=>{club.game.paused=true;club.save();});const saved=await p.evaluate(()=>club.game.save());await p.reload();await p.waitForFunction(()=>club?.ready());assert.equal(await p.evaluate(()=>club.game.save()),saved);report.viewports.push({width,height,...layout,touch:true,saveLoad:true,menuCampaignUnchanged:true});await p.close();
}
assert.equal(report.errors.length,0);report.passed=true;await fs.writeFile('artifacts/menu-validation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await b.close();}

import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:960,height:540},hasTouch:true,isMobile:true,deviceScaleFactor:1});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const url=process.env.CLUB_URL||'http://127.0.0.1:5291';
try {
 const begin=Date.now();await page.goto(url);await page.waitForFunction(()=>window.club?.ready(),{timeout:30000});const loadMs=Date.now()-begin;
 await page.getByRole('button',{name:/Entrar al club/i}).tap();await page.waitForTimeout(300);
 await page.screenshot({path:'artifacts/web-day.png'});
 const touchTarget=async(id)=>{await page.waitForFunction(id=>window.club.view.targets.some(t=>t.id===id),id);const p=await page.evaluate(id=>{const target=window.club.view.targets.find(t=>t.id===id);return target?window.club.view.project(target.position.clone()):null;},id);assert(p?.visible,`Target ${id} is visible`);await page.waitForTimeout(300);await page.touchscreen.tap(p.x,p.y);await page.waitForTimeout(70);};
 await page.locator('[data-action="cellar"]').first().tap();await page.waitForTimeout(250);await page.locator('[data-target="beer"]').tap();await page.locator('[data-action="cart-plus"]').tap();await page.locator('[data-action="purchase"]').tap();await page.locator('[data-action="receive"]').tap();await page.locator('[data-action="unpack"]').tap();await page.locator('[data-action="store"]').tap();
 await page.waitForFunction(()=>window.club.game.deliveries[0].state==='organized',{timeout:20000});assert.equal(await page.evaluate(()=>window.club.game.deliveries[0].state),'organized');await page.screenshot({path:'artifacts/web-cellar.png'});await page.locator('[data-action="cellar"]').first().tap();
 await touchTarget('stage');await page.locator('[data-action="event"][data-id="concert"]').tap();await page.locator('[data-action="dismiss"]').tap();await page.locator('[data-action="open"]').tap();
 await page.waitForFunction(()=>window.club.game.active.length>0);await page.evaluate(()=>{window.club.game.spawnTimer=10000;window.club.game.nightDuration=10000;});
 // Actual simulation progresses; acceleration is isolated to test mode and does not bypass states.
 await page.evaluate(()=>{window.club.game.speed=12;});await page.waitForFunction(()=>window.club.game.groups.some(g=>g.state==='ordering'),{timeout:15000});
 await page.evaluate(()=>{window.club.game.paused=true;window.club.game.speed=1;});const id=await page.evaluate(()=>window.club.game.groups.find(g=>g.state==='ordering').table);await page.waitForTimeout(250);await page.locator(`[data-target="${id}"]`).tap();await page.locator('[data-action="order"]').tap();
 await page.evaluate(()=>{window.club.game.paused=false;});await page.locator('[data-action="prepare"]').first().tap();
 let steps=0;while(await page.locator('[data-action="step"]').count()){await page.waitForTimeout(750);await page.locator('[data-action="step"]').tap();steps++;}assert(steps>=2);
 await page.locator('[data-action="dismiss"]').tap();await page.evaluate(()=>{window.club.game.speed=12;});await page.waitForFunction(()=>window.club.game.groups.some(g=>g.state==='activity'),{timeout:20000});
 assert(await page.evaluate(()=>window.club.game.groups.filter(g=>g.state==='activity').every(g=>window.club.game.members(g).every(c=>c.received))));
 await page.screenshot({path:'artifacts/web-concert.png'});const stats=await page.evaluate(()=>window.club.stats());
 await page.locator('[data-action="floor"]').tap();await page.waitForTimeout(300);await page.screenshot({path:'artifacts/web-upper.png'});assert.equal(await page.evaluate(()=>window.club.view.floor),1);await page.locator('[data-action="floor"]').tap();
 await page.locator('[data-action="close"]').tap();await page.waitForFunction(()=>window.club.game.phase==='summary',{timeout:20000});await page.waitForSelector('.summary');await page.screenshot({path:'artifacts/web-summary.png'});const summary=await page.evaluate(()=>window.club.game.summary);assert(summary.served>0);
 // Dirty table cleaning via a genuine touch swipe before advancing the campaign.
 await page.evaluate(()=>{window.club.ui.modal.innerHTML='';});const dirtyId=await page.evaluate(()=>window.club.game.tables.find(t=>t.dirty>0&&t.floor===0).id);await page.waitForTimeout(300);await page.locator(`[data-target="${dirtyId}"]`).tap();await page.locator('[data-action="clean-game"]').tap();const rect=await page.locator('.clean-surface').boundingBox();const client=await context.newCDPSession(page);
 await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rect.x+10,y:rect.y+rect.height/2}]});for(let i=1;i<=12;i++)await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:rect.x+10+rect.width*.75*i/12,y:rect.y+rect.height/2}]});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert(await page.evaluate(id=>window.club.game.tables.find(t=>t.id===id).cleaning>0,dirtyId));
 await page.evaluate(()=>{window.club.ui.showSummary();});await page.locator('[data-action="next"]').tap();assert.equal(await page.evaluate(()=>window.club.game.campaign.day),2);
 await page.reload();await page.waitForFunction(()=>window.club?.ready());assert.equal(await page.evaluate(()=>window.club.game.campaign.day),2);await page.getByRole('button',{name:/^Continuar campaña$/i}).tap();
 // Swipe changes camera, not desktop wheel/keyboard interaction.
 const before=await page.evaluate(()=>window.club.view.pan.x);await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:430,y:280}]});await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:550,y:285}]});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.notEqual(await page.evaluate(()=>window.club.view.pan.x),before);
 assert.equal(errors.length,0,errors.join('\n'));await fs.writeFile('artifacts/browser-validation.json',JSON.stringify({passed:true,loadMs,stats,summary,minigameSteps:steps,touch:true,swipe:true,persistence:true,errors},null,2));console.log(JSON.stringify({passed:true,loadMs,stats,summary,errors},null,2));
}finally{await browser.close();}

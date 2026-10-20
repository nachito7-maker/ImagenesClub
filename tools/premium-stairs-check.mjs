import {chromium} from 'playwright';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage({viewport:{width:1280,height:720},hasTouch:true});const out='artifacts/premium-captures';await fs.mkdir(out,{recursive:true});const result={checks:[],errors:[]};p.on('pageerror',e=>result.errors.push(String(e)));
try{await p.goto('http://127.0.0.1:5291');await p.waitForFunction(()=>club?.ready());await p.locator('[data-action="start"]').tap();
await p.evaluate(()=>{club.game.open();club.game.spawnTimer=10000;const g=club.game.spawn(1,'upstairs');club.game.paused=true;const c=club.game.members(g)[0];c.position={x:-3.8,z:-4.45,floor:0};c.path=[{x:5.65,z:2.3,floor:1}];window.testCustomer=c.id;club.view.pan.set(-2,-3);club.view.zoom=1.65;club.view.resize();});
for(let journey=0;journey<6;journey++){
 const floor=journey%2;
 await p.evaluate(async floor=>{const {moveAlong,STAIRS}=await import('/src/core/navigation.ts');const c=club.game.customers.find(c=>c.id===window.testCustomer);c.position={...STAIRS[floor]};c.path=[{...STAIRS[1-floor]}];for(let i=0;i<18;i++)moveAlong(c.position,c.path,.1,1.8,[]);},floor);
 for(const view of [0,1]){await p.evaluate(view=>club.view.setFloor(view),view);await p.waitForTimeout(150);if(journey<2)await p.screenshot({path:`${out}/stairs-${journey}-${view}.png`});}
 const arrived=await p.evaluate(async()=>{const {moveAlong}=await import('/src/core/navigation.ts');const c=club.game.customers.find(c=>c.id===window.testCustomer);for(let i=0;i<25;i++)moveAlong(c.position,c.path,.1,1.8,[]);return{floor:c.position.floor,stair:c.position.stair,path:c.path.length};});assert.equal(arrived.floor,1-floor);assert.equal(arrived.path,0);assert.equal(arrived.stair,undefined);result.checks.push({journey,arrived});
}
const modules=await p.evaluate(()=>[...club.view.staff.values()].every(a=>a.root.userData.blenderModules));assert(modules);assert.equal(result.errors.length,0);result.blenderModules=true;await fs.writeFile('artifacts/premium-stairs-validation.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await b.close();}

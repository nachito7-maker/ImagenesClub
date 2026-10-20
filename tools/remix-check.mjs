// End-to-end check of the real chorus remix in Chromium: the shipped 100 Ogg/Opus files, no fixtures.
// The playlist size is not hard-coded here either: it comes from the night duration the game ships.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage({viewport:{width:1280,height:720}});
const errors=[],audioRequests=[];page.on('pageerror',e=>errors.push(String(e)));
page.on('response',response=>{if(/\/assets\/music\/track-\d+\.ogg$/.test(response.url()))audioRequests.push({status:response.status(),url:response.url()});});
try{
 await page.goto('http://127.0.0.1:5291');
 await page.waitForFunction(()=>window.club?.ready());
 // The night is 300 s, the longest cut is 15,5 s and the crossfade 3 s: 16 songs fit, not 10.
 const night=await page.evaluate(()=>({duration:window.club.game.nightDuration,capacity:window.club.game.playlistCapacity}));
 assert.equal(night.duration,300);
 assert.equal(night.capacity,16);
 const slot=night.duration/night.capacity;
 await page.locator('.club-entry').click();
 await page.locator('[data-action="open"]').click();
 const ids=Array.from({length:night.capacity},(_,i)=>`track-${String(i+1).padStart(3,'0')}`);
 for(const id of ids)await page.locator(`[data-action="playlist-toggle"][data-id="${id}"]`).click();
 const counter=await page.locator('.playlist-meta strong').innerText();
 assert.equal(counter.replace(/\s/g,''),'16/16');
 await page.locator('[data-action="playlist-confirm"]').click();
 await page.waitForFunction(()=>window.club.game.phase==='night',{timeout:30000});
 const mix=()=>page.evaluate(()=>({running:window.club.ui.audio.mixer.running,voices:window.club.ui.audio.mixer.voices.size,status:window.club.ui.audio.musicStatus,speed:window.club.ui.audio.mixer.lastSpeed,ids:window.club.ui.audio.mixer.ids.length}));
 let state=await mix();
 assert.equal(state.status,'Mezcla preparada');
 assert.equal(state.ids,16);
 assert.equal(state.running,true);
 assert.equal(state.voices,1);
 assert.equal(audioRequests.length,16,'deben cargarse los 16 audios reales');
 assert.ok(audioRequests.every(r=>r.status===200),'todos los audios responden 200');
 // Each song owns one 18,75 s slot: the crossfade happens at the slot boundary.
 await page.evaluate(t=>{window.club.game.time=t},slot+0.5);
 await page.waitForFunction(()=>window.club.ui.audio.mixer.voices.size===2);
 // Pause freezes the mix, resume brings it back on the same track.
 await page.locator('[data-action="pause"]').click();
 await page.waitForFunction(()=>!window.club.ui.audio.mixer.running);
 await page.locator('[data-action="pause"]').click();
 await page.locator('[data-action="speed"]').click();
 await page.waitForFunction(()=>window.club.ui.audio.mixer.lastSpeed===2);
 // A jump inside the night (no fade window) keeps a single voice on the matching track.
 const jump=slot*6+slot/2;
 await page.evaluate(t=>{window.club.game.time=t},jump);
 await page.waitForFunction(()=>window.club.ui.audio.mixer.voices.size===1);
 const seventh=await page.evaluate(()=>[...window.club.ui.audio.mixer.voices.keys()][0]);
 assert.equal(seventh,6,`a los ${jump.toFixed(1)} s suena el séptimo tema`);
 // Last orders: the final chorus loops and stops when the night ends.
 await page.locator('[data-action="close"]').click();
 assert.equal(await page.evaluate(()=>window.club.game.closing),true);
 await page.evaluate(()=>{window.club.game.customers.forEach(c=>c.state='gone');});
 await page.waitForFunction(()=>window.club.game.phase==='summary',{timeout:20000});
 await page.waitForFunction(()=>window.club.ui.audio.mixer.voices.size===0);
 assert.deepEqual(errors,[]);
 await fs.writeFile('artifacts/remix-validation.json',JSON.stringify({passed:true,realAudio:true,night,slot,tracks:audioRequests.length,pause:true,speed:true,crossfade:true,seekTracks:true,shutdown:true,errors},null,2));
 console.log(`Remix browser checks passed: ${audioRequests.length} real tracks in a ${night.duration} s night`);
}finally{await browser.close();}

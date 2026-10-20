import {describe,it,expect} from 'vitest';
import {Game,type Activity,type Group} from '../src/core/game';
import {RECIPES,SUPPLIES,PRODUCTS,EVENTS,UPGRADES} from '../src/core/catalog';
import {TRACKS,CROSSFADE,MAX_CUT} from '../src/core/music';
import {pathfind,walkable,STAIRS,TABLE_POSITIONS} from '../src/core/navigation';
import {drinkIcon} from '../src/ui/icons';
describe('aforo de la lista de reproducción',()=>{
 it('saca los temas que caben de la duración real de la noche',()=>{
  const g=new Game();
  // 300 s de noche, cortes de hasta 15,5 s y 3 s de fundido → 16 temas, no 10.
  expect(g.nightDuration).toBe(300);
  expect(g.playlistCapacity).toBe(Math.floor(300/(MAX_CUT+CROSSFADE)));
  expect(g.playlistCapacity).toBe(16);
  g.selectedEvent='normal';
  g.open(TRACKS.slice(0,16).map(track=>track.id));
  expect(g.playlist).toHaveLength(16);
 });
 it('rechaza más temas de los que caben y acepta menos',()=>{
  const tooMany=new Game();tooMany.selectedEvent='normal';
  expect(()=>tooMany.open(TRACKS.slice(0,17).map(track=>track.id))).toThrow('Elige entre 1 y 16');
  const few=new Game();few.selectedEvent='normal';
  few.open(TRACKS.slice(0,4).map(track=>track.id));
  expect(few.playlist).toHaveLength(4);
 });
 it('descarta una lista guardada que ya no cabe en la noche de hoy',()=>{
  const long=new Game();long.selectedEvent='normal';long.nightDuration=600;long.open(TRACKS.slice(0,32).map(track=>track.id));
  const saved=long.save();
  const back=Game.load(saved);back.phase='day';back.selectedEvent='normal';back.nightDuration=300;
  expect(back.playlistCapacity).toBe(16);
  back.open();
  expect(back.playlist).toHaveLength(16);
  expect(new Set(back.playlist).size).toBe(16);
 });
 it('crece con una noche más larga y nunca deja un hueco sin tema',()=>{
  const long=new Game();long.nightDuration=600;expect(long.playlistCapacity).toBe(32);
  const short=new Game();short.nightDuration=20;expect(short.playlistCapacity).toBe(1);
  const g=new Game();g.selectedEvent='normal';g.open();expect(g.playlist).toHaveLength(16);
 });
});

function run(g:Game,seconds:number){for(let i=0;i<seconds*10;i++)g.tick(.1);}
function isolated(seed=71){const g=new Game(seed);g.selectedEvent='normal';g.open();g.spawnTimer=10000;g.nightDuration=10000;return g;}
function until(g:Game,test:()=>boolean,max=200){for(let i=0;i<max*10&&!test();i++)g.tick(.1);expect(test(),JSON.stringify({groups:g.groups,jobs:g.jobs,staff:g.staff})).toBe(true);}
describe('drink-gated group simulation',()=>{
 it.each([1,2,4])('services a group of %i together through payment and dirty table',size=>{const g=isolated();const group=g.spawn(size)!;expect(group).not.toBeNull();const table=g.tables.find(t=>t.id===group.table)!;expect(table.capacity).toBeGreaterThanOrEqual(size);expect(table.group).toBe(group.id);expect(g.members(group).every(c=>c.appearance.age>30)).toBe(true);until(g,()=>group.state==='activity');expect(g.members(group).every(c=>c.received)).toBe(true);g.close();until(g,()=>group.state==='gone');expect(g.ledger.served).toBe(size);expect(g.ledger.sales).toBeGreaterThan(0);expect(table.dirty).toBe(size);expect(table.group).toBeNull();g.clean(table.id);run(g,4);expect(table.dirty).toBe(0);});
 it.each(['dance','museum','concert','upstairs'] as Activity[])('requires received drinks before %s',activity=>{const g=isolated(51);if(activity==='concert')g.selectedEvent='concert';const group=g.spawn(2,activity)!;expect(()=>g.startActivity(group)).toThrow('Actividad prohibida');until(g,()=>group.state==='activity');const served=g.audit.findIndex(a=>a.type==='received'&&a.group===group.id);const active=g.audit.findIndex(a=>a.type==='activity'&&a.group===group.id);expect(served).toBeGreaterThan(-1);expect(active).toBeGreaterThan(served);expect(g.members(group).every(c=>c.received)).toBe(true);if(activity==='upstairs'){until(g,()=>g.members(group).every(c=>c.position.floor===1));expect(g.members(group).every(c=>c.animation!=='idle')).toBe(true);}});
 it('serves high-volume bar with genuine preparation, service and payment',()=>{const g=isolated();const group=g.spawn(1,'bar',true)!;expect(g.tables.find(t=>t.id===group.table)!.bar).toBe(true);until(g,()=>group.state==='activity');expect(g.audit.filter(a=>a.group===group.id).map(a=>a.type)).toEqual(expect.arrayContaining(['order','prepare','serve','received','activity']));g.close();until(g,()=>group.state==='gone');expect(g.ledger.tips).toBeGreaterThan(0);});
 it('handles simultaneous bar and multiple table groups without splitting',()=>{const g=isolated();const groups=[g.spawn(4)!,g.spawn(2,'museum')!,g.spawn(1,'bar',true)!,g.spawn(1,'bar',true)!];expect(new Set(groups.map(a=>a.table)).size).toBe(4);g.close();until(g,()=>g.phase==='summary',400);expect(g.groups.every(a=>a.state==='gone')).toBe(true);});
 it('reserves stock atomically and never invents unavailable drinks',()=>{const g=isolated();const group=g.spawn(2)!;run(g,25);const before={...g.campaign.stock};for(const k of SUPPLIES)g.campaign.stock[k]=0;if(group.state==='waiting'||group.state==='ordering'){expect(g.takeOrder(group.id)).toBe(false);expect(g.members(group).some(c=>c.received)).toBe(false);}for(const k of SUPPLIES)expect(g.campaign.stock[k]).toBeGreaterThanOrEqual(0);expect(before.beer).toBeGreaterThanOrEqual(0);});
 it('second round resets drink gate, consumes stock and increases bill once',()=>{const g=isolated();const group=g.spawn(1)!;until(g,()=>group.state==='activity');const before=SUPPLIES.reduce((n,k)=>n+g.campaign.stock[k],0);g.secondRound(group);expect(group.round).toBe(2);expect(g.members(group)[0].received).toBe(false);expect(group.state).toBe('waitingDrink');expect(SUPPLIES.reduce((n,k)=>n+g.campaign.stock[k],0)).toBeLessThan(before);until(g,()=>group.state==='activity');g.pay(group);const sales=g.ledger.sales;g.pay(group);expect(g.ledger.sales).toBe(sales);expect(sales).toBe(RECIPES[g.members(group)[0].drink].price*2);});
 it('changes preparation quality through the minigame but still transports the drink',()=>{const g=isolated();const group=g.spawn(1)!;until(g,()=>g.jobs.some(j=>j.state==='queued'||j.state==='preparing'));const job=g.jobs[0];g.prepare(job.id,.98);expect(job.quality).toBe(.98);expect(g.members(group)[0].received).toBe(false);until(g,()=>job.state==='carrying');expect(g.members(group)[0].received).toBe(false);until(g,()=>g.members(group)[0].received);});
 it('does not allocate dirty or undersized tables',()=>{const g=isolated();for(const t of g.tables){t.dirty=1;}expect(g.spawn(4)).toBeNull();expect(g.ledger.lost).toBe(4);for(const t of g.tables)t.dirty=0;const group=g.spawn(4)!;expect(g.tables.find(t=>t.id===group.table)!.capacity).toBeGreaterThanOrEqual(4);});
 it('charges only served rounds when a second round runs out of stock',()=>{const g=isolated();const group=g.spawn(1)!;until(g,()=>group.state==='activity');const price=RECIPES[g.members(group)[0].drink].price;for(const k of SUPPLIES)g.campaign.stock[k]=0;g.secondRound(group);expect(group.state).toBe('leaving');expect(g.ledger.sales).toBe(price);expect(g.ledger.lost).toBe(1);});
 it('protects cleaning supplies and occupied tables',()=>{const g=isolated();const group=g.spawn(2)!;expect(()=>g.clean(group.table)).toThrow();const t=g.tables.find(t=>t.id==='t4')!;t.dirty=2;g.campaign.stock.supplies=0;expect(()=>g.clean(t.id)).toThrow('Sin suministros');expect(t.dirty).toBe(2);});
});
describe('day, deliveries and economy',()=>{
 it('physically receives, checks, opens and stores to correct destinations',()=>{const g=new Game();const initial=g.campaign.money;g.addCart('beer',6);g.addCart('ice',6);const cost=g.cartCost;g.buy();expect(g.campaign.money).toBe(initial-cost);const d=g.deliveries[0];expect(()=>g.open()).toThrow('Organiza');expect(()=>g.unpack(d.id)).toThrow();expect(()=>g.store(d.id,'beer','Nevera')).toThrow();g.receive(d.id);g.unpack(d.id);expect(()=>g.store(d.id,'beer','Congelador')).toThrow('Destino incorrecto');const stock=g.campaign.stock.beer;g.store(d.id,'beer','Nevera');expect(g.campaign.stock.beer).toBe(stock+6);expect(d.state).toBe('opened');g.store(d.id,'ice','Congelador');expect(d.state).toBe('organized');g.open();expect(g.phase).toBe('night');});
 it('prevents overspending and overstocking without changing money',()=>{const g=new Game();const money=g.campaign.money;g.addCart('spirits',1000);expect(()=>g.buy()).toThrow('Dinero insuficiente');expect(g.campaign.money).toBe(money);g.cart.spirits=0;g.addCart('ice',1000);expect(()=>g.buy()).toThrow('No cabe');expect(g.campaign.money).toBe(money);});
 it.each(Object.keys(UPGRADES) as (keyof typeof UPGRADES)[])('upgrade %s changes campaign and prevents double purchase',id=>{const g=new Game();const before=g.campaign.money;g.upgrade(id);expect(g.campaign.money).toBe(before-UPGRADES[id].cost);expect(g.campaign.upgrades).toContain(id);expect(()=>g.upgrade(id)).toThrow('Ya instalada');if(id==='storage')expect(g.capacity).toBe(380);});
 it.each(Object.keys(EVENTS) as (keyof typeof EVENTS)[])('event %s changes budget and demand',id=>{const g=new Game();g.selectedEvent=id;const money=g.campaign.money;g.open();expect(g.campaign.money).toBe(money-EVENTS[id].cost);expect(g.ledger.expenses).toBe(EVENTS[id].cost);expect(g.campaign.event).toBe(id);});
 it('finishes a complete night, closes safely and advances campaign',()=>{const g=new Game(121);g.selectedEvent='concert';g.open();for(let i=0;i<6000&&g.phase==='night';i++){g.tick(.1);for(const t of g.tables)if(t.group===null&&t.dirty&&!t.cleaning&&g.campaign.stock.supplies>0)g.clean(t.id);}expect(g.phase).toBe('summary');expect(g.summary).not.toBeNull();expect(g.summary!.served).toBeGreaterThan(10);expect(g.summary!.sales).toBeGreaterThan(0);expect(g.active).toHaveLength(0);expect(g.campaign.history).toHaveLength(1);expect(g.campaign.reputation).toBeGreaterThanOrEqual(0);const money=g.campaign.money;g.nextDay();expect(g.campaign.day).toBe(2);expect(g.phase).toBe('day');expect(g.campaign.money).toBe(money);expect(g.customers).toHaveLength(0);});
 it('restocks after an entire night and continues next day',()=>{const g=isolated();g.nightDuration=35;g.spawn(1);until(g,()=>g.phase==='summary',200);g.nextDay();g.addCart('beer',6);g.buy();const d=g.deliveries[0];g.receive(d.id);g.unpack(d.id);g.store(d.id,'beer',PRODUCTS.beer.destination);g.open();expect(g.campaign.day).toBe(2);});
});
describe('navigation and identity',()=>{
 it('routes around bar and furniture instead of crossing obstacles',()=>{const p=pathfind({x:0,z:7.2,floor:0},{x:-7,z:-4,floor:0});expect(p.length).toBeGreaterThan(5);expect(p.every(walkable)).toBe(true);});
 it('crosses the stair connection and actually navigates upstairs',()=>{const p=pathfind({x:0,z:5,floor:0},{x:1,z:-2,floor:1});expect(p.some(x=>x.floor===0)).toBe(true);expect(p.some(x=>x.floor===1)).toBe(true);expect(p).toContainEqual(STAIRS[1]);});
 it('returns no fake direct path for unreachable coordinates',()=>{expect(pathfind({x:0,z:0,floor:0},{x:100,z:100,floor:0})).toEqual([]);});
 it('creates differentiated older adult customers and distinct drink icons',()=>{const g=new Game();const appearances=Array.from({length:80},()=>g.appearance());expect(appearances.every(a=>a.age>30)).toBe(true);expect(new Set(appearances.map(a=>JSON.stringify(a))).size).toBe(80);const icons=Object.keys(RECIPES).map(k=>drinkIcon(k as keyof typeof RECIPES));expect(new Set(icons).size).toBe(8);expect(icons.every(i=>i.includes('<svg'))).toBe(true);expect(TABLE_POSITIONS.some(t=>t.floor===1&&t.capacity===6)).toBe(true);});
});
describe('save/load and safety',()=>{
 it('restores active service, campaign, inventory and pending deliveries',()=>{const g=isolated();const group=g.spawn(2,'museum')!;run(g,27);const saved=g.save();const restored=Game.load(saved);expect(restored.save()).toBe(saved);until(restored,()=>restored.groups[0].state==='activity');expect(restored.members(restored.groups[0]).every(c=>c.received)).toBe(true);const day=new Game();day.addCart('beer',6);day.buy();expect(Game.load(day.save()).deliveries).toEqual(day.deliveries);void group;});
 it('rejects corrupt or incompatible saves',()=>{expect(()=>Game.load('{}')).toThrow();expect(()=>Game.load('invalid')).toThrow();const data=JSON.parse(new Game().save());data.campaign.stock.beer=-1;expect(()=>Game.load(JSON.stringify(data))).toThrow('Guardado');});
 it('pauses simulation without advancing orders or clock',()=>{const g=isolated();g.spawn(1);g.paused=true;run(g,30);expect(g.time).toBe(0);expect(g.jobs).toHaveLength(0);});
});

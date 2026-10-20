import {EMPTY_STOCK, EVENTS, PRODUCTS, RECIPES, SUPPLIES, UPGRADES, stockAvailable, type DrinkId, type EventId, type Stock, type Supply, type UpgradeId} from './catalog';
import {TRACKS, playlistCapacity} from './music';

import {TABLE_POSITIONS, pathfind, moveAlong, type Point} from './navigation';
export type CustomerState='entering'|'seating'|'waiting'|'ordering'|'waitingDrink'|'consuming'|'activity'|'paying'|'leaving'|'gone';
export type Activity='seated'|'bar'|'dance'|'museum'|'concert'|'upstairs';
export type Animation='idle'|'walk'|'enter'|'exit'|'wait'|'sit'|'stand'|'talk'|'order'|'receive'|'drink'|'pay'|'dance'|'look'|'observe'|'work'|'clean'|'serve'|'prepare'|'react';
export interface Appearance {age:number;female:boolean;skin:number;body:number;hair:number;hairStyle:number;clothing:number;accessory:number;style:number;}
export interface Customer {id:number;group:number;position:Point;path:Point[];state:CustomerState;animation:Animation;appearance:Appearance;drink:DrinkId;received:boolean;round:number;servedRounds:number;satisfaction:number;activity:Activity;timer:number;seat:number;}
export interface Group {id:number;members:number[];table:string;state:CustomerState;timer:number;round:number;paid:boolean;activity:Activity;}
export interface Table {id:string;x:number;z:number;floor:number;capacity:number;group:number|null;dirty:number;cleaning:number;bar:boolean;}
export interface Job {id:number;group:number;drink:DrinkId;count:number;state:'queued'|'preparing'|'carrying'|'served';timer:number;quality:number;manual:boolean;}
export interface Delivery {id:number;items:Stock;state:'ordered'|'received'|'opened'|'organized';}
export interface Ledger {sales:number;tips:number;purchases:number;expenses:number;served:number;lost:number;satisfaction:number;}
export interface Staff {id:string;position:Point;path:Point[];animation:Animation;job:number|null;}
export interface Audit {time:number;type:string;group?:number;detail:string;}
export interface Campaign {version:1;day:number;money:number;reputation:number;stock:Stock;upgrades:UpgradeId[];unlocks:string[];history:Ledger[];event:EventId;playlist?:string[];}

export interface Summary extends Ledger {day:number;profit:number;reputation:number;}
export class Game {
 campaign:Campaign; playlist:string[]=[]; phase:'day'|'night'|'summary'='day';time=0;nightDuration=300;speed=1;paused=false;groups:Group[]=[];customers:Customer[]=[];jobs:Job[]=[];deliveries:Delivery[]=[];audit:Audit[]=[];
 tables:Table[]=[];ledger:Ledger=this.newLedger();summary:Summary|null=null;selectedEvent:EventId='dj';cart:Stock=EMPTY_STOCK();id=1;seed:number;spawnTimer=3;closing=false;
 staff:Staff[]=[{id:'camarera',position:{x:4.4,z:1,floor:0},path:[],animation:'idle',job:null},{id:'camarero',position:{x:7.7,z:1,floor:0},path:[],animation:'work',job:null}];
 constructor(seed=715,campaign?:Campaign){this.seed=seed;this.campaign=campaign??{version:1,day:1,money:420,reputation:35,stock:{beer:36,soda:30,spirits:30,ingredients:20,ice:48,supplies:40},upgrades:[],unlocks:['normal','dj','concert','museum'],history:[],event:'dj',playlist:[]};this.playlist=this.campaign.playlist??[];this.selectedEvent=this.campaign.event;this.resetTables();}
 private newLedger():Ledger{return{sales:0,tips:0,purchases:0,expenses:0,served:0,lost:0,satisfaction:0};}
 private resetTables(){this.tables=TABLE_POSITIONS.map(t=>({...t,group:null,dirty:0,cleaning:0,bar:false}));for(let i=0;i<7;i++)this.tables.push({id:`b${i}`,x:5.35,z:-4.4+i*1.25,floor:0,capacity:1,group:null,dirty:0,cleaning:0,bar:true});}
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 log(type:string,detail:string,group?:number){this.audit.push({time:this.time,type,detail,group});if(this.audit.length>2000)this.audit.shift();}
 get capacity(){return 280+(this.campaign.upgrades.includes('storage')?100:0);}
 /** Songs that fit in tonight's playlist: the night decides, not a magic number. */
 get playlistCapacity(){return Math.min(TRACKS.length,playlistCapacity(this.nightDuration));}
 private musicalSelection(capacity:number){const kept=this.playlist.filter(id=>TRACKS.some(track=>track.id===id));return kept.length>=1&&kept.length<=capacity&&new Set(kept).size===kept.length?[...kept]:TRACKS.slice(0,capacity).map(track=>track.id);}
 get stockTotal(){return SUPPLIES.reduce((n,k)=>n+this.campaign.stock[k],0);}
 get active(){return this.customers.filter(c=>c.state!=='gone');}
 open(playlist?:string[]){const capacity=this.playlistCapacity;if(playlist&&(playlist.length<1||playlist.length>capacity||new Set(playlist).size!==playlist.length||playlist.some(id=>!TRACKS.some(track=>track.id===id))))throw new Error(`Elige entre 1 y ${capacity} canciones diferentes del catálogo`);if(this.phase!=='day')throw new Error('Preparación obligatoria');if(this.deliveries.some(d=>d.state!=='organized'))throw new Error('Organiza las cajas antes de abrir');const e=EVENTS[this.selectedEvent];if(this.campaign.money<e.cost+35)throw new Error('Reserva dinero para el evento y los gastos');// A remembered playlist is only reused if it still fits tonight (a longer night could have left 20 songs).
 this.playlist=playlist?.length?[...playlist]:this.musicalSelection(capacity);this.campaign.playlist=[...this.playlist];this.campaign.money-=e.cost;this.ledger.expenses+=e.cost;this.campaign.event=this.selectedEvent;this.phase='night';this.time=0;this.spawnTimer=1;this.closing=false;this.log('open',e.name);}
 close(){if(this.phase!=='night')return;this.closing=true;this.log('close','Última ronda');for(const g of this.groups){if(['waiting','ordering','waitingDrink'].includes(g.state)&&!this.jobs.some(j=>j.group===g.id&&j.state!=='served'))this.leave(g,false);}}
 nextDay(){if(this.phase!=='summary')throw new Error('La noche no ha terminado');this.campaign.day++;this.phase='day';this.time=0;this.ledger=this.newLedger();this.groups=[];this.customers=[];this.jobs=[];this.deliveries=[];this.resetTables();this.summary=null;this.closing=false;}
 appearance():Appearance{return{age:31+Math.floor(this.random()*41),female:this.random()>.48,skin:Math.floor(this.random()*5),body:this.random(),hair:Math.floor(this.random()*6),hairStyle:Math.floor(this.random()*5),clothing:Math.floor(this.random()*9),accessory:Math.floor(this.random()*5),style:Math.floor(this.random()*4)};}
 spawn(size?:number,preference:Activity='seated',bar=false):Group|null {
 if(this.phase!=='night'||this.closing)return null;
 size=size??(this.random()<.42?1:this.random()<.65?2:3+Math.floor(this.random()*2));
 const available=this.tables.filter(t=>t.group===null&&t.dirty===0&&t.cleaning===0&&t.capacity>=size&&t.bar===bar&&t.floor===0&&!(t.id==='s1'&&this.selectedEvent==='concert'));
 available.sort((a,b)=>a.capacity-b.capacity||(preference==='upstairs'?b.floor-a.floor:a.floor-b.floor));const table=available[0];
 if(!table){this.ledger.lost+=size;this.log('lost','No hay sitio para el grupo');return null;}
 const gid=this.id++;const g:Group={id:gid,members:[],table:table.id,state:'entering',timer:0,round:1,paid:false,activity:bar?'bar':preference};table.group=gid;
 const ids=Object.keys(RECIPES) as DrinkId[];
 for(let i=0;i<size;i++){
  const p={x:(i-(size-1)/2)*.35,z:7.55+i*.18,floor:0};const seat={x:table.x+Math.sin(i*Math.PI*2/size)*.95,z:table.z+Math.cos(i*Math.PI*2/size)*.95,floor:table.floor};
  const c:Customer={id:this.id++,group:gid,position:p,path:pathfind(p,seat),state:'entering',animation:'enter',appearance:this.appearance(),drink:ids[Math.floor(this.random()*ids.length)],received:false,round:1,servedRounds:0,satisfaction:85+EVENTS[this.selectedEvent].ambience,activity:g.activity,timer:0,seat:i};this.customers.push(c);g.members.push(c.id);
 }
 this.groups.push(g);this.log('spawn',`${size} personas → ${table.id}`,gid);return g;
 }
 members(g:Group){return this.customers.filter(c=>c.group===g.id);}
 state(g:Group,state:CustomerState,animation:Animation){g.state=state;g.timer=0;for(const c of this.members(g)){c.state=state;c.animation=animation;c.timer=0;}}
 takeOrder(gid:number){const g=this.groups.find(g=>g.id===gid);if(!g||!['waiting','ordering'].includes(g.state))throw new Error('El grupo no está listo para pedir');
 const demand:Partial<Stock>={};for(const c of this.members(g))for(const k of SUPPLIES)demand[k]=(demand[k]??0)+(RECIPES[c.drink].stock[k]??0);
 if(!stockAvailable(this.campaign.stock,demand)){for(const c of this.members(g))c.satisfaction-=25;this.log('stockout','Pedido sin existencias',gid);this.leave(g,false);return false;}
 for(const k of SUPPLIES)this.campaign.stock[k]-=demand[k]??0;
 for(const drink of new Set(this.members(g).map(c=>c.drink))){this.jobs.push({id:this.id++,group:gid,drink,count:this.members(g).filter(c=>c.drink===drink).length,state:'queued',timer:0,quality:.75,manual:false});}
 this.state(g,'waitingDrink','wait');this.log('order','Stock reservado y preparación en cola',gid);return true;
 }
 prepare(jobId:number,quality:number){const j=this.jobs.find(j=>j.id===jobId);if(!j||!['queued','preparing'].includes(j.state))throw new Error('Preparación no disponible');j.manual=true;j.quality=Math.max(0,Math.min(1,quality));j.state='preparing';j.timer=RECIPES[j.drink].seconds*.65;this.log('minigame',`Calidad ${Math.round(j.quality*100)} %`,j.group);}
 startActivity(g:Group){if(!this.members(g).every(c=>c.received))throw new Error('Actividad prohibida antes de recibir bebida');
 this.state(g,'activity',g.activity==='dance'?'dance':g.activity==='concert'?'observe':g.activity==='museum'?'look':g.activity==='upstairs'?'walk':'talk');
 if(g.activity==='upstairs'){
  const upstairs=this.tables.filter(t=>t.floor===1&&t.group===null&&t.dirty===0&&t.capacity>=g.members.length).sort((a,b)=>a.capacity-b.capacity)[0];
  if(!upstairs){g.activity='seated';for(const c of this.members(g))c.activity='seated';this.log('activity','seated',g.id);return;}
  const original=this.tables.find(t=>t.id===g.table)!;original.group=null;original.dirty=g.members.length;upstairs.group=g.id;g.table=upstairs.id;
  for(const [i,c] of this.members(g).entries())c.path=pathfind(c.position,{x:upstairs.x+Math.sin(i*Math.PI*2/g.members.length)*.95,z:upstairs.z+Math.cos(i*Math.PI*2/g.members.length)*.95,floor:1});
  this.log('activity','upstairs',g.id);return;
 }
 const targets:Record<Activity,Point>={seated:{x:0,z:0,floor:0},bar:{x:5.3,z:0,floor:0},dance:{x:0,z:1,floor:0},museum:{x:-7.8,z:.3,floor:0},concert:{x:0,z:-3.6,floor:0},upstairs:{x:1.4,z:-2,floor:1}};
 if(['seated','bar'].includes(g.activity)){this.log('activity',g.activity,g.id);return;}
 for(const [i,c] of this.members(g).entries()){const dest={...targets[g.activity],x:targets[g.activity].x+(i%3)*.6,z:targets[g.activity].z+Math.floor(i/3)*.6};c.path=pathfind(c.position,dest);}
 this.log('activity',g.activity,g.id);
 }
 secondRound(g:Group){const table=this.tables.find(t=>t.id===g.table)!;for(const [i,c] of this.members(g).entries()){c.received=false;c.round++;c.path=pathfind(c.position,{x:table.x+Math.sin(i*Math.PI*2/g.members.length)*.95,z:table.z+Math.cos(i*Math.PI*2/g.members.length)*.95,floor:table.floor});}g.round++;this.state(g,'ordering','order');this.takeOrder(g.id);this.log('round','Segunda ronda',g.id);}
 pay(g:Group){if(g.paid)return;const cs=this.members(g);const total=cs.reduce((n,c)=>n+RECIPES[c.drink].price*c.servedRounds,0);const satisfaction=cs.reduce((n,c)=>n+Math.max(0,Math.min(100,c.satisfaction)),0)/cs.length;const tips=Math.round(total*Math.max(0,(satisfaction-50)/450)*100)/100;
 this.campaign.money+=total+tips;this.ledger.sales+=total;this.ledger.tips+=tips;this.ledger.served+=cs.length;this.ledger.satisfaction+=satisfaction*cs.length;g.paid=true;this.log('pay',`${total.toFixed(2)} € + ${tips.toFixed(2)} €`,g.id);}
 leave(g:Group,paid=true){if(g.state==='gone'||g.state==='leaving')return;if(paid||this.members(g).some(c=>c.servedRounds>0))this.pay(g);if(!paid)this.ledger.lost+=g.members.length;
 this.state(g,'leaving','exit');for(const [i,c] of this.members(g).entries())c.path=pathfind(c.position,{x:(i%3)*.4,z:7.4,floor:0});
 }
 clean(tableId:string){const t=this.tables.find(t=>t.id===tableId);if(!t||t.group!==null||t.dirty===0)throw new Error('No se puede limpiar esta mesa');if(this.campaign.stock.supplies<1)throw new Error('Sin suministros de limpieza');if(t.cleaning>0)return;this.campaign.stock.supplies--;t.cleaning=2.2;this.staff[0].path=pathfind(this.staff[0].position,{x:t.x+1.1,z:t.z,floor:t.floor});this.staff[0].animation='clean';this.log('clean','Recoger → limpiar → liberar');}
 addCart(k:Supply,quantity:number){if(this.phase!=='day')throw new Error('Compra disponible durante el día');this.cart[k]=Math.max(0,this.cart[k]+quantity);}
 get cartCost(){return SUPPLIES.reduce((n,k)=>n+this.cart[k]*PRODUCTS[k].cost,0);}
 buy(){if(this.phase!=='day')throw new Error('Compra de día');if(this.cartCost<=0)throw new Error('Carrito vacío');if(this.cartCost>this.campaign.money)throw new Error('Dinero insuficiente');const pending=this.deliveries.filter(d=>d.state!=='organized').reduce((n,d)=>n+SUPPLIES.reduce((v,k)=>v+d.items[k],0),0);if(this.stockTotal+pending+SUPPLIES.reduce((n,k)=>n+this.cart[k],0)>this.capacity)throw new Error('No cabe en el almacén');this.campaign.money-=this.cartCost;this.ledger.purchases+=this.cartCost;this.deliveries.push({id:this.id++,items:{...this.cart},state:'ordered'});this.cart=EMPTY_STOCK();this.log('purchase','Compra confirmada, distribuidor en camino');}
 receive(id:number){const d=this.deliveries.find(d=>d.id===id);if(!d||d.state!=='ordered')throw new Error('Entrega no disponible');d.state='received';this.log('delivery','Recepción y comprobación');}
 unpack(id:number){const d=this.deliveries.find(d=>d.id===id);if(!d||d.state!=='received')throw new Error('Hay que recibir primero');d.state='opened';this.log('unpack','Cajas abiertas');}
 store(id:number,k:Supply,destination:string){const d=this.deliveries.find(d=>d.id===id);if(!d||d.state!=='opened')throw new Error('Abre la caja');if(destination!==PRODUCTS[k].destination)throw new Error('Destino incorrecto');if(d.items[k]===0)throw new Error('Caja vacía');this.campaign.stock[k]+=d.items[k];d.items[k]=0;if(SUPPLIES.every(k=>d.items[k]===0))d.state='organized';this.log('store',`${PRODUCTS[k].name} → ${destination}`);}
 upgrade(id:UpgradeId){if(this.phase!=='day')throw new Error('Mejora durante el día');if(this.campaign.upgrades.includes(id))throw new Error('Ya instalada');if(this.campaign.money<UPGRADES[id].cost)throw new Error('Dinero insuficiente');this.campaign.money-=UPGRADES[id].cost;this.ledger.purchases+=UPGRADES[id].cost;this.campaign.upgrades.push(id);this.log('upgrade',UPGRADES[id].name);}
 tick(realDt:number){if(this.paused)return;const dt=Math.min(realDt,.2)*this.speed;
 for(const t of this.tables)if(t.cleaning>0){t.cleaning=Math.max(0,t.cleaning-dt);if(t.cleaning===0)t.dirty=0;}
 if(this.phase!=='night')return;this.time+=dt;
 if(this.time>=this.nightDuration)this.close();
 if(!this.closing){this.spawnTimer-=dt;if(this.spawnTimer<=0){const acts:Activity[]=['seated','dance','museum','upstairs',this.selectedEvent==='concert'?'concert':'seated'];this.spawn(undefined,acts[Math.floor(this.random()*acts.length)],this.random()<.35);this.spawnTimer=12/EVENTS[this.selectedEvent].demand;}}
 const neighbors=this.active.map(c=>c.position);
 for(const c of this.active){c.timer+=dt;if(c.path.length){moveAlong(c.position,c.path,dt,1.8,neighbors.filter(n=>n!==c.position));c.animation=c.state==='leaving'?'exit':'walk';}else if(c.state==='activity')c.animation=c.activity==='dance'?'dance':c.activity==='museum'?'look':c.activity==='concert'?'observe':c.activity==='upstairs'?'talk':'drink';}
 for(const g of this.groups){if(g.state==='gone')continue;g.timer+=dt;const cs=this.members(g);const table=this.tables.find(t=>t.id===g.table)!;
  switch(g.state){
   case 'entering':if(cs.every(c=>c.path.length===0)){this.state(g,'seating',table.bar?'stand':'sit');}break;
   case 'seating':if(g.timer>1.5)this.state(g,'waiting','wait');break;
   case 'waiting':if(g.timer>3)this.state(g,'ordering','order');break;
   case 'ordering':if(g.timer>4)this.takeOrder(g.id);break;
   case 'waitingDrink':for(const c of cs)c.satisfaction-=dt*.15;break;
   case 'consuming':if(g.timer>5)this.startActivity(g);break;
   case 'activity':if(g.timer>22+(table.bar?0:9)){if(g.round<2&&!this.closing&&this.random()<.42)this.secondRound(g);else this.state(g,'paying','pay');}break;
   case 'paying':if(g.timer>2)this.leave(g);break;
   case 'leaving':if(cs.every(c=>c.path.length===0)){this.state(g,'gone','idle');table.group=null;table.dirty=table.bar?1:cs.length;this.log('depart','Grupo completo fuera; mesa sucia',g.id);}break;
  }
  if(['waiting','ordering','waitingDrink'].includes(g.state)&&g.timer>70){for(const c of cs)c.satisfaction-=dt*.5;}
 }
 this.updateJobs(dt);
 for(const s of this.staff){if(s.path.length)moveAlong(s.position,s.path,dt,2.4,[]);else if(s.job===null&&s.animation!=='clean')s.animation=s.id==='camarero'?'work':'idle';}
 if(this.closing&&this.active.length===0)this.finishNight();
 }
 private updateJobs(dt:number){
 const slots=this.campaign.upgrades.includes('staff')?2:1;let busy=this.jobs.filter(j=>j.state==='preparing').length;
 for(const j of this.jobs){const g=this.groups.find(g=>g.id===j.group)!;if(g.state==='gone'||g.state==='leaving'){if(j.state!=='served')j.state='served';continue;}
  if(j.state==='queued'&&busy<slots){j.state='preparing';j.timer=0;busy++;this.log('prepare',RECIPES[j.drink].name,g.id);}
  if(j.state==='preparing'){this.staff[1].animation='prepare';j.timer+=dt;const duration=RECIPES[j.drink].seconds*j.count*(this.campaign.upgrades.includes('bar')?.75:1);if(j.timer>=duration){j.state='carrying';j.timer=0;}}
  if(j.state==='carrying'){
   const table=this.tables.find(t=>t.id===g.table)!;const worker=table.bar?this.staff[1]:this.staff[0];
   if(worker.job!==null&&worker.job!==j.id)continue;
   if(worker.job===null){worker.job=j.id;worker.animation='serve';worker.path=table.bar?[]:pathfind(worker.position,{x:table.x+1.1,z:table.z,floor:table.floor});}
   j.timer+=dt;
   if(worker.path.length===0&&j.timer>1.5&&this.members(g).every(c=>c.path.length===0)){j.state='served';worker.job=null;for(const c of this.members(g).filter(c=>c.drink===j.drink)){c.received=true;c.servedRounds++;c.animation='receive';c.satisfaction+=j.quality*8+(this.campaign.upgrades.includes('sound')?8:0)+(this.campaign.upgrades.includes('light')?5:0);}this.log('serve',`${j.count} × ${RECIPES[j.drink].name}`,g.id);
    if(this.members(g).every(c=>c.received)){this.state(g,'consuming','drink');this.log('received','Todo el grupo tiene bebida',g.id);}
   }
  }
 }
 }
 private finishNight(){this.phase='summary';const expenses=35+this.campaign.day*2;this.campaign.money-=expenses;this.ledger.expenses+=expenses;const avg=this.ledger.served?this.ledger.satisfaction/this.ledger.served:50;this.campaign.reputation=Math.max(0,Math.min(100,this.campaign.reputation+(avg-65)/12-this.ledger.lost*.12));this.summary={...this.ledger,day:this.campaign.day,profit:this.ledger.sales+this.ledger.tips-this.ledger.purchases-this.ledger.expenses,reputation:this.campaign.reputation};this.campaign.history.push({...this.ledger});this.log('summary',`Noche cerrada, ${this.ledger.served} clientes`);}
 save():string {return JSON.stringify({schema:1,campaign:this.campaign,playlist:this.playlist,phase:this.phase,time:this.time,groups:this.groups,customers:this.customers,jobs:this.jobs,tables:this.tables,deliveries:this.deliveries,ledger:this.ledger,summary:this.summary,seed:this.seed,id:this.id,selectedEvent:this.selectedEvent,spawnTimer:this.spawnTimer,closing:this.closing,staff:this.staff,cart:this.cart,audit:this.audit});}
 static load(raw:string):Game {
  const data=JSON.parse(raw);if(data.schema!==1||data.campaign?.version!==1||!Number.isFinite(data.campaign.money)||!SUPPLIES.every(k=>Number.isFinite(data.campaign.stock[k])&&data.campaign.stock[k]>=0)||!['day','night','summary'].includes(data.phase)||!Array.isArray(data.customers)||!Array.isArray(data.tables))throw new Error('Guardado incompatible o dañado');
  const game=new Game(data.seed,data.campaign);for(const k of ['phase','time','groups','customers','jobs','tables','deliveries','ledger','summary','id','selectedEvent','spawnTimer','closing','staff','cart','audit','playlist'] as const)if(data[k]!==undefined)Object.assign(game,{[k]:data[k]});for(const c of game.customers)if(c.servedRounds===undefined)c.servedRounds=c.received?c.round:Math.max(0,c.round-1);return game;
 }
}

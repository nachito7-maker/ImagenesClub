export interface Point {x:number;z:number;floor:number;stair?:{from:number;to:number;progress:number};}
export interface Rect {x:number;z:number;w:number;d:number;floor:number;}
export const TABLE_POSITIONS = [
  {id:'t1',x:-6,z:-4.4,floor:0,capacity:2},{id:'t2',x:-5.8,z:-1.25,floor:0,capacity:4},
  {id:'t3',x:-5.8,z:1.9,floor:0,capacity:4},{id:'t4',x:-5.8,z:5.2,floor:0,capacity:4},
  {id:'t5',x:3.85,z:6.2,floor:0,capacity:4},{id:'s1',x:0,z:-6.1,floor:0,capacity:4},
  {id:'u1',x:-4,z:.1,floor:1,capacity:4},{id:'u2',x:-.7,z:1.3,floor:1,capacity:4},{id:'u3',x:2.4,z:3,floor:1,capacity:4},
  {id:'lounge',x:-2,z:-3.2,floor:1,capacity:6}
];
export const OBSTACLES:Rect[] = [
  ...TABLE_POSITIONS.filter(t=>t.id!=='lounge').map(t=>({...t,w:1.5,d:1.5})),
  {x:6.75,z:.2,w:1.5,d:10,floor:0},{x:3.73,z:-6.55,w:2.1,d:1.2,floor:0},
  {x:-3.8,z:-6.6,w:1.4,d:2.5,floor:0},{x:5.65,z:3.93,w:1.35,d:2.7,floor:1},{x:-2,z:-4.2,w:6.5,d:1.1,floor:1},{x:5,z:-4.9,w:3.8,d:1.3,floor:1}
];
export const STAIRS: Record<number,Point> = {0:{x:-3.8,z:-4.45,floor:0},1:{x:5.65,z:2.3,floor:1}};
export const UPPER_ORIGIN={x:-9.45,y:2.2,z:-9.7};
export function stairWorldPose(position:Point){
 const s=position.stair;
 if(!s)return{x:position.x+(position.floor===1?UPPER_ORIGIN.x:0),y:position.floor===1?UPPER_ORIGIN.y:0,z:position.z+(position.floor===1?UPPER_ORIGIN.z:0),rotation:0};
 const p=Math.max(0,Math.min(1,s.to===1?s.progress:1-s.progress));
 // One authored run, including the level landing; floor views are coordinate rebases.
 const run=Math.min(1,p/.94),step=Math.min(11,Math.floor(run*12)),phase=run===1?1:run*12-step;
 // Lift the leading foot before advancing over each riser, not a ramp through tread solids.
 const lift=Math.min(1,phase/.35),advance=Math.max(0,(phase-.35)/.65);
 return{x:STAIRS[0].x,y:2.2*(step+lift)/12,z:STAIRS[0].z-2.75*(step+advance)/12-.2*Math.max(0,(p-.94)/.06),rotation:s.to===1?Math.PI:0};
}
export function stairPose(position:Point,viewFloor:number){
 const pose=stairWorldPose(position);
 if(position.stair?.progress===1){const end=STAIRS[position.stair.to];if(viewFloor===position.stair.to)return{x:end.x,y:0,z:end.z,rotation:pose.rotation};}
 if(viewFloor===1)return{...pose,x:pose.x-UPPER_ORIGIN.x,y:pose.y-UPPER_ORIGIN.y,z:pose.z-UPPER_ORIGIN.z};
 return pose;
}
export function walkable(p:Point):boolean {
 const width=p.floor===0?8.6:6.6, depth=p.floor===0?7.7:5.1;
 return Math.abs(p.x)<width && Math.abs(p.z)<depth && !OBSTACLES.some(r=>r.floor===p.floor&&Math.abs(p.x-r.x)<r.w/2+.1&&Math.abs(p.z-r.z)<r.d/2+.1);
}
export function pathfind(start:Point,end:Point):Point[] {
 if(start.floor!==end.floor) return [...pathfind(start,STAIRS[start.floor]),{...STAIRS[end.floor]},...pathfind(STAIRS[end.floor],end)];
 const step=.45; const key=(x:number,z:number)=>`${x},${z}`;
 const sx=Math.round(start.x/step),sz=Math.round(start.z/step),ex=Math.round(end.x/step),ez=Math.round(end.z/step);
 const open=[{x:sx,z:sz,g:0,f:0}];const parents=new Map<string,string>();const scores=new Map<string,number>([[key(sx,sz),0]]);let found='';
 for(let n=0;open.length&&n<3000;n++) {
  open.sort((a,b)=>a.f-b.f);const c=open.shift()!; const ck=key(c.x,c.z);
  if(Math.hypot(c.x-ex,c.z-ez)<=1.5){found=ck;break;}
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
   const x=c.x+dx,z=c.z+dz,p={x:x*step,z:z*step,floor:end.floor};if(!walkable(p))continue;
   if(dx&&dz&&(!walkable({x:(c.x+dx)*step,z:c.z*step,floor:end.floor})||!walkable({x:c.x*step,z:(c.z+dz)*step,floor:end.floor})))continue;
   const k=key(x,z),g=c.g+Math.hypot(dx,dz);if(g>=(scores.get(k)??Infinity))continue;
   scores.set(k,g);parents.set(k,ck);open.push({x,z,g,f:g+Math.hypot(x-ex,z-ez)});
  }
 }
 if(!found) return [];
 const result:Point[]=[];let cursor=found;
 while(cursor!==key(sx,sz)){const [x,z]=cursor.split(',').map(Number);result.push({x:x*step,z:z*step,floor:end.floor});const previous=parents.get(cursor);if(!previous)break;cursor=previous;}
 const ordered=result.reverse();
 // Stair entry must reach the exact threshold before vertical traversal.
 if(end.x===STAIRS[end.floor].x&&end.z===STAIRS[end.floor].z)ordered.push({...end});
 return ordered;
}
export function moveAlong(position:Point,path:Point[],dt:number,speed:number,neighbors:Point[]):boolean {
 const next=path[0];if(!next)return true;
 if(next.floor!==position.floor){
  // Preserve the traversal in save data; floor ownership changes only at landing.
  position.stair??={from:position.floor,to:next.floor,progress:0};
  position.stair.progress=Math.min(1,position.stair.progress+dt*speed/5.2);
  if(position.stair.progress===1){position.floor=next.floor;position.x=next.x;position.z=next.z;delete position.stair;path.shift();}
  return false;
 }
 const dx=next.x-position.x,dz=next.z-position.z,d=Math.hypot(dx,dz);
 if(d<speed*dt){position.x=next.x;position.z=next.z;path.shift();return path.length===0;}
 let x=position.x+dx/d*speed*dt,z=position.z+dz/d*speed*dt;
 for(const n of neighbors){const dist=Math.hypot(x-n.x,z-n.z);if(n.floor===position.floor&&dist<.34&&dist>.01){x+=(x-n.x)/dist*.05;z+=(z-n.z)/dist*.05;}}
 if(walkable({x,z,floor:position.floor})){position.x=x;position.z=z;}else {const direct={x:position.x+dx/d*speed*dt,z:position.z+dz/d*speed*dt,floor:position.floor};if(walkable(direct)){position.x=direct.x;position.z=direct.z;}else path.splice(0,path.length,...pathfind(position,path[path.length-1]));}
 return false;
}

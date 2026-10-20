import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {Game} from '../core/game';
export class ClubDetails {
 group=new THREE.Group();lastFloor=-1;lastDirt='';ground=new THREE.Group();upper=new THREE.Group();shadows:THREE.InstancedMesh;dirty:THREE.InstancedMesh;dummy=new THREE.Object3D();floorLights:THREE.Mesh[]=[];neon:THREE.Group;
 constructor(scene:THREE.Scene){scene.add(this.group);this.group.add(this.ground,this.upper);
 const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;const ctx=canvas.getContext('2d')!;const gradient=ctx.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'rgba(0,0,0,.55)');gradient.addColorStop(.6,'rgba(0,0,0,.2)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
 this.shadows=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,depthWrite:false}),80);this.shadows.frustumCulled=false;this.group.add(this.shadows);
 this.dirty=new THREE.InstancedMesh(new THREE.CylinderGeometry(.065,.05,.19,8),new THREE.MeshStandardMaterial({color:'#a18866',roughness:.4}),80);this.dirty.frustumCulled=false;this.group.add(this.dirty);
 // Rock neon guitar, positioned on the right rear wall as in the visual reference.
 this.neon=new THREE.Group();const points=[[-.14,0],[-.27,.18],[-.19,.34],[-.11,.33],[-.075,.70],[-.07,.93],[.01,1.05],[.08,.99],[.075,.69],[.035,.35],[.16,.28],[.18,.11],[.07,-.04],[-.14,0]].map(([x,y])=>new THREE.Vector3(x,y,0));const curve=new THREE.CatmullRomCurve3(points);const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,70,.022,5,false),new THREE.MeshBasicMaterial({color:'#ff4283'}));this.neon.add(tube);this.neon.position.set(7,1.25,-7.65);this.neon.scale.setScalar(1.4);this.ground.add(this.neon);
 // Pool the visible light falloff rather than expensive dozens of point lights.
 for(let i=0;i<7;i++){const texCanvas=document.createElement('canvas');texCanvas.width=64;texCanvas.height=64;const c=texCanvas.getContext('2d')!;const color=['238,50,135','65,105,255','243,163,55'][i%3];const g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,`rgba(${color},.40)`);g.addColorStop(1,`rgba(${color},0)`);c.fillStyle=g;c.fillRect(0,0,64,64);const m=new THREE.Mesh(new THREE.PlaneGeometry(2.7,4.3),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(texCanvas),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));m.rotation.x=-Math.PI/2;m.position.set(-1.7+(i%3)*1.7,.055,-2.7+Math.floor(i/3)*2.5);this.ground.add(m);this.floorLights.push(m);}
 // Brass inset dance-floor perimeter and entry inlay star.
 const brass=new THREE.MeshStandardMaterial({color:'#9a7048',metalness:.65,roughness:.45});for(const x of [-2.3,2.5]){const strip=new THREE.Mesh(new THREE.BoxGeometry(.025,.02,8.5),brass);strip.position.set(x,.052,0);this.ground.add(strip);}for(const z of [-4.25,4.25]){const strip=new THREE.Mesh(new THREE.BoxGeometry(4.8,.02,.025),brass);strip.position.set(.1,.052,z);this.ground.add(strip);}
 const shape=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?.22:.52;const x=Math.cos(a)*r,z=Math.sin(a)*r;i?shape.lineTo(x,z):shape.moveTo(x,z);}shape.closePath();const star=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({color:'#c59c54',side:THREE.DoubleSide}));star.rotation.x=-Math.PI/2;star.position.set(0,.092,7);this.ground.add(star);
 this.dressRoom();
 }
 private dressRoom(){
  // Offline-authored display graphics: no invented historic photo provenance.
  const buckets=new Map<string,THREE.BufferGeometry[]>();
  const box=(x:number,y:number,z:number,w:number,h:number,d:number,color:string)=>{const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);const list=buckets.get(color)??[];list.push(g);buckets.set(color,list);};
  const cylinder=(x:number,y:number,z:number,r:number,h:number,color:string)=>{const g=new THREE.CylinderGeometry(r,r,h,12);g.translate(x,y,z);const list=buckets.get(color)??[];list.push(g);buckets.set(color,list);};
  const label=(text:string,x:number,y:number,z:number,w:number,h:number,left=false)=>{const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d')!;ctx.fillStyle='#17111b';ctx.fillRect(0,0,512,256);ctx.strokeStyle='#bf9354';ctx.lineWidth=8;ctx.strokeRect(12,12,488,232);ctx.fillStyle='#edc78e';ctx.textAlign='center';ctx.font='bold 34px Georgia';text.split('|').forEach((s,i)=>ctx.fillText(s,256,85+i*55));const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex}));m.position.set(x,y,z);if(left)m.rotation.y=Math.PI/2;this.ground.add(m);};
  label('MUSEO DEL ROCK|VALENCIANO',-8.05,2.9,.2,3.8,.64,true);
  for(let i=0;i<5;i++){const z=-2.6+i*1.4;box(-8.08,.54,z,.22,.10,1.25,'#be965a');box(-8.09,2.68,z,.22,.045,1.22,'#efbf6d');label(['GUITARRAS|Colección del club','VINILO|Archivo sonoro','ESCENA LOCAL|Memoria viva','EN DIRECTO|Instrumentos','ROCK VALENCIÀ|Colección'][i],-7.99,.78,z,.8,.24,true);}
  // Framed concert handbills beside DJ; originals, not historical claims.
  label('IMÁGENES|LIVE SESSIONS',5.7,1.8,-7.57,.8,1.15);label('VALÈNCIA|ROCK · CLUB',6.8,1.8,-7.57,.8,1.15);
  // Backbar glassware, espresso machine, drip tray and cocktail tools.
  for(let i=0;i<18;i++){const z=-4.25+i*.48;cylinder(8.05,2.05,z,.06,.2,'#ced5cf');cylinder(8.05,2.17,z,.075,.025,'#b79e71');}
  box(7.78,1.46,1.6,.58,.5,.82,'#92959a');box(7.45,1.48,1.6,.04,.22,.65,'#26232c');box(7.4,1.23,1.6,.22,.04,.76,'#92959a');
  for(const z of [1.35,1.65]){cylinder(7.35,1.33,z,.07,.12,'#e9d3b3');box(7.38,1.68,z,.06,.09,.10,'#24212c');}
  box(6.48,1.47,2.5,.60,.03,.7,'#25212a');cylinder(6.55,1.65,2.5,.065,.3,'#92959a');
  for(const z of [-2.7,-2.3,3.7]){cylinder(6.46,1.61,z,.055,.30,'#376b51');cylinder(6.46,1.80,z,.025,.12,'#376b51');}
  // Amplifiers, monitors and cables belong to performance area, not circulation.
  for(const x of [-1.65,1.65]){box(x,.96,-7.05,.7,.7,.40,'#25212a');box(x,.98,-6.82,.60,.48,.025,'#67605a');box(x,1.27,-6.80,.48,.035,.025,'#be965a');box(x,.65,-5.0,.58,.26,.36,'#25212a');}
  for(const x of [-1.1,1.1]){cylinder(x,1.24,-6.0,.018,1.42,'#92959a');cylinder(x,.56,-6.0,.16,.025,'#25212a');}
  for(let i=0;i<14;i++)box(-1.5+i*.23,.56,-6.95+Math.sin(i*.7)*.18,.25,.012,.025,'#25212a');
  // Table service varies subtly, while keeping the walking lanes clear.
  for(const [i,table] of [{x:-6,z:-4.4},{x:-5.8,z:-1.25},{x:-5.8,z:1.9},{x:-5.8,z:5.2},{x:3.85,z:6.2}].entries()){
   box(table.x-.22,.916,table.z+.12,.18,.012,.14,'#e9d3b3');
   cylinder(table.x+.24,.98,table.z-.18,.07,.16,'#ced5cf');
   if(i%2===0){cylinder(table.x-.25,1.07,table.z-.16,.055,.31,'#376b51');cylinder(table.x-.25,1.27,table.z-.16,.023,.10,'#376b51');}
   else box(table.x+.18,.935,table.z+.21,.14,.05,.11,'#be965a');
  }
  // Sink rim, basin, draining board, folded cloth and speed-rail dividers.
  box(7.7,1.15,-.3,.7,.10,1.05,'#92959a');box(7.7,1.21,-.3,.51,.025,.79,'#25212a');
  cylinder(7.94,1.43,-.65,.025,.45,'#92959a');box(7.85,1.65,-.65,.21,.04,.04,'#92959a');
  box(7.7,1.23,.42,.63,.03,.30,'#e9d3b3');
  for(let i=0;i<6;i++)box(7.72,1.22,-1.0-i*.08,.5,.015,.02,'#92959a');
  // Display tambourine, archival ticket and vintage microphone within the cabinet.
  cylinder(-7.98,1.13,-.65,.12,.025,'#be965a');box(-7.97,1.42,1.55,.05,.51,.06,'#92959a');
  box(-7.97,1.74,1.55,.12,.17,.12,'#92959a');
  for(let i=0;i<4;i++)box(-7.9,1.1+i*.19,3,.025,.13,.35,'#e9d3b3');
  for(const [color,gs] of buckets){const merged=mergeGeometries(gs);gs.forEach(g=>g.dispose());const mesh=new THREE.Mesh(merged,new THREE.MeshStandardMaterial({color,roughness:.6,metalness:color==='#92959a'?.65:.12}));mesh.castShadow=true;mesh.receiveShadow=true;this.ground.add(mesh);}
  // Few purposeful real lights plus pooled falloff; dark circulation stays legible.
  for(const [x,y,z,color,power,range] of [[6.5,2.7,0,'#ffbf74',38,12],[-7.7,2.5,0,'#ffdd96',34,12],[-5.8,2.3,4,'#ffc172',16,7],[0,2,6.7,'#ffd190',16,7],[0,2.8,-6,'#e659ae',24,9]] as [number,number,number,string,number,number][]){const light=new THREE.PointLight(color,power,range,2);light.position.set(x,y,z);this.ground.add(light);}
  const up=new THREE.PointLight('#ffc582',26,15,2);up.position.set(-2,3,-1);this.upper.add(up);
 }
 update(game:Game,floor:number,cellar:boolean,t:number){this.group.visible=!cellar;this.ground.visible=floor===0;this.upper.visible=floor===1;this.floorLights.forEach((m,i)=>{m.visible=game.phase==='night';(m.material as THREE.MeshBasicMaterial).opacity=.5+Math.sin(t*.75+i)*.12;});let shadows=0,dirty=0;
 const staticProps=floor===0?[[-6,-4.4,2.8,2.8],[-5.8,-1.25,3,3],[-5.8,1.9,3,3],[-5.8,5.2,3,3],[3.85,6.2,3,3],[3.73,-6.55,2.3,1.6],[0,-6.2,5,3],[-7,6.4,3.3,1.3],[-7,-4.2,2.8,1.3]]:[[-4,.1,3,3],[-.7,1.3,3,3],[2.4,3,3,3],[-2,-4.15,7,1.7]];
 if(this.lastFloor!==floor){
 for(const [x,z,sx,sz] of staticProps){this.dummy.position.set(x,.045,z);this.dummy.rotation.set(-Math.PI/2,0,0);this.dummy.scale.set(sx,sz,1);this.dummy.updateMatrix();this.shadows.setMatrixAt(shadows++,this.dummy.matrix);}
 if(floor===0)for(let i=0;i<8;i++){this.dummy.position.set(5.58,.045,-4.4+i*1.25);this.dummy.rotation.set(-Math.PI/2,0,0);this.dummy.scale.set(.8,.8,1);this.dummy.updateMatrix();this.shadows.setMatrixAt(shadows++,this.dummy.matrix);}
 this.shadows.count=shadows;this.shadows.instanceMatrix.needsUpdate=true;this.lastFloor=floor;this.lastDirt='';
 }
 const dirtKey=game.tables.filter(table=>table.floor===floor).map(table=>`${table.id}:${table.dirty}`).join('|');
 if(this.lastDirt===dirtKey)return;
 this.lastDirt=dirtKey;
 for(const table of game.tables.filter(t=>t.floor===floor&&t.dirty)){for(let i=0;i<table.dirty;i++){this.dummy.position.set(table.x+Math.sin(i*3)*.22,table.bar?1.55:.96,table.z+Math.cos(i*3)*.22);this.dummy.rotation.set(0,0,0);this.dummy.scale.set(1,1,1);this.dummy.updateMatrix();this.dirty.setMatrixAt(dirty++,this.dummy.matrix);}}
 this.dirty.count=dirty;this.dirty.instanceMatrix.needsUpdate=true;
 }
}

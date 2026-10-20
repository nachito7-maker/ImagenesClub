import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import type {Animation, Appearance} from '../core/game';
type ModuleName='torso'|'face'|'sleeve'|'hand'|'trouser'|'shoe'|'hair'|'dress'|'longDress';
const modules=new Map<ModuleName,THREE.BufferGeometry>();
export async function loadCharacterLibrary(){
 const gltf=await new GLTFLoader().loadAsync('/assets/models/character-library.glb');
 gltf.scene.updateMatrixWorld(true);
 gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh){const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);g.computeVertexNormals();modules.set(o.name as ModuleName,g);}});
 for(const name of ['torso','face','sleeve','hand','trouser','shoe','hair','dress','longDress'] as ModuleName[])if(!modules.has(name))throw new Error(`Missing Blender character module: ${name}`);
}
export function applyCharacterLibrary(actor:Actor){actor.root.traverse(o=>{if(o instanceof THREE.Mesh&&o.userData.module){const g=modules.get(o.userData.module);if(g)o.geometry=g;}});actor.root.userData.blenderModules=modules.size>0;}

const geometry={sphere:new THREE.SphereGeometry(1,24,18),capsule:new THREE.CapsuleGeometry(.10,.30,6,16),box:new THREE.BoxGeometry(1,1,1),cylinder:new THREE.CylinderGeometry(1,1,1,24),torus:new THREE.TorusGeometry(1,.10,8,24)};
const materials=new Map<string,THREE.MeshStandardMaterial>();
function material(color:string){let m=materials.get(color);if(!m){m=new THREE.MeshStandardMaterial({color,roughness:.82});materials.set(color,m);}return m;}
const skins=['#e2b18b','#c79272','#a66e4d','#f0c4a4','#77503e'];
const hairs=['#24212a','#6a4835','#c3aa6d','#8d8f91','#4b3027','#e4d19e'];
const clothes=['#272633','#743646','#33516a','#465b48','#c6a277','#783d2c','#d3c9b4','#373140','#975168'];
export interface Actor {root:THREE.Group;body:THREE.Group;head:THREE.Group;arms:THREE.Group[];legs:THREE.Group[];cup:THREE.Mesh;appearance:Appearance;}
export function createActor(a:Appearance,role?:string):Actor {
 a={...a};if(role==='owner'){a.female=true;a.age=55;a.hair=5;a.hairStyle=3;a.clothing=0;}if(role==='waitress'){a.female=true;a.age=38;a.hair=2;a.hairStyle=3;a.clothing=1;}if(role==='waiter'){a.female=false;a.age=60;a.hair=3;a.hairStyle=0;a.clothing=6;}if(role==='dj'){a.female=false;a.age=58;a.hair=3;a.hairStyle=2;a.clothing=0;a.accessory=1;}
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);
 const add=(parent:THREE.Object3D,g:THREE.BufferGeometry,color:string,pos:number[],scale:number[])=>{const m=new THREE.Mesh(g,material(color));m.position.set(pos[0],pos[1],pos[2]);m.scale.set(scale[0],scale[1],scale[2]);parent.add(m);return m;};
 const part=(parent:THREE.Object3D,name:ModuleName,fallback:THREE.BufferGeometry,color:string,pos:number[],scale:number[])=>{const mesh=add(parent,modules.get(name)??fallback,color,pos,scale);mesh.userData.module=name;return mesh;};
 const skin=skins[a.skin%5],hair=hairs[a.hair%6],shirt=role==='owner'?'#25212e':role==='waitress'?'#38283c':clothes[a.clothing%9];const width=.25+a.body*.08;
 root.name=role?`principal-${role}`:`customer-${a.age}`;
 root.userData={role:role??'customer',age:a.age,style:'crafted-isometric'};
 part(body,'torso',geometry.sphere,shirt,[0,1.08,0],[width,.34,.19]);
 root.scale.set(1+a.body*.09, .94+(a.age%7)*.018,1+a.body*.06);
 // Distinct silhouettes: waistcoats, leather lapels, collars and belt hardware.
 if(a.style===0||role==='dj'){for(const side of [-1,1]){const lapel=add(body,geometry.box,'#17151c',[side*.11,1.14,.18],[.14,.37,.05]);lapel.rotation.z=side*.16;}add(body,geometry.box,'#bca477',[.16,1.02,.212],[.055,.025,.012]);}
 if(a.style===2){add(body,geometry.box,'#d3c9b4',[0,1.13,.185],[.10,.32,.025]);for(let i=0;i<4;i++)add(body,geometry.sphere,'#272633',[0,.99+i*.075,.21],[.012,.012,.01]);}
 if(a.style===3){add(body,geometry.torus,'#743646',[0,1.35,0],[.13,.13,.13]).rotation.x=Math.PI/2;add(body,geometry.box,'#743646',[.12,1.16,.21],[.075,.30,.04]);}
 add(body,geometry.box,'#211e27',[0,.80,.03],[width*1.75,.065,.34]);add(body,geometry.box,'#bca477',[0,.80,.211],[.075,.05,.02]);
 if(a.female)part(body,role==='owner'?'longDress':'dress',geometry.cylinder,shirt,[0,role==='owner'?.48:.75,0],[width*1.15,role==='owner'?.43:.16,.25]);
 add(body,geometry.cylinder,skin,[0,1.39,0],[.071,.13,.071]);
 const head=new THREE.Group();head.position.y=1.61;head.scale.set(.91+a.body*.17, .94+(a.age%5)*.025,1);body.add(head);part(head,'face',geometry.sphere,skin,[0,0,0],[.175,.225,.17]);
 // Sculpted jaw, cheekbones, lips and forehead replace a single blank head blob.
 for(const side of [-1,1]){add(head,geometry.sphere,skin,[side*.105,-.065,.11],[.072,.085,.059]);add(head,geometry.box,'#d39a7f',[side*.10,-.085,.159],[.043,.012,.014]);}
 add(head,geometry.sphere,skin,[0,-.155,.05],[.108,.066,.105]);
 part(head,'hair',geometry.sphere,hair,[0,.12,-.015],[.193,.16,.173]);
 if(a.hairStyle>=3){for(const side of [-1,1])for(let i=0;i<5;i++){const lock=part(head,'hair',geometry.capsule,hair,[side*(.12+i*.012),-.10,.025-i*.027],[.045,.24+(i%2)*.035,.055]);lock.rotation.z=side*(.10+i*.025);}for(let i=0;i<4;i++)part(head,'hair',geometry.capsule,hair,[-.12+i*.08,-.10,-.125],[.046,.27,.06]);}
 if(a.hairStyle===2)for(let i=0;i<8;i++)add(head,geometry.sphere,hair,[Math.cos(i)*.14,.19+Math.sin(i)*.025,Math.sin(i)*.10],[.06,.07,.06]);
 for(const side of [-1,1]){add(head,geometry.sphere,'#f8e4cc',[side*.068,.015,.153],[.035,.025,.014]);add(head,geometry.sphere,'#24212a',[side*.068,.015,.169],[.013,.017,.009]);add(head,geometry.sphere,skin,[side*.184,-.007,0],[.036,.062,.035]);add(head,geometry.box,hair,[side*.066,.064,.158],[.064,.012,.015]);}
 add(head,geometry.sphere,skin,[0,-.032,.167],[.032,.045,.035]);add(head,geometry.box,'#80514c',[0,-.10,.149],[.060,.013,.013]);
 if(a.age>48)for(const side of [-1,1])add(head,geometry.box,'#a57560',[side*.10,-.015,.15],[.045,.006,.012]);
 if(a.accessory===1||role==='dj'){
  for(const side of [-1,1]){const rim=add(head,geometry.torus,'#a69578',[side*.073,.025,.177],[.051,.039,.039]);rim.rotation.y=0;}add(head,geometry.box,'#a69578',[0,.03,.181],[.05,.008,.009]);
 }
 if(a.accessory===2){add(body,geometry.torus,'#bca477',[0,1.3,.05],[.15,.14,.14]).rotation.x=Math.PI/2;}
 if(a.style===1){add(body,geometry.box,'#a7977e',[0,1.12,.18],[.13,.11,.015]);}
 if(a.hairStyle===1){add(head,geometry.sphere,skin,[0,.15,.065],[.15,.11,.12]);}
 if(a.hairStyle===4){add(head,geometry.sphere,hair,[0,.10,.15],[.19,.065,.08]);add(head,geometry.sphere,hair,[0,-.08,-.15],[.075,.12,.09]);}
 if(a.accessory===3){for(const side of [-1,1])add(head,geometry.torus,'#bca477',[side*.19,-.06,0],[.035,.05,.035]);}
 if(a.accessory===4&&!a.female)add(head,geometry.sphere,hair,[0,-.13,.11],[.135,.08,.08]);
 if(role==='dj'){for(const side of [-1,1])add(head,geometry.box,'#17151c',[side*.20,0,0],[.065,.13,.13]);add(head,geometry.torus,'#17151c',[0,.05,0],[.22,.22,.20]);}
 const arms:THREE.Group[]=[];const legs:THREE.Group[]=[];
 for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*(width+.035),1.28,0);body.add(arm);part(arm,'sleeve',geometry.capsule,shirt,[0,-.16,0],[.08,.24,.08]);part(arm,'sleeve',geometry.capsule,skin,[0,-.39,.015],[.061,.17,.061]);part(arm,'hand',geometry.sphere,skin,[0,-.57,.02],[.064,.08,.061]);arms.push(arm);
  const leg=new THREE.Group();leg.position.set(side*.13,.76,0);body.add(leg);part(leg,'trouser',geometry.capsule,a.female?skin:'#344255',[0,-.27,0],[.086,.38,.086]);part(leg,'shoe',geometry.sphere,'#211e27',[0,-.66,.05],[.10,.075,.18]);legs.push(leg);
 }
 // Stitching, cuffs, pockets, denim seams and visible small hand/thumb silhouettes.
 if(role==='waiter'||(!a.female&&a.style===2)){for(const side of [-1,1]){const collar=add(body,geometry.box,'#f1dfbf',[side*.085,1.32,.15],[.10,.055,.035]);collar.rotation.z=side*.45;add(body,geometry.box,'#a49782',[side*.13,1.17,.182],[.08,.07,.018]);}for(let i=0;i<5;i++)add(body,geometry.sphere,'#bfa368',[0,.9+i*.085,.196],[.012,.012,.012]);}
 if(role==='waitress'||role==='owner'){add(body,geometry.torus,'#deb473',[0,1.31,.06],[.115,.11,.11]).rotation.x=Math.PI/2;add(body,geometry.sphere,'#f0ca82',[0,1.20,.198],[.023,.034,.018]);}
 if(role==='dj'){add(body,geometry.torus,'#dbb584',[0,1.11,.18],[.10,.11,.05]);add(body,geometry.box,'#c78369',[0,1.10,.19],[.06,.1,.017]);}
 for(const [i,arm] of arms.entries()){add(arm,geometry.torus,'#d6b074',[0,-.47,0],[.064,.052,.064]).rotation.x=Math.PI/2;add(arm,geometry.sphere,skin,[i===0?.05:-.05,-.54,.06],[.025,.045,.024]);}
 for(const leg of legs){if(!a.female){add(leg,geometry.box,'#73869b',[.065,-.28,.035],[.012,.41,.012]);add(leg,geometry.box,'#516c87',[0,-.1,.083],[.09,.10,.018]);}add(leg,geometry.box,'#a79486',[0,-.68,.15],[.12,.025,.09]);}
 const cup=add(arms[1],geometry.cylinder,'#dbb66d',[0,-.56,.09],[.045,.13,.045]);cup.visible=false;
 const actor={root,body,head,arms,legs,cup,appearance:a};applyCharacterLibrary(actor);return actor;
}
export function animateActor(actor:Actor,state:Animation,t:number,hasDrink=false){
 const {body,head,arms,legs}=actor;const phase=t*6.5;body.position.y=0;body.rotation.set(0,0,0);head.rotation.set(0,Math.sin(t*.8)*.10,0);for(const a of arms)a.rotation.set(0,0,0);for(const l of legs)l.rotation.set(0,0,0);
 const walking=['walk','enter','exit'].includes(state);
 if(walking){body.position.y=Math.abs(Math.sin(phase))*.045;for(let i=0;i<2;i++){legs[i].rotation.x=Math.sin(phase+i*Math.PI)*.48;arms[i].rotation.x=-Math.sin(phase+i*Math.PI)*.37;}}
 else if(state==='dance'){body.position.y=Math.abs(Math.sin(t*4))*.09;body.rotation.z=Math.sin(t*3)*.13;body.rotation.y=Math.sin(t*2)*.15;arms[0].rotation.z=-.8-Math.sin(t*4)*.35;arms[1].rotation.z=.8+Math.cos(t*4)*.35;legs[0].rotation.x=Math.sin(t*3)*.2;legs[1].rotation.x=-Math.sin(t*3)*.2;}
 else if(['sit','drink','talk','pay'].includes(state)){body.position.y=-.22;legs.forEach(l=>l.rotation.x=-1.15);arms[0].rotation.x=state==='talk'?-.45+Math.sin(t*2.3)*.22:state==='pay'?-.8:-.25;arms[1].rotation.x=state==='drink'?-1.4+Math.sin(t*1.2)*.2:state==='talk'?-.5+Math.cos(t*1.7)*.15:-.5;head.rotation.x=state==='drink'?-.1:Math.sin(t)*.05;}
 else if(['prepare','work','serve','clean'].includes(state)){arms[0].rotation.x=-.75+Math.sin(t*7)*.2;arms[1].rotation.x=-.9-Math.sin(t*7)*.2;body.rotation.x=state==='clean'?.2:0;}
 else if(['order','receive','react'].includes(state)){arms[1].rotation.x=-.7-Math.sin(t*3)*.15;arms[1].rotation.z=.4;}
 else if(state==='look'){body.rotation.y=Math.sin(t*.6)*.18;head.rotation.x=-.14;arms[1].rotation.x=-.65+Math.sin(t)*.15;}
 else if(state==='observe'){body.position.y=Math.sin(t*3)*.018;arms[0].rotation.x=-.35-Math.max(0,Math.sin(t*2))*.55;arms[1].rotation.x=-.35-Math.max(0,Math.sin(t*2))*.55;}
 else if(state==='wait'||state==='stand'){body.rotation.z=Math.sin(t*.7)*.025;arms[0].rotation.x=-.15;arms[1].rotation.x=-.2+Math.sin(t)*.04;}
 else{body.position.y=Math.sin(t*2)*.008;arms[0].rotation.z=-.09;arms[1].rotation.z=.09;head.rotation.y=Math.sin(t*.75)*.2;}
 actor.cup.visible=hasDrink;
}

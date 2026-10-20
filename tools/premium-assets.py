import bpy, math, random
from mathutils import Vector
ROOT='/Users/indenova/AndroidStudioProjects/ImagenesClub'
scene=bpy.data.scenes.get('ImagenesClub_Remodel_2026')
if scene is None:raise RuntimeError('Expected current remodel scene')
bpy.context.window.scene=scene
for o in list(scene.objects):
 if o.name.startswith('Premium_'):bpy.data.objects.remove(o,do_unlink=True)
materials={}
def mat(name,color,rough=.65):
 m=bpy.data.materials.get('Premium_'+name) or bpy.data.materials.new('Premium_'+name);m.use_nodes=True
 p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');rgb=[int(color[i:i+2],16)/255 for i in (1,3,5)];p.inputs['Base Color'].default_value=tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb)+(1,);p.inputs['Roughness'].default_value=rough;materials[name]=m;return m
for i,color in enumerate(['#986641','#9c6943','#a06c46','#a57048','#a8744b','#ac784e']):mat('oak'+str(i),color,.56+i*.025)
random.seed(713)
for name,width,depth in [('ground',18,16),('upper',14,11),('cellar',14,11)]:
 col=next(c for c in scene.collection.children if 'IC_'+name in c.name)
 buckets=[[] for _ in range(6)]
 # New physical boards overlay only the old foundation, not furnishings or entry carpet.
 for row in range(math.ceil(depth/.19)):
  y=-depth/2+row*.19+.095
  offset=(row%4)*.55
  x=-width/2-offset
  while x<width/2:
   left=max(-width/2,x);right=min(width/2,x+2.2)
   if right-left>.02:
    bpy.ops.mesh.primitive_cube_add(size=1,location=((left+right)/2,y,.034));o=bpy.context.object;o.name='Premium_board';o.scale=(right-left-.012,.182,.012);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    for c in list(o.users_collection):c.objects.unlink(o)
    col.objects.link(o);index=random.randrange(6);o.data.materials.append(materials['oak'+str(index)]);buckets[index].append(o)
   x+=2.2
 for i,objects in enumerate(buckets):
  bpy.ops.object.select_all(action='DESELECT')
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();bpy.context.object.name='Premium_'+name+'_oak'+str(i)
 bpy.ops.object.select_all(action='DESELECT')
 for o in col.objects:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=ROOT+'/public/assets/models/'+name+'.glb',use_selection=True,use_active_scene=True,export_format='GLB',export_yup=True,export_cameras=False,export_lights=False)
bpy.data.libraries.write(ROOT+'/artifacts/imagenes-club-premium.blend',{scene},fake_user=True)
# Small normalized modular body library; runtime shares meshes/materials and existing articulated pivots.
rig=bpy.data.scenes.get('ImagenesClub_CharacterLibrary') or bpy.data.scenes.new('ImagenesClub_CharacterLibrary');bpy.context.window.scene=rig
for o in list(rig.objects):bpy.data.objects.remove(o,do_unlink=True)
cloth=mat('character-neutral','#ffffff')
def rings(name,levels,segments=24):
 verts=[]
 for y,rx,rz,cz in levels:
  for i in range(segments):
   a=math.tau*i/segments;verts.append((math.cos(a)*rx,math.sin(a)*rz+cz,y))
 faces=[]
 for row in range(len(levels)-1):
  for i in range(segments):
   a=row*segments+i;b=row*segments+(i+1)%segments;faces.append((a,b,b+segments,a+segments))
 faces.append(tuple(reversed(range(segments))));faces.append(tuple(range((len(levels)-1)*segments,len(levels)*segments)))
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);rig.collection.objects.link(o);o.data.materials.append(cloth)
 for p in mesh.polygons:p.use_smooth=True
 return o
# Tailored shoulder/waist rather than ellipsoid torso; jaw/cheek/forehead face profile.
rings('torso',[(-1,.62,.65,0),(-.8,.72,.8,0),(-.25,.79,.91,0),(.3,.97,.98,0),(.65,1,.85,0),(.85,.67,.63,0),(1,.31,.45,0)])
rings('face',[(-1,.29,.4,.10),(-.8,.6,.67,.09),(-.45,.87,.89,.02),(-.1,1,1,0),(.4,.96,.95,-.015),(.75,.81,.83,-.04),(1,.45,.49,-.05)])
rings('sleeve',[(-1,.65,.64,0),(-.7,.73,.74,0),(.2,.94,.85,0),(.65,1,.93,0),(1,.78,.7,0)])
rings('hand',[(-1,.50,.50,.1),(-.6,.86,.7,.04),(.1,1,.8,0),(.65,.8,.7,0),(1,.6,.6,0)],16)
rings('trouser',[(-1,.65,.66,0),(-.6,.72,.74,0),(-.1,.82,.82,0),(.35,.97,.96,0),(1,1,1,0)],20)
rings('shoe',[(-1,.78,.81,.15),(-.55,1,1,.14),(.15,.94,.94,.08),(.55,.68,.7,-.1),(1,.4,.4,-.16)],20)
rings('hair',[(-1,.55,.65,-.15),(-.65,.92,.92,-.12),(-.1,1,1,-.06),(.5,.89,.91,0),(1,.35,.4,0)],24)
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=ROOT+'/public/assets/models/character-library.glb',use_selection=True,use_active_scene=True,export_format='GLB',export_yup=True)
bpy.data.libraries.write(ROOT+'/artifacts/imagenes-club-characters.blend',{rig},fake_user=True)
print('Physical oak floors and modular character library exported')

import bpy, math
from mathutils import Vector
ROOT='/Users/indenova/AndroidStudioProjects/ImagenesClub'
source=bpy.data.scenes['ImagenesClub_2026_Fresh']
scene=bpy.data.scenes.get('ImagenesClub_Polish_2026')
if scene is None:
 scene=source.copy();scene.name='ImagenesClub_Polish_2026'
 # Copy collections and objects: never alter an earlier scene or another task.
 for col in list(scene.collection.children):
  scene.collection.children.unlink(col)
  nc=bpy.data.collections.new('Polish_'+col.name);scene.collection.children.link(nc)
  for obj in col.objects:
   copy=obj.copy()
   if obj.data:copy.data=obj.data.copy()
   nc.objects.link(copy)
bpy.context.window.scene=scene
col=next(c for c in scene.collection.children if c.name.startswith('Polish_IC_ground'))
materials={}
def mat(name,color,emission=0):
 m=bpy.data.materials.new('IC_polish_'+name);m.use_nodes=True;p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
 def linear(v):return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
 rgb=[int(color[i:i+2],16)/255 for i in (1,3,5)];p.inputs['Base Color'].default_value=(*[linear(v) for v in rgb],1);p.inputs['Roughness'].default_value=.6
 if emission:p.inputs['Emission Color'].default_value=(*rgb,1);p.inputs['Emission Strength'].default_value=emission
 materials[name]=m
mat('brass','#b38f52');mat('amber','#ffd495',2);mat('velvet','#301b27');mat('paper','#dcc292');mat('steel','#87898d');mat('black','#17151c')
def box(name,p,s,m):
 bpy.ops.mesh.primitive_cube_add(size=1,location=p);o=bpy.context.object;o.name=name;o.scale=s
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o);o.data.materials.append(materials[m]);return o
# Museum: light strips, red velvet display beds, brass cornice and deep glass cabinet.
for y in [-2.6,-1.2,.2,1.6,3.0]:
 box('exhibit brass mullion',(-8.02,y,1.6),(.055,.045,2.20),'brass')
for z in [.58,2.64]:box('exhibit cornice',(-8.06,.2,z),(.34,6.9,.085),'brass')
box('museum led strip',(-8.02,.2,2.59),(.06,6.8,.035),'amber')
for y in [-2,-.65,.7,2.2]:
 box('exhibit plinth',(-8.05,y,.70),(.47,1.1,.11),'velvet')
 box('exhibit information plate',(-7.80,y,.79),(.025,.42,.13),'paper')
# Entrance flanking ticket-like archival wall boards: avoid blocking doorway.
for x in [-3.2,3.2]:
 box('archive board frame',(x,-7.7,1.35),(.70,.10,1.10),'brass')
 box('archive board backing',(x,-7.76,1.35),(.61,.025,1.0),'black')
 for j in range(4):box('archive ticket',(x,-7.79,1.05+j*.20),(.45,.015,.12),'paper')
# Back wall drumstick and microphone memorabilia between portraits.
for x in [-7.25,-6.15,5.1]:
 box('memorabilia frame',(x,7.69,1.85),(.34,.08,.83),'brass')
 box('memorabilia velvet',(x,7.64,1.85),(.27,.02,.75),'velvet')
 box('archived drumstick',(x,7.62,1.85),(.025,.02,.52),'paper')
# Merge added decor only, by material, keeping bounded draw calls.
for m in materials.values():
 objects=[o for o in col.objects if o.type=='MESH' and o.data.materials and o.data.materials[0]==m]
 if not objects:continue
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();bpy.context.object.name='Polish_'+m.name
for name in ['ground','upper','cellar']:
 c=next(c for c in scene.collection.children if c.name.startswith('Polish_IC_'+name))
 bpy.ops.object.select_all(action='DESELECT')
 for o in c.objects:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=ROOT+'/public/assets/models/'+name+'.glb',use_selection=True,use_active_scene=True,export_format='GLB',export_yup=True,export_cameras=False,export_lights=False)
# Studio validation lights are isolated to this scene, not exported as runtime lighting.
for x,y,power in [(6.5,0,300),(-7,0,220),(0,6,160)]:
 bpy.ops.object.light_add(type='AREA',location=(x,y,3.8));o=bpy.context.object;o.data.energy=power;o.data.color=(1,.64,.30);o.data.size=4
scene.render.resolution_x=1000;scene.render.resolution_y=650;scene.cycles.samples=16
scene.render.filepath=ROOT+'/artifacts/blender-polish.png'
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/artifacts/imagenes-club-polish.blend')
print('Polish source and GLBs saved in isolated scene',scene.name)

import bpy, math
from mathutils import Vector
ROOT='/Users/indenova/AndroidStudioProjects/ImagenesClub'
source=bpy.data.scenes.get('ImagenesClub_Polish_2026')
if source is None:raise RuntimeError('Expected existing polish scene; do not recreate the game')
scene=bpy.data.scenes.get('ImagenesClub_Remodel_2026')
if scene is None:
 scene=bpy.data.scenes.new('ImagenesClub_Remodel_2026')
 for c in source.collection.children:
  nc=bpy.data.collections.new('Remodel_'+c.name);scene.collection.children.link(nc)
  for obj in c.objects:
   o=obj.copy();o.data=obj.data.copy() if obj.data else None;nc.objects.link(o)
bpy.context.window.scene=scene
# Only replace this script's authored additions when rebuilding.
for o in list(scene.objects):
 if o.name.startswith('RM_'):bpy.data.objects.remove(o,do_unlink=True)
ground=next(c for c in scene.collection.children if 'IC_ground' in c.name)
upper=next(c for c in scene.collection.children if 'IC_upper' in c.name)
current=ground
materials={}
def material(name,hex,metal=0,emission=0):
 m=bpy.data.materials.get('RM_'+name) or bpy.data.materials.new('RM_'+name);m.use_nodes=True
 p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
 rgb=[int(hex[i:i+2],16)/255 for i in (1,3,5)];linear=lambda v:v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
 p.inputs['Base Color'].default_value=(*[linear(v) for v in rgb],1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=.32 if metal else .62
 if emission:p.inputs['Emission Color'].default_value=(*[linear(v) for v in rgb],1);p.inputs['Emission Strength'].default_value=emission
 materials[name]=m
for args in [('oak','#9e6337'),('walnut','#573427'),('leather','#aa284b'),('brass','#dfb05c',.65),('chrome','#bbc8cd',.8),('cream','#f3d9a2'),('bottle','#37695b'),('purple','#784a92'),('amber','#ffcb76',0,2),('dark','#36313d')]:material(*args)
def put(o,name,mat):
 o.name='RM_'+name
 for c in list(o.users_collection):c.objects.unlink(o)
 current.objects.link(o);o.data.materials.append(materials[mat]);return o
def box(name,p,s,m,bevel=.01):
 bpy.ops.mesh.primitive_cube_add(size=1,location=p);o=put(bpy.context.object,name,m);o.scale=s;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  b=o.modifiers.new('crafted edges','BEVEL');b.width=bevel;b.segments=2;bpy.ops.object.modifier_apply(modifier=b.name)
 return o
def cyl(name,p,r,h,m,rot=(0,0,0)):
 bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=r,depth=h,location=p,rotation=rot);return put(bpy.context.object,name,m)
def bottle(x,y,z,tint):
 cyl('bottle body',(x,y,z+.13),.055,.26,tint);cyl('bottle neck',(x,y,z+.32),.025,.14,tint);cyl('bottle label',(x,y,z+.15),.057,.08,'cream');cyl('bottle foil',(x,y,z+.4),.026,.025,'brass')
def table(x,y):
 cyl('conversation tabletop',(x,y,.83),.52,.1,'oak');cyl('table pedestal',(x,y,.41),.055,.75,'dark');cyl('table base',(x,y,.045),.28,.06,'brass')
 for side in [-1,1]:
  box('leather chair seat',(x+side*.82,y,.5),(.48,.48,.15),'leather',.045);box('leather chair back',(x+side*.82,y+.21,.88),(.48,.1,.65),'leather',.045)
  for dx in [-.16,.16]:
   for dy in [-.16,.16]:cyl('chair leg',(x+side*.82+dx,y+dy,.22),.02,.44,'dark')
 bottle(x-.17,y,.9,'bottle');cyl('candle',(x+.15,y,.99),.035,.17,'amber');cyl('tumbler',(x,y-.22,.99),.055,.17,'cream')
# Relocate the existing DJ station once, including its records and controls.
if not scene.get('dj_relocated'):
 for o in ground.objects:
  if o.type!='MESH':continue
  inverse=o.matrix_world.inverted()
  for v in o.data.vertices:
   p=o.matrix_world@v.co
   if 2.65<p.x<4.82 and 5.9<p.y<7.13 and .04<p.z<1.65:
    p.x+=2.35;p.y-=.6;v.co=inverse@p
 scene['dj_relocated']=True
material('glazing','#a5d1d9')
glass=materials['glazing'];p=next(n for n in glass.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Alpha'].default_value=.08;p.inputs['Roughness'].default_value=.15
if hasattr(glass,'surface_render_method'):glass.surface_render_method='DITHERED'
# Museum continues along the left wall, with depth and identifiable record/archive bays.
for y in [-5.8,-4.6,4.2,5.5]:
 box('museum velvet backing',(-8.55,y,1.55),(.1,1.1,2.25),'dark')
 for z in [.54,2.68]:box('cabinet cornice',(-8.17,y,z),(.47,1.2,.075),'brass')
 for dy in [-.56,.56]:box('cabinet stile',(-7.95,y+dy,1.61),(.055,.045,2.22),'brass')
 box('cabinet light',(-7.94,y,2.6),(.05,1.06,.03),'amber')
 for z in [1.18,1.94]:
  cyl('archive vinyl',(-8.1,y,z),.28,.035,'dark',(0,math.pi/2,0));cyl('record label',(-8.07,y,z),.09,.04,'leather',(0,math.pi/2,0))
 box('archive ticket',(-7.98,y,.77),(.025,.55,.13),'cream')
 box('cabinet glazing',(-7.92,y,1.6),(.012,1.06,1.95),'glazing',0)
# Additional right conversation pockets leave a clear x~4.4 circulation lane by DJ.
for x,y in [(3.7,3.55),(3.7,5.45)]:table(x,y)
# Pub entrance flanks; the two physical moving leaves are authored separately below.
for side in [-1,1]:
 box('entrance timber screen',(side*3.6,-7.67,.78),(2.0,.13,1.55),'walnut')
 for x in [side*2.65,side*4.55]:box('entrance post',(x,-7.67,1.0),(.16,.22,2.0),'oak')
 for z in [.16,1.38]:box('screen molding',(side*3.6,-7.77,z),(1.93,.09,.085),'brass')
# Architectural stair skirting and illuminated nosings sit on the existing treads.
for i in range(12):
 box('stair brass nosing',(-3.8,4.7+i*.235-.12,.205+i*.18),(1.23,.035,.02),'brass',.003)
 if i%3==0:box('stair light',(-4.39,4.7+i*.235,.24+i*.18),(.03,.16,.06),'amber',.003)
# Varied bar working objects; hanging stemware and ticket printer.
for y in [-3.7,-2.6,-.8,1.4,2.9,4.1]:
 for dx in [-.14,.14]:
  cyl('hanging glass stem',(8.14+dx,y,2.13),.012,.21,'chrome');cyl('hanging wine cup',(8.14+dx,y,2.0),.07,.12,'cream')
box('bar towel',(6.44,-3.4,1.445),(.35,.22,.02),'cream')
box('ticket printer',(7.6,2.4,1.3),(.25,.35,.28),'dark');box('receipt',(7.45,2.4,1.45),(.16,.14,.013),'cream')
# Pedals, microphone stands, cable paths and stage instrument display.
for x in [-1.3,1.3]:
 box('pedalboard',(x,5.38,.57),(.55,.33,.08),'dark')
 for dx in [-.15,.02,.18]:box('pedal',(x+dx,5.38,.64),(.12,.19,.075),'purple')
 cyl('mic upright',(x,6.15,1.21),.019,1.35,'chrome');cyl('mic stand',(x,6.15,.57),.19,.035,'dark')
 o=cyl('microphone',(x,6.11,1.92),.045,.2,'chrome',(math.pi/2,0,0))
# Upper floor shares materials and craft, calmer luminous pockets.
current=upper
for x in [-5.3,-2.7,.2]:
 box('lounge cushion',(x,3.92,.95),(.48,.18,.45),'purple',.065)
for y in [-3.1,1.8]:
 for x in [-6.74,6.7]:
  box('upper sconce',(x,y,2.0),(.14,.18,.3),'brass');box('upper lamp',(x,y,2.02),(.17,.2,.23),'amber')
# Merge only script additions, preserve existing original meshes and UVs.
for col in [ground,upper]:
 for m in materials.values():
  objects=[o for o in col.objects if o.name.startswith('RM_') and o.type=='MESH' and o.data.materials[0]==m]
  if not objects:continue
  bpy.ops.object.select_all(action='DESELECT')
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();bpy.context.object.name='RM_'+col.name+'_'+m.name
for name in ['ground','upper','cellar']:
 col=next(c for c in scene.collection.children if 'IC_'+name in c.name)
 bpy.ops.object.select_all(action='DESELECT')
 for o in col.objects:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=ROOT+'/public/assets/models/'+name+'.glb',use_selection=True,use_active_scene=True,export_format='GLB',export_yup=True,export_cameras=False,export_lights=False)
# Hinged physical leaves: origin at hinge, never swapped or hidden during open/close.
current=bpy.data.collections.new('RM_Doors');scene.collection.children.link(current)
for side in [-1,1]:
 before=set(current.objects)
 box('door timber',(side*.95,0,1.08),(1.86,.16,2.13),'oak',.025)
 for z in [.22,1.01,1.95]:box('door rail',(side*.95,-.11,z),(1.77,.07,.10),'walnut')
 for x in [side*.16,side*1.74]:box('door stile',(x,-.11,1.07),(.095,.07,1.91),'walnut')
 for x in [side*.42,side*.72,side*1.02,side*1.32]:box('door carving',(x,-.13,1.35),(.10,.025,.76),'brass',.004)
 for z in [.35,1.77]:cyl('door hinge',(side*1.89,0,z),.045,.17,'brass')
 box('door pull',(side*.19,-.17,1.0),(.065,.08,.31),'brass')
 # local origin at outer hinge, matching runtime pivot placement.
 for o in set(current.objects)-before:o.location.x-=side*1.9
 leaf_objects=list(set(current.objects)-before)
 for m in materials.values():
  objects=[o for o in set(current.objects)-before if o.data.materials[0]==m]
  if not objects:continue
  bpy.ops.object.select_all(action='DESELECT')
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join()
 bpy.ops.object.select_all(action='DESELECT')
 for o in set(current.objects)-before:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=ROOT+f'/public/assets/models/door-{ "left" if side<0 else "right"}.glb',use_selection=True,use_active_scene=True,export_format='GLB',export_yup=True,export_cameras=False,export_lights=False)
bpy.data.libraries.write(ROOT+'/artifacts/imagenes-club-remodel.blend',{scene},fake_user=True)
print('Remodel scene and runtime GLBs saved',scene.name)

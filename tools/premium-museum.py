import bpy,math
ROOT='/Users/indenova/AndroidStudioProjects/ImagenesClub'
s=bpy.data.scenes['ImagenesClub_Remodel_2026'];bpy.context.window.scene=s
col=bpy.data.collections.get('Premium_Museum') or bpy.data.collections.new('Premium_Museum')
if col.name not in s.collection.children:s.collection.children.link(col)
for o in list(col.objects):bpy.data.objects.remove(o,do_unlink=True)
def put(o,name,mat):
 o.name='Premium_museum_'+name
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o);o.data.materials.append(bpy.data.materials[mat]);return o
def box(name,p,size,mat):
 bpy.ops.mesh.primitive_cube_add(size=1,location=p);o=put(bpy.context.object,name,mat);o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 bevel=o.modifiers.new('Cabinet craft','BEVEL');bevel.width=.008;bevel.segments=2;bpy.ops.object.modifier_apply(modifier=bevel.name);return o
def sphere(name,p,size,mat):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,location=p);o=put(bpy.context.object,name,mat);o.scale=size;return o
def disc(name,p,r,d,mat):
 bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=r,depth=d,location=p,rotation=(0,math.pi/2,0));return put(bpy.context.object,name,mat)
def text(label,y,z,size=.085):
 bpy.ops.object.text_add(location=(-7.90,y,z));o=bpy.context.object;o.data.body=label;o.data.size=size;o.data.align_x='CENTER';o.data.extrude=.001;o.rotation_euler=(math.pi/2,0,math.pi/2)
 bpy.ops.object.convert(target='MESH');put(bpy.context.object,'archive plaque','RM_cream')
# Longitudinal instruments, ordered in six chronological bays; never use reference image.
for i,y in enumerate([-5.55,-3.45,-1.35,.75,2.85,4.95]):
 # Tall niche backing, shelves, brass uprights and concealed warm strip.
 box('velvet instrument niche',(-8.35,y,1.72),(.10,1.7,1.78),'RM_dark')
 for dy in [-.88,.88]:box('timber cabinet jamb',(-8.0,y+dy,1.55),(.16,.07,2.18),'RM_walnut')
 for z in [.53,2.59]:box('cabinet cap',(-8.02,y,z),(.45,1.82,.075),'RM_walnut')
 box('warm exhibit wash',(-7.98,y,2.52),(.06,1.58,.028),'RM_amber')
 gy=y-.36;gcolor=['RM_leather','RM_cream','RM_purple','RM_oak','RM_dark','RM_leather'][i]
 sphere('guitar lower bout',(-8.13,gy,1.12),(.08,.22,.26),gcolor);sphere('guitar upper bout',(-8.13,gy,1.39),(.07,.17,.17),gcolor)
 box('guitar neck',(-8.10,gy,1.86),(.07,.085,.79),'RM_walnut');box('guitar headstock',(-8.1,gy,2.31),(.075,.12,.17),gcolor)
 for offset in [-.025,0,.025]:box('guitar strings',(-8.01,gy+offset,1.74),(.008,.006,1.15),'RM_chrome')
 for z in [1.12,1.27]:box('guitar pickup',(-8.015,gy,z),(.015,.095,.04),'RM_cream')
 for dz in [-.05,0,.05]:
  for dy in [-.085,.085]:sphere('tuning key',(-8.095,gy+dy,2.31+dz),(.018,.035,.015),'RM_chrome')
 disc('vinyl archive',(-8.13,y+.39,1.7),.26,.025,'RM_dark');disc('vinyl printed label',(-8.1,y+.39,1.7),.078,.03,'RM_leather')
 for z in [1.05,2.16]:
  box('ticket frame',(-8.08,y+.39,z),(.03,.5,.26),'RM_brass');box('concert ticket',(-8.055,y+.39,z),(.018,.45,.21),'RM_cream')
  for dz in [-.045,.02]:box('ticket typography',(-8.04,y+.39,z+dz),(.008,.33,.014),'RM_dark')
 box('chronology label',(-7.93,y,.72),(.026,1.17,.19),'RM_dark')
 text(['VALENCIA  ROCK','ARCHIVO  1980','DIRECTOS  1990','IMAGENES  CLUB','VINILOS  &  MEMORIA','LA  HISTORIA  SIGUE'][i],y,.7,.074)
for mat in set(o.data.materials[0] for o in col.objects):
 objects=[o for o in col.objects if o.type=='MESH' and o.data.materials[0]==mat]
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join()
bpy.ops.object.select_all(action='DESELECT')
for o in col.objects:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=ROOT+'/public/assets/models/museum.glb',use_selection=True,use_active_scene=True,export_format='GLB',export_yup=True,export_cameras=False,export_lights=False)
bpy.data.libraries.write(ROOT+'/artifacts/imagenes-club-premium.blend',{s,bpy.data.scenes['ImagenesClub_CharacterLibrary']},fake_user=True)
print('Six curated three-dimensional instrument bays saved')

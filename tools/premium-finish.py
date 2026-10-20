import bpy, bmesh, math, random
from mathutils import Vector
ROOT='/Users/indenova/AndroidStudioProjects/ImagenesClub'
s=bpy.data.scenes['ImagenesClub_Remodel_2026'];bpy.context.window.scene=s
# Remove disconnected old stair components, never unrelated furnishings or walls.
def remove_components(o,predicate):
 bm=bmesh.new();bm.from_mesh(o.data);seen=set();remove=[]
 for v in bm.verts:
  if v in seen:continue
  stack=[v];seen.add(v);component=[]
  while stack:
   q=stack.pop();component.append(q)
   for e in q.link_edges:
    n=e.other_vert(q)
    if n not in seen:seen.add(n);stack.append(n)
  ps=[o.matrix_world@q.co for q in component];lo=Vector(tuple(min(p[i] for p in ps) for i in range(3)));hi=Vector(tuple(max(p[i] for p in ps) for i in range(3)))
  if predicate(lo,hi):remove.extend(component)
 if remove:bmesh.ops.delete(bm,geom=remove,context='VERTS');bm.to_mesh(o.data);o.data.update()
 bm.free()
for floor in ['ground','upper']:
 col=next(c for c in s.collection.children if 'IC_'+floor in c.name)
 for o in list(col.objects):
  if o.type!='MESH' or o.name.startswith('Premium_'):continue
  if floor=='ground':
   remove_components(o,lambda lo,hi:lo.x>-4.6 and hi.x<-3.0 and lo.y>4.45 and hi.y<7.6 and hi.z>.12 and lo.z>=-.01)
  else:
   remove_components(o,lambda lo,hi:lo.x>4.9 and hi.x<6.4 and lo.y>-5.1 and hi.y<-2.3 and lo.z<.01 and hi.z<.5)
 # Physical floor boards have an opening at the upper stair landing, not decking across the run.
 if floor=='upper':
  for o in col.objects:
   if o.name.startswith('Premium_'):remove_components(o,lambda lo,hi:hi.x>5.0 and lo.x<6.3 and hi.y>-4.9 and lo.y<-2.3)
# Add subtly worn grain to the actual oak materials using existing independent wood photograph, not reference.
image=bpy.data.images.load(ROOT+'/public/assets/textures/wood.jpg',check_existing=True)
for i in range(6):
 m=bpy.data.materials['Premium_oak'+str(i)];nodes=m.node_tree.nodes;p=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
 for n in list(nodes):
  if n.name.startswith('CraftGrain'):nodes.remove(n)
 tex=nodes.new('ShaderNodeTexImage');tex.name='CraftGrain';tex.image=image
 m.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color'])
 # Runtime applies a subtle per-board tint; image supplies grain and localized wear.
for floor in ['ground','upper','cellar']:
 col=next(c for c in s.collection.children if 'IC_'+floor in c.name)
 for o in col.objects:
  if o.type!='MESH' or not o.name.startswith('Premium_'):continue
  uv=o.data.uv_layers.active or o.data.uv_layers.new(name='OakGrain')
  for poly in o.data.polygons:
   for li in poly.loop_indices:
    p=o.matrix_world@o.data.vertices[o.data.loops[li].vertex_index].co
    uv.data[li].uv=(p.x*.46,p.y*1.8)
# Shared full-height physical run; 12 low risers and a level landing.
col=bpy.data.collections.get('Premium_ConnectedStairs') or bpy.data.collections.new('Premium_ConnectedStairs')
if col.name not in s.collection.children:s.collection.children.link(col)
for o in list(col.objects):bpy.data.objects.remove(o,do_unlink=True)
def box(name,p,size,mat):
 bpy.ops.mesh.primitive_cube_add(size=1,location=p);o=bpy.context.object;o.name=name;o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o);o.data.materials.append(bpy.data.materials[mat]);return o
def rail(a,b,r=.025):
 a,b=Vector(a),Vector(b);v=b-a;bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=r,depth=v.length,location=(a+b)/2);o=bpy.context.object;o.name='Premium_stair_rail';o.rotation_euler=v.to_track_quat('Z','Y').to_euler()
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o);o.data.materials.append(bpy.data.materials['RM_brass'])
for i in range(12):
 h=(i+1)*2.2/12;y=4.45+(i+.5)*2.75/12
 box('Premium_real_tread',(-3.8,y,h/2),(1.3,2.75/12,h),'RM_oak')
 box('Premium_tread_nosing',(-3.8,y-2.75/24+.018,h+.008),(1.3,.036,.016),'RM_brass')
 if i%3==0:box('Premium_riser_light',(-4.37,y-2.75/24-.006,h-.055),(.055,.015,.025),'RM_amber')
box('Premium_stair_landing',(-3.8,7.30,2.15),(1.3,.2,.1),'RM_oak')
for x in [-4.48,-3.12]:
 for i in range(5):
  y=4.45+i*2.95/4;h=min(2.2,i*2.2/4);rail((x,y,h),(x,y,h+.88),.018)
 rail((x,4.45,.9),(x,7.2,3.1));rail((x,7.2,3.1),(x,7.4,3.1))
# Dress modules retain normalized coordinates and the established articulated rigs.
rig=bpy.data.scenes['ImagenesClub_CharacterLibrary'];bpy.context.window.scene=rig
for name in ['dress','longDress']:
 if rig.objects.get(name):bpy.data.objects.remove(rig.objects[name],do_unlink=True)
# Load rings helper without rerunning floor export.
namespace={};cloth=bpy.data.materials['Premium_character-neutral'];exec('def rings('+open(ROOT+'/tools/premium-assets.py').read().split('def rings(')[1].split('# Tailored shoulder')[0],globals(),namespace)
rings=namespace['rings']
rings('dress',[(-1,1,.94,0),(-.7,.96,.94,0),(-.15,.83,.82,0),(.45,.70,.77,0),(1,.64,.74,0)])
rings('longDress',[(-1,1,.95,0),(-.75,.96,.9,0),(-.05,.78,.82,0),(.55,.69,.78,0),(1,.65,.76,0)])
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=ROOT+'/public/assets/models/character-library.glb',use_selection=True,use_active_scene=True,export_format='GLB',export_yup=True)
bpy.context.window.scene=s
for name in ['ground','upper','cellar','stairs']:
 c=col if name=='stairs' else next(c for c in s.collection.children if 'IC_'+name in c.name)
 bpy.ops.object.select_all(action='DESELECT')
 for o in c.objects:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=ROOT+'/public/assets/models/'+name+'.glb',use_selection=True,use_active_scene=True,export_format='GLB',export_yup=True,export_cameras=False,export_lights=False)
bpy.data.libraries.write(ROOT+'/artifacts/imagenes-club-premium.blend',{s,rig},fake_user=True)
print('Connected staircase, grain, and dresses saved')

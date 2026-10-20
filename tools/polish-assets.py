import bpy, os, math
from mathutils import Vector
ROOT='/Users/indenova/AndroidStudioProjects/ImagenesClub'
scene=bpy.data.scenes['ImagenesClub_2026_Fresh'];bpy.context.window.scene=scene
# Materials authored with display/sRGB hex values need linear values in Blender nodes.
def linear(v):return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
for mat in bpy.data.materials:
 if not mat.name.startswith('IC_') or not mat.use_nodes:continue
 p=next((n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
 if p:
  col=p.inputs['Base Color'].default_value;p.inputs['Base Color'].default_value=(*[linear(v) for v in col[:3]],col[3])
  if 'glass' in mat.name:p.inputs['Roughness'].default_value=.17
# Detail a reusable wood grain texture using generated coordinates and original tints.
for mat in [m for m in bpy.data.materials if m.name.startswith('IC_wood')]:
 p=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
 coord=mat.node_tree.nodes.new('ShaderNodeTexCoord');tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(ROOT+'/public/assets/textures/wood.jpg',check_existing=True)
 mat.node_tree.links.new(coord.outputs['Generated'],tex.inputs['Vector']);mat.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color'])
 # Blender's GLTF exporter bakes generated-coordinate texture projections to UVs when requested separately; runtime wood texture also supplied.
# Reference art planes with explicit UVs; append rather than replace historic assets.
for name in ['ground','upper']:
 col=scene.collection.children['IC_'+name]
 coords= [(-7.8,7.67,1.95,False),(-6.7,7.67,1.95,False),(-5.6,7.67,1.95,False),(5.6,7.67,1.95,False),(6.7,7.67,1.95,False),(7.8,7.67,1.95,False),(-8.59,-6.7,1.85,True),(-8.59,-5.7,1.85,True),(-8.59,4.6,1.85,True),(-8.59,6.5,1.85,True)] if name=='ground' else [(x,5.18,2.1,False) for x in [-5.8,-4.7,-3.6,-2.5,-1.4,-.3,1]]
 for i,(x,y,z,left) in enumerate(coords):
  mat=bpy.data.materials.new('IC_reference_memory_'+str(i));mat.use_nodes=True
  p=next((n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None) or mat.node_tree.nodes.new('ShaderNodeBsdfPrincipled');out=next((n for n in mat.node_tree.nodes if n.type=='OUTPUT_MATERIAL'),None) or mat.node_tree.nodes.new('ShaderNodeOutputMaterial');mat.node_tree.links.new(p.outputs['BSDF'],out.inputs['Surface'])
  tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(ROOT+f'/public/assets/textures/memory-{i%12}.jpg',check_existing=True);mat.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color']);p.inputs['Roughness'].default_value=.8
  bpy.ops.mesh.primitive_plane_add(size=1,location=(x,y,z),rotation=(math.pi/2,0,math.pi/2 if left else 0));o=bpy.context.object;o.name='IC_illustrated_reference_print';o.scale=(.64,.94,1)
  for c in list(o.users_collection):c.objects.unlink(o)
  col.objects.link(o);o.data.materials.append(mat)
# Museum glass is inset in wall, with understated transparency rather than opaque boxes.
mat=bpy.data.materials.new('IC_museum_glazing');mat.use_nodes=True
p=next((n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None) or mat.node_tree.nodes.new('ShaderNodeBsdfPrincipled');out=next((n for n in mat.node_tree.nodes if n.type=='OUTPUT_MATERIAL'),None) or mat.node_tree.nodes.new('ShaderNodeOutputMaterial');mat.node_tree.links.new(p.outputs['BSDF'],out.inputs['Surface']);p.inputs['Base Color'].default_value=(.35,.52,.57,1);p.inputs['Alpha'].default_value=.13;p.inputs['Roughness'].default_value=.16
if hasattr(mat,'surface_render_method'):mat.surface_render_method='DITHERED'
bpy.ops.mesh.primitive_plane_add(size=1,location=(-8.17,.2,1.60),rotation=(math.pi/2,0,math.pi/2));o=bpy.context.object;o.name='Integrated museum glazing';o.scale=(6.75,2.2,1)
for c in list(o.users_collection):c.objects.unlink(o)
scene.collection.children['IC_ground'].objects.link(o);o.data.materials.append(mat)
for name in ['ground','upper','cellar']:
 bpy.ops.object.select_all(action='DESELECT')
 for o in scene.collection.children['IC_'+name].objects:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=ROOT+'/public/assets/models/'+name+'.glb',use_selection=True,use_active_scene=True,export_format='GLB',export_yup=True,export_cameras=False,export_lights=False)
bpy.data.libraries.write(ROOT+'/artifacts/imagenes-club.blend', {scene}, fake_user=True)
scene.render.filepath=ROOT+'/artifacts/blender-ground.png';bpy.ops.render.render(write_still=True)
print('Polished assets exported and rendered.')

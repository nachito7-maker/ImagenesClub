import bpy, math
ROOT='/Users/indenova/AndroidStudioProjects/ImagenesClub'
scene=bpy.data.scenes.new('ImagenesClub_Hero_2026');bpy.context.window.scene=scene
mats={}
def mat(n,c,metal=0):
 m=bpy.data.materials.new('Hero_'+n);m.use_nodes=True;p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');rgb=[int(c[i:i+2],16)/255 for i in (1,3,5)];p.inputs['Base Color'].default_value=tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb)+(1,);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=.32 if metal else .5;mats[n]=m
for n,c,metal in [('sunburst','#a54825',0),('cream','#ead3a1',0),('chrome','#a4acb2',.8),('ebony','#211e25',0),('cloth','#645b54',0),('brass','#c39b54',.6)]:mat(n,c,metal)
def cube(n,p,s,m,bevel=.015):
 bpy.ops.mesh.primitive_cube_add(size=1,location=p);o=bpy.context.object;o.name=n;o.scale=s;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mats[m]);mod=o.modifiers.new('crafted edges','BEVEL');mod.width=bevel;mod.segments=2;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name);return o
# Double-cut electric guitar, visible front faces toward room (+X).
outline=[(-.08,0),(-.23,.04),(-.28,.20),(-.24,.38),(-.16,.43),(-.14,.65),(-.06,.53),(.06,.53),(.14,.65),(.16,.43),(.24,.38),(.28,.20),(.23,.04),(.08,0)]
verts=[(-8.0+d,.4+y,1.0+z) for d in [-.06,.06] for y,z in outline];N=len(outline);faces=[tuple(range(N-1,-1,-1)),tuple(range(N,2*N))]+[(i,(i+1)%N,(i+1)%N+N,i+N) for i in range(N)]
mesh=bpy.data.meshes.new('double cut guitar');mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new('Hero electric guitar',mesh);scene.collection.objects.link(o);o.data.materials.append(mats['sunburst']);bpy.context.view_layer.objects.active=o;o.select_set(True);mod=o.modifiers.new('guitar rounded body','BEVEL');mod.width=.025;mod.segments=3;bpy.ops.object.modifier_apply(modifier=mod.name)
cube('fretboard',(-7.94,.4,1.91),(.025,.08,.74),'ebony');cube('headstock',(-7.94,.4,2.36),(.06,.14,.22),'sunburst')
# Guitar controls and pickguard sit on the room-facing +X face after glTF Y-up export.
for z in [1.23,1.40]:cube('pickup',(-7.92,.4,z),(.025,.17,.045),'cream')
# Reusable front-face details, normal aligned along +X.
cube('pickguard',(-7.90,.4,1.43),(.012,.19,.38),'cream')
for y in [.34,.40,.46]:
    bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=.035,depth=.018,location=(-7.89,y,1.16),rotation=(0,math.pi/2,0)); knob=bpy.context.object;knob.name='control knob';knob.data.materials.append(mats['chrome'])
for i in range(6):cube('string',(-7.90,.375+i*.01,1.79),(.003,.003,1.08),'chrome',.001)
for i in range(13):cube('fret',(-7.90,.4,1.61+i*.05),(.008,.08,.008),'chrome',.001)
for y in [.32,.48]:
 for z in [2.29,2.35,2.41]:cube('tuner',(-7.94,y,z),(.065,.06,.025),'chrome',.004)
# Guitar stand and display backing: no free-floating body.
cube('display cradle',(-7.98,.4,.93),(.22,.32,.10),'brass');cube('velvet backdrop',(-8.16,.4,1.62),(.03,.78,1.95),'ebony')
# Stage combo amps with cloth grille, corner hardware, handle and knobs.
for x in [-1.75,1.75]:
 cube('amp cabinet',(x,7.05,.94),(.76,.40,.78),'ebony',.045);cube('woven grille',(x,6.83,.91),(.65,.025,.55),'cloth');cube('control face',(x,6.82,1.26),(.63,.03,.08),'brass');cube('carry handle',(x,7.05,1.37),(.30,.06,.05),'ebony')
 for i in range(5):cube('amp control',(x-.24+i*.12,6.79,1.26),(.035,.025,.035),'chrome',.005)
 for dx in [-.32,.32]:
  for z in [.61,1.25]:cube('corner cap',(x+dx,6.82,z),(.07,.04,.07),'chrome')
# Backbar espresso machine: supported by a workbench, cup warming rack, spouts.
cube('work bench',(7.75,-1.6,1.12),(.73,1.0,.08),'chrome');cube('coffee housing',(7.78,-1.6,1.48),(.56,.78,.62),'chrome',.04);cube('coffee face',(7.46,-1.6,1.48),(.045,.68,.32),'ebony');cube('drip tray',(7.39,-1.6,1.19),(.28,.72,.05),'chrome')
for y in [-1.82,-1.42]:cube('group handle',(7.35,y,1.47),(.26,.06,.07),'ebony');cube('espresso cup',(7.34,y,1.29),(.10,.10,.13),'cream')
# Merge by material; six calls for the complete hero set.
for m in mats.values():
 objs=[o for o in scene.objects if o.type=='MESH' and o.data.materials[0]==m]
 bpy.ops.object.select_all(action='DESELECT')
 for o in objs:o.select_set(True)
 bpy.context.view_layer.objects.active=objs[0];bpy.ops.object.join();bpy.context.object.name=m.name
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=ROOT+'/public/assets/models/hero.glb',use_selection=True,use_active_scene=True,export_format='GLB',export_yup=True)
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/artifacts/imagenes-club-hero.blend')
print('HERO triangles',sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in scene.objects if o.type=='MESH'))

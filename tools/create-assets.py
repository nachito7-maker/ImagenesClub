import bpy, math, random, os
from mathutils import Vector
ROOT = '/Users/indenova/AndroidStudioProjects/ImagenesClub'
random.seed(713)
scene = bpy.data.scenes.get('ImagenesClub_2026_Fresh') or bpy.data.scenes.new('ImagenesClub_2026_Fresh')
bpy.context.window.scene = scene
# Only remove assets from this task's isolated scene when regenerating.
for obj in list(scene.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
mats = {}
def mat(name, hexcolor, metallic=0, roughness=.7, emission=0):
    h=hexcolor.lstrip('#'); c=tuple(int(h[i:i+2],16)/255 for i in (0,2,4))
    m=bpy.data.materials.new('IC_'+name); m.diffuse_color=(*c,1); m.use_nodes=True
    p=next((n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None) or m.node_tree.nodes.new('ShaderNodeBsdfPrincipled'); p.inputs['Base Color'].default_value=(*c,1)
    p.inputs['Metallic'].default_value=metallic; p.inputs['Roughness'].default_value=roughness
    output=next((n for n in m.node_tree.nodes if n.type=='OUTPUT_MATERIAL'),None) or m.node_tree.nodes.new('ShaderNodeOutputMaterial');m.node_tree.links.new(p.outputs['BSDF'],output.inputs['Surface'])
    if emission: p.inputs['Emission Color'].default_value=(*c,1); p.inputs['Emission Strength'].default_value=emission
    mats[name]=m; return m
for name,col in [('wood','#6b3c25'),('woodlight','#995f36'),('wooddark','#331f1d'),('brick','#59342d'),('brick2','#74463a'),('mortar','#302a28'),('black','#15151d'),('red','#861d35'),('redlight','#b12e45'),('gold','#b89455'),('cream','#eac89a'),('green','#386045'),('leaf','#47794b'),('blue','#334e72'),('paper','#d7bc8e'),('skin','#be8561'),('purple','#743b89')]: mat(name,col, .45 if name=='gold' else 0)
mat('steel','#777880',.8,.26); mat('glass','#618586',.35,.2); mat('amber','#ffc369',0,.4,3); mat('pink','#ff2785',0,.5,3); mat('cyan','#39b9f2',0,.5,3)
cols={}
for name in ['ground','upper','cellar']:
    col=bpy.data.collections.new('IC_'+name); scene.collection.children.link(col); cols[name]=col
current=cols['ground']
def put(o,name,material):
    o.name=name
    for c in list(o.users_collection): c.objects.unlink(o)
    current.objects.link(o)
    o.data.materials.append(mats[material]); return o
def box(name,x,y,z,sx,sy,sz,m='wood',bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(x,y,z)); o=bpy.context.object; o.scale=(sx,sy,sz)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    put(o,name,m)
    if bevel:
        mod=o.modifiers.new('soft edges','BEVEL'); mod.width=bevel; mod.segments=2
        bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=mod.name)
    return o
def cyl(name,x,y,z,r,depth,m='steel',vertices=12):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=(x,y,z)); return put(bpy.context.object,name,m)
def sphere(name,x,y,z,scale,m='leaf'):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=10,ring_count=6,radius=1,location=(x,y,z)); o=bpy.context.object; o.scale=scale; return put(o,name,m)
def torus(name,x,y,z,major,minor,m='steel',rot=None):
    bpy.ops.mesh.primitive_torus_add(major_segments=16,minor_segments=6,location=(x,y,z),major_radius=major,minor_radius=minor); o=put(bpy.context.object,name,m)
    if rot:o.rotation_euler=rot
    return o
def bottle(x,y,z,m='green'):
    cyl('bottle',x,y,z+.14,.075,.28,m); cyl('neck',x,y,z+.33,.031,.13,m); cyl('label',x,y,z+.14,.077,.11,'cream'); cyl('cap',x,y,z+.4,.033,.025,'gold')
def glass(x,y,z):
    cyl('drink',x,y,z+.09,.068,.18,'glass'); cyl('beer',x,y,z+.07,.061,.12,'gold'); torus('rim',x,y,z+.18,.063,.009,'cream')
def lamp(x,y,z=2.3):
    box('bracket',x,y,z,.16,.17,.36,'black'); cyl('lantern',x,y-.10,z,.10,.27,'amber'); cyl('lantern top',x,y-.10,z+.17,.14,.06,'black'); cyl('lantern base',x,y-.10,z-.17,.14,.06,'gold')
def plant(x,y):
    cyl('plant pot',x,y,.27,.24,.54,'wooddark'); torus('pot rim',x,y,.48,.24,.04,'gold')
    for i in range(8):
        a=i*2.4; s=sphere('palm frond',x+math.cos(a)*.22,y+math.sin(a)*.22,.9+random.random()*.45,(.09,.13,.43),'leaf'); s.rotation_euler=(math.sin(a)*.7,math.cos(a)*.7,a)
def chair(x,y,angle=0,sofa=False):
    root=[]
    before=set(current.objects)
    box('seat',x,y,.55,.54,.55,.13,'red',.055); box('chair back',x,y+.24,.97,.54,.12,.67,'red',.055)
    for dx in [-.21,.21]:
        for dy in [-.2,.2]:cyl('chair leg',x+dx,y+dy,.25,.027,.5,'black',8)
    for o in set(current.objects)-before:
        p=o.location-Vector((x,y,0)); o.location=(x+p.x*math.cos(angle)-p.y*math.sin(angle), y+p.x*math.sin(angle)+p.y*math.cos(angle), p.z); o.rotation_euler.z+=angle
def table(x,y,capacity=4):
    r=.63 if capacity<=4 else .85
    cyl('table top',x,y,.83,r,.13,'woodlight',24); torus('brass table rim',x,y,.84,r,.024,'gold'); cyl('table stem',x,y,.4,.08,.74,'black'); cyl('table foot',x,y,.07,.37,.08,'black')
    for i in range(capacity):
        a=i*math.tau/capacity; chair(x+math.sin(a)*(r+.40),y+math.cos(a)*(r+.40),-a)
    cyl('candle saucer',x,y,.93,.08,.04,'gold'); cyl('candle',x,y,1.04,.04,.18,'amber'); glass(x+.27,y,.91)
def sofa(x,y,length=2.7):
    box('sofa base',x,y,.39,length,.82,.60,'red',.13); box('sofa back',x,y+.34,.85,length,.25,1.0,'red',.10)
    for side in [-1,1]:box('sofa arm',x+side*(length/2-.12),y,.69,.22,.82,.64,'redlight',.09)
    for i in range(int(length/.48)):
        box('tufted cushion',x-length/2+.35+i*.49,y-.06,.72,.45,.57,.17,'redlight',.07)
        sphere('button',x-length/2+.35+i*.49,y+.19,1.0,(.027,.025,.027),'gold')
def guitar(x,y,z,angle=0,m='redlight',wall=False):
    before=set(current.objects)
    sphere('guitar lower',x,y,z,(.23,.075,.29),m); sphere('guitar upper',x,y,z+.23,(.18,.07,.20),m)
    box('guitar neck',x,y,z+.69,.07,.06,.72,'woodlight',.012); box('guitar head',x,y,z+1.08,.13,.07,.22,'gold',.015)
    box('pickup',x,y-.076,z+.13,.09,.02,.10,'cream'); box('bridge',x,y-.076,z-.06,.14,.02,.04,'steel')
    for i in range(6): box('strings',x-.025+i*.01,y-.08,z+.43,.003,.003,.94,'steel')
    for o in set(current.objects)-before:o.rotation_euler.y+=angle
    return

def picture(x,y,z,w=.68,h=.92,left=False,index=0):
    # Abstract original rock musician portraits, not invented historical photographs.
    before=set(current.objects)
    box('frame',x,y,z,w,.07,h,'gold',.015); box('print',x,y-.046,z,w-.085,.012,h-.085,'black')
    tone=['paper','redlight','purple','blue'][index%4]
    sphere('portrait head',x,y-.057,z+.17,(w*.12,.022,h*.12),tone)
    box('portrait jacket',x,y-.057,z-.11,w*.31,.018,h*.34,tone,.035)
    o=box('portrait guitar',x+.10,y-.071,z-.10,w*.10,.017,h*.36,'cream',.016); o.rotation_euler.y=-.32
    if left:
        for o in set(current.objects)-before:
            p=o.location-Vector((x,y,z)); o.location=(x-p.y,y+p.x,z+p.z); o.rotation_euler.z+=math.pi/2

def flooring(width,depth):
    box('foundation',0,0,-.25,width+.5,depth+.5,.43,'black',.12)
    for row in range(int(depth/.48)):
        for col in range(int(width/1.6)+1):
            x=-width/2+.8+col*1.6; y=-depth/2+.24+row*.48
            if x+.8>width/2:continue
            box('timber plank',x,y,-.015,1.57,.46,.08,random.choice(['wood','woodlight','wooddark']))
def backwall(width,y):
    box('wall substrate',0,y,1.55,width,.20,3.1,'mortar')
    for row in range(9):
        for col in range(int(width/.73)):
            x=-width/2+.36+col*.73+(row%2)*.35
            if x>width/2:continue
            box('brickwork',x,y-.13,.18+row*.33,.70,.075,.30,random.choice(['brick','brick2']))
    box('cornice',0,y-.12,3.10,width,.23,.18,'wooddark',.025); box('brass cornice',0,y-.25,3.03,width,.02,.025,'gold')
def leftwall(x,depth):
    box('left wall',x,0,1.5,.20,depth,3,'brick')
    for z in [.13,1.22,2.85]:box('wall molding',x+.13,0,z,.15,depth,.08,'wooddark')
    for y in range(-7,8):box('wood panel stile',x+.13,y,.70,.13,.075,1.0,'wooddark')
def logo_panel(x,y,z,w,h):
    box('logo surround',x,y,z,w+.13,.08,h+.13,'gold',.035)
    m=bpy.data.materials.new('IC_official_logo');m.use_nodes=True
    p=next((n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None) or m.node_tree.nodes.new('ShaderNodeBsdfPrincipled');tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(ROOT+'/public/assets/references/logo.png',check_existing=True)
    m.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color']);m.node_tree.links.new(tex.outputs['Color'],p.inputs['Emission Color']);p.inputs['Emission Strength'].default_value=.45
    bpy.ops.mesh.primitive_plane_add(size=1,location=(x,y-.051,z),rotation=(math.pi/2,0,0));o=bpy.context.object;o.scale=(w,h,1);put(o,'Official unchanged logo','black');o.data.materials.clear();o.data.materials.append(m)

flooring(18,16);backwall(18,8);leftwall(-9,16)
# Small stage, immediately left stairs, right DJ, right bar.
box('small stage',0,6.30,.25,4.8,2.9,.52,'wooddark',.10);box('stage fascia',0,4.87,.27,4.8,.06,.32,'red')
for x in [-2.2,2.2]:
    box('stage loudspeaker',x,6.5,1.20,.48,.48,1.65,'black',.055)
    for z in [.73,1.35,1.83]:
        o=cyl('woofer',x,6.24,z,.15,.05,'steel');o.rotation_euler.x=math.pi/2
# Curtains with visible folds.
for side in [-1,1]:
    for j in range(6):cyl('velvet curtain fold',side*(1.65+j*.105),7.71,1.8,.13,2.8,'red',10)
logo_panel(0,7.68,2.0,2.85,1.06)
box('stage truss',0,6.90,3.05,5.1,.10,.10,'black')
for i in range(7):
    x=-2.1+i*.7;cyl('stage fixture',x,6.9,2.91,.10,.20,'black');sphere('stage lens',x,6.81,2.80,(.075,.075,.04),['pink','cyan','amber'][i%3])
for i in range(12):box('stair tread',-3.8,4.7+i*.235,.10+i*.18,1.25,.27,.20,'woodlight',.015)
for i in range(4):box('stair railing upright',-4.5,5+i*.8,1+i*.62,.04,.04,1.0,'gold')
rail=box('stair handrail',-4.5,6.1,2.1,.07,3.2,.07,'gold');rail.rotation_euler.x=.63
# DJ desk.
box('DJ console base',3.73,6.55,.64,1.9,.95,1.15,'wooddark',.08);box('DJ brass top',3.73,6.55,1.27,2.0,1.02,.09,'gold',.03)
for x in [3.15,4.30]:
    cyl('turntable',x,6.46,1.35,.30,.055,'black');torus('vinyl grooves',x,6.46,1.383,.22,.014,'steel');cyl('vinyl label',x,6.46,1.39,.07,.01,'redlight')
box('mixer',3.72,6.48,1.37,.35,.54,.08,'black')
for x in [3.61,3.72,3.83]:
    for y in [6.32,6.45,6.58]:cyl('mixer knob',x,y,1.45,.025,.07,'steel',8)
# Proper bar on the right, owner at final front stool.
box('bar counter',6.75,-.20,.66,1.13,9.75,1.3,'wooddark',.08);box('bar top',6.65,-.20,1.34,1.48,10.0,.17,'woodlight',.04)
for y in [-4.3,-2.8,-1.3,.2,1.7,3.2]:
    box('bar inlay',6.16,y,.70,.045,1.22,.88,'red');box('bar panel edge',6.12,y,.7,.025,1.26,.93,'gold')
for y in [-4.3,-3.05,-1.8,-.55,.7,1.95,3.2,4.45]:
    cyl('stool seat',5.58,y,.82,.29,.13,'redlight');cyl('stool stem',5.58,y,.41,.043,.77,'black');torus('stool footrest',5.58,y,.29,.23,.026,'gold');cyl('stool base',5.58,y,.07,.24,.07,'black')
    glass(6.4,y,1.44)
for z in [.45,1.65,2.50]:
    box('bottle shelf',8.58,.1,z,.58,9.65,.11,'wooddark');box('shelf glow',8.24,.1,z+.04,.025,9.65,.025,'amber')
    for j in range(29):bottle(8.53,-4.35+j*.32,z+.08,random.choice(['green','red','blue','woodlight']))
for y in [-3,0,3]:
    box('backbar mirror',8.9,y,1.60,.04,2.7,1.9,'glass');lamp(8.2,y,2.9)
box('fridge',7.73,-3.85,.56,.70,1.45,1.1,'steel',.04)
for y in [-4.19,-3.5]:box('fridge glass door',7.35,y,.58,.03,.59,.85,'glass');box('fridge handle',7.29,y-.21,.58,.02,.03,.34,'steel')
for y in [.3,.55,.8]:cyl('beer tap',6.86,y,1.61,.035,.52,'steel');box('tap handle',6.86,y,1.96,.065,.06,.18,'black')
box('ice well',6.61,-1.4,1.45,.51,.68,.05,'steel');box('ice',6.61,-1.4,1.49,.38,.55,.04,'glass')
# Integrated wall museum, memorabilia guitars, records, framed art.
box('museum inset',-8.75,.20,1.58,.33,7.0,2.3,'black')
for y in [-2.6,-1.2,.2,1.6,3.0]:
    box('museum brass stile',-8.51,y,1.58,.04,.04,2.35,'gold');lamp(-8.38,y,2.89)
for y,m in [(-2.0,'redlight'),(.65,'cream'),(2.3,'woodlight')]:
    before=set(current.objects);guitar(-8.42,y,1.23,0,m)
    # Guitar front faces towards club.
    for o in set(current.objects)-before:
        p=o.location-Vector((-8.42,y,1.23));o.location=(-8.42-p.y,y+p.x,1.23+p.z);o.rotation_euler.z=math.pi/2
for y in [-1.1,1.35]:
    o=cyl('museum vinyl',-8.38,y,1.8,.37,.035,'black');o.rotation_euler.y=math.pi/2
    o=cyl('museum disc label',-8.35,y,1.8,.12,.04,'redlight');o.rotation_euler.y=math.pi/2
for y in [-6.7,-5.7,4.6,6.5]:picture(-8.73,y,1.85,.78,1.17,True,int(y*3))
for x in [-7.8,-6.7,-5.6,5.6,6.7,7.8]:picture(x,7.83,1.93,.78,1.12,False,int(x*5));lamp(x,7.62,2.93)
# Seating follows the conceptual map with a generous central dance area.
for x,y,c in [(-6.0,4.4,2),(-5.8,1.25,4),(-5.8,-1.9,4),(-5.8,-5.2,4),(3.85,-6.2,4)]:table(x,y,c)
sofa(-7,-6.4,2.8);sofa(-7,4.2,2.3)
for x,y in [(-8,-7),(-8,3.7),(-4.8,6.6),(4.9,7.3),(8,-6.7),(3.2,-7.1),(-3.0,-6.7)]:plant(x,y)
# Entrance centered at bottom: open double door, club carpet, vestibule lighting.
for x in [-2.4,2.4]:
    box('entrance pillar',x,-7.8,1.0,.35,.45,2.0,'brick');lamp(x,-7.92,1.85)
box('welcome carpet',0,-7.0,.05,2.7,1.65,.03,'red');box('carpet trim',0,-7.0,.064,2.45,1.4,.015,'gold');box('carpet center',0,-7.0,.075,2.33,1.28,.016,'red')
# Upper floor is its own playable scene with right arrival/bathrooms.
current=cols['upper'];flooring(14,11);backwall(14,5.5);leftwall(-7,11)
sofa(-2,4.15,6.5)
for x in [-4,-1.5,1]:
    box('lounge table',x,2.8,.44,1.22,.82,.13,'woodlight',.08)
    for dx in [-.47,.47]:box('lounge leg',x+dx,2.8,.2,.055,.58,.41,'black')
    glass(x,2.8,.52)
for x,y,c in [(-4,-.1,4),(-.7,-1.3,4),(2.4,-3.0,4)]:table(x,y,c)
for x in [-5.8,-4.7,-3.6,-2.5,-1.4,-.3,1.0]:picture(x,5.32,2.1,.77,1.05,False,int(x*2));lamp(x,5.13,2.95)
for x,col in [(4.1,'cyan'),(6.0,'pink')]:
    box('bathroom wall',x,4.7,1.35,1.7,.15,2.7,'brick');box('bathroom door',x,4.59,1.11,1.1,.09,2.15,'wooddark',.04)
    box('bathroom plaque',x,4.51,1.67,.28,.04,.34,col,.02);cyl('bathroom knob',x+.4,4.46,1.0,.04,.06,'gold')
for i in range(10):box('upper arrival stairs',5.65,-4.75+i*.24,-.75+i*.09,1.22,.25,.12,'woodlight')
for x,y in [(-6,4),(-6,-4),(3,4),(4.5,-4.4)]:plant(x,y)
logo_panel(-2,5.28,1.14,1.9,.7)
# Cellar: physical shopping aisles and distributor pallets.
current=cols['cellar'];flooring(14,11);backwall(14,5.5);leftwall(-7,11)
for x in [-5,-1.7,1.7,5]:
    for y in [0,3]:
        for z in [.18,1,1.82]:
            box('cellar shelf',x,y,z,2.2,.66,.09,'wooddark')
            for j in range(7):bottle(x-.88+j*.29,y,z+.06,['green','blue','woodlight','red'][int((x+5)/3.3)%4])
        for dx in [-1.02,1.02]:box('rack upright',x+dx,y,1.06,.09,.64,2.22,'black')
for x in [-3,0,3]:
    box('delivery crate',x,-3.4,.37,1.3,1,.73,'woodlight',.03)
    for z in [.08,.28,.48,.68]:box('crate slat',x,-3.92,z,1.35,.035,.06,'wooddark')
for x in [-6,-2,2,6]:lamp(x,5.22,2.85)
logo_panel(0,5.29,2.1,2.2,.82)
# Static geometry is merged by material for a bounded draw-call cost.
for name,col in cols.items():
    bpy.ops.object.select_all(action='DESELECT')
    groups={}
    for o in list(col.objects):
        if o.type=='MESH':groups.setdefault(o.data.materials[0].name,[]).append(o)
    for material,objects in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();bpy.context.object.name=name+'_'+material
    bpy.ops.object.select_all(action='DESELECT')
    for o in col.objects:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=ROOT+'/public/assets/models/'+name+'.glb',use_selection=True,use_active_scene=True,export_format='GLB',export_yup=True,export_cameras=False,export_lights=False)
    print(name, 'objects:',len(col.objects),'vertices:',sum(len(o.data.vertices) for o in col.objects if o.type=='MESH'))
# Source and real Blender validation render, preserving the isolated scene.
for name,col in cols.items():col.hide_render=name!='ground'
bpy.ops.object.camera_add(location=(17,-23,24));cam=bpy.context.object;cam.name='IC_ValidationCamera';cam.rotation_euler=(Vector((0,0,.4))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=24;scene.camera=cam
bpy.ops.object.light_add(type='AREA',location=(0,-1,12));light=bpy.context.object;light.data.energy=2200;light.data.shape='DISK';light.data.size=14
scene.world=bpy.data.worlds.new('IC_world');scene.world.use_nodes=True;bg=next((n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND'),None) or scene.world.node_tree.nodes.new('ShaderNodeBackground');out=next((n for n in scene.world.node_tree.nodes if n.type=='OUTPUT_WORLD'),None) or scene.world.node_tree.nodes.new('ShaderNodeOutputWorld');scene.world.node_tree.links.new(bg.outputs[0],out.inputs[0]);bg.inputs[0].default_value=(.08,.065,.10,1);bg.inputs[1].default_value=.8
scene.render.engine='CYCLES';scene.cycles.samples=16;scene.render.resolution_x=1280;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.render.filepath=ROOT+'/artifacts/blender-ground.png'
bpy.data.libraries.write(ROOT+'/artifacts/imagenes-club.blend', {scene}, fake_user=True)
print('Assets exported, source saved. Render ready.')

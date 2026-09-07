"""INFINITUM architectural kit. Run in Blender; metres, Z up, origin at foot.
Exports render modules and separately named collision proxies in one GLB.
The user's original Blender scene is never modified.
"""
import bpy, math, os
from mathutils import Vector, Matrix

scene = bpy.data.scenes.get('INFINITUM_Kit') or bpy.data.scenes.new('INFINITUM_Kit')
bpy.context.window.scene = scene
for obj in list(scene.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
materials = {}
for name, color, metal, rough in [('Stone',(.63,.64,.63,1),.15,.43),('Pale',(.82,.8,.74,1),.12,.35),('Obsidian',(.018,.025,.035,1),.78,.24),('Gold',(.43,.29,.12,1),.8,.3)]:
    mat=bpy.data.materials.get('Kit_'+name) or bpy.data.materials.new('Kit_'+name)
    mat.diffuse_color=color; mat.use_nodes=True
    bs=mat.node_tree.nodes.get('Principled BSDF'); bs.inputs['Base Color'].default_value=color
    bs.inputs['Metallic'].default_value=metal; bs.inputs['Roughness'].default_value=rough
    materials[name]=mat
parts=[]
def box(loc, size, mat='Stone', bevel=.04):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o=bpy.context.object; o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        m=o.modifiers.new('Cut stone arris','BEVEL'); m.width=bevel; m.segments=1
        bpy.ops.object.modifier_apply(modifier=m.name)
        m=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL'); bpy.ops.object.modifier_apply(modifier=m.name)
    o.data.materials.append(materials[mat]); parts.append(o); return o
def cone(loc,r1,r2,depth,mat='Pale',vertices=8):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r1,radius2=r2,depth=depth,location=loc)
    o=bpy.context.object;o.data.materials.append(materials[mat]);parts.append(o);return o
def ring(radius,z,thick=.08,mat='Gold',vertical=False):
    bpy.ops.mesh.primitive_torus_add(major_radius=radius,minor_radius=thick,major_segments=96,minor_segments=6,location=(0,0,z))
    o=bpy.context.object
    if vertical:o.rotation_euler.x=math.pi/2
    o.data.materials.append(materials[mat]);parts.append(o);return o
def finish(name):
    # Join by material: four draw batches per module, with baked local coordinates.
    groups=[[o for o in parts if o.data.materials[0]==mat] for mat in materials.values()]
    for subset in groups:
        if not subset:continue
        mat=subset[0].data.materials[0]
        bpy.ops.object.select_all(action='DESELECT')
        for o in subset:o.select_set(True)
        bpy.context.view_layer.objects.active=subset[0]
        if len(subset)>1:bpy.ops.object.join()
        o=bpy.context.object;scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
        o.name=name+'__'+mat.name
    parts.clear()

# Monolith: recessed obsidian core, sculpted collar, inset bronze rails, crowned fin.
box((0,0,.2),(3,2,.4),'Stone',.1)
box((0,0,.48),(2.6,1.6,.18),'Pale')
box((0,0,7.5),(2,1,14),'Obsidian',.13)
for x in [-1.05,1.05]:
    box((x,0,7.3),(.06,1.08,13.8),'Gold',.025)
    box((x*.77,-.57,7.3),(.07,.06,12.6),'Gold',.01)
box((0,-.55,7.7),(1.45,.08,12.6),'Obsidian')
box((0,-.61,2.6),(.025,.04,2.8),'Gold',.008)
cone((0,0,14.6),1.2,.72,.55,'Gold',4)
cone((0,0,15.2),.65,0,.8,'Obsidian',4)
o=ring(.43,4.7,.018,'Gold',True);o.location.y=-.65
finish('monolith')

# Tower: octagonal nave, clustered flying buttresses, setbacks, needle crown.
cone((0,0,19),4.6,3.6,38,'Stone')
cone((0,0,40),3.6,2.1,4,'Pale')
cone((0,0,47),2,1.35,10,'Stone')
cone((0,0,56),1.35,0,8,'Pale')
for i in range(8):
    angle=i*math.tau/8;x=math.cos(angle);y=math.sin(angle)
    box((x*4,y*4,17),(.8,.8,34),'Pale',.08)
    cone((x*4,y*4,37),.7,0,6,'Pale',4)
    box((x*3.88,y*3.88,26),(.32,.32,19),'Obsidian',.02)
    o=box((x*4.05,y*4.05,23),(.9,.16,19),'Obsidian',.025);o.rotation_euler.z=angle-math.pi/2
    for level in [6,15,24,33]:
        o=box((x*4.25,y*4.25,level),(1.2,.45,.24),'Pale',.03);o.rotation_euler.z=angle-math.pi/2
    box((x*4.48,y*4.48,12),(.09,.09,20),'Gold',.01)
    cone((x*2.3,y*2.3,45),.43,0,13,'Pale',4)
for z in [3,12,31,39]:cone((0,0,z),4.65,4.65,.35,'Pale')
finish('tower')

# True extruded masonry vault; 8m clear span / 12m crown.
for x in [-4.5,4.5]:
    box((x,0,4),(.95,1.6,8),'Stone',.06)
    box((x,-.85,4),(.35,.2,8),'Pale')
    box((x,0,.2),(1.5,2,.4),'Pale')
for i in range(24):
    a=i*math.pi/24;b=(i+1)*math.pi/24-.004
    verts=[(r*math.cos(t),y,8+r*math.sin(t)) for y in [-.8,.8] for r,t in [(4,a),(5,a),(5,b),(4,b)]]
    mesh=bpy.data.meshes.new('Voussoir');mesh.from_pydata(verts,[],[(1,2,3,0),(7,6,5,4),(4,5,1,0),(5,6,2,1),(6,7,3,2),(7,4,0,3)])
    o=bpy.data.objects.new('Vault stone',mesh);scene.collection.objects.link(o);o.data.materials.append(materials['Pale' if i%4==0 else 'Stone']);parts.append(o)
finish('arch')

for i in range(64):
    a=i*math.tau/64;b=(i+1)*math.tau/64-.001
    verts=[(r*math.cos(t),y,r*math.sin(t)) for y in [-.35,.35] for r,t in [(9.55,a),(10.45,a),(10.45,b),(9.55,b)]]
    mesh=bpy.data.meshes.new('Ring masonry');mesh.from_pydata(verts,[],[(1,2,3,0),(7,6,5,4),(4,5,1,0),(5,6,2,1),(6,7,3,2),(7,4,0,3)])
    o=bpy.data.objects.new('Ring segment',mesh);scene.collection.objects.link(o);o.data.materials.append(materials['Stone']);parts.append(o)
ring(9.6,0,.05,'Gold',True);ring(10.4,0,.05,'Gold',True)
for i in range(32):
    a=i*math.tau/32;o=box((10*math.cos(a),0,10*math.sin(a)),(.22,.8,1),'Pale');o.rotation_euler.y=math.pi/2-a
finish('ring')

for x in [-1.8,1.8]:
    box((x,0,3),(.6,1,6),'Pale');box((x,-.55,3),(.1,.15,5.8),'Gold')
box((0,0,6),(4.2,1,.5),'Pale');box((0,-.55,5.8),(3.2,.1,.08),'Gold')
finish('portal')

for r,z,h in [(8,.15,.3),(7.7,.4,.2),(7.4,.62,.24)]:cone((0,0,z),r,r,h,'Obsidian',96)
ring(7.5,.76,.045,'Gold')
for i in range(24):
    a=i*math.tau/24;o=box((7.6*math.cos(a),7.6*math.sin(a),1),(.3,.7,.8),'Pale');o.rotation_euler.z=a
finish('support')

box((0,0,-.3),(8,8,.6),'Stone',.14);box((0,0,.03),(7.7,7.7,.08),'Obsidian',.04)
cone((0,0,-2),5.3,2,3,'Stone',4)
for x in [-3.7,3.7]:box((x,0,.085),(.045,7.4,.025),'Gold',.005)
finish('platform')
box((0,0,0),(3,3,.08),'Stone');box((0,0,.045),(2.7,2.7,.035),'Obsidian',.06)
for x in [-1.37,1.37]:box((x,0,.07),(.03,2.8,.02),'Gold',.005)
finish('panel')
box((0,0,0),(4,.3,.3),'Pale');box((0,-.18,0),(3.8,.06,.06),'Gold',.01)
finish('trim')

# Faceless, hooded sentinel with pleated robe and recessed hood cavity.
verts=[];faces=[];segments=32
for z,r in [(0,.48),(.12,.46),(.8,.33),(1.4,.25),(1.65,.31),(1.78,.19)]:
    for i in range(segments):
        a=i*math.tau/segments;rr=r*(1+.1*math.cos(a*8));verts.append((rr*math.cos(a),rr*math.sin(a),z))
for j in range(5):
    for i in range(segments):
        k=j*segments+i;n=j*segments+(i+1)%segments;faces.append((k,n,n+segments,k+segments))
mesh=bpy.data.meshes.new('Pleated robe');mesh.from_pydata(verts,[],faces)
o=bpy.data.objects.new('Robe',mesh);scene.collection.objects.link(o);o.data.materials.append(materials['Obsidian']);parts.append(o)
# Hood arch forms a real dark opening, rather than a spherical head.
verts=[];faces=[]
for y in [-.22,.18]:
    for i in range(17):
        a=i*math.pi/16
        for r in [.19,.25]:verts.append((r*math.cos(a),y,1.79+r*math.sin(a)))
for i in range(16):
    k=i*2;faces.extend([(k,k+2,k+3,k+1),(k+34,k+35,k+37,k+36),(k+1,k+3,k+37,k+35)])
mesh=bpy.data.meshes.new('Hood shell');mesh.from_pydata(verts,[],faces)
o=bpy.data.objects.new('Hood',mesh);scene.collection.objects.link(o);o.data.materials.append(materials['Obsidian']);parts.append(o)
box((0,.16,1.87),(.34,.06,.27),'Obsidian',.05)
for x in [-.12,.12]:box((x,-.16,.06),(.15,.3,.12),'Obsidian',.05)
o=ring(.1,1.52,.013,'Gold',True);o.location.y=.27
finish('sentinel')
# Cathedral wall bay: recessed vertical channels and separately cut stone courses.
for column in range(3):
    x=(column-1)*2.55
    for level in range(5):
        height=8.8
        box((x,.15,level*9+4.5),(2.45,.65,height),'Stone',.055)
        box((x-.93,-.22,level*9+4.5),(.12,.18,height-.18),'Pale',.025)
    box((x+.87,-.22,23),(.16,.1,42),'Obsidian',.015)
    for level in [7,19,34,41]:box((x+.87,-.285,level),(.04,.025,.9),'Gold',.004)
for x in [-3.85,3.85]:
    box((x,-.38,22.5),(.45,1.1,45),'Pale',.07)
    cone((x,-.38,46.5),.48,0,3,'Pale',4)
for z in [0.2,2.6,22.5,44.8]:box((0,-.4,z),(8,.9,.28),'Pale',.04)
finish('wall_bay')

# Purpose-built central landmark: dominant nave with four subordinate spires.
sources=[o for o in scene.objects if o.name.startswith('tower__')]
for x,y,scale,height in [(0,0,1.4,1.5),(-8.5,0,.65,1.3),(8.5,0,.65,1.2),(0,8.5,.65,1.35),(0,-8.5,.65,1.15)]:
    for source in sources:
        o=source.copy();o.data=source.data.copy();scene.collection.objects.link(o)
        o.matrix_world=Matrix.Translation((x,y,0)) @ Matrix.Diagonal((scale,scale,height,1)) @ source.matrix_world
        parts.append(o)
finish('hero_tower')

# Suspended district terrace: articulated cornice, ribs and broken descending piers.
# Origin is the walkable top, with the whole structure hanging below it.
box((0,0,-.5),(18,12,1),'Stone',.12)
box((0,0,.08),(17.5,11.5,.16),'Obsidian',.04)
for y in [-5.9,5.9]:
    box((0,y,-.1),(18.2,.26,.5),'Pale',.04)
    box((0,y,.2),(17.8,.04,.04),'Gold',.008)
for x in [-8.8,8.8]:box((x,0,-.1),(.26,12,.5),'Pale',.04)
for x in [-7,-3.5,0,3.5,7]:
    for y in [-4.8,4.8]:
        length=12+5*(.5+.5*math.sin(x*2.3+y))
        box((x,y,-length*.5-1),(.9,1,length),'Pale',.07)
        cone((x,y,-length-3),.12,.75,4,'Stone',5)
        box((x,y*1.04,-4),(.22,.14,5),'Obsidian',.015)
for z,w,d in [(-1.5,16,10),(-3,13,8),(-5,10,6)]:
    box((0,0,z),(w,d,.6),'Stone',.09)
cone((0,0,-9),2.2,5.5,10,'Stone',8)
finish('suspended_terrace')

box((0,0,7.5),(2,1,15),'Stone',0);finish('collision_monolith')
box((0,0,25),(9,9,50),'Stone',0);finish('collision_tower')

# Bake local ambient occlusion into vertex colors. This travels with the GLB kit
# and supplies crevice shading even outside the small real-time shadow volume.
from mathutils.bvhtree import BVHTree
bpy.context.view_layer.update()
module_names=sorted(set(o.name.split('__')[0] for o in scene.objects if not o.name.startswith('collision_')))
for module in module_names:
    objects=[o for o in scene.objects if o.name.startswith(module+'__')]
    verts=[];polys=[]
    for o in objects:
        offset=len(verts);verts.extend([o.matrix_world @ v.co for v in o.data.vertices])
        polys.extend([tuple(offset+i for i in p.vertices) for p in o.data.polygons])
    tree=BVHTree.FromPolygons(verts,polys)
    for o in objects:
        colors=o.data.color_attributes.new(name='Contact shading',type='FLOAT_COLOR',domain='POINT')
        o.data.color_attributes.active_color=colors
        normal_matrix=o.matrix_world.to_3x3().inverted().transposed()
        for v in o.data.vertices:
            normal=(normal_matrix @ v.normal).normalized()
            tangent=normal.cross(Vector((0,0,1)) if abs(normal.z)<.9 else Vector((0,1,0))).normalized()
            bitangent=normal.cross(tangent)
            origin=o.matrix_world @ v.co+normal*.025
            hits=0
            for sample in range(8):
                angle=sample*2.3999632297;z=.25+.7*(sample+.5)/8;r=math.sqrt(1-z*z)
                direction=tangent*(math.cos(angle)*r)+bitangent*(math.sin(angle)*r)+normal*z
                if tree.ray_cast(origin,direction,2.2)[0] is not None:hits+=1
            shade=1-.55*hits/8
            colors.data[v.index].color=(shade,shade,shade,1)
print('BAKED module contact shading')

# Authored LODs retain tower crowns and monolith outlines while reducing bevels.
for source in list(scene.objects):
    module=source.name.split('__')[0]
    if module not in ['tower','monolith','arch']:continue
    lod=source.copy();lod.data=source.data.copy();scene.collection.objects.link(lod)
    lod.name=source.name.replace(module+'__',module+'_lod__')
    bpy.context.view_layer.objects.active=lod
    modifier=lod.modifiers.new('Distant silhouette','DECIMATE');modifier.ratio=.28 if module=='tower' else .45
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    lod.data.validate(clean_customdata=True)
    lod.data.update()

out=r'D:/project astra/project/public/assets/models'
os.makedirs(out,exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.wm.save_as_mainfile(filepath=r'D:/project astra/project/assets/blender/infinitum-kit.blend')
bpy.ops.export_scene.gltf(filepath=out+'/infinitum-kit.glb',export_format='GLB',use_selection=True,export_apply=True,export_vertex_color='ACTIVE',export_meshopt_compression_enable=True,export_meshopt_extension='EXT_meshopt_compression')
print('EXPORTED',len(scene.objects),'meshes',os.path.getsize(out+'/infinitum-kit.glb'),'bytes')

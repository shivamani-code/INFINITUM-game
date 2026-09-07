"""Create a separate, inspectable kit gallery without changing export origins."""
import bpy, math
from mathutils import Matrix, Vector

kit=bpy.data.scenes.get('INFINITUM_Kit')
if kit is None:
    with bpy.data.libraries.load(r'D:/project astra/project/assets/blender/infinitum-kit.blend',link=False) as (source,target):
        target.scenes=['INFINITUM_Kit']
    kit=target.scenes[0]
bpy.context.window.scene=kit
bpy.context.view_layer.update()
source_matrices={o.name:o.matrix_world.copy() for o in kit.objects}
preview=bpy.data.scenes.get('INFINITUM_Preview') or bpy.data.scenes.new('INFINITUM_Preview')
bpy.context.window.scene=preview
for o in list(preview.objects):bpy.data.objects.remove(o,do_unlink=True)
modules=[('hero_tower',-22,8,.3),('tower',-10,8,.4),('wall_bay',3,10,.48),('arch',15,8,1.4),('ring',28,10,.7),
         ('monolith',-20,-9,1),('sentinel',-10,-9,4),('portal',0,-9,1.7),('platform',14,-9,.85),('support',28,-9,.65)]
for name,x,y,scale in modules:
    for source in kit.objects:
        if not source.name.startswith(name+'__'):continue
        o=source.copy();preview.collection.objects.link(o)
        lift=7.5 if name=='ring' else (3 if name=='platform' else 0)
        o.matrix_world=Matrix.Translation((x,y,lift)) @ Matrix.Diagonal((scale,scale,scale,1)) @ source_matrices[source.name]
    curve=bpy.data.curves.new(name+' label','FONT');curve.body=name.replace('_',' ').upper();curve.align_x='CENTER';curve.size=.65
    text=bpy.data.objects.new(name+' label',curve);preview.collection.objects.link(text);text.location=(x,y-4,.04)
    curve.materials.append(bpy.data.materials['Kit_Gold'])
bpy.ops.mesh.primitive_plane_add(size=160)
floor=bpy.context.object;floor.name='Preview floor';floor.location.z=-.08
floor.data.materials.append(bpy.data.materials['Kit_Obsidian'])
world=bpy.data.worlds.new('Kit preview world') if not preview.world else preview.world
world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.17,.22,.3,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.45;preview.world=world
bpy.ops.object.light_add(type='AREA',location=(0,-12,45));light=bpy.context.object;light.data.energy=22000;light.data.shape='DISK';light.data.size=30
bpy.ops.object.light_add(type='SUN',location=(-30,-20,30));bpy.context.object.rotation_euler=(.4,-.5,-.6);bpy.context.object.data.energy=2.5
bpy.ops.object.camera_add(location=(47,-68,49));camera=bpy.context.object
camera.rotation_euler=(Vector((3,0,10))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=78;preview.camera=camera
preview.render.engine='BLENDER_EEVEE';preview.render.resolution_x=1600;preview.render.resolution_y=1000;preview.render.resolution_percentage=100
preview.render.image_settings.file_format='PNG';preview.render.filepath=r'D:/project astra/project/artifacts/blender-kit-gallery.png'
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':area.spaces.active.region_3d.view_perspective='CAMERA'
bpy.ops.wm.save_as_mainfile(filepath=r'D:/project astra/project/assets/blender/infinitum-kit-preview.blend')
bpy.ops.render.render(write_still=True)
print('Gallery rendered; runtime asset origins are unchanged.')

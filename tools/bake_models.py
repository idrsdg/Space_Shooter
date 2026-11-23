# blender --background --python tools/bake_models.py [-- name1 name2]
import os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
import kit, models

t0 = time.time()
kit.clear_scene()
bpy.context.scene.render.fps = 30
pk = kit.Packer()
for m in models.build_all():
    pk.add(m)
mf = pk.write({'palette': kit.PAL_NAMES})
print('BAKED', len(pk.models), 'models', {k: v['bytes'] for k, v in mf['files'].items()}, round(time.time() - t0), 's', flush=True)

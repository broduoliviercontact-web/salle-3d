# 5. Dans Blender : construit les objets (un par niveau/catégorie ou par élément) et exporte halle_ifc.glb (Draco)
#    /Applications/Blender.app/Contents/MacOS/Blender -b --python tools/build.py
import bpy, pickle, os, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.read_factory_settings(use_empty=True)
D = pickle.load(open(os.path.join(HERE, "work", "prep.pkl"), "rb"))
mats = []
for i, (r, g, b, a) in enumerate(D["mats"]):
    m = bpy.data.materials.new(f"m{i}"); m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]; p.inputs["Base Color"].default_value = (r, g, b, 1)
    if a < 1: p.inputs["Alpha"].default_value = a; m.surface_render_method = 'BLENDED'
    mats.append(m)
col = bpy.context.scene.collection; parents = {}
for n in D["nodes"]:
    st = n["storey"]
    if st not in parents:
        e = bpy.data.objects.new(st, None); col.objects.link(e); parents[st] = e
    v, t, m = n["v"], n["t"], n["m"]
    me = bpy.data.meshes.new(n["name"])
    me.vertices.add(len(v)); me.vertices.foreach_set("co", v.ravel())
    me.loops.add(t.size); me.loops.foreach_set("vertex_index", t.ravel())
    me.polygons.add(len(t)); me.polygons.foreach_set("loop_start", np.arange(0, t.size, 3, dtype=np.int32))
    used = np.unique(m); remap = {u: i for i, u in enumerate(used)}
    for u in used: me.materials.append(mats[u])
    me.polygons.foreach_set("material_index", np.vectorize(remap.get)(m).astype(np.int32) if len(used) > 1 else np.zeros(len(t), np.int32))
    me.update(); me.validate()
    ob = bpy.data.objects.new(n["name"], me); ob["sel"] = 1; ob["env"] = n["env"]; ob.parent = parents[st]; col.objects.link(ob)
print("OBJS", len(bpy.data.objects), flush=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(os.path.dirname(HERE), "halle_ifc.glb"),
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6, export_extras=True, export_yup=True, export_normals=False)
print("DONE", flush=True)

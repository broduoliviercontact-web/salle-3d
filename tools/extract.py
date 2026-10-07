# 1. IFC -> géométrie triangulée par élément (coordonnées monde, m) -> work/geom.pkl
import ifcopenshell, ifcopenshell.geom, ifcopenshell.util.element as ue, multiprocessing, pickle, numpy as np, os
from common import IFC, WORK
f = ifcopenshell.open(IFC)
s = ifcopenshell.geom.settings(); s.set("use-world-coords", True)
SKIP = {"IfcOpeningElement", "IfcSpace", "IfcGridAxis", "IfcGrid", "IfcAnnotation", "IfcSite"}
it = ifcopenshell.geom.iterator(s, f, multiprocessing.cpu_count(), exclude=[e for e in f.by_type("IfcProduct") if e.is_a() in SKIP])
out = []
if it.initialize():
    while True:
        sh = it.get(); e = f.by_id(sh.id); g = sh.geometry
        v = np.array(g.verts, np.float64).reshape(-1, 3)  # float64 : coordonnées géographiques (~8e6 m)
        tri = np.array(g.faces, np.int32).reshape(-1, 3)
        mats = [(tuple(m.diffuse.components) if hasattr(m.diffuse, 'components') else tuple(m.diffuse),
                 (1 - m.transparency) if m.transparency == m.transparency else 1) for m in g.materials]
        st = ue.get_container(e); st = st.Name if st else "?"
        out.append(dict(cls=e.is_a(), name=e.Name or "", gid=e.GlobalId, storey=st, v=v, t=tri, mid=np.array(g.material_ids, np.int32), mats=mats))
        if not it.next(): break
print("éléments", len(out), "triangles", sum(len(o["t"]) for o in out))
pickle.dump(out, open(os.path.join(WORK, "geom.pkl"), "wb"))

# 7. Bar central : contours du DXF (calque A3-6) extrudés dans le site -> bar.json
#    comptoirs = polygones fermés (1,10 m) ; arrière-bars = bande de 50 cm le long des lignes en U (0,90 m)
import json, os, numpy as np
from ezdxf import recover, bbox
from ezdxf.path import make_path
from common import DXF, ALIGN, ROOT
a = json.load(open(ALIGN)); SHIFT = np.array(a["T"]) @ np.array(a["R"])
BAR = np.array([92.0, -104.1])  # position du texte « BAR » dans le DXF
msp = recover.readfile(DXF)[0].modelspace(); shapes = []
def walk(ents, parent=None, depth=0):
    for e in ents:
        lay = e.dxf.layer if e.dxf.layer != '0' or parent is None else parent
        if e.dxftype() == 'INSERT':
            if depth < 4:
                try: walk(e.virtual_entities(), lay, depth + 1)
                except Exception: pass
            continue
        if not lay.endswith("A3-6"): continue
        try: b = bbox.extents([e])
        except Exception: continue
        if b.has_data and abs(b.center.x - BAR[0]) < 7 and abs(b.center.y - BAR[1]) < 4 and max(b.size.x, b.size.y) >= 2:
            p = np.array([(q.x, q.y) for q in make_path(e).flattening(0.02)])
            shapes.append((bool(getattr(e, 'closed', False)), p[np.r_[True, np.linalg.norm(np.diff(p, axis=0), axis=1) > 1e-3]]))
walk(msp)
def offset(p, d, ctr):  # décale une polyligne ouverte de d vers l'extérieur
    t = np.gradient(p, axis=0); n = np.c_[t[:, 1], -t[:, 0]]; n /= np.linalg.norm(n, axis=1)[:, None]
    return p + (n if np.mean(np.sum((p - ctr) * n, axis=1)) >= 0 else -n) * d
ctr = BAR + (0, 0.8); out = []
for closed, p in shapes:
    if closed: out.append(dict(name="Comptoir", h=1.10, color=0x8a5a3c, pts=p))
    else: out.append(dict(name="Arrière-bar", h=0.90, color=0x5c5f66, pts=np.vstack([p, offset(p, 0.5, ctr)[::-1]])))
json.dump([dict(o, pts=(o["pts"] + SHIFT).round(3).tolist()) for o in out], open(os.path.join(ROOT, "bar.json"), "w"))
print([(o["name"], len(o["pts"])) for o in out])

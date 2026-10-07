# 6. Plan DXF « hall avec scène » -> plan_scene.json (segments dans le repère redressé de l'IFC)
import json, os, numpy as np, collections
from common import DXF, ALIGN, ROOT
from ezdxf import recover
from ezdxf.path import make_path
a = json.load(open(ALIGN)); R = np.array(a["R"]); T = np.array(a["T"])
SHIFT = T @ R  # repère redressé : p' = R⁻¹(R·d + T) = d + R⁻¹·T
d, _ = recover.readfile(DXF); msp = d.modelspace()
BATI = ('WALL', 'COLS', 'PART', 'ESCALIER', 'CLOISO')
EQUIP = ('EQUIPE', 'MOBILIER', 'MENUIS')  # bar, comptoirs, mobilier
out = {"bati": [], "scene": [], "equip": []}; cnt = collections.Counter()
def cat(layer):
    L = layer.upper()
    if 'POLARBEAR' in L: return "scene"
    if any(k in L for k in BATI): return "bati"
    if any(k in L for k in EQUIP): return "equip"
def add(e, c):
    try: pts = np.array([(p.x, p.y) for p in make_path(e).flattening(0.1)])
    except Exception: return
    if len(pts) < 2: return
    # ponytail: menuiseries très détaillées (lames…) -> on ne garde que les grands contours (comptoir du bar, etc.)
    if c == "equip" and (np.ptp(pts, axis=0).max() < 1.0): return
    q = pts + SHIFT
    a, b = q[:-1], q[1:]; m = (np.abs(a[:, 0]) < 110) & (np.abs(a[:, 1]) < 60)
    out[c].extend(np.hstack([a[m], b[m]]).round(2).ravel().tolist()); cnt[c] += m.sum()
def walk(ents, parent=None, depth=0):
    for e in ents:
        lay = e.dxf.layer if e.dxf.layer != '0' or parent is None else parent
        if e.dxftype() == 'INSERT':
            if depth < 4:
                try: walk(e.virtual_entities(), lay, depth + 1)
                except Exception: pass
            continue
        c = cat(lay)
        if c and e.dxftype() in ('LINE', 'LWPOLYLINE', 'POLYLINE', 'ARC', 'CIRCLE', 'SPLINE', 'ELLIPSE'): add(e, c)
walk(msp)
print(cnt)
json.dump(out, open(os.path.join(ROOT, "plan_scene.json"), "w"), separators=(',', ':'))

# 3. Calage du plan DXF sur l'IFC en superposant les poteaux (vote rotation/translation puis ICP) -> align.json
import pickle, json, os, numpy as np
from ezdxf import recover, bbox
from common import WORK, DXF, ALIGN
geo = pickle.load(open(os.path.join(WORK, "geom.pkl"), "rb"))
O = np.array([1656844.1408686652, 8188571.819090003])  # origine du repère local (centre des murs, cf. prep.py)
ic = np.unique(np.array([o["v"][:, :2].mean(0) - O for o in geo if o["cls"] == "IfcColumn"
                         and o["storey"] in ("Halle_RDC_Est", "Halle_RDC_Mail", "Halle_RDC_Ouest")]).round(1), axis=0)
msp = recover.readfile(DXF)[0].modelspace(); dc = []
for e in msp:
    L = e.dxf.layer.upper()
    if "COLS" in L and "MCUT" in L:
        b = bbox.extents([e])
        if b.has_data and max(b.size.x, b.size.y) < 2: dc.append([b.center.x, b.center.y])
dc = np.unique(np.array(dc).round(1), axis=0)
rot = lambda a: np.array([[np.cos(a), -np.sin(a)], [np.sin(a), np.cos(a)]])
best = (0, 0, None)
for a in np.radians(np.arange(0, 360, 0.25)):   # vote : translation la plus fréquente pour chaque angle
    D = (ic[:, None] - (dc @ rot(a).T)[None]).reshape(-1, 2)
    vals, cnt = np.unique(np.round(D / 0.5), axis=0, return_counts=True)
    if cnt.max() > best[0]: best = (cnt.max(), a, vals[cnt.argmax()] * 0.5)
_, a, T = best; R = rot(a)
for _ in range(20):                              # ICP : affine sur les paires proches
    q = dc @ R.T + T; d = np.linalg.norm(q[:, None] - ic[None], axis=2); j = d.argmin(1); m = d.min(1) < 1.0
    A, B = dc[m], ic[j[m]]; ca, cb = A.mean(0), B.mean(0)
    U, S, Vt = np.linalg.svd((A - ca).T @ (B - cb)); R = Vt.T @ U.T
    if np.linalg.det(R) < 0: Vt[1] *= -1; R = Vt.T @ U.T
    T = cb - ca @ R.T
err = np.linalg.norm((dc @ R.T + T)[m] - ic[j[m]], axis=1)
print(f"{m.sum()}/{len(dc)} poteaux appariés, écart moyen {err.mean():.3f} m, angle {np.degrees(np.arctan2(R[1,0], R[0,0])):.2f}°")
json.dump({"R": R.tolist(), "T": T.tolist()}, open(ALIGN, "w"))

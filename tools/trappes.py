# 9. Trappes de sol (boîtiers « forains » événementiels) relevées sur le PDF de repérage -> ../trappes.json
#    Le PDF n'existe qu'en image : on le cale sur le DXF par les étiquettes d'axes (pdf2dxf.json, écart moyen 12 cm),
#    puis on prend le symbole au centre de chaque nuage (ou le centre du nuage si un trait le traverse).
#    Rendu du PDF : page à 3× (5052 px de large) -> SALLE_PDF_PNG
import json, os, numpy as np
from PIL import Image, ImageDraw
from common import ROOT, HERE, ALIGN
PNG = os.environ.get("SALLE_PDF_PNG", os.path.join(HERE, "work", "trappes_p1.png"))
M = np.array(json.load(open(os.path.join(HERE, "pdf2dxf.json"))))       # pixel (3×) -> DXF
a = json.load(open(ALIGN)); SHIFT = np.array(a["T"]) @ np.array(a["R"])  # DXF -> site (x, -z)
S = 2.53  # positions repérées sur l'aperçu 2000 px -> pixels de la page à 3×
NUAGES = {"63A": [(1430, 361), (1562, 357), (1437, 491), (1620, 487), (1776, 543), (1134, 556), (1356, 652), (1440, 654), (1541, 655), (1673, 697), (1755, 688)],
          "32A": [(648, 591), (963, 593), (430, 634)]}
rgb = np.asarray(Image.open(PNG).convert("RGB")).astype(int); r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]; gray = rgb.mean(2)
RED = (r > 170) & (g < 110) & (b < 110); BLUE = (b > 150) & (r < 150) & (b - r > 60)
out = []
for kind, lst in NUAGES.items():
    for (x, y) in lst:
        cx, cy, R = int(x * S), int(y * S), 90
        m = (RED if kind == "63A" else RED | BLUE)[cy - R:cy + R, cx - R:cx + R]
        img = Image.fromarray(np.pad(np.where(m, 255, 0).astype(np.uint8), 2)).copy(); ImageDraw.floodfill(img, (0, 0), 128)
        inside = (np.asarray(img) == 0)[2:-2, 2:-2]                        # intérieur du nuage
        ys, xs = np.nonzero(inside & (gray[cy - R:cy + R, cx - R:cx + R] < 140) & ~m)
        if len(xs) < 5 or max(np.ptp(xs), np.ptp(ys)) > 30: ys, xs = np.nonzero(inside)  # trait qui traverse : centre du nuage
        px, py = (xs.min() + xs.max()) / 2 + cx - R, (ys.min() + ys.max()) / 2 + cy - R
        d = np.array([px, py, 1]) @ M; p = d + SHIFT
        out.append(dict(n=len(out) + 1, kind=kind, label=("63 A + RJ45" if kind == "63A" else "32 A"), dxf=d.round(2).tolist(), x=round(float(p[0]), 2), z=round(float(-p[1]), 2)))
json.dump(out, open(os.path.join(ROOT, "trappes.json"), "w"), indent=1, ensure_ascii=False)
for o in out: print(o["n"], o["kind"], o["dxf"])

# 9. Trappes de sol (boîtiers « forains » événementiels) relevées sur le PDF de repérage -> ../trappes.json
#    Le PDF n'existe qu'en image : on le cale sur le DXF par les étiquettes d'axes (pdf2dxf.json, écart moyen 12 cm) ;
#    dans la halle est, correction locale par les poteaux du PDF superposés à ceux de l'IFC (pdf2dxf_est.json, 34 poteaux, 3 cm),
#    vérifiée sur les socles de T3 et T4 (≈ 5 cm).
#    puis on prend le symbole au centre de chaque nuage (ou le centre du nuage si un trait le traverse).
#    Rendu du PDF : page à 3× (5052 px de large) -> SALLE_PDF_PNG
import json, os, numpy as np
from PIL import Image, ImageDraw
from common import ROOT, HERE, ALIGN
PNG = os.environ.get("SALLE_PDF_PNG", os.path.join(HERE, "work", "trappes_p1.png"))
M = np.array(json.load(open(os.path.join(HERE, "pdf2dxf.json"))))       # pixel (3×) -> DXF
M_EST = np.array(json.load(open(os.path.join(HERE, "pdf2dxf_est.json"))))  # DXF -> DXF corrigé, halle est (x > 30 m)
a = json.load(open(ALIGN)); SHIFT = np.array(a["T"]) @ np.array(a["R"])  # DXF -> site (x, -z)
S = 2.53  # positions repérées sur l'aperçu 2000 px -> pixels de la page à 3×
NUAGES = {"63A": [(1430, 361), (1562, 357), (1437, 491), (1620, 487), (1776, 543), (1134, 556), (1356, 652), (1440, 654), (1541, 655), (1673, 697), (1755, 688)],
          "32A": [(648, 591), (963, 593), (430, 634)]}
rgb = np.asarray(Image.open(PNG).convert("RGB")).astype(int); r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]; gray = rgb.mean(2)
RED = (r > 170) & (g < 110) & (b < 110); BLUE = (b > 150) & (r < 150) & (b - r > 60)
def components(mask):  # composantes connexes (8-voisinage) d'un petit masque
    seen = np.zeros_like(mask, bool); H, W = mask.shape
    for y0, x0 in zip(*np.nonzero(mask)):
        if seen[y0, x0]: continue
        stack, comp = [(y0, x0)], []; seen[y0, x0] = True
        while stack:
            y, x = stack.pop(); comp.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < H and 0 <= xx < W and mask[yy, xx] and not seen[yy, xx]: seen[yy, xx] = True; stack.append((yy, xx))
        yield comp
out = []
for kind, lst in NUAGES.items():
    for (x, y) in lst:
        cx, cy, R = int(x * S), int(y * S), 90
        m = (RED if kind == "63A" else RED | BLUE)[cy - R:cy + R, cx - R:cx + R]
        img = Image.fromarray(np.pad(np.where(m, 255, 0).astype(np.uint8), 2)).copy(); ImageDraw.floodfill(img, (0, 0), 128)
        inside = (np.asarray(img) == 0)[2:-2, 2:-2]                        # intérieur du nuage
        ink = inside & (gray[cy - R:cy + R, cx - R:cx + R] < 140) & ~m
        iy, ix = np.nonzero(inside); c0 = np.array([ix.mean(), iy.mean()])
        # symbole = petit amas de traits (≤ 14 px, ~60 cm) le plus proche du centre du nuage ; les longs traits (axes) sont écartés
        best = None
        for comp in components(ink):
            cyx = np.array(comp); h, w = np.ptp(cyx, axis=0)
            if max(h, w) <= 14 and len(cyx) >= 4:
                ctr = np.array([(cyx[:, 1].min() + cyx[:, 1].max()) / 2, (cyx[:, 0].min() + cyx[:, 0].max()) / 2])
                dist = np.linalg.norm(ctr - c0)
                if best is None or dist < best[0]: best = (dist, ctr)
        px, py = (best[1] if best else c0) + (cx - R, cy - R)
        d = np.array([px, py, 1]) @ M
        if d[0] > 30: d = np.r_[d, 1] @ M_EST
        p = d + SHIFT
        out.append(dict(n=len(out) + 1, kind=kind, label=("63 A + RJ45" if kind == "63A" else "32 A"), dxf=d.round(2).tolist(), x=round(float(p[0]), 2), z=round(float(-p[1]), 2)))
json.dump(out, open(os.path.join(ROOT, "trappes.json"), "w"), indent=1, ensure_ascii=False)
for o in out: print(o["n"], o["kind"], o["dxf"])

# Zones de restauration du plan DACAM (LGS-GH DA8.2, plan de niveau RdC, accessibilité) -> restauration_dacam.json
#  - contours : zones roses hachurées du PDF (raster 50 px/m, ouverture puis fermeture morphologique, contour extérieur)
#  - mobilier : tracés vectoriels noirs du PDF dans chaque zone (tables, chaises + dossier, tabourets, mange-debout, tables rondes)
#  - calage PDF -> plan du site : le PDF est au 1:200 ; corrélation de son rendu avec plan_fond.png
#    (échelle 1,001, rotation 0, décalage mesuré ci-dessous), écart estimé < 5 cm
# Usage : SALLE_DACAM=/chemin/plan.pdf python3 tools/resto_dacam.py   (pymupdf, numpy, opencv-python, shapely)
import os, json, math, collections
import numpy as np, cv2, pymupdf
from shapely.geometry import Polygon, Point
from common import ROOT, DL
PDF = os.environ.get("SALLE_DACAM", os.path.join(DL, "LGS-GH_DA8.2 - Plan de niveau côté - Accessibilité RdC.pdf"))
S = 72 / 0.2 / 25.4 * 1          # points PDF par mètre au 1:200 (14,17)
# calage : pixel du rendu à 122 dpi -> pixel de plan_fond.png (24 px/m) : u = (col - 600) / 1.001, v = (row - 474) / 1.001
DPI_REG, OFF_C, OFF_R, SC = 122, 600, 474, 1.001
DWG_SHIFT = (-17.3389, 107.607)
def site(px, py):  # point PDF (pt) -> plan du site (x, z)
    u = (px * DPI_REG / 72 - OFF_C) / SC / 24; v = (py * DPI_REG / 72 - OFF_R) / SC / 24
    return (round(-80 + u + DWG_SHIFT[0], 3), round(65 + v - DWG_SHIFT[1], 3))
R = 1 / (DPI_REG / 72 / SC / 24)  # pt par mètre réellement (pour les tailles)

doc = pymupdf.open(PDF); pg = doc[0]
# 1. zones roses (région de la halle est)
CLIP = pymupdf.Rect(3900 * 72 / 254, 1700 * 72 / 254, 10500 * 72 / 254, 4100 * 72 / 254)
pix = pg.get_pixmap(dpi=254, clip=CLIP)
im = np.frombuffer(pix.samples, np.uint8).reshape(pix.h, pix.w, pix.n)[..., :3].astype(int)
pink = (abs(im[..., 0] - 242) < 14) & (abs(im[..., 1] - 214) < 16) & (abs(im[..., 2] - 214) < 16)
el = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
m = cv2.morphologyEx((pink * 255).astype(np.uint8), cv2.MORPH_OPEN, el(2))   # retire les traits fins rosés (axes rouges anticrénelés)
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, el(9))                              # rebouche hachures et mobilier (0,18 m)
cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
k = 72 / 254
zones = []
for c in cs:
    if cv2.contourArea(c) / 2500 < 3: continue
    c = cv2.approxPolyDP(c, 4, True)
    P = Polygon([(CLIP.x0 + p[0][0] * k, CLIP.y0 + p[0][1] * k) for p in c]).buffer(0)
    zones.append(max(P.geoms, key=lambda g: g.area) if P.geom_type == 'MultiPolygon' else P)

# 2. mobilier : formes noires fermées
def shape(d):
    pts = []
    for it in d["items"]:
        if it[0] == "l": pts += [it[1], it[2]]
        elif it[0] == "qu": q = it[1]; pts += [q.ul, q.ur, q.lr, q.ll]
        elif it[0] == "re": r = it[1]; pts += [r.tl, r.tr, r.br, r.bl]
        elif it[0] == "c": pts += [it[1], it[2], it[3], it[4]]
    return [(p.x, p.y) for p in pts]
items = collections.defaultdict(list)
for d in pg.get_drawings():
    if d["type"] != "s" or not d.get("color") or max(d["color"]) > 0.05: continue
    r = d["rect"]; cx, cy = (r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2
    zi = next((i for i, z in enumerate(zones) if z.contains(Point(cx, cy))), None)
    if zi is None: continue
    kinds = [it[0] for it in d["items"]]; pts = shape(d)
    w, h = r.width / R, r.height / R
    if kinds == ["c"] * 4 or (len(kinds) >= 12 and set(kinds) == {"l"}):  # cercle (4 courbes ou polygone fin)
        rad = [math.dist((cx, cy), p) for p in pts]
        if max(rad) - min(rad) > 0.12 * R or abs(w - h) > 0.06: continue  # arbre, forme irrégulière
        items[zi].append(("o", cx, cy, (w + h) / 2)); continue
    if kinds == ["qu"] or (kinds == ["l"] * 4) or kinds == ["re"]:
        P = pts[:4]
        e1 = (P[1][0] - P[0][0], P[1][1] - P[0][1]); e2 = (P[2][0] - P[1][0], P[2][1] - P[1][1])
        a, b = math.hypot(*e1) / R, math.hypot(*e2) / R
        ang = math.atan2(e1[1], e1[0])
        if a < b: a, b, ang = b, a, math.atan2(e2[1], e2[0])  # a : grand côté, ang : sa direction
        items[zi].append(("r", cx, cy, a, b, ang))

def dedupe(lst, tol):
    out = []
    for it in lst:
        if not any(o[0] == it[0] and math.dist(o[1:3], it[1:3]) < tol and abs(o[3] - it[3]) < 0.08 for o in out): out.append(it)
    return out
# noms (centre approximatif dans le repère du site) ; les zones sans mobilier (files d'attente) sont ignorées
NAMES = [(73.4, 13.2, "Terrasse sud-est"), (63.2, -0.6, "Agora est"), (48.0, -1.0, "Agora ouest (scène animation)"), (73.6, -4.5, "Bar"),
         (54.2, -9.1, "Tablées hautes nord 3"), (43.4, -9.3, "Tablées hautes nord 2"), (35.2, -9.2, "Tablées hautes nord 1"), (70.3, -10.3, "Nord-est (près du bar)"),
         (16.8, -12.8, "Tablée haute ouest"), (32.0, -15.3, "Mange-debout stands ouest"), (35.4, -20.6, "Comptoir nord"),
         (65.2, -23.7, "Alcôve 2"), (46.0, -22.8, "Alcôve 1")]
res = []
for zi, z in enumerate(zones):
    z = z.buffer(-0.6 * R, join_style=2).buffer(0.6 * R, join_style=2)  # retire les bandes étroites (file d'attente collée à une zone)
    if z.is_empty: continue
    if z.geom_type == 'MultiPolygon': z = max(z.geoms, key=lambda g: g.area)
    L = dedupe(items.get(zi, []), 0.08 * R)
    backs = [it for it in L if it[0] == "r" and it[4] < 0.08 and 0.35 < it[3] < 0.55]           # dossiers
    chairs = [it for it in L if it[0] == "r" and 0.38 < it[3] < 0.52 and 0.38 < it[4] < 0.52]
    tables = [it for it in L if it[0] == "r" and it[4] >= 0.5 and it[3] * it[4] > 0.3]
    circ = [it for it in L if it[0] == "o"]
    stools = [it for it in circ if 0.38 < it[3] < 0.52]
    discs = [it for it in circ if it[3] >= 0.55]
    out = []
    for t in tables:  # table haute si des tabourets l'entourent
        near = sum(1 for s in stools if math.dist(s[1:3], t[1:3]) < (t[3] / 2 + 0.8) * R)
        x, zz = site(t[1], t[2]); out.append(["t", x, zz, round(t[3], 2), round(t[4], 2), round(t[5], 3), 1.1 if near >= 2 else 0.75])
    for c in chairs:  # orientation : le dossier est derrière, la chaise regarde à l'opposé
        bk = min(backs, key=lambda b: math.dist(b[1:3], c[1:3]), default=None)
        if bk and math.dist(bk[1:3], c[1:3]) < 0.4 * R: a = math.atan2(c[2] - bk[2], c[1] - bk[1])
        else:
            tb = min(tables, key=lambda t: math.dist(t[1:3], c[1:3]), default=None)
            a = math.atan2(tb[2] - c[2], tb[1] - c[1]) if tb else 0
        x, zz = site(c[1], c[2]); out.append(["c", x, zz, round(a, 3)])
    for s in stools: x, zz = site(s[1], s[2]); out.append(["s", x, zz])
    for o in discs: x, zz = site(o[1], o[2]); out.append(["o", x, zz, round(o[3], 2), 1.1 if o[3] < 0.8 else 0.75])
    if not out: continue
    poly = [site(*p) for p in z.simplify(0.05 * R).exterior.coords[:-1]]
    cx, cz = sum(p[0] for p in poly) / len(poly), sum(p[1] for p in poly) / len(poly)
    name = min(NAMES, key=lambda n: math.dist(n[:2], (cx, cz)))[2]
    out = [[it[0]] + [round(v, 2) if isinstance(v, float) else v for v in it[1:]] for it in out]
    res.append({"id": "dacam-%d" % len(res), "name": name, "poly": [[round(x, 2), round(z_, 2)] for x, z_ in poly], "items": out})
    if out: print(zi, "surface", round(z.area / R / R, 1), "m²", collections.Counter(i[0] for i in out))
json.dump({"source": "LGS-GH DA8.2 — Plan de niveau côté — Accessibilité RdC (DACAM)", "zones": res},
          open(os.path.join(os.environ.get("OUT", ROOT), "restauration_dacam.json"), "w"), ensure_ascii=False, separators=(",", ":"))
print(len(res), "zones", sum(len(z["items"]) for z in res), "éléments")

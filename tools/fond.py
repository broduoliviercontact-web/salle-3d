# 8. Fond de plan pour l'aperçu 2D : le DXF « hall avec scène » complet (sans hachures ni isolants), en gris
#    -> ../plan_fond.svg, en coordonnées DXF (le site le recale lui-même à l'export)
import os, re, numpy as np, collections
from ezdxf import recover
from ezdxf.path import make_path
from common import DXF, ROOT
X0, X1, Y0, Y1 = -80, 115, -130, -65                        # emprise du bâtiment (m, repère DXF)
SKIP = re.compile(r"ISOLAT|HACH|PATT|SERRUR|DEFPOINTS|ZAF-04|DEPLACEMENT|COTATION.*(PR|H\d)")
STYLE = {  # catégorie -> (couleur, épaisseur en m)
    "struct": ("#3a3a3a", 0.03), "scene": ("#d8b04a", 0.015), "axe": ("#c9c9c9", 0.01), "autre": ("#9e9e9e", 0.012)}
def cat(L):
    U = L.upper()
    if "POLARBEAR" in U: return "scene"
    if "AXE" in U and "COTATION" not in U or U.endswith("AXE"): return "axe"
    if re.search(r"WALL|COLS|GROS-O|STRUCT|CLOISO|PART-|BATI", U): return "struct"
    return "autre"
paths = collections.defaultdict(list); texts = []
TILE = 10  # dalles de 10 m : le site n'embarque que celles du cadrage exporté
tile = lambda x, y: f"{int((x - X0) // TILE)},{int((y - Y0) // TILE)}"
inside = lambda x, y: X0 <= x <= X1 and Y0 <= y <= Y1
def add(e, c):
    try: pts = [(p.x, p.y) for p in make_path(e).flattening(0.05)]
    except Exception: return
    if len(pts) < 2 or not any(inside(*p) for p in pts): return
    paths[(c, tile(*pts[0]))].append("M" + "L".join(f"{x:.2f} {y:.2f}" for x, y in pts))
def walk(ents, parent=None, depth=0):
    for e in ents:
        lay = e.dxf.layer if e.dxf.layer != '0' or parent is None else parent
        t = e.dxftype()
        if SKIP.search(lay.upper()) and t not in ('INSERT', 'TEXT', 'MTEXT'): continue  # les noms de locaux sont sur les calques de cotation
        if t == 'INSERT':
            if depth < 4:
                try: walk(e.virtual_entities(), lay, depth + 1)
                except Exception: pass
        elif t in ('LINE', 'LWPOLYLINE', 'POLYLINE', 'ARC', 'CIRCLE', 'SPLINE', 'ELLIPSE'): add(e, cat(lay))
        elif t in ('TEXT', 'MTEXT'):
            txt = (e.dxf.text if t == 'TEXT' else e.plain_text()).strip().replace("\n", " ")
            h = e.dxf.get('height' if t == 'TEXT' else 'char_height', 0.2) or 0.2
            x, y = e.dxf.insert.x, e.dxf.insert.y
            if txt and h >= 0.12 and inside(x, y) and len(txt) < 60:
                texts.append((x, y, h, e.dxf.get('rotation', 0) or 0, txt))
walk(recover.readfile(DXF)[0].modelspace())
esc = lambda s: s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{X0} {-Y1} {X1 - X0} {Y1 - Y0}" font-family="Helvetica, Arial, sans-serif">',
       '<g id="fond" transform="scale(1,-1)" fill="none" stroke-linecap="round">']
for c in ("axe", "autre", "scene", "struct"):
    col, w = STYLE[c]
    for (cc, t), d in sorted(paths.items()):
        if cc == c: out.append(f'<path data-t="{t}" stroke="{col}" stroke-width="{w}" d="{"".join(d)}"/>')
out.append('<g fill="#8a8a8a" stroke="none">')
for x, y, h, r, t in texts:  # double inversion : le texte reste à l'endroit
    out.append(f'<text data-t="{tile(x, y)}" transform="translate({x:.2f} {y:.2f}) rotate({-r:.0f}) scale(1,-1)" font-size="{h:.2f}">{esc(t)}</text>')
out.append('</g></g></svg>')
open(os.path.join(ROOT, "plan_fond.svg"), "w").write("\n".join(out))
print("chemins", sum(len(v) for v in paths.values()), "dalles", len(paths), "textes", len(texts))

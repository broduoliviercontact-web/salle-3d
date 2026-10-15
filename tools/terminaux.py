# 10. Boîtiers AV / éclairage scénique / enceintes de l'auditorium, relevés sur les plans des terminaux audiovisuels (lot 22, INE)
#     LGS2_INE_EXE_22_TER_AU_R0_0600, R1_0601, R2_0602 (PDF vectoriels, 1:50) -> ../terminaux_au.json
#     usage : python tools/terminaux.py <dossier contenant les 3 PDF et le carnet 0606>   (nécessite pymupdf)
#     Contenu des boîtiers : carnet de détails des boîtiers AV (DET_AU_TN_0606) ; le texte des plaques (prises, connecteurs) est vectoriel,
#     les tableaux de circuits (ADC-02-P1…) sont des images : on garde par boîtier son type, sa localisation, son niveau et la plaque de son type.
#     Calage par les axes du plan : a05 -> a04 = 7,05 m (échelle), axe a04 = mur du cadre de scène (IFC : linteau x −82,84…−82,64),
#     axe de scène (milieu de ae / ad) = z 2,9 (milieu des murs de cage dans l'IFC) ; le haut du plan est le côté −z (mur ext. dissymétrique).
#     Chaque étiquette (BAV-xx…) est reliée à son symbole par une ligne de rappel : on la suit jusqu'au bout, puis on prend le symbole le plus proche.
import fitz, json, os, re, sys, glob
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
A04, AXE = -82.74, 2.9
BARS = {"S1": -3.5, "F1": 0.77, "F2": 3.32, "F3": 6.38}  # équipes portant des boîtiers (distance au cadre vers le lointain)
LVL_IMG = {"BECL-30": "R1", "BECL-31": "R1"}  # niveaux lus sur les images du carnet (folio BECL T1) : lisses verticales jardin / cour
NIV = {"R0": 1.86, "R1": 4.81, "R2": 8.24}  # plateau (niv. 53,57) ; ML_R1 56,52 et ML_R2 59,95 NGF -> y = NGF − 51,71
TAG = re.compile(r"(BAV|BECL|HP)(-[A-Z]+)?-\d+$")   # boîtiers AV, boîtiers éclairage, enceintes (HP, HP-ROE, HP-RS)
SYM = re.compile(r"(BAV|BECL|HP|hp)$")               # texte dans le symbole lui-même

def plan(path, lvl):
    pg = fitz.open(path)[0]; words = pg.get_text("words")
    big = [w for w in words if w[3] - w[1] > 19]  # bulles d'axes du plan principal (texte 20 pt)
    ax = lambda n: [w for w in big if w[4] == n]
    cx = lambda w: (w[0] + w[2]) / 2; cy = lambda w: (w[1] + w[3]) / 2
    # plusieurs vues portent des bulles d'axes : le plan principal a les siennes le plus bas (a05, a04) et à gauche juste avant lui (ae, ad)
    a05 = max(ax("a05"), key=cy); a04 = min(ax("a04"), key=lambda w: abs(cy(w) - cy(a05)))
    side = lambda n: max([w for w in ax(n) if cx(w) < cx(a05) and cy(w) < cy(a05)], key=cx); ae, ad = side("ae"), side("ad")
    k = (cx(a04) - cx(a05)) / 7.05; x0 = cx(a04); y0 = (cy(ae) + cy(ad)) / 2
    # cadre du plan principal : entre les bulles d'axes (on écarte coupes et détails dessinés à côté)
    X0 = cx(ae) + 20; Y1 = cy(a05) - 20
    allsegs = [(it[1], it[2]) for d in pg.get_drawings() for it in d["items"] if it[0] == "l"]
    grid = {}  # index par case de 40 pt sur les extrémités
    for sg in allsegs:
        for q in sg: grid.setdefault((int(q.x // 40), int(q.y // 40)), []).append(sg)
    def near_segs(r, m=0):
        out = set()
        for i in range(int((r.x0 - m) // 40), int((r.x1 + m) // 40) + 1):
            for j in range(int((r.y0 - m) // 40), int((r.y1 + m) // 40) + 1): out.update(grid.get((i, j), []))
        return list(out)
    syms = [w for w in words if SYM.fullmatch(w[4])]
    out = []
    for w in words:
        if not TAG.fullmatch(w[4]) or cx(w) < X0 or cy(w) > Y1: continue
        box = fitz.Rect(w[:4]) + (-4, -4, 4, 4)
        on = lambda p: box.contains(p)
        lead = [(a, b) if on(a) else (b, a) for a, b in near_segs(box) if on(a) != on(b) and abs(a - b) > 3]  # trait qui sort du cadre de l'étiquette
        p = None
        if lead:
            a, b = max(lead, key=lambda s: abs(s[1] - s[0]))
            seen = 0
            while seen < 2:  # ligne brisée (au plus 3 segments) : au-delà on partirait le long d'un mur
                nxt = [(c, e) if abs(c - b) < 0.6 else (e, c) for c, e in near_segs(fitz.Rect(b, b), 1) if (abs(c - b) < 0.6) != (abs(e - b) < 0.6) and abs(c - e) > 1 and not (abs(c - a) < 0.6 or abs(e - a) < 0.6)]
                if not nxt: break
                a, b = b, nxt[0][1]; seen += 1
            p = b if abs(b - fitz.Point(cx(w), cy(w))) < 3.5 * k else None  # ligne de rappel ≤ 3,5 m, sinon on garde l'étiquette
        c = fitz.Point(cx(w), cy(w)) if p is None else p
        near = [s for s in syms if s[4].upper()[:2] == w[4][:2] and abs(cx(s) - c.x) < 25 and abs(cy(s) - c.y) < 25]
        if near: s = min(near, key=lambda s: (cx(s) - c.x) ** 2 + (cy(s) - c.y) ** 2); c = fitz.Point(cx(s), cy(s))
        kind = "HP" if w[4].startswith("HP") else w[4].split("-")[0]
        o = dict(id=w[4], kind=kind, lvl=lvl, x=round(A04 + (c.x - x0) / k, 2), z=round(AXE + (c.y - y0) / k, 2), y=NIV[lvl], lead=p is not None)
        # R2 au-dessus du plateau et de l'avant-salle : boîtiers montés sur les porteuses (bacs à câbles des équipes S1, F1, F2, F3)
        if lvl == "R2" and kind != "HP" and o["x"] < -77:
            bar = min(BARS, key=lambda b: abs(A04 - BARS[b] - o["x"])); o.update(bar=bar, x=round(A04 - BARS[bar], 2), y=None)
        out.append(o)
    return out

src = sys.argv[1]; res = []
for lvl, num in (("R0", "0600"), ("R1", "0601"), ("R2", "0602")):
    f = glob.glob(os.path.join(src, f"*TER_AU_{lvl}_{num}*.pdf"))[0]
    for o in plan(f, lvl):
        if not any(r["id"] == o["id"] for r in res): res.append(o)  # une étiquette répétée dans une vue de détail : on garde le plan
# --- carnet de détails : une page par type de boîtier (texte vertical, repères en colonnes)
def carnet(path):
    out, d = {}, fitz.open(path)
    for pg in list(d)[2:]:
        L = [(l["bbox"], " ".join(x["text"] for x in l["spans"]).strip()) for b in pg.get_text("dict")["blocks"] for l in b.get("lines", [])]
        L = [(b, t) for b, t in L if t]
        title = next((t for b, t in L if re.fullmatch(r"B?ECL T.*|BAV T.*|BECL-PMS|BAV-PMS-\d", t)), "")
        near = lambda b, t2, dx=12: min((abs(c[0] - b[0]) + abs(c[1] - b[1]) / 10, u) for c, u in L if u == t2) if any(u == t2 for c, u in L) else None
        # plaque du type : prises (texte sur les symboles) et connecteurs data
        txt = [t for b, t in L]; pr = {}
        for b, t in L:
            if t in ("2P+T", "3P+N+T"):
                amp = min(((abs(c[0] - b[0]) + abs(c[1] - b[1]), u) for c, u in L if u in ("16A", "32A")), default=(0, "?"))[1]
                k = f"PC {amp} " + ("tri" if t == "3P+N+T" else "mono"); pr[k] = pr.get(k, 0) + 1
        adc = sum(1 for t in txt if re.fullmatch(r"ADC\s*-\s*xx\s*-\s*xx", t))
        if adc: pr["PC 16A direct commandée"] = pr.get("PC 16A direct commandée", 0) + 2 * adc  # bloc orange : prise double
        data = {}
        for t in set(txt):
            m = re.fullmatch(r"(DMX|ART|ETH|AUD|MMO|SMO|VID|SYNCH?)[-\w]*", t)
            if m: k = {"DMX":"DMX", "ART":"Art-Net", "ETH":"RJ45", "AUD":"XLR audio", "MMO":"FO multimode", "SMO":"FO monomode", "VID":"SDI", "SYN":"Synchro", "SYNCH":"Synchro"}[m.group(1)]; data[k] = data.get(k, 0) + 1
        for b, t in L:
            if not re.fullmatch(r"(BECL|BAV|HP)-(PMS(-\d+)?|\d+)", t): continue
            locs = [(c[0] - b[0], u) for c, u in L if 3 < c[0] - b[0] < 30 and 0 < b[1] - c[1] < 140 and re.fullmatch(r"[A-ZÉÈ' ]{4,}", u) and re.search(r"LISSE|PLATEAU|R[ÉE]GIE|LOGE|GRADIN|FOYER|SALLE|CADRE|COULISSE|LOGGIA|PASSERELLE|SC[ÈE]NE", u)]
            lv = [u for c, u in L if abs(c[0] - b[0]) < 12 and 0 < b[1] - c[1] < 250 and re.fullmatch(r"R[0-3]", u)]  # même bloc de tableau seulement
            out[t] = dict(type=title, loc=min(locs)[1] if locs else "", lvl=lv[0] if lv else "", prises=pr, data=data)
    return out
bk = glob.glob(os.path.join(src, "*0606*.pdf"))
if bk:
    det = carnet(bk[0])
    for o in res:
        k = o["id"].replace("BAV-PMS-0", "BAV-PMS-")
        if k in det and o["kind"] != "HP":
            o["detail"] = det[k]  # dans le carnet, HP-01… sont des sorties enceintes d'un boîtier, pas des boîtiers
            lv = det[k]["lvl"] or LVL_IMG.get(k, "")
            if lv in NIV and lv != o["lvl"] and "bar" not in o: o.update(lvl=lv, y=NIV[lv])  # niveau du carnet (ex. BECL-30/31 sur les lisses verticales en R1)
    print(sum("detail" in o for o in res), "boîtiers décrits par le carnet")
res.sort(key=lambda o: (o["kind"], int(re.findall(r"\d+", o["id"])[-1])))
json.dump(res, open(os.path.join(ROOT, "terminaux_au.json"), "w"), indent=0, ensure_ascii=False)
for o in res: print(o["lvl"], o["id"], o["x"], o["z"], o.get("bar", ""), "" if o["lead"] else "(sans ligne de rappel)")
print(len(res), "terminaux")

# 11. Plaques et tableaux de circuits des boîtiers de l'auditorium, découpés dans le carnet de détails des boîtiers AV (DET_AU_TN_0606)
#     -> ../boitiers/plaque_<page>_<n>.png (dessin de la plaque du type, vectoriel rendu en PNG)
#        ../boitiers/<repère>.png (tableau de circuits du boîtier : noms exacts, ce sont des images dans le PDF)
#     et ajoute « img » à chaque boîtier de ../terminaux_au.json (lancer après terminaux.py)
#     usage : python tools/boitiers.py <dossier contenant le carnet 0606>   (nécessite pymupdf)
import fitz, glob, json, os, re, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, "boitiers"); os.makedirs(OUT, exist_ok=True)
ID = re.compile(r"(BECL|BAV)-(PMS(-\d+)?|\d+)$")
doc = fitz.open(glob.glob(os.path.join(sys.argv[1], "*0606*.pdf"))[0])
img = {}
for i, pg in enumerate(doc):
    if i < 2: continue  # page de garde et légende
    M, W = pg.rotation_matrix, pg.get_text("words")  # mots et images en coordonnées non tournées ; le rendu, lui, est tourné (clip * M)
    # plaque : zone qui contient les étiquettes des connecteurs (texte vectoriel sur la plaque ; les tableaux, eux, sont des images)
    CONN = re.compile(r"(TDN|ADC|ASC|TDR|DMX|ART|ETH|AUD|VID|MMO|SMO|SYNCH?)(-.*)?|(BECL|BAV)-XX|2P\+T|3P\+N\+T|16A|32A|xx|PUSH")
    anc = [fitz.Rect(w[:4]) for w in W if re.fullmatch(r"(BECL|BAV)-XX", w[4])]  # étiquette au centre de la plaque
    near = lambda q: not anc or any(abs((q.x0 + q.x1 - a.x0 - a.x1) / 2) < 330 and abs((q.y0 + q.y1 - a.y0 - a.y1) / 2) < 330 for a in anc)
    rs = [fitz.Rect(w[:4]) for w in W if CONN.fullmatch(w[4]) and near(fitz.Rect(w[:4]))]
    faces = []
    if rs:
        f = rs[0]
        for q in rs[1:]: f |= q
        f += (-70, -70, 70, 70)  # bords de la plaque, connecteurs sous leurs étiquettes, presse-étoupes
        if f.width < 760 and f.height < 1100:
            name = f"plaque_{i}.png"; pg.get_pixmap(dpi=120, clip=(f & pg.mediabox) * M).save(os.path.join(OUT, name)); faces.append(name)
    if not faces:  # plaque non isolable : on garde le folio entier
        name = f"folio_{i}.png"; pg.get_pixmap(dpi=100).save(os.path.join(OUT, name)); faces.append(name)
    # tableau de chaque boîtier : l'image collée à droite de son repère (en coordonnées non tournées), repère compris
    ims = [fitz.Rect(im["bbox"]) for im in pg.get_image_info()]
    for w in W:
        if not ID.fullmatch(w[4]): continue
        r = fitz.Rect(w[:4]); cand = [m for m in ims if 0 <= m.x0 - r.x0 <= 25 and m.width * m.height > 1500]
        if not cand: continue
        t = max(cand, key=lambda m: m.width * m.height) | r
        key = w[4].replace("BAV-PMS-", "BAV-PMS-0") if re.fullmatch(r"BAV-PMS-\d", w[4]) else w[4]
        if key in img: continue
        pg.get_pixmap(dpi=160, clip=(t + (-3, -3, 3, 3)) * M).save(os.path.join(OUT, key + ".png"))
        img[key] = {"plaque": faces, "circuits": key + ".png", "page": i + 1}
    for w in W:  # repère présent sans tableau isolable : au moins la plaque de son type
        key = w[4].replace("BAV-PMS-", "BAV-PMS-0") if re.fullmatch(r"BAV-PMS-\d", w[4]) else w[4]
        if ID.fullmatch(w[4]) and key not in img: img[key] = {"plaque": faces, "circuits": None, "page": i + 1}
p = os.path.join(ROOT, "terminaux_au.json"); res = json.load(open(p))
for o in res:
    if o["id"] in img: o["img"] = img[o["id"]]
json.dump(res, open(p, "w"), indent=0, ensure_ascii=False)
print(sum(1 for v in img.values() if v["circuits"]), "tableaux de circuits,", len(img), "boîtiers avec plaque ;", sum("img" in o for o in res), "reliés aux terminaux")
print("sans image :", [o["id"] for o in res if "img" not in o and o["kind"] != "HP"])

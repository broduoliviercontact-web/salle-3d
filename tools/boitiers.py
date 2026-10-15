# 11. Plaques et tableaux de circuits des boîtiers de l'auditorium, découpés dans le carnet de détails des boîtiers AV (DET_AU_TN_0606)
#     -> ../boitiers/plaque_<page>_<n>.png (dessin de la plaque du type, vectoriel rendu en PNG)
#        ../boitiers/<repère>.png (tableau de circuits du boîtier : noms exacts, ce sont des images dans le PDF)
#     et ajoute « img » à chaque boîtier de ../terminaux_au.json (lancer après terminaux.py)
#     Noms réels sur la plaque : les tableaux sont lus par la reconnaissance de texte de macOS (Vision, tools/ocr_vision.swift),
#     puis les circuits de puissance (ASC / ADC / TDN / TDR) sont posés, dans l'ordre de lecture, sur les étiquettes génériques de la plaque
#     (« ADC-xx-xx », « TDN - xx - xx ») ; si les nombres ne concordent pas, la plaque garde ses étiquettes génériques (signalé à la fin).
#     usage : python tools/boitiers.py <dossier contenant le carnet 0606>   (nécessite pymupdf ; macOS + swiftc pour les noms)
import fitz, glob, json, os, re, subprocess, sys, tempfile
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, "boitiers"); os.makedirs(OUT, exist_ok=True)
ID = re.compile(r"(BECL|BAV)-(PMS(-\d+)?|\d+)$")
doc = fitz.open(glob.glob(os.path.join(sys.argv[1], "*0606*.pdf"))[0])
img, LAB = {}, {}  # LAB[page] : étiquettes de la plaque (position normalisée dans l'image, texte)
def reading(items, key, tol):  # ordre de lecture : rangées (y à tol près) puis x
    items = sorted(items, key=lambda q: key(q)[1]); rows, out = [], []
    for q in items:
        if rows and abs(key(q)[1] - key(rows[-1][0])[1]) < tol: rows[-1].append(q)
        else: rows.append([q])
    for r in rows: out += sorted(r, key=lambda q: key(q)[0])
    return out
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
        if f.width < 842 and f.height < 1191:  # (deux plaques côte à côte possibles sur un folio)
            name = f"plaque_{i}.png"; R = (f & pg.mediabox) * M; pg.get_pixmap(dpi=120, clip=R).save(os.path.join(OUT, name)); faces.append(name)
            labs = []  # étiquettes génériques (… xx …) et repère du boîtier (BECL-XX), en coordonnées de l'image affichée
            for b in pg.get_text("dict")["blocks"]:
                for l in b.get("lines", []):
                    t = " ".join(x["text"] for x in l["spans"]).strip(); lr = fitz.Rect(l["bbox"])
                    if not (re.search(r"\bxx\b", t) or re.fullmatch(r"(BECL|BAV)-XX|VID-[IO]xx", t)) or not f.intersects(lr): continue
                    d = lr * M; labs.append(dict(x=(d.x0 - R.x0) / R.width, y=(d.y0 - R.y0) / R.height, w=d.width / R.width, h=d.height / R.height, g=t, cy=(d.y0 + d.y1) / 2, cx=(d.x0 + d.x1) / 2))
            LAB[i] = reading(labs, lambda q: (q["cx"], q["cy"]), 8)
    if not faces:  # plaque non isolable : on garde le folio entier
        name = f"folio_{i}.png"; pg.get_pixmap(dpi=100).save(os.path.join(OUT, name)); faces.append(name)
    # tableau de chaque boîtier : l'image collée à droite de son repère (en coordonnées non tournées), repère compris
    ims = [fitz.Rect(im["bbox"]) for im in pg.get_image_info()]
    for w in W:
        if not ID.fullmatch(w[4]): continue
        r = fitz.Rect(w[:4]); cand = [m for m in ims if 0 <= m.x0 - r.x0 <= 25 and m.width * m.height > 1500]
        if not cand: continue
        t = min(cand, key=lambda m: max(m.y0 - r.y1, r.y0 - m.y1, 0) - m.width * m.height / 1e6)  # la plus proche du repère (deux rangées de tableaux par colonne), l'image seule
        key = w[4].replace("BAV-PMS-", "BAV-PMS-0") if re.fullmatch(r"BAV-PMS-\d", w[4]) else w[4]
        if key in img: continue
        pg.get_pixmap(dpi=220, clip=(t + (-3, -3, 3, 3)) * M).save(os.path.join(OUT, key + ".png"))
        img[key] = {"plaque": faces, "circuits": key + ".png", "page": i + 1}
    for w in W:  # repère présent sans tableau isolable : au moins la plaque de son type
        key = w[4].replace("BAV-PMS-", "BAV-PMS-0") if re.fullmatch(r"BAV-PMS-\d", w[4]) else w[4]
        if ID.fullmatch(w[4]) and key not in img: img[key] = {"plaque": faces, "circuits": None, "page": i + 1}
# --- lecture des tableaux (Vision) et noms posés sur la plaque
PW = re.compile(r"(ASC|ADC|TDN|TDR)\s*[-.]?\s*(\d+)\s*[-.]\s*(P\s*\d|TP|T\s*P)")
tabs = {k: v for k, v in img.items() if v["circuits"]}
if tabs and sys.platform == "darwin":
    tmp = tempfile.mkdtemp(); exe = os.path.join(tmp, "ocr")
    subprocess.run(["xcrun", "swiftc", "-O", os.path.join(os.path.dirname(os.path.abspath(__file__)), "ocr_vision.swift"), "-o", exe], check=True, capture_output=True)
    ocr = json.loads(subprocess.run([exe] + [os.path.join(OUT, v["circuits"]) for v in tabs.values()], check=True, capture_output=True, text=True).stdout)
    bad = []
    for page in ocr:
        key = page["file"][:-4]; v = img[key]; i = v["page"] - 1
        toks = []
        for it in page["items"]:  # une case peut contenir deux noms collés (« ADC-81-P2 ADC-85.P1 »)
            ms = list(PW.finditer(it["t"].upper().replace("O", "0").replace("I", "1") if False else it["t"].upper()))
            for k, m in enumerate(ms):
                toks.append(dict(t=f"{m.group(1)}-{int(m.group(2)):02d}-{m.group(3).replace(' ', '')}", x=it["x"] + it["w"] * (k + 0.5) / len(ms), y=it["y"] + it["h"] / 2))
        toks = reading(toks, lambda q: (q["x"], q["y"]), 0.06)
        gen = [l for l in LAB.get(i, []) if not re.fullmatch(r"(BECL|BAV)-XX|VID-[IO]xx", l["g"])]
        idl = [l for l in LAB.get(i, []) if re.fullmatch(r"(BECL|BAV)-XX", l["g"])]
        if gen and toks and len(gen) % len(toks) == 0:  # plusieurs plaques identiques sur le folio (T1 & T10…) : mêmes circuits sur chacune
            v["labels"] = [dict(x=round(l["x"], 4), y=round(l["y"], 4), w=round(l["w"], 4), h=round(l["h"], 4), t=toks[k % len(toks)]["t"]) for k, l in enumerate(gen)]
        else: bad.append(f"{key} : {len(toks)} circuits lus pour {len(gen)} étiquettes {[t['t'] for t in toks]}")
        v["labels"] = v.get("labels", []) + [dict(x=round(l["x"], 4), y=round(l["y"], 4), w=round(l["w"], 4), h=round(l["h"], 4), t=key) for l in idl]
        for io in "IO":  # vidéo : « VID-Ixx » / « VID-Oxx » de la plaque <- VID-I19, VID-O15… du tableau, dans l'ordre de lecture
            vl = [l for l in LAB.get(i, []) if l["g"] == f"VID-{io}xx"]
            # la lecture confond I/1 et O/0 (« VD-119 » = VID-I19, « VID-015 » = VID-O15) : repère = lettre + 2 chiffres
            vt = reading([dict(t=f"VID-{io}{m.group(2)}", x=it["x"] + it["w"] * (k + 0.5) / max(1, len(ms)), y=it["y"] + it["h"] / 2) for it in page["items"]
                          for ms in [[m for m in re.finditer(r"(?:V[I1L]?D|MD)\s*-?\s*([IO01L])\s*(\d{2})\b", it["t"].upper()) if ("I" if m.group(1) in "I1L" else "O") == io]] for k, m in enumerate(ms)], lambda q: (q["x"], q["y"]), 0.06)
            if vl and len(vl) == len(vt): v["labels"] += [dict(x=round(l["x"], 4), y=round(l["y"], 4), w=round(l["w"], 4), h=round(l["h"], 4), t=q["t"]) for l, q in zip(vl, vt)]
    print(sum(1 for v in tabs.values() if len(v.get("labels", [])) > 1), "plaques nommées ; à vérifier :", bad)
p = os.path.join(ROOT, "terminaux_au.json"); res = json.load(open(p))
for o in res:
    if o["id"] in img: o["img"] = img[o["id"]]
json.dump(res, open(p, "w"), indent=0, ensure_ascii=False)
print(sum(1 for v in img.values() if v["circuits"]), "tableaux de circuits,", len(img), "boîtiers avec plaque ;", sum("img" in o for o in res), "reliés aux terminaux")
print("sans image :", [o["id"] for o in res if "img" not in o and o["kind"] != "HP"])

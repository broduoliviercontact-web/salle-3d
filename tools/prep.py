# 4. Filtre, redresse, recentre et regroupe la géométrie IFC -> work/prep.pkl (lu par build.py dans Blender)
import pickle, json, os, numpy as np, re, collections
from common import WORK, FLAGS, ALIGN
out = pickle.load(open(os.path.join(WORK, "geom.pkl"), "rb"))
# ponytail: on retire sanitaires/luminaires/diffuseurs (1M triangles) et les lanterneaux très détaillés ; à réintégrer si besoin
out = [o for o in out if o["cls"] != "IfcFlowTerminal" and "skyDome" not in o["name"]]
STAGE = re.compile(r"(?i)sc[eè]ne")
EXT = json.load(open(FLAGS))  # GlobalId -> "mur" | "toit" (cf. flags.py)
ROOF = re.compile(r"(?i)toit|chaineau|capotage")
ACOU = re.compile(r"(?i)panneau r[ée]flecteur|panneau acoustique|paroi acoustique")
FACADE = re.compile(r"(?i)fa[cç]ade")
INDIV = {"IfcFurnishingElement", "IfcBuildingElementProxy"}
FR = {"IfcWallStandardCase":"Murs","IfcWall":"Murs","IfcSlab":"Dalles","IfcColumn":"Poteaux","IfcBeam":"Poutres","IfcMember":"Ossature",
      "IfcPlate":"Panneaux","IfcDoor":"Portes","IfcWindow":"Fenêtres","IfcRailing":"Garde-corps","IfcCovering":"Revêtements",
      "IfcCurtainWall":"Murs-rideaux","IfcStairFlight":"Escaliers","IfcStair":"Escaliers","IfcRoof":"Toiture"}
# origine : centre des murs en plan, sol = dessus des dalles du RDC Est
W = np.concatenate([o["v"] for o in out if o["cls"].startswith("IfcWall")])
cx, cy = (W[:, 0].min() + W[:, 0].max()) / 2, (W[:, 1].min() + W[:, 1].max()) / 2
cz = np.median([o["v"][:, 2].max() for o in out if o["cls"] == "IfcSlab" and o["storey"] == "Halle_RDC_Est"])
print("origine", cx, cy, cz)
# retire les éléments hors de l'emprise des murs (dalles extérieures, parvis lointain…)
lo, hi = W[:, :2].min(0) - 5, W[:, :2].max(0) + 5
out = [o for o in out if np.all((o["v"][:, :2].mean(0) >= lo) & (o["v"][:, :2].mean(0) <= hi)) and np.all(o["v"][:, :2].max(0) <= hi + 20) and np.all(o["v"][:, :2].min(0) >= lo - 20)]
print("garde", len(out))
ROT = np.array(json.load(open(ALIGN))["R"])  # redresse le bâtiment sur les axes : p_redressé = R⁻¹·p
Wr = np.concatenate([((o["v"][:, :2] - (cx, cy)) @ ROT) for o in out if o["cls"].startswith("IfcWall")]); ELO, EHI = Wr.min(0), Wr.max(0)
storeys = {o["storey"] for o in out if not o["storey"].isdigit()}
mats = {}; nodes = collections.OrderedDict()
def mat_id(m):
    (r, g, b), a = m[0][:3], m[1]
    k = (round(r, 2), round(g, 2), round(b, 2), round(a, 2))
    return mats.setdefault(k, len(mats))
for o in out:
    st = o["storey"] if o["storey"] in storeys else "Autres"
    gm = np.array([mat_id(m) for m in o["mats"]] or [mat_id(((.7, .7, .7), 1))], np.int32)
    mid = gm[np.clip(o["mid"], 0, len(gm) - 1)] if len(o["mid"]) else np.zeros(len(o["t"]), np.int32) + gm[0]
    v = o["v"] - (cx, cy, cz); v[:, :2] = v[:, :2] @ ROT; v = v.astype(np.float32)
    # en bordure de l'emprise (≤ 1,5 m) : doublages, parements et fenêtres de façade
    c2 = v[:, :2].mean(0); bord = min(c2[0] - ELO[0], EHI[0] - c2[0], c2[1] - ELO[1], EHI[1] - c2[1]) < 1.5
    env = "acou" if ACOU.search(o["name"]) else "toit" if o["cls"] == "IfcRoof" or ROOF.search(o["name"]) or EXT.get(o["gid"]) == "toit" else "mur" if EXT.get(o["gid"]) or FACADE.search(o["name"]) or "(E)" in o["name"] or (bord and (o["cls"] in ("IfcWindow", "IfcDoor") or re.search(r"(?i)doublage|parement", o["name"]))) else ""
    if o["cls"] in INDIV or (o["cls"] == "IfcSlab" and STAGE.search(o["name"])) or env == "acou":
        nm = re.sub(r":\d+$", "", o["name"]).split(":")[-1] or o["cls"]
        nodes[("i", o["gid"])] = dict(name=nm, storey=st, env=env, parts=[(v, o["t"], mid)])
    else:
        k = (st, FR.get(o["cls"], o["cls"]), env)
        lab = {"toit": " (toit)", "mur": " ext."}.get(env, "")
        nodes.setdefault(k, dict(name=f"{k[1]}{lab} — {st}", storey=st, env=env, parts=[]))["parts"].append((v, o["t"], mid))
res = []
for n in nodes.values():
    V, T, M, off = [], [], [], 0
    for v, t, m in n["parts"]: V.append(v); T.append(t + off); M.append(m); off += len(v)
    res.append(dict(name=n["name"], storey=n["storey"], env=n["env"], v=np.concatenate(V), t=np.concatenate(T), m=np.concatenate(M)))
print("noeuds", len(res), "tris", sum(len(r["t"]) for r in res), "materiaux", len(mats))
pickle.dump(dict(nodes=res, mats=list(mats)), open(os.path.join(WORK, "prep.pkl"), "wb"), protocol=4)

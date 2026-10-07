# 2. Repère les éléments d'enveloppe (murs extérieurs / toit) -> flags.json
#    Revit marque mal certains éléments ; on complète par des règles, puis quelques cas à la main.
import ifcopenshell, ifcopenshell.util.element as ue, pickle, json, os
from common import IFC, WORK, FLAGS
f = ifcopenshell.open(IFC)
geo = pickle.load(open(os.path.join(WORK, "geom.pkl"), "rb"))
zr = {o["gid"]: (o["v"][:, 2].min(), o["v"][:, 2].max()) for o in geo}
flags = {}
# a) propriété IsExternal des Pset_*Common
for e in f.by_type("IfcElement"):
    for k, d in ue.get_psets(e).items():
        if k.endswith("Common") and d.get("IsExternal"): flags[e.GlobalId] = "mur"
# b) les parties d'un élément extérieur (meneaux, panneaux d'un mur-rideau…) sont extérieures
for e in f.by_type("IfcElement"):
    p = ue.get_aggregate(e)
    if p and flags.get(p.GlobalId) and not flags.get(e.GlobalId): flags[e.GlobalId] = "mur"
# c) les parties d'un toit vont avec le toit
for e in f.by_type("IfcElement"):
    p = ue.get_aggregate(e)
    if p and p.is_a("IfcRoof"): flags[e.GlobalId] = "toit"
# d) un mur-rideau de plus de 8 m de haut est une façade (ex. mur-rideau_FaçadeV, marqué intérieur dans Revit)
parts = {}
for e in f.by_type("IfcElement"):
    p = ue.get_aggregate(e)
    if p and p.is_a("IfcCurtainWall") and e.GlobalId in zr: parts.setdefault(p.GlobalId, []).append(e.GlobalId)
for cw, ch in parts.items():
    if max(zr[g][1] for g in ch) - min(zr[g][0] for g in ch) > 8 and not flags.get(cw):
        for g in ch + [cw]: flags.setdefault(g, "mur")
# e) à la main : grand voile béton derrière le pignon ouest (gêne la vue, classé intérieur)
flags["3F3O_FeV16qgEBjHM$JAGE"] = "mur"
json.dump(flags, open(FLAGS, "w"), indent=0)
print(len(flags), "éléments d'enveloppe")

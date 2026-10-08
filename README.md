# Salle 3D — configs de scène

Visualiseur 3D de la halle, dans le navigateur, pour préparer les implantations. On y place une scène, des praticables, une régie, des enceintes PIKIP (VCH30, sub VTL218)… et on enregistre des **setups de salle**.

## Lancer

```bash
python3 -m http.server 8766
```

Puis ouvrir http://localhost:8766. Il n'y a ni installation ni build : tout tient dans `index.html` (Three.js chargé depuis un CDN).

## Commandes

| Action | Commande |
|---|---|
| Sélectionner | clic |
| Centrer la vue sur un point | double-clic |
| Orbiter / panoramique / zoom | glisser / clic droit / molette |
| Se déplacer | ZQSD, WASD ou flèches · G/B : monter/descendre · Maj : rapide |
| Déplacer / tourner la sélection | T / E (magnétisme 0,5 m / 15°) |
| Centrer sur la sélection | C |
| Masquer la sélection | H (bouton « Tout réafficher » pour annuler) |
| Annuler / rétablir | ⌘Z / ⌘⇧Z (Ctrl+Z / Ctrl+Y sur PC) |

**Export AutoCAD (DXF)** : les éléments ajoutés (emprises, flèche ▲ pour la face avant des enceintes, nom et dimensions) sont écrits dans un DXF R12, **dans le repère du DWG d'origine**, sur les calques `SETUP_SCENE`, `SETUP_SON`, `SETUP_REGIE`, `SETUP_VIDEO`, `SETUP_DIVERS` et `SETUP_TEXTE`. Pour l'utiliser dans AutoCAD : ouvrir le DXF, tout copier (`COPYCLIP`), ouvrir le plan DWG puis `PASTEORIG` (coller aux coordonnées d'origine).

**Aperçu 2D (SVG)** : vue de dessus du setup sur le plan DXF complet (en gris : murs, cloisons, portes, axes, noms de locaux), avec les éléments en couleur, une légende, une échelle, des règles graduées, une grille 1 m / 5 m et des cotes sur les scènes, praticables, régie et écran. Le plan est à l'échelle 1:100 si on l'imprime à 100 %.

**Vue** : les boutons *Murs ext.*, *Toit* et *Panneaux acoustiques* masquent l'enveloppe. La **Coupe** tranche la maquette en longueur, en largeur ou en hauteur. Chaque niveau peut être masqué dans la liste des maquettes.

**Setups de salle** : un setup enregistre les éléments ajoutés, les objets déplacés, la caméra, les calques visibles et la coupe. Les setups sont stockés dans le navigateur. *Exporter / Importer JSON* sert à les partager.

## Fichiers

| Fichier | Contenu |
|---|---|
| `index.html` | le visualiseur |
| `halle_ifc.glb` | la maquette 3D, convertie depuis l'IFC Revit (redressée, en mètres, origine au centre) |
| `plan_scene.json` | le plan DXF « hall avec scène » calé sur la 3D (bâti, scénographie, équipements) |
| `bar.json` | les contours du bar central, extrudés en 3D dans le visualiseur |
| `plan_fond.svg` | le fond de plan complet de l'aperçu 2D, chargé seulement à l'export |

## Régénérer depuis les sources (IFC + DXF)

Les sources de l'architecte ne sont pas versionnées. Les scripts les cherchent dans `~/Downloads`, ou bien via les variables `SALLE_IFC` et `SALLE_DXF`.

```bash
pip install -r tools/requirements.txt
cd tools
python extract.py   # IFC -> géométrie triangulée (work/geom.pkl)
python flags.py     # repère murs extérieurs / toit -> flags.json
python align.py     # cale le DXF sur l'IFC via les poteaux -> align.json
python prep.py      # filtre, redresse, regroupe -> work/prep.pkl
/Applications/Blender.app/Contents/MacOS/Blender -b --python build.py   # -> ../halle_ifc.glb
python plan.py      # -> ../plan_scene.json
python bar.py       # -> ../bar.json
python fond.py      # -> ../plan_fond.svg (fond de l'aperçu 2D)
```

`flags.json` et `align.json` sont versionnés : on peut sauter `flags.py` et `align.py` si les sources n'ont pas changé.

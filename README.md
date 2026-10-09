# Salle 3D — configs de scène

Visualiseur 3D de la halle des Grandes Serres (Pantin), dans le navigateur, pour préparer des implantations d'événement. On y place une scène, des praticables, une régie et des enceintes, puis on enregistre des **setups de salle**. Chaque setup s'exporte en plan 2D ou dans le DWG de l'architecte.

**En ligne : https://salle-3d-tools.vercel.app**

Aucune installation : tout tient dans `index.html`, avec Three.js chargé depuis un CDN.

---

## Fonctionnalités

### La salle
- **Maquette 3D** issue de l'IFC Revit de l'architecte : en mètres, redressée sur les axes du bâtiment, organisée par niveau (Ss, RDC Est/Mail/Ouest, R+1, R+2, mezzanines).
- **Plan DXF « hall avec scène »** posé au sol et calé sur la 3D. Le bâti est en rouge, la scénographie (trusses) en jaune, et le bar, les équipements et le mobilier en bleu.
- **Bar central en 3D**, extrudé depuis les contours du DXF : comptoirs de 1,10 m, arrière-bars de 0,90 m.
- **Trappes de sol événementielles** relevées sur le plan de repérage : T1–T11 en 63 A + RJ45 (rouge), T12–T14 en 32 A (bleu).
- **Ponts roulants** (passerelles dorées) recalés au chargement sur leur marquage au sol du DXF : l'IFC les place à un endroit quelconque de leurs rails. Ils restent sélectionnables et déplaçables le long de la halle.
- **Éléments mobiles de la maquette** sélectionnables et déplaçables : sièges de l'auditorium, mobilier, panneaux acoustiques, bar.

### Ajouter des éléments
Scène (dimensions libres), praticable Samia 2 × 1 (hauteur = champ H), régie, enceinte, écran, silhouette de personne. Lumière : **lyre** (22 kg, 600 W) et **PAR LED** (5 kg, 200 W). Vidéo : **écran LED** en dalles de 50 cm (largeur = L, hauteur = H ; environ 8 kg et 150 W par dalle). Sécurité : **barrière crash** (module de 1 m, 35 kg). Tout élément posé à plus de 2,5 m compte comme accroché (charges et rigging). S'y ajoutent les modèles **PIKIP** construits d'après les fiches techniques :
- **VCH30 ×1** : 680 × 510 mm, face 387 mm, dos 120 mm, courbure 30°.
- **VCH30 ×2** : deux unités en éventail à 60°, avec plaque d'accroche.
- **Sub VTL218** : 1300 × 775 × 570 mm.

Le bouton **Setup du machiniste (DWG)** place la **scène 11 × 9 m** (en lames de 1 m) et le **grill de poutres S500 triangulaires** issus du DWG « scène et grill » d'un machiniste. La scène est **recentrée sur l'axe de l'Agora**, à mi-distance des deux rangées de piliers de la charpente métallique (côté mezzanine sur le marquage jaune, z = −9,52 m ; côté verrière z = +15,20 m), soit z = +2,84 m, pour la cohérence avec les enceintes sur piliers ; le grill garde sa position relative à la scène. Le grill compte 4 poutres de 11,6 m et 2 de 10,3 m ; sa hauteur d'accroche se règle à côté du bouton (7 m par défaut). La scène fait 1,20 m de haut. Les deux éléments se déplacent et s'exportent comme les autres : dans le DXF, le grill est sur le calque `SETUP_GRILL`, en axes de poutres.

Les modèles **L-Acoustics** (volumes simplifiés d'après les dimensions et poids fournis) :
- **KS28** seul ou en pile de 2, posés à plat : 1340 × 700 × 550 mm, 79 kg.
- **L2D accroché** avec L2 BUMP, L2 BAR et Clamp 1000 : 850 × 559 × 1252 mm, 205 kg au total.
- **Kara II** : 733 × 482 × 252 mm, 26 kg.
- **X15 HiQ** au sol (en retour) ou sur pied : 21 kg.

Le bouton **Système concert 05/12** pose tout le système sur la scène du machiniste (et la crée si besoin). Les positions sont prises par rapport au centre du nez de scène (X = 0), le public étant côté bar :
- 5 piles de 2 KS28 au sol devant la scène ;
- 2 L2D à X = ±4 m, sous la poutre avant du grill ;
- 3 Kara II au nez de scène, celles des côtés ouvertes de 30° ;
- 1 retour X15 au sol et 2 sur pied.

Le panneau, l'aperçu 2D et le DXF affichent le **bilan des charges** (accroché / posé).

Quand on déplace ou tourne une scène, elle **emporte son matériel** : tout élément dont le centre est sur la scène ou à moins de 1,5 m de son bord (subs, L2D, grill, retours…). Décocher *La scène emporte son matériel* pour la bouger seule.

### Vue
- Boutons **Murs ext.**, **Toit**, **Panneaux acoustiques** et **Trappes de sol** pour ouvrir le bâtiment.
- **Coupe** en longueur, en largeur ou en hauteur.
- Liste **Maquettes et calques** (repliée par défaut) : chaque niveau et chaque calque se masque.
- **Masquer (H)** : cacher n'importe quel élément gênant. **Tout réafficher** l'annule.
- Vues **Dessus**, **Perspective** et **Face**.
- **Vue public (V)** : on clique un point de la salle, la caméra se place à 1,60 m du sol et regarde le plateau ; la distance au nez de scène s'affiche.
- **Couverture** : ouverture horizontale des enceintes dessinée au sol (ou sur le plateau). Valeurs indicatives : L2D 70°, Kara II 110°, X15 40°, VCH30 90°.
- **Mesurer (M)** : deux clics donnent la distance totale, horizontale (↔) et verticale (↕). *Effacer mesures* les retire.
- **Axe & piliers** : l'axe de l'Agora (rose, pointillé) et les piliers de la charpente métallique relevés dans l'IFC, M1–M6 côté mezzanine (sur le marquage jaune, z = −9,52) et V1–V6 côté verrière (z = +15,20), face à face tous les 10 m. Chaque pilier affiche sa **distance et son délai (ms)** par rapport à la L2D la plus proche (ou au nez de scène), pour une enceinte posée à la hauteur choisie (4 m par défaut), avec un son à 343 m/s sans marge Haas. Une enceinte sélectionnée affiche aussi son délai. L'axe et les piliers sortent dans l'aperçu 2D et dans le DXF (calque `AGORA_AXE`).

### Dossier technique
Le panneau **Dossier technique** se met à jour en direct :
- **Rigging** : 12 palans sur le grill (4 rangées × extrémités + milieu). La charge de chaque point compte le palan, le poids propre des poutres (réparti par demi-travée) et les L2D, répartis entre les 2 palans voisins sur la poutre la plus proche. Les étiquettes `P1…P12` en 3D et dans l'aperçu 2D passent au rouge au-delà de la limite choisie. Les réglages sont modifiables : poutre 10 kg/m, palan 50 kg, limite 500 kg/point par défaut.
- **Jauge** : surface publique de l'Agora (3 184,9 m², calcul DACAM) moins les scènes, praticables et régies posés dans l'Agora, divisée par le ratio (3 m²/pers. par défaut). Alerte au-delà du plafond DACAM RDC (2 164 pers.).
- **Câblage** : un élément sélectionné peut être relié à une trappe (ou à « la plus proche »), avec sa puissance en W (valeurs par défaut pour régie, écran, enceintes actives). Le câble est tracé en L au sol (3D et 2D). Pour chaque trappe, le site affiche la puissance totale face à sa capacité (63 A ≈ 43,6 kW, 32 A ≈ 22,2 kW en triphasé 400 V) et la longueur de câble estimée (trajet en L + hauteur + 2 m), arrondie au touret supérieur.
- **Fiche setup (PDF)** : ouvre une page imprimable avec le plan, le matériel (quantités, poids, puissance), les charges, la jauge, le rigging par point et les trappes et câbles. On l'enregistre en PDF depuis l'impression du navigateur.

### Setups de salle
Un setup enregistre :
- les éléments ajoutés et leur position (avec leur trappe et leur puissance) ;
- les objets de la maquette déplacés ou masqués ;
- la caméra ;
- les calques visibles et la coupe.

On clique sur **Sauver** puis sur **Charger**. **Lien** copie une adresse qui ouvre le setup courant sur n'importe quel ordinateur (le setup est compressé dans l'adresse, environ 700 caractères, sans serveur). C'est une copie : les modifications de l'autre personne ne reviennent pas, il faut qu'elle renvoie un lien. Les setups sont stockés **dans le navigateur** : utilise **Exporter JSON** / **Importer** pour les sauvegarder ou les partager. **⌘Z / ⌘⇧Z** annule ou rétablit chaque modification.

### Exports
- **Aperçu 2D (SVG)** : vue de dessus du setup sur le plan DXF complet en gris (murs, portes, axes, noms des locaux). Il contient :
  - les éléments en couleur avec leurs cotes et la flèche ▲ de face avant des enceintes ;
  - les trappes, une légende, des règles graduées et une grille de 1 m / 5 m.

  Le plan est à l'échelle **1:100** si on l'imprime à 100 %.
- **Export AutoCAD (DXF)** : les éléments du setup et les trappes, en DXF R12, **dans le repère du DWG d'origine**. Les calques sont `SETUP_SCENE`, `SETUP_SON`, `SETUP_REGIE`, `SETUP_VIDEO`, `SETUP_DIVERS`, `SETUP_TEXTE`, `SETUP_GRILL`, `AGORA_AXE` et `TRAPPES_SOL`. Dans AutoCAD :
  1. ouvrir le DXF exporté et tout copier (`COPYCLIP`) ;
  2. ouvrir le plan DWG ;
  3. coller avec `PASTEORIG` (coller aux coordonnées d'origine).

---

## Tablette et hors connexion
- Sur un écran étroit, le panneau est replié au départ ; le bouton **☰** l'ouvre ou le ferme. Au doigt : un doigt pour orbiter, deux pour zoomer et se déplacer, double-tap pour centrer la vue.
- Le site s'installe comme une application (« Ajouter à l'écran d'accueil ») et fonctionne **hors connexion** après une première visite : `sw.js` garde en cache le site, la maquette et Three.js. Les fichiers du site sont toujours repris du réseau quand il est disponible, donc les mises à jour arrivent normalement.

## Commandes

| Action | Commande |
|---|---|
| Sélectionner | clic |
| Centrer la vue sur un point | double-clic |
| Orbiter / panoramique / zoom | glisser / clic droit / molette (zoom vers le curseur) |
| Se déplacer | ZQSD, WASD ou flèches |
| Monter / descendre | G / B (ou Page ↑ / ↓) |
| Aller plus vite | Maj |
| Déplacer / tourner la sélection | T / E (magnétisme 0,5 m / 15°) |
| Centrer sur la sélection | C |
| Masquer la sélection | H |
| Mesurer / vue public | M / V |
| Supprimer | Suppr. Un élément de la maquette est masqué, pas effacé. |
| Annuler / rétablir | ⌘Z / ⌘⇧Z (Ctrl+Z / Ctrl+Y sur PC) |
| Désélectionner | Échap |

---

## Précision des données

| Donnée | Source | Précision |
|---|---|---|
| Maquette 3D | IFC Revit (unité : mètre) | exacte. Le modèle est seulement translaté et tourné de 17,4°, jamais mis à l'échelle. |
| Plan DXF sur la 3D | calage sur 102 poteaux communs | écart moyen 16 cm, facteur d'échelle 1,0007 |
| Trappes de sol | PDF de repérage (image) calé par les axes, puis par 34 poteaux dans la halle est | environ ±30 cm (±15 cm côté mail) |
| Bar | contours du DXF | hauteurs supposées (1,10 m / 0,90 m) |

**Hypothèses à confirmer**
- La taille des trappes : 50 × 50 cm, non indiquée sur le plan.
- Les hauteurs du bar.
- Le plan d'accroche du grill (12 palans), le poids des poutres S500 (10 kg/m) et des palans (50 kg).
- Les trappes en triphasé 400 V, et les puissances par défaut des équipements.
- La tête d'accroche des VCH30, simplifiée en plaque.

---

## Lancer en local

```bash
python3 -m http.server 8766
```

Puis ouvrir http://localhost:8766.

## Déploiement

Le site est déployé sur **Vercel** en site statique (`vercel.json` force le builder statique). Le dossier `tools/` est exclu du déploiement (`.vercelignore`). Chaque `git push` sur `main` redéploie le site.

---

## Fichiers

| Fichier | Contenu |
|---|---|
| `index.html` | le visualiseur (Three.js) |
| `sw.js`, `manifest.webmanifest`, `icon.svg` | mode hors connexion et installation sur tablette |
| `halle_ifc.glb` | la maquette 3D convertie depuis l'IFC (Draco, environ 4 Mo) |
| `plan_scene.json` | le plan DXF calé sur la 3D (bâti, scénographie, équipements) |
| `plan_fond.svg` | le fond de plan complet de l'aperçu 2D, chargé seulement à l'export |
| `bar.json` | les contours du bar central |
| `machiniste.json` | la scène et le grill relevés dans le DWG du machiniste (coordonnées du site) |
| `trappes.json` | les 14 trappes de sol (positions dans le site et dans le DWG) |
| `tools/` | les scripts de conversion (voir ci-dessous) |

## Régénérer depuis les sources

Les sources de l'architecte (IFC, DXF, PDF) **ne sont pas versionnées**. Les scripts les cherchent dans `~/Downloads`, ou via les variables `SALLE_IFC`, `SALLE_DXF` et `SALLE_PDF_PNG`.

```bash
pip install -r tools/requirements.txt
cd tools
python extract.py   # IFC -> géométrie triangulée (work/geom.pkl)
python flags.py     # éléments d'enveloppe (murs ext., toit) -> flags.json
python align.py     # calage DXF -> IFC par les poteaux -> align.json
python prep.py      # filtre, redresse, regroupe -> work/prep.pkl
/Applications/Blender.app/Contents/MacOS/Blender -b --python build.py   # -> ../halle_ifc.glb
python plan.py      # -> ../plan_scene.json
python bar.py       # -> ../bar.json
python fond.py      # -> ../plan_fond.svg
python trappes.py   # -> ../trappes.json (PDF de repérage rendu en PNG, cf. en-tête du script)
```

Les fichiers `flags.json`, `align.json`, `pdf2dxf.json` et `pdf2dxf_est.json` sont versionnés : on peut sauter les étapes de calage si les sources n'ont pas changé.

**Outils nécessaires**
- Python 3 avec `ifcopenshell`, `ezdxf`, `numpy` et `Pillow`.
- Blender (export glTF/Draco).
- `dwg2dxf` (LibreDWG) pour convertir un DWG.

---

## Limites connues
- Pas d'édition à plusieurs en temps réel : on partage des setups par lien (copie).
- Certains éléments de façade mal renseignés dans Revit ont été rattachés à la main au bouton *Murs ext.* (voir `tools/flags.py`).

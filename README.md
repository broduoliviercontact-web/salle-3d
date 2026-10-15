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
Le bouton **＋ Ajouter un élément…** ouvre le **catalogue** : les éléments sont rangés par catégorie (Scène et praticables, Son, Lumière, Vidéo, Sécurité et circulation, Divers), chacun avec une **vignette 3D générée à partir de son modèle**, ses dimensions et son poids. Une recherche filtre la liste (sans tenir compte des accents ; Entrée ajoute le premier résultat). Un clic pose l'élément au centre de la vue ; ses dimensions se règlent ensuite avec L / P / H. Les **tracés** (passe-câbles, Vauban) et les **installations** (setup du machiniste, concert 05/12, FIP 360) restent dans le panneau.

**Ajouter un nouvel objet au catalogue** (dans `index.html`) :
1. écrire sa fonction de modèle 3D `buildXxx(dims)` (origine au sol, face avant vers +z) et l'ajouter à `BUILD` ;
2. renseigner `LABELS`, `DEFAULT` (L × P × H en m), et si besoin `COLORS`, `WEIGHT`, `POWER`, `DXF_LAYER`, `COVER` ;
3. ajouter son identifiant dans `CATALOG`, dans la bonne catégorie. La vignette se génère toute seule.

Une **scène** (ou un praticable, une régie, un écran, un écran LED, la scène FIP 360) se **redimensionne après coup** : quand elle est sélectionnée, des champs L / P / H apparaissent sous son nom ; elle garde sa place, son orientation, sa trappe et son groupe.

Chaque **scène** et chaque **régie** est calepinée en **praticables 2 × 1 m** : leur nombre s'affiche quand on la sélectionne, leur disposition est dessinée sur le plateau, et le décompte apparaît dans la fiche setup. Si une cote n'est pas paire (11 × 9 par exemple), le site indique la surface en trop, à recouper ou à compléter en 1 × 1.

Scène (dimensions libres), praticable Samia 2 × 1 (hauteur = champ H), régie, enceinte, écran, silhouette de personne. Lumière : **lyre** (22 kg, 600 W), **PAR LED** (5 kg, 200 W) et la liste de location de Gaspar Claus : **PC 1 kW**, **découpes 713 SX** et **654 SX**, **lyre à découpe Rivale Profile / Esprite / Ghibli**, **stroboscope Atomic 3000**, **machine à brouillard Unique 2.1** (volumes, poids et puissances indicatifs, à confirmer avec le loueur ; « sur grill » ou « au sol » = hauteur de pose). Vidéo : **écran LED** en dalles de 50 cm (largeur = L, hauteur = H ; environ 8 kg et 150 W par dalle). Sécurité : **barrière crash** (module de 1 m, 35 kg), **barrière Vauban** à pieds fixes (fiche HERMEQ MB0033 : cadre 2 175 × 900 mm, 1,10 m de haut, pieds en V ; ≈ 16 kg estimés, pas d'accroche 2,20 m) et **passe-câbles Defender Mini** (modules de 1 005 × 290 × 50 mm, 6 kg, 3 canaux ; la longueur se règle avec le champ L et s'arrondit au module, le nombre de modules et le poids suivent). Tout élément posé à plus de 2,5 m compte comme accroché (charges et rigging). S'y ajoutent les modèles **PIKIP** construits d'après les fiches techniques :
- **VCH30 ×1** : 680 × 510 mm, face 387 mm, dos 120 mm, courbure 30°.
- **VCH30 ×2** : deux unités en éventail à 60°, avec plaque d'accroche.
- **Sub VTL218** : 1300 × 775 × 570 mm.

Le bouton **Setup du machiniste (DWG)** place une **scène 8 × 8 m** (1,20 m de haut, redimensionnable) au nez de scène du DWG « scène et grill » d'un machiniste, et le **grill de poutres S500 triangulaires** relevé dans ce DWG. (Le DWG dessine une scène de 11 × 9 m en lames de 1 m ; les anciens setups qui la contiennent l'affichent toujours, et elle devient une scène classique dès qu'on change une de ses dimensions.) La scène est **recentrée sur l'axe de l'Agora**, à mi-distance des deux rangées de piliers de la charpente métallique (côté mezzanine sur le marquage jaune, z = −9,52 m ; côté verrière z = +15,20 m), soit z = +2,84 m, pour la cohérence avec les enceintes sur piliers ; le grill garde sa position relative à la scène. Le grill compte 4 poutres de 11,6 m et 2 de 10,3 m ; sa hauteur d'accroche se règle à côté du bouton (7 m par défaut). Les deux éléments se déplacent et s'exportent comme les autres : dans le DXF, le grill est sur le calque `SETUP_GRILL`, en axes de poutres.

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

Le bouton **FIP 360** pose l'installation de la fiche technique Radio France (spatialisation L-ISA) au centre de l'Agora, sur son axe :
- 12 colonnes **Syva + Syva Low** (2,128 m) sur estrades de 1 × 1 × 1 m, tous les 30°, tournées vers le centre, sur un cercle de 20 m de diamètre par défaut (réglable de 12 à 25 m ; la fiche donne 20 à 24 m) ;
- 8 **KS28** empilés par 2 aux 4 points cardinaux, juste à l'extérieur du cercle ;
- une **scène centrale 4 × 4 m** (1 m de haut supposé).

Les 17 éléments sont **liés** : en attraper un (colonne, sub ou scène) déplace ou tourne tout l'ensemble. Le lien est gardé dans les setups et les liens de partage ; **Délier** retire l'élément sélectionné du groupe.

Le modèle **Syva + Low sur estrade** s'ajoute aussi seul (50 kg d'enceintes, ouverture horizontale 140°).

**Tracer un passage de câbles (P)**, comme une route dans SimCity : un clic sur le sol pose le point de départ, puis le tronçon suit la souris en aperçu (longueur arrondie au module Defender Mini ; 1er tronçon accroché tous les 45° avec le magnétisme) ; chaque clic pose le tronçon et le suivant repart de son bout. Pour **tourner**, il suffit de viser dans une autre direction : le site pose automatiquement les **pièces d'angle Defender Mini C** (gauche ou droite, 30° chacune : 3 pièces pour 90°) en arc, puis le tronçon droit. Les angles sont comptés à part dans le matériel. *Angle de 30°, rayon et poids (≈ 3 kg) des pièces C estimés : le manuel ne les donne pas.* **Échap** termine. Les tronçons d'un même tracé sont liés (ils se déplacent ensemble) et un seul ⌘Z annule le tracé. **Tracer Vauban** fonctionne de la même façon et pose une barrière tous les 2,20 m (angle libre, accroché tous les 45° avec le magnétisme ; pas de pièce d'angle, les crochets pivotent). Dans les plans 2D, passe-câbles et barrières sont dessinés à leur emprise réelle ; les barrières et les angles n'ont pas d'étiquette individuelle, la légende les compte.

Sur un tronçon sélectionné, les **poignées orange** aux deux bouts se tirent pour le rallonger ou le raccourcir, module par module.

**Structures et levage** (catalogue) : pont alu carré **290** (type Prolyte H30V / Global Truss F34, ≈ 6 kg/m) et **390** (type H40V / F44, ≈ 7,5 kg/m), cube d'angle, **tour ground support** (type Prolyte MPT, 115 kg), **moteur de levage** D8+ 500 kg (24 kg), **perche / porteuse** Ø 48 (≈ 3,6 kg/m). Ponts, perches et tours se redimensionnent (L ou H) ; la longueur d'un pont est arrondie au 0,5 m et décomposée en éléments standard (ex. « 7 m = 2 × 3 m + 1 × 1 m »).

**Tracer des ponts** : choisir la série (290, 390 ou **290 triangle**, type Prolyte X30D / Global Truss F33, ≈ 4,5 kg/m) et la hauteur, puis tracer comme une route : chaque clic pose un pont (longueur au 0,5 m) ; viser à 90° pose automatiquement un **cube d'angle** entre deux ponts. **Jonctions (T, croix)** : commencer un tracé sur un pont existant le coupe et y insère un cube (au pas de 0,5 m) ; commencer sur un cube existant lui ajoute une direction. Finir un tracé sur un pont ou un cube crée la jonction au croisement exact des axes (si la longueur tombe sur un pas de 0,5 m à 15 cm près) et termine le tracé. Les cubes s'appellent « 2 / 3 / 4 directions » ; une coupe qui ne tombe pas sur une longueur du commerce est signalée « longueur non standard ». Tout devient une seule structure (moteurs recalculés sur l'ensemble). Les éléments d'un tracé sont liés. **Moteurs automatiques** (case cochée par défaut) : à la fin du tracé, un moteur se pose à chaque angle, près de chaque extrémité libre et tous les ≤ 6 m (réglable) ; **Replacer** les recalcule pour le pont sélectionné. Chaque moteur affiche sa **charge** (poids propre des ponts et cubes + ce qui est accroché sous le pont, réparti sur les 2 moteurs voisins), en rouge au-delà de la capacité choisie (500 kg par défaut) ; le panneau, le plan 2D (case « Grill et palans ») et la fiche PDF reprennent ces charges. *Calcul simplifié, à faire valider par un rigger.*

**Mode moteurs** : quand un pont (ou un de ses moteurs) est sélectionné, la ligne **Hauteur sous pont** apparaît. On y tape une hauteur, ou on monte / descend avec **▲ / ▼** (clic : 10 cm ; maintenu : en continu). Tout le pont bouge avec ses moteurs (crochets) et ce qui est accroché dessous ; les chaînes s'allongent ou se raccourcissent jusqu'à leur point d'accroche, qui reste fixe.

**Perches en série** (Installations) : N perches (porteuses Ø 48, ≈ 3,6 kg/m) de longueur et d'espacement réglables, à la hauteur voulue, avec leurs élingues jusqu'au gril (hauteur réglable). Elles se posent parallèles au nez de la dernière scène, du nez vers le lointain (sinon au centre de la vue), numérotées 1…N. Chaque perche affiche sa charge (tube + ce qui est accroché dessous), en rouge au-delà de la charge maximale réglée (250 kg par défaut). En **mode moteurs**, une perche sélectionnée se lève ou se descend **seule** (perche motorisée), avec ses projecteurs ; ses élingues s'allongent. L'ensemble se déplace d'un bloc.

**Gril ground support** (Installations) : 4 tours (type Prolyte MPT, 1 000 kg par tour) aux angles d'un cadre de ponts 290 ou 390 (portées réglables, arrondies au 0,5 m) posé entre leurs manchons, à la hauteur voulue, avec un moteur en tête de chaque tour. Le tout est lié et se pose au centre de la vue. Le mode moteurs fait glisser le cadre le long des tours (jusqu'à 1 m sous leur tête) ; la charge est calculée par tour (T1…T4). Ponts, moteurs et perches comptent dans les charges accrochées mais pas sur les palans du grill du machiniste (ils ont leurs propres points d'accroche).

### Vue
- **Deux salles** : **Bâtiment / Agora** (tout le bâtiment) ou **Auditorium seul**. En mode auditorium :
  - la vue n'affiche que l'auditorium (scène, gradins, loges, régie), plafond coupé pour voir dedans ;
  - les **sièges** sont transparents, avec un curseur d'opacité (sous 50 %, un clic les traverse) ;
  - une case masque les **9 sièges amovibles** sur marches ;
  - la jauge compte les places assises visibles (287 avec les amovibles) ;
  - les setups, l'aperçu 2D, la fiche PDF et la vue **Face** sont propres à l'auditorium ;
  - les presets et repères de l'Agora (machiniste, concert, FIP 360, trappes, axe et piliers) sont masqués.
  Chaque setup garde sa salle : le charger (ou ouvrir son lien) bascule dans la bonne vue.
- **Cintres motorisés de l'auditorium** (mode auditorium, Installations) : les 8 équipes des plans TAMBE (EXE lot 23 : 0003, 0004, 0680, 0691 à 0693), cotées depuis le cadre de scène a04 :
  | Équipe | Position | Longueur | CMU | Course (m / plateau) |
  |---|---|---|---|---|
  | F1, F2, F3 (frontales) | 0,77 · 3,32 · 6,38 m du cadre vers le lointain | 12 m | 350 daN | 1,00 → 9,20 |
  | C1, C2 (lourdes) | 5,29 · 3,90 m | 10,4 m | 1,5 t | 0,20 → 9,20 |
  | S1 (salle) | 3,50 m en salle | 10,4 m | 350 daN | 1,80 → 9,20 |
  | LC, LJ (latérales) | à 6,45 m de l'axe, côté cour et jardin | 5,5 m | 350 daN | 1,00 → 9,20 |

  Le gril est à 10,48 m du plateau (niv. 64,05). Les équipes se posent au point haut, et chacune se lève seule en mode moteurs, bloquée à sa course et arrêtée quand sa charge la plus basse arrive à 0,3 m du sol. La charge (tube + appareils accrochés) est comparée à sa CMU. Repérage : axe a04 = mur du cadre de scène (linteau IFC x −82,74), axe de scène z = 2,9.
- **Boîtiers AV / lumière** (mode auditorium, bouton dans Vue) : les 92 terminaux des plans des terminaux audiovisuels (lot 22, R0 / R1 / R2) :
  - 30 boîtiers AV (BAV, bleu), 46 boîtiers d'éclairage scénique (BECL, rouge), 16 enceintes (HP, gris), chacun avec son repère ;
  - ceux montés sur les porteuses (BECL-02 à 29, BAV-06) suivent leur équipe S1, F1, F2 ou F3 quand on la lève ou la descend ;
  - ils sortent sur le plan 2D de l'auditorium avec leur repère et la légende.
  Relevé automatique (tools/terminaux.py) : chaque étiquette du PDF est suivie le long de sa ligne de rappel jusqu'au symbole, puis calée sur les axes a05 / a04 et ae / ad (précision ≈ 10–20 cm).
  Un clic sur un boîtier donne son contenu d'après le carnet de détails (0606) : localisation (« lisse face scène », « plateau face jardin »…), type, prises (32 A tri / mono, 16 A, 16 A direct commandée) et connecteurs (DMX, Art-Net, RJ45, XLR, fibre, SDI). Les numéros de circuit (ADC-02-P1…) sont des images dans le PDF : non repris.
- **Équipement de cage** (avec les cintres) : écran polichinelle (image 9,6 × 6 m, de 2 à 8 m, à 5,87 m du cadre) et patience motorisée d'avant-scène (rail à 9,57 m, à 0,43 m, rideaux massés). La conque de scène 1 (1 290 kg) est comptée pour moitié sur C1 et sur C2 ; la conque 2 et les 3 réflecteurs de salle pendent sur câbles fixes (déjà dans la maquette IFC).
- **Conques d'orchestre** : les 6 décors d'orchestre mobiles (1,46 × 4,52 m) en configuration concert, 3 de chaque côté, ouverts à ≈ 31° vers la salle.
- **Plan de feu Gaspar Claus** : proposition d'implantation de la liste de location (V.2) :
  | Où | Appareils |
  |---|---|
  | S1 (salle) | 4 × 713 SX en face |
  | F1 | 4 × PC 1 kW |
  | F2 | 3 × 654 SX |
  | F3 | 3 × lyres découpe en contre |
  | Plateau | 4 × 654 SX en latéraux, 1 × 654 SX en contre, 4 × lyres découpe au lointain, Atomic 3000, brouillard en coulisse jardin |

  Les appareils des porteuses sont accrochés tête en bas et suivent leur équipe. Chacun est relié au boîtier BECL le plus proche (de sa porteuse, sinon au plateau) : la sélection affiche « → BECL-05 », et le dossier technique liste par boîtier le nombre d'appareils, la puissance et les prises 16 A utilisées / disponibles.
- **Éditeur de patch 2D** (mode auditorium, Installations) : plan de feu de dessus, lointain en haut, jardin à gauche, sur fond blanc :
  - chaque projecteur est une pastille numérotée (couleur par type) avec son type et « boîtier · circuit » (ex. B05 · C2), et un trait pointillé vers son boîtier ;
  - les équipes portent leur nom et leur hauteur ; les boîtiers utilisés sont en couleur, les autres en gris ;
  - glisser un projecteur le déplace (le long de sa porteuse s'il est accroché, librement au plateau) ; la 3D suit ;
  - un clic ouvre son panneau : boîtier (auto = le plus proche), circuit (0 = premier libre), puissance, suppression ;
  - le tableau de patch liste N°, appareil, équipe, boîtier, circuit / prises du boîtier, puissance ; en rouge : circuit en double, circuit au-delà des prises 16 A du boîtier, appareil sans boîtier ;
  - molette : zoom, glisser le fond : déplacer, « Recadrer » ; « Patch auto » oublie les choix manuels ; « Imprimer » sort le plan et le tableau sur une page A4 paysage.
  Le patch est enregistré avec les setups. Circuit = n° de prise 16 A dans le boîtier : les repères d'armoire (ADC-xx-Px) du carnet ne sont pas lisibles (images).
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
- **Fiche setup (PDF)** : ouvre une page imprimable avec le plan de toute l'Agora sur la page 1 (A4 paysage), le matériel (quantités, poids, puissance), les charges, la jauge, le rigging par point et les trappes et câbles. On l'enregistre en PDF depuis l'impression du navigateur.

### Setups de salle
Un setup enregistre :
- les éléments ajoutés et leur position (avec leur trappe et leur puissance) ;
- les objets de la maquette déplacés ou masqués ;
- la caméra ;
- les calques visibles et la coupe.

Chaque setup appartient à un **événement** avec une **date** (ex. « FIP 360 », 14/11). La liste est rangée par événement, du plus proche au plus lointain ; les setups sans événement sont regroupés à la fin. Sur chaque setup :
- **▶** le charge (les champs nom / événement / date se remplissent : **Sauver** met alors à jour ce setup) ;
- **⟳** le met à jour : il est remplacé par l'état actuel de la salle (nom, événement et date conservés) ;
- **🔗** copie le lien de partage de ce setup (un lien est une copie : après ⟳, recopier un nouveau lien) ;
- **⧉** le duplique pour faire une variante ;
- **✎** le renomme ou le change d'événement ;
- **✕** le supprime.

On coche **deux setups** puis **Comparer** : une page montre les deux plans de l'Agora côte à côte et un tableau des écarts (jauge, charges, rigging, matériel ligne par ligne), à imprimer en A3 paysage.

On clique sur **Sauver** puis sur **▶**. **Lien** copie une adresse qui ouvre le setup courant sur n'importe quel ordinateur (le setup est compressé dans l'adresse, environ 700 caractères, sans serveur). C'est une copie : les modifications de l'autre personne ne reviennent pas, il faut qu'elle renvoie un lien. Les setups sont stockés **dans le navigateur** : utilise **Exporter JSON** / **Importer** pour les sauvegarder ou les partager. **⌘Z / ⌘⇧Z** annule ou rétablit chaque modification.

### Exports
- **Aperçu 2D (SVG)** : vue de dessus de toute l'Agora avec le setup, sur le plan DXF complet en gris (murs, portes, axes, noms des locaux). Il contient :
  - les éléments en couleur avec leurs cotes et la flèche ▲ de face avant des enceintes ;
  - les trappes, une légende, des règles graduées et une grille de 1 m / 5 m.

  Le plan est à l'échelle **1:100** si on l'imprime à 100 %.
  Le grill, ses cotes et les palans n'y figurent que si la case **Grill et palans sur les plans 2D** est cochée (décochée par défaut) ; le tableau de rigging reste dans la fiche PDF.
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
| Se déplacer | ZQSD ou WASD |
| Tourner la vue à gauche / à droite | A / E |
| Incliner le regard vers le haut / le bas | flèches ↑ / ↓ |
| Monter / descendre | G / B, flèches → / ← (ou Page ↑ / ↓) |
| Aller plus vite | Maj |
| Déplacer / tourner la sélection | T / R (magnétisme 0,5 m / 15°) |
| Centrer sur la sélection | C |
| Masquer la sélection | H |
| Mesurer / vue public | M / V |
| Tracer des passe-câbles | P (Échap pour finir) |
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
| `terminaux_au.json` | les 92 boîtiers de l'auditorium (BAV, BECL, HP), niveau R0 / R1 / R2 ou porteuse |
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
python terminaux.py <dossier des plans TER_AU>   # -> ../terminaux_au.json (plans des terminaux AV de l'auditorium, vectoriels)
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

// Calculs purs de Salle 3D : sans Three.js ni DOM, pour pouvoir les tester (tests/calc.test.mjs, `node --test`).
// index.html les importe ; les objets 3D y sont convertis en données simples ({ x, z, kg }…) avant l'appel.

export const fr = (v, n = 1) => v.toFixed(n).replace('.', ',');

// --- praticables 2 × 1 m : calepinage d'une scène W × D (m), le moins de pièces possible ---
// retourne [x, z, largeur, profondeur] par praticable, depuis le coin (0, 0) ; une cote impaire se finit en 1 × 2
export function pratLayout(W, D) {
  const e = 1e-6, fill = (W, D) => {
    const r = [], nx = Math.floor(W / 2 + e);
    for (let i = 0; i < nx; i++) for (let z = 0; z < D - e; z++) r.push([i * 2, z, 2, 1]);
    for (let x = nx * 2; x < W - e; x++) for (let z = 0; z < D - e; z += 2) r.push([x, z, 1, 2]);
    return r;
  };
  const a = fill(W, D), b = fill(D, W).map(([x, z, w, d]) => [z, x, d, w]);
  return a.length <= b.length ? a : b;
}

// --- cordon de potelets : flèche d'une corde de longueur L entre 2 potelets distants de S (axe à axe) ---
// approximation parabolique L ≈ s + 8f²/3s, s = S − 6 cm (accroches) ; corde tendue : 1 cm ; jamais plus bas que 5 cm du sol
export const ROPE_L = 2, ROPE_Y = 0.9;
export const ropeSag = (S, L = ROPE_L, Y = ROPE_Y) => { const s = Math.max(0.05, S - 0.06); return s >= L ? 0.01 : Math.min(Y - 0.05, Math.sqrt(3 * s * (L - s) / 8)); };

// --- grill du machiniste : palans aux croisements de 4 rangées (zs) et 3 colonnes (début, milieu, fin de xs) ---
// lignes = 4 rangées + 2 côtés ; chaque palan porte son poids propre (hoistKg) puis la moitié de chaque tronçon de poutre voisin (kgm)
export function gridRig(xs, zs, kgm, hoistKg) {
  const pts = [], at = (x, z) => { let p = pts.find(q => Math.abs(q.x - x) < 0.01 && Math.abs(q.z - z) < 0.01); if (!p) pts.push(p = { x, z, kg:hoistKg }); return p; };
  const X = [xs[0], xs[xs.length >> 1], xs[xs.length - 1]];
  const lines = [...zs.map(z => X.map(x => at(x, z))), ...[X[0], X[2]].map(x => zs.map(z => at(x, z)))];
  for (const L of lines) for (let i = 1; i < L.length; i++) { const w = Math.hypot(L[i].x - L[i - 1].x, L[i].z - L[i - 1].z) * kgm / 2; L[i].kg += w; L[i - 1].kg += w; }
  return { pts, lines };
}
// charge accrochée en (x, z) : sur la poutre la plus proche (≤ maxD), répartie entre ses 2 palans voisins (bras de levier) ; false si trop loin
export function hangOnGrid(lines, x, z, kg, maxD = 1) {
  let best = null;
  for (const L of lines) for (let i = 1; i < L.length; i++) {
    const a = L[i - 1], b = L[i], dx = b.x - a.x, dz = b.z - a.z, t = Math.min(1, Math.max(0, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz)));
    const d = Math.hypot(a.x + t * dx - x, a.z + t * dz - z); if (!best || d < best.d) best = { d, a, b, t };
  }
  if (!best || best.d > maxD) return false;
  best.a.kg += kg * (1 - best.t); best.b.kg += kg * best.t; return true;
}

// --- ponts : une charge en (x, z) répartie sur les 2 points d'accroche les plus proches, au prorata inverse de la distance ---
// pts : [{ x, z, kg }] (moteurs ou tours) ; exact entre 2 moteurs alignés, approché aux angles — à faire valider par un rigger
export function shareNearest(pts, x, z, w) {
  const by = pts.map(p => ({ p, d:Math.hypot(p.x - x, p.z - z) })).sort((u, v) => u.d - v.d);
  if (by.length === 1 || by[0].d < 1e-3) { by[0].p.kg += w; return; }
  const [u, v] = by; u.p.kg += w * v.d / (u.d + v.d); v.p.kg += w * u.d / (u.d + v.d);
}

// --- patch : circuits des boîtiers (gradateur 3 kW par circuit, prise double = 2 appareils max) ---
export const CIRC_W = 3000;
// rows : [{ box (id du boîtier ou null), nc (nb de circuits du boîtier), W (puissance), c (circuit choisi, 0 = auto) }], dans l'ordre du patch
// choix manuels d'abord, puis le premier circuit vide du boîtier, sinon partage d'une prise double (2 appareils, ≤ circW) ; sinon circuit 1…n+1
// retourne la charge par circuit : Map 'box/c' -> { n, W }
export function assignCircuits(rows, circW = CIRC_W) {
  const load = new Map(), K = (b, c) => b + '/' + c, add = r => { const e = load.get(K(r.box, r.c)) || { n:0, W:0 }; e.n++; e.W += r.W; load.set(K(r.box, r.c), e); };
  rows.filter(r => r.box && r.c).forEach(add);
  for (const r of rows) if (r.box && !r.c) { const n = r.nc, ok = c => { const e = load.get(K(r.box, c)); return !e || (e.n < 2 && e.W + r.W <= circW); };
    let c = 1; while (c <= n && load.get(K(r.box, c))) c++; if (c > n) { c = 1; while (c <= n && !ok(c)) c++; } r.c = c; add(r); }
  return load;
}
// alerte de circuit d'un appareil (texte vide si tout va bien) ; cn = nom du circuit (ADC-…)
export function circuitError(r, load, cn, circW = CIRC_W) {
  const e = r.box && load.get(r.box + '/' + r.c);
  return !r.box ? 'sans boîtier' : !r.nc ? 'boîtier sans circuit connu' : r.c > r.nc ? `le boîtier n'a que ${r.nc} circuits` : e.n > 2 ? `${e.n} appareils sur ${cn} (prise double : 2 max)` : e.W > circW ? `${cn} chargé à ${fr(e.W / 1000, 2)} kW (gradateur 3 kW)` : '';
}

// --- patch : adresses DMX ---
// rows : [{ u, a, ch }] ; a = 0 -> adresse auto. Adresses manuelles d'abord, puis adressage auto dans l'ordre du patch
// (univers 1, sans chevauchement ; on passe à l'univers suivant quand l'empreinte dépasserait 512)
export const dmxOverlaps = (rows, r, u = r.u, a = r.a, ch = r.ch) => rows.some(q => q !== r && q.a && q.u === u && a <= q.a + q.ch - 1 && q.a <= a + ch - 1);
export function assignDmx(rows) {
  // empreinte > 512 : jamais adressable (signalée par dmxError) ; sans ce garde-fou, la boucle ne finirait pas
  for (const r of rows) if (!r.a && r.ch >= 1 && r.ch <= 512) { let u = 1, a = 1; while (dmxOverlaps(rows, r, u, a, r.ch) || a + r.ch - 1 > 512) { a++; if (a + r.ch - 1 > 512) { u++; a = 1; } } r.u = u; r.a = a; }
  return rows;
}
export const dmxError = (rows, r) => r.a + r.ch - 1 > 512 ? `DMX : dépasse 512 (${r.a} + ${r.ch} canaux)` : dmxOverlaps(rows, r) ? 'DMX : adresses qui se chevauchent' : '';

// --- conduite machinerie : durée réelle d'une manœuvre a -> b (s) = l'élément le plus long ---
// a, b : { h:{ équipe: hauteur (m) }, patience, ecran } ; vit : m/s par équipe (0,15 par défaut) ; patV, ecrV : fraction par seconde
export function cueTime(a, b, vit, patV, ecrV) {
  let t = 0; for (const [n, h] of Object.entries(b.h)) if (a.h[n] != null) t = Math.max(t, Math.abs(h - a.h[n]) / (vit[n] || 0.15));
  if (a.patience != null && b.patience != null) t = Math.max(t, Math.abs(b.patience - a.patience) / patV);
  if (a.ecran != null && b.ecran != null) t = Math.max(t, Math.abs(b.ecran - a.ecran) / ecrV); return t;
}

// --- setups venus de l'extérieur (lien #s=…, fichier importé, stockage) : valeurs bornées avant de construire la scène ---
// Un lien piégé (écran LED de 100 000 m, 10 000 canaux DMX…) ferait tourner des boucles sans fin et figerait l'onglet.
export const LIMITS = { L:120, P:120, H:40, min:0.01, other:1e5, pos:2000, props:5000, str:80 };
const num = (v, lo, hi) => Number.isFinite(+v) && v !== null && v !== '' ? Math.min(hi, Math.max(lo, +v)) : null;
const vec3 = (a, lim) => Array.isArray(a) && a.length >= 3 && a.slice(0, 3).every(v => Number.isFinite(+v) && v !== null) ? a.slice(0, 3).map(v => Math.min(lim, Math.max(-lim, +v))) : null;
// dims : L, P, H bornés à des valeurs plausibles, puis les paramètres propres à chaque objet (nombres finis ou textes courts)
export function cleanDims(dims, fallback = [1, 1, 1]) {
  const d = Array.isArray(dims) ? dims.slice(0, 12) : fallback.slice();
  return d.map((v, i) => typeof v === 'string' ? v.slice(0, LIMITS.str)
    : i < 3 ? num(v, LIMITS.min, [LIMITS.L, LIMITS.P, LIMITS.H][i]) ?? fallback[i] ?? 1
    : num(v, -LIMITS.other, LIMITS.other) ?? 0);
}
// un élément ajouté : null s'il est inutilisable (type inconnu, position illisible)
export function cleanProp(x, known, defaults = {}) {
  if (!x || typeof x !== 'object' || typeof x.kind !== 'string' || !known.has(x.kind)) return null;
  const p = vec3(x.p, LIMITS.pos), r = vec3(x.r, 2 * Math.PI) || [0, 0, 0];
  if (!p) return null;
  return { ...x, dims:cleanDims(x.dims, defaults[x.kind] || [1, 1, 1]), p, r };
}
export const cleanDmx = d => ({ u:Math.round(num(d?.u, 1, 64) ?? 1), a:Math.round(num(d?.a, 0, 512) ?? 0), ch:Math.round(num(d?.ch, 0, 512) ?? 0) });
export const cleanVec3 = (a, lim = LIMITS.pos) => vec3(a, lim);

// --- placement précis ---
// cote au bâti : distance du point (ox, oz) au premier segment touché dans la direction (dx, dz) (unitaire) ; segs = [x1, z1, x2, z2, …]
export function rayToSegments(ox, oz, dx, dz, segs, maxT = 60) {
  let best = Infinity;
  for (let i = 0; i + 3 < segs.length; i += 4) {
    const ax = segs[i], az = segs[i + 1], ex = segs[i + 2] - ax, ez = segs[i + 3] - az, den = dx * ez - dz * ex;
    if (Math.abs(den) < 1e-12) continue; // parallèle
    const wx = ax - ox, wz = az - oz, t = (wx * ez - wz * ex) / den, u = (wx * dz - wz * dx) / den;
    if (t > 1e-3 && t < best && u >= 0 && u <= 1) best = t;
  }
  return best <= maxT ? best : null;
}
// aligner / répartir des emprises { minX, maxX, minZ, maxZ } : renvoie le décalage [dx, dz] de chacune
// modes : 'xmin' | 'xmid' | 'xmax' | 'zmin' | 'zmid' | 'zmax' (aligner) ; 'xdist' | 'zdist' (espaces égaux entre les emprises, les 2 extrêmes restent en place)
export function alignShifts(boxes, mode) {
  const ax = mode[0], lo = ax === 'x' ? 'minX' : 'minZ', hi = ax === 'x' ? 'maxX' : 'maxZ', mid = b => (b[lo] + b[hi]) / 2;
  const put = (b, d) => ax === 'x' ? [d, 0] : [0, d];
  if (mode.endsWith('dist')) {
    if (boxes.length < 3) return boxes.map(() => [0, 0]);
    const order = boxes.map((b, i) => i).sort((a, b) => mid(boxes[a]) - mid(boxes[b])), first = boxes[order[0]], last = boxes[order.at(-1)];
    const span = last[hi] - first[lo], used = boxes.reduce((s, b) => s + b[hi] - b[lo], 0), gap = (span - used) / (boxes.length - 1), out = boxes.map(() => [0, 0]);
    let at = first[lo]; for (const i of order) { out[i] = put(boxes[i], at - boxes[i][lo]); at += boxes[i][hi] - boxes[i][lo] + gap; }
    return out;
  }
  const target = mode.endsWith('min') ? Math.min(...boxes.map(b => b[lo])) : mode.endsWith('max') ? Math.max(...boxes.map(b => b[hi])) : (Math.min(...boxes.map(b => b[lo])) + Math.max(...boxes.map(b => b[hi]))) / 2;
  return boxes.map(b => put(b, mode.endsWith('min') ? target - b[lo] : mode.endsWith('max') ? target - b[hi] : target - mid(b)));
}
// cap d'un objet (degrés, 0 = +x du site, sens trigonométrique vu de dessus) à partir de son axe x local projeté au sol
export const headingDeg = (ux, uz) => { const a = Math.atan2(-uz, ux) * 180 / Math.PI; return Math.round(((a % 360) + 360) % 360 * 100) / 100; };
// --- implantation du public : chaises et tables dans une zone W × D (m), centrée sur l'origine, la scène vers +z ---
// théâtre : p = [rang (entraxe), largeur de place, places max entre 2 allées, largeur d'allée] ; rangées parallèles à x, sièges tournés vers +z
// cabaret / banquet : p = [entraxe des tables, Ø table, chaises par table, —] ; cabaret : pas de chaise dos à la scène (côté +z)
// ponytail: valeurs par défaut d'usage courant, à valider avec le chargé de sécurité (largeurs d'allées, nombre de places par rangée)
export const PUBLIC_DEFAULTS = { public_theatre:[0.9, 0.5, 16, 1.2], public_cabaret:[2.8, 1.2, 6, 0], public_banquet:[3.3, 1.8, 10, 0] };
export function seatingLayout(kind, W, D, p = PUBLIC_DEFAULTS[kind]) {
  const seats = [], tables = [];
  if (kind === 'public_theatre') {
    const [rang, place, max, allee] = p, rows = Math.floor(D / rang + 1e-9);
    let k = 1, n = 0; // k blocs séparés par k − 1 allées, n places par rangée
    for (; k <= 50; k++) { n = Math.floor((W - (k - 1) * allee) / place + 1e-9); if (n <= 0) { n = 0; break; } if (Math.ceil(n / k) <= max) break; }
    const per = Array.from({ length:k }, (_, i) => Math.floor(n / k) + (i < n % k ? 1 : 0)), used = n * place + (k - 1) * allee;
    for (let r = 0; r < rows; r++) { const z = D / 2 - rang / 2 - r * rang; let x = -used / 2; // premier rang côté scène
      for (const m of per) { for (let i = 0; i < m; i++) seats.push([x + place * (i + 0.5), z, 0]); x += m * place + allee; } }
    return { seats, tables, rows, perRow:n, blocks:k };
  }
  const [e, phi, nc] = p, nx = Math.floor(W / e + 1e-9), nz = Math.floor(D / e + 1e-9), r = phi / 2 + 0.3;
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const x = -nx * e / 2 + e * (i + 0.5), z = -nz * e / 2 + e * (j + 0.5); tables.push([x, z]);
    for (let c = 0; c < nc; c++) {
      const a = kind === 'public_cabaret' ? Math.PI / 2 + (c + 0.5) * (1.5 * Math.PI / nc) + Math.PI / 4 // 3/4 du tour, côté opposé à la scène
        : c * 2 * Math.PI / nc;
      const sx = x + r * Math.cos(a), sz = z + r * Math.sin(a); seats.push([sx, sz, Math.atan2(x - sx, z - sz)]); // tournée vers la table
    }
  }
  return { seats, tables, rows:nz, perRow:nx * nc };
}

// --- issues de secours et dégagements : règle générale ERP (art. CO 38), contrôle indicatif à valider avec le chargé de sécurité ---
// unités de passage d'une issue de largeur w (m) : 1 UP = 0,90 m ; 2 UP = 1,40 m ; n UP = n × 0,60 m au-delà ; < 0,90 m : 0 UP (dégagement accessoire)
export const upFromWidth = w => w >= 1.8 - 1e-9 ? Math.floor(w / 0.6 + 1e-9) : w >= 1.4 - 1e-9 ? 2 : w >= 0.9 - 1e-9 ? 1 : 0;
export const widthFromUp = n => n <= 0 ? 0 : n === 1 ? 0.9 : n === 2 ? 1.4 : +(n * 0.6).toFixed(2);
// effectif > 100 : 2 dégagements jusqu'à 500 personnes, + 1 par 500 ou fraction au-delà ; 1 UP par 100 personnes ou fraction, + 1 UP jusqu'à 500 personnes
// effectif ≤ 100 : 2 dégagements de 1 UP (le cas « 1 de 2 UP + 1 accessoire » n'est pas modélisé)
export function co38(n) {
  n = Math.max(0, Math.ceil(n));
  if (n === 0) return { exits:0, up:0 };
  if (n <= 19) return { exits:1, up:1 };
  if (n <= 100) return { exits:2, up:2 };
  return { exits:2 + (n > 500 ? Math.ceil((n - 500) / 500) : 0), up:Math.ceil(n / 100) + (n <= 500 ? 1 : 0) };
}
// bilan : issues [{ w, blocked }] -> issues et UP utilisables (non obstruées) face aux besoins
export function exitCheck(exits, effectif) {
  const need = co38(effectif), free = exits.filter(e => !e.blocked), up = free.reduce((s, e) => s + upFromWidth(e.w), 0);
  const counted = free.filter(e => upFromWidth(e.w) >= 1).length;
  return { need, exits:counted, up, blocked:exits.filter(e => e.blocked).length, ok:counted >= need.exits && up >= need.up };
}

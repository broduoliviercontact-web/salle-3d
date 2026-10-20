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
  for (const r of rows) if (!r.a) { let u = 1, a = 1; while (dmxOverlaps(rows, r, u, a, r.ch) || a + r.ch - 1 > 512) { a++; if (a + r.ch - 1 > 512) { u++; a = 1; } } r.u = u; r.a = a; }
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

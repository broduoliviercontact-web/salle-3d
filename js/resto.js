// Restauration : mobilier (tables, chaises, tabourets, mange-debout) et zones de restauration remplies automatiquement.
// Module pur (sans Three.js), testé par `npm test`. Repère du plan : x à droite, z vers le bas, en mètres ; angles en radians dans ce repère.
// Un élément de mobilier :
//   ['t', x, z, L, P, a, h]  table rectangulaire (L le long de la direction a), hauteur h (1,1 = table haute)
//   ['o', x, z, Ø, h]        table ronde ou mange-debout
//   ['c', x, z, a]           chaise tournée vers a (le dossier est derrière)
//   ['s', x, z]              tabouret haut

export const CHAIR = 0.45, STOOL = 0.45;
const P2 = Math.PI / 2;
// modules du catalogue (mesurés sur le plan DACAM, au 1:200)
export const RESTO_MODS = {
  r_t2:{ name:'Table 2 places', desc:'Table 0,9 × 0,7 m, une chaise à chaque bout',
    items:[['t', 0, 0, 0.9, 0.7, 0, 0.75], ['c', -0.675, 0, 0], ['c', 0.675, 0, Math.PI]] },
  r_t4:{ name:'Table carrée 4 places', desc:'Table 0,9 × 0,9 m, une chaise par côté',
    items:[['t', 0, 0, 0.9, 0.9, 0, 0.75], ['c', -0.675, 0, 0], ['c', 0.675, 0, Math.PI], ['c', 0, -0.675, P2], ['c', 0, 0.675, -P2]] },
  r_h8:{ name:'Tablée haute 8 tabourets', desc:'Table haute 2,8 × 0,8 m, 4 tabourets de chaque côté',
    items:[['t', 0, 0, 2.8, 0.8, 0, 1.1], ...[-1.05, -0.35, 0.35, 1.05].flatMap(x => [['s', x, -0.7], ['s', x, 0.7]])] },
  r_r4:{ name:'Table ronde 4 places', desc:'Table ronde Ø 0,9 m, 4 chaises',
    items:[['o', 0, 0, 0.9, 0.75], ['c', -0.72, 0, 0], ['c', 0.72, 0, Math.PI], ['c', 0, -0.72, P2], ['c', 0, 0.72, -P2]] },
  r_md:{ name:'Mange-debout', desc:'Table haute ronde Ø 0,6 m, sans siège',
    items:[['o', 0, 0, 0.6, 1.1]] },
};
export const RESTO_DEFAULT = { mod:'r_t4', gx:1.2, gy:1.2, margin:0.3, ang:0 }; // allées de 1,20 m entre modules, 30 cm du bord

// emprise d'un élément : coins de son rectangle (cercle : carré englobant)
export function itemCorners(it) {
  const [k, x, z] = it;
  let w, d, a = 0;
  if (k === 't') [w, d, a] = [it[3], it[4], it[5]];
  else if (k === 'o') w = d = it[3];
  else if (k === 'c') { w = d = CHAIR; a = it[3]; }
  else w = d = STOOL;
  const c = Math.cos(a), s = Math.sin(a);
  return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([u, v]) => [x + u * c - v * s, z + u * s + v * c]);
}
export function itemsBox(items) {
  const p = items.flatMap(itemCorners);
  if (!p.length) return [[0, 0], [0, 0]];
  return [[Math.min(...p.map(q => q[0])), Math.min(...p.map(q => q[1]))], [Math.max(...p.map(q => q[0])), Math.max(...p.map(q => q[1]))]];
}
// déplace / tourne une liste d'éléments (rotation a autour de l'origine, puis translation)
export function moveItems(items, dx, dz, a = 0) {
  const c = Math.cos(a), s = Math.sin(a), r = v => Math.round(v * 1000) / 1000;
  return items.map(it => {
    const x = it[1] * c - it[2] * s + dx, z = it[1] * s + it[2] * c + dz, o = [it[0], r(x), r(z), ...it.slice(3)];
    if (it[0] === 't') o[5] = r(it[5] + a); if (it[0] === 'c') o[3] = r(it[3] + a);
    return o;
  });
}

// --- polygones ---
export const polyArea = p => Math.abs(p.reduce((s, [x, z], i) => { const [x2, z2] = p[(i + 1) % p.length]; return s + x * z2 - x2 * z; }, 0)) / 2;
export function polyCentroid(p) {
  let A = 0, cx = 0, cz = 0;
  p.forEach(([x, z], i) => { const [x2, z2] = p[(i + 1) % p.length], f = x * z2 - x2 * z; A += f; cx += (x + x2) * f; cz += (z + z2) * f; });
  if (Math.abs(A) < 1e-9) return [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length];
  return [cx / (3 * A), cz / (3 * A)];
}
export function pointInPoly([x, z], p) {
  let inside = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, zi] = p[i], [xj, zj] = p[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const segX = (a, b, c, d) => cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0;
// un quadrilatère (coins) entièrement dans le polygone : coins dedans, aucun bord croisé, aucun sommet du polygone dedans
export function quadInPoly(q, p) {
  if (!q.every(c => pointInPoly(c, p))) return false;
  for (let i = 0; i < 4; i++) for (let j = 0; j < p.length; j++) if (segX(q[i], q[(i + 1) % 4], p[j], p[(j + 1) % p.length])) return false;
  return !p.some(v => pointInPoly(v, q));
}

// remplit le polygone avec un module, en rangées (angle ang en degrés), allées gx / gy entre modules, marge au bord
export function fillZone(poly, opts = {}) {
  const o = { ...RESTO_DEFAULT, ...opts }, mod = RESTO_MODS[o.mod];
  if (!mod || !Array.isArray(poly) || poly.length < 3) return [];
  const [[x0, z0], [x1, z1]] = itemsBox(mod.items), W = x1 - x0, D = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const a = (+o.ang || 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  const rp = poly.map(([x, z]) => [x * c + z * s, -x * s + z * c]); // polygone dans le repère des rangées
  const bx0 = Math.min(...rp.map(q => q[0])), bx1 = Math.max(...rp.map(q => q[0])), bz0 = Math.min(...rp.map(q => q[1])), bz1 = Math.max(...rp.map(q => q[1]));
  const m = Math.max(0, +o.margin || 0), gx = Math.max(0, +o.gx || 0), gy = Math.max(0, +o.gy || 0), sx = W + gx, sz = D + gy;
  const nx = Math.floor((bx1 - bx0 - W - 2 * m) / sx) + 1, nz = Math.floor((bz1 - bz0 - D - 2 * m) / sz) + 1;
  if (nx < 1 || nz < 1 || nx * nz > 20000) return [];
  const ox = bx0 + (bx1 - bx0 - (nx - 1) * sx) / 2, oz = bz0 + (bz1 - bz0 - (nz - 1) * sz) / 2; // grille centrée sur la zone
  const out = [];
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const px = ox + i * sx, pz = oz + j * sz, h = [W / 2 + m, D / 2 + m];
    const q = [[px - h[0], pz - h[1]], [px + h[0], pz - h[1]], [px + h[0], pz + h[1]], [px - h[0], pz + h[1]]];
    if (!quadInPoly(q, rp)) continue;
    out.push(...moveItems(moveItems(mod.items, px - cx, pz - cz), 0, 0, a));
  }
  return out;
}

export function restoStats(items, poly) {
  const n = k => items.filter(i => i[0] === k).length;
  const area = Array.isArray(poly) && poly.length >= 3 ? polyArea(poly) : 0, places = n('c') + n('s');
  return { tables:n('t') + n('o'), places, chairs:n('c'), stools:n('s'), area, perPlace:places ? area / places : 0 };
}
// nomenclature : désignation -> nombre
export function restoBom(items) {
  const m = new Map(), add = k => m.set(k, (m.get(k) || 0) + 1), f = v => (Math.round(v * 100) / 100).toLocaleString('fr');
  for (const it of items) {
    if (it[0] === 't') { const [L, P] = [Math.max(it[3], it[4]), Math.min(it[3], it[4])]; add(`${it[6] > 0.9 ? 'Table haute' : 'Table'} ${f(L)} × ${f(P)} m`); }
    else if (it[0] === 'o') add(it[4] > 0.9 ? `Mange-debout Ø ${f(it[3])} m` : `Table ronde Ø ${f(it[3])} m`);
    else if (it[0] === 'c') add('Chaise');
    else if (it[0] === 's') add('Tabouret haut');
  }
  return m;
}

// --- dessin du plan (SVG, repère local de la zone) ---
const n3 = v => +(+v).toFixed(3);
export function furnitureSvg(items) {
  const out = [], st = 'stroke="#000" stroke-width="0.025"';
  for (const it of items) {
    const [k, x, z] = it;
    if (k === 't') {
      const [L, P, a, h] = [it[3], it[4], it[5], it[6]], tr = `transform="translate(${n3(x)} ${n3(z)}) rotate(${n3(a * 180 / Math.PI)})"`;
      out.push(`<g ${tr}><rect x="${n3(-L / 2)}" y="${n3(-P / 2)}" width="${n3(L)}" height="${n3(P)}" fill="#fff" fill-opacity="0.85" ${st}/>`
        + (h > 0.9 ? `<rect x="${n3(-L / 2 + 0.07)}" y="${n3(-P / 2 + 0.07)}" width="${n3(L - 0.14)}" height="${n3(P - 0.14)}" fill="none" stroke="#000" stroke-width="0.012"/>` : '') + '</g>');
    } else if (k === 'o') {
      out.push(`<circle cx="${n3(x)}" cy="${n3(z)}" r="${n3(it[3] / 2)}" fill="#fff" fill-opacity="0.85" ${st}/>`
        + (it[4] > 0.9 ? `<circle cx="${n3(x)}" cy="${n3(z)}" r="${n3(it[3] / 2 - 0.07)}" fill="none" stroke="#000" stroke-width="0.012"/>` : ''));
    } else if (k === 'c') { // assise + dossier épais à l'arrière
      const h = CHAIR / 2;
      out.push(`<g transform="translate(${n3(x)} ${n3(z)}) rotate(${n3(it[3] * 180 / Math.PI)})"><rect x="${-h}" y="${-h}" width="${CHAIR}" height="${CHAIR}" fill="#fff" fill-opacity="0.85" ${st}/>`
        + `<line x1="${n3(-h + 0.03)}" y1="${-h}" x2="${n3(-h + 0.03)}" y2="${h}" stroke="#000" stroke-width="0.06"/></g>`);
    } else if (k === 's') out.push(`<circle cx="${n3(x)}" cy="${n3(z)}" r="${n3(STOOL / 2)}" fill="#fff" fill-opacity="0.85" ${st}/>`);
  }
  return out.join('');
}
// zone : fond rose hachuré de rouge, contour en tirets (comme le plan DACAM), puis le mobilier
export function zoneSvg(poly, id) {
  if (!Array.isArray(poly) || poly.length < 3) return '';
  const pts = poly.map(q => q.map(n3).join(',')).join(' ');
  return `<defs><pattern id="${id}" width="0.6" height="0.6" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="0.6" stroke="#e8262b" stroke-width="0.035"/></pattern></defs>`
    + `<polygon points="${pts}" fill="#f2d6d6" fill-opacity="0.8"/><polygon points="${pts}" fill="url(#${id})"/>`
    + `<polygon points="${pts}" fill="none" stroke="#777" stroke-width="0.07" stroke-dasharray="0.45 0.25"/>`;
}

// zone venue d'un setup, d'un lien ou d'un fichier : valeurs bornées
const fin = (v, lo, hi) => Number.isFinite(+v) && v !== null && v !== '' ? Math.min(hi, Math.max(lo, +v)) : null;
const ARITY = { t:7, o:5, c:4, s:3 };
export function cleanResto(r, lim = 500) {
  if (!r || typeof r !== 'object') return null;
  const poly = (Array.isArray(r.poly) ? r.poly : []).slice(0, 400).map(q => Array.isArray(q) ? [fin(q[0], -lim, lim), fin(q[1], -lim, lim)] : [null, null]).filter(q => q[0] !== null && q[1] !== null);
  const items = [];
  for (const it of (Array.isArray(r.items) ? r.items : []).slice(0, 5000)) {
    if (!Array.isArray(it) || !ARITY[it[0]] || it.length < ARITY[it[0]]) continue;
    const v = it.slice(1, ARITY[it[0]]).map((x, i) => fin(x, i < 2 ? -lim : -100, i < 2 ? lim : 100));
    if (v.includes(null)) continue;
    if (it[0] === 't' && (v[2] <= 0 || v[3] <= 0 || v[2] > 20 || v[3] > 20 || v[5] <= 0 || v[5] > 3)) continue;
    if (it[0] === 'o' && (v[2] <= 0 || v[2] > 5 || v[3] <= 0 || v[3] > 3)) continue;
    items.push([it[0], ...v]);
  }
  const a = r.auto && typeof r.auto === 'object' && RESTO_MODS[r.auto.mod]
    ? { mod:r.auto.mod, gx:fin(r.auto.gx, 0, 20) ?? RESTO_DEFAULT.gx, gy:fin(r.auto.gy, 0, 20) ?? RESTO_DEFAULT.gy, margin:fin(r.auto.margin, 0, 10) ?? RESTO_DEFAULT.margin, ang:fin(r.auto.ang, -360, 360) ?? 0 } : null;
  return { name:String(r.name || 'Zone de restauration').slice(0, 80), poly:poly.length >= 3 ? poly : [], items, auto:a, src:r.src ? String(r.src).slice(0, 40) : '' };
}

// --- scinder une zone par un trait (a -> b, repère local de la zone) ---
// La droite (a, b) coupe le contour en plusieurs cordes intérieures ; on garde celle qui recouvre le plus le trait tracé
// (un trait qui ne traverse qu'un bras d'une zone en L ne coupe que ce bras). Le mobilier suit le morceau où tombe son centre.
export function splitPoly(poly, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz; if (L2 < 1e-6 || poly.length < 3) return null;
  const hits = []; // intersections droite / bords : paramètre t le long de (a, b), bord i, point
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length], ex = q[0] - p[0], ez = q[1] - p[1], den = dx * ez - dz * ex;
    if (Math.abs(den) < 1e-12) continue;
    const wx = p[0] - a[0], wz = p[1] - a[1], t = (wx * ez - wz * ex) / den, u = (wx * dz - wz * dx) / den;
    if (u >= 0 && u < 1) hits.push({ t, i, pt:[a[0] + t * dx, a[1] + t * dz] });
  }
  hits.sort((h, k) => h.t - k.t);
  let best = null;
  for (let k = 0; k + 1 < hits.length; k++) {
    const h1 = hits[k], h2 = hits[k + 1]; if (h2.t - h1.t < 1e-6) continue;
    const mid = [(h1.pt[0] + h2.pt[0]) / 2, (h1.pt[1] + h2.pt[1]) / 2]; if (!pointInPoly(mid, poly)) continue; // corde intérieure
    const ov = Math.min(1, h2.t) - Math.max(0, h1.t); // recouvrement avec le trait [0, 1]
    if (ov > 0 && (!best || ov > best.ov)) best = { h1, h2, ov };
  }
  if (!best) return null;
  const { h1, h2 } = best, n = poly.length, walk = (from, to) => { const out = []; for (let i = (from + 1) % n; ; i = (i + 1) % n) { out.push(poly[i]); if (i === to) break; } return out; };
  const A = [h1.pt, ...walk(h1.i, h2.i), h2.pt], B = [h2.pt, ...walk(h2.i, h1.i), h1.pt];
  const clean = P => P.filter((p, i) => { const q = P[(i + 1) % P.length]; return Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-6; }).map(p => p.map(v => Math.round(v * 1000) / 1000));
  const r = [clean(A), clean(B)];
  return r.every(P => P.length >= 3 && polyArea(P) > 0.05) ? r : null;
}
export function splitResto(r, a, b) {
  const parts = splitPoly(r.poly, a, b); if (!parts) return null;
  const [P1, P2] = parts, c1 = polyCentroid(P1), c2 = polyCentroid(P2);
  const side = it => pointInPoly([it[1], it[2]], P1) ? 0 : pointInPoly([it[1], it[2]], P2) ? 1
    : Math.hypot(it[1] - c1[0], it[2] - c1[1]) <= Math.hypot(it[1] - c2[0], it[2] - c2[1]) ? 0 : 1;
  const items = [[], []]; for (const it of r.items) items[side(it)].push(it);
  return parts.map((poly, k) => ({ ...r, poly, items:r.auto ? fillZone(poly, r.auto) : items[k], auto:r.auto ? { ...r.auto } : null }));
}

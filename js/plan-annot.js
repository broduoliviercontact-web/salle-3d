// Annotations du plan 2D (textes, flèches, cotes, zones, pictos) : n'existent que sur le plan, pas en 3D.
// Repère du plan : x vers la droite, z vers le bas, en mètres (1 unité SVG = 1 m). Module pur, testé par `npm test`.
//   { id, t:'text'|'arrow'|'dim'|'zone'|'icon', p:[[x, z], …], txt, col, s, ic }
//   text / icon : 1 point (centre) ; arrow : départ → pointe ; dim : 2 points mesurés ; zone : 2 coins opposés
// s : facteur de taille (1 = normal), ic : picto (clé de ICONS)

export const ANNOT_COLORS = ['#e8262b', '#ff6b6b', '#e67e00', '#f4a261', '#e6b800', '#8bc34a', '#1a8f3c', '#0f9d9a', '#4fc3f7', '#1f5fbf', '#1b2a4a', '#7b2fbf', '#d6008f', '#8d6e63', '#555555', '#111111']; // 16 couleurs (plus le sélecteur libre de l'éditeur)
export const ANNOT_LIMIT = 500;

// pictos dessinés ici (carré arrondi + symbole simple), libellé de légende et couleur
export const ICONS = {
  sortie:     { name:'Sortie de secours', col:'#1a8f3c' },
  extincteur: { name:'Extincteur', col:'#d0021b' },
  ria:        { name:'RIA (robinet incendie)', col:'#d0021b' },
  secours:    { name:'Poste de secours', col:'#1a8f3c' },
  pmr:        { name:'Accès PMR', col:'#1f5fbf' },
  wc:         { name:'Toilettes', col:'#1f5fbf' },
  info:       { name:'Accueil / information', col:'#1f5fbf' },
  regie:      { name:'Emplacement régie', col:'#333333' },
  elec:       { name:'Armoire électrique', col:'#e6b800' },
  rassemble:  { name:'Point de rassemblement', col:'#1a8f3c' },
  securite:   { name:'Sécurité', col:'#1b2a4a' },
  croix:      { name:'Croix', col:'#e8262b' },
};

const f = v => +(+v).toFixed(3);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
export const fmtM = v => `${(Math.round(v * 100) / 100).toLocaleString('fr', { minimumFractionDigits:2, maximumFractionDigits:2 })} m`;

export const annotLength = a => Math.hypot(a.p[1][0] - a.p[0][0], a.p[1][1] - a.p[0][1]);
export const zoneRect = a => [Math.min(a.p[0][0], a.p[1][0]), Math.min(a.p[0][1], a.p[1][1]), Math.abs(a.p[1][0] - a.p[0][0]), Math.abs(a.p[1][1] - a.p[0][1])];
export const zoneArea = a => { const [, , w, h] = zoneRect(a); return w * h; };
export const fmtArea = v => `${(Math.round(v * 10) / 10).toLocaleString('fr')} m²`;

// cotes de chaque bord d'un contour : trait de cote décalé vers l'extérieur, traits obliques aux bouts, longueur (jamais à l'envers)
export function edgeCotesSvg(poly, col = '#111', s = 1, min = 0.5) {
  if (!Array.isArray(poly) || poly.length < 3) return '';
  const area = poly.reduce((t, [x, z], i) => { const [x2, z2] = poly[(i + 1) % poly.length]; return t + x * z2 - x2 * z; }, 0), out = [], off = 0.45 * s, fs = 0.32 * s;
  poly.forEach((p, i) => {
    const q = poly[(i + 1) % poly.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]); if (L < min) return;
    const ux = (q[0] - p[0]) / L, uz = (q[1] - p[1]) / L, sg = area > 0 ? -1 : 1, nx = -uz * sg, nz = ux * sg; // normale vers l'extérieur
    const a = [p[0] + nx * off, p[1] + nz * off], b = [q[0] + nx * off, q[1] + nz * off], t = 0.12 * s;
    let ang = Math.atan2(uz, ux) * 180 / Math.PI; if (ang > 90) ang -= 180; if (ang <= -90) ang += 180;
    const m = [(a[0] + b[0]) / 2 + nx * fs * 0.45, (a[1] + b[1]) / 2 + nz * fs * 0.45];
    out.push(`<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${col}" stroke-width="${f(0.025 * s)}"/>`
      + [a, b].map(c => `<line x1="${f(c[0] - (ux + nx) * t)}" y1="${f(c[1] - (uz + nz) * t)}" x2="${f(c[0] + (ux + nx) * t)}" y2="${f(c[1] + (uz + nz) * t)}" stroke="${col}" stroke-width="${f(0.04 * s)}"/>`).join('')
      + `<text transform="translate(${f(m[0])} ${f(m[1])}) rotate(${f(ang)})" font-size="${f(fs)}" text-anchor="middle" dominant-baseline="middle" font-weight="bold" fill="${col}" stroke="#fff" stroke-width="${f(fs / 6)}" paint-order="stroke">${esc(fmtM(L))}</text>`);
  });
  return out.join('');
}
// texte sur plusieurs lignes, halo blanc pour rester lisible sur le fond de plan
function lines(x, y, txt, fs, col, anchor = 'middle', weight = 'bold') {
  const ls = String(txt).split('\n');
  return `<text x="${f(x)}" y="${f(y)}" font-size="${f(fs)}" text-anchor="${anchor}" font-weight="${weight}" fill="${col}" stroke="#fff" stroke-width="${f(fs / 6)}" paint-order="stroke">`
    + ls.map((l, i) => `<tspan x="${f(x)}" dy="${i ? f(fs * 1.15) : 0}">${esc(l)}</tspan>`).join('') + '</text>';
}

function iconSvg(ic, x, y, S, bg) {
  const I = { ...(ICONS[ic] || ICONS.info), ...(bg ? { col:bg } : {}) }, h = S / 2, r = S * 0.15, W = '#fff', sw = f(S * 0.09);
  if (ic === 'croix') // grosse croix seule (sans fond), à la couleur choisie ; taille avec le curseur
    return [[-1, -1, 1, 1], [-1, 1, 1, -1]].map(([a, b, c, d]) => `<line x1="${f(x + a * h)}" y1="${f(y + b * h)}" x2="${f(x + c * h)}" y2="${f(y + d * h)}" stroke="${I.col}" stroke-width="${f(S * 0.16)}" stroke-linecap="round"/>`).join('');
  let g = `<rect x="${f(x - h)}" y="${f(y - h)}" width="${f(S)}" height="${f(S)}" rx="${f(r)}" fill="${I.col}" stroke="#fff" stroke-width="${f(S * 0.04)}"/>`;
  const P = (pts) => pts.map(([a, b]) => `${f(x + a * S)},${f(y + b * S)}`).join(' ');
  const T = (t, fs = 0.42, col = W, dy = 0.15) => `<text x="${f(x)}" y="${f(y + dy * S)}" font-size="${f(fs * S)}" font-weight="bold" text-anchor="middle" fill="${col}">${t}</text>`;
  switch (ic) {
    case 'sortie': // porte + flèche
      g += `<rect x="${f(x - 0.32 * S)}" y="${f(y - 0.3 * S)}" width="${f(0.24 * S)}" height="${f(0.6 * S)}" fill="none" stroke="${W}" stroke-width="${sw}"/>`
        + `<polygon points="${P([[-0.02, -0.07], [0.18, -0.07], [0.18, -0.2], [0.38, 0], [0.18, 0.2], [0.18, 0.07], [-0.02, 0.07]])}" fill="${W}"/>`; break;
    case 'extincteur': // corps + tête
      g += `<rect x="${f(x - 0.13 * S)}" y="${f(y - 0.18 * S)}" width="${f(0.26 * S)}" height="${f(0.52 * S)}" rx="${f(0.08 * S)}" fill="${W}"/>`
        + `<polyline points="${P([[0, -0.18], [0, -0.3], [0.2, -0.3], [0.28, -0.2]])}" fill="none" stroke="${W}" stroke-width="${sw}"/>`; break;
    case 'ria': g += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.3 * S)}" fill="none" stroke="${W}" stroke-width="${sw}"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(0.1 * S)}" fill="${W}"/>`; break;
    case 'secours': g += `<polygon points="${P([[-0.1, -0.32], [0.1, -0.32], [0.1, -0.1], [0.32, -0.1], [0.32, 0.1], [0.1, 0.1], [0.1, 0.32], [-0.1, 0.32], [-0.1, 0.1], [-0.32, 0.1], [-0.32, -0.1], [-0.1, -0.1]])}" fill="${W}"/>`; break;
    case 'pmr': // fauteuil stylisé : tête, dossier-assise, roue
      g += `<circle cx="${f(x - 0.05 * S)}" cy="${f(y - 0.3 * S)}" r="${f(0.07 * S)}" fill="${W}"/>`
        + `<polyline points="${P([[-0.08, -0.18], [-0.08, 0.05], [0.18, 0.05], [0.26, 0.28]])}" fill="none" stroke="${W}" stroke-width="${sw}" stroke-linejoin="round"/>`
        + `<path d="M${f(x - 0.18 * S)} ${f(y - 0.02 * S)}A${f(0.2 * S)} ${f(0.2 * S)} 0 1 0 ${f(x + 0.12 * S)} ${f(y + 0.18 * S)}" fill="none" stroke="${W}" stroke-width="${sw}"/>`; break;
    case 'wc': g += T('WC', 0.4); break;
    case 'info': g += `<circle cx="${f(x)}" cy="${f(y - 0.24 * S)}" r="${f(0.07 * S)}" fill="${W}"/><rect x="${f(x - 0.06 * S)}" y="${f(y - 0.1 * S)}" width="${f(0.12 * S)}" height="${f(0.4 * S)}" fill="${W}"/>`; break;
    case 'regie': g += T('RÉGIE', 0.22, W, 0.08); break;
    case 'elec': g += `<polygon points="${P([[0.06, -0.36], [-0.16, 0.04], [0, 0.04], [-0.06, 0.36], [0.16, -0.06], [0, -0.06]])}" fill="#111"/>`; break;
    case 'securite': // bouclier blanc, bande « SÉCU »
      g += `<path d="M${f(x)} ${f(y - 0.36 * S)}L${f(x + 0.28 * S)} ${f(y - 0.26 * S)}L${f(x + 0.28 * S)} ${f(y + 0.02 * S)}Q${f(x + 0.28 * S)} ${f(y + 0.26 * S)} ${f(x)} ${f(y + 0.38 * S)}Q${f(x - 0.28 * S)} ${f(y + 0.26 * S)} ${f(x - 0.28 * S)} ${f(y + 0.02 * S)}L${f(x - 0.28 * S)} ${f(y - 0.26 * S)}Z" fill="${W}"/>`
        + `<text x="${f(x)}" y="${f(y + 0.07 * S)}" font-size="${f(0.15 * S)}" font-weight="bold" text-anchor="middle" fill="${I.col}">SÉCU</text>`; break;
    case 'rassemble': // quatre flèches vers le centre
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) g += `<polygon points="${P([[a * 0.36 - b * 0.1, b * 0.36 + a * 0.1], [a * 0.36 + b * 0.1, b * 0.36 - a * 0.1], [a * 0.14, b * 0.14]])}" fill="${W}"/>`;
      g += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.06 * S)}" fill="${W}"/>`; break;
  }
  return g;
}

// une annotation en SVG (chaîne), dans le repère du plan
export function annotSvg(a) {
  if (a.hidden) return ''; // cote masquée (ligne de potelets / barrières : « Afficher les cotes » décoché)
  const s = a.s || 1, col = a.col || '#d0021b', [p0, p1] = a.p;
  switch (a.t) {
    case 'text': return lines(p0[0], p0[1], a.txt || 'Texte', 0.6 * s, col);
    case 'icon': { const S = 1.2 * s; return iconSvg(a.ic, p0[0], p0[1], S, a.bg) + (a.txt ? lines(p0[0], p0[1] + S / 2 + 0.45 * s, a.txt, 0.35 * s, '#111') : ''); }
    case 'arrow': {
      const L = annotLength(a) || 1e-6, ux = (p1[0] - p0[0]) / L, uz = (p1[1] - p0[1]) / L, hl = Math.min(0.6 * s, L * 0.6), hw = 0.3 * s;
      const b = [p1[0] - ux * hl, p1[1] - uz * hl];
      return `<line x1="${f(p0[0])}" y1="${f(p0[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${col}" stroke-width="${f(0.1 * s)}" stroke-linecap="round"/>`
        + `<polygon points="${f(p1[0])},${f(p1[1])} ${f(b[0] - uz * hw)},${f(b[1] + ux * hw)} ${f(b[0] + uz * hw)},${f(b[1] - ux * hw)}" fill="${col}"/>`
        + (a.txt ? lines(p0[0] - ux * 0.3 * s, p0[1] - uz * 0.3 * s + 0.2 * s, a.txt, 0.45 * s, col, ux > 0.3 ? 'end' : ux < -0.3 ? 'start' : 'middle') : '');
    }
    case 'dim': { // cote : ligne, traits obliques aux extrémités, valeur au milieu (au-dessus de la ligne)
      const L = annotLength(a) || 1e-6, ux = (p1[0] - p0[0]) / L, uz = (p1[1] - p0[1]) / L, nx = uz, nz = -ux, t = 0.18 * s, sw = f(0.035 * s);
      const tick = p => `<line x1="${f(p[0] - (ux + nx) * t)}" y1="${f(p[1] - (uz + nz) * t)}" x2="${f(p[0] + (ux + nx) * t)}" y2="${f(p[1] + (uz + nz) * t)}" stroke="${col}" stroke-width="${f(0.06 * s)}"/>`
        + `<line x1="${f(p[0] - nx * 0.3 * s)}" y1="${f(p[1] - nz * 0.3 * s)}" x2="${f(p[0] + nx * 0.3 * s)}" y2="${f(p[1] + nz * 0.3 * s)}" stroke="${col}" stroke-width="${sw}"/>`;
      let ang = Math.atan2(uz, ux) * 180 / Math.PI; if (ang > 90) ang -= 180; if (ang <= -90) ang += 180; // texte jamais à l'envers
      const m = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2], off = ang === Math.atan2(uz, ux) * 180 / Math.PI ? 1 : -1, fs = 0.38 * s;
      const tx = m[0] + nx * 0.15 * s * off, tz = m[1] + nz * 0.15 * s * off, label = (a.txt ? a.txt + ' ' : '') + fmtM(L);
      return `<line x1="${f(p0[0])}" y1="${f(p0[1])}" x2="${f(p1[0])}" y2="${f(p1[1])}" stroke="${col}" stroke-width="${sw}"/>${tick(p0)}${tick(p1)}`
        + `<text transform="translate(${f(tx)} ${f(tz)}) rotate(${f(ang)})" font-size="${f(fs)}" text-anchor="middle" font-weight="bold" fill="${col}" stroke="#fff" stroke-width="${f(fs / 6)}" paint-order="stroke">${esc(label)}</text>`;
    }
    case 'zone': {
      const [x, z, w, h] = zoneRect(a), fs = Math.min(0.6 * s, Math.max(0.25, Math.min(w, h) / 4));
      return `<rect x="${f(x)}" y="${f(z)}" width="${f(w)}" height="${f(h)}" fill="${col}" fill-opacity="0.15" stroke="${col}" stroke-width="${f(0.06 * s)}" stroke-dasharray="${f(0.4 * s)} ${f(0.2 * s)}"/>`
        + lines(x + w / 2, z + h / 2, `${a.txt ? a.txt + '\n' : ''}${fmtArea(w * h)}`, fs, col)
        + (a.cotes ? edgeCotesSvg([[x, z], [x + w, z], [x + w, z + h], [x, z + h]], col, s) : '');
    }
  }
  return '';
}

// emprise approximative [[x0, z0], [x1, z1]] (cadrage de l'export, sélection dans l'éditeur)
export function annotBox(a) {
  const s = a.s || 1, xs = a.p.map(p => p[0]), zs = a.p.map(p => p[1]);
  let r = [[Math.min(...xs), Math.min(...zs)], [Math.max(...xs), Math.max(...zs)]];
  if (a.t === 'text') { const ls = String(a.txt || 'Texte').split('\n'), w = Math.max(...ls.map(l => l.length)) * 0.6 * s * 0.55, h = ls.length * 0.6 * s * 1.15;
    r = [[r[0][0] - w / 2, r[0][1] - 0.6 * s], [r[0][0] + w / 2, r[0][1] - 0.6 * s + h]]; }
  if (a.t === 'icon') { const h = 0.6 * s; r = [[r[0][0] - h, r[0][1] - h], [r[0][0] + h, r[0][1] + h + (a.txt ? 0.8 * s : 0)]]; }
  const pad = a.t === 'dim' || a.t === 'arrow' ? 0.4 * s : 0;
  return [[r[0][0] - pad, r[0][1] - pad], [r[1][0] + pad, r[1][1] + pad]];
}

// annotations venues d'un setup, d'un lien ou d'un fichier : types connus, points finis bornés, textes courts
const POINTS = { text:1, icon:1, arrow:2, dim:2, zone:2 };
export function cleanAnnot(list, lim = 2000) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const a of list.slice(0, ANNOT_LIMIT)) {
    if (!a || typeof a !== 'object' || !POINTS[a.t] || !Array.isArray(a.p) || a.p.length < POINTS[a.t]) continue;
    const p = a.p.slice(0, POINTS[a.t]).map(q => Array.isArray(q) && q.length >= 2 && q.slice(0, 2).every(v => v !== null && v !== '' && Number.isFinite(+v)) ? q.slice(0, 2).map(v => Math.min(lim, Math.max(-lim, +v))) : null);
    if (p.includes(null)) continue;
    const r = { id:String(a.id || Math.random().toString(36).slice(2, 10)).slice(0, 24), t:a.t, p };
    if (a.txt != null && a.txt !== '') r.txt = String(a.txt).slice(0, 200);
    r.col = /^#[0-9a-f]{6}$/i.test(a.col) ? a.col : '#d0021b';
    r.s = Number.isFinite(+a.s) && a.s !== null ? Math.min(5, Math.max(0.3, +a.s)) : 1;
    if (a.t === 'icon') { r.ic = ICONS[a.ic] ? a.ic : 'info'; if (/^#[0-9a-f]{6}$/i.test(a.bg)) r.bg = a.bg; }
    if (a.t === 'zone' && a.cotes) r.cotes = true;
    if (a.hidden) r.hidden = true; if (a.grp) r.grp = String(a.grp).slice(0, 40);
    out.push(r);
  }
  return out;
}

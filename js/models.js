// Modèles 3D du catalogue (scène, son, lumière, vidéo, sécurité, structures) et leurs données : libellés, dimensions,
// couleurs, poids. Fonctions buildXxx(dims) -> liste de meshes, origine au sol, face avant vers +z. Sans état : rien ici
// ne dépend de la scène ni de l'interface. Pour ajouter un objet : voir « Ajouter des éléments » dans le README.
import * as THREE from 'three';
import { fr, ROPE_Y, ROPE_L, ropeSag } from './calc.js';

export const COLORS = { truss30t:0xc9ced6, truss30:0xc9ced6, truss40:0xc9ced6, tcorner30:0xc9ced6, tcorner40:0xc9ced6, tower:0xc9ced6, hoist:0x3a3f47, perche:0x8a9099, pc1k:0x30343c, sx713:0x30343c, sx654:0x30343c, lyreprof:0x30343c, atomic:0x30343c, fog:0x30343c, vauban:0xb8bcc2, potelet:0xd9dde2, cordon:0xc8a96e, defender:0xf2c200, defender_c:0xf2c200, syva:0x26282c, scene_fip:0x5b4636, lyre:0x30343c, par:0x30343c, led:0x111318, crash:0x8a9099, ks28:0x26282c, ks28x2:0x26282c, l2d:0x26282c, kara2:0x26282c, x15:0x26282c, x15p:0x26282c, scene_m:0x5b4636, grill:0x8e99a6, vch30:0x2b2d31, vch30x2:0x2b2d31, vtl218:0x2b2d31, scene:0x5b4636, prat:0x6b5440, regie:0x2f5d8a, enceinte:0x222222, ecran:0xeeeeee, perso:0xf0a53a, patience:0x7a1420, polichinelle:0xf2f2f2, conque:0xb08a5a, dli230:0x111214, dli430:0x111214, as40:0x111214, at40:0x111214, xt1:0x111214, xt22:0x111214 };
export const LABELS = { truss30t:'Pont alu triangulaire 290', truss30:'Pont alu carré 290', truss40:'Pont alu carré 390', tcorner30:'Cube d\'angle 290', tcorner40:'Cube d\'angle 390', tower:'Tour ground support (290)', hoist:'Moteur de levage D8+ 500 kg (24 kg)', perche:'Perche / porteuse Ø 48', pc1k:'PC 1 kW (5 kg)', sx713:'Découpe 713 SX (13 kg)', sx654:'Découpe 654 SX (10 kg)', lyreprof:'Lyre découpe Rivale / Esprite / Ghibli (28 kg)', atomic:'Stroboscope Atomic 3000 (6 kg)', fog:'Machine à brouillard Unique 2.1 (18 kg)', vauban:'Barrière Vauban', potelet:'Potelet à corde REXO100CHC', cordon:'Cordon chanvre CI2C 2 m', defender:'Passe-câbles Defender Mini', defender_c:'Angle Defender Mini C', syva:'Syva + Syva Low sur estrade (50 kg)', scene_fip:'Scène FIP 360', lyre:'Lyre (22 kg)', par:'PAR LED (5 kg)', led:'Écran LED', crash:'Barrière crash (35 kg)', ks28:'KS28 (79 kg)', ks28x2:'KS28 ×2 (158 kg)', l2d:'L2D + bumper/bar/clamp (205 kg)', kara2:'Kara II (26 kg)', x15:'X15 HiQ (21 kg)', x15p:'X15 HiQ sur pied (21 kg)', scene_m:'Scène machiniste 11×9', grill:'Grill S500 (machiniste)', vtl218:'PIKIP VTL218 (sub)', vch30:'PIKIP VCH30', vch30x2:'PIKIP VCH30 ×2 (60°)', scene:'Scène', prat:'Praticable Samia', regie:'Régie', enceinte:'Enceinte', ecran:'Écran', perso:'Personne', patience:'Patience motorisée (rideau d\'avant-scène)', polichinelle:'Écran polichinelle 9,6 × 6 m', conque:'Décor d\'orchestre mobile (conque)', dli230:'Fohhn DLI-230 mobile (15,5 kg)', dli430:'Fohhn DLI-430 (29,3 kg)', as40:'Fohhn AS-40 sub 18" (40 kg)', at40:'Fohhn AT-40 point central (24 kg)', xt1:'Fohhn XT-1 nez de scène (7 kg)', xt22:'Fohhn XT-22 retour (13 kg)' };
export const DEFAULT = { truss30t:[3, 0.29, 0.29], tower:[1.6, 1.6, 7, 5.5], truss30:[3, 0.29, 0.29], truss40:[3, 0.39, 0.39], tcorner30:[0.29, 0.29, 0.29, 2], tcorner40:[0.39, 0.39, 0.39, 2], hoist:[0.36, 0.26, 0.55], perche:[12, 0.05, 0.05], pc1k:[0.32, 0.36, 0.45], sx713:[0.36, 0.95, 0.55], sx654:[0.33, 0.8, 0.5], lyreprof:[0.46, 0.34, 0.76], atomic:[0.5, 0.3, 0.32], fog:[0.3, 0.56, 0.3], scene:[8, 8, 1.2], led:[4, 0.1, 2.5], vauban:[2.2, 0.44, 1.1], potelet:[0.32, 0.32, 0.98], cordon:[1.6, 0.03, 0.88], defender_c:[0.3, 0.3, 0.05, 1], defender:[5 * 1.005, 0.29, 0.05], syva:[1, 1, 3.15], lyre:[0.42, 0.3, 0.62], par:[0.25, 0.25, 0.3], crash:[1, 1.1, 1.2], ks28:[1.34, 0.7, 0.55], ks28x2:[1.34, 0.7, 1.1], l2d:[0.95, 0.62, 1.55], kara2:[0.733, 0.482, 0.252], x15:[0.58, 0.43, 0.375], x15p:[0.43, 0.375, 1.88], scene_m:[11, 9, 1.2], grill:[12.06, 10.77, 0.43], vtl218:[1.3, 0.775, 0.57], vch30:[0.68, 0.51, 0.387], vch30x2:[0.79, 0.51, 0.68], prat:[2,1,1], regie:[4,3,1.1], enceinte:[0.6,0.6,1.8], ecran:[6,0.1,3.4], perso:[0.5,0.3,1.8], patience:[13.8, 0.3, 9.5, 1], polichinelle:[9.6, 0.1, 6, 1], conque:[1.46, 0.6, 4.52], dli230:[0.45, 0.45, 2.36], dli430:[0.133, 0.128, 4.316], as40:[0.506, 0.606, 0.772], at40:[0.381, 0.421, 0.591], xt1:[0.196, 0.24, 0.381], xt22:[0.323, 0.291, 0.511] };
// Enceinte PIKIP VCH30 (fiche technique) : coin trapézoïdal 680 l × 510 p, face 387 h, dos 120 h (courbure 30°), pavillon 90°×30°
export const VCH = { w:0.68, d:0.51, hf:0.387, hb:0.12 };
VCH.alpha = Math.atan((VCH.hf - VCH.hb) / 2 / VCH.d); // demi-angle du coin ≈ 14,7°
export function vch30() {
  const { w, d, hf, hb } = VCH, u = new THREE.Group();
  // caisson : profil latéral (z avant, y haut) extrudé sur la largeur
  const prof = new THREE.Shape([[-d / 2, -hb / 2], [d / 2, -hf / 2], [d / 2, hf / 2], [-d / 2, hb / 2]].map(([z, y]) => new THREE.Vector2(z, y)));
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(prof, { depth:w, bevelEnabled:false }).rotateY(-Math.PI / 2).translate(w / 2, 0, 0),
    new THREE.MeshStandardMaterial({ color:0x2b2d31 }));
  body.add(new THREE.LineSegments(new THREE.EdgesGeometry(body.geometry), new THREE.LineBasicMaterial({ color:0x000000 })));
  // face avant : bouche du pavillon (noire) + arêtes du pavillon vers la gorge
  const mw = w - 0.06, mh = hf - 0.05, tw = 0.07, th = 0.05, z = d / 2 + 0.002;
  const mouth = new THREE.Mesh(new THREE.PlaneGeometry(mw, mh), new THREE.MeshStandardMaterial({ color:0x0b0b0c }));
  mouth.position.z = z;
  const c = (x, y) => [x, y, z + 0.001], pts = [];
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) pts.push(...c(sx * mw / 2, sy * mh / 2), ...c(sx * tw / 2, sy * th / 2));
  const r = [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]];
  for (let i = 0; i < 4; i++) pts.push(...c(r[i][0] * tw / 2, r[i][1] * th / 2), ...c(r[i + 1][0] * tw / 2, r[i + 1][1] * th / 2));
  const horn = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)), new THREE.LineBasicMaterial({ color:0x8a8f99 }));
  u.add(body, mouth, horn);
  return u;
}
// une enceinte, à plat (90° horizontal × 30° vertical, comme sur la fiche)
export function buildVch30() { const u = vch30(); u.position.y = VCH.hf / 2; return [u]; }
// deux enceintes côte à côte, tournées de 90° (pavillons verticaux) et ouvertes en éventail de 2×30° = 60°, plaque d'accroche dessus
export function buildVch30x2() {
  const { w, d, hf, alpha } = VCH, out = [];
  const shift = (hf / 2) * Math.cos(alpha) - (d / 2) * Math.sin(alpha); // face intérieure ramenée sur le plan x = 0
  for (const s of [-1, 1]) {
    const u = vch30(); u.rotation.order = 'YXZ'; u.rotation.set(0, s * alpha, Math.PI / 2);
    u.position.set(s * shift, w / 2, 0); out.push(u);
  }
  const plate = new THREE.Mesh(new THREE.BoxGeometry(2 * hf, 0.012, d * 0.8), new THREE.MeshStandardMaterial({ color:0x9aa0a8, metalness:0.6 }));
  plate.position.y = w + 0.006; out.push(plate);
  return out;
}
// Subwoofer PIKIP VTL218 (fiche technique) : 1300 l × 775 p × 570 h ; façade = joue 246 / grille 250 / évent 312 / grille 250 / joue 246 mm
export function buildVtl218() {
  const W = 1.3, D = 0.775, H = 0.57, F = 0.012, g = new THREE.Group(), y0 = F + H / 2, zf = D / 2 + 0.002;
  const box = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), new THREE.MeshStandardMaterial({ color:0x2b2d31 }));
  box.position.y = y0; box.add(new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), new THREE.LineBasicMaterial({ color:0x000000 })));
  g.add(box);
  const plane = (w, h, x, color) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color })); m.position.set(x, y0, zf); g.add(m); };
  plane(0.25, H - 0.03, -0.281, 0x3c3f45); plane(0.25, H - 0.03, 0.281, 0x3c3f45); // grilles acier
  plane(0.312, H - 0.03, 0, 0x08080a); // évent central
  for (const dy of [-H / 6, H / 6]) { // 2 étagères de l'évent
    const sh = new THREE.Mesh(new THREE.BoxGeometry(0.312, 0.015, 0.05), new THREE.MeshStandardMaterial({ color:0x2b2d31 })); sh.position.set(0, y0 + dy, zf - 0.02); g.add(sh);
  }
  for (const x of [-0.56, 0.56]) for (const z of [-0.3, 0.3]) { // pieds
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.12, F, 0.06), new THREE.MeshStandardMaterial({ color:0x111111 })); f.position.set(x, F / 2, z); g.add(f);
  }
  for (const x of [-0.2618, 0.2618]) { // embases de mât sur le dessus (entraxe 523,6 mm)
    const e = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.004, 24), new THREE.MeshStandardMaterial({ color:0x9aa0a8, metalness:0.6 })); e.position.set(x, F + H + 0.002, 0); g.add(e);
  }
  return [g];
}
// poutre triangulaire S500 (côté 0,5 m) entre deux points du plan local, membrures + diagonales
export function truss(a, b) {
  const g = new THREE.Group(), L = Math.hypot(b[0] - a[0], b[1] - a[1]), S = 0.5, H = S * Math.sqrt(3) / 2;
  const mat = new THREE.MeshStandardMaterial({ color:0xc9ced6, metalness:0.7, roughness:0.35 });
  for (const [ox, oy] of [[-S / 2, 0], [S / 2, 0], [0, H]]) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, L, 8), mat); c.rotation.z = Math.PI / 2; c.position.set(0, oy, ox); g.add(c);
  }
  const p = [], n = Math.max(1, Math.round(L / 0.5)), corners = [[-S / 2, 0], [S / 2, 0], [0, H]];
  for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) {
    const [z1, y1] = corners[k], [z2, y2] = corners[(k + 1) % 3], x1 = -L / 2 + i * L / n, x2 = x1 + L / n;
    p.push(x1, y1, z1, x2, y2, z2);
  }
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(p, 3)), new THREE.LineBasicMaterial({ color:0x9aa0a8 })));
  g.position.set((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2); g.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
  return g;
}
// --- L-Acoustics (concert 05/12) : caissons simplifiés, origine au sol, face avant = +z local ---
export function cab(W, H, D, y = 0) {
  const g = new THREE.Group(), m = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), new THREE.MeshStandardMaterial({ color:0x26282c }));
  m.position.y = y + H / 2; m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color:0x000000 })));
  const grille = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.04, H - 0.04), new THREE.MeshStandardMaterial({ color:0x0b0b0c }));
  grille.position.set(0, y + H / 2, D / 2 + 0.002); g.add(m, grille); return g;
}
export const metal = (w, h, d, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color:0x9aa0a8, metalness:0.6 })); m.position.y = y + h / 2; return m; };
// KS28 posé à plat : 1340 l × 550 h × 700 p
export const buildKs28 = () => [cab(1.34, 0.55, 0.7)];
export const buildKs28x2 = () => [cab(1.34, 0.55, 0.7), cab(1.34, 0.55, 0.7, 0.55)];
// L2D 850 l × 1252 h × 559 p, au-dessus : L2 BUMP, L2 BAR, Clamp 1000 (volumes indicatifs) ; haut du clamp = point d'accroche (1,55 m)
export const buildL2d = () => [cab(0.85, 1.252, 0.559), metal(0.95, 0.06, 0.62, 1.252), metal(1.0, 0.06, 0.08, 1.37), metal(0.1, 0.12, 0.1, 1.43)];
// Kara II posée : 733 l × 252 h × 482 p
export const buildKara2 = () => [cab(0.733, 0.252, 0.482)];
// X15 HiQ en retour au sol : coin 580 l × 430 p × 375 h, face inclinée vers le haut
export function buildX15() {
  const prof = new THREE.Shape([[-0.215, 0], [0.215, 0], [-0.05, 0.375], [-0.215, 0.375]].map(([z, y]) => new THREE.Vector2(z, y)));
  const m = new THREE.Mesh(new THREE.ExtrudeGeometry(prof, { depth:0.58, bevelEnabled:false }).rotateY(-Math.PI / 2).translate(0.29, 0, 0), new THREE.MeshStandardMaterial({ color:0x26282c }));
  m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color:0x000000 }))); return [m];
}
// X15 HiQ debout sur pied (haut à 1,88 m)
export function buildX15p() {
  const mat = new THREE.MeshStandardMaterial({ color:0x111111 }), pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.3, 8), mat); pole.position.y = 0.65;
  const out = [pole, cab(0.43, 0.58, 0.375, 1.3)];
  for (let i = 0; i < 3; i++) { const a = i * 2 * Math.PI / 3, leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.65, 6), mat);
    leg.position.set(Math.sin(a) * 0.25, 0.22, Math.cos(a) * 0.25); leg.rotation.set(Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9); out.push(leg); }
  return out;
}
export const WEIGHT = { dli230:15.5, dli430:29.3, as40:40, at40:24, xt1:7, xt22:13, tower:115, hoist:24, tcorner30:6, tcorner40:9, pc1k:5, sx713:13, sx654:10, lyreprof:28, atomic:6, fog:18, vauban:16, potelet:6.75, cordon:0.95, syva:50, ks28:79, ks28x2:158, l2d:205, kara2:26, x15:21, x15p:21, lyre:22, par:5, crash:35, prat:30 };
// écran LED : dalles de 50 × 50 cm, ~8 kg et ~150 W en moyenne chacune (ordre de grandeur, selon le modèle loué)
export const dalles = o => Math.round(o.userData.dims[0] / 0.5) * Math.round(o.userData.dims[2] / 0.5);
export const MOD = 1.005, modules = o => Math.max(1, Math.round(o.userData.dims[0] / MOD)); // passe-câbles Defender Mini : modules de 1 005 mm, 6 kg
export const flipped = q => Math.abs(q.rotation.z) > 1.5 || Math.abs(q.rotation.x) > 1.5; // projecteur accroché tête en bas : la platine (origine) est en haut
export const topOf = q => flipped(q) ? q.position.y : q.position.y + (q.userData.dims[2] || 0), bottomOf = q => flipped(q) ? q.position.y - (q.userData.dims[2] || 0) : q.position.y;
export const weightOf = o => o.userData.asd ? +o.userData.asd.kg || 0 : TRUSS[o.userData.kind] ? o.userData.dims[0] * TRUSS[o.userData.kind].kgm : o.userData.kind === 'perche' ? o.userData.dims[0] * 3.6 + (+o.userData.dims[7] || 0) : o.userData.kind === 'led' ? dalles(o) * 8 : o.userData.kind === 'defender' ? modules(o) * 6 : o.userData.kind === 'defender_c' ? 3 : WEIGHT[o.userData.kind] || 0; // angle C : ≈ 3 kg (non précisé)
// --- catalogue lumière / vidéo / sécurité (volumes indicatifs, face avant = +z) ---
export const dark = c => new THREE.MeshStandardMaterial({ color:c });
export function buildLyre() { // socle, lyre et tête
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.3), dark(0x30343c)); base.position.y = 0.07;
  const out = [base];
  for (const x of [-0.17, 0.17]) { const a = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.34, 0.12), dark(0x30343c)); a.position.set(x, 0.31, 0); out.push(a); }
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.34, 20).rotateX(Math.PI / 2), dark(0x22252b)); head.position.set(0, 0.42, 0.02);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.11, 20), new THREE.MeshBasicMaterial({ color:0xfff3c4 })); lens.position.set(0, 0.42, 0.195);
  return [...out, head, lens];
}
export function buildPar() {
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25, 20).rotateX(Math.PI / 2), dark(0x30343c)); body.position.y = 0.17;
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.1, 20), new THREE.MeshBasicMaterial({ color:0xfff3c4 })); lens.position.set(0, 0.17, 0.127);
  const lyre = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.06), dark(0x111111)); lyre.position.y = 0.015;
  return [body, lens, lyre];
}
export function buildLed(dims) { // écran en dalles de 50 cm (largeur dims[0], hauteur dims[2]), posé au sol
  const [w, , h] = dims, g = new THREE.Group(), m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), dark(0x111318)); m.position.y = h / 2;
  const p = [];
  for (let x = -w / 2; x <= w / 2 + 1e-6; x += 0.5) p.push(x, 0, 0.052, x, h, 0.052);
  for (let y = 0; y <= h + 1e-6; y += 0.5) p.push(-w / 2, y, 0.052, w / 2, y, 0.052);
  g.add(m, new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(p, 3)), new THREE.LineBasicMaterial({ color:0x3a6ea5 })));
  return [g];
}
export function buildCrash() { // barrière crash type Mojo : semelle côté public (+z), paroi de 1,2 m, jambes de force côté scène
  const mat = new THREE.MeshStandardMaterial({ color:0x8a9099, metalness:0.5 }), base = new THREE.Mesh(new THREE.BoxGeometry(1, 0.03, 1.1), mat); base.position.y = 0.015;
  const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.04), mat); wall.position.set(0, 0.6, -0.1);
  const out = [base, wall];
  for (const x of [-0.45, 0.45]) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.75), mat); s.position.set(x, 0.6, -0.4); s.rotation.x = -0.9; out.push(s); }
  return out;
}
// --- FIP 360 (fiche technique Radio France) : colonne Syva + Syva Low sur estrade 1 × 1 × 1 m, face avant = +z ---
// Syva 144 l × 209 p × 1301 h mm (21 kg), Syva Low 350 l × 334 p × 849 h mm (29 kg) : 2,128 m + 1 m d'estrade
export function buildSyva() {
  const out = [], leg = dark(0x111111);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(1, 0.05, 1), dark(0x6b5440)); plate.position.y = 0.975; out.push(plate);
  for (const x of [-0.45, 0.45]) for (const z of [-0.45, 0.45]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.95, 0.05), leg); l.position.set(x, 0.475, z); out.push(l); }
  const low = cab(0.35, 0.849, 0.334, 1), col = cab(0.144, 1.301, 0.209, 1.849);
  return [...out, low, col];
}
// passe-câbles Defender Mini (manuel du fabricant) : profil 290 × 50 mm, rampes noires, couvercle jaune, 3 canaux ; modules de 1 005 mm le long de x
export function buildDefender(dims) {
  const L = dims[0], n = Math.round(L / MOD), g = new THREE.Group();
  const prof = new THREE.Shape([[-0.145, 0], [0.145, 0], [0.145, 0.008], [0.075, 0.045], [-0.075, 0.045], [-0.145, 0.008]].map(([z, y]) => new THREE.Vector2(z, y)));
  const ramp = new THREE.Mesh(new THREE.ExtrudeGeometry(prof, { depth:L, bevelEnabled:false }).rotateY(Math.PI / 2).translate(-L / 2, 0, 0), dark(0x161616));
  const lid = new THREE.Mesh(new THREE.BoxGeometry(L, 0.006, 0.15), new THREE.MeshStandardMaterial({ color:0xf2c200 })); lid.position.y = 0.047;
  const p = []; for (let i = 1; i < n; i++) { const x = -L / 2 + i * MOD; p.push(x, 0.051, -0.145, x, 0.051, 0.145); } // joints entre modules
  g.add(ramp, lid, new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(p, 3)), new THREE.LineBasicMaterial({ color:0x000000 })));
  return [g];
}
// pièce d'angle Defender Mini C (gauche / droite) : secteur de 30°, 290 mm de large, rayon intérieur ≈ 0,20 m (estimés d'après la photo du manuel)
// origine au milieu de la pièce sur l'axe de la ligne, rayon de virage dirigé vers +x local
export const C_DEG = 30, C_RI = 0.2, C_RO = 0.49, C_RM = (C_RI + C_RO) / 2;
export function sector(r0, r1, h, color, y = 0) {
  const t = THREE.MathUtils.degToRad(C_DEG / 2), sh = new THREE.Shape();
  sh.absarc(0, 0, r1, -t, t, false); sh.lineTo(r0 * Math.cos(t), r0 * Math.sin(t)); sh.absarc(0, 0, r0, t, -t, true);
  const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth:h, bevelEnabled:false, curveSegments:6 }).rotateX(-Math.PI / 2).translate(-C_RM, y, 0), new THREE.MeshStandardMaterial({ color }));
  return m;
}
export const buildDefenderC = () => [sector(C_RI, C_RO, 0.045, 0x161616), sector(C_RM - 0.075, C_RM + 0.075, 0.006, 0xf2c200, 0.045)];
// barrière Vauban à pieds fixes (fiche HERMEQ MB0033) : cadre Ø 38,1 × 2 175 × 900 mm à 200 mm du sol (1,10 m en tout),
// 14 barreaux Ø 12 × 820, 2 pieds en V (2 × 275 mm à 135°, empattement 437 mm), crochets mâles d'un côté ; pas d'accroche ≈ 2,20 m
export const VAUBAN_PITCH = 2.2;
// potelet à corde VISO REXO100CHC (fiche du 06/03/2023) : inox chromé, base lestée Ø 320 × 50 mm, fût Ø 50 mm, 980 mm en tout, tête cylindrique, 6,75 kg
// cordon VISO CI2C : chanvre torsadé Ø 28 mm, 2 m, mousquetons chromés, 0,95 kg ; accroché sous la tête (≈ 0,90 m)
export const POT_H = 0.98; // ROPE_Y, ROPE_L, ropeSag : js/calc.js
export const chrome = () => new THREE.MeshStandardMaterial({ color:0xe2e6ec, metalness:0.55, roughness:0.28 }); // sans carte d'environnement, un vrai chrome (métal ≈ 1) rendrait noir
export function buildPotelet() {
  const m = chrome(), cyl = (r0, r1, h, y, mat = m, seg = 24) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), mat); o.position.y = y + h / 2; return o; };
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.005, 6, 16).rotateX(Math.PI / 2), m); ring.position.y = ROPE_Y;
  return [cyl(0.158, 0.16, 0.008, 0, new THREE.MeshStandardMaterial({ color:0x1a1a1a, roughness:0.9 })), // caoutchouc
    cyl(0.14, 0.16, 0.042, 0.008), cyl(0.025, 0.025, POT_H - 0.05 - 0.06, 0.05, m, 16), cyl(0.03, 0.03, 0.06, POT_H - 0.06), ring];
}
export function buildCordon(dims) { // dims[0] = écart axe à axe des 2 potelets ; origine au milieu, cordon le long de x
  const S = dims[0], s = Math.max(0.05, S - 0.06), f = ropeSag(S), pts = [];
  for (let i = 0; i <= 24; i++) { const x = -s / 2 + s * i / 24, u = 2 * x / s; pts.push(new THREE.Vector3(x, ROPE_Y - f * (1 - u * u), 0)); }
  const rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.014, 8, false), new THREE.MeshStandardMaterial({ color:0xc8a96e, roughness:0.95 }));
  const hooks = [-1, 1].map(k => { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.06, 10).rotateZ(Math.PI / 2), chrome()); h.position.set(k * (s / 2 - 0.02), ROPE_Y - 0.01, 0); return h; });
  return [rope, ...hooks];
}
export function buildVauban() {
  const steel = new THREE.MeshStandardMaterial({ color:0xb8bcc2, metalness:0.6, roughness:0.4 }), W = 2.175, y0 = 0.2, H = 0.9, R = 0.12, out = [];
  const path = new THREE.CurvePath(), v = (x, y) => new THREE.Vector3(x, y, 0), corner = (cx, cy, a0) => path.add(new THREE.CatmullRomCurve3(new THREE.EllipseCurve(cx, cy, R, R, a0, a0 + Math.PI / 2, false).getPoints(6).map(p => v(p.x, p.y)))); // coins arrondis
  const x0 = -W / 2, x1 = W / 2, y1 = y0 + H;
  path.add(new THREE.LineCurve3(v(x0 + R, y0), v(x1 - R, y0))); corner(x1 - R, y0 + R, -Math.PI / 2);
  path.add(new THREE.LineCurve3(v(x1, y0 + R), v(x1, y1 - R))); corner(x1 - R, y1 - R, 0);
  path.add(new THREE.LineCurve3(v(x1 - R, y1), v(x0 + R, y1))); corner(x0 + R, y1 - R, Math.PI / 2);
  path.add(new THREE.LineCurve3(v(x0, y1 - R), v(x0, y0 + R))); corner(x0 + R, y0 + R, Math.PI);
  out.push(new THREE.Mesh(new THREE.TubeGeometry(path, 120, 0.019, 8, true), steel));
  for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.82, 6), steel); b.position.set(-0.86 + i * 1.72 / 13, y0 + H / 2, 0); out.push(b); }
  for (const x of [-0.78, 0.78]) for (const s of [-1, 1]) { // pieds en V
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.275, 8), steel); l.position.set(x, y0 - 0.097, s * 0.097); l.rotation.x = -s * Math.PI / 4; out.push(l); }
  for (const y of [0.45, 0.95]) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 6, 12, Math.PI), steel); h.position.set(W / 2 + 0.03, y, 0); h.rotation.z = -Math.PI / 2; out.push(h); } // crochets
  return out;
}
// --- liste lumière Gaspar Claus (Auditorium) : volumes indicatifs d'après les proportions habituelles des appareils (face avant = +z) ---
// poids / puissances : ordres de grandeur à confirmer avec le loueur
export const lens = (r, z, y) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 24), new THREE.MeshBasicMaterial({ color:0xfff3c4 })); m.position.set(0, y, z); return m; };
export const tube = (r0, r1, len, y, z, c = 0x2a2d33) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 24).rotateX(Math.PI / 2), dark(c)); m.position.set(0, y, z); return m; };
export function yoke(w, y, base = 0.03) { // lyre en U + platine au sol
  const out = [], plate = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6, base, 0.12), dark(0x111111)); plate.position.y = base / 2; out.push(plate);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.025, 0.04), dark(0x111111)); bar.position.y = base + 0.03; out.push(bar);
  for (const x of [-w / 2 - 0.01, w / 2 + 0.01]) { const a = new THREE.Mesh(new THREE.BoxGeometry(0.02, y - base - 0.03, 0.04), dark(0x111111)); a.position.set(x, (y + base + 0.03) / 2, 0); out.push(a); }
  return out;
}
// PC 1 kW : corps cylindrique, lentille, volets coupe-flux
export function buildPC() {
  const y = 0.27, out = [...yoke(0.26, y), tube(0.13, 0.13, 0.3, y, 0), lens(0.1, 0.152, y)];
  for (const [x, yy, w, h] of [[0, y + 0.135, 0.26, 0.002], [0, y - 0.135, 0.26, 0.002], [0.135, y, 0.002, 0.26], [-0.135, y, 0.002, 0.26]]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w || 0.002, h || 0.002, 0.12), dark(0x111111)); f.position.set(x, yy, 0.21); out.push(f); }
  return out;
}
// découpe Robert Juliat SX : boîte à lampe arrière + tube de zoom ; L = longueur totale
export function buildDecoupe(L, r) {
  const y = 0.3, house = new THREE.Mesh(new THREE.BoxGeometry(r * 2.2, r * 2.4, L * 0.32), dark(0x30343c)); house.position.set(0, y, -L / 2 + L * 0.16);
  return [...yoke(r * 2.2, y), house, tube(r, r * 0.9, L * 0.68, y, L * 0.16), lens(r * 0.8, L / 2 + 0.002, y)];
}
export const buildSX713 = () => buildDecoupe(0.95, 0.15), buildSX654 = () => buildDecoupe(0.8, 0.13);
// lyre à découpe LED (Rivale Profile / Esprite / Ghibli) : socle, lyre, tête longue
export function buildLyreProf() {
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.18, 0.34), dark(0x30343c)); base.position.y = 0.09;
  const out = [base];
  for (const x of [-0.2, 0.2]) { const a = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.16), dark(0x30343c)); a.position.set(x, 0.39, 0); out.push(a); }
  return [...out, tube(0.15, 0.13, 0.5, 0.5, 0.03, 0x22252b), lens(0.11, 0.282, 0.5)];
}
// stroboscope Atomic 3000 : caisson large, fenêtre blanche, étrier
export function buildAtomic() {
  const y = 0.18, b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.26), dark(0x30343c)); b.position.y = y;
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.15), new THREE.MeshBasicMaterial({ color:0xf4f6ff })); win.position.set(0, y, 0.131);
  return [...yoke(0.5, y), b, win];
}
// machine à brouillard Unique 2.1 : caisson, buse en façade
export function buildFog() {
  const b = cab(0.3, 0.3, 0.5, 0.0); b.children[1].material = dark(0x30343c);
  const nozzle = tube(0.035, 0.035, 0.08, 0.2, 0.29, 0x111111);
  return [b, nozzle];
}
// --- structures et levage (recherche : Prolyte H30V / Global Truss F34 = carré 290 mm, membrures Ø 48–50 ; H40V / F44 = 390 mm ;
// ≈ 6 kg/m en 290, ≈ 7,5 kg/m en 390 ; longueurs standard 0,5 à 3 m ; tours type Prolyte MPT ; moteurs D8+ 500 kg ≈ 24 kg sans chaîne) ---
export const TRUSS = { truss30:{ S:0.29, kgm:6, corner:'tcorner30' }, truss40:{ S:0.39, kgm:7.5, corner:'tcorner40' }, truss30t:{ S:0.29, kgm:4.5, corner:'tcorner30', tri:true } }; // triangle 290 type Prolyte X30D / Global Truss F33
export const RIG_SELF = new Set(['truss30t', 'truss30', 'truss40', 'tcorner30', 'tcorner40', 'hoist', 'perche', 'tower']);
export const TRUSS_LEN = [3, 2.5, 2, 1.5, 1, 0.5];
export function trussParts(L) { const out = []; let r = Math.round(L * 2) / 2; for (const l of TRUSS_LEN) while (r >= l - 1e-6) { out.push(l); r -= l; } return out; }
export function trussPartsTxt(L) { if (Math.abs(L * 2 - Math.round(L * 2)) > 0.02) return 'longueur non standard'; const c = {}; trussParts(L).forEach(l => c[l] = (c[l] || 0) + 1); return Object.entries(c).sort((a, b) => b[0] - a[0]).map(([l, n]) => `${n} × ${fr(+l, 1)} m`).join(' + '); }
export const alu = new THREE.MeshStandardMaterial({ color:0xc9ced6, metalness:0.7, roughness:0.35 }), aluLine = new THREE.LineBasicMaterial({ color:0x9aa0a8 });
// pont carré le long de x, de section S, dessous à y = 0 : 4 membrures + diagonales en zigzag sur les 4 faces, joints tous les standards
export function trussMesh(L, S, axis = 'x', tri = false) { // tri : section triangulaire, pointe en haut
  const g = new THREE.Group(), r = 0.024, h = S - 2 * r, p = [];
  for (const [y, z] of tri ? [[r, -h / 2], [r, h / 2], [S - r, 0]] : [[r, -h / 2], [r, h / 2], [S - r, -h / 2], [S - r, h / 2]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 8).rotateZ(Math.PI / 2), alu); c.position.set(0, y, z); g.add(c); }
  const n = Math.max(1, Math.round(L / h)), dx = L / n, faces = tri ? [[[r, -h / 2], [r, h / 2]], [[r, -h / 2], [S - r, 0]], [[r, h / 2], [S - r, 0]]] : [[[r, -h / 2], [r, h / 2]], [[S - r, -h / 2], [S - r, h / 2]], [[r, -h / 2], [S - r, -h / 2]], [[r, h / 2], [S - r, h / 2]]];
  for (const [[y0, z0], [y1, z1]] of faces) for (let i = 0; i < n; i++) { const x = -L / 2 + i * dx; p.push(x, y0, z0, x + dx, y1, z1, x, y0, z0, x, y1, z1); }
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(p, 3)), aluLine));
  if (axis === 'y') { g.rotation.z = Math.PI / 2; g.position.set(S / 2, L / 2, 0); } // vertical (tours) : pied à y = 0
  return g;
}
export const buildTruss30t = dims => [trussMesh(dims[0], 0.29, 'x', true)], buildTruss30 = dims => [trussMesh(dims[0], 0.29)], buildTruss40 = dims => [trussMesh(dims[0], 0.39)];
// cube d'angle (box corner) : 12 arêtes
export function buildCorner(S) {
  const g = new THREE.Group(), r = 0.024, h = S - 2 * r;
  for (const a of ['x', 'y', 'z']) for (const u of [-h / 2, h / 2]) for (const v of [-h / 2, h / 2]) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, S, 8), alu);
    if (a === 'x') { c.rotation.z = Math.PI / 2; c.position.set(0, S / 2 + u, v); } else if (a === 'z') { c.rotation.x = Math.PI / 2; c.position.set(u, S / 2 + v, 0); } else c.position.set(u, S / 2, v);
    g.add(c); }
  return [g];
}
// tour ground support : embase avec 4 stabilisateurs, mât en pont 290, manchon (sleeve block) en tête
export function buildTower(dims) {
  const H = dims[2], out = [], steel = new THREE.MeshStandardMaterial({ color:0x6b7078, metalness:0.6 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.6), steel); base.position.y = 0.03; out.push(base);
  for (const a of [0, 1, 2, 3]) { const o = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.08), steel); o.rotation.y = a * Math.PI / 2 + Math.PI / 4; o.position.set(Math.cos(a * Math.PI / 2 + Math.PI / 4) * 0.4, 0.03, -Math.sin(a * Math.PI / 2 + Math.PI / 4) * 0.4); out.push(o); }
  const mast = trussMesh(H - 0.06, 0.29, 'y'); mast.position.set(0.145, 0.06 + (H - 0.06) / 2, 0); out.push(mast);
  const sy = dims[3] ?? H - 1.2, sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.42), steel); sleeve.position.y = sy + 0.145; out.push(sleeve); // dims[3] : dessous du cadre
  const motor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 0.26), dark(0x3a3f47)); motor.position.set(0, H + 0.12, 0.3); out.push(motor); // moteur en tête (top section)
  out.push(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0.05, H + 0.02, 0.3, 0.05, sy + 0.37, 0.25], 3)), new THREE.LineBasicMaterial({ color:0x222222 })));
  return out;
}
// moteur de levage à chaîne (D8+ 500 kg) : corps, crochet, chaîne qui monte vers la charpente (3 m indicatifs)
export function buildHoist() {
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 0.26), dark(0x3a3f47)); body.position.y = 0.32;
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.01, 6, 12), dark(0x111111)); hook.position.y = 0.06;
  const chain = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0.1, 0, 0, 0.22, 0, 0.05, 0.42, 0, 0.05, 3.4, 0], 3)), new THREE.LineBasicMaterial({ color:0x222222 })); chain.userData.chain = true;
  return [body, hook, chain];
}
// perche / porteuse : tube acier Ø 48,3 le long de x (≈ 3,6 kg/m)
export function buildPerche(dims) { // tube + élingues tous les ≈ 3 m vers le gril (longueur mise à jour par syncChains)
  const L = dims[0], m = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, L, 10).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color:0x8a9099, metalness:0.6 })); m.position.y = 0.024;
  const k = Math.max(2, Math.round(L / 3) + 1), p = []; for (let i = 0; i < k; i++) { const x = -L / 2 + 0.3 + i * (L - 0.6) / (k - 1); p.push(x, 0.05, 0, x, 3, 0); }
  const c = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(p, 3)), new THREE.LineBasicMaterial({ color:0x333333 })); c.userData.chain = true;
  return [m, c];
}
// patience motorisée d'avant-scène (plan TAMBE 0615) : rail Trumpf + 2 rideaux de velours massés de chaque côté (ouverte)
export function buildPatience([L, d, H, ouv = 1]) { // ouv : 1 = ouverte (massée), 0 = fermée
  const rail = new THREE.Mesh(new THREE.BoxGeometry(L, 0.08, 0.1), dark(0x222222)); rail.position.y = H + 0.04;
  const vel = new THREE.MeshStandardMaterial({ color:0x7a1420, roughness:0.95 }), out = [rail], Wc = L / 2 + 0.5; // fermée : chaque rideau couvre la moitié + 0,5 m de recouvrement
  for (const sx of [-1, 1]) { const half = new THREE.Group(); half.position.x = sx * L / 2; half.userData.half = Wc; half.scale.x = (1.43 + (Wc - 1.43) * (1 - ouv)) / Wc;
    const fond = new THREE.Mesh(new THREE.PlaneGeometry(Wc, H).translate(-sx * Wc / 2, H / 2, -0.02), new THREE.MeshStandardMaterial({ color:0x5e0f18, roughness:1, side:THREE.DoubleSide })); half.add(fond); // fond opaque derrière les plis
    for (let i = 0, n = Math.round(Wc / 0.2); i < n; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, H, 8, 1, false, 0, Math.PI), vel); p.position.set(-sx * (0.1 + i * Wc / n), H / 2, 0); half.add(p); }
    out.push(half); }
  return out;
}
// polichinelle (écran de projection, plan TAMBE 0610) : enrouleur à 9,5 m, toile 9,6 m (bordure noire 1,5 m + image 6 m, de 8 à 2 m) ; desc : 1 = descendue, 0 = enroulée
export function buildPolichinelle([W, d, H, desc = 1]) {
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, W + 0.3, 16).rotateZ(Math.PI / 2), dark(0x1b1c1f)); roll.position.y = 9.5;
  const toile = new THREE.Group(); toile.position.y = 9.5; toile.userData.toile = true;
  const bord = new THREE.Mesh(new THREE.PlaneGeometry(W, 1.5).translate(0, -0.75, 0), new THREE.MeshStandardMaterial({ color:0x111111, side:THREE.DoubleSide }));
  const img = new THREE.Mesh(new THREE.PlaneGeometry(W, H).translate(0, -1.5 - H / 2, 0), new THREE.MeshStandardMaterial({ color:0xf2f2f2, side:THREE.DoubleSide }));
  toile.add(bord, img); toile.scale.y = Math.max(0.01, desc);
  return [roll, toile];
}
// décor d'orchestre mobile (plans TAMBE 0614 / 1614) : panneau frêne 1,46 × 4,52 m sur structure alu + bracons
export function buildConque([w, d, h]) {
  const pan = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), new THREE.MeshStandardMaterial({ color:0xb08a5a, roughness:0.7 })); pan.position.set(0, h / 2, 0.1);
  const out = [pan], alu = dark(0x111111);
  for (const x of [-w / 2 + 0.1, w / 2 - 0.1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.04, h * 0.95, 0.04), alu); b.position.set(x, h * 0.47, 0.05);
    const br = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, Math.hypot(d, h * 0.4)), alu); br.position.set(x, h * 0.2, -d / 2 + 0.1); br.rotation.x = -Math.atan2(h * 0.4, d); out.push(b, br); }
  return out;
}
// colonnes Fohhn Linea Focus (line source à faisceau orientable) : DLI-230 133 × 2 308 × 128 mm (16 × 4", 15,5 kg), DLI-430 133 × 4 316 × 128 mm (32 × 4", 29,3 kg)
export function buildColonne(H, base) {
  const y0 = base ? 0.06 : 0, body = new THREE.Mesh(new THREE.BoxGeometry(0.133, H, 0.128), dark(0x111214)); body.position.y = y0 + H / 2;
  const grille = new THREE.Mesh(new THREE.PlaneGeometry(0.115, H - 0.04), new THREE.MeshStandardMaterial({ color:0x2a2c30, roughness:0.9 })); grille.position.set(0, y0 + H / 2, 0.0645);
  const out = [body, grille];
  if (base) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.04, 0.45), dark(0x1a1a1a)); p.position.y = 0.02; out.push(p); } // version mobile : platine au sol
  return out;
}
// enceintes Fohhn passives (amplis dans la baie son), cotes des fiches fohhn.com (L × H × P) : AS-40 506 × 772 × 606, AT-40 381 × 591 × 421, XT-1 196 × 381 × 240, XT-22 323 × 511 × 291
export function buildHP([w, d, h], wedge) {
  const g = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), dark(0x111214));
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, h * 0.9), new THREE.MeshStandardMaterial({ color:0x2a2c30, roughness:0.9 })); gr.position.z = d / 2 + 0.002;
  g.add(body, gr); g.position.y = h / 2;
  if (wedge) { const a = Math.PI / 2 - 55 * Math.PI / 180; g.rotation.x = -a; g.position.y = (h * Math.cos(a) + d * Math.sin(a)) / 2; } // retour : position moniteur à 55°
  return [g];
}
// axe de l'Agora : à mi-distance des 2 rangées de piliers de la charpente métallique historique (IFC « CharpenteMétalliqueIsolee »,
// pieds relevés au sol) : côté mezzanine sur le marquage jaune du DXF z = −9,52, côté verrière z = +15,20 ; piliers face à face tous les 10 m
export const PIL_MEZZ_Z = -9.52, PIL_VERR_Z = 15.20, AXE_AGORA = (PIL_MEZZ_Z + PIL_VERR_Z) / 2;

// Tests de la restauration (mobilier, zones remplies automatiquement) : `npm test`
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RESTO_MODS, fillZone, restoStats, restoBom, polyArea, polyCentroid, pointInPoly, quadInPoly, itemsBox, itemCorners, cleanResto, moveItems, furnitureSvg, zoneSvg } from '../js/resto.js';
import { readFileSync } from 'node:fs';

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);
const rect = (w, d) => [[0, 0], [w, 0], [w, d], [0, d]];

test('restauration : modules (places, emprise)', () => {
  const places = k => restoStats(RESTO_MODS[k].items, []).places;
  assert.deepEqual(['r_t2', 'r_t4', 'r_h8', 'r_r4', 'r_md', 'r_tc', 'r_tr', 'r_ch'].map(places), [2, 4, 8, 4, 0, 0, 0, 1]);
  const [[x0, z0], [x1, z1]] = itemsBox(RESTO_MODS.r_t2.items);
  near(x1 - x0, 0.9 + 2 * 0.45, 1e-9); near(z1 - z0, 0.7, 1e-9); // chaises collées aux bouts de la table
});
test('restauration : polygones (surface, centre, point dedans, rectangle dedans)', () => {
  const L = [[0, 0], [10, 0], [10, 4], [4, 4], [4, 10], [0, 10]]; // L : 10 × 10 moins 6 × 6
  near(polyArea(L), 64); assert.ok(pointInPoly([2, 8], L)); assert.ok(!pointInPoly([8, 8], L));
  assert.ok(quadInPoly([[1, 1], [3, 1], [3, 3], [1, 3]], L));
  assert.ok(!quadInPoly([[3, 3], [6, 3], [6, 6], [3, 6]], L)); // coins dedans/dehors
  assert.ok(!quadInPoly([[-1, 3.5], [11, 3.5], [11, 4.5], [-1, 4.5]], L));
  const c = polyCentroid(rect(4, 2)); near(c[0], 2); near(c[1], 1);
});
test('restauration : remplissage d\'une zone (dans le polygone, allées respectées, rangées tournées)', () => {
  const Z = rect(12, 8), items = fillZone(Z, { mod:'r_t4', gx:1.2, gy:1.2, margin:0.3 });
  const st = restoStats(items, Z);
  // module 1,8 × 1,8 m + 1,2 m d'allée : 3 m de pas -> 4 × 2 modules (12 - 0,6 de marge)
  assert.equal(st.tables, 8); assert.equal(st.places, 32); near(st.area, 96); near(st.perPlace, 3);
  assert.ok(items.every(it => itemCorners(it).every(p => pointInPoly(p, Z))));
  const tables = items.filter(i => i[0] === 't').map(t => t[1]).sort((a, b) => a - b), gaps = [...new Set(tables.map(v => +v.toFixed(3)))];
  near(gaps[1] - gaps[0], 3, 1e-6);
  const rot = fillZone(rect(8, 12), { mod:'r_h8', ang:90, gx:1, gy:1.5 });
  assert.ok(rot.length > 0 && rot.filter(i => i[0] === 't').every(t => Math.abs(Math.abs(t[5]) - Math.PI / 2) < 1e-3)); // tablées dans l'autre sens
  assert.deepEqual(fillZone(rect(1, 1), { mod:'r_t4' }), []); // trop petit
  assert.deepEqual(fillZone(Z, { mod:'inconnu' }), []);
});
test('restauration : zone en L non convexe, rien dans le creux', () => {
  const L = [[0, 0], [12, 0], [12, 4], [4, 4], [4, 12], [0, 12]], items = fillZone(L, { mod:'r_t2', gx:0.8, gy:1 });
  assert.ok(items.length > 0);
  assert.ok(items.every(it => itemCorners(it).every(p => pointInPoly(p, L))));
});
test('restauration : nomenclature et déplacement', () => {
  const bom = restoBom([...RESTO_MODS.r_h8.items, ...RESTO_MODS.r_r4.items, ...RESTO_MODS.r_md.items]);
  assert.equal(bom.get('Tabouret haut'), 8); assert.equal(bom.get('Chaise'), 4);
  assert.equal(bom.get('Table haute 2,8 × 0,8 m'), 1); assert.equal(bom.get('Table ronde Ø 0,9 m'), 1); assert.equal(bom.get('Mange-debout Ø 0,6 m'), 1);
  const m = moveItems([['c', 1, 0, 0]], 5, 5, Math.PI / 2); near(m[0][1], 5); near(m[0][2], 6); near(m[0][3], Math.PI / 2, 1e-3);
  assert.match(furnitureSvg(RESTO_MODS.r_t4.items), /<rect/); assert.match(zoneSvg(rect(2, 2), 'z1'), /pattern id="z1"/); assert.equal(zoneSvg([], 'z'), '');
});
test('restauration : données venues d\'un lien nettoyées', () => {
  const r = cleanResto({ name:'x'.repeat(200), poly:[[0, 0], [5, 0], [5, 'a'], [0, 5], [1e9, 2]], items:[['t', 0, 0, 1, 1, 0, 0.75], ['t', 0, 0, -1, 1, 0, 0.75], ['z', 1, 2], ['c', 1], ['s', 1, 2], ['o', 0, 0, 0.9, 0.75]], auto:{ mod:'r_t4', gx:'abc', ang:90 } });
  assert.equal(r.name.length, 80); assert.equal(r.poly.length, 4); assert.deepEqual(r.poly[3], [500, 2]);
  assert.equal(r.items.length, 3); assert.equal(r.auto.mod, 'r_t4'); assert.equal(r.auto.gx, 1.2); assert.equal(r.auto.ang, 90);
  assert.equal(cleanResto(null), null); assert.equal(cleanResto({ auto:{ mod:'pirate' } }).auto, null);
});
test('restauration DACAM : 13 zones avec mobilier, dans l\'Agora et autour, données valides', () => {
  const d = JSON.parse(readFileSync(new URL('../restauration_dacam.json', import.meta.url)));
  assert.equal(d.zones.length, 13);
  let places = 0;
  for (const z of d.zones) {
    const c = cleanResto(z); assert.equal(c.items.length, z.items.length, z.name); assert.ok(c.poly.length >= 3);
    const st = restoStats(c.items, c.poly); places += st.places; assert.ok(st.area > 3, z.name);
    assert.ok(c.items.every(it => pointInPoly([it[1], it[2]], c.poly)), z.name); // mobilier dans sa zone
  }
  assert.ok(places > 300 && places < 450, `places ${places}`); // 230 chaises + 130 tabourets sur le plan
});
test('restauration : scinder une zone (droite, zone en L, mobilier réparti)', async () => {
  const { splitPoly, splitResto } = await import('../js/resto.js');
  const sq = rect(10, 6), [A, B] = splitPoly(sq, [4, -1], [4, 7]);
  near(polyArea(A) + polyArea(B), 60); near(Math.min(polyArea(A), polyArea(B)), 24);
  assert.equal(splitPoly(sq, [20, 0], [20, 5]), null); // trait hors zone
  // L : un trait qui ne traverse que le bras vertical ne coupe pas le bras horizontal
  const L = [[0, 0], [12, 0], [12, 4], [4, 4], [4, 12], [0, 12]], [P, Q] = splitPoly(L, [-1, 8], [5, 8]);
  near(polyArea(P) + polyArea(Q), polyArea(L)); near(Math.min(polyArea(P), polyArea(Q)), 16);
  const r = { name:'Z', poly:sq, items:[['c', 1, 1, 0], ['c', 8, 1, 0], ['s', 9, 5]], auto:null, src:'dacam' }, parts = splitResto(r, [4, -1], [4, 7]);
  assert.deepEqual(parts.map(p => p.items.length).sort(), [1, 2]); assert.ok(parts.every(p => p.src === 'dacam'));
  const auto = splitResto({ ...r, auto:{ mod:'r_t4', gx:1.2, gy:1.2, margin:0.3, ang:0 } }, [5, -1], [5, 7]);
  assert.ok(auto.every(p => p.items.length && p.items.every(it => itemCorners(it).every(q => pointInPoly(q, p.poly))))); // remplissage refait par morceau
});
test('restauration : capacité maximale (meilleur sens et calage, jamais moins que le remplissage simple)', async () => {
  const { bestFill, capacityTable, zoneAngles } = await import('../js/resto.js');
  const Z = rect(12, 8), simple = restoStats(fillZone(Z, { mod:'r_t4' }), Z), best = bestFill(Z, { mod:'r_t4' });
  assert.ok(best.places >= simple.places); assert.ok(best.items.every(it => itemCorners(it).every(p => pointInPoly(p, Z))));
  // zone étroite et longue en biais : le meilleur sens suit le bord
  const c = Math.cos(Math.PI / 6), s = Math.sin(Math.PI / 6), slant = rect(20, 2.6).map(([x, z]) => [x * c - z * s, x * s + z * c]);
  assert.ok(zoneAngles(slant).includes(30));
  const b = bestFill(slant, { mod:'r_t2', gx:0.6, gy:1 }); assert.equal(b.ang % 90 === 0, false); assert.ok(b.places >= 16, `places ${b.places}`);
  const tab = capacityTable(Z, { gx:1.2, gy:1.2, margin:0.3 });
  assert.equal(tab.length, Object.keys(RESTO_MODS).length); assert.ok(tab.find(t => t.mod === 'r_md').places === 0 && tab.find(t => t.mod === 'r_md').tables > 0);
});
test('restauration : passages (allées traversantes entre rangées, largeur en UP)', async () => {
  const { zonePassages, dominantAngle } = await import('../js/resto.js');
  const Z = rect(12, 8), items = fillZone(Z, { mod:'r_t4', gx:1.2, gy:1.4, margin:0.3 }), P = zonePassages(Z, items);
  // 2 rangées de tables (1,8 m) séparées par 1,40 m ; 4 colonnes séparées par 1,20 m
  assert.equal(P.rows.length, 1); near(P.rows[0].w, 1.4, 0.03); assert.equal(P.rows[0].up, 2);
  assert.equal(P.cols.length, 3); assert.ok(P.cols.every(c => Math.abs(c.w - 1.2) < 0.03 && c.up === 1));
  assert.equal(zonePassages(Z, fillZone(Z, { mod:'r_t4', gx:0.4, gy:0.4 })).cols.length, 0); // allées de 40 cm : pas de passage
  assert.equal(dominantAngle(fillZone(rect(8, 12), { mod:'r_h8', ang:90 })), 0); // 90° ≡ 0° modulo 90
});
test('restauration : couleur de zone (validée, reprise dans le dessin)', async () => {
  const { cleanResto, zoneSvg, RESTO_COLORS } = await import('../js/resto.js');
  assert.equal(cleanResto({ poly:rect(2, 2), col:'#1F5FBF' }).col, '#1f5fbf');
  assert.equal(cleanResto({ poly:rect(2, 2), col:'red;}<script>' }).col, RESTO_COLORS[0]);
  assert.match(zoneSvg(rect(2, 2), 'z', '#1f5fbf'), /stroke="#1f5fbf"/);
});
test('restauration : pipette (table + ses chaises, recentrée, réutilisable au pinceau)', async () => {
  const { pickGroup, groupName, canPlace, moduleItemsAt } = await import('../js/resto.js');
  const items = [...moduleItemsAt('r_t2', 3, 3), ...moduleItemsAt('r_t4', 8, 3)];
  const g1 = pickGroup(items, 3, 3); assert.equal(g1.length, 3); assert.equal(groupName(g1), 'Table 0,9 × 0,7 + 2 chaises');
  const g2 = pickGroup(items, 8 + 0.675, 3); assert.equal(g2.length, 5); // clic sur une chaise : toute la table carrée
  assert.equal(pickGroup(items, 20, 20), null);
  const Z = rect(14, 8); assert.ok(canPlace(Z, items, g1, 3, 6.5, 0, 0.6)); assert.equal(moduleItemsAt(g1, 3, 6.5).length, 3);
});
test('restauration : pinceau (poser sans chevaucher, dans la zone, gomme, grille)', async () => {
  const { canPlace, moduleItemsAt, eraseItems, brushSnap, quadsOverlap } = await import('../js/resto.js');
  const Z = rect(10, 6); let items = [];
  assert.ok(canPlace(Z, items, 'r_t4', 2, 2, 0, 0.6, 0.2));
  items = moduleItemsAt('r_t4', 2, 2); assert.equal(items.length, 5);
  assert.ok(!canPlace(Z, items, 'r_t4', 3, 2, 0, 0.6)); // chevauche
  assert.ok(!canPlace(Z, items, 'r_t4', 2 + 1.8 + 0.3, 2, 0, 0.6)); // trop près (écart 0,6)
  assert.ok(canPlace(Z, items, 'r_t4', 2 + 1.8 + 0.6, 2, 0, 0.6));
  assert.ok(!canPlace(Z, items, 'r_t4', 9.5, 2, 0, 0.6)); // déborde de la zone
  const p = brushSnap('r_t4', [2, 2], [4.3, 2.1], 0, 0.6); near(p[0], 4.4); near(p[1], 2);
  assert.equal(eraseItems(items, 2, 2, 0.3).length, 4); // la table seule
  assert.ok(quadsOverlap([[0, 0], [1, 0], [1, 1], [0, 1]], [[0.5, 0.5], [2, 0.5], [2, 2], [0.5, 2]]));
  assert.ok(!quadsOverlap([[0, 0], [1, 0], [1, 1], [0, 1]], [[1.1, 0], [2, 0], [2, 1], [1.1, 1]]));
});

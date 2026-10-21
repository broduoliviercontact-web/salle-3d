// Tests des calculs de sécurité de Salle 3D : `npm test` (Node 20+, aucune dépendance)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pratLayout, ropeSag, gridRig, hangOnGrid, shareNearest, assignCircuits, circuitError, assignDmx, dmxError, cueTime, CIRC_W, LIMITS, cleanDims, cleanProp, cleanDmx } from '../js/calc.js';

const near = (a, b, eps = 1e-6, msg) => assert.ok(Math.abs(a - b) < eps, msg || `${a} ≠ ${b}`);
const area = l => l.reduce((s, [, , w, d]) => s + w * d, 0);
const overlaps = l => l.some((p, i) => l.some((q, j) => j > i && p[0] < q[0] + q[2] && q[0] < p[0] + p[2] && p[1] < q[1] + q[3] && q[1] < p[1] + p[3]));

// --- praticables ---
test('praticables : 8 × 8 = 32 pièces de 2 × 1, sans chevauchement, surface exacte', () => {
  const l = pratLayout(8, 8);
  assert.equal(l.length, 32); assert.equal(area(l), 64); assert.ok(!overlaps(l));
});
test('praticables : cote impaire (11 × 9) couverte, sans chevauchement, ne déborde que de la surface signalée', () => {
  const l = pratLayout(11, 9);
  assert.ok(!overlaps(l)); assert.ok(area(l) >= 99);
  assert.ok(l.every(([x, z, w, d]) => x >= 0 && z >= 0 && x + w <= 11 + 1e-9 && z + d <= 10 + 1e-9));
  assert.equal(l.length, 50); // 50 × 2 m² = 100 m² : 1 m² en trop, affiché « à recouper »
});
test('praticables : choisit le sens qui demande le moins de pièces', () => {
  assert.equal(pratLayout(7, 1).length, pratLayout(1, 7).length);
  assert.equal(pratLayout(1, 1).length, 1);
});

// --- cordon des potelets ---
test('cordon 2 m : presque tendu à 2 m, flèche croissante quand les potelets se rapprochent, jamais au sol', () => {
  near(ropeSag(2.06), 0.01); // s = 2 m : tendu
  assert.ok(ropeSag(2) < ropeSag(1.6) && ropeSag(1.6) < ropeSag(1.2));
  near(ropeSag(1.6), Math.sqrt(3 * 1.54 * 0.46 / 8), 1e-9);
  assert.ok(ropeSag(0.3) <= 0.9 - 0.05 + 1e-9); // au moins 5 cm sous la corde
});

// --- grill du machiniste ---
const XS = [0, 2, 4, 6, 8], ZS = [0, 3, 6, 9];
test('grill : 4 rangées × 3 colonnes = 12 palans ; poids total = palans + poutres', () => {
  const kgm = 10, hoist = 50, { pts, lines } = gridRig(XS, ZS, kgm, hoist);
  assert.equal(pts.length, 12); assert.equal(lines.length, 6);
  const beams = 4 * 8 + 2 * 9; // 4 rangées de 8 m + 2 côtés de 9 m
  near(pts.reduce((s, p) => s + p.kg, 0), 12 * hoist + beams * kgm);
});
test('grill : une charge se répartit au bras de levier entre les 2 palans voisins, rien ne se perd', () => {
  const { pts, lines } = gridRig(XS, ZS, 0, 0);
  assert.equal(hangOnGrid(lines, 1, 0, 100), true); // sur la rangée z = 0, au quart entre x = 0 et x = 4
  const at = (x, z) => pts.find(p => p.x === x && p.z === z).kg;
  near(at(0, 0), 75); near(at(4, 0), 25);
  near(pts.reduce((s, p) => s + p.kg, 0), 100);
});
test('grill : une charge à plus de 1 m de toute poutre n\'est pas comptée (signalée hors grill)', () => {
  const { pts, lines } = gridRig(XS, ZS, 0, 0);
  assert.equal(hangOnGrid(lines, 2, 1.5, 100), false);
  near(pts.reduce((s, p) => s + p.kg, 0), 0);
});

// --- ponts : répartition sur les points d'accroche ---
test('pont : charge entre 2 moteurs au prorata inverse de la distance', () => {
  const pts = [{ x:0, z:0, kg:0 }, { x:6, z:0, kg:0 }];
  shareNearest(pts, 1.5, 0, 200);
  near(pts[0].kg, 150); near(pts[1].kg, 50);
});
test('pont : charge sur un moteur, ou un seul moteur, = tout sur lui', () => {
  const a = [{ x:0, z:0, kg:0 }, { x:6, z:0, kg:0 }]; shareNearest(a, 6, 0, 80); near(a[1].kg, 80); near(a[0].kg, 0);
  const b = [{ x:0, z:0, kg:0 }]; shareNearest(b, 3, 0, 80); near(b[0].kg, 80);
});

// --- patch : circuits ---
const row = (box, W, c = 0, nc = 4) => ({ box, nc, W, c });
test('circuits : premier circuit libre, puis partage d\'une prise double si la somme reste ≤ 3 kW', () => {
  const rows = [row('B', 1000), row('B', 1000), row('B', 1000)].map(r => ({ ...r, nc:2 }));
  const load = assignCircuits(rows);
  assert.deepEqual(rows.map(r => r.c), [1, 2, 1]);
  assert.deepEqual(load.get('B/1'), { n:2, W:2000 });
  assert.ok(rows.every(r => circuitError(r, load, 'C') === ''));
});
test("circuits : 3 kW par circuit — un appareil qui ferait dépasser n'a plus de circuit et est signalé", () => {
  const rows = [row('B', 2000, 0, 1), row('B', 2000, 0, 1)];
  const load = assignCircuits(rows);
  assert.equal(rows[1].c, 2); // aucun circuit ne peut l'accueillir : circuit inexistant
  assert.match(circuitError(rows[1], load, 'C2'), /n'a que 1 circuits/);
});
test('circuits : choix manuels prioritaires ; surcharge et prise double pleine signalées', () => {
  const rows = [row('B', 2000, 1), row('B', 1500, 1)];
  const load = assignCircuits(rows);
  assert.equal(circuitError(rows[0], load, 'ADC-01', CIRC_W), 'ADC-01 chargé à 3,50 kW (gradateur 3 kW)');
  const three = [row('B', 100, 1), row('B', 100, 1), row('B', 100, 1)], l3 = assignCircuits(three);
  assert.match(circuitError(three[2], l3, 'ADC-01'), /3 appareils sur ADC-01/);
});
test('circuits : appareil sans boîtier, boîtier sans circuit', () => {
  const rows = [row(null, 500), row('X', 500, 0, 0)], load = assignCircuits(rows);
  assert.equal(circuitError(rows[0], load, 'C0'), 'sans boîtier');
  assert.equal(circuitError(rows[1], load, 'C1'), 'boîtier sans circuit connu');
});

// --- patch : DMX ---
const dmx = (ch, u = 0, a = 0) => ({ ch, u, a });
const free = rows => rows.every(r => dmxError(rows, r) === '');
test('DMX : adressage auto à la suite, sans chevauchement', () => {
  const rows = assignDmx([dmx(42), dmx(16), dmx(1)]);
  assert.deepEqual(rows.map(r => [r.u, r.a]), [[1, 1], [1, 43], [1, 59]]);
  assert.ok(free(rows));
});
test('DMX : contourne une adresse manuelle et passe à l\'univers suivant à 512', () => {
  const rows = assignDmx([dmx(10, 1, 1), dmx(42), dmx(500), dmx(20)]);
  assert.deepEqual(rows.map(r => [r.u, r.a]), [[1, 1], [1, 11], [2, 1], [1, 53]]);
  assert.ok(free(rows));
  assert.ok(rows.every(r => r.a + r.ch - 1 <= 512));
});
test('DMX : chevauchement manuel et dépassement de 512 signalés', () => {
  const rows = [dmx(42, 1, 1), dmx(16, 1, 30), dmx(16, 1, 500)];
  assert.equal(dmxError(rows, rows[0]), 'DMX : adresses qui se chevauchent');
  assert.equal(dmxError(rows, rows[2]), 'DMX : dépasse 512 (500 + 16 canaux)');
  const ok = [dmx(42, 1, 1), dmx(42, 2, 1)]; assert.ok(free(ok)); // même adresse, univers différents
});

// --- conduite machinerie ---
test('conduite : durée = l\'élément le plus lent', () => {
  const a = { h:{ F1:2, C1:3 }, patience:0, ecran:0 }, b = { h:{ F1:8, C1:4 }, patience:1, ecran:0.5 };
  near(cueTime(a, b, { F1:0.15, C1:0.08 }, 1 / 5.7, 0.2 / 7.5), 40); // F1 : 6 m à 0,15 m/s
  near(cueTime({ h:{} }, { h:{} }, {}, 1, 1), 0);
});

// --- liens de partage : valeurs bornées ---
const KNOWN = new Set(['led', 'scene', 'perche']);
test('lien piégé : dimensions bornées (écran LED de 100 000 m -> 120 × 40 m)', () => {
  assert.deepEqual(cleanDims([100000, 0.1, 1e9]), [LIMITS.L, 0.1, LIMITS.H]);
  assert.deepEqual(cleanDims([-5, 'x', NaN], [4, 0.1, 2.5]), [LIMITS.min, 'x', 2.5]);
  assert.deepEqual(cleanDims(null, [8, 8, 1.2]), [8, 8, 1.2]);
  assert.equal(cleanDims(new Array(1000).fill(1)).length, 12);
  assert.equal(cleanDims([1, 1, 1, 'Équipe F1'.repeat(100)])[3].length, LIMITS.str);
});
test('lien piégé : paramètres en plus gardés s\'ils sont des nombres finis (charge d\'une perche, nom d\'équipe)', () => {
  assert.deepEqual(cleanDims([12, 0.05, 0.05, 'F1', 350, 0, 0, 645]), [12, 0.05, 0.05, 'F1', 350, 0, 0, 645]);
  assert.deepEqual(cleanDims([12, 0.05, 0.05, 1e12, Infinity]), [12, 0.05, 0.05, LIMITS.other, 0]);
});
test('lien piégé : élément de type inconnu ou sans position lisible écarté ; position bornée', () => {
  assert.equal(cleanProp({ kind:'virus', dims:[1, 1, 1], p:[0, 0, 0], r:[0, 0, 0] }, KNOWN), null);
  assert.equal(cleanProp({ kind:'led', dims:[1, 1, 1], p:[0, 'a', 0] }, KNOWN), null);
  assert.equal(cleanProp({ kind:'__proto__', p:[0, 0, 0] }, KNOWN), null);
  const x = cleanProp({ kind:'led', dims:[1e5, 0.1, 1e5], p:[1e9, 0, -3], r:null, trap:2 }, KNOWN, { led:[4, 0.1, 2.5] });
  assert.deepEqual(x.dims, [LIMITS.L, 0.1, LIMITS.H]); assert.deepEqual(x.p, [LIMITS.pos, 0, -3]); assert.deepEqual(x.r, [0, 0, 0]); assert.equal(x.trap, 2);
});
test('lien piégé : DMX borné (univers 1-64, adresse 0-512, empreinte 0-512)', () => {
  assert.deepEqual(cleanDmx({ u:1e9, a:-4, ch:100000 }), { u:64, a:0, ch:512 });
  assert.deepEqual(cleanDmx(null), { u:1, a:0, ch:0 });
});
test('DMX : une empreinte de plus de 512 canaux ne bloque pas l\'adressage (signalée)', () => {
  const rows = assignDmx([dmx(10000), dmx(8)]);
  assert.equal(rows[0].a, 0); assert.match(dmxError(rows, rows[0]), /dépasse 512/);
  assert.deepEqual([rows[1].u, rows[1].a], [1, 1]);
});

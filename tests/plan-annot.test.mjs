// Tests des annotations du plan 2D : `npm test`
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { annotSvg, annotBox, annotLength, zoneArea, cleanAnnot, ICONS, fmtM, ANNOT_LIMIT } from '../js/plan-annot.js';

test('annotations : cote = longueur mesurée affichée, zone = surface en m²', () => {
  const dim = { t:'dim', p:[[0, 0], [3, 4]] };
  assert.equal(annotLength(dim), 5);
  assert.match(annotSvg(dim), /5,00 m/);
  const zone = { t:'zone', p:[[10, 2], [4, 7]], txt:'Catering' };
  assert.equal(zoneArea(zone), 30);
  assert.match(annotSvg(zone), /Catering/); assert.match(annotSvg(zone), /30 m²/);
});
test('annotations : textes échappés (pas d\'injection dans le SVG), plusieurs lignes', () => {
  const svg = annotSvg({ t:'text', p:[[0, 0]], txt:'<script>x</script>\nligne 2' });
  assert.ok(!svg.includes('<script>')); assert.match(svg, /&lt;script&gt;/); assert.equal((svg.match(/<tspan/g) || []).length, 2);
});
test('annotations : chaque picto se dessine, la cote n\'est jamais écrite à l\'envers', () => {
  for (const ic of Object.keys(ICONS)) assert.match(annotSvg({ t:'icon', p:[[1, 1]], ic }), ic === 'croix' ? /<line/ : /<rect/);
  assert.match(annotSvg({ t:'icon', p:[[1, 1]], ic:'croix', bg:'#1f5fbf' }), /stroke="#1f5fbf"/); // croix à la couleur choisie
  for (const p of [[[0, 0], [5, 0]], [[5, 0], [0, 0]], [[0, 5], [0, 0]], [[0, 0], [-3, 3]]]) {
    const ang = +annotSvg({ t:'dim', p }).match(/rotate\(([-\d.]+)\)/)[1];
    assert.ok(ang > -90 && ang <= 90, `angle ${ang}`);
  }
});
test('annotations : emprise contient les points ; format des mètres', () => {
  const b = annotBox({ t:'arrow', p:[[2, 3], [-1, 8]] });
  assert.ok(b[0][0] <= -1 && b[0][1] <= 3 && b[1][0] >= 2 && b[1][1] >= 8);
  assert.equal(fmtM(12.345), '12,35 m'); assert.equal(fmtM(3), '3,00 m');
});
test('annotations venues d\'un lien : types, points et textes nettoyés', () => {
  const r = cleanAnnot([
    { t:'text', p:[[1, 2]], txt:'ok', col:'#00ff00' },
    { t:'evil', p:[[0, 0]] },
    { t:'dim', p:[[0, 0]] },                  // 1 seul point : rejetée
    { t:'zone', p:[[0, 0], [1e9, 'x']] },     // point invalide : rejetée
    { t:'icon', p:[[0, 0]], ic:'inconnu', col:'red', s:99, txt:'x'.repeat(500) },
    null, 'texte',
  ]);
  assert.equal(r.length, 2);
  assert.equal(r[0].col, '#00ff00');
  assert.equal(r[1].ic, 'info'); assert.equal(r[1].col, '#d0021b'); assert.equal(r[1].s, 5); assert.equal(r[1].txt.length, 200);
  assert.deepEqual(cleanAnnot('nope'), []);
  assert.equal(cleanAnnot(Array.from({ length:ANNOT_LIMIT + 50 }, () => ({ t:'text', p:[[0, 0]] }))).length, ANNOT_LIMIT);
  assert.deepEqual(cleanAnnot([{ t:'zone', p:[[0, 0], [1e9, 5]] }])[0].p[1], [2000, 5]);
});
test('annotations : cotes d\'un contour (une par bord, valeurs justes, gardées au nettoyage)', async () => {
  const { edgeCotesSvg } = await import('../js/plan-annot.js');
  const svg = edgeCotesSvg([[0, 0], [4, 0], [4, 3], [0, 3]]);
  assert.equal((svg.match(/<text/g) || []).length, 4); assert.match(svg, /4,00 m/); assert.match(svg, /3,00 m/);
  assert.equal(edgeCotesSvg([[0, 0], [1, 0]]), '');
  assert.equal(cleanAnnot([{ t:'zone', p:[[0, 0], [2, 2]], cotes:true }])[0].cotes, true);
  assert.match(annotSvg({ t:'zone', p:[[0, 0], [5, 2]], cotes:true }), /5,00 m/);
});

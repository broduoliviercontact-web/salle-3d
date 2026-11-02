import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catCode, cleanCats, nextCatColor, legendLayout, CAT_LIMIT, CAT_PRESETS, LEG_ROW } from '../js/legend.js';

test('repères A, B… puis numéros', () => {
  assert.equal(catCode(0), 'A'); assert.equal(catCode(25), 'Z'); assert.equal(catCode(26), '27');
});

test('cleanCats : ids uniques, couleurs valides, bornes', () => {
  const c = cleanCats([{ id:'a1', name:'  Sécurité ', col:'#ff0000', mark:1 }, { id:'a1', name:'doublon' }, { id:'x"<', name:'', col:'rouge' }, null, 'z']);
  assert.deepEqual(c, [{ id:'a1', name:'Sécurité', col:'#ff0000', mark:true }, { id:'x', name:'Catégorie', col:'#6b7280', mark:false }]);
  assert.equal(cleanCats(Array.from({ length:40 }, (_, i) => ({ id:'c' + i, name:'n' }))).length, CAT_LIMIT);
  assert.deepEqual(cleanCats('nope'), []);
});

test('nextCatColor : première couleur libre', () => {
  assert.equal(nextCatColor([]), CAT_PRESETS[0].col);
  assert.equal(nextCatColor([{ col:CAT_PRESETS[0].col.toUpperCase() }]), CAT_PRESETS[1].col);
});

test('legendLayout : chaque catégorie sur une nouvelle ligne, retour à la ligne en retrait', () => {
  const L = legendLayout([
    { items:[{ label:'Table ×2' }] },
    { head:{ label:'A SÉCURITÉ' }, items:Array.from({ length:8 }, (_, i) => ({ label:'Extincteur ×' + i })) },
    { head:{ label:'B VIDE' }, items:[] },
  ], 10, 40);
  const heads = L.els.filter(e => e.t === 'head');
  assert.equal(heads[0].y, LEG_ROW); assert.equal(heads[0].x, 10);
  const sec = L.els.filter(e => e.t === 'item' && e.label.startsWith('Ext'));
  assert.ok(sec.every(e => e.x + e.w <= 40 || e.x === 10.6));
  assert.ok(sec.some(e => e.y > LEG_ROW) && sec.filter(e => e.y > LEG_ROW).every(e => e.x >= 10.6));
  assert.ok(heads[1].y > sec.at(-1).y); assert.equal(L.bottom, heads[1].y);
  assert.deepEqual(legendLayout([{ items:[] }], 0, 10), { els:[], bottom:0 });
});

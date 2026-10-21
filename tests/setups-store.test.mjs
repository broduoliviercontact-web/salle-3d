// Tests de la bibliothèque partagée (api/_lib/setups-store.js) avec un faux stockage Blob en mémoire
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setupsHandler, parsePath, makePath } from '../api/_lib/setups-store.js';

function fakeBlob() {
  const files = new Map();
  return { files,
    async put(pathname, body, o) { assert.equal(o.access, 'private'); if (files.has(pathname)) throw new Error('existe déjà'); files.set(pathname, String(body)); return { pathname }; },
    async list({ prefix = '', cursor, limit = 1000 }) { const all = [...files.keys()].filter(k => k.startsWith(prefix)).sort(), i = +(cursor || 0), page = all.slice(i, i + limit);
      return { blobs:page.map(p => ({ pathname:p, size:files.get(p).length, uploadedAt:new Date() })), hasMore:i + limit < all.length, cursor:String(i + limit) }; },
    async get(pathname, o) { assert.equal(o.access, 'private'); if (!files.has(pathname)) return null; return { statusCode:200, stream:new Blob([files.get(pathname)]).stream() }; } };
}
const setup = (extra = {}) => ({ salle:'agora', props:[{ kind:'scene', dims:[8, 8, 1.2], p:[45, 0, 3], r:[0, 0, 0] }], moved:[], ...extra });
const call = async (h, method, qs = '', body) => { const r = await h(new Request('https://x/api/setups' + qs, { method, body:body && JSON.stringify(body) })); return { status:r.status, json:await r.json() }; };
function clock() { let t = 1792000000000; return () => (t += 1000); }

test('chemin d\'une version : méta lisible sans ouvrir le fichier (nom accentué, événement)', () => {
  const p = makePath('abc123', 1792000000000, { n:'Régie côté cour', e:'FIP 360', d:'2026-12-05', s:'agora' });
  assert.deepEqual(parsePath(p), { id:'abc123', v:1792000000000, meta:{ n:'Régie côté cour', e:'FIP 360', d:'2026-12-05', s:'agora' } });
  assert.equal(parsePath('setups/../../etc/passwd'), null);
});
test('enregistrer deux fois le même setup crée deux versions, la liste montre la dernière', async () => {
  const blob = fakeBlob(), h = setupsHandler(blob, clock());
  const a = await call(h, 'POST', '', { name:'Version A', event:'Concert 05/12', date:'2026-12-05', cfg:setup() });
  assert.equal(a.status, 200); assert.match(a.json.id, /^[a-z0-9]{10}$/);
  const b = await call(h, 'POST', '', { id:a.json.id, name:'Version A bis', event:'Concert 05/12', cfg:setup({ salle:'audi' }) });
  assert.equal(b.json.id, a.json.id);
  const lib = (await call(h, 'GET')).json;
  assert.equal(lib.length, 1); assert.equal(lib[0].name, 'Version A bis'); assert.equal(lib[0].salle, 'audi'); assert.equal(lib[0].versions.length, 2);
  assert.ok(lib[0].versions[0].v > lib[0].versions[1].v);
});
test('lire la dernière version ou une version précise', async () => {
  const h = setupsHandler(fakeBlob(), clock());
  const a = (await call(h, 'POST', '', { name:'S', cfg:setup() })).json;
  const b = (await call(h, 'POST', `?id=${a.id}`, { name:'S', cfg:setup({ props:[] }) })).json;
  assert.equal((await call(h, 'GET', `?id=${a.id}`)).json.cfg.props.length, 0);
  assert.equal((await call(h, 'GET', `?id=${a.id}&v=${a.v}`)).json.cfg.props.length, 1);
  assert.equal((await call(h, 'GET', `?id=${a.id}&v=123`)).status, 404);
  assert.equal(b.id, a.id);
});
test('supprimer masque le setup mais garde l\'historique', async () => {
  const blob = fakeBlob(), h = setupsHandler(blob, clock());
  const a = (await call(h, 'POST', '', { name:'À jeter', cfg:setup() })).json;
  assert.equal((await call(h, 'DELETE', `?id=${a.id}`)).json.deleted, true);
  const lib = (await call(h, 'GET')).json;
  assert.equal(lib[0].deleted, true); assert.equal(lib[0].versions.length, 1);
  assert.equal(blob.files.size, 2);
  assert.equal((await call(h, 'GET', `?id=${a.id}&v=${a.v}`)).status, 200); // version récupérable
});
test('entrées refusées : id piégé, setup incomplet, JSON illisible, trop gros', async () => {
  const h = setupsHandler(fakeBlob(), clock());
  assert.equal((await call(h, 'GET', '?id=../../x')).status, 400);
  assert.equal((await call(h, 'POST', '', { name:'', cfg:setup() })).status, 400);
  assert.equal((await call(h, 'POST', '', { name:'x', cfg:{} })).status, 400);
  assert.equal((await h(new Request('https://x/api/setups', { method:'POST', body:'{pas du json' }))).status, 400);
  assert.equal((await call(h, 'POST', '', { name:'x', cfg:setup({ pad:'x'.repeat(2_100_000) }) })).status, 413);
  assert.equal((await call(h, 'PUT')).status, 405);
});
test('stockage en panne : réponse 503 lisible, pas d\'exception', async () => {
  const h = setupsHandler({ list:async () => { throw new Error('réseau'); } });
  const r = await call(h, 'GET'); assert.equal(r.status, 503); assert.equal(r.json.error, 'stockage indisponible');
});
test('plus de 1000 versions : la liste suit la pagination', async () => {
  const blob = fakeBlob(), h = setupsHandler(blob, clock());
  for (let i = 0; i < 1100; i++) blob.files.set(makePath('pagina1', 1792000000000 + i, { n:'P' }), '{}');
  const lib = (await call(h, 'GET')).json; assert.equal(lib[0].versions.length, 1100);
});

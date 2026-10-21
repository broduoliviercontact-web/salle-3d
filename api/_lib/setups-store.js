// Bibliothèque de setups partagée (Vercel Blob, stockage privé) : chaque enregistrement crée une version, rien n'est écrasé.
// Chemin d'une version : setups/<id>/<horodatage ms>-<méta>.json ; la méta (nom, événement, date, salle, supprimé) est dans
// le chemin, encodée en base64url, pour lister toute la bibliothèque sans ouvrir chaque fichier.
// Supprimer = ajouter une version « supprimé » (l'historique reste récupérable).
// blob : { put, list, get } de @vercel/blob (ou un faux en mémoire pour les tests).

const ID = /^[a-z0-9]{6,16}$/, MAX_BYTES = 2_000_000, PREFIX = 'setups/';
const b64u = s => Buffer.from(s, 'utf8').toString('base64url'), unb64u = s => Buffer.from(s, 'base64url').toString('utf8');
const str = (v, n = 80) => typeof v === 'string' ? v.trim().slice(0, n) : '';
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers:{ 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' } });
const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(10)), b => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');

export function parsePath(pathname) { // -> { id, v, meta } ou null
  const m = /^setups\/([a-z0-9]{6,16})\/(\d{13})-([A-Za-z0-9_-]+)\.json$/.exec(pathname); if (!m) return null;
  try { return { id:m[1], v:+m[2], meta:JSON.parse(unb64u(m[3])) }; } catch { return null; }
}
export const makePath = (id, v, meta) => `${PREFIX}${id}/${v}-${b64u(JSON.stringify(meta))}.json`;

async function listAll(blob, prefix) {
  const out = []; let cursor;
  do { const r = await blob.list({ prefix, cursor, limit:1000 }); out.push(...r.blobs); cursor = r.hasMore ? r.cursor : undefined; } while (cursor);
  return out;
}
// bibliothèque : une entrée par setup (méta de la dernière version) avec la liste de ses versions, les supprimés à part
export async function library(blob) {
  const by = new Map();
  for (const b of await listAll(blob, PREFIX)) { const p = parsePath(b.pathname); if (!p) continue; if (!by.has(p.id)) by.set(p.id, []); by.get(p.id).push({ ...p, size:b.size }); }
  return [...by].map(([id, vs]) => { vs.sort((a, b) => b.v - a.v); const last = vs[0];
    return { id, name:last.meta.n, event:last.meta.e || '', date:last.meta.d || '', salle:last.meta.s || 'agora', deleted:!!last.meta.x, saved:last.v,
      versions:vs.filter(x => !x.meta.x).map(x => ({ v:x.v, name:x.meta.n, size:x.size })) }; });
}

export function setupsHandler(blob, now = () => Date.now()) {
  return async function handle(request) {
    const url = new URL(request.url), id = url.searchParams.get('id');
    try {
      if (request.method === 'GET' && !id) return json(await library(blob));
      if (id && !ID.test(id)) return json({ error:'id invalide' }, 400);
      if (request.method === 'GET') { // une version (la plus récente si v n'est pas donné)
        const vs = (await listAll(blob, `${PREFIX}${id}/`)).map(b => ({ b, p:parsePath(b.pathname) })).filter(x => x.p && !x.p.meta.x).sort((a, b) => b.p.v - a.p.v);
        const want = url.searchParams.get('v'), hit = want ? vs.find(x => String(x.p.v) === want) : vs[0];
        if (!hit) return json({ error:'introuvable' }, 404);
        const r = await blob.get(hit.b.pathname, { access:'private', useCache:false });
        if (!r || r.statusCode !== 200) return json({ error:'introuvable' }, 404);
        return new Response(r.stream, { headers:{ 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' } });
      }
      if (request.method === 'POST') { // nouvelle version (nouveau setup si pas d'id)
        const text = await request.text(); if (text.length > MAX_BYTES) return json({ error:'setup trop gros' }, 413);
        let body; try { body = JSON.parse(text); } catch { return json({ error:'JSON illisible' }, 400); }
        const cfg = body?.cfg, name = str(body?.name);
        if (!name || !cfg || typeof cfg !== 'object' || !Array.isArray(cfg.props)) return json({ error:'setup incomplet' }, 400);
        const sid = id || (body.id && ID.test(body.id) ? body.id : newId()), v = now();
        const meta = { n:name, e:str(body.event), d:/^\d{4}-\d\d-\d\d$/.test(body.date) ? body.date : '', s:cfg.salle === 'audi' ? 'audi' : 'agora' };
        await blob.put(makePath(sid, v, meta), JSON.stringify({ name, event:meta.e, date:meta.d, cfg, saved:v }), { access:'private', contentType:'application/json', addRandomSuffix:false });
        return json({ id:sid, v });
      }
      if (request.method === 'DELETE' && id) { // version « supprimé » : la bibliothèque le masque, l'historique reste
        const last = (await library(blob)).find(e => e.id === id); if (!last) return json({ error:'introuvable' }, 404);
        const v = now(); await blob.put(makePath(id, v, { n:last.name, e:last.event, d:last.date, s:last.salle, x:1 }), '{}', { access:'private', contentType:'application/json', addRandomSuffix:false });
        return json({ id, v, deleted:true });
      }
      return json({ error:'méthode non prise en charge' }, 405);
    } catch (e) {
      return json({ error:'stockage indisponible', detail:String(e?.message || e).slice(0, 200) }, 503);
    }
  };
}

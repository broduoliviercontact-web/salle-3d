// Hors connexion : après une première visite, le site, la maquette et Three.js restent disponibles sans réseau.
// Fichiers du site : réseau d'abord (les mises à jour arrivent), cache en secours. CDN (versions figées) : cache d'abord.
const C = 'salle3d-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const url = new URL(r.url), same = url.origin === location.origin;
  if (!same && url.hostname !== 'cdn.jsdelivr.net') return;
  const keep = res => { if (res.ok) { const cl = res.clone(); caches.open(C).then(c => c.put(r, cl)); } return res; };
  e.respondWith(same
    ? fetch(r).then(keep).catch(() => caches.match(r, { ignoreSearch:true }))
    : caches.match(r).then(hit => hit || fetch(r).then(keep)));
});

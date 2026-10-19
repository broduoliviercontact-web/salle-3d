// Accès au site par mot de passe (Vercel Routing Middleware, exécuté avant chaque fichier servi).
// Tout est protégé : page, maquette, plans, JSON, photos des boîtiers. Seuls l'icône et le manifeste restent publics.
// Mot de passe : variable d'environnement SITE_PASSWORD dans Vercel (Settings → Environment Variables).
// Sans cette variable, le site reste fermé (503) plutôt que d'être ouvert par erreur.
// Changer le mot de passe déconnecte tous les appareils.
import { next } from '@vercel/functions';
import { createHmac, timingSafeEqual } from 'node:crypto';

export const config = { runtime: 'nodejs' };

const COOKIE = 'salle3d_auth';
const MAX_AGE = 60 * 24 * 3600; // 60 jours : une tablette reste connectée deux mois
const PUBLIC = new Set(['/icon.svg', '/manifest.webmanifest']);

const token = pw => createHmac('sha256', pw).update('salle3d-acces-v1').digest('base64url');
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y); };
const cookieOf = req => (req.headers.get('cookie') || '').split(/;\s*/).find(c => c.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
const noStore = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' };

export default async function middleware(req) {
  const pw = process.env.SITE_PASSWORD;
  if (!pw) return new Response('Site fermé : mot de passe non configuré (SITE_PASSWORD).', { status:503, headers:{ ...noStore, 'Content-Type':'text/plain; charset=utf-8' } });

  const url = new URL(req.url);
  if (PUBLIC.has(url.pathname)) return next();

  // connexion : le formulaire envoie le mot de passe en POST
  if (url.pathname === '/__login' && req.method === 'POST') {
    let given = '';
    try { given = String((await req.formData()).get('password') || ''); } catch {}
    if (!same(given, pw)) {
      await new Promise(r => setTimeout(r, 1000)); // ralentit les essais au hasard
      return new Response('Mot de passe incorrect.', { status:401, headers:{ ...noStore, 'Content-Type':'text/plain; charset=utf-8' } });
    }
    return new Response(null, { status:204, headers:{ ...noStore,
      'Set-Cookie':`${COOKIE}=${token(pw)}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax` } });
  }
  if (url.pathname === '/__logout') return new Response(null, { status:302, headers:{ ...noStore, Location:'/',
    'Set-Cookie':`${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` } });

  if (same(cookieOf(req) || '', token(pw))) return next();

  // non connecté : page de connexion pour une page, simple refus pour un fichier
  const page = req.method === 'GET' && (req.headers.get('accept') || '').includes('text/html');
  return page
    ? new Response(LOGIN, { status:401, headers:{ ...noStore, 'Content-Type':'text/html; charset=utf-8' } })
    : new Response('Accès réservé.', { status:401, headers:{ ...noStore, 'Content-Type':'text/plain; charset=utf-8' } });
}

// La page recharge la même adresse après connexion : les liens #s=… et #asd=… sont conservés.
const LOGIN = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Salle 3D — accès réservé</title><link rel="icon" href="/icon.svg"><meta name="theme-color" content="#16181d">
<style>
  body { margin:0; min-height:100vh; display:grid; place-items:center; background:#16181d; color:#e6e8ec; font:15px/1.4 system-ui,sans-serif; }
  form { width:min(320px, calc(100vw - 32px)); background:#1f232b; border:1px solid #333a46; border-radius:10px; padding:24px; }
  h1 { font-size:17px; margin:0 0 4px; } p { color:#9aa3b2; margin:0 0 18px; font-size:13px; }
  input, button { width:100%; box-sizing:border-box; font:inherit; padding:10px 12px; border-radius:6px; }
  input { background:#16181d; color:inherit; border:1px solid #333a46; margin-bottom:12px; }
  button { background:#f0a53a; color:#16181d; border:0; font-weight:600; cursor:pointer; }
  button:disabled { opacity:.6; } #err { color:#ff7b72; font-size:13px; min-height:18px; margin:10px 0 0; }
</style></head><body>
<form id="f"><h1>Salle 3D</h1><p>Accès réservé à l'équipe technique.</p>
<input type="password" name="password" placeholder="Mot de passe" autocomplete="current-password" autofocus required>
<button>Entrer</button><div id="err"></div></form>
<script>
f.onsubmit = async e => {
  e.preventDefault(); const b = f.querySelector('button'); b.disabled = true; err.textContent = '';
  try {
    const r = await fetch('/__login', { method:'POST', body:new FormData(f), credentials:'same-origin' });
    if (r.ok) return location.reload();
    err.textContent = r.status === 401 ? 'Mot de passe incorrect.' : 'Erreur ' + r.status + '.';
  } catch { err.textContent = 'Pas de connexion réseau.'; }
  b.disabled = false; f.password.select();
};
</script></body></html>`;

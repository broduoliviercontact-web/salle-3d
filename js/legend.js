// Catégories de légende du plan 2D : l'utilisateur range ses objets (mobilier, zones, lignes, pictos…) dans des catégories
// nommées ; la légende du plan les regroupe par catégorie, chacune avec un repère (lettre) qui peut aussi s'afficher sur le plan.

export const CAT_LIMIT = 26;
export const CAT_PRESETS = [
  { name:'Sécurité', col:'#1b2a4a' },
  { name:'Restauration', col:'#9a1c1c' },
  { name:'Technique', col:'#1f6fb2' },
  { name:'Balisage public', col:'#e67e22' },
  { name:'Logistique', col:'#6b7280' },
  { name:'Exposants', col:'#2c7a3f' },
  { name:'Scénographie', col:'#8e44ad' },
  { name:'Accès / circulation', col:'#16a085' },
];
const HEX = /^#[0-9a-f]{6}$/i;

// repère de la catégorie n° i : A, B, C… (au-delà de Z : 27, 28…)
export const catCode = i => i >= 0 && i < 26 ? String.fromCharCode(65 + i) : String(i + 1);

// liste venue d'un setup / d'un lien : bornée et nettoyée (ids uniques, couleur valide)
export function cleanCats(list) {
  if (!Array.isArray(list)) return [];
  const out = [], ids = new Set();
  for (const c of list) {
    if (out.length >= CAT_LIMIT) break;
    if (!c || typeof c !== 'object') continue;
    const id = String(c.id || '').replace(/[^\w-]/g, '').slice(0, 24);
    if (!id || ids.has(id)) continue;
    const name = String(c.name ?? '').trim().slice(0, 40) || 'Catégorie';
    ids.add(id);
    out.push({ id, name, col:HEX.test(c.col) ? c.col : '#6b7280', mark:!!c.mark });
  }
  return out;
}

// couleur proposée pour une nouvelle catégorie : la première des préréglages pas encore prise
export function nextCatColor(cats) {
  const used = new Set(cats.map(c => c.col.toLowerCase()));
  return (CAT_PRESETS.find(p => !used.has(p.col)) || CAT_PRESETS[cats.length % CAT_PRESETS.length]).col;
}

// mise en page de la légende du bandeau (unités de bandeau) :
// groups = [{ head?:{ label }, items:[{ label }] }] ; chaque catégorie (head) commence une nouvelle ligne,
// ses éléments suivent sur la même ligne et passent à la ligne (en retrait) quand ils débordent de maxX.
export const LEG_ROW = 0.8;
export const legItemW = label => 1.4 + (label.length + 1) * 0.22;
export const legHeadW = label => 1.1 + label.length * 0.27 + 0.5;
export function legendLayout(groups, x0, maxX) {
  const els = []; let x = x0, y = 0, any = false;
  for (const g of groups) {
    if (!g.items.length && !g.head) continue;
    let start = x0;
    if (g.head) {
      if (any) { x = x0; y += LEG_ROW; }
      const w = legHeadW(g.head.label); els.push({ t:'head', x, y, w, ...g.head }); x += w; start = x0 + 0.6;
    }
    for (const it of g.items) {
      const w = legItemW(it.label);
      if (x + w > maxX && x > start) { x = start; y += LEG_ROW; }
      els.push({ t:'item', x, y, w, ...it }); x += w;
    }
    any = true;
  }
  return { els, bottom:y };
}

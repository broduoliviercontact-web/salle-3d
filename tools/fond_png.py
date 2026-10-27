# Génère plan_fond.png (aperçu bitmap du fond de plan pour l'éditeur 2D) à partir de plan_fond.svg.
# Le SVG complet (≈ 10 Mo) est trop lourd à redessiner à chaque mouvement dans le navigateur.
# Usage : python3 tools/fond_png.py   (Playwright + Chromium). À relancer si plan_fond.svg change.
import asyncio, os, re
from playwright.async_api import async_playwright
PX_PER_M = 24
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
async def main():
    svg = open(os.path.join(ROOT, 'plan_fond.svg')).read()
    _, _, w, h = map(float, re.search(r'viewBox="([^"]+)"', svg).group(1).split())
    W, H = round(w * PX_PER_M), round(h * PX_PER_M)
    svg = svg.replace('<svg ', f'<svg width="{W}" height="{H}" ', 1)
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':W, 'height':H})
        await pg.set_content(f'<html><body style="margin:0">{svg}</body></html>', timeout=600000)
        await pg.screenshot(path=os.path.join(ROOT, 'plan_fond.png'), omit_background=True, timeout=600000)
        await b.close()
    print('plan_fond.png', W, 'x', H)
asyncio.run(main())

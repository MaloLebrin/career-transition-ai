# Images / assets

Dossier pour les images utilisées par le frontend (alias Vite `~/assets/images/`).

Le logo jumpUjob n'est plus une image : `inertia/components/ui/Logo.tsx` le dessine en SVG
inline (`ui/logo/LogoMark.tsx` galet sur plongeoir, `ui/logo/LogoBadge.tsx` pastille ronde
≤ 32 px), à partir des tracés de `ui/logo/logo_geometry.ts`. Les fichiers servis depuis
`public/` reprennent ces tracés :

- `public/logo.svg` (version claire), `public/logo-dark.svg` (version sombre, fond `#2D2A4A`),
  `public/favicon.svg` (cercle `#FFC53D`, U `#1F1400`).
- `public/favicon.ico` (16, 32, 48 px), `favicon-16x16.png`, `favicon-32x32.png` : la pastille.
- `public/apple-touch-icon.png` (180), `android-chrome-192x192.png`, `android-chrome-512x512.png` :
  la marque complète sur fond crème `#FFFDF5`. Copies dans ce dossier.
- `logo.png` — ancien logo « Transition Carrière » (2000 × 2000), conservé pour archive.

Régénérer les PNG après un changement de tracé (Chrome headless, aucune dépendance) :

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --default-background-color=00000000 --window-size=512,512 --screenshot=public/android-chrome-512x512.png page.html
```

où `page.html` affiche le SVG à la taille voulue (`<img src="icon.svg" style="width:512px;height:512px">`).

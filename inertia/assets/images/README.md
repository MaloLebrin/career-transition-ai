# Images / assets

Dossier pour les images utilisées par le frontend (alias Vite `~/assets/images/`).

- `logo.png` — source d'origine (2000 × 2000, fond opaque, wordmark incrusté). Ne pas l'afficher telle quelle.
- `logo-mark.png` — icône seule, fond transparent, 256 × 256, consommée par `inertia/components/ui/Logo.tsx` (le wordmark « Transition Carrière » est rendu en texte, `APP_NAME`).
- `android-chrome-*.png` — copies des icônes PWA servies depuis `public/` (favicons, `apple-touch-icon`, `site.webmanifest`), générées depuis `logo-mark.png` sur une tuile ivoire `#f7f5ee` (les PNG actuels datent de la tuile crème `#faf8f4`, écart imperceptible).

Pour régénérer les icônes après un changement de logo (ImageMagick) :

```bash
convert inertia/assets/images/logo-mark.png -resize 160x160 -background '#f7f5ee' -gravity center -extent 192x192 public/android-chrome-192x192.png
```

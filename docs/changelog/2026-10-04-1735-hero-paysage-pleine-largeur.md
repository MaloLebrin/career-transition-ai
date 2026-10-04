# 2026-10-04 — Hero : le paysage prend toute la largeur

Le paysage du hero de la page d'accueil sort du conteneur marketing : il s'étend désormais
sur toute la largeur de la fenêtre (sans arrondi ni ombre, simple filet en bas), avec une
hauteur fixe par palier (`h-52` → `xl:h-96`) pour ne pas devenir démesuré sur grand écran.
Le contenu du hero (titre, actions, aperçu) reste dans le conteneur.

- `inertia/components/landing/sections/HeroSection.tsx`
- `tests/inertia/components/LandingPage.spec.tsx` : assertion alignée (`w-full`).

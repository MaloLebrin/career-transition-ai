# 2026-10-04 — Landing cabinet : icônes et animations à la Stripe

- Hero : entrée en cascade du contenu (`animate-slide-up`, retards), points de preuve avec
  icônes, aperçu produit qui flotte et deux puces flottantes (desktop seulement, décoratives).
- Parcours : une icône par exercice, apparition en cascade au scroll (`Reveal`), survol
  (élévation, icône qui pivote).
- Méthode et IA : cartes en `Reveal`, `FeatureCard` avec élévation et tuile d'icône animée au survol.
- Tout est coupé par `prefers-reduced-motion` (couche base de `app.css`).

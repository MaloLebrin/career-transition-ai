# 2026-10-10 — Refonte marketing, lot 4 : tarifs et « Qui sommes-nous »

- **`/tarifs`.** `PageHero` avec la carte du forfait cerclée du maillage animé (`TiltCard`),
  tableau « Gratuit / Forfait » (`individuals/PlanComparison`, dérivé des exercices offerts),
  FAQ en accordéon (`marketing/FaqAccordion`, `<details>` natif, rendu SSR complet).
- **`/cabinets/tarifs`.** `PageHero`, trois offres en apparition échelonnée et inclinables,
  l'offre mise en avant cerclée du maillage, FAQ en accordéon.
- **`/qui-sommes-nous`.** `PageHero` illustré par le paysage `LandscapeArt` (variante `hero`),
  approche en cartes teintées animées. La page passe par `PageSeo` (description et balises
  Open Graph, absentes jusqu'ici).
- **Tests.** `FaqAccordion.spec.tsx`, `individuals/PlanComparison.spec.tsx`, specs des pages
  `Pricing` et `AboutUs`.

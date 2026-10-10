# 2026-10-10 — Refonte marketing, lot 3 : espace cabinets

- **`/cabinets`.** Héros sur maillage animé avec le tableau de bord conseiller vivant
  (`mockups/AdvisorDashboardMockup`, initiales fictives seulement), bandeau de chiffres clés
  (8 exercices, aucun nom transmis à l'IA, hébergement UE, réponse sous 48 h ouvrées), onglets
  « Le quotidien du conseiller » (suivi, synthèse assistée relue, livrables), méthode en cartes
  inclinables, section IA illustrée par l'analyse relue par le conseiller.
- **`/offre`, `/methodologie`.** Héros secondaire commun `marketing/PageHero` (maillage atténué),
  sections en apparitions échelonnées, aperçu du portail sur `/offre`, étapes avant / pendant /
  après reliées sur `/methodologie`.
- **Nettoyage.** `ProductMockup` (statique) et `ui/Reveal` retirés au profit des mockups vivants
  et de `RevealGroup` / `RevealItem` ; `ExerciseCatalogue` migré (supprime l'écart d'hydratation
  SSR de `Reveal`).
- **Tests.** `PageHero.spec.tsx`, mockups, `CabinetLandingPage.spec.tsx` (chiffres clés, onglets).

# 2026-10-10 — Refonte marketing, lot 2 : accueil particuliers

- **Héros.** `IndividualsHero` : maillage animé sous l'en-tête transparent (`HeroBackdrop`),
  promesse, CTA inchangés (inscription ou liste d'attente), parcours qui se complète dans un
  mockup incliné (`JourneyMockup`, `Parallax`). Le paysage n'est plus en tête de page.
- **Nouveaux blocs.** `KeyFactsStrip` (8 exercices, 2 offerts, prix réel du forfait,
  hébergement UE), `FeatureTabs` (exercices, analyse IA, synthèse, expert, chacun avec son
  mockup vivant), `StepsTimeline`, `PrivacyFlow` ; mockups dans `marketing/mockups/`, animés
  par `inertia/hooks/use_mockup_step.ts`. Icônes d'exercices extraites dans
  `marketing/exercise_icons.ts`.
- **Accueil.** `IndividualsPage` recomposé : héros, chiffres clés, onglets, catalogue, étapes
  - forfait (`TiltCard`), confiance, encart cabinet, contact, `CtaBand`.
- **Tests.** Specs de chaque bloc et mockup, `IndividualsPage.spec.tsx` (onglets au clavier).

# 2026-10-02 — B2C : page `/particuliers`, bloc « Particuliers » des tarifs, navigation publique (#99)

Présenter l'offre particuliers (deux exercices gratuits, forfait unique, accompagnement
par un expert) sans brouiller la page tarifs des cabinets, qui reste en HT.

- **Page `/particuliers`.** `inertia/components/marketing/IndividualsPage.tsx` +
  `inertia/pages/Individuals.tsx`, route `guest` dans `start/routes/public.ts` :
  promesse, carte des deux exercices offerts (`B2C_FREE_EXERCISE_TYPES`), trois arguments,
  « comment ça marche », carte forfait (prix TTC de la prop partagée `billing`, défaut
  `DEFAULT_RESULTS_PRICE_CENTS` sinon, inclus / non inclus, liens CGV et confidentialité).
  CTA « Commencer gratuitement » vers `/inscription` quand `b2cRegistrationEnabled` ;
  sinon formulaire de contact « Être prévenu de l'ouverture ».
- **Tarifs.** `PricingPage` : section « Vous êtes un particulier ? » (carte forfait TTC,
  paiement unique, CTA vers `/particuliers` et `/inscription` si ouvert) ; libellé HT
  explicitement limité aux cabinets (chapeau et FAQ TVA).
- **Navigation.** « Particuliers » dans `MARKETING_NAV` (en-tête, menu mobile, pied de page
  via `FOOTER_COLUMNS`), `INDIVIDUALS_ACTION` ; lien secondaire sous les actions du hero
  de la landing. SEO : `noindex` par défaut conservé (`config/seo.ts`).
- **Design system.** Tokens et primitives uniquement (`SectionHeading`, `FeatureCard`,
  `BulletList`, `Card dark` avec `accent-on-ink`, `Badge sun`, `CtaBand`).
- **Tests.** Vitest `IndividualsPage` (ouvert / fermé, liens), page `Individuals`, `Pricing`
  (bloc particuliers, prix de la prop, inscription fermée), `config/marketing` ; functional
  `public/public_pages.spec.ts` (`/particuliers`).
- **Docs.** `docs/FEATURES.md` § 1.1 (acquisition B2C), `README.md`.

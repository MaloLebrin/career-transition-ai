# 2026-10-04 — Site public : le parcours particulier en premier, l'espace cabinet sur /cabinets

Suite de l'épic B2C (#90) : le site parlait encore d'abord aux cabinets. Le parcours
particulier devient le chemin principal ; les cabinets gardent leurs pages, leur connexion
et leur inscription derrière des liens dédiés. Aucun changement backend d'auth ni de flags.

- **Routes** (`start/routes/public.ts`). `/` = accueil particuliers (`home`), `/tarifs` = forfait
  particuliers TTC, `/cabinets` (landing cabinet) et `/cabinets/tarifs` (grille HT) dans le
  groupe `guest`. `/particuliers` redirige en 301 vers `/`.
- **Navigation** (`inertia/config/marketing.ts`). `MARKETING_NAV` (particuliers), `CABINET_NAV` et
  `CABINET_HEADER` (en-tête des pages `/cabinets`, `/cabinets/tarifs`, `/offre`,
  `/methodologie`), actions `REGISTER_ACTION` / `WAITLIST_ACTION` / `CABINETS_ACTION`. Pied
  de page en trois colonnes (Particuliers, Cabinets, Légal).
- **En-tête.** Action principale « Commencer gratuitement » quand `b2cRegistrationEnabled`,
  « Être prévenu de l'ouverture » sinon.
- **Accueil.** `IndividualsPage` (hero avec `LandscapeArt`, catalogue des exercices `#parcours`,
  forfait, confiance, renvoi vers `/cabinets`), blocs extraits dans
  `components/marketing/individuals/`, hook `use_results_price_label`.
- **Tarifs.** `PricingPage` (particuliers) ; l'ancienne grille devient `CabinetPricingPage`.
- **Connexion et inscriptions.** Connexion unique avec « Créer mon compte » (`/inscription`)
  puis « Espace cabinet » ; `/auth/register` retitrée « Création de compte cabinet » et liée
  depuis `/cabinets` (si `REGISTRATION_ENABLED`).
- **SEO.** Meta description et keywords du layout Edge orientés particuliers.
- **Tests.** Specs Vitest mises à jour ou ajoutées (config, header, footer, pages `home`,
  `Cabinets`, `CabinetPricing`, `Pricing`, `Login`, composants `individuals/*`, hook) ;
  functional `public_pages.spec.ts` (`/cabinets`, `/cabinets/tarifs`, redirection 301).

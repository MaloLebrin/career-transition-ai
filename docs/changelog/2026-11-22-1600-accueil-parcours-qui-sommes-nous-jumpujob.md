# 2026-11-22 — Accueil allégé, page /parcours et Qui sommes-nous jumpUjob

Suite de l'identité jumpUjob : l'accueil passe de neuf blocs à six (planche 47), les
descriptions d'exercices partent sur une nouvelle page `/parcours`, et « Qui sommes-nous »
présente l'équipe dans des bulles galet (planche 50). Le site garde le vouvoiement (décision du
22 novembre 2026, le tutoiement du brief est écarté) : « Sautez. On tient la rampe. ».

- **Accueil.** Héros « Le saut, oui. Le vide, non. » avec l'unique mockup « Mon parcours »,
  trois étapes en cartes jaune pâle, les huit exercices en pastilles (lien vers `/parcours`),
  le forfait en seul bloc prix (bandeau vert, carte 49 € TTC), confiance en trois colonnes,
  appel final. Retirés : chiffres clés, « Ce que vous obtenez », le second mockup et le bloc
  cabinets (l'espace cabinet reste dans l'en-tête et le pied de page). Le formulaire de liste
  d'attente reste affiché quand l'inscription est fermée. Titre de page : « Le saut, oui. Le
  vide, non. - jumpUjob ».
- **/parcours.** Nouvelle route publique : titre, phrase, les huit exercices (numéro, nom,
  description) et le bouton « Commencer gratuitement ». Le menu « Le parcours » y mène ;
  ajoutée au sitemap avec `/qui-sommes-nous`.
- **Qui sommes-nous.** Héros court, portraits de Clara et Malo découpés dans le galet du logo
  (`about/GaletPortrait`, couleur de secours et pastille d'initiale tant que les photos
  manquent), « Pourquoi ce nom », appel final. Noms de famille, intitulés et rôle d'expert à
  confirmer (`about/team.ts`).
- **Pastels.** `BRAND_PASTEL_CYCLE` / `brandPastel()` (`marketing/tints.ts`) : jaune, menthe,
  rose, ciel, vert, pour les pastilles, numéros et tags.
- **Nettoyage.** `IndividualsHero`, `StepsTimeline`, `PrivacyFlow` et `ExpertMockup`, devenus
  orphelins, sont supprimés avec leurs tests.
- **Tests.** Accueil, blocs `home/`, `/parcours`, Qui sommes-nous et `GaletPortrait` (Vitest) ;
  route `/parcours` dans `tests/functional/public/public_pages.spec.ts`.

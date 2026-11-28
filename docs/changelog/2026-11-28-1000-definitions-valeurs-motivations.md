# 2026-11-28 — Valeurs et Motivations : une définition pour chaque choix

Dans les exercices Valeurs et Motivations, le candidat choisissait parfois sans savoir
ce que recouvre un libellé (« La hauteur des enjeux stratégiques », « La conformité »…).

- **Pendant l'exercice.** Chaque option d'un duel Motivations affiche sa définition
  sous le libellé. Chaque carte Valeurs affiche une définition courte sous son nom
  (les mots-clés, le portrait et la situation restent) ; la liste « Votre hiérarchie »
  rappelle la définition.
- **Résultats.** Au survol, au focus clavier ou au tap, les libellés des résultats
  (5 premières / 5 dernières, classement, légende de la matrice, hiérarchie des
  valeurs) ouvrent une bulle avec la définition. Nouvelle primitive
  `ui/DefinitionTooltip` (`role="tooltip"`, Échap pour fermer).
- **Données.** `MOTIVATIONS` (`inertia/constants/motivations.ts`, `MOTIVATIONS_LIST`
  dérivé, libellés et ordre inchangés) et `definition` sur `SCHWARTZ_VALUES` ;
  recherche par libellé `motivationDefinition` / `valueDefinition`.
- **Design system.** `ValuesResultView` passe aux tokens (ligne de base
  `inertia/components/exercises` du cliquet abaissée à 253).
- **Correctif — reprise d'un exercice Motivations terminé.** Le résultat terminé était
  repris comme un brouillon : sans `currentI`/`currentJ`, l'outil affichait « NaN% »,
  « Duel NaN / 231 » et deux options vides. `motivationResumeState`
  (`#shared/helpers/exercise/motivation_resume`) calcule la reprise : brouillon → prochain
  duel non joué ; exercice terminé ou données invalides → écran d'accueil et matrice vide.
  Non-régression : helper, `MotivationTool`, et la page candidat rendue avec la charge
  utile réelle d'un exercice terminé (`HomeResumeCompleted.spec.tsx`).
- **Hors périmètre.** Le PDF de synthèse n'affiche pas les définitions.

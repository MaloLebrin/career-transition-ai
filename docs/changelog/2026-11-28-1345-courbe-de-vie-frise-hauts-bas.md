# 2026-11-28 — Courbe de vie : une frise des hauts et des bas, et un seed de démo représentatif

Le résultat de la courbe de vie était un graphique gradué de 0 à 10 (recharts),
et le seed de démo n'y plaçait que trois points. Il devient une **frise** : un
axe du temps au niveau neutre (5/10), une courbe lissée qui monte au-dessus pour
les hauts (rose) et descend au-dessous pour les bas (jaune), et un point par
événement sur l'axe, relié à la courbe.

- **Géométrie partagée.** `#shared/helpers/exercise/life_curve_timeline`
  (`normalizeLifeCurveEvents`, `buildLifeCurveTimeline`) calcule l'axe, la
  courbe, la surface à découper au-dessus et au-dessous de l'axe et les repères
  d'événements ; l'amplitude se cale sur le plus grand écart au neutre, avec un
  plancher (`LIFE_CURVE_MIN_AMPLITUDE` = 3) pour que de petites variations
  restent petites. `withYearLabels` choisit les années à écrire côté par côté,
  d'après l'écart entre voisins (événements irréguliers : pas de chevauchement). Lissage
  par `#shared/helpers/exercise/monotone_path` (cubique monotone, comme
  `curveMonotoneX` de d3 : la courbe passe par chaque point sans dépasser ni
  sommet ni creux). Échelle et intitulés des questions de réflexion dans
  `#shared/constants/life_curve`.
- **Page de résultat.** `LifeCurveTimeline` (SVG en tokens : `tint-blossom`,
  `tint-sun`, `ink` ; nom accessible qui résume la frise, points décoratifs
  (aucun élément focusable dans le `role="img"`) avec infobulle à la souris,
  défilement horizontal dans la carte sur mobile)
  et `LifeCurveEventList` (année, événement, niveau en pastille). Les cartes de
  réflexion affichent l'intitulé de la question au lieu de la clé brute
  (`mostlySatisfied`).
- **PDF de synthèse.** Même frise (`ClipPath` de `@react-pdf/renderer`, à
  identifiants uniques), liste des événements sur deux colonnes, les six
  réponses de réflexion avec leur intitulé. La carte de la courbe de vie peut
  passer à la page suivante (`WRAPPABLE_EXERCISE_TYPES`) : seules la frise et
  chaque ligne d'événement sont insécables, une longue carrière n'est plus rognée.
  Textes de légende partagés (`LIFE_CURVE_TEXTS`).
- **Seed de démo.** Quatorze événements annuels (2011–2024), calés sur le
  parcours des fiches de démo, avec trois vrais creux sous l'axe (2015, 2019, 2021) ; réflexion et analyse réécrites en cohérence. Rejouer :
  `node ace db:seed --files database/seeders/malo_exercise_seeder.ts`.
- **Tests.** Helpers `life_curve_timeline` (dont années irrégulières et
  plancher d'amplitude) et `monotone_path`, constantes, `LifeCurveResultView`
  (aucun élément focusable dans la frise), `ExerciseResultVisualization`, PDF
  d'une longue carrière (le nombre de pages suit la longueur de la liste) ; ligne de base du
  cliquet `design_tokens` abaissée (`inertia/components/exercises` : 230 → 225).

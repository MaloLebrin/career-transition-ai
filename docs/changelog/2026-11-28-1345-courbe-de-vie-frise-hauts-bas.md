# 2026-11-28 — Courbe de vie : une frise des hauts et des bas, et un seed de démo représentatif

Le résultat de la courbe de vie était un graphique gradué de 0 à 10 (recharts),
et le seed de démo n'y plaçait que trois points. Il devient une **frise** : un
axe du temps au niveau neutre (5/10), une courbe lissée qui monte au-dessus pour
les hauts (rose) et descend au-dessous pour les bas (jaune), et un point par
événement sur l'axe, relié à la courbe.

- **Géométrie partagée.** `#shared/helpers/exercise/life_curve_timeline`
  (`normalizeLifeCurveEvents`, `buildLifeCurveTimeline`) calcule l'axe, la
  courbe, la surface à découper au-dessus et au-dessous de l'axe et les repères
  d'événements ; l'amplitude se cale sur le plus grand écart au neutre. Lissage
  par `#shared/helpers/exercise/monotone_path` (cubique monotone, comme
  `curveMonotoneX` de d3 : la courbe passe par chaque point sans dépasser ni
  sommet ni creux). Échelle et intitulés des questions de réflexion dans
  `#shared/constants/life_curve`.
- **Page de résultat.** `LifeCurveTimeline` (SVG en tokens : `tint-blossom`,
  `tint-sun`, `ink` ; nom accessible qui résume la frise, un point focusable
  avec infobulle par événement, défilement horizontal dans la carte sur mobile)
  et `LifeCurveEventList` (année, événement, niveau en pastille). Les cartes de
  réflexion affichent l'intitulé de la question au lieu de la clé brute
  (`mostlySatisfied`).
- **PDF de synthèse.** Même frise (`ClipPath` de `@react-pdf/renderer`), liste
  des événements sur deux colonnes, les six réponses de réflexion avec leur
  intitulé.
- **Seed de démo.** Quatorze événements annuels (2011–2024), calés sur le
  parcours des fiches de démo, avec trois vrais creux sous l'axe (2015, 2019, 2021) ; réflexion et analyse réécrites en cohérence. Rejouer :
  `node ace db:seed --files database/seeders/malo_exercise_seeder.ts`.
- **Tests.** Helpers `life_curve_timeline` et `monotone_path`, constantes,
  `LifeCurveResultView`, `ExerciseResultVisualization` ; ligne de base du
  cliquet `design_tokens` abaissée (`inertia/components/exercises` : 230 → 225).

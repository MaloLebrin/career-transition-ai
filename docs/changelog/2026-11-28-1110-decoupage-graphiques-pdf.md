# 2026-11-28 — PDF de synthèse : un fichier par graphique d'exercice

`exercise_charts.tsx` dépassait 1 000 lignes (demande de revue de la PR #160). Aucun
changement de rendu : le code des graphiques est déplacé tel quel.

- **Aiguillage.** `exercise_charts.tsx` ne garde que `ExerciseChart` et `TYPES_WITH_CHART` ;
  `document.tsx` l'importe comme avant.
- **Graphiques.** Un fichier par exercice dans `app/services/employee_synthesis_pdf/charts/`
  (motivation, valeurs, personnalité, courbe de vie, cercle de contrôle, cartographie,
  ciblage) ; DISC en trois : `disc_radar`, `disc_wheel`, `disc_chart`.
- **Partagés.** `chart_helpers.ts` (`safeNum`, `safeArr`, `safeObj`, `SvgText`) et
  `disc_palette.ts` (couleurs DISC issues de `DISC_TRAIT_PALETTE`).
- **Tests.** Tests miroirs des deux modules partagés ; `styles.spec.ts` parcourt désormais
  les sous-dossiers pour continuer à vérifier les couleurs et styles des graphiques.

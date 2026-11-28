# 2026-11-28 — Motivations : les 3 premières et les 3 dernières à la place du podium

Sur le résultat de l'exercice Motivations (matrice de comparaison par paires), les
deux grandes cartes du haut faisaient office de podium : les 3 dernières motivations
y étaient numérotées 1-2-3, la moins motivante en premier.

- **Écran.** Un bloc « Vos 3 premières et 3 dernières motivations » remplace les deux
  cartes : deux colonnes sobres (tokens du design system), rangs réels 1-2-3 et
  20-21-22, dans l'ordre du classement. Classement complet et matrice inchangés.
- **PDF de synthèse.** Même correction : « Les 3 premières » / « Les 3 dernières »,
  avec le rang réel.
- **Helper.** `rankingExtremes` (`#shared/helpers/exercise/ranking_extremes`) calcule
  les deux listes sans chevauchement quand le classement est court.
- **Tests.** Helper, `MotivationRankingColumn`, et non-régression sur
  `MotivationResultView` (rangs 20-21-22, anciens titres absents).

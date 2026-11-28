# 2026-11-28 — Motivations : les 5 premières et les 5 dernières à la place du podium

Sur le résultat de l'exercice Motivations (matrice de comparaison par paires), les
deux grandes cartes du haut faisaient office de podium : top 3, et les 3 dernières
motivations numérotées 1-2-3, la moins motivante en premier.

- **Écran.** Un bloc « Vos 5 premières et 5 dernières motivations » remplace les deux
  cartes : deux colonnes sobres (tokens du design system), rangs réels 1 à 5 et
  18 à 22, dans l'ordre du classement. Classement complet et matrice inchangés.
- **PDF de synthèse.** Même correction : « Les 5 premières » / « Les 5 dernières »,
  avec le rang réel.
- **Helper.** `rankingExtremes` (`#shared/helpers/exercise/ranking_extremes`,
  `RANKING_EXTREMES_COUNT = 5`) calcule les deux listes sans chevauchement quand le
  classement est court.
- **Tests.** Helper, `MotivationRankingColumn`, et non-régression sur
  `MotivationResultView` (rangs 18 à 22, anciens titres absents).

# 2026-11-28 — Courbe de vie : seed de démo représentatif et tracé lissé dans le PDF

La courbe de vie du candidat de démo (Malo Lebrin, `malo_exercise_seeder`) ne
comptait que trois points (2018, 2021, 2024) : un simple « V » qui ne montrait
ni le lissage du graphique ni ce qu'un vrai parcours donne à l'écran et dans le
PDF de synthèse.

- **Données.** Quatorze points, un par année de 2011 à 2024, calés sur le
  parcours des fiches de démo (Portique club, master de psychologie, Le Reacteur,
  kiss my, Zenika) : deux creux (2015, 2019), une rechute en 2021, puis une
  montée continue jusqu'au projet de formateur.
- **Réflexion et analyse.** Les six réponses de réflexion et l'analyse
  qualitative sont réécrites pour décrire cette courbe (l'ancien texte évoquait
  un employeur absent du parcours).
- **PDF lissé.** Le graphique de la courbe de vie du PDF de synthèse reliait
  les points par des segments droits (`Polyline`), alors que la page web les
  lisse (recharts `type="monotone"`). Il trace désormais un `Path` cubique
  monotone (`charts/monotone_path.ts`, même algorithme que `curveMonotoneX` de
  d3) : la courbe passe par chaque point sans jamais dépasser un sommet ni un
  creux.
- **Tests.** `tests/unit/services/employee_synthesis_pdf/charts/monotone_path.spec.ts`
  (passage par chaque point, pas de dépassement, tangente plate aux extrêmes,
  pas de `NaN` sur deux années identiques).
- **Rejouer.** `node ace db:seed --files database/seeders/malo_exercise_seeder.ts`
  (idempotent, `updateOrCreate`).

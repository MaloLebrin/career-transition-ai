# 2026-11-28 — Seed de démo : une courbe de vie représentative

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
- **Rejouer.** `node ace db:seed --files database/seeders/malo_exercise_seeder.ts`
  (idempotent, `updateOrCreate`).

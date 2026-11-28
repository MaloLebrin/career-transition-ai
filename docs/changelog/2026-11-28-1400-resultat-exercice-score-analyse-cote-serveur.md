# 2026-11-28 — Enregistrement d'un exercice : score et analyse IA hors de portée du client (#168)

Le candidat (et le conseiller) pouvait envoyer lui-même `qualitativeAnalysis` et
`quantitativeScore` en enregistrant un exercice. Le texte forgé était lu comme
une « analyse IA » par le conseiller et, comme il existait déjà, le job
`AnalyzeExerciseQualitativeJob` le prenait pour l'analyse gratuite consommée :
la politique B2C « une analyse » et la relance au déverrouillage du forfait
étaient faussées.

- **Entrées client.** `saveExerciseResultValidator` n'accepte plus ces deux
  champs (VineJS les écarte), `ExerciseResultsController` (routes candidat et
  conseiller) ne les transmet plus, et `ExerciseResultsService.saveResult` ne
  les écrit plus : seul le job IA écrit `qualitativeAnalysis`. Une mise à jour
  conserve l'analyse et le score déjà enregistrés.
- **Score.** Le front envoyait toujours la constante `10`, sans lien avec les
  réponses : il n'est plus envoyé (paramètre retiré de `saveResult` dans
  `use_candidate_exercises` / `use_advisor_exercises`). La colonne reste pour
  les résultats existants ; les nouveaux résultats n'ont pas de score. La page
  Synthèse du conseiller n'affiche plus « Score: 0 » quand il n'y en a pas
  (le DTO renvoie `0` pour un score absent ; le PDF de synthèse le masquait déjà).
- **Tests.** Functional candidat (B2C, exercice gratuit : texte forgé ignoré,
  l'analyse gratuite a bien lieu, une relance forgée ne l'écrase pas) et
  conseiller ; unitaires du service (création, mise à jour, exercice
  verrouillé), du validator, des hooks et de la page Synthèse.

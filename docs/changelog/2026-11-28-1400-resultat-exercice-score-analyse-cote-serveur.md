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
  les écrit plus : seul le job IA écrit l'analyse.
- **Marqueur `analyzed_at`.** Nouvelle colonne posée par le job à chaque
  analyse produite (jamais en cas d'échec ni de réponse vide). La politique B2C
  « une analyse » s'appuie sur elle, et non plus sur la présence du texte.
- **Réponses modifiées.** Un résultat réenregistré avec d'autres réponses perd
  son ancienne analyse : elle décrivait les anciennes réponses. L'ancien front
  l'effaçait de fait en envoyant `''`. L'analyse est relancée si la politique le
  permet. Sinon (exercice gratuit déjà analysé), le résultat reste sans analyse
  jusqu'au déblocage du forfait, qui le relance (`onResultsUnlocked`). Les
  mêmes réponses, même avec des clés dans un autre ordre, gardent l'analyse.
- **Reprise des données (migration).** Les `qualitative_analysis = ''` laissées
  par l'ancien front redeviennent `NULL`, sinon le déblocage (`whereNull`) les
  ignorait. Les résultats déjà analysés reçoivent `analyzed_at = updated_at`.
- **Score.** Le front envoyait toujours la constante `10`, sans lien avec les
  réponses : il n'est plus envoyé (paramètre retiré de `saveResult` dans
  `use_candidate_exercises` / `use_advisor_exercises`) ni affiché (page
  Synthèse du conseiller, dossier PDF). Le `ScoreBlock` du PDF de synthèse,
  jamais rendu puisque chaque type a son graphique, est supprimé. La colonne
  reste en base, sans plus être lue pour l'affichage.
- **Tests.** Functional candidat (B2C, exercice gratuit : texte forgé ignoré,
  l'analyse gratuite a bien lieu, une relance forgée ne l'écrase pas ; réponses
  modifiées : ancienne analyse effacée) et conseiller. Unitaires du service
  (réponses identiques ou modifiées, B2C et B2B, exercice verrouillé), du
  déblocage, du validator, de la reprise de données, de `resultMetaLine`, des
  hooks et de la page Synthèse. Intégration du job (marqueur, réponse vide).
  La ligne de base `brand-*` de `inertia/pages` passe à 365.

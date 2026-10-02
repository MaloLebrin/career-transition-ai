# 2026-10-02 — La durée d'exercice inclut l'analyse IA

La durée enregistrée s'arrêtait à la validation du formulaire. L'appel au
modèle, souvent plusieurs secondes, n'était pas ajouté à `exercise_results.duration`.

- **Job.** `AnalyzeExerciseQualitativeJob` mesure l'appel IA et additionne ces
  secondes à la durée déjà passée sur l'exercice, y compris si la génération échoue.
- **Tests.** Un passage du fournisseur nul dont l'horloge avance de 12 s fait
  passer une durée de 40 s à 52 s.

# 2026-10-02 — La durée d'exercice n'inclut plus l'analyse IA

La durée enregistrée doit refléter uniquement le temps passé par
l'utilisateur sur l'exercice. L'appel au modèle, en arrière-plan, n'y
entrait pas.

- **Job.** `AnalyzeExerciseQualitativeJob` n'ajoute plus les secondes de
  l'appel IA à `exercise_results.duration`, que la génération réussisse ou
  échoue. Seul le texte d'analyse (ou le message d'erreur) est écrit.
- **Tests.** Un appel qui avance l'horloge de 12 s laisse une durée de 40 s
  inchangée, y compris en cas d'échec du fournisseur.

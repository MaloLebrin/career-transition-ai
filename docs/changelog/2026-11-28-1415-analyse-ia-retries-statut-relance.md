# 2026-11-28 — Analyse IA : retries, statut `failed` et relance par le conseiller (#171)

Un échec du fournisseur IA (Mistral indisponible, clé invalide, réponse vide)
était attrapé puis avalé par `AnalyzeExerciseQualitativeJob` : le job passait
pour réussi, `maxRetries` ne jouait jamais, Sentry ne voyait rien et l'analyse
était perdue sans que le conseiller le sache.

- **Cause.** `try/catch` autour de `provider.completeText` qui journalisait puis
  faisait `return`.
- **Correctif.** L'erreur est relancée : 3 essais au total (`ANALYSIS_MAX_RETRIES`
  = 2) avec un délai exponentiel (~30 s, ~1 min, plafond 5 min). Au dernier
  essai, le hook `failed()` pose le statut `failed` et appelle `reportError`
  (id du résultat seulement). Toujours aucun texte d'erreur dans
  `qualitative_analysis` (politique B2C).
- **Statut explicite.** Nouvelle colonne `exercise_results.qualitative_analysis_status`
  (`pending`, `done`, `failed`, `null` si non demandée), contrainte `CHECK`
  synchronisée avec `QUALITATIVE_ANALYSIS_STATUSES` ; la migration passe les
  analyses existantes en `done`. Factory (état `analysisFailed`) et seed de démo
  à jour.
- **Relance manuelle.** Page de résultat conseiller : bandeau « analyse en
  cours » ou « échec » avec bouton **Relancer l'analyse**
  (`QualitativeAnalysisStatusNotice`, `router.post`) →
  `POST /dashboard/conseiller/employees/:id/exercises/results/:type/analysis/retry`
  (`ExerciseResultsService.retryFailedAnalysis`, refus 409
  `QualitativeAnalysisNotRetryableError` si l'analyse n'est pas en échec ou si
  l'exercice B2C est verrouillé, 404 hors périmètre).
- **Tests.** Job (réessai puis succès, dernier essai → `failed` + `reportError`,
  B2C gratuit relançable, délai progressif), `MistralTextProvider` avec `fetch`
  simulé (erreurs HTTP, réponse vide, sans clé), service et route de relance,
  bandeau et page de résultat (Vitest), enum des statuts.
- **Doc.** `docs/AI_JOBS.md`.

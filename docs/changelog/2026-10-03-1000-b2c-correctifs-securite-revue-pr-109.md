# 2026-10-03 — Épic B2C : correctifs de sécurité issus de la revue de la PR #109

Correctifs de la revue de l'épic particuliers (B1, M5, M6 et mineurs). Le cloisonnement
de l'organisation plateforme par `advisorId` (M4) fait l'objet d'un lot séparé.

- **Canal Transmit `organizations/:orgId/pdf-exports` (B1).** Réservé au super admin et aux
  conseillers / admins / experts de l'organisation ; un candidat n'y est plus autorisé
  (`#utils/transmit_authorization`). Plus aucune diffusion sur ce canal pour l'organisation
  plateforme (candidats B2C), et `fileName` (nom du candidat) retiré de la charge utile
  d'organisation ; le propriétaire de l'export garde la charge complète sur `users/:id/pdf-exports`.
  `broadcastPdfExportUpdatedToUsers` est désormais asynchrone.
- **Changement d'e-mail du candidat (M6).** `emailVerifiedAt` repassé à `null`, `employees.email`
  aligné sur `users.email`, lien de vérification renvoyé, le tout réservé aux fiches `accountType`
  `b2c` (les candidats B2B gardent leur comportement d'avant : aucun reset, aucun lien).
- **Analyse IA gratuite (M5).** `saveDraft` n'efface plus `qualitativeAnalysis` (un retour
  completed → draft ne rouvre plus le droit à une analyse). Nouveau `throttleExerciseSave`
  (60/min par compte) sur les sauvegardes d'exercice candidat.
- **Job d'analyse IA.** Logger au lieu de `console.error` ; le droit B2C est revérifié à
  l'exécution (`shouldRunAiAnalysis`) ; les notifications sont hors du `try` ; plus de texte
  d'erreur dans `qualitativeAnalysis` (le déverrouillage `onResultsUnlocked` peut ainsi relancer
  une analyse échouée).
- **Routes.** Ids du back-office super admin contraints par `router.matchers.number()` ;
  `session_id` du retour Stripe validé (`checkoutSuccessValidator`).
- **Tests.** Autorisation Transmit, événements PDF, profil candidat, service d'exercices, job,
  limiteur, validator, contrôleur de facturation, 404 sur ids non numériques.

# 2026-10-13 — Actions du conseiller sur la fiche candidat (#72)

Le conseiller ne pouvait ni renvoyer une invitation depuis l'interface, ni archiver un candidat,
ni réinitialiser un exercice, ni traiter un export PDF en échec.

- **Renvoi d'invitation.** Bouton « Renvoyer l'invitation » sur la fiche tant que le candidat n'est
  pas onboardé (route existante). L'erreur « déjà onboardé » devient `EmployeeAlreadyOnboardedError`
  (409) rendue par `handler.ts` ; le `try/catch` du contrôleur disparaît (ligne de base
  `controllers_thin` abaissée).
- **Archivage.** `POST /employees/:id/archive` et `/restore` (`EmployeesService.archive/restore`) :
  statut `archived`, réversible, aucune donnée supprimée. La restauration remet `active`, ou
  `onboarding` si le compte n'est pas activé. La suppression définitive reste le droit à l'effacement
  (`node ace candidate:purge`).
- **Réinitialisation d'un exercice.** `DELETE /employees/:id/exercises/results/:type`
  (`ExerciseResultsService.resetForEmployee`) : supprime résultats et brouillons du type, et les notes
  liées (cascade) ; les étapes du plan ne sont pas modifiées. Bouton avec confirmation sur le détail
  d'un résultat.
- **Exports PDF en échec.** `POST /synthesis/pdf/:exportId/retry` (même ligne remise en attente, job
  relancé) et `DELETE /synthesis/pdf/:exportId`, réservés au statut `failed`
  (`PdfExportNotFailedError`, 409) ; export d'un autre candidat ou d'une autre organisation → 404.
  Boutons sur la page Synthèse.
- **Erreurs.** `employee_errors.ts`, `exercise_result_errors.ts`, `pdf_export_errors.ts`.
- **Tests.** Functional `conseiller/advisor_actions`, unit des trois services, Vitest des deux
  composants (`EmployeeAdvisorActions`, `ResetExerciseButton`) et des pages Détail, Synthèse, Résultat.

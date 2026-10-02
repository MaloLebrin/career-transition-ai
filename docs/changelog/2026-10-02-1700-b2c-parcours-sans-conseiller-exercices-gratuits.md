# 2026-10-02 — B2C : parcours sans conseiller, exercices gratuits en premier, politique d'analyse IA (#100)

Un particulier inscrit seul (épic #90) n'a pas de plan d'accompagnement : jusqu'ici
l'accès aux exercices n'était gaté que par le plan, il n'aurait eu accès à rien. Il
fait désormais **Motivations** et **Valeurs** gratuitement, voit leurs résultats, et
découvre les autres exercices verrouillés derrière le forfait.

- **Service.** `ExerciseAccessService.resolve(employee)` → `ExerciseAccess`
  (`shared/types/exercise/access.ts`) : branche B2B = règle historique du plan
  (déplacée depuis `ExerciseResultsService`, `lockedReason: 'plan'`), branche B2C =
  `b2c_access.ts` + `EntitlementsService` (`lockedReason: 'payment'`). Lectures pures
  partagées dans `shared/helpers/exercise_access.ts`.
- **Contrôleurs fins.** `ExerciseResultsController` (liste, page, brouillon, résultat
  candidat) passe par ce service ; les requêtes brouillon / complété migrent dans
  `ExerciseResultsService.findLatestDraft` et `findDraftOrCompletedForCandidate` —
  ligne de base `controllers_thin` 10 → 6. `DashboardController.candidatHome` lit la
  fiche via `EmployeesService.findEmployeeForUser(user, { withAdvisor: true })` (3 → 2)
  et expose `advisor: { name } | null` et `exerciseAccess`.
- **Liste et page d'exercice.** Exercices gratuits d'abord pour un B2C
  (`orderExercisesForB2c`), props `lockedReason`, `accountType`, `exerciseAccess` ;
  exercice du forfait non payé → page bloquée « Cet exercice fait partie du forfait… »
  et POST refusés (flash « Cet exercice fait partie du forfait. »). Le B2B est inchangé.
- **Politique IA.** `saveResult` ne lance `AnalyzeExerciseQualitativeJob` que si
  `ExerciseAccessService.shouldRunAiAnalysis` l'autorise : B2B toujours ; B2C payé
  toujours ; exercice gratuit **une seule fois** (pas de relance si une analyse
  existe) ; verrouillé jamais. Le job notifie en plus le particulier B2C
  (`ai_analysis_ready_candidate`, lien vers l'exercice ; migration CHECK
  `notifications`, sujet d'e-mail, icône dans `NotificationItem`).
- **Front (design system Duna × Ditto).** `inertia/components/dashboard/b2c/` :
  `B2cEmployeeHome` (encre pour l'en-tête, progression, bloc « Votre expert : X »,
  conseils seulement si `advisorNotes`, pas de feuille de route), `B2cExerciseGrid`
  (badges `sun` « Gratuit » / `lavender` « Inclus dans le forfait »), `LockedExerciseCard`
  (CTA « Débloquer » vers `/dashboard/candidat/offre` si `STRIPE_ENABLED`, sinon
  « Bientôt disponible »). `Home.tsx` choisit selon `user.accountType` ; `List.tsx`
  migré sur les tokens (cliquet `inertia/pages` 458 → 448) ; `exercises/Home.tsx` rend
  le verrou « payment ».
- **Tests.** Functional `candidat/exercises.spec.ts` (section B2C : gratuit sans plan,
  verrouillé → page bloquée et POST refusés, payé → tout, ordre, analyse une seule fois)
  et `candidat/home.spec.ts` (B2C, expert assigné) ; unit `exercise_access_service`,
  politique IA et reprise de brouillon dans `exercise_results_service`, contrôleurs,
  `candidate_notifications_service`, `employees_service` ; integration job (B2C notifié,
  avec et sans expert) ; Vitest composants B2C, pages Home / List / exercice,
  helper `exercise_access`, constantes `b2c`.
- **Docs.** `docs/AI_JOBS.md` (politique B2C), `docs/FEATURES.md` (§ 11 parcours
  particulier), `CLAUDE.md`.

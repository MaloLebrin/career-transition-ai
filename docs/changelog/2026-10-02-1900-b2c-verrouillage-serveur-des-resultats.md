# 2026-10-02 — B2C : verrouillage côté serveur des résultats sur tous les points de fuite (#101)

Un particulier qui n'a pas réglé le forfait ne doit recevoir **aucune** donnée de
résultat payante : réponses, scores, analyses IA, synthèse, PDF. Un flou CSS ne
suffit pas, les props Inertia restent lisibles dans l'onglet réseau. Les candidats
B2B sont strictement inchangés.

- **Mapper.** `app/mappers/results_access_mapper.ts` : `redactExerciseResult(s)` et
  `redactEmployeePayload(payload, access)` (formes `EmployeeTransformer` et
  `mapEmployee`, type normalisé) — exercice verrouillé → `data: {}`, score 0, analyse
  retirée, `locked: true` ; analyse seule réservée → `analysisLocked: true`
  (`ExerciseResultDto`, `inertia/types/exercise_result.ts`).
- **Appliqué** dans `DashboardController.candidatHome`,
  `ExerciseResultsController.showDashboardCandidat` (les deux rendus ; un exercice
  verrouillé n'est jamais pré-rempli), `EmployeesController.showProfileDashboard`
  (profil du particulier connecté ; les conseillers voient tout) et
  `showStepDetailCandidat` (étape assignée par un expert).
- **Synthèse.** `EmployeeSynthesisService.candidateCanView(employee, synthesis, entitlement)` :
  B2B une fois partagée, B2C dès le forfait réglé. `showCandidate` → `shared: false`
  + `lockedReason: 'payment'` (page : `ResultsLockedCard`) ; `generateShareablePdfCandidate`
  → `ResultsLockedError` (403) pour un B2C non payé, autorisé sans partage une fois
  payé. Requêtes `Employee` / `EmployeeSynthesis` / `PdfExport` du contrôleur
  migrées dans le service (`getCandidateEmployee`, `findRow`, `findLatestPdfExport`,
  `requestPdfExport`) — ligne de base `controllers_thin` **11 → 4**.
- **PDF.** `PdfExportDownloadsService.findFor` : particulier sans droit → 404 (comme
  un export inexistant). `GenerateEmployeeSynthesisPdf` : échec propre
  (`FAILED`, motif explicite, sans PDF ni relance) si le droit a disparu entre la
  demande et l'exécution.
- **IA assistée.** `AiAssistService.assertResultsAccess(user)` : `/dashboard/ai/skill-mapping`
  et `/dashboard/ai/targets` → 403 pour un B2C non payé ; `/dashboard/ai/cv` reste libre.
- **Front.** `inertia/components/dashboard/b2c/ResultsLockedCard.tsx` (bénéfices, prix TTC
  via la nouvelle prop partagée `billing` et `formatPrice`, CTA « Débloquer mes résultats »
  vers `/dashboard/candidat/offre` si `STRIPE_ENABLED`, « Paiement bientôt disponible »
  sinon), utilisée sur la synthèse, l'exercice verrouillé et l'accueil B2C ;
  `StepDetailView` rend « Résultat réservé au forfait » pour un résultat `locked`.
  Hook `useBilling()`.
- **RGPD.** L'export de données (art. 15) reste **non expurgé** : c'est un droit
  d'accès, et l'analyse IA n'existe pas avant paiement pour les exercices verrouillés
  (`docs/RGPD.md` §4).
- **Tests.** Functional `candidat/results_lock.spec.ts` (accueil, exercice, profil, étape,
  synthèse, POST pdf, téléchargement : absence des données payantes non payé, présence
  payé / B2B) et `ai/ai_assist.spec.ts` (403) ; unit mapper, synthèse, téléchargements,
  job, contrôleurs ; integration middleware (`billing`) ; Vitest `ResultsLockedCard`,
  `Synthesis`, `StepDetail`, exercice, accueil B2C, `formatPrice`, `useBilling`.

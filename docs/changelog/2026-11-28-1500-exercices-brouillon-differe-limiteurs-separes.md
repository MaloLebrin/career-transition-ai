# 2026-11-28 — Exercices : brouillon différé et limiteurs séparés (#170)

L'enregistrement automatique des exercices envoyait un POST de brouillon à chaque
frappe. Au-delà d'une soixantaine de caractères par minute, le candidat voyait
« Trop de tentatives » pendant la saisie, et le clic « Terminer » pouvait recevoir
un 429 : ni résultat ni analyse IA. Le brouillon part désormais après une pause.

- **Cause.** Les outils (`ValuesTool`, `SkillMappingTool`, `MotivationTool`,
  `CircleOfControlTool`, `DISCTool`, `LifeCurveTool`) appelaient `onSaveDraft` à
  chaque changement d'état, et brouillon et résultat final partageaient
  `throttleExerciseSave` (60/min).
- **Hook `useExerciseDraft`** (`inertia/hooks/use_exercise_draft.ts`) : envoi
  différé de 1,5 s (plafonné à 10 s en saisie continue), dédoublonné par clé JSON,
  brouillon en attente envoyé au démontage, hydratation unique depuis
  `initialDraftPromise` (l'état hydraté n'est pas renvoyé), `cancel()` appelé avant
  le résultat final. `useExerciseTimer` remplace le calcul de durée copié dans huit
  outils.
- **Hook `useExercises({ employee, basePath, onComplete })`** : fusion de
  `useCandidateExercises` et `useAdvisorExercises`. Les brouillons partent en visite
  Inertia asynchrone (ils n'interrompent plus le résultat final) ; `inertiaPost` se
  résout dans `onFinish` (`success` / `error` / `cancelled`) : une visite annulée ne
  laisse plus l'écran « analyse en cours » bloqué.
- **Limiteurs.** `throttleExerciseDraft` (60/min) et `throttleExerciseResult`
  (20/min) ont des compteurs distincts : l'autosave n'épuise jamais le quota de
  « Terminer ».
- **Types.** Props des outils typées par `ExerciseToolProps<TResult, TDraft>` et
  les brouillons de chaque exercice (`shared/types/exercise/tool.ts`), au lieu de
  `any`.
- **Tests.** Vitest avec timers simulés (100 modifications rapides → un seul POST,
  envoi au démontage, hydratation, promesse résolue après annulation) ; functional :
  le résultat final passe quand le quota de brouillon est épuisé, et a son propre
  quota.

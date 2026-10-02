# 2026-10-02 — Fix du build de prod : `.catch` sur le dispatch du job d'analyse

Le `node ace build` échouait en prod (TS2339) : le dispatch du job d'analyse qualitative est un `JobDispatcher` awaitable, pas une `Promise`.

- **Cause.** `analysis.catch(...)` appelé directement sur le `JobDispatcher`.
- **Correctif.** `Promise.resolve(analysis).catch(...)` dans `exercise_results_service.ts` ; comportement inchangé (lancement en arrière-plan, erreur loguée).

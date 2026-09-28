# 2026-09-28 — Retrait du déploiement Render

Le scénario « usage perso » sur Render Free + Neon n'est plus maintenu : le seul
déploiement supporté est la VM docker-compose (`deploy/`, `docs/DEPLOYMENT.md` §2).

- **Suppressions.** `render.yaml` et sa garde `tests/unit/hygiene/render_blueprint.spec.ts`.
- **Env.** `RENDER_GIT_COMMIT` retirée du schéma (`start/env_schema.ts`) ; la release Sentry
  vient uniquement de `SENTRY_RELEASE` (`config/error_tracking.ts`).
- **Docs.** Procédure Render + Neon retirée de `docs/DEPLOYMENT.md` (§1 marqué « retiré »,
  numérotation conservée pour les ancres), mentions Render retirées de `docs/QUEUES.md`,
  `docs/README.md` et de l'état des lieux de `docs/hosting.md` (l'analyse comparative des
  hébergeurs reste en l'état).
- **Tests.** `tests/unit/config/env_schema.spec.ts` et `tests/unit/hygiene/file_storage.spec.ts`
  n'attendent plus de variable ni de fichier Render.

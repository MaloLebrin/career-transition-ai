# 2026-09-27 — Image Docker durcie et construite en CI

Issue #14 : le `Dockerfile` n'avait jamais été construit ; il l'est désormais à
chaque PR, et l'image tourne comme en production.

- **Image.** Le stage `runner` ne contient que `build/` et ses dépendances de
  production (même installation que `smoke-prod-build`), avec
  `NODE_ENV=production HOST=0.0.0.0 PORT=8080`, `USER node` et un
  `HEALTHCHECK` sur `/health`. Le build Alpine passe sans outillage natif.
- **Entrypoint.** Modes `server` (sans migration), `worker`, `migrate` et `seed`
  (super admin), tous en `exec`. Les migrations deviennent une étape explicite
  du déploiement au lieu de tourner à chaque démarrage du web.
- **Dépendances.** `@google/genai` (aucun import) est retiré.
- **Contexte de build.** `.dockerignore` exclut aussi `docs/`, `.github/`,
  `.claude/`, `.cursor/`, `.husky/` et `clevercloud/` (`tests/` reste : requis
  par `bin/test.ts` au build).
- **CI.** Nouveau job `docker-image` : build, `migrate`, `seed`, `server`, puis
  `/health` 200, utilisateur `node` et HEALTHCHECK `healthy`.
- **Tests.** Garde statique `tests/unit/hygiene/dockerfile.spec.ts`.
- **Docs.** DEPLOYMENT §0.7 (modes, vérification locale, rollback via
  `--entrypoint node … ace.js`), hosting §1.6 et §3.2.

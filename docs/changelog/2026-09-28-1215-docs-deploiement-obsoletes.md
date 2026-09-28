# 2026-09-28 — Docs de déploiement : Clever Cloud retiré, blueprint Render Free, liens morts (#20)

Plusieurs documents décrivaient un déploiement inexistant : guide Clever Cloud
(workflow, script et variables absents du repo), blueprint Render en plans payants
avec base Render et worker, index `docs/README.md` pointant vers six pages jamais
écrites, providers IA `gemini`/`openai` supprimés du code.

- **Clever Cloud.** `docs/clever-cloud.md` et `clevercloud/post-build.sh` supprimés : aucun
  scénario du runbook ne l'utilise.
- **Render.** `render.yaml` décrit désormais le scénario 1 de `docs/DEPLOYMENT.md` : un web
  service Free, base Neon (`DB_URL`, `DB_SSL`), `QUEUE_DRIVER=sync`, migrations et seed au
  démarrage, health check `/health`, `MAIL_PROVIDER=console`. `docs/render-deployment.md`
  (blueprint payant) est remplacé par un encadré « Blueprint » dans le §1.3 du runbook.
- **Index.** `docs/README.md` renvoie vers ce qui existe (README, `CLAUDE.md`,
  `start/env_schema.ts`, `database/schema.ts`, incidents du runbook, `CLOUDINARY.md`).
- **Contenus.** `QUEUES.md`, `AI_JOBS.md`, `FEATURES.md`, `ONBOARDING.md` : Mistral seul
  provider IA ; `PRODUCTION_CHECKLIST.md` : envoi d'e-mail et sauvegardes cochés ;
  `hosting.md` : état CI/CD et lancement au déploiement à jour.
- **Gardes.** `tests/unit/hygiene/docs_links.spec.ts` (aucun lien relatif mort dans les docs,
  plus de Clever Cloud) et `tests/unit/hygiene/render_blueprint.spec.ts` (plan Free, pas de base
  ni de worker Render, migrations avant le serveur, variables déclarées dans le schéma d'env).

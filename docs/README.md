# Documentation (source of truth)

Ce dossier contient la documentation “source of truth” du projet : **dev**, **ops/runbook**, et **parcours produit**.

## Démarrer (dev)

- **[Getting started](GETTING_STARTED.md)** — installer, configurer, lancer en local, tests.
- **[Configuration & env](CONFIGURATION.md)** — variables d’environnement (serveur vs front), DB, queue, mail, IA.
- **[Architecture](ARCHITECTURE.md)** — vue d’ensemble AdonisJS + Inertia/React, flux, jobs/queues.
- **[Schéma de données](DATABASE_SCHEMA.md)** — entités principales et règles métier (avec référence `database/schema.ts`).

## Parcours produit (support / métier)

- **[Cartographie fonctionnelle](FEATURES.md)** — vision produit par modules.
- **[Parcours utilisateurs](USER_FLOWS.md)** — parcours par rôle (super admin / conseiller / candidat) + points d’attention.
- **[Onboarding candidat](ONBOARDING.md)** — invitation, création mot de passe, onboarding profil.

## Sous-systèmes (référence)

- **[Emails](MAIL.md)** — abstraction provider-agnostic, Resend, variables et tests.
- **[Jobs d’analyse IA (serveur)](AI_JOBS.md)** — `AnalyzeExerciseQualitativeJob`, queue `ai`, `AI_PROVIDER`.
- **[Queues & scheduler](QUEUES.md)** — `@adonisjs/queue`, worker, scheduler, stratégie de test.

## Ops / Runbooks

- **[Déploiement — procédure pas à pas](DEPLOYMENT.md)** — correctifs préalables du repo, procédure Render + Neon (perso) et VM docker-compose (beta), mise à jour, rollback, sauvegardes, incidents.
- **[Hébergement à coût minimal](hosting.md)** — analyse des besoins réels (process, DB, env, SSE, disque), options gratuites / quasi-gratuites par scénario, travail préparatoire et checklist post-déploiement.
- **[Déploiement Clever Cloud](clever-cloud.md)** — build, run, worker, migrations, CI GitHub Actions.
- **[Runbook](RUNBOOK.md)** — procédures et incidents courants (DB, queue, mail, IA, seeds).
- **[Checklist prod](PRODUCTION_CHECKLIST.md)** — TODOs avant mise en production.

## Qualité

- **[Tests automatisés](TESTING.md)** — suites Japa (Postgres) et Vitest, base de test, shards de CI, couverture.
- **[Plan de tests manuels](MANUAL_TESTS.md)** — checklist de recette.

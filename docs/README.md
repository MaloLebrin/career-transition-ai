# Documentation (source of truth)

Ce dossier contient la documentation “source of truth” du projet : **dev**, **ops/runbook**, et **parcours produit**.

## Démarrer (dev)

- **[README du projet](../README.md)** — installation, base de test, commandes de tests.
- **[Conventions et architecture](../CLAUDE.md)** — stack AdonisJS + Inertia/React, arborescence, alias d'import, règles (contrôleurs fins, services, erreurs de domaine, tests).
- **Variables d'environnement** — schéma validé au boot dans [`start/env_schema.ts`](../start/env_schema.ts), valeurs de dev dans [`.env.example`](../.env.example), référence production dans [DEPLOYMENT.md §5](DEPLOYMENT.md#5-référence--variables-denvironnement-de-production).
- **Schéma de données** — généré par les migrations : [`database/schema.ts`](../database/schema.ts) (ne pas éditer à la main).

## Parcours produit (support / métier)

- **[Cartographie fonctionnelle](FEATURES.md)** — vision produit par modules.
- **[Onboarding candidat](ONBOARDING.md)** — invitation, création mot de passe, onboarding profil.

## Sous-systèmes (référence)

- **[Emails](MAIL.md)** — abstraction provider-agnostic, Resend, variables et tests.
- **[Jobs d’analyse IA (serveur)](AI_JOBS.md)** — `AnalyzeExerciseQualitativeJob`, queue `ai`, `AI_PROVIDER`.
- **[Queues & scheduler](QUEUES.md)** — `@adonisjs/queue`, worker, scheduler, stratégie de test.
- **[Stockage des fichiers](CLOUDINARY.md)** — Cloudinary (exports PDF, logo, documents candidat), accès privé, fake de test.

## Ops / Runbooks

- **[Déploiement — procédure pas à pas](DEPLOYMENT.md)** — correctifs préalables du repo, procédure VM docker-compose (beta), mise à jour, rollback, sauvegardes, incidents.
- **[Hébergement à coût minimal](hosting.md)** — analyse des besoins réels (process, DB, env, SSE, disque), options gratuites / quasi-gratuites par scénario, travail préparatoire et checklist post-déploiement.
- **[Incidents courants](DEPLOYMENT.md#4-incidents-courants)** — symptômes, causes et correctifs (DB, queue, mail, IA, hébergeurs).
- **[Checklist prod](PRODUCTION_CHECKLIST.md)** — TODOs avant mise en production.
- **[RGPD](RGPD.md)** — sous-traitants et flux de données, opt-out Mistral, durées de conservation, procédures d’accès et d’effacement (`candidate:export`, `candidate:purge`).

## Qualité

- **[Tests automatisés](TESTING.md)** — suites Japa (Postgres) et Vitest, base de test, shards de CI, couverture.
- **[Plan de tests manuels](MANUAL_TESTS.md)** — checklist de recette.

## Process

- **[Checklist de PR](process/pr-checklist.md)** — ce que l'auteur et le reviewer vérifient.
- **[Changelog](changelog/README.md)** — un fichier par modification (`YYYY-MM-DD-HHMM-slug.md`).

# Documentation

- **[Workflow d'onboarding candidat](ONBOARDING.md)** — Invitation par email, création du mot de passe via lien unique, accès au dashboard.
- **Queues AdonisJS (PostgreSQL)** — Traitement de tâches asynchrones avec `@adonisjs/queue` et backend database.

---

## Queues AdonisJS (PostgreSQL)

### Vue d’ensemble

L’application utilise le package expérimental **`@adonisjs/queue`** ([doc officielle](https://docs.adonisjs.com/guides/digging-deeper/queues)) avec l’**adapter Database** (PostgreSQL via Lucid).  
Objectifs :

- Déplacer les traitements lents/hors requête HTTP (ex. logs analytiques, exports, envois d’emails).
- Garder une API rapide en réponse utilisateur.
- Pouvoir programmer des tâches récurrentes (scheduler).

### Configuration

- **Package** : `@adonisjs/queue` (et sa dépendance `@boringnode/queue`).
- **Config** : `config/queue.ts`
  - `default: env.get('QUEUE_DRIVER', 'database')`
  - `adapters.database = drivers.database({ connectionName: 'postgres' })`
  - `locations: ['./app/jobs/**/*.ts']`
  - `worker.concurrency = 5`, `idleDelay = '2s'`, `gracefulShutdown = true`
- **Env** : dans `.env`

```bash
QUEUE_DRIVER=database
```

- **Providers / commands / preload** : dans `adonisrc.ts`
  - `commands`: `() => import('@adonisjs/queue/commands')`
  - `providers`: `() => import('@adonisjs/queue/queue_provider')`
  - `preloads`: inclut `#start/scheduler`

- **Tables SQL** : migration `1773043557052_create_queue_tables.ts`
  - crée `queue_jobs` et `queue_schedules`.

### Premier job : log d’export usage exercices

Un premier job existe dans `app/jobs/log_exercise_usage_export.ts` :

- Payload : `{ userId, from, to, organizationId }`
- Queue : `analytics`
- Comportement : écrit un log structuré via le logger Adonis quand un super admin déclenche un export d’usage des exercices.

Il est dispatché depuis `SuperAdminController.exerciseUsageExport` :

- Quand un super admin appelle l’export CSV (`/dashboard/super-admin/exercises-usage/export`), le controller :
  - construit la requête d’agrégation et le CSV,
  - **dispatch** le job `LogExerciseUsageExport` sur la queue `analytics`.

### Lancer le worker

Les jobs **ne sont traités que si un worker tourne**.

- Commande de base :

```bash
node ace queue:work
```

- Options utiles :
  - `--queue=analytics` : ne traiter que la queue `analytics`.
  - `--concurrency=10` : nombre de jobs traités en parallèle.

En production, lancer le worker via un process manager (PM2, systemd, conteneur séparé…) **en plus** du serveur HTTP :

- Exemple (PM2) : un process `web` (serveur HTTP) + un process `queue-worker` (`node ace queue:work --queue=analytics`).

### Scheduler (tâches planifiées)

Le fichier `start/scheduler.ts` est préchargé et sert à définir les jobs récurrents :

- On peut y utiliser les APIs de scheduling de `@adonisjs/queue` :
  - `MyJob.schedule(payload).cron('0 0 * * *').timezone('Europe/Paris')`
  - ou `MyJob.schedule(payload).every('5m')`
- Idéal pour :
  - nettoyage périodique,
  - génération de rapports réguliers,
  - notifications planifiées.

À ce stade, le fichier contient surtout un squelette / exemple commenté : il est prêt à recevoir de vrais schedules quand les besoins métier seront définis.

### Commandes Ace disponibles

Les commandes suivantes sont fournies par `@adonisjs/queue` :

- `node ace queue:work` : lance le worker de jobs.
- `node ace queue:scheduler:list` : liste les jobs planifiés.
- `node ace queue:scheduler:remove <id>` : supprime un schedule.
- `node ace queue:scheduler:clear` : supprime tous les schedules.

### Tests

Pour tester le dispatch de jobs sans exécuter réellement le worker, utiliser le fake adapter proposé par la doc officielle :

- `QueueManager.fake()` avant l’action à tester.
- `fake.assertPushed(MyJob, { payload: {...} })` ou `fake.assertNotPushed(MyJob)`.
- `QueueManager.restore()` en teardown de groupe de tests.

Cela permettra de couvrir les comportements suivants :

- Un job est bien dispatché dans les cas nominaux.
- Aucun job n’est dispatché dans les cas où l’action doit être synchrone ou annulée.

---

## TODO — Mise en production

Checklist des points à traiter avant ou pour la mise en production.

### Onboarding & emails

- [ ] **Envoi d’email réel** — Remplacer le stub dans `app/services/onboarding_notify_service.ts` par un vrai envoi (ex. `@adonisjs/mail`) pour les liens d’activation candidats.
- [ ] **(Optionnel) Doublon Employee** — En cas de ré-invitation (même email, pas encore onboardé), éviter de créer un second `Employee` : réutiliser celui existant (recherche par email + organisation) ou documenter le comportement actuel.

### Sécurité & configuration

- [ ] **Secrets et variables d’environnement** — Vérifier que les clés (session, DB, API externes) sont en env et jamais en dur.
- [ ] **HTTPS** — Forcer HTTPS et cookies sécurisés en production.
- [ ] **CORS / CSP** — Ajuster les en-têtes si l’app est consommée par un autre domaine ou intégrée en iframe.

### Qualité & robustesse

- [ ] **Tests** — Ajouter ou compléter les tests (onboarding, super admin, parcours critiques) pour limiter les régressions.
- [ ] **Monitoring / erreurs** — Mettre en place un suivi des erreurs 5xx et des lenteurs (ex. Sentry ou équivalent).
- [ ] **Logs** — Configurer le niveau de log et la rotation en production.

### Données & performance

- [ ] **Pagination** — Activer ou renforcer la pagination sur les listes (candidats, organisations, utilisateurs super admin) si le volume augmente.
- [ ] **Sauvegardes** — Planifier des sauvegardes régulières de la base de données.
- [ ] **Migrations** — Tester les migrations sur une copie de la prod avant déploiement.

### Fonctionnel

- [ ] **Messages utilisateur** — Vérifier les textes (flash, erreurs, emails) et les faire relire si besoin.
- [ ] **Design / responsive** — Contrôler les écrans clés sur mobile et tablette.

---

_À mettre à jour au fil des livraisons._

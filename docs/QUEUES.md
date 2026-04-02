# Queues & scheduler (AdonisJS, adapter Database)

## Vue d’ensemble

L’application utilise le package expérimental **`@adonisjs/queue`** ([doc officielle](https://docs.adonisjs.com/guides/digging-deeper/queues)) avec l’**adapter Database** (PostgreSQL via Lucid).

Objectifs :

- Déplacer les traitements lents/hors requête HTTP (ex. exports, envois d’emails, analyses IA).
- Garder une API réactive côté utilisateur.
- Exécuter des tâches récurrentes via un scheduler.

## Configuration

- **Package** : `@adonisjs/queue` (et sa dépendance `@boringnode/queue`).
- **Config** : `config/queue.ts`
  - `default: env.get('QUEUE_DRIVER', 'database')`
  - `adapters.database.connectionName` : `postgres` (ou `sqlite` en test)
  - `locations: ['./app/jobs/**/*.ts']`
  - `worker.concurrency = 5`, `idleDelay = '2s'`, `gracefulShutdown = true`
- **Env** : `.env`

```bash
QUEUE_DRIVER=database
```

- **Commands / providers / preload** : `adonisrc.ts`
  - `commands`: `() => import('@adonisjs/queue/commands')`
  - `providers`: `() => import('@adonisjs/queue/queue_provider')`
  - `preloads`: inclut `#start/scheduler` en environnement `web`

- **Tables SQL** : migration `1773043557052_create_queue_tables.ts`
  - crée `queue_jobs` et `queue_schedules`.

## Exemples de jobs

### Job “analytics” (export usage exercices)

Job : `app/jobs/log_exercise_usage_export.ts`

- Payload : `{ userId, from, to, organizationId }`
- Queue : `analytics`
- Comportement : log structuré quand un super admin déclenche un export d’usage.

Il est dispatché depuis `SuperAdminController.exerciseUsageExport`.

### Job “ai” (analyse qualitative d’exercice)

Voir **[AI_JOBS.md](AI_JOBS.md)**.

Rappel :

- Queue : `ai`
- Provider côté serveur : `AI_PROVIDER` (`mistral` / `gemini` / `openai` / `none`)
- Variables associées : `MISTRAL_API_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, etc.

## Lancer un worker

Les jobs **ne sont traités que si un worker tourne**.

Commande de base :

```bash
node ace queue:work
```

Options utiles :

- `--queue=analytics` : ne traiter que la queue `analytics`.
- `--queue=ai` : ne traiter que la queue `ai`.
- `--concurrency=10` : parallélisme.

### Notes prod

- En production, il faut **un process worker en plus** du serveur HTTP (ou `CC_WORKER_COMMAND` sur Clever Cloud, voir `docs/clever-cloud.md`).
- Plusieurs workers peuvent consommer la même queue en parallèle (à dimensionner selon charge et DB).

## Scheduler (tâches planifiées)

Le fichier `start/scheduler.ts` est préchargé (env `web`) et sert à définir les jobs récurrents.

Exemples d’API (selon la doc AdonisJS queue) :

- `MyJob.schedule(payload).cron('0 0 * * *').timezone('Europe/Paris')`
- `MyJob.schedule(payload).every('5m')`

Cas d’usage typiques :

- nettoyage périodique,
- génération de rapports,
- notifications planifiées.

## Commandes Ace (référence)

Les commandes suivantes sont fournies par `@adonisjs/queue` :

- `node ace queue:work`
- `node ace queue:scheduler:list`
- `node ace queue:scheduler:remove <id>`
- `node ace queue:scheduler:clear`

## Tests (stratégie recommandée)

Pour tester le dispatch de jobs sans exécuter un worker, utiliser l’outil de fake recommandé par la doc officielle :

- `QueueManager.fake()` avant l’action à tester.
- `fake.assertPushed(MyJob, { payload: {...} })` / `fake.assertNotPushed(MyJob)`.
- `QueueManager.restore()` en teardown.


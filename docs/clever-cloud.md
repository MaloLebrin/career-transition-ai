# Déploiement sur Clever Cloud (Node + PostgreSQL + worker)

Ce projet est une app **AdonisJS** construite avec `pnpm run build` (sortie dans `build/`). Le serveur HTTP et le worker de file d’attente doivent s’exécuter **depuis `build/`** après installation des dépendances de production dans ce dossier.

## Applications Node sur Clever Cloud

Créer une application **Node.js**, lier l’addon **PostgreSQL**, puis configurer les variables ci-dessous dans la console Clever Cloud.

### Build

| Variable | Valeur |
|----------|--------|
| `CC_NODE_DEV_DEPENDENCIES` | `install` — nécessaire pour `node ace build` (`@adonisjs/assembler`, Vite, TypeScript, etc.) |
| `CC_POST_BUILD_HOOK` | `./clevercloud/post-build.sh` |
| `CC_NODE_BUILD_TOOL` | `pnpm` (optionnel si `pnpm-lock.yaml` est détecté) |

Le script [clevercloud/post-build.sh](../clevercloud/post-build.sh) enchaîne : `pnpm run build` puis `cd build && pnpm install --prod --frozen-lockfile`.

**Cache de build** : le hook *Post Build* peut ne pas être rejoué sur certains déploiements depuis le cache Clever Cloud. En cas d’artefact incohérent, voir la doc Clever Cloud (`CC_DISABLE_BUILD_CACHE_UPLOAD`, `IGNORE_FROM_BUILDCACHE`).

### Run (HTTP)

| Variable | Valeur |
|----------|--------|
| `CC_RUN_COMMAND` | `cd build && node bin/server.js` |
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |
| `PORT` | Laisser la valeur injectée par Clever Cloud (ou `8080` si besoin) |

### Worker (queues PostgreSQL)

La file d’attente utilise `QUEUE_DRIVER=database` (pas de Redis). Sur la **même** application Node :

| Variable | Valeur |
|----------|--------|
| `CC_WORKER_COMMAND` | `cd build && node ace.js queue:work` |
| `QUEUE_DRIVER` | `database` |

À faire **aussi** pour l’application Clever Cloud `dev` (pas seulement `prod`) : sinon les jobs restent en attente car aucun worker ne tourne.

Le worker partage les mêmes variables que le serveur (`APP_KEY`, base de données, clés API IA, etc.). Chaque instance scalée lance un web + un worker ; plusieurs workers consomment la queue en parallèle (comportement généralement souhaité).

Pour scaler **uniquement** les workers, créer une seconde app Node avec le même hook de build et `CC_RUN_COMMAND` égal à la commande worker (sans `CC_WORKER_COMMAND`).

### Base de données

Après liaison de l’addon PostgreSQL, Clever Cloud injecte des variables `POSTGRESQL_ADDON_*`. L’application les accepte automatiquement (voir [config/database.ts](../config/database.ts) et [start/env.ts](../start/env.ts)). Tu peux aussi définir le jeu complet `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_DATABASE` (et optionnellement `DB_PASSWORD`). Si **les deux** jeux sont complets, c’est **`DB_*`** qui est utilisé. Ne pas mélanger un `DB_*` partiel avec un `POSTGRESQL_ADDON_*` partiel.

Vérifier les noms exacts dans le panneau de ton addon (Clever Cloud peut afficher des variantes selon le plan).

### Autres variables applicatives

Reprendre au minimum les clés de [.env.example](../.env.example) : `APP_KEY`, `LOG_LEVEL`, `SESSION_DRIVER`, configuration mail / IA selon l’usage.

### Migrations

Ne pas lancer `migration:run` dans `CC_PRE_RUN_HOOK` sur une app **scalée** (plusieurs instances), pour éviter des courses.

À exécuter manuellement après déploiement (ex. Clever SSH), depuis le répertoire de déploiement contenant `build/` :

```bash
cd build && node ace.js migration:run
```

Adapter les flags (`--force`, etc.) selon la doc AdonisJS et ton processus.

### Bootstrap super admin (organisation + compte plateforme)

Pour créer ou mettre à jour l’organisation **AI transition carrière** et l’utilisateur **super_admin** (`database/seeders/admin_seeder.ts`) :

1. Définir **`ADMIN_PASSWORD`** dans les variables d’environnement de l’application Clever (secret fort, idéalement **différent** entre dev et prod).
2. Après les migrations, exécuter **uniquement** ce seeder (pas `db:seed` sans filtre, sinon le `MainSeeder` injecte aussi des données de démo) :

```bash
cd build && node ace.js db:seed --files database/seeders/admin_seeder
```

Tu peux ré-exécuter cette commande pour faire tourner le mot de passe : le seeder est idempotent (recherche par `slug` d’organisation et par `organization_id` + `email` utilisateur).

## GitHub Actions

Le dépôt inclut [.github/workflows/clever-cloud-deploy.yml](../.github/workflows/clever-cloud-deploy.yml), qui utilise [Clever Tools](https://www.clever-cloud.com/developers/doc/cli) (`clever deploy`) pour pousser le Git du runner vers chaque application Clever ([cycle de déploiement](https://www.clever-cloud.com/developers/doc/cli/applications/deployment-lifecycle)).

| Déclencheur | Cible | Comportement |
|-------------|--------|--------------|
| `push` sur la branche `main` | Application **dev** | Déploiement automatique |
| `workflow_dispatch` (exécution manuelle dans l’onglet Actions) | Application **prod** | Déploiement à la demande ; input optionnel `ref` (défaut `main`) pour choisir la branche à checkout et à envoyer à Clever |

Les jobs utilisent `actions/checkout@v4` avec **`fetch-depth: 0`** pour un historique Git complet, ce que `clever deploy` attend en général.

### Secrets à définir sur GitHub

Dans **Settings → Secrets and variables → Actions** (ou secrets d’[environnement](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)) :

| Secret | Description |
|--------|-------------|
| `CLEVER_TOKEN` | Token Clever Tools ([console tokens](https://console.clever-cloud.com/users/me/tokens)) |
| `CLEVER_SECRET` | Secret associé |
| `CLEVER_APP_ID_DEV` | Identifiant de l’app Node **dev** (ex. `app_xxx`) |
| `CLEVER_APP_ID_PROD` | Identifiant de l’app Node **prod** |

Préférer un compte ou token **dédié CI** avec accès limité aux deux applications.

### Conflit avec l’intégration GitHub native Clever

Si les applications dev/prod sont configurées dans la console Clever pour se déployer **automatiquement** depuis GitHub sur `main`, un push sur `main` déclencherait **deux** déploiements (Clever + Actions). Pour ce workflow : désactiver le déploiement auto GitHub sur ces apps, ou ne pas lier le dépôt GitHub et ne passer que par `clever deploy`.

### Ajustements possibles

Si tu dois redéployer sans nouveau commit, la CLI propose `--same-commit-policy` (`restart`, `rebuild`, etc.) — à ajouter dans le workflow si besoin après essai. Éviter `--force` sauf cas exceptionnel.

### Référence Clever Cloud

- [Node.js & Bun](https://www.clever-cloud.com/developers/doc/applications/nodejs)
- [Deployment hooks](https://www.clever-cloud.com/developers/doc/develop/build-hooks)
- [Workers (CC_WORKER_COMMAND)](https://www.clever-cloud.com/developers/doc/develop/workers)

### Test local du hook de build

```bash
pnpm run clever:postbuild
```

Puis : `cd build && node bin/server.js` (avec un `.env` adapté).

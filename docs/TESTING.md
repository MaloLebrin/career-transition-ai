# Tests

## Suites

| Suite            | Répertoire          | Commande            | Isolation DB                                              |
| ---------------- | ------------------- | ------------------- | --------------------------------------------------------- |
| `unit`           | `tests/unit`        | `pnpm test`         | par groupe : `testUtils.db().withGlobalTransaction()`     |
| `integration`    | `tests/integration` | `pnpm test`         | `testUtils.db().withGlobalTransaction()` (toute la suite) |
| `functional`     | `tests/functional`  | `pnpm test`         | `truncateDb()` (`tests/utils/db.ts`)                      |
| Inertia (Vitest) | `tests/inertia`     | `pnpm test:inertia` | —                                                         |

`pnpm test` lance `unit`, `integration` et `functional`. Un fichier seul :

```bash
node ace test unit --files="services/exercise_results_service"
```

## Base de test : PostgreSQL, jamais SQLite

Les tests backend tournent sur **PostgreSQL**, comme la production. SQLite a été retiré :
les deux moteurs divergent (booléens, JSON, contraintes `CHECK` posées uniquement `if isPostgres`,
comportement des transactions), et une suite verte sur SQLite ne prouvait rien de la base réelle —
le rollback de `1771949787309_create_support_appointments_table` était cassé sur Postgres sans
qu'aucun test ne le voie.

La base de test est le service `postgres_test` du `docker-compose.yml` (profil `test`, port hôte
`5432`, base/utilisateur/mot de passe `test`). Elle ne démarre pas avec `docker compose up` et ses
données vivent en tmpfs : rien à nettoyer.

```bash
pnpm test:db:up     # démarre postgres_test et attend qu'il soit prêt
pnpm test           # suites unit, integration, functional
pnpm test:db:down   # arrête le conteneur
```

Le Postgres de **dev** (`postgres`, port hôte `5439`) n'est jamais touché par les tests. Trois
fichiers déclarent la base de test et **doivent rester alignés** : `.env.test`, le service
`postgres_test` du compose, et le bloc `env:` des jobs de tests de `.github/workflows/ci.yml`.

`.env.test` est chargé automatiquement par AdonisJS quand `NODE_ENV=test` (ce que fait
`bin/test.ts`), par-dessus un éventuel `.env` : pas besoin de le copier. `tests/bootstrap.ts`
refuse de tourner avec un autre `NODE_ENV` — la suite tronque des tables.

### Pourquoi `truncateDb()` et pas une transaction globale en `functional`

Le serveur HTTP tourne dans le même process, mais ses handlers passent par des **connexions du
pool distinctes** de celle du test : une transaction globale ouverte côté test leur est invisible,
et les données créées par le test n'existent pas pour le handler. D'où le truncate entre chaque
test (`group.each.setup(() => truncateDb())`). `tests/bootstrap.ts` porte ce choix dans
`configureSuite`.

`truncateDb()` n'appelle pas `testUtils.db().truncate()` : cet helper rejoue `migration:run` avant
chaque test, avec prise et relâchement du verrou consultatif Postgres sur des connexions du pool
potentiellement différentes — ce qui finit en « Migration completed, but unable to release database
lock » en cascade. Les migrations sont jouées une fois pour toutes par le hook global ; entre deux
tests, seul `db:truncate` est utile.

### Un échec de requête invalide toute la transaction

Sur Postgres, une requête en erreur (contrainte unique, CHECK…) met la transaction englobante en
état `aborted` : toute requête suivante échoue avec « current transaction is aborted ». Un code qui
**attrape** une violation pour se replier (cf. `ExerciseResultsService.saveDraft`) doit donc isoler
l'écriture risquée dans sa propre transaction (`db.transaction(...)`, qui devient un savepoint sous
`withGlobalTransaction()`), sans quoi le repli échoue dès qu'il s'exécute dans une transaction — en
test comme chez un futur appelant transactionnel.

## CI — shards générés depuis l'arborescence

Le job `test-backend` tourne en shards parallèles, chacun avec son propre conteneur Postgres
éphémère (service GitHub Actions). Un job d'agrégation `test-backend` (`needs` sur la matrice et
sur les shards) reste l'unique check requis pour la protection de branche.

La matrice **n'est pas écrite à la main** : le job `test-backend-matrix` exécute
`scripts/ci_test_shards.mjs`, qui balaie `tests/functional/` et répartit les specs. Une allowlist
`--files` maintenue dans le workflow serait un angle mort silencieux : un nouveau répertoire de
specs passerait en local et ne tournerait jamais en CI, sans qu'aucun job n'échoue.

```bash
node scripts/ci_test_shards.mjs --explain     # la répartition, lisible
node scripts/ci_test_shards.mjs               # le JSON consommé par la CI
node scripts/ci_test_shards.mjs --shards=4    # simuler un autre découpage
```

**Répartition au fichier près, pas au répertoire**, pondérée par le nombre de `test(...)` de chaque
fichier, par LPT. Le nombre effectif de shards est plafonné au nombre de fichiers : un shard sans
filtre (`files: ''`) ne tournerait pas « rien », il rejouerait toute la suite.

**Si la CI devient trop longue** : augmenter `FUNCTIONAL_SHARD_COUNT` dans
`scripts/ci_test_shards.mjs`. Rien d'autre à toucher — la matrice, les noms de jobs et les filtres
suivent. Le plancher reste l'installation des dépendances et le démarrage de Postgres par shard
(~1 min), donc au-delà d'une poignée de shards le gain se tasse.

`tests/unit/hygiene/ci_shards.spec.ts` garde l'invariant : il rejoue l'algorithme de filtrage de
Japa sur les filtres émis et échoue en **nommant** tout spec qui ne serait couvert par aucun shard
(ou par plusieurs). Il relit le disque au lieu d'importer la liste du générateur : une garde qui
partage sa source avec sa cible hérite de ses angles morts.

### Sémantique de `--files`

Japa (`FilesManager#grep`) retient un fichier si son chemin absolu `endsWith()` le filtre, ou si
chaque segment du filtre, lu depuis la fin, est un **suffixe** du segment correspondant du chemin
privé de son `.spec.ts`. Deux conséquences :

- un chemin relatif complet (`tests/functional/dashboard_routes.spec.ts`) désigne exactement un
  fichier — c'est ce qu'émet le générateur ;
- un filtre par segment déborde : `services/employee` matche aussi `services/employee_synthesis`,
  et `dossier/*` ne couvre qu'**un seul niveau** (pas de glob récursif `**`).

## Les autres jobs de la CI

| Job             | Commande            | Note                                                          |
| --------------- | ------------------- | ------------------------------------------------------------- |
| `lint`          | `pnpm lint`         |                                                               |
| `typecheck`     | `pnpm typecheck`    | `tsconfig.json` exclut `tests/` : les specs ne sont pas typés |
| `build`         | `pnpm run build`    | `node ace build` — serveur + assets Vite                      |
| `test-backend`  | voir ci-dessus      | agrégation des shards                                         |
| `test-frontend` | `pnpm test:inertia` | Vitest + Testing Library, sans base                           |

`pnpm/action-setup@v4` est appelé **sans** `version:` : l'action lit `packageManager` de
`package.json`, qui reste la source unique de vérité (avec le `Dockerfile`). Les deux en même
temps font échouer le setup (« Multiple versions of pnpm specified »).

## Couverture

```bash
pnpm test:coverage           # backend (c8) → coverage/backend
pnpm test:inertia:coverage   # frontend (Vitest v8) → coverage/frontend
```

`coverage/` est ignoré par git. Configuration : `.c8rc.json` et `vitest.config.ts`.

## Typecheck / lint

- `pnpm typecheck`
- `pnpm lint`

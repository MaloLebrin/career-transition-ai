# CLAUDE.md — career-transition-ai

## Vue d'ensemble

Application SaaS de transition de carrière. Stack :
- **Backend** : AdonisJS v6 (TypeScript, Lucid ORM, Japa tests)
- **Base de données** : PostgreSQL via Lucid (PostgreSQL aussi en test — service `postgres_test` du `docker-compose.yml`, jamais SQLite)
- **Frontend** : React 19 via Inertia.js (TypeScript, Vitest + Testing Library)
- **Queue** : `@adonisjs/queue` — workers : `default`, `ai`, `pdfs`, `analytics`
- **Package manager** : **pnpm** (ne jamais utiliser `npm` ou `yarn`)

---

## Commandes essentielles

```bash
# Dev
pnpm dev                        # serveur AdonisJS avec HMR
pnpm dev:worker:all             # tous les workers de queue
pnpm dev:with-worker            # serveur + workers

# Tests (voir docs/TESTING.md)
pnpm test:db:up                 # démarre la base de test Postgres (profil `test` du compose)
pnpm test                       # tests backend (Japa) — suites unit, integration, functional
pnpm test:inertia               # tests frontend (Vitest)
pnpm test:db:down               # arrête la base de test
pnpm test:coverage              # couverture backend (c8) → coverage/backend
pnpm test:inertia:coverage      # couverture frontend → coverage/frontend

# Build / lint
pnpm build
pnpm lint
pnpm typecheck

# Base de données
node ace migration:run
node ace db:seed
node ace migration:rollback

# Génération
node ace make:controller <name>
node ace make:model <name>
node ace make:migration <name>
node ace make:job <name>
```

---

## Architecture

### Imports (alias)

```
#models/*        → app/models/*.js
#services/*      → app/services/*.js
#controllers/*   → app/controllers/*.js
#transformers/*  → app/transformers/*.js
#middleware/*    → app/middleware/*.js
#validators/*    → app/validators/*.js
#jobs/*          → app/jobs/*.js
#shared/*        → shared/*.js
#database/*      → database/*.js
#commands/*      → app/commands/*.js
```

### Arborescence clé

```
app/
  controllers/    # un fichier par ressource (snake_case)
  models/         # Lucid ORM, enums/constantes dans le fichier modèle
  services/       # logique métier, un fichier par domaine
  transformers/   # sérialisation JSON (BaseTransformer)
  middleware/     # auth, rôles, onboarding, guest…
  jobs/           # queue jobs
  validators/     # schémas VineJS
shared/
  helpers/        # helpers réutilisables (testés dans tests/inertia/helpers/)
  types/
inertia/
  pages/          # export default (imposé par Inertia)
  components/     # pas d'export default
database/
  schema.ts       # généré automatiquement — ne pas éditer à la main
  migrations/
  factories/
  seeders/
tests/
  unit/           # backend — pnpm test (suite unit, isolation par groupe via withGlobalTransaction)
  integration/    # backend — pnpm test (suite integration, transaction globale sur toute la suite)
  functional/     # backend — pnpm test (suite functional, serveur HTTP + truncateDb() entre les tests)
  inertia/        # frontend — pnpm test:inertia (Vitest)
  utils/          # helpers de test (truncateDb…)
scripts/
  ci_test_shards.mjs  # génère la matrice de shards du job test-backend (CI)
  smoke_prod_build.mjs  # test de fumée du build de prod (job smoke-prod-build, CI)
start/
  routes/         # fichiers de routes par domaine
  kernel.ts       # middlewares nommés
```

---

## Modèles métier

Modèles principaux (voir `database/schema.ts` pour le schéma complet) :
`User`, `Employee`, `Organization`, `Education`, `Experience`, `Skill`,
`EmployeeSkill`, `EmployeeSynthesis`, `ExerciseResult`, `SupportPlanStep`,
`SupportPlanStepExercise`, `PdfExport`, `Note`, `File`, `OnboardingToken`

---

## Middlewares disponibles (start/kernel.ts)

| Middleware | Rôle |
|---|---|
| `middleware.auth()` | Utilisateur connecté |
| `middleware.guest()` | Invité uniquement |
| `middleware.superAdmin()` | Super admin uniquement |
| `middleware.admin()` | Admin ou super admin |
| `middleware.advisorOrAdmin()` | Advisor, admin ou super admin |
| `middleware.candidate()` | Candidat |
| `middleware.checkOnboarding()` | Vérification onboarding |
| `middleware.registrationOpen()` | Inscription publique ouverte (`REGISTRATION_ENABLED`, fermée par défaut en prod) |

Ordre standard : `auth()` → middleware de rôle.

Rate limiting des endpoints publics : `throttleLogin`, `throttleRegister`, `throttleContactRequests`, `throttleOnboarding` (`start/limiter.ts`, `.use(throttleX)`). Clé IP via `clientIp()` (`#utils/client_ip`), jamais `request.ip()` (falsifiable avec `trustProxy`). Compteurs remis à zéro avant chaque test functional (`tests/bootstrap.ts`).

Référencement : `noindex` par défaut partout (`SEO_INDEXING`, `config/seo.ts`), rendu dans le layout Edge via le global `seo` (`start/view.ts`) et `GET /robots.txt` (pas de fichier dans `public/`).

IA côté navigateur (import de CV, cartographie, ciblage) : uniquement via `POST /dashboard/ai/*` (`AiAssistController`, `throttleAi`, client `createServerAiClient`) — jamais de SDK ni de clé `VITE_*` dans le bundle.

RGPD (`docs/RGPD.md`) : aucun nom ni e-mail de candidat dans un prompt IA — passer les données par `pseudonymizeForAi` (`#shared/helpers/ai/exercise_profile`). Sous-traitants, durées de conservation et contact : `shared/constants/legal.ts` (source des pages `/confidentialite` et `/securite`). Droits d'accès/effacement : `node ace candidate:export <id>` / `node ace candidate:purge <id>` (`app/commands/`, enregistrées via `app/commands/main.ts` dans `adonisrc.ts` — jamais dans `./commands`, cf. commentaire du fichier ; `#services/candidate_data_service`).

---

## Conventions impératives

### Package manager
Toujours `pnpm`, jamais `npm run` ou `yarn`.

### Tests obligatoires
- Tout bugfix → test de non-régression (avant ou avec le fix).
- Tout nouveau/modifié composant/page → test dans `tests/inertia/`.
- Tout nouveau/modifié model/service/controller → test dans `tests/unit/`.
- Tâche non terminée tant que les tests ne passent pas.
- Les tests backend tournent sur **PostgreSQL** (`pnpm test:db:up` avant `pnpm test`), jamais SQLite.
- Tests HTTP (`tests/functional/`) : isolation par `truncateDb()` (`#tests/utils/db`), pas de transaction globale (invisible aux handlers).
- `.env.test`, le service `postgres_test` du compose et le bloc `env:` de `.github/workflows/ci.yml` doivent rester alignés.
- La matrice de shards de la CI est générée (`scripts/ci_test_shards.mjs`) : ne jamais écrire de filtre `--files` à la main dans le workflow.

### Enums & constantes
```ts
export const MY_STATUSES = { PENDING: 'pending', DONE: 'done' } as const
export type MyStatus = (typeof MY_STATUSES)[keyof typeof MY_STATUSES]
```
Ne jamais utiliser de chaînes magiques. Contrainte `CHECK` SQL synchronisée avec l'enum TS.

### Nouveau modèle → factory + seeder obligatoires
Cf. règle `enums-factories-seeders`.

### Transformers
- Un transformer par modèle métier dans `app/transformers/`.
- Étend `BaseTransformer<Model>` de `@adonisjs/core/transformers`.
- Pas de requêtes BDD dans les transformers : tout doit être préchargé (`preload`).
- Ne jamais exposer `password`, tokens ou secrets.

### Composants React
- `inertia/components/**/*.tsx` → **pas** d'export default.
- `inertia/pages/**/*.tsx` → export default (imposé par Inertia).

### Auth & formulaires
- Auth 100% via Inertia (`useForm`, `router.post/put`).
- Pas de `fetch`/`axios` pour les endpoints auth déjà couverts par Inertia.
- État session via `usePage().props.user`, pas de polling JSON.

### Rôles & routes
- Contrôle d'accès via middleware sur les routes, pas dans les contrôleurs.
- Ne pas dupliquer les `if (role !== …)` si le middleware couvre déjà la route.

### Helpers partagés
- Logique réutilisable → `shared/helpers/<domaine>.ts`.
- Chaque fichier helper → fichier test miroir dans `tests/inertia/helpers/`.
- Pages/composants importent depuis `#shared/helpers/...`, ne dupliquent pas.

### Documentation en priorité
Avant d'implémenter : consulter [AdonisJS docs](https://docs.adonisjs.com/) puis [Inertia docs](https://inertiajs.com/).

### Fonctions dépréciées
Ne jamais utiliser de fonctions dépréciées du framework.

---

## Queues

Workers disponibles : `default`, `ai`, `pdfs`, `analytics`.

Jobs existants :
- `analyze_exercise_qualitative_job.ts` → queue `ai`
- `generate_employee_synthesis_pdf.ts` → queue `pdfs`
- `log_exercise_usage_export.ts` → queue `analytics`

Rétention de `queue_jobs` : `QUEUE_JOB_RETENTION` (`config/queue.ts`, 7 j succès / 30 j échecs, 1 000 par queue) — jamais `removeOnComplete: false`.

Nouveau job → constantes de statut + contrainte CHECK + factory + seeder si visible en UI.

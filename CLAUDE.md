# CLAUDE.md — career-transition-ai

## Vue d'ensemble

Application SaaS de transition de carrière. Stack :
- **Backend** : AdonisJS v6 (TypeScript, Lucid ORM, Japa tests)
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

# Tests
node ace test                   # tests backend (Japa)
pnpm test:inertia               # tests frontend (Vitest)

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
  unit/           # backend — node ace test (suite unit)
  functional/     # backend — node ace test (suite functional)
  inertia/        # frontend — pnpm test:inertia (Vitest)
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

Ordre standard : `auth()` → middleware de rôle.

---

## Conventions impératives

### Package manager
Toujours `pnpm`, jamais `npm run` ou `yarn`.

### Tests obligatoires
- Tout bugfix → test de non-régression (avant ou avec le fix).
- Tout nouveau/modifié composant/page → test dans `tests/inertia/`.
- Tout nouveau/modifié model/service/controller → test dans `tests/unit/`.
- Tâche non terminée tant que les tests ne passent pas.

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

Nouveau job → constantes de statut + contrainte CHECK + factory + seeder si visible en UI.

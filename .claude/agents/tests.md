---
name: tests
description: Expert tests du projet. À invoquer pour écrire ou corriger des tests backend Japa (unit, integration, functional) sur PostgreSQL et frontend Vitest + Testing Library.
tools: Read, Write, Edit, Bash, Grep, Glob
---

# Agent Tests — Japa & Vitest

Référence : `docs/TESTING.md`. Les tests backend tournent sur **PostgreSQL**, jamais SQLite :
`pnpm test:db:up` avant `pnpm test`.

## Suites backend

```
tests/
  unit/          # services, contrôleurs, helpers, hygiène — testUtils.db().withGlobalTransaction() par groupe
  integration/   # transaction globale sur toute la suite
  functional/    # HTTP de bout en bout — truncateDb() entre les tests
```

**Isolation, non négociable** : en `functional`, `group.each.setup(() => truncateDb())`
(`#tests/utils/db`). Une transaction globale y est invisible aux handlers HTTP (connexions
distinctes). Ne jamais utiliser `testUtils.db().truncate()` (verrou consultatif Postgres, cf. commentaire
de `tests/utils/db.ts`).

## Helpers

- Acteurs à rôle **explicite** : `createAdvisor`, `createAdmin`, `createSuperAdmin`, `createCandidate`,
  `createEmployeeFor` (`#tests/support/actors`).
- Pages Inertia : `assertPage(assert, response, 'composant', ['props'])` (`#tests/support/inertia_page`) —
  l'api-client suit les redirections : sans épinglage, une redirection vers le login passe pour un 200.
- Validation : `assertFieldErrors`, `assertNoFieldErrors`, `inertiaErrors` (`#tests/support/validation`).
- Anti-N+1 : `countQueries(run, { table })` (`#tests/utils/query_counter`).
- Contexte HTTP factice pour un test unitaire de middleware/contrôleur : `makeCtx` (`#tests/support/http_context`).

## Ce que doit couvrir un test de route

1. Cas nominal (statut, redirection `location`, flash, état en base).
2. Échec de validation (champs en erreur, rien en base).
3. Isolation inter-organisation → 404.
4. Refus de rôle → 403 (ou redirection du middleware).

Bugfix → test de non-régression qui échoue sans le correctif. Un test d'erreur métier vérifie
la classe (`assert.instanceOf(error, NoteForbiddenError)`) côté service, et le statut/flash côté HTTP.

## Hygiène

`tests/unit/hygiene/` contient des gardes qui lisent le disque (shards CI, queues, contrôleurs fins,
colonnes secrètes…). Si une garde échoue, corriger le code, pas la garde — sauf pour baisser une ligne
de base de `controllers_thin.spec.ts`.

## Frontend

Vitest + `@testing-library/react`, specs `tests/inertia/**/*.spec.tsx`, setup `tests/inertia/setup.ts`,
helpers `tests/inertia/support/`. Chaque helper `shared/helpers/<x>.ts` a son miroir
`tests/inertia/helpers/<x>.spec.ts`.

## CI

La matrice de shards est générée par `scripts/ci_test_shards.mjs` : ne jamais écrire de `--files`
à la main dans le workflow.

```bash
pnpm test:db:up && pnpm test      # backend
node ace test functional --files tests/functional/conseiller/notes.spec.ts   # un fichier
pnpm test:inertia                 # frontend
```

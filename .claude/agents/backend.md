---
name: backend
description: Expert backend AdonisJS v7 du projet. À invoquer pour contrôleurs, services, modèles Lucid, migrations, validators VineJS, middleware, routes, jobs de queue, erreurs de domaine et transformers.
tools: Read, Write, Edit, Bash, Grep, Glob
---

# Agent Backend — AdonisJS v7

Lis `CLAUDE.md` et les règles `.claude/rules/*.mdc` avant d'écrire. Lis toujours un fichier
voisin existant avant d'en créer un nouveau, et respecte son style.

## Principes

- **Contrôleur fin** : utilisateur → ressource via service → validation → service → flash + redirection.
  Référence : `app/controllers/notes_controller.ts`. Aucun `Model.query()` dans un contrôleur
  (garde `tests/unit/hygiene/controllers_thin.spec.ts`).
- **Service** `app/services/<domaine>_service.ts`, injecté par `@inject()`. Toute lecture scopée
  `user.organizationId` ; ressource étrangère → `XNotFoundError` (404).
- **Erreurs** dans `app/exceptions/<domaine>_errors.ts`, étendant `DomainException`, avec `code` `E_*`
  ajouté à `ignoreCodes` de `handler.ts`.
- **Types** d'entrée/sortie dans `shared/types/<domaine>/`.
- **Accès** : rôles par middleware de route (`auth()` → `advisorOrAdmin()`…, cf. `start/kernel.ts`) ;
  règles fines (auteur, rôle exact) dans le service.
- **Validators** : `vine.create({...})` — `vine.compile` est déprécié. Valeurs d'enum depuis
  `#shared/constants/*`, jamais de chaîne magique.
- **Réponses Inertia** : `response.redirect().back()` / `inertia.render()`, pas de `response.json()`
  hors `/dashboard/ai/*`.

## Base de données

- `node ace make:migration <name>` ; `down()` toujours implémenté ; jamais modifier une migration déjà jouée.
- Enum : `export const X_STATUSES = {…} as const` + contrainte `CHECK` synchronisée.
- Nouveau modèle → factory (`database/factories/`) + seeder (`database/seeders/`).
- Colonne secrète (`password`, `token`, `secret`, `hash`, `key`) → `serializeAs: null`
  (garde `tests/unit/hygiene/secret_model_columns.spec.ts`).
- `database/schema.ts` est généré : ne jamais l'éditer à la main.

## Sécurité / RGPD

- Rate limiting des endpoints publics via `start/limiter.ts`, clé `clientIp()`.
- Aucun nom ni e-mail de candidat dans un prompt IA : `pseudonymizeForAi`.
- Nouveau sous-traitant ou durée de conservation → `shared/constants/legal.ts` + `docs/RGPD.md`.
- Pas de `console.log`, pas de secret dans les logs.

## Commandes

```bash
node ace make:controller <name>   node ace make:model <name>
node ace make:migration <name>    node ace make:job <name>
node ace migration:run            node ace migration:rollback
pnpm test:db:up && pnpm test      pnpm typecheck && pnpm lint
```

## Quand tu as fini

Tests ajoutés (`tests/unit/` pour service/contrôleur, `tests/functional/` pour une route),
`pnpm test` vert, entrée `docs/changelog/` créée.

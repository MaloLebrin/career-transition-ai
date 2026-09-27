---
name: new-domain
description: Crée un domaine métier complet (migration, modèle, factory, seeder, erreurs, types partagés, validators, service, transformer, contrôleur, routes, pages, tests, changelog) en suivant les conventions du projet. À utiliser quand on ajoute une nouvelle ressource/entité métier.
---

# Nouveau domaine : $ARGUMENTS

`<Domain>` = PascalCase, `<domain>` = snake_case. Lis d'abord le domaine de référence **Notes** :
`app/models/note.ts`, `app/services/notes_service.ts`, `app/exceptions/note_errors.ts`,
`app/controllers/notes_controller.ts`, `tests/unit/services/notes_service.spec.ts`,
`tests/functional/conseiller/notes.spec.ts`.

## Fichiers, dans l'ordre

1. **Constantes / enums** — `shared/constants/<domain>.ts` :
   `export const <DOMAIN>_STATUSES = { … } as const`, type dérivé, `…Values = Object.values(…)`.
2. **Migration** — `node ace make:migration create_<domain>s_table` :
   FK `organization_id` → `organizations` `onDelete('CASCADE')`, index sur les FK,
   contrainte `CHECK` générée depuis `…Values` (modèle : `database/migrations/*_create_notifications_table.ts`),
   `down()` qui retire les contraintes puis la table.
3. **Modèle** — `app/models/<domain>.ts` : colonnes typées avec l'enum, relations `belongsTo`,
   `serializeAs: null` sur toute colonne secrète.
4. **Factory** — `database/factories/<domain>_factory.ts` (FK à surcharger, valeurs via `faker.helpers.arrayElement(…Values)`).
5. **Seeder** — `database/seeders/<domain>_seeder.ts`, branché dans `main_seeder.ts` si visible en UI.
6. **Erreurs** — `app/exceptions/<domain>_errors.ts` : `<Domain>NotFoundError` (404), `<Domain>ForbiddenError` (403)…
   étendant `DomainException` ; codes ajoutés à `ignoreCodes` de `handler.ts`.
7. **Types** — `shared/types/<domain>/inputs.ts` : `Create<Domain>Input`, `Update<Domain>Input`.
8. **Validators** — `app/validators/<domain>/create_<domain>_validator.ts`… avec `vine.create({…})`
   (jamais `vine.compile`, déprécié) et `vine.enum(…Values)`.
9. **Service** — `app/services/<domain>s_service.ts` : lectures scopées `user.organizationId`
   (étranger → 404), règles fines d'accès, JSDoc. Pas de requête ailleurs.
10. **Transformer** — `app/transformers/<domain>_transformer.ts` (`BaseTransformer<Model>`, relations préchargées, aucun secret).
11. **Contrôleur** — `app/controllers/<domain>s_controller.ts` : `@inject()`, fin (≤ ~10 lignes par action),
    flash + `response.redirect().back()` ou `inertia.render`. Aucun `.query(` (garde `controllers_thin`).
12. **Routes** — dans le fichier de domaine de `start/routes/**`, sous `auth()` + middleware de rôle.
13. **Pages / composants** — voir la skill `new-inertia-page`.
14. **Tests** —
    - `tests/unit/services/<domain>s_service.spec.ts` (`withGlobalTransaction`) ;
    - `tests/functional/<espace>/<domain>s.spec.ts` (`truncateDb()`) : nominal, validation, 404 inter-organisation, 403 rôle ;
    - `tests/unit/models/`, `tests/unit/transformers/` si logique ;
    - `tests/inertia/` pour chaque page/composant.
15. **Docs** — `docs/changelog/YYYY-MM-DD-HHMM-<slug>.md` ; `docs/FEATURES.md` si nouvelle fonctionnalité ;
    `docs/RGPD.md` + `shared/constants/legal.ts` si nouvelle donnée personnelle.

## Vérification

```bash
node ace migration:run && node ace migration:rollback && node ace migration:run
pnpm typecheck && pnpm lint
pnpm test:db:up && pnpm test && pnpm test:inertia
```

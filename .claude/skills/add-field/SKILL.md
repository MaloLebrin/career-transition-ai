---
name: add-field
description: Ajoute un champ à un modèle existant en touchant toutes les couches dans l'ordre (migration, modèle, validators, types partagés, service, transformer, formulaires, tests, changelog). À utiliser pour « ajouter une colonne / un champ à X ».
---

# Ajouter le champ $ARGUMENTS

Oublier une couche est la cause la plus fréquente de bug sur ce type de tâche. Toutes, dans l'ordre :

1. **Migration** — `node ace make:migration add_<champ>_to_<table>` : `alterTable`, colonne
   `nullable()` ou avec `defaultTo` (les lignes existantes !), `down()` qui la retire.
   Si valeurs fermées : constante `as const` dans `shared/constants/` + contrainte `CHECK`.
   Ne jamais modifier une migration déjà jouée.
2. **Modèle** — `@column() declare <champ>: <Type>` (`serializeAs: null` si secret).
3. **Factory** — valeur réaliste dans `database/factories/<model>_factory.ts` ; seeder si utile en démo.
4. **Validators** — create et update (`optional()` en update), `vine.enum(…Values)` pour une enum.
5. **Types partagés** — `shared/types/<domaine>/inputs.ts`.
6. **Service** — prise en compte à la création / modification (modification partielle : champ absent conservé).
7. **Transformer** — exposer le champ (ou pas : jamais un secret).
8. **Frontend** — formulaires (`useForm`), affichage, types de props.
9. **RGPD** — donnée personnelle nouvelle ? Durée de conservation dans `shared/constants/legal.ts`,
   export/purge dans `#services/candidate_data_service`, et jamais en clair dans un prompt IA.
10. **Tests** — service (unit), route (functional : valeur persistée + validation), composant (`tests/inertia/`).
11. **Changelog** — `docs/changelog/YYYY-MM-DD-HHMM-<slug>.md`.

## Vérification

```bash
pnpm typecheck && pnpm lint && pnpm test:db:up && pnpm test && pnpm test:inertia
```

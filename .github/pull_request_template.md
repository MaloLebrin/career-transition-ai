## Issue

Closes #<numéro>

> **Le mot-clé doit être en anglais** — `Closes`, `Fixes` ou `Resolves`, suivi de `#<numéro>`.
> GitHub n'interprète pas « Ferme #123 » : l'issue resterait ouverte après le merge.
> PR sans issue rattachée (audit, convention) : remplacer cette ligne par `Pas d'issue —` + la raison.

## Summary

-

## Test plan

- [ ] `pnpm test` (backend, après `pnpm test:db:up`) si modèle / service / contrôleur / route / job
- [ ] `pnpm test:inertia` (frontend) si page ou composant Inertia
- [ ] `pnpm typecheck` et `pnpm lint`
- [ ] Bugfix : test de non-régression qui échoue sans le correctif

## Docs (required)

- [ ] Entrée `docs/changelog/YYYY-MM-DD-HHMM-slug.md` ajoutée (voir `docs/changelog/README.md`)
- [ ] `docs/` à jour si la PR change une feature, une route, la DB (`database/schema.ts` régénéré) ou l'exploitation

## RGPD / sécurité

- [ ] Aucun nom ni e-mail de candidat dans un prompt IA (`pseudonymizeForAi`)
- [ ] Nouveau sous-traitant ou nouvelle donnée conservée → `shared/constants/legal.ts` et `docs/RGPD.md` à jour
- [ ] Aucune colonne secrète sérialisée, aucun secret ni `.env` commité

## Reviewer checklist

Voir `docs/process/pr-checklist.md`.

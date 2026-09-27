---
name: new-inertia-page
description: Crée une page Inertia React (route, action de contrôleur, props typées, composants, test Vitest et test functional). À utiliser pour tout nouvel écran.
---

# Nouvelle page Inertia : $ARGUMENTS

Lis une page voisine dans `inertia/pages/` et son test dans `tests/inertia/pages/`.

## Étapes

1. **Types de props** — `shared/types/<domaine>/` (partagés avec le contrôleur).
2. **Contrôleur** — action fine : données via le service + transformer, puis
   `inertia.render('<chemin/Page>', props)`. Aucun `.query(` dans le contrôleur.
3. **Route** — `start/routes/**`, sous `auth()` + middleware de rôle.
4. **Page** — `inertia/pages/<chemin>/<Page>.tsx`, **export default**, `<Head title=… />`.
5. **Composants** — `inertia/components/<domaine>/`, **sans export default**, un composant métier par fichier,
   < ~300 lignes. Logique pure → `shared/helpers/<domaine>.ts` + test miroir.
6. **Mutations** — `useForm` / `router.*` (`preserveScroll`, `only`) ; jamais `fetch`/`axios`.
7. **Liens** — `AppLink` / `<Link>` pour toute navigation interne.
8. **Tests** —
   - `tests/inertia/pages/<chemin>/<Page>.spec.tsx` : rendu, interactions, appels `routerSpies` ;
   - `tests/functional/…` : `assertPage(assert, response, '<chemin/Page>', ['prop1', …])` + accès refusé
     (rôle, autre organisation).
9. **Changelog** — `docs/changelog/YYYY-MM-DD-HHMM-<slug>.md`.

## Vérification

```bash
pnpm test:inertia && pnpm typecheck && pnpm lint && pnpm test
```

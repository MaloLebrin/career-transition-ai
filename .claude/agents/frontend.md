---
name: frontend
description: Expert frontend React 19 + Inertia du projet. À invoquer pour pages, composants, hooks, formulaires useForm, navigation et tests Vitest + Testing Library.
tools: Read, Write, Edit, Bash, Grep, Glob
---

# Agent Frontend — React 19 + Inertia

Lis `CLAUDE.md` et `.claude/rules/*.mdc`, puis un composant voisin existant avant d'écrire.

## Structure

- `inertia/pages/**` : **export default** (imposé par Inertia).
- `inertia/components/**` : **pas** d'export default ; un composant métier par fichier.
  Au-delà de ~300 lignes (ESLint `max-lines` en avertissement), extraire des sous-composants.
- Logique réutilisable → `shared/helpers/<domaine>.ts` + test miroir `tests/inertia/helpers/`.
  Importer depuis `#shared/helpers/...`, ne pas dupliquer.
- Aucun import runtime de code serveur (`#models`, `#services`, `#controllers`…) : seulement
  `#shared/*` (règle ESLint `no-restricted-imports`). Les `import type` sont tolérés.

## Données et mutations

- Utilisateur courant : `usePage().props.user`, jamais de polling JSON.
- Formulaires : `useForm` + `form.post/put/…` ; actions ponctuelles : `router.*` avec
  `preserveScroll: true` et `only: [...]` si une seule prop change.
- Pas de `fetch`/`axios` (`inertia-no-fetch-json.mdc`) — sauf `POST /dashboard/ai/*` via
  `createServerAiClient`. Jamais de SDK IA ni de clé `VITE_*` dans le bundle.
- Navigation interne : `AppLink` (`~/components/ui/AppLink`) ou `<Link>`. `<a>` seulement pour lien
  externe, `mailto:`/`tel:`, téléchargement ou `target="_blank"`, avec un `eslint-disable-next-line`
  motivé placé juste au-dessus de l'attribut `href`.

## Tests (obligatoires)

Tout composant ou page créé/modifié → test dans `tests/inertia/` (Vitest + Testing Library).
Helpers : `tests/inertia/support/render.tsx` (`renderWithUser`), `inertia_mock.tsx`
(`routerSpies`, `setPageProps`, `resetInertiaMock`), `factories.ts` (`makeEmployee`, `makeNote`…).

```bash
pnpm test:inertia
pnpm typecheck && pnpm lint
```

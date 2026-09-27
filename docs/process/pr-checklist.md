# Checklist de PR

Reprise de boat-management, adaptée au projet. Le template
`.github/pull_request_template.md` en reprend l'essentiel ; cette page détaille
ce que l'auteur et le reviewer vérifient.

## Auteur

- [ ] Une issue = une branche = une PR : jamais deux sujets dans la même PR (`main` est squashée).
- [ ] Le corps porte un `Closes #<issue>` **en anglais**, ou explique pourquoi la PR n'a pas d'issue.
- [ ] Entrée `docs/changelog/` ajoutée ; doc du domaine mise à jour si la feature change.
- [ ] Routes impactées vérifiées : route → middleware → contrôleur → service → page.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` et/ou `pnpm test:inertia` passés en local.

## Reviewer

- [ ] La PR décrit le **pourquoi** et l'impact utilisateur.
- [ ] **Contrôleurs fins** : pas de nouvelle requête Lucid dans un contrôleur (garde `tests/unit/hygiene/controllers_thin.spec.ts`), logique dans `app/services/`.
- [ ] **Scoping organisation** : toute lecture filtre sur `organizationId` ; une ressource d'une autre organisation répond 404, jamais 403.
- [ ] **Accès** : rôle contrôlé par middleware de route ; les règles métier plus fines (auteur, rôle précis) sont dans le service et lèvent une erreur de `app/exceptions/<domaine>_errors.ts`.
- [ ] **Types** d'entrée/sortie des services dans `shared/types/<domaine>/`, pas inline.
- [ ] **Inertia** : mutations via `useForm` / `router.*`, réponses en redirection (`response.redirect().back()`), pas de `response.json()` hors `/dashboard/ai/*` et exports.
- [ ] **Transformers** sans requête BDD, aucune donnée sensible exposée.
- [ ] **RGPD** : données candidat pseudonymisées avant tout appel IA.
- [ ] Tests : cas nominal, validation, isolation multi-organisation (404) et refus de rôle (403) pour toute nouvelle route.

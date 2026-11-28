# 2026-11-28 — CI : moins de minutes consommées

La CI tournait en entier sur chaque push, draft compris, et refaisait plusieurs fois
l'installation des dépendances pour des jobs d'une minute.

- **Draft.** Aucune CI sur une PR en draft (job `plan` sauté, tous les autres en
  dépendent) ; elle part au passage en « Ready for review », et repasser en draft
  annule le run en cours.
- **Concurrence.** Un nouveau push annule le run en cours de la même PR (pas sur `main`,
  où un run annulé laisserait les changements de son push sans test).
- **Fichiers modifiés.** Diff contre la base de la PR ou contre `github.event.before` sur un
  push (tous ses commits), sans détection de renommage. Une PR de doc seule ne lance que le shard `unit-integration`
  (`node scripts/ci_test_shards.mjs --unit-only`, garde des liens de la doc) ;
  `docker-image` ne tourne que si l'image, `deploy/`, les manifestes pnpm ou le workflow
  changent, avec un cache de couches GitHub Actions écrit depuis `main` seulement.
- **Jobs fusionnés.** `lint`, `typecheck` et `test-frontend` deviennent le job `checks`
  (une installation, une minute facturée) ; `build` disparaît, `smoke-prod-build` construit
  déjà l'app. `timeout-minutes` sur chaque job, `workflow_dispatch` pour un run complet.
- **Protection de branche.** Checks à exiger : `test-backend`,
  `lint · typecheck · test-frontend`, `smoke-prod-build`, `docker-image` (un job sauté
  compte comme réussi). Retirer `lint`, `typecheck`, `build`, `test-frontend`.
- **Tests.** `tests/unit/hygiene/ci_shards.spec.ts` couvre la matrice `--unit-only` et suit
  le renommage du job de matrice (`plan`). Doc : `docs/TESTING.md` § « Coût de la CI ».

# 2026-09-29 — Page profil candidat : 500 en production (manifest Vite)

En production, `GET /dashboard/candidat/profile` répondait 500 :
`Cannot find "inertia/pages/dashboard/employee/profile/Home.tsx" chunk in the manifest file`.

- **Cause.** `inertia/pages/dashboard/EmployeeProfile.tsx`, page orpheline (aucune
  route ne la rend), ne faisait que ré-exporter `employee/profile/Home`. Rollup
  fusionnait les deux entrées dynamiques en un chunk `_EmployeeProfile-….js` sans
  chemin source : ni l'une ni l'autre n'avait d'entrée dans le manifest, et `@vite`
  échouait sur la page réellement rendue. Invisible en dev et dans les suites de
  tests, qui ne lisent pas le manifest de production.
- **Correctif.** Page orpheline supprimée ; ses tests Vitest visent désormais
  `employee/profile/Home` (`tests/inertia/pages/dashboard/EmployeeProfileHomeSections.spec.tsx`).
- **Gardes.**
  - `tests/unit/hygiene/inertia_pages.spec.ts` : aucune page n'importe ni ne
    ré-exporte une autre page (le code partagé va dans `inertia/components/`).
  - `scripts/smoke_prod_build.mjs` (job `smoke-prod-build`) : chaque fichier de
    `inertia/pages/` doit avoir son entrée dans le manifest du build.
- **Vérifié** sur le build de production : les 62 pages ont leur entrée, la page
  profil candidat répond 200 et s'affiche.

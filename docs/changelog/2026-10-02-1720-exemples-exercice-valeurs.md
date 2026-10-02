# 2026-10-02 — Exercice valeurs : exemples concrets

Chaque valeur de Schwartz affiche désormais un portrait et une situation de
travail pour aider à classer autrement que par le seul libellé.

- **Contenu.** `portrait` et `situation` ajoutés sur les 10 entrées de
  `inertia/constants/values.ts` (libellés inchangés : brouillons et résultats
  déjà enregistrés restent valides).
- **UI.** Étape 1 de `ValuesTool` : définition complète, portrait et situation
  sur chaque carte ; situation reprise dans la hiérarchie classée.
- **Design.** Tokens sémantiques (`text-ink`, `text-muted`, `border-hairline`…)
  sur l’étape 1 ; baseline `inertia/components/exercises` abaissée à 272.
- **Tests.** Specs `ValuesTool` et `constants/values` mis à jour / ajoutés.

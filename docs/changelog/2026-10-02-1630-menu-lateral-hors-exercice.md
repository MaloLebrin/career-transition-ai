# 2026-10-02 — Menu latéral sur les résultats d’exercices

Le menu conseiller restait masqué sur la liste et la visualisation d’un résultat
(`hideSidebar`), alors qu’il ne doit disparaître que pendant le passage de
l’exercice en plein écran.

- **Correctif.** Retrait de `hideSidebar` sur
  `conseiller/exercises/List` et `conseiller/exercises/ResultDetail`.
- **Tests.** Assertions Vitest : ces pages ne passent plus `hideSidebar`.

# 2026-10-02 — La courbe de vie s'affiche avec les points saisis

Le tracé restait invisible quel que soit le nombre de points : le graphique
était centré dans un flex, Recharts mesurait une hauteur nulle, et chaque
sauvegarde du brouillon rechargeait l'état initial par-dessus la saisie.

- **Graphique.** La zone du tracé a une hauteur fixe et n'est plus un flex.
  L'animation du trait est désactivée pour que la courbe soit dessinée tout de suite.
- **Brouillon.** Le brouillon n'est appliqué qu'une fois, à l'ouverture.
- **Tests.** La courbe est présente à partir de deux points ; un brouillon tardif ne les efface pas.

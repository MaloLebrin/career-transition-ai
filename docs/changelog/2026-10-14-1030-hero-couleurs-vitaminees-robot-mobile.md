# 2026-10-14 — Héros : teintes plus vives, voile allégé, compagnon sur mobile

Le paysage en fond du héros de l'accueil particuliers paraissait délavé et le compagnon
disparaissait sous `lg`.

- **Teintes plus vives.** Les teintes expressives (`tint-x` fond pastel et `tint-x-bold`
  aplat de décor) sont un peu plus saturées dans `inertia/css/app.css` : abricot, prairie,
  lac, lavande, fleur, ciel. Noms inchangés, `tint-x-ink` inchangés, contrastes revérifiés
  (≥ 6,2:1 sur chaque `tint-x`). Le paysage, le compagnon, le maillage et les badges en
  bénéficient. `DESIGN.md` §2 mis à jour.
- **Voile allégé.** `HeroBackdrop` en scène `landscape` : voile `canvas` plus court
  (`via-45%`, 70 % au centre sur desktop, dégradé jusqu'à transparent sur mobile) pour laisser
  voir le soleil, le lac et la prairie, sans jamais poser de texte sur un `-bold`.
- **Compagnon sur mobile.** Le droïde du héros n'est plus masqué sous `lg` : 96 px posé au
  coin du mockup, 160 px à partir de `lg`.
- **Tests.** `individuals.spec.tsx` : tailles responsives du compagnon, plus de `hidden`.

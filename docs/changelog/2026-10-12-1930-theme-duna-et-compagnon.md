# 2026-10-12 — Thème Duna fidèle et compagnon du candidat

Le design system s'appelait « Duna × Ditto » mais gardait une encre bleu nuit, un canvas ivoire
et des pastels vifs. La palette est maintenant relevée sur la page d'accueil de Duna (encre noire
chaude, page blanche et sections pierre, soleil or, teintes terreuses de coucher de soleil), et
le candidat gagne un compagnon illustré : un petit droïde sphérique (boule à panneaux
circulaires, dôme à lentilles et antennes), dessiné en formes plates avec les couleurs du héros.

- **Palette.** Tous les noms de tokens sont conservés, seules les valeurs changent dans
  `inertia/css/app.css` (`ink` #1c1512, `canvas` #fcfbf8, `sun` #f0a848, `accent` #3d6168, teintes
  `-bold` mauves, sauge, ardoise…). Contrastes WCAG revérifiés (texte ≥ 4,5:1, `tint-x-ink`
  ≥ 6,2:1). Recopies alignées : `theme-color` du layout Edge, `site.webmanifest`, couleur de la
  barre de progression Inertia. `DESIGN.md` §1–2 mis à jour.
- **Compagnon.** Nouveau composant `ui/Companion` (`inertia/components/ui/companion/`) : SVG
  inline décoratif (`aria-hidden`), uniquement des `var(--color-*)`, cinq postures (`wave`,
  `cheer`, `think`, `guard`, `rest`), tailles 48/96/160/240 px, `tone="inverse"` sur ink,
  animations `companion-*` coupées par `prefers-reduced-motion`. Règle DESIGN.md : jamais seul
  porteur de sens, jamais sur un `tint-bold`, jamais plus d'un par écran.
- **Emplacements.** Héros de l'accueil particuliers (remplace la puce « Analyse IA prête »),
  carte sombre des accueils candidat B2C et B2B, `AuthShell` (prop `companion`, `think` pour les
  liens invalides), carte « réservé au forfait » (non compacte), page de succès du paiement
  (`cheer` / `think`), états vides du chat et des commentaires de l'expert. Section « 08 —
  Compagnon » dans la vitrine du design system.
- **Tests.** `tests/inertia/components/ui/Companion.spec.tsx` (aucune couleur en dur, tons,
  accessoires, ids uniques, animation), `CompanionShowcase.spec.tsx`, et une assertion par
  écran intégré. Hygiène design tokens inchangée (cliquets intacts).

# 2026-10-01 — Design system : palette « Duna × Ditto » et paysage apaisant

La phase 1 avait posé un design sobre, presque monochrome (crème, encre, un teal, un
terracotta). Inspirée de deux références getdesign.md — Duna (hero peint aux tons de coucher
de soleil) et Ditto (ivoire, encre bleu nuit, accents vifs, bouton principal encre et bouton
secondaire jaune) — cette passe revoit toutes les couleurs et ajoute le seul bloc illustratif
du système : un paysage calme dessiné avec les nouvelles teintes.

- **Tokens** (`inertia/css/app.css`). Canvas ivoire `#f7f5ee`, encre `#1b2140` plus bleue.
  `primary` devient l'encre (bouton principal) ; le teal du logo devient `accent` (liens,
  focus, sur-titres, état actif) ; nouveau `sun` (bouton secondaire, texte encre, seul
  bouton plein lisible sur ink). Famille de teintes expressives à trois niveaux
  (`tint-x`, `tint-x-ink`, `tint-x-bold`) : `sun`, `apricot`, `meadow`, `lake`, `lavender`,
  `blossom`, `sky`. `warning` passe au pêche pour ne pas se confondre avec le soleil.
  Supprimés : `accent-warm*`, `primary-on-ink`, `tint-sage/teal/sand/terracotta`,
  `brand-violet` (aucun usage). Alias `brand-sage` → `accent`, `brand-terracotta` →
  `tint-apricot-ink`. Contrastes vérifiés par script (texte ≥ 4,5:1, `muted-soft` réservé aux
  placeholders). Focus `accent`, sélection `sun-soft`.
- **Primitives.** `Button` : `primary` encre, `secondary` soleil (`emphasis` et `cta` →
  `secondary`). `Card` : `sun`, `accent` (`warm`/`amber`/`sage` dépréciés). `Badge` : tons
  renommés, anciens noms mappés (`pink` → `blossom`). `Eyebrow` : ton `accent` par défaut,
  `inverse` = `accent-on-ink`. Champs : focus `accent`.
- **Marketing et auth.** Liens `text-accent` (un lien en encre se fondait dans le texte),
  tuiles d'icône soleil (`FeatureCard`, `BulletList`, méthodologie, `AuthShell`), CTA posés
  sur une surface ink (`CtaBand`, tier `PricingTierCard` mis en avant) en bouton soleil —
  un bouton encre y serait invisible. Filet apricot sur les liens invalides.
- **Paysage.** `LandscapeArt` (`inertia/components/marketing/`) : SVG inline, `aria-hidden`,
  aucune couleur en dur (tout en `var(--color-…)`). Variante `hero` en panorama au-dessus
  du hero d'accueil, `dusk` (silhouettes au bas de `CtaBand`), `horizon` (derrière la carte
  d'authentification, à partir de sm). Vitrine : section « Illustration ».
- **Migration dashboard, amorce.** Les 17 composants de `ui/` et `layout/` encore sur
  `brand-*`/`slate-*`/`rose-*`/`violet-*` passent aux rôles nommés (navigation, fil
  d'Ariane, modales, champs date/combobox/select, notes — note partagée en `blossom`,
  avertissement en `warning` —, `StatCard`, `MarkdownContent`, `Layout`, `Avatar`,
  `FlashBanner`). Au passage, `ConfirmModal` renvoyait des variantes `terracotta`/`lime`
  inexistantes (classe `undefined` rendue) : `warning` → soleil, `success` → encre.
- **Coquille.** `site.webmanifest` (`theme_color` encre, `background_color` ivoire),
  `theme-color` ivoire, barre de progression Inertia = `accent`.
- **Doc.** `DESIGN.md` §1, 2, 5, 7 réécrits ; `CLAUDE.md` « Design system ».
- **Tests.** Specs Vitest mis à jour (Button, Card, Badge, Eyebrow, champs, AuthShell,
  FeatureCard, PricingTierCard, CtaBand, FlashBanner, StatCard, AppLink, DesignSystem,
  LandingPage) ; nouveaux specs `LandscapeArt` et `ConfirmModal` (aucune classe
  `undefined`). Garde Japa `tests/unit/hygiene/design_tokens.spec.ts` : cliquet par dossier
  des classes legacy (surfaces publiques, `ui/`, `layout/` à zéro), tokens retirés absents,
  aucune collision `--color-x`/`--text-x`, `accent-on-ink` sur les surfaces ink.
- **Suite.** Dashboard phases 2–4 (pages, outils d'exercices, retrait des alias `brand-*`) ;
  graphiques recharts, PDF et e-mail de contact à aligner sur `ink` et `tint-*-bold`.

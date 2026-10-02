# 2026-10-02 — B2C : alignement des pages sur le design system Duna × Ditto (#90)

La refonte couleurs (#114, fusionnée dans `main` puis dans `epic/b2c`) réserve
`text-accent` (teal) aux liens et `primary` (encre) à l'action : un lien en
`text-primary` se fond dans le texte. Les écrans ajoutés par l'épic B2C avant
cette refonte sont alignés.

- **Inscription des particuliers** (`RegisterCandidatePage`) : liens « Se connecter »,
  CGU et politique de confidentialité en `text-accent` ; case CGU en `accent-primary`
  avec focus `accent` ; libellé en `text-ink-soft` (`text-foreground` n'était pas un token).
- **CGU / CGV** (`TermsOfServicePage`, `TermsOfSalePage`) : liens internes et `mailto:`
  en `text-accent`, comme la politique de confidentialité.
- **Tests.** Suites Vitest existantes des pages concernées, garde
  `tests/unit/hygiene/design_tokens.spec.ts` verte.

# 2026-10-10 — Refonte marketing, lot 1 : fondations

Premier lot de la refonte des pages publiques inspirée de stripe.com.

- **Design system.** `DESIGN.md` §5 bis « Couche marketing » : maillage animé `bg-hero-mesh`
  (`animate-mesh-drift`, teintes `-bold` seulement), ombre `shadow-floating`, `perspective-hero`,
  `bg-grid-hairline`, `clip-skew-b` (`inertia/css/app.css`). Réservés à
  `inertia/components/{marketing,landing,layout}` (garde `tests/unit/hygiene/design_tokens.spec.ts`).
- **Mouvement.** Primitives `motion` dans `inertia/components/ui/motion/` : `RevealGroup`,
  `RevealItem`, `CountUp`, `Parallax`, `TiltCard`, toutes statiques sous `prefers-reduced-motion`.
  En test, `matchMedia` est stubé en mouvement réduit (`tests/inertia/setup.ts`).
- **Méga-menu.** `MARKETING_NAV` / `CABINET_NAV` remplacés par des groupes riches
  (`MARKETING_MENU`, `CABINET_MENU` : Particuliers, Cabinets, Ressources) ;
  `layout/MegaMenu.tsx` (Headless UI `Popover`), `MobileMenu` en sections, footer en quatre
  colonnes dérivées du menu. En-tête transparent en haut de page, solidifié au scroll
  (`inertia/hooks/use_scrolled.ts`).
- **Tests.** `tests/inertia/components/ui/motion/*`, `layout/MegaMenu.spec.tsx`,
  `hooks/use_scrolled.spec.tsx`, specs du header, du menu mobile, du footer et de la config.

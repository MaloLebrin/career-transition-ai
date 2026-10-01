# 2026-10-01 — Design system « Transition Carrière », phase 1 : fondations, marketing, auth, erreurs

Le rendu faisait « template IA générique » : micro-texte en majuscules partout, rayons de
40 à 64 px, couleurs en opacité (`brand-navy/40`) et hors palette (`slate-*`, `rose-*`),
classes copiées-collées, contenu marketing peu crédible (logos factices, stats inventées,
« Gemini 3 Pro » alors que la page sécurité dit Mistral) et cinq noms de marque. Cette
première phase pose un contrat de design et l'applique aux surfaces publiques ; le dashboard
suit en phases 2 à 4.

- **Contrat.** `DESIGN.md` à la racine (format getdesign.md : vue d'ensemble, rôles de
  couleur, typographie, layout, composants, responsive, lacunes connues), référencé depuis
  `CLAUDE.md` et `docs/README.md`.
- **Tokens.** `inertia/css/app.css` : rôles sémantiques (`canvas`, `surface`, `hairline`,
  `ink`, `muted`, `primary` dérivé du teal du logo, `accent-warm`, sémantique, teintes pastel),
  échelle `text-display-*` → `text-eyebrow`, ombres `card`/`raised`, animations `fade-in` /
  `slide-up` / `shake` enfin définies. Manrope pour les titres, Inter pour l'interface.
  Contrastes vérifiés (le sauge `#6e8f80` était à 3,6:1 ; `primary` est à 6,3:1). Les anciens
  `brand-*` restent des alias pour le dashboard.
- **Primitives.** Button, Card, Badge, Input (scindé), Textarea, Logo (mark PNG + wordmark),
  Container, Eyebrow, SectionHeading ; variantes legacy conservées en alias dépréciés.
- **Marque.** « Transition Carrière » partout (APP_NAME, en-tête, e-mails, manifest, favicons
  regénérés depuis le mark, docs, exemples d'env).
- **Layouts publics.** En-tête collant avec `aria-current`, menu mobile (headlessui), footer
  sombre ; nav et actions dans `inertia/config/marketing.ts` ; contrat par liens, plus de
  callbacks.
- **Pages.** Accueil réécrite sur le catalogue réel des huit exercices et un aperçu statique du
  produit (plus de popups flottantes, logos, avatars ni chiffres inventés ; Mistral AI partout) ;
  offre, tarifs, méthodologie sur les blocs partagés (`MarketingSection`, `FeatureCard`,
  `BulletList`, `CtaBand`, `PricingTierCard`, `MarketingDemoSection`) ; pages légales en
  document (`LegalDocument`) sans CTA ; auth et onboarding sur `AuthShell` (plus de split-screen
  avec statistiques) ; 404/500 en français (`ErrorPage`), sans fuite du message d'erreur.
- **Nettoyage.** `Auth.tsx`/`AuthPage.tsx` orphelins et `floating-popups/` supprimés,
  `lang="fr"`, `w-screen` retiré, barre de progression Inertia à la couleur primaire,
  dicebear retiré de la CSP. Les 15 pages dashboard orphelines sont laissées à la phase 2.
- **Vitrine.** `/dashboard/super-admin/design-system` réécrite en sections (couleurs lues
  depuis les variables du thème, typographie, boutons, badges, champs, cartes).
- **Tests.** Specs Vitest mis à jour sur les nouvelles classes et le nouveau contrat de layout ;
  nouveaux specs pour chaque primitive, bloc marketing, layout, page auth et page d'erreur.
- **Suite.** Phase 2 : shell dashboard (header, sidebar, modales, FlashBanner, StatCard,
  PageHeader/DataTable/EmptyState). Phase 3 : pages dashboard. Phase 4 : outils d'exercices
  et suppression des alias `brand-*`.

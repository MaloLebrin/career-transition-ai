# DESIGN.md — Transition Carrière

Contrat de design lisible par les humains et les agents de code. À lire avant toute
modification d'interface. Les tokens sont déclarés dans `inertia/css/app.css`
(Tailwind v4 `@theme`) ; les primitives dans `inertia/components/ui/`.

Format inspiré des DESIGN.md de getdesign.md (catégorie Productivity & SaaS :
Cal.com, Intercom, Zapier, Notion), adapté à un métier d'accompagnement humain.

---

## 1. Vue d'ensemble

Transition Carrière est un logiciel B2B pour les cabinets de transition professionnelle
(bilans de compétences, outplacement). L'interface doit inspirer **le calme, la rigueur
et la chaleur** : un cabinet sérieux, pas une start-up qui crie.

Direction « éditorial chaleureux » :

- **Canvas crème** (`canvas` #faf8f4), pas blanc pur. Les cartes sont blanches
  (`surface`) avec une **bordure hairline** de 1 px, jamais d'ombre lourde.
- **Encre bleu nuit** (`ink` #1e2f3f) pour les titres et la seule surface sombre de
  chaque page (footer, bande CTA, offre mise en avant).
- **Un seul accent d'action** : le teal du logo (`primary` #1d6a70). Il n'apparaît que
  là où l'utilisateur agit ou doit regarder : bouton principal, lien actif, focus,
  sur-titres. Jamais en décoration de fond.
- **Un accent chaud** (terracotta `accent-warm` #a85a38) réservé aux CTA de conversion
  secondaires et aux avertissements doux.
- **Hiérarchie par la typographie** (Manrope pour les titres, Inter pour l'interface),
  jamais par des majuscules espacées ni des micro-tailles.
- **Rayons modestes** : 8 px boutons et champs, 12 px cartes, 16 px mockups et bandes,
  pleine rondeur pour badges et avatars seulement.
- **Contenu honnête** : pas de chiffres inventés, pas de logos de confiance factices,
  pas de maquette qui prétend être le produit. Le catalogue d'exercices réel est la preuve.

### Règles absolues

| Faire                                                          | Ne jamais faire                                                                    |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Rôles de couleur nommés (`text-muted`, `bg-surface-soft`)      | `slate-*`, `rose-*`, `violet-*`, `white/40`, `brand-*` (alias en cours de retrait) |
| Casse de phrase partout, `Eyebrow` 14 px/500 pour un sur-titre | `uppercase tracking-widest`, `text-[9–11px]`                                       |
| `font-semibold` (600) ou `font-bold` (700) pour l'emphase      | `font-black`                                                                       |
| `shadow-card` ou `shadow-raised`                               | Toute autre ombre, `blur-*` décoratif, glassmorphism                               |
| `rounded-lg` / `rounded-xl` / `rounded-2xl` / `rounded-full`   | `rounded-[Npx]`, `rounded-3xl` et au-delà sur une carte                            |
| `AppLink` pour la navigation interne                           | `<a href="/…">` (sauf exception documentée par `eslint-disable`)                   |

---

## 2. Rôles de couleur

Contrastes mesurés (WCAG) sur blanc / crème.

### Surfaces

| Token             | Hex     | Usage                                            |
| ----------------- | ------- | ------------------------------------------------ |
| `canvas`          | #faf8f4 | Fond de page                                     |
| `surface`         | #ffffff | Cartes, champs, en-tête                          |
| `surface-soft`    | #f3efe8 | Bandes alternées, cartes plates, survol de ligne |
| `surface-strong`  | #e9e4db | Fonds désactivés                                 |
| `hairline`        | #e6e1d8 | Bordures 1 px des cartes et sections             |
| `hairline-strong` | #d3cec4 | Champs, boutons outline                          |

### Encre

| Token                                     | Hex                         | Contraste | Usage                                                       |
| ----------------------------------------- | --------------------------- | --------- | ----------------------------------------------------------- |
| `ink`                                     | #1e2f3f                     | 13,7:1    | Titres ; la surface sombre (footer, CtaBand, tier featured) |
| `ink-elevated`                            | #28394b                     | —         | Carte imbriquée sur ink, survol des boutons `secondary`     |
| `ink-soft`                                | #3d4852                     | 9,3:1     | Texte courant (défaut du `body`)                            |
| `muted`                                   | #5f6b76                     | 5,4:1     | Texte secondaire, descriptions                              |
| `muted-soft`                              | #7d8790                     | 3,7:1     | Placeholders, ≥ 18 px ou décoratif seulement                |
| `on-ink` / `on-ink-soft` / `on-ink-muted` | #ffffff / #b5c0c8 / #8a97a3 | —         | Texte sur surface ink                                       |

### Action

| Token                                | Hex                         | Contraste                | Usage                                                |
| ------------------------------------ | --------------------------- | ------------------------ | ---------------------------------------------------- |
| `primary`                            | #1d6a70                     | 6,3:1 blanc, 5,9:1 crème | Bouton principal, liens actifs, focus, Eyebrow       |
| `primary-pressed`                    | #0f5964                     | —                        | Survol / pressé                                      |
| `primary-soft`                       | #e3efee                     | —                        | Fonds de badge, tuiles d'icône, lignes sélectionnées |
| `primary-on-ink`                     | #7fc4c6                     | 6,9:1 sur ink            | Teal sur surface sombre                              |
| `accent-warm` / `-pressed` / `-soft` | #a85a38 / #8f4a2d / #f6e9e2 | 5,0:1                    | Bouton `cta`, avertissements doux                    |

### Sémantique

`success` #1e7b4f, `warning` #9a5b00, `danger` #b42318, `info` #2b5f9e, chacun avec
une variante `-soft` pour les fonds (≥ 5,2:1 en texte sur blanc).

### Teintes pastel

`tint-sage`, `tint-teal`, `tint-sand`, `tint-terracotta`, `tint-lavender`, `tint-sky`
(+ `-ink` pour le texte) : catégories d'exercices, badges de classification. Jamais
pour une action.

### Alias dépréciés (dashboard, phases 2–4)

`brand-navy` → `ink`, `brand-sage` → `primary`, `brand-terracotta` → `accent-warm`,
`brand-ivory` → `canvas`, `brand-gray` → `muted`, `brand-emerald` → `success`,
`brand-amber` → `warning`, `brand-violet` inchangé. Ne plus les utiliser dans du code
nouveau ; ils seront supprimés quand les outils d'exercices seront refondus.

---

## 3. Typographie

- **Manrope** (`font-display`, 600–800) : h1 à h4, prix, chiffres clés. Appliquée par la
  couche base aux titres.
- **Inter** (`font-sans`, 400–700) : tout le reste.
- Chargées depuis Google Fonts dans `resources/views/inertia_layout.edge`.

| Classe            | Taille | Interligne | Approche | Graisse | Usage                                      |
| ----------------- | ------ | ---------- | -------- | ------- | ------------------------------------------ |
| `text-display-xl` | 64 px  | 1,05       | −0,025em | 600     | h1 de la page d'accueil (≥ md)             |
| `text-display-lg` | 48 px  | 1,1        | −0,02em  | 600     | h1 des pages marketing                     |
| `text-display-md` | 36 px  | 1,15       | −0,015em | 600     | h2 de section, h1 des documents légaux     |
| `text-display-sm` | 28 px  | 1,2        | −0,01em  | 600     | h1 des écrans auth, prix                   |
| `text-title-lg`   | 22 px  | 1,3        | −0,01em  | 600     | Titres de carte importants, h2 de document |
| `text-title-md`   | 18 px  | 1,4        | 0        | 600     | Titres de carte                            |
| `text-title-sm`   | 16 px  | 1,4        | 0        | 600     | Petits titres, libellés forts              |
| `text-body-lg`    | 18 px  | 1,5        | 0        | 400     | Chapeaux, descriptions de section          |
| `text-base`       | 16 px  | 1,5        | 0        | 400     | Texte courant                              |
| `text-sm`         | 14 px  | 1,5        | 0        | 400     | Texte de carte, formulaires, footer        |
| `text-caption`    | 13 px  | 1,4        | 0        | 500     | Badges, méta                               |
| `text-eyebrow`    | 14 px  | 1,3        | 0        | 500     | Sur-titres (`Eyebrow`), casse de phrase    |

`SectionHeading` applique la réduction responsive (ex. `display-xl` → 48 px sous md).

---

## 4. Layout et espacement

- **Base 4 px**, échelle Tailwind.
- **Conteneurs** (`Container`) : `marketing` 1200 px, `narrow` 768 px (documents
  légaux, FAQ), `prose` 65 ch. Gouttières latérales 24 px.
- **Sections marketing** (`MarketingSection`) : 64 px vertical sur mobile, 96 px à partir
  de md. Les tons alternent `canvas` → `surface` (avec hairlines) → `soft`, et chaque
  page se termine par `CtaBand` puis le footer `ink`.
- **Cartes** : padding 24 px (`md`) en marketing, 32 px (`lg`) dans le dashboard,
  16 px (`sm`) pour les listes denses. Gouttière 16 px entre cartes.
- **En-tête public** : 64 px, collant, `canvas/90` + flou, hairline en bas.
- **Dashboard** (phase 2) : conteneur `max-w-7xl` puis `--width-app-container` (1536 px).

---

## 5. Composants

| Composant                                                                                                                                                                    | Fichier                           | Règles                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                                                                                                                                                                     | `ui/Button.tsx`                   | `primary` (teal), `secondary` (ink), `outline`, `ghost`, `danger`, `cta` (terracotta). Tailles 36/40/48 px, `rounded-lg`, 600. `buttonClassName()` pour un lien-bouton (`AppLink`). Jamais un `<Button>` dans un `<a>`. |
| `Card`                                                                                                                                                                       | `ui/Card.tsx`                     | `default` (surface + hairline + `shadow-card`), `flat`, `dark` (ink), `warm`, `primary`. `padding` none/sm/md/lg, `interactive` pour l'élévation au survol.                                                             |
| `Badge`                                                                                                                                                                      | `ui/Badge.tsx`                    | Tons sémantiques et pastels, 24 px, pilule, `text-caption`, option `dot`.                                                                                                                                               |
| `Input`, `Textarea`                                                                                                                                                          | `ui/Input.tsx`, `ui/Textarea.tsx` | Label 14 px/500 `ink`, champ 36/40/44 px `hairline-strong`, focus `primary`, erreur `danger` sans fond rosé, messages 14 px. Classes partagées dans `ui/input/input_classes.ts`.                                        |
| `Logo`                                                                                                                                                                       | `ui/Logo.tsx`                     | Mark PNG + wordmark `APP_NAME` ; `tone="inverse"` sur ink.                                                                                                                                                              |
| `Container`, `Eyebrow`, `SectionHeading`                                                                                                                                     | `ui/`                             | Largeurs, sur-titre, en-tête de section (eyebrow + titre + description).                                                                                                                                                |
| `PublicLayout`, `PublicHeader`, `PublicFooter`, `MobileMenu`                                                                                                                 | `layout/`                         | Coquille publique ; nav et actions dans `inertia/config/marketing.ts`. `header={{ minimal: true }} footer={false}` pour l'auth.                                                                                         |
| `MarketingSection`, `FeatureCard`, `BulletList`, `CtaBand`, `ProductMockup`, `ExerciseCatalogue`, `PricingTierCard`, `MarketingDemoSection`, `LegalDocument`, `LegalSection` | `marketing/`                      | Blocs de page marketing. Un hero = `SectionHeading level={1}` + actions ; une page légale = `LegalDocument` sans CTA.                                                                                                   |
| `AuthShell`                                                                                                                                                                  | `auth/AuthShell.tsx`              | Carte centrée 448 px, en-tête minimal, `accent="warm"` pour les liens invalides.                                                                                                                                        |
| `ErrorPage`                                                                                                                                                                  | `errors/ErrorPage.tsx`            | 404/500 en français, sans `PublicLayout` ni props Inertia.                                                                                                                                                              |

États : focus visible par anneau `primary` (couche base), désactivé à 50 %, chargement par
spinner dans le bouton. Mouvement : `animate-fade-in`, `animate-slide-up`,
`animate-shake` (erreurs de formulaire), respect de `prefers-reduced-motion`.

---

## 6. Responsive

| Point de rupture | Comportement                                                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| < 768 px         | Menu hamburger (`MobileMenu`, panneau latéral), actions dans le panneau ; hero empilé (texte puis mockup) ; grilles à 1 colonne ; sections 64 px ; `display-xl` → 48 px. |
| 768–1024 px      | Nav horizontale, grilles 2 colonnes, tiers tarifaires 2 + 1.                                                                                                             |
| ≥ 1024 px        | Hero 7/5, grilles 3 ou 4 colonnes, conteneur 1200 px.                                                                                                                    |

Cibles tactiles ≥ 40 px (boutons `md`), 44 px pour les champs `lg`. Aucun défilement
horizontal à 375 px : pas de largeur fixe, pas de `w-screen`, titres en `break-words`.

---

## 7. Lacunes connues

- **Dashboard** (shell, sidebar, pages conseiller/admin/candidat) et **outils
  d'exercices** : encore sur les alias `brand-*`, `slate-*`, `rose-*`, `violet-*`,
  micro-texte en majuscules et `rounded-[Npx]`. Refonte en phases 2 à 4 (voir le plan
  dans `docs/changelog/`).
- Pas de mode sombre : la seule surface sombre est `ink`.
- Pages légales : les mentions `[à compléter]` attendent les informations de l'éditeur.
- Graphiques (recharts) : couleurs à aligner sur `tint-*-ink` en phase 4.
- Favicons regénérés depuis le mark ; un SVG du logo serait préférable au PNG.

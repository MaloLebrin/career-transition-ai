# DESIGN.md — Transition Carrière

Contrat de design lisible par les humains et les agents de code. À lire avant toute
modification d'interface. Les tokens sont déclarés dans `inertia/css/app.css`
(Tailwind v4 `@theme`) ; les primitives dans `inertia/components/ui/`.

Format inspiré des DESIGN.md de getdesign.md (catégorie Productivity & SaaS :
Cal.com, Intercom, Zapier, Notion), adapté à un métier d'accompagnement humain.

---

## 1. Vue d'ensemble

Transition Carrière s'adresse d'abord aux particuliers qui font le point sur leur carrière
en autonomie (accueil `/`), et aux cabinets de transition professionnelle (bilans de
compétences, outplacement) sur leur espace dédié (`/cabinets`). L'interface doit inspirer **le calme, la rigueur
et la chaleur** : un cabinet sérieux, pas une start-up qui crie.

Direction « Duna × Ditto » (références getdesign.md) : l'ivoire et l'encre de Ditto, les
teintes de coucher de soleil de Duna.

- **Canvas ivoire** (`canvas` #f7f5ee), pas blanc pur. Les cartes sont blanches
  (`surface`) avec une **bordure hairline** de 1 px, jamais d'ombre lourde.
- **Encre bleu nuit** (`ink` #1b2140) pour les titres, **le bouton principal** (`primary`
  = encre) et la seule surface sombre de chaque page (footer, bande CTA, offre mise en avant).
- **Un bouton soleil** (`sun` #f3c53d, texte encre) pour le CTA secondaire et pour tout
  bouton plein posé sur une surface ink. Jamais de texte blanc sur soleil.
- **Un accent de signal** : le teal du logo (`accent` #1d6a70), là où l'utilisateur doit
  regarder sans agir fort : liens, état actif de navigation, focus, sur-titres. Jamais en
  fond de bouton, jamais en décoration.
- **Une famille de teintes expressives** à trois niveaux (`tint-x` fond pastel, `tint-x-ink`
  texte dessus, `tint-x-bold` aplat saturé) : soleil, abricot, prairie, lac, lavande, fleur,
  ciel. Elles classent (badges, catégories) et illustrent (`LandscapeArt`, graphiques) —
  elles n'actionnent jamais, et aucun texte ne se pose sur un `-bold`.
- **Un seul bloc illustratif** : `LandscapeArt`, un paysage calme en formes plates (ciel
  abricot, soleil, montagnes lavande, lac, prairie). Pas de photo, pas de flou ; le seul
  autre dégradé est le maillage de la couche marketing (§5 bis).
- **Hiérarchie par la typographie** (Manrope pour les titres, Inter pour l'interface),
  jamais par des majuscules espacées ni des micro-tailles.
- **Rayons modestes** : 8 px boutons et champs, 12 px cartes, 16 px mockups et bandes,
  pleine rondeur pour badges et avatars seulement.
- **Contenu honnête** : pas de chiffres inventés, pas de logos de confiance factices,
  pas de maquette qui prétend être le produit. Le catalogue d'exercices réel est la preuve.

### Règles absolues

| Faire                                                               | Ne jamais faire                                                                    |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Rôles de couleur nommés (`text-muted`, `bg-surface-soft`)           | `slate-*`, `rose-*`, `violet-*`, `white/40`, `brand-*` (alias en cours de retrait) |
| `bg-primary` (encre) pour agir, `text-accent` pour signaler         | `bg-accent` sur un bouton, `text-primary` sur un lien (il se fond dans l'encre)    |
| `bg-sun text-ink` pour le bouton secondaire / sur ink               | Texte blanc sur soleil, bouton `primary` dans une surface `bg-ink`                 |
| `tint-x` + `tint-x-ink` pour classer, `tint-x-bold` pour illustrer  | Du texte sur un `tint-x-bold`, `text-accent` sur `bg-ink` (→ `accent-on-ink`)      |
| Casse de phrase partout, `Eyebrow` 14 px/500 pour un sur-titre      | `uppercase tracking-widest`, `text-[9–11px]`                                       |
| `font-semibold` (600) ou `font-bold` (700) pour l'emphase           | `font-black`                                                                       |
| `shadow-card` ou `shadow-raised` (+ `shadow-floating` en marketing) | Toute autre ombre, `blur-*` décoratif, glassmorphism                               |
| `rounded-lg` / `rounded-xl` / `rounded-2xl` / `rounded-full`        | `rounded-[Npx]`, `rounded-3xl` et au-delà sur une carte                            |
| `AppLink` pour la navigation interne                                | `<a href="/…">` (sauf exception documentée par `eslint-disable`)                   |

---

## 2. Rôles de couleur

Contrastes WCAG mesurés (luminance relative) sur blanc / ivoire. Hex dans
`inertia/css/app.css` ; nuancier vivant sur `/dashboard/super-admin/design-system`.

### Surfaces

| Token             | Hex     | Usage                                            |
| ----------------- | ------- | ------------------------------------------------ |
| `canvas`          | #f7f5ee | Fond de page, ivoire                             |
| `surface`         | #ffffff | Cartes, champs, en-tête                          |
| `surface-soft`    | #f0ede2 | Bandes alternées, cartes plates, survol de ligne |
| `surface-strong`  | #e5e1d3 | Fonds désactivés                                 |
| `hairline`        | #e2ded0 | Bordures 1 px des cartes et sections             |
| `hairline-strong` | #cdc8b7 | Champs, boutons outline                          |

### Encre

| Token                                     | Hex                         | Contraste        | Usage                                                         |
| ----------------------------------------- | --------------------------- | ---------------- | ------------------------------------------------------------- |
| `ink`                                     | #1b2140                     | 15,7:1 / 14,4:1  | Titres, bouton principal, la surface sombre (footer, CtaBand) |
| `ink-elevated`                            | #272e52                     | —                | Carte imbriquée sur ink, bouton principal pressé              |
| `ink-soft`                                | #3a4060                     | 10,1:1 / 9,3:1   | Texte courant (défaut du `body`)                              |
| `muted`                                   | #5f6680                     | 5,7:1 / 5,2:1    | Texte secondaire, descriptions                                |
| `muted-soft`                              | #767c91                     | 4,2:1 / 3,8:1    | Placeholders, ≥ 18 px ou décoratif seulement                  |
| `on-ink` / `on-ink-soft` / `on-ink-muted` | #ffffff / #b9bdd3 / #9298b5 | 15,7 / 8,4 / 5,5 | Texte sur surface ink                                         |

### Action

| Token                  | Hex                        | Contraste               | Usage                                                        |
| ---------------------- | -------------------------- | ----------------------- | ------------------------------------------------------------ |
| `primary` / `-pressed` | = `ink` / = `ink-elevated` | 15,7:1 blanc dessus     | Bouton principal, lignes sélectionnées                       |
| `primary-soft`         | #eceef5                    | 13,5:1 encre dessus     | Fond de badge `primary`, ligne sélectionnée                  |
| `accent` / `-pressed`  | #1d6a70 / #0f5964          | 6,3:1 blanc, 5,8 ivoire | Liens, état actif de navigation, focus, `Eyebrow`            |
| `accent-soft`          | #dcedf0                    | 5,2:1 accent dessus     | État actif (sidebar), tuiles discrètes, carte `accent`       |
| `accent-on-ink`        | #7fc4c6                    | 7,9:1 sur ink           | Teal sur surface sombre (eyebrow inverse, coches)            |
| `sun` / `-pressed`     | #f3c53d / #e5b528          | 9,6:1 / 8,2:1 encre     | Bouton `secondary` (texte `ink`), bouton plein sur ink       |
| `sun-soft`             | #fbf0c8                    | 13,8:1 encre            | Tuiles d'icône (`tint-sun`), carte `sun`, sélection de texte |

### Sémantique

`success` #1b734a, `warning` #8f5400, `danger` #b42318, `info` #2b5f9e, chacun avec
une variante `-soft` pour les fonds (#e3f3ea, #fce4cc pêche, #fbe9e7, #e6eef8 ; ≥ 5,0:1 en
texte sur son fond). `warning-soft` est pêche, pas jaune : le jaune est le soleil.

### Teintes expressives

Trois niveaux par teinte : `tint-x` (fond pastel), `tint-x-ink` (texte dessus, ≥ 6,2:1),
`tint-x-bold` (aplat saturé : `LandscapeArt`, graphiques, formes — jamais de texte dessus,
ne jamais combiner `-ink` et `-bold`).

| Teinte     | `tint-x`     | `tint-x-ink`       | `tint-x-bold` | Évoque                       |
| ---------- | ------------ | ------------------ | ------------- | ---------------------------- |
| `sun`      | = `sun-soft` | #6b4a00            | = `sun`       | Le soleil de Duna            |
| `apricot`  | #fde5d4      | #8a3f12            | #f09a5c       | Le ciel au couchant          |
| `meadow`   | #ddefdf      | #22613a            | #5aaa6a       | La prairie                   |
| `lake`     | #d9eef0      | = `accent-pressed` | #2a8d96       | Le lac, le teal du logo      |
| `lavender` | #e9e4f8      | #45348f            | #8b76d6       | Les montagnes                |
| `blossom`  | #fbe1ec      | #8c2459            | #e1609f       | Les fleurs, le magenta Ditto |
| `sky`      | #e0e9fb      | #1f3f8c            | #3f78dd       | Le bleu Ditto                |

Usage : catégories d'exercices, badges de classification, notes partagées (`blossom`),
compteur de la sidebar (`apricot`). Jamais pour une action.

### Alias dépréciés (dashboard, phases 2–4)

`brand-navy` → `ink`, `brand-sage` → `accent`, `brand-terracotta` → `tint-apricot-ink`,
`brand-ivory` → `canvas`, `brand-gray` → `muted`, `brand-emerald` → `success`,
`brand-amber` → `warning`. `brand-violet` a été supprimé (aucun usage). Ne plus les
utiliser dans du code nouveau ; `tests/unit/hygiene/design_tokens.spec.ts` fige leur
nombre par dossier (cliquet) et interdit tout retour dans `ui/`, `layout/`, `marketing/`,
`auth/`, `landing/`, `errors/`, `design-system/`.

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
- **En-tête public** : 64 px, collant, transparent en haut de page puis `canvas/90` + flou
  et hairline en bas dès le scroll (`useScrolled`).
- **Dashboard** (phase 2) : conteneur `max-w-7xl` puis `--width-app-container` (1536 px).

---

## 5. Composants

| Composant                                                                                                                                                               | Fichier                           | Règles                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                                                                                                                                                                | `ui/Button.tsx`                   | `primary` (encre), `secondary` (soleil, texte encre — aussi le bouton plein sur ink), `outline`, `ghost`, `danger` ; `cta` et `emphasis` dépréciés → `secondary`. Tailles 36/40/48 px, `rounded-lg`, 600. `buttonClassName()` pour un lien-bouton (`AppLink`). Jamais un `<Button>` dans un `<a>`, jamais `primary` dans une `Card dark`. |
| `Card`                                                                                                                                                                  | `ui/Card.tsx`                     | `default` (surface + hairline + `shadow-card`), `flat`, `dark` (ink), `sun`, `accent`, `primary` ; `warm`/`amber` → `sun`, `sage` → `accent` dépréciés. `padding` none/sm/md/lg, `interactive` pour l'élévation au survol.                                                                                                                |
| `Badge`                                                                                                                                                                 | `ui/Badge.tsx`                    | Tons sémantiques et teintes expressives (`sun`, `apricot`, `meadow`, `lake`, `lavender`, `blossom`, `sky`), 24 px, pilule, `text-caption`, option `dot`. Anciens noms Tailwind et anciennes teintes mappés (`pink` → `blossom`, `terracotta` → `apricot`…).                                                                               |
| `Input`, `Textarea`                                                                                                                                                     | `ui/Input.tsx`, `ui/Textarea.tsx` | Label 14 px/500 `ink`, champ 36/40/44 px `hairline-strong`, focus `accent`, erreur `danger` sans fond rosé, messages 14 px. Classes partagées dans `ui/input/input_classes.ts`.                                                                                                                                                           |
| `Logo`                                                                                                                                                                  | `ui/Logo.tsx`                     | Mark PNG + wordmark `APP_NAME` ; `tone="inverse"` sur ink.                                                                                                                                                                                                                                                                                |
| `Container`, `Eyebrow`, `SectionHeading`                                                                                                                                | `ui/`                             | Largeurs, sur-titre (`accent`, `muted`, `inverse` = `accent-on-ink` ; `primary` déprécié), en-tête de section (eyebrow + titre + description).                                                                                                                                                                                            |
| `LandscapeArt`                                                                                                                                                          | `marketing/LandscapeArt.tsx`      | Le seul bloc illustratif : SVG inline, `aria-hidden`, couleurs en `var(--color-tint-*)`. `hero` (panorama du héros « Qui sommes-nous »), `dusk` (bas de `CtaBand`), `horizon` (derrière la carte `AuthShell`, ≥ sm).                                                                                                                      |
| `PublicLayout`, `PublicHeader`, `PublicFooter`, `MobileMenu`                                                                                                            | `layout/`                         | Coquille publique ; nav et actions dans `inertia/config/marketing.ts`. `header={{ minimal: true }} footer={false}` pour l'auth.                                                                                                                                                                                                           |
| `MarketingSection`, `FeatureCard`, `BulletList`, `CtaBand`, `PageHero`, `ExerciseCatalogue`, `PricingTierCard`, `MarketingDemoSection`, `LegalDocument`, `LegalSection` | `marketing/`                      | Blocs de page marketing. Un hero = `SectionHeading level={1}` + actions ; une page légale = `LegalDocument` sans CTA.                                                                                                                                                                                                                     |
| `AuthShell`                                                                                                                                                             | `auth/AuthShell.tsx`              | Carte centrée 448 px sur un horizon `LandscapeArt`, en-tête minimal, tuile d'icône soleil, `accent="warm"` = filet apricot pour les liens invalides.                                                                                                                                                                                      |
| `ErrorPage`                                                                                                                                                             | `errors/ErrorPage.tsx`            | 404/500 en français, sans `PublicLayout` ni props Inertia.                                                                                                                                                                                                                                                                                |

États : focus visible par anneau `accent` (couche base), sélection de texte `sun-soft`, désactivé à 50 %, chargement par
spinner dans le bouton. Mouvement : `animate-fade-in`, `animate-slide-up`,
`animate-shake` (erreurs de formulaire), respect de `prefers-reduced-motion`. Pages marketing : `RevealGroup` / `RevealItem`, `CountUp`, `Parallax`, `TiltCard`
(`ui/motion/`, §5 bis) ; mockups vivants ; maillage du héros (`animate-mesh-drift`).

---

## 5 bis. Couche marketing

Les pages publiques ont droit à quelques effets de plus, inspirés de stripe.com : un héros
plus spectaculaire, des interfaces produit vivantes, un méga-menu. Ils sont **réservés** à
`inertia/components/{marketing,landing,layout}` (garde `tests/unit/hygiene/design_tokens.spec.ts`)
et ne changent rien au reste du contrat (ivoire, encre, soleil, accent, teintes, casse de phrase).

| Token / utilitaire                             | Usage                                                                                                                                                                      |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bg-hero-mesh` + `animate-mesh-drift`          | Maillage des teintes `-bold` (abricot, fleur, lavande, soleil, lac) qui dérive lentement. Bande du héros, `CtaBand`. Jamais de texte posé dessus sans voile `bg-canvas/…`. |
| `shadow-floating`                              | Troisième ombre : mockups en perspective, panneaux du méga-menu.                                                                                                           |
| `perspective-hero` + `rotate-x-*`/`rotate-y-*` | Mockup produit incliné dans le héros.                                                                                                                                      |
| `bg-grid-hairline`                             | Grille fine de fond (sections produit).                                                                                                                                    |
| `clip-skew-b`                                  | Bord inférieur en diagonale (bande du héros, transitions de section).                                                                                                      |

**Mouvement** (`motion` v11, `inertia/components/ui/motion/`) : `RevealGroup` + `RevealItem`
(apparitions échelonnées au scroll, une fois), `CountUp` (chiffre clé qui compte jusqu'à sa
valeur, rendue d'emblée), `Parallax` (décalage vertical léger), `TiltCard` (inclinaison au
survol, souris seulement). Toutes passent en rendu statique sous `prefers-reduced-motion` ;
en test (jsdom) le mouvement est réduit par défaut (`tests/inertia/setup.ts`).

**Méga-menu** (`layout/MegaMenu.tsx`, config `MARKETING_MENU` / `CABINET_MENU` dans
`inertia/config/marketing.ts`) : un onglet par public (Particuliers, Cabinets, Ressources),
un panneau d'entrées riches (icône sur tuile `tint-x`, titre, une ligne), un appel à l'action
en pied de panneau. Même contenu en sections dans `MobileMenu` et en colonnes dans le footer.
L'en-tête est transparent en haut de page et se solidifie (`canvas/90` + flou) au scroll.

**Blocs** (`marketing/`) : `HeroBackdrop` (maillage + grille + voile, `strong`/`soft`),
`KeyFactsStrip` (chiffres clés), `FeatureTabs` (fonctionnalités en onglets avec mockup),
`StepsTimeline` (étapes le long d'une ligne tracée au scroll), `PrivacyFlow` (parcours des
données avant l'IA). Mockups vivants dans `marketing/mockups/` (`MockupFrame`,
`JourneyMockup`, `AiAnalysisMockup`, `SynthesisMockup`, `ExpertMockup`,
`AdvisorDashboardMockup`) ; `PageHero` (héros des pages secondaires, maillage atténué), animés par
`useMockupStep` (`inertia/hooks/`) et figés sur leur état final en mouvement réduit.

**Contenu honnête** (§1) : les chiffres clés sont des faits produit (nombre d'exercices,
prix réel, hébergement) ; un mockup vivant porte la mention « Aperçu illustratif » et
n'utilise que les vrais noms d'exercices.

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
- Dashboard : les boutons `secondary`/`emphasis` sont passés au soleil et `brand-navy` à une
  encre plus bleue sans revue page par page ; `ConfirmModal` rendait une classe `undefined`
  pour `warning`/`success` (corrigé : soleil / encre).
- Pas de mode sombre : la seule surface sombre est `ink`.
- Pages légales : les mentions `[à compléter]` attendent les informations de l'éditeur.
- Graphiques (recharts), PDF (`app/services/employee_synthesis_pdf/`, `inertia/services/pdf_service.ts`)
  et e-mail de contact : encore sur l'ancienne encre #1e2f3f et le violet Tailwind ; à aligner
  sur `ink` et `tint-*-bold` en phase 4.
- Favicons regénérés depuis le mark ; un SVG du logo serait préférable au PNG.

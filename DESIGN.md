# DESIGN.md — jumpUjob

Contrat de design lisible par les humains et les agents de code. À lire avant toute
modification d'interface. Les tokens sont déclarés dans `inertia/css/app.css`
(Tailwind v4 `@theme`) ; les primitives dans `inertia/components/ui/`.

Format inspiré des DESIGN.md de getdesign.md (catégorie Productivity & SaaS :
Cal.com, Intercom, Zapier, Notion), adapté à un métier d'accompagnement humain.

---

## 1. Vue d'ensemble

jumpUjob (anciennement Transition Carrière) s'adresse d'abord aux particuliers qui font le
point sur leur carrière en autonomie (accueil `/`), et aux cabinets de transition
professionnelle (bilans de compétences, outplacement) sur leur espace dédié (`/cabinets`).
L'interface doit donner **de l'élan sans brusquer** : « Le saut, oui. Le vide, non. »

Direction « Agrumes » (brief développeur jumpUjob, planches 47 et 50 du canevas
« Logo jumpUjob ») : une page crème, des sections jaune pâle, une encre noir chaud, le galet
jaune du logo et un corail vif pour la marque.

- **Canvas crème** (`canvas` #fffdf5), sections secondaires **jaune pâle** (`surface-soft`
  #fff3c4), filets jaunes (`hairline` #ffe59a). Les cartes sont blanches (`surface`) avec une
  bordure hairline, ombre `shadow-card`.
- **Encre noir chaud** (`ink` #1f1400) pour les titres, **le bouton principal** (`primary`
  = encre, texte blanc, comme sur la planche 47) et la surface sombre (footer, bande CTA).
- **Un bouton secondaire blanc bordé de jaune** (`secondary` : `bg-surface`, bordure 2 px
  `hairline-strong` #ffd96a, texte encre) — aussi le bouton lisible sur une surface ink.
- **Le corail** en deux niveaux : `coral` #ff5a36, la marque (U du nom, décor ; 3,05:1 sur
  crème, donc jamais de texte courant) et `accent` #b23410, sa version lisible (5,6:1 sur
  jaune pâle) pour les liens, l'état actif, le focus et les sur-titres. Jamais en fond de
  bouton.
- **Le soleil** (`sun` #ffc53d), le jaune du galet : tuiles, cartes `sun`, sélection.
- **Cinq couples pastel** fond / point (jaune, menthe, rose, ciel, vert) + pêche et lavande,
  à trois niveaux (`tint-x`, `tint-x-ink`, `tint-x-bold`). Ils classent (badges, pastilles,
  étapes) et illustrent — ils n'actionnent jamais, et aucun texte ne se pose sur un `-bold`.
- **Le logo** : un galet asymétrique jaune qui s'élance d'un plongeoir, le monogramme « jUj »
  dedans (les deux j sans point, les deux points dans le U = le visage). Le nom s'écrit
  `jumpUjob`, le U toujours en corail ; `jumpujob` dans une URL.
- **Une seule famille : Nunito** — 900 pour les titres (tokens `display-*`), 800 pour les
  titres de carte et le nom, 500 pour le texte.
- **Rayons** : boutons en pilule (`rounded-full`), 12 px cartes, 16 px mockups et bandes.
- **Contenu honnête** : pas de chiffres inventés, pas de logos de confiance factices,
  pas de maquette qui prétend être le produit. Le catalogue d'exercices réel est la preuve.

Les palettes de réserve **Tropical** et **Pop** (planches 48 et 49) ne sont pas implémentées :
basculer = changer les valeurs du `@theme` de `inertia/css/app.css`, jamais les composants.

### Règles absolues

| Faire                                                                                                | Ne jamais faire                                                                    |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Rôles de couleur nommés (`text-muted`, `bg-surface-soft`)                                            | `slate-*`, `rose-*`, `violet-*`, `white/40`, `brand-*` (alias en cours de retrait) |
| `bg-primary` (encre) pour agir, `text-accent` pour signaler                                          | `bg-accent` sur un bouton, `text-primary` sur un lien (il se fond dans l'encre)    |
| `Button variant="secondary"` pour le bouton secondaire / sur ink                                     | Texte blanc sur soleil ou corail, bouton `primary` dans une surface `bg-ink`       |
| `tint-x` + `tint-x-ink` pour classer, `tint-x-bold` pour illustrer                                   | Du texte sur un `tint-x-bold`, `text-accent` sur `bg-ink` (→ `accent-on-ink`)      |
| Casse de phrase partout, `Eyebrow` 14 px/500 pour un sur-titre                                       | `uppercase tracking-widest`, `text-[9–11px]`                                       |
| `font-bold` (700) ou `font-extrabold` (800) pour l'emphase ; le 900 passe par les tokens `display-*` | La classe `font-black`, `text-coral` sur du texte courant                          |
| `shadow-card` ou `shadow-raised` (+ `shadow-floating` en marketing)                                  | Toute autre ombre, `blur-*` décoratif, glassmorphism                               |
| `rounded-lg` / `rounded-xl` / `rounded-2xl` / `rounded-full` (boutons)                               | `rounded-[Npx]`, `rounded-3xl` et au-delà sur une carte                            |
| `AppLink` pour la navigation interne                                                                 | `<a href="/…">` (sauf exception documentée par `eslint-disable`)                   |
| `Companion` décoratif, à côté d'un titre ou d'une icône qui porte le sens                            | Un compagnon seul porteur de sens, posé sur un `tint-x-bold`, ou deux par écran    |

---

## 2. Rôles de couleur

Contrastes WCAG mesurés (luminance relative) sur crème / jaune pâle. Hex dans
`inertia/css/app.css` ; nuancier vivant sur `/dashboard/super-admin/design-system`.

### Surfaces

| Token             | Hex     | Usage                                          |
| ----------------- | ------- | ---------------------------------------------- |
| `canvas`          | #fffdf5 | Fond de page, crème                            |
| `surface`         | #ffffff | Cartes, champs, en-tête, bouton secondaire     |
| `surface-soft`    | #fff3c4 | Sections secondaires jaune pâle, cartes plates |
| `surface-strong`  | #ffe9b3 | Fonds désactivés                               |
| `hairline`        | #ffe59a | Filets 1 px des cartes et sections             |
| `hairline-strong` | #ffd96a | Champs, bordure 2 px du bouton secondaire      |

### Encre

| Token                                     | Hex                         | Contraste       | Usage                                                         |
| ----------------------------------------- | --------------------------- | --------------- | ------------------------------------------------------------- |
| `ink`                                     | #1f1400                     | 17,8:1 / 16,3:1 | Titres, bouton principal, la surface sombre (footer, CtaBand) |
| `ink-elevated`                            | #352710                     | —               | Carte imbriquée sur ink, bouton principal pressé              |
| `ink-soft`                                | #3d2e10                     | 12,9:1 crème    | Texte courant (défaut du `body`)                              |
| `muted`                                   | #5c4a1e                     | 8,4:1 / 7,7:1   | Texte secondaire, descriptions                                |
| `muted-soft`                              | #9a8650                     | 3,5:1 crème     | Placeholders, ≥ 18 px ou décoratif seulement                  |
| `on-ink` / `on-ink-soft` / `on-ink-muted` | #ffffff / #f3e6c0 / #cdb98a | 18 / 14,6 / 9,4 | Texte sur surface ink                                         |

### Marque et action

| Token                  | Hex                        | Contraste               | Usage                                                        |
| ---------------------- | -------------------------- | ----------------------- | ------------------------------------------------------------ |
| `primary` / `-pressed` | = `ink` / = `ink-elevated` | 18:1 blanc dessus       | Bouton principal, lignes sélectionnées                       |
| `primary-soft`         | #ffedb8                    | —                       | Fond de badge `primary`, ligne sélectionnée                  |
| `coral`                | #ff5a36                    | 3,05:1 crème, 5,8:1 ink | U du nom, galet et décor ; jamais de texte courant           |
| `accent` / `-pressed`  | #b23410 / #8f2a0c          | 6,2:1 blanc, 5,6 jaune  | Liens, état actif de navigation, focus, `Eyebrow`            |
| `accent-soft`          | #ffe6dc                    | 5,2:1 accent dessus     | État actif (sidebar), tuiles discrètes, carte `accent`       |
| `accent-on-ink`        | #ff8a6e                    | 7,9:1 sur ink           | Corail sur surface sombre (eyebrow inverse, coches)          |
| `sun` / `-pressed`     | #ffc53d / #f5b21e          | 11,5:1 / 9,7:1 encre    | Le jaune du galet : aplats, tuiles ; texte toujours `ink`    |
| `sun-soft`             | #ffe08a                    | 14:1 encre              | Tuiles d'icône (`tint-sun`), carte `sun`, sélection de texte |

Le corail vif `#ff5a36` du brief ne passe pas AA en texte blanc (3,1:1) : il ne sert ni de
fond de bouton ni de couleur de lien. Le bouton principal reste en encre (planche 47).

### Sémantique

`success` #3e6b3a, `warning` #8a4b14, `danger` #a8352a, `info` #3b5f8a, chacun avec
une variante `-soft` pour les fonds (#e6efe1, #fbe3d0 pêche, #f9e6e2, #e5ecf4 ; ≥ 5,3:1 en
texte sur son fond). `warning-soft` est pêche, pas jaune : le jaune est le soleil.

### Teintes expressives

Trois niveaux par teinte : `tint-x` (fond pastel), `tint-x-ink` (texte dessus, ≥ 4,6:1),
`tint-x-bold` (aplat saturé : `LandscapeArt`, graphiques, formes — jamais de texte dessus,
ne jamais combiner `-ink` et `-bold`). Les cinq premières sont les couples fond / point du
brief, qui tournent dans cet ordre pour les pastilles et les étapes.

| Teinte     | `tint-x`     | `tint-x-ink` | `tint-x-bold` | Couple du brief |
| ---------- | ------------ | ------------ | ------------- | --------------- |
| `sun`      | = `sun-soft` | #8a5a00      | = `sun`       | Jaune (1)       |
| `lake`     | #b9f0d6      | #0b6b4a      | #2fbf8a       | Menthe (2)      |
| `blossom`  | #ffc9d9      | #a0184c      | #ff7ea6       | Rose (3)        |
| `sky`      | #cde8ff      | #174a8a      | #5aaeff       | Ciel (4)        |
| `meadow`   | #d9f7a6      | #3c6e0a      | #8fd14f       | Vert (5)        |
| `apricot`  | #ffd9cc      | #7a2e12      | = `coral`     | Pêche           |
| `lavender` | #e9ddff      | #5b3a99      | #b48cff       | Lavande         |

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

- **Nunito** (`font-sans` et `font-display`) partout, chargée en 500–900 depuis Google Fonts
  dans `resources/views/inertia_layout.edge` (`display=swap`).
- Titres `display-*` en 900, titres de carte `title-*` et sur-titres en 800, texte en 500
  (le `body`), emphase en 700–800. Le brief demande 700–800 pour le texte : 500 garde la
  hiérarchie lisible dans le dashboard (formulaires, tableaux) ; à revoir avec la recette.
- Le monogramme du logo est tracé en SVG, il ne dépend pas du glyphe `ȷ` (U+0237).

| Classe            | Taille | Interligne | Approche | Graisse | Usage                                      |
| ----------------- | ------ | ---------- | -------- | ------- | ------------------------------------------ |
| `text-display-xl` | 64 px  | 1,05       | −0,025em | 900     | h1 de la page d'accueil (≥ md)             |
| `text-display-lg` | 48 px  | 1,1        | −0,02em  | 900     | h1 des pages marketing                     |
| `text-display-md` | 36 px  | 1,15       | −0,015em | 900     | h2 de section, h1 des documents légaux     |
| `text-display-sm` | 28 px  | 1,2        | −0,01em  | 900     | h1 des écrans auth, prix                   |
| `text-title-lg`   | 22 px  | 1,3        | −0,01em  | 800     | Titres de carte importants, h2 de document |
| `text-title-md`   | 18 px  | 1,4        | 0        | 800     | Titres de carte                            |
| `text-title-sm`   | 16 px  | 1,4        | 0        | 800     | Petits titres, libellés forts              |
| `text-body-lg`    | 18 px  | 1,5        | 0        | 400     | Chapeaux, descriptions de section          |
| `text-base`       | 16 px  | 1,5        | 0        | 500     | Texte courant                              |
| `text-sm`         | 14 px  | 1,5        | 0        | 400     | Texte de carte, formulaires, footer        |
| `text-caption`    | 13 px  | 1,4        | 0        | 500     | Badges, méta                               |
| `text-eyebrow`    | 14 px  | 1,3        | 0        | 800     | Sur-titres (`Eyebrow`), casse de phrase    |

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

| Composant                                                                                                                                                               | Fichier                           | Règles                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                                                                                                                                                                | `ui/Button.tsx`                   | `primary` (encre), `secondary` (blanc bordé de jaune, texte encre — aussi le bouton sur ink), `outline`, `ghost`, `danger` ; `cta` et `emphasis` dépréciés → `secondary`. Tailles 36/40/48 px, pilule `rounded-full`, 700. `buttonClassName()` pour un lien-bouton (`AppLink`). Jamais un `<Button>` dans un `<a>`, jamais `primary` dans une `Card dark`.                                                                                                                                                                                                |
| `Card`                                                                                                                                                                  | `ui/Card.tsx`                     | `default` (surface + hairline + `shadow-card`), `flat`, `dark` (ink), `sun`, `accent`, `primary` ; `warm`/`amber` → `sun`, `sage` → `accent` dépréciés. `padding` none/sm/md/lg, `interactive` pour l'élévation au survol.                                                                                                                                                                                                                                                                                                                                |
| `Badge`                                                                                                                                                                 | `ui/Badge.tsx`                    | Tons sémantiques et teintes expressives (`sun`, `apricot`, `meadow`, `lake`, `lavender`, `blossom`, `sky`), 24 px, pilule, `text-caption`, option `dot`. Anciens noms Tailwind et anciennes teintes mappés (`pink` → `blossom`, `terracotta` → `apricot`…).                                                                                                                                                                                                                                                                                               |
| `Input`, `Textarea`                                                                                                                                                     | `ui/Input.tsx`, `ui/Textarea.tsx` | Label 14 px/500 `ink`, champ 36/40/44 px `hairline-strong`, focus `accent`, erreur `danger` sans fond rosé, messages 14 px. Classes partagées dans `ui/input/input_classes.ts`.                                                                                                                                                                                                                                                                                                                                                                           |
| `Logo`                                                                                                                                                                  | `ui/Logo.tsx`                     | Marque SVG inline (`logo/LogoMark` galet sur plongeoir dès `md`, `logo/LogoBadge` pastille en `sm` ≤ 32 px, tracés dans `logo/logo_geometry.ts`) + wordmark jump**U**job (U `coral`) ; nom accessible `APP_NAME` ; `tone="inverse"` sur ink. Fichiers : `public/logo.svg`, `logo-dark.svg`, `favicon.svg`.                                                                                                                                                                                                                                                |
| `Container`, `Eyebrow`, `SectionHeading`                                                                                                                                | `ui/`                             | Largeurs, sur-titre (`accent`, `muted`, `inverse` = `accent-on-ink` ; `primary` déprécié), en-tête de section (eyebrow + titre + description).                                                                                                                                                                                                                                                                                                                                                                                                            |
| `LandscapeArt`                                                                                                                                                          | `marketing/LandscapeArt.tsx`      | Le bloc paysage : SVG inline, `aria-hidden`, couleurs en `var(--color-tint-*)`. `hero` (fond du héros de l'accueil particuliers via `HeroBackdrop scene="landscape"`, panorama du héros « Qui sommes-nous »), `dusk` (bas de `CtaBand`), `horizon` (derrière la carte `AuthShell`, ≥ sm).                                                                                                                                                                                                                                                                 |
| `Companion`                                                                                                                                                             | `ui/Companion.tsx`                | Le compagnon du candidat : petit droïde sphérique (boule à panneaux circulaires, dôme à lentilles et antennes, sans bras : l'expression tient à l'inclinaison du dôme), SVG inline `aria-hidden`, cinq postures (`wave` accueil, `cheer` succès, `think` attente / lien invalide, `guard` forfait, `rest` état vide), tailles 48/96/160/240 px, `tone="inverse"` sur ink (traits `on-ink`), `animated` (classes `companion-*`, coupées par `prefers-reduced-motion`). Jamais seul porteur de sens, jamais sur un `tint-bold`, jamais plus d'un par écran. |
| `PublicLayout`, `PublicHeader`, `PublicFooter`, `MobileMenu`                                                                                                            | `layout/`                         | Coquille publique ; nav et actions dans `inertia/config/marketing.ts`. `header={{ minimal: true }} footer={false}` pour l'auth.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `MarketingSection`, `FeatureCard`, `BulletList`, `CtaBand`, `PageHero`, `ExerciseCatalogue`, `PricingTierCard`, `MarketingDemoSection`, `LegalDocument`, `LegalSection` | `marketing/`                      | Blocs de page marketing. Un hero = `SectionHeading level={1}` + actions ; une page légale = `LegalDocument` sans CTA.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `AuthShell`                                                                                                                                                             | `auth/AuthShell.tsx`              | Carte centrée 448 px sur un horizon `LandscapeArt`, en-tête minimal, compagnon `wave` au-dessus de la carte (`companion="think"` pour un lien invalide, `false` pour le masquer), tuile d'icône soleil, `accent="warm"` = filet apricot pour les liens invalides.                                                                                                                                                                                                                                                                                         |
| `ErrorPage`                                                                                                                                                             | `errors/ErrorPage.tsx`            | 404/500 en français, sans `PublicLayout` ni props Inertia.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

États : focus visible par anneau `accent` (couche base), sélection de texte `sun-soft`, désactivé à 50 %, chargement par
spinner dans le bouton. Mouvement : `animate-fade-in`, `animate-slide-up`,
`animate-shake` (erreurs de formulaire), `landscape-*` et `companion-*` (illustrations),
respect de `prefers-reduced-motion`. Pages marketing : `RevealGroup` / `RevealItem`, `CountUp`, `Parallax`, `TiltCard`
(`ui/motion/`, §5 bis) ; mockups vivants ; maillage du héros (`animate-mesh-drift`).

---

## 5 bis. Couche marketing

Les pages publiques ont droit à quelques effets de plus, inspirés de stripe.com : un héros
plus spectaculaire, des interfaces produit vivantes, un méga-menu. Ils sont **réservés** à
`inertia/components/{marketing,landing,layout}` (garde `tests/unit/hygiene/design_tokens.spec.ts`)
et ne changent rien au reste du contrat (blanc chaud, encre, soleil, accent, teintes, casse de phrase).

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

**Accueil et pages particuliers** (`marketing/home/`, brief jumpUjob, planches 47 et 50) : `HomeHero` (accroche « Le saut, oui. Le vide, non. » sur `HeroBackdrop scene="landscape"`, unique mockup `JourneyMockup` incliné, `Companion` qui salue), `HomeSteps` (trois cartes jaune pâle, numéros pastel), `ExercisePills` (noms des exercices en pastilles, détail sur `/parcours`), `PlanBand` (seul bloc prix, bandeau `tint-lake-ink`), `TrustColumns` (tuiles d'icône pastel), `FinalCall` (« Sautez. On tient la rampe. »), `StartAction` (inscription ou liste d'attente). Les pastilles tournent sur `BRAND_PASTEL_CYCLE` (`marketing/tints.ts` : jaune, menthe, rose, ciel, vert). Portraits de `/qui-sommes-nous` : `about/GaletPortrait` (photo découpée dans le galet du logo, couleur de secours et pastille d'initiale), équipe dans `about/team.ts`.

**Blocs** (`marketing/`) : `HeroBackdrop` (scène + voile `canvas` côté texte : maillage + grille, `strong`/`soft`, ou `scene="landscape"` = le panorama `LandscapeArt` en pleine largeur, héros de l'accueil),
`KeyFactsStrip` (chiffres clés), `FeatureTabs` (fonctionnalités en onglets avec mockup),
`FaqAccordion` (`<details>` natif), `individuals/PlanComparison`
(gratuit / forfait). L'offre mise en avant d'une grille tarifaire est cerclée du maillage. Mockups vivants dans `marketing/mockups/` (`MockupFrame`,
`JourneyMockup`, `AiAnalysisMockup`, `SynthesisMockup`,
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

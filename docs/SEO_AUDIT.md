# Audit SEO — 2026-10-04

Audit technique, contenu et conformité en vue de la commercialisation B2B (cabinets de transition,
RH, outplacement). État du dépôt au 2026-10-04 ; aucun changement de code associé.

**Verdict.** Le site est rendu côté serveur (SSR), ce qui est la bonne base, mais il est volontairement
`noindex` partout et il manque l'essentiel de l'équipement SEO (meta par page, sitemap, canonical,
Open Graph, JSON-LD). Côté vente B2B, les mentions légales vides et l'absence totale de preuves de
confiance sont plus bloquantes que le technique.

## 1. Technique

| Sujet                        | État                                                                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Indexation                   | `SEO_INDEXING=false` par défaut (`config/seo.ts`, `render.yaml`) : meta `noindex, nofollow` et `robots.txt` `Disallow: /`. Décision PO ouverte (`PRODUCTION_CHECKLIST.md`).  |
| `robots.txt` une fois activé | `Allow: /` sans exclusion de `/dashboard`, `/auth`, `/onboarding`, sans ligne `Sitemap:` (`app/utils/seo.ts`).                                                               |
| `sitemap.xml`                | Absent.                                                                                                                                                                      |
| Canonical                    | Absent ; `/tarifs/` et `/tarifs` répondent tous deux 200.                                                                                                                    |
| Meta description             | Une seule, statique, orientée particuliers, sur toutes les pages (`resources/views/inertia_layout.edge`) ; aucune `<Head>` ne la surcharge, y compris sur les pages cabinet. |
| Titles                       | Présents mais génériques (« Offre », « Tarifs », « Méthodologie »), suffixe ajouté par `inertia/app.tsx`.                                                                    |
| Open Graph, Twitter, visuel  | Absents.                                                                                                                                                                     |
| JSON-LD                      | Absent. Candidats : Organization, WebSite, Offer (`/tarifs`, `/cabinets/tarifs`), FAQPage (ces deux pages ont déjà une FAQ).                                                 |
| `noindex` des pages d'auth   | Absent : `/auth/*`, `/inscription`, `/onboarding/:token` deviendraient indexables avec le flag.                                                                              |
| SSR                          | Actif (`config/inertia.ts`, `inertia/ssr.tsx`) : point fort.                                                                                                                 |
| Cache des assets             | `config/static.ts` sans `maxAge`/`immutable` ; aucune règle de cache dans `deploy/Caddyfile`.                                                                                |
| Compression                  | Assurée par Caddy uniquement (`encode zstd gzip`), pas par l'app (donc dépend de l'hébergeur sur Render).                                                                    |
| Redirections                 | Pas de www → apex dans le dépôt ; un seul 301 (`/particuliers`).                                                                                                             |
| Polices                      | Google Fonts bloquantes, 7 graisses (`inertia_layout.edge`) : coût LCP/CLS et transfert de l'IP des visiteurs à Google (point RGPD, contredit « aucun tiers »).              |
| Manifest                     | `theme-color` incohérent (`#f7f5ee` dans le layout, `#1b2140` dans le manifest), pas de `start_url`, pas d'icône maskable.                                                   |
| Images                       | Aucune image de contenu ; `inertia/assets/images/logo.png` (839 Ko) inutilisé ; avatar DiceBear bloqué par la CSP (`imgSrc`).                                                |
| Mesure                       | Aucun analytics ; Search Console par balise (`GOOGLE_SITE_VERIFICATION`) ; pas de Lighthouse CI ; la CSP interdit tout script tiers.                                         |

## 2. Contenu et on-page

- Un seul `<h1>` par page marketing, hiérarchie Hn cohérente, `lang="fr"`, landmarks corrects.
  Les `<h2>` du pied de page (`PublicFooter.tsx`) ajoutent du bruit sémantique.
- Positionnement : l'accueil `/` s'adresse aux particuliers ; l'offre B2B n'est que sur `/cabinets`,
  `/cabinets/tarifs`, `/offre`, `/methodologie`.
- Mots-clés « outplacement » et « reconversion » uniquement dans `meta keywords` (ignoré par Google) ;
  « RH », « CPF », « changement de carrière » absents du contenu.
- Quasi-duplication entre `/cabinets`, `/offre` et `/methodologie` (bloc « IA copilote », H1 voisins).
- Aucun lien externe ni source ; le « cadre scientifique » n'est étayé par aucune référence.
- « Huit exercices » écrit en dur (`HeroSection.tsx`) alors que le compteur existe ailleurs.
- Pages absentes : FAQ, cas clients, à propos, pages par persona B2B, blog, une URL par exercice,
  pages d'intention B2C. `/contact` figure au README mais n'existe pas.
- Contenu mince tant que `b2cRegistrationEnabled` est faux (« ouvre prochainement »).

## 3. Légal et confiance (bloquant pour la vente B2B)

- Mentions légales : tous les champs sont `[à compléter]` (`LegalNoticePage.tsx`).
- CGV : SIREN, adresse, médiateur de la consommation en placeholder (`shared/constants/legal.ts`) ;
  CGU « à valider par un conseil juridique ».
- Le terme « bilan de compétences » est encadré (CPF, Qualiopi, L6313-4) : usage à faire valider.
- E-E-A-T quasi nul : aucun témoignage, logo client, auteur, expert ou éditeur identifié ;
  tarifs cabinets sans preuve commerciale ; la FAQ évoque une « période d'essai » non définie.
- Cookies : pas de bandeau, acceptable tant qu'aucun traceur n'est posé (`RGPD.md`). À rouvrir dès
  l'ajout d'un outil de mesure (`legal.ts`, `RGPD.md`).

## 4. Plan de correctifs priorisé

Une issue = une branche = une PR par lot (cf. `process/pr-checklist.md`).

**P0 — avant d'ouvrir l'indexation** (points 1 à 4 livrés, voir `changelog/2026-10-04-1200-seo-p0-indexation.md`)

1. Meta par page : description, canonical, Open Graph et Twitter par `<Head>` (composant dédié),
   descriptions B2B distinctes pour les pages cabinet.
2. `GET /sitemap.xml` ; `Sitemap:` et `Disallow` `/dashboard`, `/auth`, `/onboarding` dans `robots.txt`.
3. `X-Robots-Tag: noindex` sur auth, onboarding, inscription, dashboard et erreurs, quel que soit le flag.
4. Canonical absolu dérivé de `APP_URL` ; redirection 301 des variantes avec slash final.
5. Compléter mentions légales et `SELLER_IDENTITY` (données à fournir) ; valider CGU/CGV.
6. Auto-héberger les polices et adapter la CSP.

**P1 — SEO B2B**

7. JSON-LD (Organization, WebSite, Offer, FAQPage).
8. Cache long des assets, règles Caddy, redirection www → apex.
9. Image Open Graph 1200×630, logo SVG, manifest corrigé.
10. Titres et H1 retravaillés avec les mots-clés cibles ; dédoublonnage des trois pages cabinet.
11. Pages `/faq`, `/a-propos`, `/cas-clients` et pages par persona B2B.

**P2 — croissance et mesure**

12. Analytics sans cookie, Search Console, Lighthouse CI.
13. Blog, pages par exercice, témoignages, références scientifiques, présentation des experts.
14. Passer `SEO_INDEXING=true` sur le domaine final une fois le P0 livré.

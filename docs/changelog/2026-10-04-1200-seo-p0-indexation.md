# 2026-10-04 — SEO P0 : meta par page, sitemap, noindex ciblé, canonical

Premier lot du plan de `docs/SEO_AUDIT.md`, avant d'ouvrir l'indexation. `SEO_INDEXING` reste à
`false` par défaut : rien ne change pour les moteurs tant que le flag n'est pas activé.

- **Meta par page.** Composant `PageSeo` (`inertia/components/seo/PageSeo.tsx`) : titre, description
  propre à la page, Open Graph (`og:title`, `og:description`, `og:type`, `og:locale`,
  `og:site_name`) et Twitter card, avec `head-key` (rendu unique en SSR). Appliqué aux 11 pages
  publiques. La description globale (orientée particuliers) et `meta keywords` sont retirés du
  layout : les pages cabinet n'héritent plus d'un texte B2C.
- **Canonical.** `<link rel="canonical">` et `og:url` dans le layout, absolus depuis `APP_URL`
  (jamais la requête), sans slash final ni query string (global Edge `seo.canonical`).
- **Slash final.** `TrailingSlashMiddleware` : `GET`/`HEAD` `/tarifs/` → 301 `/tarifs`.
- **Sitemap.** `GET /sitemap.xml` (`SitemapController`, pages de `SITEMAP_PATHS`).
- **robots.txt.** Indexation ouverte : `Disallow` de `/auth`, `/dashboard`, `/onboarding`,
  `/inscription` et ligne `Sitemap:`. Fermée : inchangé (`Disallow: /`).
- **X-Robots-Tag.** `noindex, nofollow` sur ces espaces et sur toute réponse ≥ 400, quel que soit
  `SEO_INDEXING` (`SecurityHeadersMiddleware`).
- **Hors lot.** Mentions légales / `SELLER_IDENTITY` (données à fournir), polices auto-hébergées,
  JSON-LD et suite du plan restent à faire.
- **Tests.** Unit (`utils/seo`, contrôleurs robots et sitemap, middlewares), functional
  (`public/seo.spec.ts`), Vitest (`PageSeo`).

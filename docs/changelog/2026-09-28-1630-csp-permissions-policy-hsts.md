# 2026-09-28 — En-têtes de sécurité : CSP à nonce, Permissions-Policy, HSTS (#67)

La Content-Security-Policy était désactivée (`config/shield.ts`), aucune
`Permissions-Policy` n'était envoyée et HSTS ne couvrait pas les sous-domaines.

- **CSP** activée (bloquante, pas `reportOnly`) :
  - scripts de la même origine + nonce par requête, sans `'unsafe-inline'` ni
    `'unsafe-eval'` ; le layout Edge passe `cspNonce` à `@vite` et
    `@viteReactRefresh` ;
  - styles inline tolérés (attributs `style` de React, barre de progression
    Inertia), Google Fonts ;
  - images : même origine, `data:`, `blob:` (aperçu du logo), Cloudinary,
    DiceBear (avatars de la landing) ;
  - `frame-ancestors 'none'`, `object-src 'none'`, `base-uri` / `form-action`
    `'self'` ;
  - en dev seulement : origine Vite (`@viteUrl`) et websocket HMR.
- **Permissions-Policy** (`SecurityHeadersMiddleware`) : caméra, micro,
  géolocalisation, paiement, USB, capteurs et Topics désactivés.
- **HSTS** : 365 jours, `includeSubDomains` (pas de `preload` : décision de
  domaine).
- **Vérification.** Build de production parcouru dans Chromium (landing, offre,
  connexion, dashboard conseiller, fiche et synthèse candidat, réglages, exports,
  espace candidat, navigation Inertia) : aucune violation CSP ; un script inline
  injecté sans nonce est bien refusé.
- **Tests.** Functional `tests/functional/security/security_headers.spec.ts` (page
  publique et dashboard : directives, nonce présent sur chaque `<script>`, nonce
  renouvelé, HSTS, Permissions-Policy) ; unit du middleware.
- **Ajouter une origine externe** (image, police, API appelée depuis le navigateur) :
  l'ajouter à la directive correspondante de `config/shield.ts`.

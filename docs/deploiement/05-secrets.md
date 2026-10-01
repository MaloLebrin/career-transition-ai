# 5. Secrets : `APP_KEY` et mot de passe admin

## `APP_KEY`

Clé de chiffrement de l'application (sessions cookie, données chiffrées). Obligatoire.

Générer une valeur en local (dépôt cloné, `pnpm install` fait) :

```bash
node ace generate:key --show
```

Alternative sans le dépôt : `openssl rand -base64 32` (32 caractères ou plus).

- À saisir dans Render (`APP_KEY`, secret).
- **La conserver** (gestionnaire de mots de passe). La changer invalide toutes les sessions
  et les données chiffrées existantes.
- Ne jamais la committer ni la coller dans une issue ou un chat.

## `ADMIN_PASSWORD` et `ADMIN_EMAIL`

Utilisés **uniquement** par le seeder du super admin (étape 7), lancé depuis votre poste.
Ils n'ont pas à être saisis dans Render.

- `ADMIN_PASSWORD` : mot de passe fort et unique (≥ 16 caractères conseillés). Obligatoire,
  le seeder échoue s'il est vide.
- `ADMIN_EMAIL` : e-mail du super admin. Optionnel ; par défaut `malolebrin@gmail.com`
  (constante `PLATFORM_ADMIN_EMAIL` de `database/seeders/admin_seeder.ts`).

Après la première connexion, changer le mot de passe depuis l'app (`PUT /dashboard/password`)
si vous le souhaitez : ne **pas** relancer le seeder ensuite sans y penser, il réécrit le
mot de passe avec `ADMIN_PASSWORD`.

## Hygiène

- Aucun secret ni `.env` rempli dans Git (garde du dépôt).
- Une clé par service ; révoquer et recréer en cas de fuite.

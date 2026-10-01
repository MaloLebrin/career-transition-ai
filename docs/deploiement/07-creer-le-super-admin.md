# 7. Créer le super admin

Le déploiement crée les tables (migrations) mais **aucun compte**. Le seeder
`database/seeders/admin_seeder.ts` crée, de façon idempotente, l'organisation plateforme
(`ai-transition-carriere`) et un compte `SUPER_ADMIN`. Render Free n'ayant pas de shell, on
l'exécute **depuis votre poste**, contre la base Neon.

## Prérequis

- Dépôt cloné, Node 24 et pnpm 10 (`.node-version`, `packageManager`), puis :

  ```bash
  pnpm install
  ```

- La chaîne `DB_URL` de Neon (étape 1) et les secrets de l'étape 5.
- Les migrations déjà jouées : le premier démarrage de Render (étape 6) les a exécutées.

## Commande

Le schéma d'env exige quelques variables de base : on les fournit en ligne, sans créer de
fichier `.env` qui pointerait sur la mauvaise base.

```bash
NODE_ENV=development PORT=3333 HOST=localhost \
APP_KEY='<chaîne aléatoire de 32+ caractères>' APP_URL=http://localhost:3333 \
LOG_LEVEL=info SESSION_DRIVER=memory QUEUE_DRIVER=sync \
DB_URL='<chaîne Neon>' DB_SSL=true \
ADMIN_PASSWORD='<mot de passe fort>' ADMIN_EMAIL='<votre e-mail>' \
node ace db:seed --files database/seeders/admin_seeder
```

- L'`APP_KEY` utilisée ici n'a pas besoin d'être celle de Render : le seeder ne chiffre rien,
  il hache seulement le mot de passe.
- Si un fichier `.env` local existe, les variables passées en ligne ont priorité ; vérifier
  qu'il ne définit pas `DB_HOST` & co. qui pourraient entrer en conflit avec `DB_URL`.
- Sans `ADMIN_EMAIL`, le compte est créé avec `malolebrin@gmail.com`.

## Vérifier

Connexion sur `https://<votre-url>/` avec l'e-mail et le mot de passe. Ou, en SQL :

```sql
select email, role from users where role = 'super_admin';
```

## Remarques

- Idempotent : relancer ne duplique ni l'organisation ni le compte, mais **réécrit le mot de
  passe** avec `ADMIN_PASSWORD`.
- Pour changer l'e-mail plus tard, créer un autre compte via l'app plutôt que de relancer le
  seeder avec un autre `ADMIN_EMAIL` (cela créerait un second super admin).
- Ne jamais committer le mot de passe ; effacer l'historique shell si nécessaire.

## Dépannage

| Message                         | Cause                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------- |
| `ADMIN_PASSWORD est requis…`    | variable vide ou absente                                                         |
| `Invalid environment variables` | une variable de base manque (voir la commande)                                   |
| erreur SSL / `ECONNREFUSED`     | `DB_URL` incorrecte ou `DB_SSL` absent ; voir [10-depannage.md](10-depannage.md) |

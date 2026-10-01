# Déploiement de test gratuit (Render + Neon)

Pour un A/B test avec 2-3 testeurs, sans serveur à administrer. Pour la
production durable (worker, pas de veille), voir `docs/DEPLOYMENT.md`.

## Architecture et limites

- **Web** : Render Free, image construite depuis le `Dockerfile` (`render.yaml`).
  Veille après 15 min d'inactivité, réveil ~1 min. Ouvrir l'URL avant une session.
- **Base** : Neon Free (0,5 Go, mise en veille après 5 min). Ne pas utiliser le
  Postgres gratuit de Render : il expire au bout de 30 jours.
- **Queue** : `QUEUE_DRIVER=sync`, aucun worker. Les jobs IA et PDF s'exécutent dans
  le process web ; la purge nocturne des exports PDF ne tourne pas.
- **Migrations** : le mode `migrate-and-serve` de `docker/entrypoint.sh` les joue à
  chaque démarrage (idempotent). Le seed du super admin se lance une fois, à la main.

## Mise en place

1. **Neon** : créer un projet, copier la chaîne de connexion (`sslmode=require`) → `DB_URL`.
2. **Cloudinary** : `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   (obligatoires en production).
3. **Resend** : ajouter votre domaine, poser les enregistrements DNS (SPF/DKIM), créer la clé
   → `RESEND_API_KEY`, `MAIL_FROM_EMAIL=no-reply@<domaine>`. Repli : `MAIL_PROVIDER=console`
   (les liens d'onboarding apparaissent dans les logs Render).
4. **Mistral** (optionnel) : `MISTRAL_API_KEY`. Sinon `AI_PROVIDER=none`.
5. `node ace generate:key --show` → `APP_KEY`.
6. **Render** : New → Blueprint, choisir ce dépôt (`render.yaml`), saisir les variables
   `sync: false`. `APP_URL` = `https://<service>.onrender.com` (sans `/` final).
7. Après le premier déploiement, depuis votre poste, créer le super admin dans la base Neon :

   ```bash
   DB_URL='<chaîne Neon>' DB_SSL=true ADMIN_PASSWORD='<mot de passe>' \
   ADMIN_EMAIL='<votre e-mail>' node ace db:seed --files database/seeders/admin_seeder
   ```

8. Se connecter, puis créer les comptes testeurs depuis l'espace super admin
   (`REGISTRATION_ENABLED=false`).

## Vérifications

`/health` répond 200, connexion super admin, dépôt d'un fichier (Cloudinary), export PDF
(jobs inline : vérifier le délai), analyse IA, e-mail d'onboarding reçu.

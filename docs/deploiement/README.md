# Déploiement de test gratuit — Render + Neon

Mettre l'application en ligne **gratuitement** pour un A/B test avec 2-3 testeurs, sans
serveur à administrer. Pour une production durable (worker, pas de veille), voir
[`../DEPLOYMENT.md`](../DEPLOYMENT.md).

## Architecture

```
Testeurs ──HTTPS──▶ Render Free (web, image Docker)
                      │  QUEUE_DRIVER=sync : jobs IA/PDF exécutés dans ce process
                      ├──▶ Neon Free        Postgres (données + table des jobs)
                      ├──▶ Cloudinary Free  fichiers (PDF, documents, logo)
                      ├──▶ Resend Free      e-mails (domaine vérifié)
                      └──▶ Mistral          IA (optionnel)
```

## Limites à connaître

| Sujet                                                  | Conséquence                                                    |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| Render Free se met en veille après 15 min d'inactivité | Réveil ~1 min : ouvrir l'URL avant une session                 |
| Neon Free se met en veille après 5 min                 | Premier accès lent après inactivité                            |
| Pas de worker (`QUEUE_DRIVER=sync`)                    | Jobs IA/PDF exécutés dans le process web (512 Mo, CPU partagé) |
| Pas de worker                                          | La purge nocturne des exports PDF ne tourne pas                |
| Pas de disque persistant                               | Aucun souci : tous les fichiers sont sur Cloudinary            |

Les quotas gratuits évoluent : vérifier les pages officielles de chaque service avant de
s'engager.

## Parcours (dans l'ordre)

| #   | Étape                                   | Fichier                                                          | Fait |
| --- | --------------------------------------- | ---------------------------------------------------------------- | ---- |
| 0   | Choisir la branche à déployer           | [00-choix-de-la-branche.md](00-choix-de-la-branche.md)           | ☐    |
| 1   | Base de données Neon                    | [01-neon-base-de-donnees.md](01-neon-base-de-donnees.md)         | ☐    |
| 2   | Stockage Cloudinary                     | [02-cloudinary-fichiers.md](02-cloudinary-fichiers.md)           | ☐    |
| 3   | E-mails Resend                          | [03-resend-emails.md](03-resend-emails.md)                       | ☐    |
| 4   | IA Mistral (optionnel)                  | [04-mistral-ia.md](04-mistral-ia.md)                             | ☐    |
| 5   | Secrets : `APP_KEY`, mot de passe admin | [05-secrets.md](05-secrets.md)                                   | ☐    |
| 6   | Déploiement sur Render                  | [06-render-deploiement.md](06-render-deploiement.md)             | ☐    |
| 7   | Créer le super admin                    | [07-creer-le-super-admin.md](07-creer-le-super-admin.md)         | ☐    |
| 8   | Recette                                 | [08-recette.md](08-recette.md)                                   | ☐    |
| 9   | Utilisation au quotidien                | [09-utilisation-au-quotidien.md](09-utilisation-au-quotidien.md) | ☐    |
| —   | Dépannage                               | [10-depannage.md](10-depannage.md)                               |      |

## Variables d'environnement

Celles de `render.yaml` marquées `sync: false` sont à saisir dans Render. Schéma complet :
`start/env_schema.ts`.

| Variable                         | Valeur                                | Secret | Voir                             |
| -------------------------------- | ------------------------------------- | ------ | -------------------------------- |
| `DB_URL`                         | chaîne de connexion Neon              | oui    | [01](01-neon-base-de-donnees.md) |
| `CLOUDINARY_CLOUD_NAME`          | nom du cloud                          | non    | [02](02-cloudinary-fichiers.md)  |
| `CLOUDINARY_API_KEY`             | clé API                               | non    | [02](02-cloudinary-fichiers.md)  |
| `CLOUDINARY_API_SECRET`          | secret API                            | oui    | [02](02-cloudinary-fichiers.md)  |
| `RESEND_API_KEY`                 | clé API Resend                        | oui    | [03](03-resend-emails.md)        |
| `MAIL_FROM_EMAIL`                | `no-reply@transitioncarriere.fr`            | non    | [03](03-resend-emails.md)        |
| `MISTRAL_API_KEY`                | clé API Mistral                       | oui    | [04](04-mistral-ia.md)           |
| `APP_KEY`                        | 32+ caractères aléatoires             | oui    | [05](05-secrets.md)              |
| `APP_URL`                        | `https://<service>.onrender.com`      | non    | [06](06-render-deploiement.md)   |
| `ADMIN_PASSWORD` / `ADMIN_EMAIL` | pour le seed (poste local uniquement) | oui    | [07](07-creer-le-super-admin.md) |

Les variables non secrètes (`NODE_ENV`, `PORT`, `QUEUE_DRIVER=sync`, `DB_SSL`…) sont déjà
fixées dans `render.yaml`.

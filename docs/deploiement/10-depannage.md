# 10. Dépannage

## Le service ne démarre pas

| Symptôme dans les logs                    | Cause probable                                                 | Correctif                                                                    |
| ----------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `Cloudinary … manquant` / refus au boot   | une des 3 variables `CLOUDINARY_*` absente                     | étape [02](02-cloudinary-fichiers.md)                                        |
| `Invalid environment variables`           | variable obligatoire absente (`APP_KEY`, `APP_URL`, `DB_URL`…) | compléter dans **Environment**                                               |
| erreur de connexion SSL / `self signed`   | `DB_SSL` ou `sslmode` incohérent                               | `DB_SSL=true` et `?sslmode=require` dans `DB_URL`                            |
| `password authentication failed`          | mauvaise chaîne Neon                                           | recopier la chaîne (étape [01](01-neon-base-de-donnees.md))                  |
| `relation … does not exist`               | migrations non jouées                                          | vérifier que la commande de démarrage est `/entrypoint.sh migrate-and-serve` |
| port non détecté / timeout de déploiement | `PORT`/`HOST` incorrects                                       | `HOST=0.0.0.0`, `PORT=10000` (déjà dans `render.yaml`)                       |

## Le site est lent ou répond 502/503

- Premier accès après inactivité : réveil de Render (~1 min) puis de Neon. Recharger.
- Mémoire insuffisante lors d'un export PDF / analyse IA : voir **Logs** (`out of memory`).
  `NODE_OPTIONS=--max-old-space-size=384` est déjà posé ; réduire la taille des documents ou
  passer à une instance payante.

## Les e-mails n'arrivent pas

- Domaine Resend non vérifié (DNS non propagés) : vérifier le statut dans Resend.
- `MAIL_FROM_EMAIL` hors du domaine vérifié.
- `RESEND_API_KEY` invalide ou sans permission d'envoi.
- Contrôler les envois côté Resend (journal) et les logs Render.
- Repli : `MAIL_PROVIDER=console`, puis récupérer le lien dans les logs.

## Les liens d'e-mail pointent au mauvais endroit

`APP_URL` ne correspond pas à l'URL publique (étape [06](06-render-deploiement.md)).

## Impossible de se connecter en super admin

- Seeder non lancé ou lancé sur une autre base (étape [07](07-creer-le-super-admin.md)).
- Vérifier : `select email, role from users;`.
- Relancer le seeder pour réécrire le mot de passe.

## Un fichier ne se télécharge pas

Clés Cloudinary incorrectes ou fichier privé non relayé : voir
[`../CLOUDINARY.md`](../CLOUDINARY.md) et les logs.

## Neon : « compute suspended » / quota

Quota mensuel atteint : attendre le mois suivant ou passer à un plan payant. Réduire les
accès inutiles (pas de worker, pas de polling externe).

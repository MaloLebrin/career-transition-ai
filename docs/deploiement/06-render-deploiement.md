# 6. Render — déploiement

Prérequis : étapes 0 à 5 faites (branche choisie, `DB_URL`, clés Cloudinary / Resend /
Mistral, `APP_KEY`).

## Création du service (Blueprint)

1. Créer un compte sur <https://render.com> et connecter GitHub (autoriser le dépôt
   `MaloLebrin/career-transition-ai`). Aucune carte bancaire n'est requise pour le plan
   gratuit.
2. **New → Blueprint**, choisir le dépôt et la branche (étape 0).
3. Render lit `render.yaml` et propose le service `career-transition-ai` (plan **Free**,
   région Francfort, `runtime: docker`, démarrage `/entrypoint.sh migrate-and-serve`).
4. Renseigner les variables demandées (`sync: false`) :

   | Variable                                                               | Valeur                                                                           |
   | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
   | `APP_KEY`                                                              | étape 5                                                                          |
   | `APP_URL`                                                              | provisoire : `https://career-transition-ai.onrender.com` (à corriger ci-dessous) |
   | `DB_URL`                                                               | étape 1                                                                          |
   | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | étape 2                                                                          |
   | `RESEND_API_KEY`, `MAIL_FROM_EMAIL`                                    | étape 3                                                                          |
   | `MISTRAL_API_KEY`                                                      | étape 4 (ou laisser vide avec `AI_PROVIDER=none`)                                |

5. **Apply**. Render construit l'image (plusieurs minutes), puis démarre le service.

## Corriger `APP_URL`

L'URL réelle est affichée en haut de la page du service (`https://<nom>.onrender.com`, avec
un suffixe si le nom est pris). `APP_URL` doit la reprendre **exactement**, en https et sans
`/` final : elle sert de base aux liens des e-mails. Modifier dans **Environment**, puis
**Manual Deploy → Deploy latest commit** (ou la sauvegarde redéploie automatiquement).

## Ce qui se passe au démarrage

`migrate-and-serve` exécute `node ace.js migration:run --force` (idempotent), puis démarre le
serveur. Un redémarrage ne rejoue que les migrations en attente.

## Vérifier

- Onglet **Logs** : migrations exécutées, puis serveur à l'écoute sur le port `10000`.
- `https://<votre-url>/health` répond 200 (contrôle la base).
- Si le déploiement échoue : [10-depannage.md](10-depannage.md).

## Domaine personnalisé (optionnel)

**Settings → Custom Domains** : ajouter `transitioncarriere.fr`, créer l'enregistrement CNAME
indiqué chez votre registrar, attendre le certificat TLS automatique, puis mettre
`APP_URL=https://transitioncarriere.fr` et redéployer. Non nécessaire pour un test.

## Redéploiements

Par défaut, chaque push sur la branche suivie redéploie. Désactivable dans **Settings →
Auto-Deploy** si vous voulez maîtriser les mises en ligne pendant les tests.

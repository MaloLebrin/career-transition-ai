# 3. Resend — e-mails

L'app envoie des e-mails d'onboarding, de réinitialisation de mot de passe et de
notification. Envoyer à des **tiers** (vos testeurs) exige un **domaine vérifié** chez
Resend. Détails : [`../MAIL.md`](../MAIL.md).

## Création et vérification du domaine

1. Créer un compte sur <https://resend.com>.
2. **Domains → Add Domain** : saisir votre domaine (ou un sous-domaine d'envoi, par exemple
   `mail.transitioncarriere.fr`, recommandé pour ne pas mélanger avec votre messagerie).
3. Resend affiche des enregistrements DNS à créer chez votre registrar / hébergeur DNS :
   - **SPF** (TXT),
   - **DKIM** (TXT, `resend._domainkey…`),
   - éventuellement un **MX** pour le sous-domaine d'envoi.
     Recopier les valeurs **exactement** telles qu'affichées.
4. Cliquer **Verify**. La propagation DNS prend de quelques minutes à quelques heures.
5. **API Keys → Create API Key** (permission « Sending access » suffit) et copier la clé :
   elle n'est affichée qu'une fois.

## À renseigner dans Render

| Variable          | Valeur                                                  | Secret  |
| ----------------- | ------------------------------------------------------- | ------- |
| `MAIL_PROVIDER`   | `resend` (déjà dans `render.yaml`)                      | non     |
| `RESEND_API_KEY`  | clé API                                                 | **oui** |
| `MAIL_FROM_EMAIL` | `no-reply@mail.transitioncarriere.fr` (domaine vérifié) | non     |
| `MAIL_FROM_NAME`  | `Transition Carrière` (déjà dans `render.yaml`)         | non     |

`MAIL_FROM_EMAIL` est exigé en production à l'envoi : l'adresse doit appartenir au domaine
vérifié, sinon Resend refuse.

## Repli sans domaine

Mettre `MAIL_PROVIDER=console` : aucun e-mail n'est envoyé, les liens (onboarding, mot de
passe) apparaissent dans les logs Render et sont à transmettre aux testeurs à la main. Utile
pour démarrer pendant que les DNS se propagent.

## Vérifier

Après l'étape 8 : déclencher un e-mail (invitation d'un testeur), vérifier la réception et
l'absence de classement en spam. En cas de problème, voir [10-depannage.md](10-depannage.md).

## Quotas

L'offre gratuite de Resend est limitée en volume quotidien et mensuel et en nombre de
domaines : suffisant pour un test, à vérifier sur leur page tarifaire.

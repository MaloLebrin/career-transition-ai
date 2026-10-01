# 4. Mistral — fonctions IA (optionnel)

L'IA (analyse qualitative d'exercices, import de CV, cartographie, ciblage) passe
exclusivement par le serveur (`POST /dashboard/ai/*`) : aucune clé dans le bundle front.
Détails : [`../AI_JOBS.md`](../AI_JOBS.md).

## Avec IA

1. Créer un compte sur <https://console.mistral.ai> (la vérification du téléphone peut être
   demandée) et activer l'offre gratuite d'expérimentation si elle est proposée.
2. **API Keys → Create new key**, copier la clé.
3. Dans Render :

   | Variable          | Valeur                                           | Secret  |
   | ----------------- | ------------------------------------------------ | ------- |
   | `AI_PROVIDER`     | `mistral` (déjà dans `render.yaml`)              | non     |
   | `MISTRAL_API_KEY` | clé API                                          | **oui** |
   | `MISTRAL_MODEL`   | `mistral-small-latest` (déjà dans `render.yaml`) | non     |

L'offre gratuite est limitée en débit : une analyse peut échouer ou ralentir en cas de
pic. Les jobs IA s'exécutent dans le process web (`QUEUE_DRIVER=sync`).

## Sans IA

Mettre `AI_PROVIDER=none` dans Render (et laisser `MISTRAL_API_KEY` vide) : les écrans IA
sont désactivés.

## RGPD

Aucun nom ni e-mail de candidat n'est envoyé dans un prompt : les données passent par
`pseudonymizeForAi`. Le sous-traitant et les durées de conservation sont documentés dans
[`../RGPD.md`](../RGPD.md) et `shared/constants/legal.ts` (pages `/confidentialite` et
`/securite`).

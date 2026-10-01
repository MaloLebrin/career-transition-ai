# 1. Neon — base de données PostgreSQL

Neon héberge le Postgres (données **et** table des jobs `queue_jobs`). Ne pas utiliser le
Postgres gratuit de Render : il expire au bout de 30 jours.

## Création

1. Créer un compte sur <https://neon.com> (sans carte bancaire).
2. Créer un projet :
   - **Région** : `eu-central-1` (Francfort), la même que le service Render
     (`region: frankfurt` dans `render.yaml`) pour limiter la latence.
   - Version Postgres : 16 ou supérieure. Nom de base : `neondb` (par défaut) ou
     `career_transition_ai`.
3. Dans le tableau de bord, bouton **Connect** : choisir la branche `main`, la base et le
   rôle.
4. **Décocher « Pooled connection »** pour obtenir la chaîne **directe**. Les migrations
   sont plus sûres hors pooler.
5. Copier la chaîne, de la forme :

   ```
   postgresql://<user>:<password>@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

Les libellés de l'interface Neon peuvent changer ; le principe reste : une URL de
connexion directe avec `sslmode=require`.

## À renseigner

| Où                    | Variable                | Valeur                           |
| --------------------- | ----------------------- | -------------------------------- |
| Render                | `DB_URL`                | la chaîne ci-dessus (secret)     |
| Render                | `DB_SSL`                | `true` (déjà dans `render.yaml`) |
| Poste local (étape 7) | `DB_URL`, `DB_SSL=true` | idem                             |

## Vérifier la connexion

```bash
psql "postgresql://<user>:<password>@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require" -c "select 1"
```

## Quotas et comportement (offre gratuite)

- ~0,5 Go de stockage, ~100 heures de calcul (CU-h) par mois par projet.
- Le calcul se met en veille après 5 min d'inactivité (non désactivable) : la première
  requête après une pause est plus lente.
- Si le quota est atteint, le calcul est suspendu (pas de facturation).

C'est aussi pour cela que l'app tourne en `QUEUE_DRIVER=sync` : un worker qui interroge la
base toutes les 2 s empêcherait la mise en veille et consommerait le quota.

## Sauvegarde

Neon propose un historique de restauration limité sur l'offre gratuite. Pour un test, c'est
suffisant. Si les données deviennent précieuses : `pg_dump "<DB_URL>" > sauvegarde.sql`
régulièrement.

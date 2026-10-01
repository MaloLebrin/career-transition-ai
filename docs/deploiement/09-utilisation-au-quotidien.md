# 9. Utilisation au quotidien

## Avant une session de test

Render (15 min) et Neon (5 min) se mettent en veille. Ouvrir l'URL **1 à 2 minutes avant**
l'arrivée des testeurs, ou leur annoncer un premier chargement lent.

## Surveiller

- **Logs** Render : erreurs applicatives, liens d'e-mail si `MAIL_PROVIDER=console`.
- Tableau de bord Neon : consommation de calcul et de stockage.
- Resend : statut des envois. Cloudinary : stockage utilisé.
- Optionnel : `SENTRY_DSN` pour le suivi d'erreurs (rien n'est envoyé sans DSN).

## Mettre à jour l'application

1. Pousser/fusionner sur la branche suivie : Render reconstruit et redéploie (sauf
   Auto-Deploy désactivé, alors **Manual Deploy**).
2. Les nouvelles migrations sont jouées au démarrage (`migrate-and-serve`).
3. Contrôler `/health` et les logs.

Rollback : onglet **Events/Deploys** de Render → **Rollback** vers un déploiement précédent.
Attention : les migrations ne se défont pas automatiquement ; une migration destructive doit
se traiter à la main (`node ace migration:rollback` depuis le poste, avec la même `DB_URL`).

## Limites de ce mode « test »

- Jobs IA / PDF dans le process web : un traitement long peut ralentir ou faire expirer une
  requête.
- Aucune purge nocturne des exports PDF expirés (pas de worker).
- Pas de sauvegarde automatique : `pg_dump "<DB_URL>" > sauvegarde.sql` si besoin.

## Passer à plus durable

Quand le test devient un usage régulier : VM (ou hébergeur payant) avec Postgres, worker
(`QUEUE_DRIVER=database`) et scheduler, décrits dans [`../DEPLOYMENT.md`](../DEPLOYMENT.md)
et [`../PRODUCTION_CHECKLIST.md`](../PRODUCTION_CHECKLIST.md).

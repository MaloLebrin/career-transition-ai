# 2026-10-02 — Notifications candidat et connexions Neon

Déverrouiller une étape ou planifier un rendez-vous répondait 500 en production :
l'insert dans `notifications` violait `notifications_type_check` (`step_unlocked`,
`appointment_scheduled`). Les logs montraient aussi `Connection Error: Connection ended unexpectedly`.

- **Contrainte.** Nouvelle migration `1791000000000` : elle réécrit la contrainte
  CHECK à partir de `NOTIFICATION_TYPES` via `rawQuery`. La migration
  `1780000000000` était déjà enregistrée sans que la base de prod ait la liste
  à jour (la création de table, elle, avait figé les 3 types d'origine).
- **Pool.** `min: 0` et fermeture des connexions idle au bout de 20 s, plus un
  keepalive TCP. Knex en gardait 2 que Neon (ou le NAT Render) coupait ; le
  pool les resservait ensuite.
- **Tests.** Lecture de `pg_get_constraintdef`, et reproduction du 23514 sur la
  contrainte d'origine puis resync dans une transaction annulée.

# 2026-11-28 — Temps réel du worker et rate limiting partagés via Postgres (#172)

Web et worker tournent dans deux process (`deploy/compose.yml`), mais Transmit n'avait pas
de transport (`transport: null`) : « PDF prêt » et les notifications créées par un job
n'arrivaient jamais en direct, il fallait recharger la page. Le rate limiting tenait ses
compteurs en mémoire du process, remis à zéro à chaque redémarrage et multipliés par le
nombre d'instances web.

- **Transmit.** Nouveau transport `postgres` (`app/utils/postgres_transmit_transport.ts`) :
  `LISTEN/NOTIFY` sur la base de l'application, une connexion d'écoute dédiée par process,
  hors pool Lucid et hors transaction, reconnexion à délai croissant avec ré-écoute des
  canaux et rejeu des diffusions en échec, charge > ~7,9 Ko abandonnée et journalisée.
  `TRANSMIT_TRANSPORT` (`postgres` par défaut, `memory` en test, `none`). Aucun Redis.
- **Rate limiting.** Store `database` par défaut (`LIMITER_STORE`, table `rate_limits`,
  migration `1791000000007_create_rate_limits_table`, purge des lignes expirées toutes les
  5 minutes) : compteurs partagés entre instances et conservés au redémarrage.
- **Config.** Variables dans `start/env_schema.ts`, `.env.example`,
  `.env.production.example`, `deploy/.env.example`, `.env.test` et le bloc `env:` de la CI ;
  constantes dans `shared/constants/runtime_stores.ts` ; dépendance directe
  `@boringnode/bus` (types `Transport`, transport mémoire des tests).
- **Tests.** Le job PDF exécuté hors du process HTTP atteint un abonné d'un autre process
  (bus simulé) ; transport Postgres contre la vraie base (relais, busId, hors transaction,
  charge trop grande, coupure + reconnexion, base injoignable) ; config Transmit et
  limiter (store par défaut, compteur partagé entre deux instances, `limiter.clear()`).
- **Docs.** CLAUDE.md, `docs/CHAT.md`, `docs/DEPLOYMENT.md` (§0.6, variables),
  `docs/QUEUES.md`, `docs/hosting.md`, `docs/PRODUCTION_CHECKLIST.md`.

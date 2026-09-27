# 2026-09-27 — Hygiène des variables d'environnement

Issue #17 : `cp .env.example .env` démarre, et toute variable lue par le serveur
est déclarée et validée au boot.

- **Schéma.** `start/env_schema.ts` (chargé par `start/env.ts`) déclare aussi
  `MAIL_PROVIDER`, `MAIL_FROM_*`, `RESEND_API_KEY`, `ADMIN_CONTACT_EMAIL`,
  `MAIL_RESEND_TEST_*`, `ADMIN_PASSWORD` et `APP_NAME`. `QUEUE_DRIVER` n'accepte
  plus `redis` (aucun adapter) : une valeur hors enum empêche le démarrage.
- **Code.** Plus de `process.env` dans `app/`, `config/`, `database/`, `start/` :
  `env.get` et `app.inProduction` / `app.inTest`. Les adresses du service de
  demandes de contact sont lues à l'envoi, plus au chargement du module.
- **Exemples.** `.env.example` complet et bootable (`TZ=Europe/Paris` au lieu de
  `UTC+2`, qui signifiait UTC−2 ; Postgres du compose) ; nouveau
  `.env.production.example`.
- **Tests.** Les deux exemples sont validés contre le schéma
  (`tests/unit/config/env_schema.spec.ts`), garde d'hygiène `env_access`,
  helpers `overrideEnv` / `withEnv` (`tests/utils/env.ts`).
- **Docs.** DEPLOYMENT §5, hosting §1.4, MAIL.md.

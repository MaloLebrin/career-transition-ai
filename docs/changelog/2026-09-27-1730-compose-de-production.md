# 2026-09-27 — Compose de production versionné et testé

Issue #16 : le compose, le Caddyfile, le `.env` et le script de sauvegarde du
runbook (scénario 2, VM) n'existaient qu'en blocs de doc ; ils sont dans
`deploy/`, à copier tel quel sur l'hôte, et démarrés à chaque PR.

- **`deploy/compose.yml`** : `postgres` (volume, healthcheck), `migrate` et
  `seed` one-shot (profil `ops`), `app`, `worker`, `caddy` (TLS sur
  `APP_DOMAIN`, SSE sans buffering). `restart: unless-stopped`, `mem_limit`,
  `NODE_OPTIONS` par service ; le HEALTHCHECK HTTP de l'image est désactivé
  sur les services sans HTTP.
- **Pas de volume dans `app` ni `worker`** : les PDF vont sur S3/R2
  (`DRIVE_DISK=s3`), comme sur Render.
- **`deploy/.env.example`** (validé contre le schéma d'env) et
  **`deploy/backup.sh`** (`pg_dump`, rotation 14 jours, échec si dump vide).
- **Dev** : `docker-compose.yml` ne garde que les Postgres de dev et de test ;
  ses services `app`/`worker` (build depuis les sources) sont retirés.
- **CI** : le job `docker-image` lance `scripts/smoke_compose_prod.sh` :
  migrate, seed, `/health` en HTTPS via Caddy, écriture S3 par le worker relue
  par l'app (bucket simulé par `rclone serve s3`), worker sans erreur, app en
  `node` sans montage, `backup.sh`.
- **Tests** : garde `tests/unit/hygiene/compose_prod.spec.ts`, `deploy/.env.example`
  ajouté à `tests/unit/config/env_schema.spec.ts`.
- **Docs** : DEPLOYMENT §2.3, §2.4, §2.6, stockage des PDF et incidents ;
  hosting §1.6 et §3.2.

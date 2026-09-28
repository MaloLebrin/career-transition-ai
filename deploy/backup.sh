#!/usr/bin/env bash
# Sauvegarde Postgres du compose de production (docs/DEPLOYMENT.md §2.6).
# Cron conseillé : 15 3 * * * /home/<user>/cta/backup.sh >> /home/<user>/cta/backups/backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")"

# Lecture ciblée plutôt que `source .env` : des valeurs contiennent des espaces.
read_env() { grep -E "^$1=" .env | tail -n1 | cut -d= -f2-; }
DB_USER=$(read_env DB_USER)
DB_DATABASE=$(read_env DB_DATABASE)

mkdir -p backups
F="backups/cta-$(date +%F-%H%M%S).sql.gz"
docker compose exec -T postgres pg_dump -U "$DB_USER" "$DB_DATABASE" | gzip > "$F"
[ -s "$F" ] || { echo "sauvegarde vide : $F" >&2; exit 1; }
find backups -name '*.sql.gz' -mtime +14 -delete
echo "$F"

# Copie hors machine (Cloudflare R2 ou Backblaze B2, 10 Go gratuits) :
# rclone copy "$F" r2:cta-backups/

#!/usr/bin/env bash
# Test de fumée du compose de production (deploy/, issue #16), job CI
# `docker-image`. Rejoue le premier démarrage de docs/DEPLOYMENT.md §2.4 sur
# une copie de `deploy/`, avec une image locale :
#
#   APP_IMAGE=career-transition-ai:ci scripts/smoke_compose_prod.sh
#
# Vérifie : migrate et seed one-shot, /health 200 en HTTPS via Caddy, worker
# vivant sans erreur, app sans volume, backup.sh produit un dump non vide.
#
# Les fichiers vont sur Cloudinary (issue #49) : les identifiants sont
# factices, le démarrage en production les exige mais aucun appel réseau
# n'est fait ici.
set -euo pipefail

: "${APP_IMAGE:?APP_IMAGE requis (image construite depuis le Dockerfile)}"
ROOT=$(cd "$(dirname "$0")/.." && pwd)
WORK=$(mktemp -d)

cp -r "$ROOT/deploy" "$WORK/cta"
cd "$WORK/cta"

sed \
  -e "s#^APP_IMAGE=.*#APP_IMAGE=$APP_IMAGE#" \
  -e 's#^APP_DOMAIN=.*#APP_DOMAIN=localhost#' \
  -e 's#^APP_KEY=.*#APP_KEY=smoke-test-only-app-key-not-a-secret#' \
  -e 's#^DB_PASSWORD=.*#DB_PASSWORD=smoke-test-db-password#' \
  -e 's#^CLOUDINARY_CLOUD_NAME=.*#CLOUDINARY_CLOUD_NAME=smoke#' \
  -e 's#^CLOUDINARY_API_KEY=.*#CLOUDINARY_API_KEY=smoke-key#' \
  -e 's#^CLOUDINARY_API_SECRET=.*#CLOUDINARY_API_SECRET=smoke-secret#' \
  -e 's#^AI_PROVIDER=.*#AI_PROVIDER=none#' \
  -e 's#^ADMIN_PASSWORD=.*#ADMIN_PASSWORD=smoke-test-admin-password#' \
  .env.example > .env

compose() { docker compose -f compose.yml "$@"; }
cleanup() {
  status=$?
  if [ "$status" -ne 0 ]; then compose logs --no-color --tail=100 || true; fi
  compose --profile ops down -v --remove-orphans > /dev/null 2>&1 || true
  rm -rf "$WORK"
  exit "$status"
}
trap cleanup EXIT
# Sous `set -e`, une commande en échec arrête le script sans message.
trap 'echo "échec ligne $LINENO : $BASH_COMMAND" >&2' ERR

step() { printf '\n==> %s\n' "$*"; }

step 'postgres'
compose up -d --wait postgres

step 'migrate (one-shot)'
compose run --rm migrate

step 'seed (one-shot)'
compose run --rm seed

step 'app, worker, caddy'
# `--wait` seulement sur les services qui ont un healthcheck : sur le worker
# (healthcheck désactivé), certaines versions de Compose échouent.
compose up -d --wait app caddy
compose up -d worker

step '/health en HTTPS via Caddy'
# Caddy est « up » avant d'avoir émis son certificat : les premières poignées
# de main TLS échouent (curl 35) le temps de l'émission.
code=000
for _ in $(seq 1 30); do
  code=$(curl -sk -o /dev/null -w '%{http_code}' https://localhost/health || true)
  [ "$code" = 200 ] && break
  sleep 2
done
[ "$code" = 200 ] || { echo "/health a répondu $code"; exit 1; }
# Corps capturé d'abord : `curl | grep -q` échoue sous pipefail (SIGPIPE).
home=$(curl -sk https://localhost/)
grep -q '<title' <<< "$home" || { echo 'pas de rendu SSR sur /'; exit 1; }

step 'worker vivant, sans erreur'
[ "$(compose ps --format '{{.State}}' worker)" = running ] || { echo 'worker arrêté'; exit 1; }
worker_logs=$(compose logs --no-color worker)
if grep -qE 'No jobs found for locations|"level":(50|60)' <<< "$worker_logs"; then
  echo "$worker_logs"; exit 1
fi

step 'app en utilisateur node, sans volume'
[ "$(compose exec -T app id -un)" = node ] || { echo 'app ne tourne pas en node'; exit 1; }
mounts=$(docker inspect -f '{{len .Mounts}}' "$(compose ps -q app)")
[ "$mounts" = 0 ] || { echo "app a $mounts montage(s)"; exit 1; }

step 'backup.sh'
dump=$(./backup.sh)
[ "$(gunzip -c "$dump" | grep -c 'CREATE TABLE')" -gt 0 ] || { echo "dump vide : $dump"; exit 1; }

step 'OK'

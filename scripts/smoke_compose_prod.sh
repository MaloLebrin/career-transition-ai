#!/usr/bin/env bash
# Test de fumée du compose de production (deploy/, issue #16), job CI
# `docker-image`. Rejoue le premier démarrage de docs/DEPLOYMENT.md §2.4 sur
# une copie de `deploy/`, avec une image locale :
#
#   APP_IMAGE=career-transition-ai:ci scripts/smoke_compose_prod.sh
#
# Vérifie : migrate et seed one-shot, /health 200 en HTTPS via Caddy, worker
# vivant sans erreur, app et worker lisent et écrivent le même bucket S3 (pas
# de volume), backup.sh produit un dump non vide.
#
# Le bucket est simulé par `rclone serve s3` dans un override propre à ce
# script : le compose livré n'a pas de stockage local. Style d'adressage
# « virtual host » comme R2 (config/drive.ts ne force pas le path style) :
# le nom `<bucket>.s3` est un alias réseau du service.
set -euo pipefail

: "${APP_IMAGE:?APP_IMAGE requis (image construite depuis le Dockerfile)}"
ROOT=$(cd "$(dirname "$0")/.." && pwd)
WORK=$(mktemp -d)
BUCKET=cta-exports

cp -r "$ROOT/deploy" "$WORK/cta"
cd "$WORK/cta"

sed \
  -e "s#^APP_IMAGE=.*#APP_IMAGE=$APP_IMAGE#" \
  -e 's#^APP_DOMAIN=.*#APP_DOMAIN=localhost#' \
  -e 's#^APP_KEY=.*#APP_KEY=smoke-test-only-app-key-not-a-secret#' \
  -e 's#^DB_PASSWORD=.*#DB_PASSWORD=smoke-test-db-password#' \
  -e "s#^S3_BUCKET=.*#S3_BUCKET=$BUCKET#" \
  -e 's#^S3_ENDPOINT=.*#S3_ENDPOINT=http://s3:9000#' \
  -e 's#^S3_ACCESS_KEY_ID=.*#S3_ACCESS_KEY_ID=smoke#' \
  -e 's#^S3_SECRET_ACCESS_KEY=.*#S3_SECRET_ACCESS_KEY=smoke-secret#' \
  -e 's#^AI_PROVIDER=.*#AI_PROVIDER=none#' \
  -e 's#^ADMIN_PASSWORD=.*#ADMIN_PASSWORD=smoke-test-admin-password#' \
  .env.example > .env

cat > "$WORK/s3.override.yml" <<EOF
services:
  s3:
    image: rclone/rclone:1
    command: serve s3 /data --addr :9000 --auth-key smoke,smoke-secret --force-path-style=false
    networks:
      default:
        aliases: ['$BUCKET.s3']
EOF

compose() { docker compose -f compose.yml -f "$WORK/s3.override.yml" "$@"; }
cleanup() {
  status=$?
  if [ "$status" -ne 0 ]; then compose logs --no-color --tail=100 || true; fi
  compose --profile ops down -v --remove-orphans > /dev/null 2>&1 || true
  rm -rf "$WORK"
  exit "$status"
}
trap cleanup EXIT

step() { printf '\n==> %s\n' "$*"; }

step 'postgres + s3'
compose up -d --wait postgres s3

step 'migrate (one-shot)'
compose run --rm migrate

step 'seed (one-shot)'
compose run --rm seed

step 'app, worker, caddy'
compose up -d --wait

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

step 'bucket S3 partagé entre worker et app (aucun volume)'
probe='import { S3Client, CreateBucketCommand, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
const e = process.env
const s3 = new S3Client({ region: e.S3_REGION, endpoint: e.S3_ENDPOINT,
  credentials: { accessKeyId: e.S3_ACCESS_KEY_ID, secretAccessKey: e.S3_SECRET_ACCESS_KEY } })
const [mode] = process.argv.slice(1)
if (mode === "write") {
  await s3.send(new CreateBucketCommand({ Bucket: e.S3_BUCKET })).catch(() => {})
  await s3.send(new PutObjectCommand({ Bucket: e.S3_BUCKET, Key: "exports/probe.txt", Body: "from-worker" }))
} else {
  const res = await s3.send(new GetObjectCommand({ Bucket: e.S3_BUCKET, Key: "exports/probe.txt" }))
  const body = await res.Body.transformToString()
  if (body !== "from-worker") throw new Error("contenu inattendu : " + body)
}
console.log("s3 " + mode + " ok")'
compose exec -T worker node --input-type=module -e "$probe" write
compose exec -T app node --input-type=module -e "$probe" read

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

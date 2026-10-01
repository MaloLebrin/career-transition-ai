#!/bin/sh
# Modes de l'image (docs/DEPLOYMENT.md §0.7). Les migrations ne tournent plus
# au démarrage du serveur : `migrate` est une étape explicite du déploiement,
# à lancer avant `server` et `worker`.
set -e

MODE="${1:-server}"

case "$MODE" in
  server)
    exec node bin/server.js
    ;;
  worker)
    exec node ace.js queue:work --queue=default,ai,pdfs,analytics
    ;;
  migrate)
    exec node ace.js migration:run --force
    ;;
  # Hébergeurs sans étape de pré-déploiement (Render Free, docs/DEPLOYMENT_TEST.md) :
  # migrations idempotentes puis serveur. Le compose de prod garde `migrate` explicite.
  migrate-and-serve)
    node ace.js migration:run --force
    exec node bin/server.js
    ;;
  seed)
    exec node ace.js db:seed --files database/seeders/admin_seeder
    ;;
  *)
    echo "Unknown mode: $MODE. Use one of: server, worker, migrate, migrate-and-serve, seed."
    exit 1
    ;;
esac

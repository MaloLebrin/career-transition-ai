#!/bin/sh
# Modes de l'image (docs/DEPLOYMENT.md §0.7). Les migrations ne tournent plus
# au démarrage du serveur : `migrate` est une étape explicite du déploiement,
# à lancer avant `server` et `worker`.
set -e

# Render (`dockerCommand`) ne remplace que le CMD : `/entrypoint.sh migrate-and-serve`
# arrive en arguments de l'ENTRYPOINT. On ignore notre propre chemin s'il est répété.
if [ "$1" = "/entrypoint.sh" ] || [ "$1" = "$0" ]; then
  shift
fi

MODE="${1:-server}"

# Hébergeurs sans étape de pré-déploiement ni commande de démarrage fiable
# (service Render créé hors Blueprint) : RUN_MIGRATIONS_ON_BOOT=true fait migrer
# le mode `server` par défaut. Le compose de prod ne la définit pas.
if [ "$MODE" = "server" ] && [ "$RUN_MIGRATIONS_ON_BOOT" = "true" ]; then
  MODE="migrate-and-serve"
fi

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
  # Hébergeurs sans étape de pré-déploiement (Render Free, docs/deploiement/) :
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

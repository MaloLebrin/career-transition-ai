#!/bin/sh
set -e

MODE="${1:-server}"

case "$MODE" in
  server)
    echo "Running migrations..."
    node build/bin/console.js migration:run --force
    echo "Starting server..."
    exec node build/bin/server.js
    ;;
  worker)
    echo "Starting workers..."
    exec node build/bin/console.js queue:work --queue=default,ai,pdfs,analytics
    ;;
  *)
    echo "Unknown mode: $MODE. Use 'server' or 'worker'."
    exit 1
    ;;
esac

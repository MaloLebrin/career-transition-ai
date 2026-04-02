#!/usr/bin/env bash
set -euo pipefail

# Clever Cloud: set CC_POST_BUILD_HOOK=./clevercloud/post-build.sh
# Requires CC_NODE_DEV_DEPENDENCIES=install so @adonisjs/assembler and peers are available for `ace build`.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

pnpm run build

cd "$ROOT_DIR/build"
pnpm install --prod --frozen-lockfile

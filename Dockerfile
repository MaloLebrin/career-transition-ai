FROM node:24-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN node ace build

# ---

# Image d'exécution : uniquement `build/` (qui embarque son package.json et son
# pnpm-lock.yaml) et ses dépendances de production, comme le job CI
# smoke-prod-build. Pas de migration au démarrage : voir docker/entrypoint.sh.
FROM node:24-alpine AS runner

ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.18.3 --activate

COPY --from=builder /app/build ./
RUN pnpm install --prod --frozen-lockfile && pnpm store prune

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && chown -R node:node /app

USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" > /dev/null || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["server"]

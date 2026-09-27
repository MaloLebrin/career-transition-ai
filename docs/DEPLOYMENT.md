# Déploiement — procédure pas à pas

Runbook de mise en production pour les deux scénarios recommandés dans [hosting.md](hosting.md) :

- **Scénario 1 — usage perso** : Render Free (web) + Neon Free (Postgres), un seul process (`QUEUE_DRIVER=sync`), 0 €.
- **Scénario 2 — beta fermée** : une VM (Oracle Always Free ou VPS ≈ 3–6 €/mois) en `docker-compose` complet (Postgres + web + worker + Caddy), toujours allumée.

Sommaire :

0. [Préparer le repo (obligatoire, une fois)](#0-préparer-le-repo-obligatoire-une-fois)
1. [Scénario 1 — Render + Neon](#1-scénario-1--render--neon-usage-perso)
2. [Scénario 2 — VM docker-compose](#2-scénario-2--vm-docker-compose-beta-fermée)
3. [Exploitation : mise à jour, rollback, sauvegardes, secrets](#3-exploitation)
4. [Incidents courants](#4-incidents-courants)
5. [Référence : variables d'environnement de production](#5-référence--variables-denvironnement-de-production)

---

## 0. Préparer le repo (obligatoire, une fois)

Sans ces correctifs, **aucun déploiement ne fonctionne** (détails et preuves dans [hosting.md §1.7 et §3.2](hosting.md#17-bug-bloquant-découvert--le-build-de-prod-ne-rend-aucune-page)). Faire une branche, appliquer, vérifier (`pnpm typecheck && node ace test && pnpm test:inertia && node ace build`), merger sur `main`.

### 0.1 Chemins SSR et manifest Vite (bloquant : 500 sur toutes les pages)

`config/inertia.ts` :

```ts
ssr: {
  enabled: true,
  bundle: 'ssr/ssr.js', // relatif à la racine de l'app (= build/ en prod)
},
```

`config/vite.ts` :

```ts
manifestFile: 'public/assets/.vite/manifest.json',
```

### 0.2 Connection string + SSL configurable (bloquant Render/Neon et docker-compose)

`start/env.ts` — remplacer le bloc base de données par :

```ts
DB_URL: Env.schema.string.optional(),
DB_HOST: Env.schema.string.optional({ format: 'host' }),
DB_PORT: Env.schema.number.optional(),
DB_USER: Env.schema.string.optional(),
DB_PASSWORD: Env.schema.string.optional(),
DB_DATABASE: Env.schema.string.optional(),
DB_SSL: Env.schema.boolean.optional(),
SQLITE_DB_PATH: Env.schema.string.optional(),
```

`config/database.ts` — connexion `postgres` :

```ts
const dbUrl = env.get('DB_URL')
const ssl = env.get('DB_SSL', true) ? { rejectUnauthorized: false } : false

postgres: {
  client: 'pg',
  connection: dbUrl
    ? { connectionString: dbUrl, ssl }
    : {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
        ssl,
      },
  migrations: { naturalSort: true, paths: ['database/migrations'] },
},
```

Règle : `DB_URL` **ou** le jeu `DB_*`, jamais un mélange partiel. `DB_SSL=false` uniquement pour un Postgres local/conteneur sans TLS.

### 0.3 Sortir le seed de comptes de la migration (bloquant : `migration:run` exige `ADMIN_PASSWORD`)

`database/migrations/1778062253238_create_seed_users_table.ts` — vider `up()` et `down()` (garder le fichier : il est déjà enregistré dans les bases de dev) :

```ts
export default class extends BaseSchema {
  async up() {} // seed déplacé dans database/seeders/admin_seeder.ts
  async down() {}
}
```

Le super admin est créé par `admin_seeder.ts` (idempotent, lit `ADMIN_PASSWORD`) : `node build/bin/console.js db:seed --files database/seeders/admin_seeder`. Le second compte en dur (« Pleiade Consulting ») se crée depuis l'UI super admin, pas par migration.

> ✅ Appliqué (issue #10).

### 0.4 Chemin des jobs de queue indépendant du `cwd`

`config/queue.ts` :

```ts
import app from '@adonisjs/core/services/app'
// …
locations: [app.makePath(app.inProduction ? 'app/jobs/**/*.js' : 'app/jobs/**/*.ts')],
```

### 0.5 Route de santé

`start/routes/public.ts` — **hors** du groupe `guest` :

```ts
import { HealthChecks } from '@adonisjs/core/health'
import { DbCheck } from '@adonisjs/lucid/database'
import db from '@adonisjs/lucid/services/db'

const healthChecks = new HealthChecks().register([new DbCheck(db.connection())])

router.get('/health', async ({ response }) => {
  const report = await healthChecks.run()
  return report.isHealthy ? response.ok(report) : response.serviceUnavailable(report)
})
```

> ✅ Appliqué (issue #12) : `start/health.ts` + `HealthChecksController`. La réponse est filtrée (`app/utils/health_report.ts`) : `isHealthy`, `status`, `finishedAt` et le nom/statut de chaque check — ni `debugInfo`, ni message d'erreur `pg` (loggé côté serveur en cas de 503).

### 0.6 Reverse proxy, SSE keep-alive, rate limiting

`config/app.ts` (objet `http`) : `trustProxy: () => true` — l'app n'est jamais exposée sans proxy dans les deux scénarios ; les liens d'onboarding passent alors en `https://`.

`config/transmit.ts` : `pingInterval: '30s'`.

Avec ce `trustProxy`, `request.ip()` renvoie l'entrée la plus à **gauche** de `X-Forwarded-For`, écrite par le client : elle ne sert à aucune décision de sécurité. Le rate limiting (ci-dessous) utilise `clientIp()` (`app/utils/client_ip.ts`), soit l'entrée la plus à **droite**, celle que le proxy ajoute (Render) ou réécrit (Caddy). Un seul proxy doit donc se trouver devant l'app ; avec deux proxys chaînés (ex. CDN devant Caddy), la clé deviendrait l'IP du premier proxy et tous les clients partageraient un compteur.

#### Rate limiting des endpoints publics

`@adonisjs/limiter` (issue #23), limites définies dans `start/limiter.ts` :

| Route | Limite | Clé |
|---|---|---|
| `POST /auth/login` | 5 / minute | IP + e-mail (normalisé) |
| `POST /auth/register` | 3 / heure | IP |
| `POST /contact-requests` | 3 / heure (2 e-mails Resend par demande) | IP |
| `POST /onboarding/:token` | 10 / minute | IP |

Au-delà : 429 avec `Retry-After` et `X-RateLimit-*`. Une requête Inertia reçoit à la place un redirect back (303) avec `flash.error` et `errors.rateLimit` (`app/exceptions/handler.ts`). Store `memory` (`config/limiter.ts`) : les compteurs sont propres au process web et repartent à zéro au redémarrage. Avec plusieurs instances web, passer au store `database`.

### 0.7 Dockerfile et entrypoint (scénario 2)

`Dockerfile`, stage `runner`, après `WORKDIR /app` :

```dockerfile
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080
# …
RUN chown -R node:node /app
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health || exit 1
```

`docker/entrypoint.sh` — remplacer le `case` :

```sh
case "$MODE" in
  server)  exec node build/bin/server.js ;;
  worker)  exec node build/bin/console.js queue:work --queue=default,ai,pdfs,analytics ;;
  migrate) exec node build/bin/console.js migration:run --force ;;
  seed)    exec node build/bin/console.js db:seed --files database/seeders/admin_seeder ;;
  *) echo "Unknown mode: $MODE (server|worker|migrate|seed)"; exit 1 ;;
esac
```

Les migrations ne tournent plus à chaque boot du web : elles deviennent une étape explicite (`migrate`) de la procédure de mise à jour.

Premier `docker build` à faire **en local ou en CI** avant tout déploiement : si `better-sqlite3` (devDependency native) échoue à compiler sur Alpine, ajouter `RUN apk add --no-cache python3 make g++` dans le stage `builder`, ou passer les deux stages sur `node:24-slim`.

### 0.8 CI : publier l'image sur GHCR (scénario 2)

`.github/workflows/docker.yml` :

```yaml
name: Docker image
on:
  push:
    branches: [main]
    tags: ['v*']
permissions:
  contents: read
  packages: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-qemu-action@v3
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/metadata-action@v5
        id: meta
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=sha
            type=raw,value=latest,enable={{is_default_branch}}
            type=ref,event=tag
      - uses: docker/build-push-action@v6
        with:
          push: true
          platforms: linux/amd64,linux/arm64
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

`linux/arm64` couvre Oracle A1 et Raspberry Pi. Sur un repo privé, GHCR offre 500 Mo de stockage : garder `latest` + les 2–3 derniers `sha` (paramétrer la rétention dans Settings → Packages).

### 0.9 Métadonnées de version

`package.json` : ajouter `"packageManager": "pnpm@10.18.3"` et `"engines": { "node": ">=24" }`. Compléter `.env.example` (voir §5) et corriger `TZ=Europe/Paris`.

---

## 1. Scénario 1 — Render + Neon (usage perso)

Durée : ~30 min. Aucune carte bancaire. Prérequis : §0 mergé sur `main`.

### 1.1 Générer les secrets (local)

```bash
node ace generate:key        # → APP_KEY (ne pas l'écrire dans .env local par erreur)
openssl rand -base64 24      # → ADMIN_PASSWORD
```

### 1.2 Créer la base Neon

1. <https://console.neon.tech> → **New project** : nom `career-transition-ai`, région **Frankfurt (eu-central-1)**, Postgres 17.
2. Onglet **Connection details** → cocher *Pooled connection* désactivé (prendre la connexion **directe** : plus simple pour les migrations) → copier l'URL, forme :
   `postgresql://<user>:<password>@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`
3. Laisser l'autosuspend par défaut (5 min) : c'est ce qui rend le plan gratuit tenable.

### 1.3 Créer le web service Render

1. <https://dashboard.render.com> → **New → Web Service** → connecter le repo GitHub `career-transition-ai`, branche `main`, région **Frankfurt**.
2. **Runtime** : Node (Render lit `.node-version` → 24). **Instance type** : Free.
3. **Build command** :
   ```bash
   npm install -g pnpm@10.18.3 && pnpm install --frozen-lockfile && pnpm build
   ```
4. **Start command** (le plan Free n'a ni *pre-deploy command* ni shell : migrations et seed s'exécutent au démarrage, ils sont idempotents) :
   ```bash
   node build/bin/console.js migration:run --force && node build/bin/console.js db:seed --files database/seeders/admin_seeder && node build/bin/server.js
   ```
5. **Health check path** : `/health`.
6. **Environment variables** (onglet Environment) :

   | Clé | Valeur |
   |---|---|
   | `NODE_ENV` | `production` |
   | `HOST` | `0.0.0.0` |
   | `PORT` | `10000` |
   | `TZ` | `Europe/Paris` |
   | `LOG_LEVEL` | `info` |
   | `APP_KEY` | *(généré en 1.1)* |
   | `SESSION_DRIVER` | `cookie` |
   | `DB_URL` | *(URL Neon, avec `?sslmode=require`)* |
   | `DB_SSL` | `true` |
   | `QUEUE_DRIVER` | `sync` |
   | `AI_PROVIDER` | `mistral` |
   | `MISTRAL_API_KEY` | *(clé plan Experiment, console Mistral)* |
   | `MISTRAL_MODEL` | `mistral-small-latest` |
   | `MAIL_PROVIDER` | `console` *(ou `resend` : les e-mails n'arriveront qu'à l'adresse de ton compte Resend, faute de domaine vérifié)* |
   | `MAIL_FROM_EMAIL` | `onboarding@resend.dev` *(requis en prod même en mode console)* |
   | `MAIL_FROM_NAME` | `Career Transition AI` |
   | `ADMIN_PASSWORD` | *(généré en 1.1)* |
   | `NODE_OPTIONS` | `--max-old-space-size=384` |

   L'OCR des CV et les suggestions passent par le serveur (`/dashboard/ai/*`) avec cette même clé : aucune variable `VITE_*` n'est nécessaire pour l'IA.

7. **Create Web Service**. Premier build ≈ 5–8 min (0,1 CPU). L'URL est `https://<nom>.onrender.com`.

### 1.4 Vérifier

```bash
URL=https://<nom>.onrender.com
curl -s -o /dev/null -w "%{http_code}\n" $URL/health          # 200
curl -s $URL/ | grep -c '<div id="app"'                      # 1, et le HTML contient du texte SSR
curl -s -o /dev/null -w "%{http_code}\n" $URL/assets/app-XXXX.js  # 200 (chemin visible dans le source de /)
```

Puis dans le navigateur : connexion `malolebrin@gmail.com` / `ADMIN_PASSWORD` (compte créé par `admin_seeder`), création d'une organisation et d'un conseiller, lecture du lien d'onboarding dans **Logs** Render (mode `console`), activation, exercice → analyse IA (inline, la requête dure quelques secondes), export PDF → téléchargement immédiat (même process). Dérouler la checklist de [hosting.md §3.3](hosting.md#33-checklist-post-déploiement).

### 1.5 Ce qu'il faut savoir en exploitation

- **Cold start** ≈ 1 min après 15 min sans requête (Render) + ≈ 1 s (Neon). Normal.
- **PDF perdus** à chaque redémarrage (disque éphémère) : relancer l'export.
- **Mise à jour** = push sur `main` (auto-deploy). Migrations au démarrage. Rollback : Render → *Rollback* sur le déploiement précédent (les migrations déjà appliquées restent : écrire des migrations rétro-compatibles).
- **Neon** : suivre *Usage* (CU-hours < 100/mois, stockage < 0,5 Go). Sauvegarde : `pg_dump "$DB_URL" | gzip > backup-$(date +%F).sql.gz` depuis ton poste, une fois par semaine ou avant chaque migration risquée.

---

## 2. Scénario 2 — VM docker-compose (beta fermée)

Durée : ~1 h (hors attente de capacité Oracle). Prérequis : §0 mergé, image publiée sur GHCR (§0.8).

### 2.1 Obtenir la VM

**Option A — Oracle Cloud Always Free (0 €)**

1. <https://cloud.oracle.com> → compte Free (CB demandée, non débitée). Home region **Frankfurt** ou **Paris**.
2. Compute → **Create instance** : image **Ubuntu 24.04 (aarch64)**, shape **VM.Standard.A1.Flex**, **2 OCPU / 12 Go** (plafond Free depuis juin 2026), boot volume 50 Go, clé SSH.
   Si « Out of capacity » : réessayer à d'autres heures ou retenter avec 1 OCPU / 6 Go ; des scripts de relance existent (voir hosting.md).
3. Réseau : VCN → Security List → **Ingress** : TCP 80 et 443 depuis `0.0.0.0/0`. Puis **sur la VM**, Oracle bloque aussi en iptables :
   ```bash
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
   sudo netfilter-persistent save
   ```
4. Pour éviter la récupération « idle » (7 jours < 20 % CPU/RAM/réseau) : le worker et Postgres suffisent rarement. Passer le compte en **Pay As You Go** (reste 0 € dans les limites Free et supprime cette règle) ou accepter le risque.

**Option B — VPS (netcup ≈ 3,35 €/mois, Hetzner CX23 ≈ 5,5 €/mois)** : Ubuntu 24.04, 2 Go RAM minimum, région DE/FR, clé SSH. Firewall du fournisseur : 22, 80, 443.

### 2.2 Préparer l'hôte

```bash
ssh ubuntu@<IP>
sudo apt update && sudo apt -y upgrade
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && newgrp docker
# swap 1 Go (indispensable sur 2 Go de RAM)
sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
# mises à jour de sécurité automatiques
sudo apt -y install unattended-upgrades && sudo dpkg-reconfigure -plow unattended-upgrades
mkdir -p ~/cta && cd ~/cta
```

Nom d'hôte sans domaine : `<IP avec des tirets>.sslip.io`, ex. `129-146-10-20.sslip.io` (résout vers `129.146.10.20`). Vérifier : `dig +short 129-146-10-20.sslip.io`.

### 2.3 Fichiers de déploiement (`~/cta/`)

`compose.yml` :

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_DATABASE}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DB_USER} -d ${DB_DATABASE}']
      interval: 10s
      timeout: 5s
      retries: 5
    mem_limit: 512m

  migrate:
    image: ${APP_IMAGE}
    command: migrate
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
    restart: 'no'
    profiles: [ops]

  seed:
    image: ${APP_IMAGE}
    command: seed
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
    restart: 'no'
    profiles: [ops]

  app:
    image: ${APP_IMAGE}
    command: server
    restart: unless-stopped
    env_file: .env
    environment:
      NODE_OPTIONS: --max-old-space-size=384
    volumes:
      - exports:/app/tmp          # PDF générés par le worker, servis par le web
    depends_on:
      postgres:
        condition: service_healthy
    expose: ['8080']
    mem_limit: 640m

  worker:
    image: ${APP_IMAGE}
    command: worker
    restart: unless-stopped
    env_file: .env
    environment:
      NODE_OPTIONS: --max-old-space-size=256
    volumes:
      - exports:/app/tmp
    depends_on:
      postgres:
        condition: service_healthy
    mem_limit: 512m

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports: ['80:80', '443:443']
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on: [app]

volumes:
  pgdata:
  exports:
  caddy_data:
  caddy_config:
```

`Caddyfile` (remplacer l'hôte) :

```
129-146-10-20.sslip.io {
	encode zstd gzip
	reverse_proxy app:8080 {
		flush_interval -1        # SSE (Transmit) : pas de buffering
	}
}
```

Caddy obtient et renouvelle le certificat tout seul (Let's Encrypt, repli ZeroSSL). Si Let's Encrypt refuse (rate-limit partagé sur `sslip.io`), Caddy bascule sur ZeroSSL automatiquement ; sinon exposer via Tailscale Funnel (§2.7).

`.env` (chmod 600) :

```bash
APP_IMAGE=ghcr.io/malolebrin/career-transition-ai:latest

NODE_ENV=production
HOST=0.0.0.0
PORT=8080
TZ=Europe/Paris
LOG_LEVEL=info
APP_KEY=<node ace generate:key>
SESSION_DRIVER=cookie

DB_HOST=postgres
DB_PORT=5432
DB_USER=cta
DB_PASSWORD=<openssl rand -hex 24>
DB_DATABASE=cta
DB_SSL=false

QUEUE_DRIVER=database

AI_PROVIDER=mistral
MISTRAL_API_KEY=<clé>
MISTRAL_MODEL=mistral-small-latest

# Sans domaine vérifié : console (lien d'onboarding dans `docker compose logs app`)
MAIL_PROVIDER=console
MAIL_FROM_EMAIL=onboarding@resend.dev
MAIL_FROM_NAME=Career Transition AI
# Avec un domaine vérifié chez Resend :
# MAIL_PROVIDER=resend
# RESEND_API_KEY=re_xxx
# MAIL_FROM_EMAIL=no-reply@<ton-domaine>
# ADMIN_CONTACT_EMAIL=<ton adresse>

ADMIN_PASSWORD=<openssl rand -base64 24>
```

Si le repo GHCR est privé : `echo <PAT read:packages> | docker login ghcr.io -u malolebrin --password-stdin`.

### 2.4 Premier démarrage

```bash
cd ~/cta
docker compose pull
docker compose up -d postgres
docker compose run --rm migrate         # 32 migrations
docker compose run --rm seed            # super admin (idempotent)
docker compose up -d                    # app, worker, caddy
docker compose ps                       # tous "healthy"/"running"
docker compose logs -f app worker       # pas de "No jobs found for locations", pas de E_MISSING_ENV
```

### 2.5 Vérifier

```bash
H=https://129-146-10-20.sslip.io
curl -s -o /dev/null -w "%{http_code}\n" $H/health         # 200
curl -sI $H/ | grep -i strict-transport                    # HSTS présent
curl -s $H/ | grep -o '<title[^<]*'                        # titre SSR
```

Puis, dans le navigateur, le parcours complet : connexion super admin → organisation → conseiller → candidat → lien d'onboarding (`docker compose logs app | grep onboarding`) → exercice → vérifier dans `docker compose logs worker` le job `ai` → export PDF → `completed` → téléchargement (le volume `exports` est partagé). Dérouler la checklist de [hosting.md §3.3](hosting.md#33-checklist-post-déploiement).

### 2.6 Sauvegardes (obligatoire pour une beta)

`~/cta/backup.sh` :

```bash
#!/usr/bin/env bash
set -euo pipefail
cd ~/cta
mkdir -p backups
F=backups/cta-$(date +%F-%H%M).sql.gz
docker compose exec -T postgres pg_dump -U "$(grep ^DB_USER= .env | cut -d= -f2)" "$(grep ^DB_DATABASE= .env | cut -d= -f2)" | gzip > "$F"
find backups -name '*.sql.gz' -mtime +14 -delete
# Copie hors machine (Cloudflare R2 ou Backblaze B2, 10 Go gratuits) :
# rclone copy "$F" r2:cta-backups/
```

```bash
chmod +x backup.sh && (crontab -l 2>/dev/null; echo "15 3 * * * $HOME/cta/backup.sh >> $HOME/cta/backups/backup.log 2>&1") | crontab -
```

Tester la **restauration** une fois :

```bash
docker compose exec -T postgres createdb -U cta cta_restore
gunzip -c backups/<fichier>.sql.gz | docker compose exec -T postgres psql -U cta cta_restore -q
docker compose exec -T postgres psql -U cta cta_restore -c 'select count(*) from users;'
docker compose exec -T postgres dropdb -U cta cta_restore
```

Les PDF (`exports`) sont régénérables : pas sauvegardés.

### 2.7 Variante sans IP publique : Tailscale Funnel

Sur la VM (ou une machine maison) : `curl -fsSL https://tailscale.com/install.sh | sh && sudo tailscale up`, activer **HTTPS certificates** et **Funnel** dans la console Tailscale (DNS → MagicDNS/HTTPS, puis Access controls → `nodeAttrs funnel`). Retirer le service `caddy` du compose, publier `app` sur `127.0.0.1:8080` (`ports: ['127.0.0.1:8080:8080']`) puis :

```bash
sudo tailscale funnel --bg 8080
# → https://<machine>.<tailnet>.ts.net (ports possibles : 443, 8443, 10000)
```

Beta 100 % privée (≤ 3 utilisateurs) : `sudo tailscale serve --bg 8080` à la place, et inviter les testeurs sur le tailnet.

---

## 3. Exploitation

### 3.1 Mettre à jour (scénario 2)

```bash
cd ~/cta
./backup.sh                                  # toujours avant une migration
docker compose pull
docker compose run --rm migrate
docker compose up -d app worker              # recrée uniquement ce qui a changé
docker compose ps && curl -s -o /dev/null -w "%{http_code}\n" https://<hôte>/health
docker image prune -f
```

Épingler une version plutôt que `latest` : `APP_IMAGE=ghcr.io/malolebrin/career-transition-ai:sha-<7 car.>` dans `.env`.

### 3.2 Rollback (scénario 2)

```bash
# 1. revenir à l'image précédente
sed -i 's#^APP_IMAGE=.*#APP_IMAGE=ghcr.io/malolebrin/career-transition-ai:sha-<précédent>#' .env
docker compose up -d app worker
# 2. si la migration livrée doit être annulée (et seulement si elle est réversible)
docker compose run --rm app node build/bin/console.js migration:rollback --force --batch=<n-1>
# 3. sinon : restaurer la sauvegarde faite en 3.1
```

Scénario 1 : bouton *Rollback* dans Render ; pas de rollback de schéma → écrire des migrations additives.

### 3.3 Rotation des secrets

- `ADMIN_PASSWORD` : changer la valeur, puis `docker compose run --rm seed` (scénario 2) ou redéployer (scénario 1, le seed tourne au démarrage).
- `APP_KEY` : changer = **déconnecte tout le monde** (sessions et cookies signés). À faire hors heures d'usage.
- `MISTRAL_API_KEY`, `RESEND_API_KEY` : changer la valeur puis `docker compose up -d app worker` / redéploiement.

### 3.4 Logs et supervision

- Scénario 2 : `docker compose logs -f --tail=200 app worker` ; limiter la taille dans `/etc/docker/daemon.json` : `{"log-driver":"json-file","log-opts":{"max-size":"20m","max-file":"5"}}` puis `sudo systemctl restart docker`.
- Uptime : UptimeRobot ou cron-job.org (gratuits) sur `https://<hôte>/health`, alerte e-mail. Ne pas le faire sur Render Free (le réveil permanent contourne l'esprit du plan).
- Espace disque : `df -h` ; `docker system df` ; les sauvegardes locales sont purgées à 14 jours.

### 3.5 Créer les comptes testeurs (beta)

Le super admin crée l'organisation puis les conseillers/candidats depuis l'UI. Sans domaine vérifié (`MAIL_PROVIDER=console`), récupérer les liens d'onboarding :

```bash
docker compose logs app --since 10m | grep -i 'onboarding'
```

et les transmettre manuellement (message privé). Les liens sont à usage unique et expirent (voir `docs/ONBOARDING.md`).

---

## 4. Incidents courants

| Symptôme | Cause probable | Action |
|---|---|---|
| 500 sur toutes les pages, log `ERR_MODULE_NOT_FOUND …/build/build/ssr/ssr.js` | §0.1 non appliqué | Corriger `config/inertia.ts` / `config/vite.ts`, rebuild. |
| Boot : `E_MISSING_ENV` / `Missing environment variable` | variable vide ou absente (une valeur vide compte comme absente) | Comparer avec §5. |
| `The server does not support SSL connections` | `DB_SSL` absent/`true` face à un Postgres sans TLS | `DB_SSL=false` (compose). |
| `ADMIN_PASSWORD est requis…` pendant `migration:run` | §0.3 non appliqué | Vider la migration de seed ; définir `ADMIN_PASSWORD` pour le seeder. |
| Worker : `No jobs found for locations` | glob relatif au `cwd` (§0.4) ou image lancée depuis `build/` | Appliquer §0.4 ; lancer `node build/bin/console.js …` depuis `/app`. |
| Export PDF `completed` mais téléchargement « fichier introuvable » | web et worker ne partagent pas `/app/tmp` | Volume `exports` monté sur les deux services ; sur PaaS multi-services, passer à un stockage objet. |
| Exports PDF ne passent jamais en `completed` | pas de worker (ou `QUEUE_DRIVER=database` sans `queue:work`) | `docker compose ps worker`, logs ; en mono-process utiliser `QUEUE_DRIVER=sync`. |
| Lien d'onboarding en `http://` | `trustProxy` par défaut (`loopback`) | §0.6. |
| SSE coupés toutes les ~60–100 s, reconnexions en boucle | proxy qui bufferise / pas de keep-alive | `flush_interval -1` (Caddy), `pingInterval: '30s'` (§0.6). |
| Analyse IA vide avec message d'erreur | rate-limit plan Experiment / clé absente | Vérifier `MISTRAL_API_KEY`, limites dans la console Mistral ; le job retente 2 fois. |
| E-mail non reçu par un testeur (Resend) | pas de domaine vérifié : envoi restreint à ton adresse | Domaine + vérification DNS, ou `MAIL_PROVIDER=console`. |
| Neon : `compute time quota exceeded` | worker qui polle en continu | Scénario 1 = `QUEUE_DRIVER=sync`, jamais de worker permanent sur Neon Free. |
| Oracle : instance disparue | récupération « idle » Always Free | Restaurer depuis sauvegarde sur une nouvelle instance ; passer en PAYG. |
| Render : page « service unavailable » ~1 min | cold start | Attendu sur le plan Free. |
| OOM / redémarrages | pas de plafond V8 sur 512 Mo | `NODE_OPTIONS=--max-old-space-size=384` (web), `256` (worker). |

---

## 5. Référence : variables d'environnement de production

Validées au boot par `start/env.ts` (après §0.2) :

| Variable | Obligatoire | Valeur prod |
|---|---|---|
| `NODE_ENV` | oui | `production` |
| `HOST` / `PORT` | oui | `0.0.0.0` / port du conteneur ou de la plateforme |
| `APP_KEY` | oui | `node ace generate:key` |
| `LOG_LEVEL` | oui | `info` |
| `SESSION_DRIVER` | oui | `cookie` |
| `DB_URL` **ou** `DB_HOST`+`DB_PORT`+`DB_USER`+`DB_PASSWORD`+`DB_DATABASE` | oui (l'un des deux) | Neon : URL `?sslmode=require` ; compose : `DB_HOST=postgres` |
| `DB_SSL` | non (défaut `true`) | `false` seulement pour un Postgres sans TLS |
| `QUEUE_DRIVER` | oui | `sync` (mono-process) ou `database` (worker) |
| `AI_PROVIDER` | non | `mistral` ou `none` |
| `MISTRAL_API_KEY`, `MISTRAL_MODEL` | si `mistral` | clé ; `mistral-small-latest` |
| `REGISTRATION_ENABLED` | non (défaut `false` en production, `true` ailleurs) | `false` pendant la beta fermée : `/auth/register` redirige vers la connexion, `POST /auth/register` renvoie 403 et le lien « S'inscrire » disparaît. Les comptes se créent depuis l'UI super admin |
| `SEO_INDEXING` | non (défaut `false`) | `false` (`noindex, nofollow` + `robots.txt` en `Disallow: /`) tant que l'app est sur une URL provisoire ; `true` uniquement sur le domaine final (`config/seo.ts`) |
| `GOOGLE_SITE_VERIFICATION` | non | jeton Google Search Console ; la balise n'est rendue que s'il est défini |
| `SENTRY_DSN` | non (recommandé) | DSN d'un projet Sentry **en région EU** (plan gratuit). Absent : aucune erreur n'est envoyée, seulement les logs. Voir [§ suivi des erreurs](#suivi-des-erreurs-sentry) |
| `SENTRY_ENVIRONMENT` | non (défaut `NODE_ENV`) | `production`, `staging`… pour séparer les environnements dans Sentry |
| `SENTRY_RELEASE` | non (défaut `RENDER_GIT_COMMIT`) | sha du commit déployé ; Render le fournit, à définir ailleurs (`git rev-parse HEAD`) |

Lues hors schéma (pas d'erreur au boot si absentes) :

| Variable | Rôle |
|---|---|
| `MAIL_PROVIDER` | `console` (défaut) ou `resend` |
| `MAIL_FROM_EMAIL` | **requis en production** pour tout envoi, même en `console` |
| `MAIL_FROM_NAME`, `ADMIN_CONTACT_EMAIL`, `RESEND_API_KEY` | mail |
| `ADMIN_PASSWORD` | requis par `admin_seeder` (création/rotation du super admin) |
| `TZ` | `Europe/Paris` |
| `APP_NAME` | nom du logger (optionnel) |
| `NODE_OPTIONS` | `--max-old-space-size=384` recommandé sur 512 Mo |

Variables de **build** (embarquées dans le bundle navigateur, à ne pas confondre avec le runtime) : `VITE_APP_NAME` (optionnel). Aucune clé API ne doit être préfixée `VITE_`.

---

## Suivi des erreurs (Sentry)

Actif dès que `SENTRY_DSN` est défini, sur le serveur **et** le worker
(`start/error_tracking.ts`, `#services/error_tracking_service`) :

| Envoyé | Non envoyé |
|---|---|
| Erreurs HTTP **5xx** (`HttpExceptionHandler.report()`), avec méthode et route (`/dashboard/employees/:id`) | 4xx, erreurs métier (`ignoreCodes`), 404 |
| Jobs en **échec définitif** (retries épuisés), avec queue, nom du job, id et nombre de tentatives | tentatives rejouées, **payload** du job |
| Utilisateur réduit à son **id** | nom, e-mail, IP, cookies, corps de requête, query string (`scrubEvent`) |

Pas de traces de performance (`tracesSampleRate: 0`) : le quota gratuit
(5 000 événements/mois) reste pour les erreurs. Côté navigateur, une erreur de
rendu React affiche une page de secours (`ErrorBoundary`) au lieu d'une page
blanche ; elle n'est pas envoyée à Sentry.

Mise en place :

1. Créer un compte Sentry en **région EU** (choix à la création de
   l'organisation, non modifiable), puis un projet *Node.js*.
2. Copier le DSN dans `SENTRY_DSN` (web et worker ; groupe partagé sur Render).
3. Dans *Settings → Security & Privacy* : laisser **Data Scrubber** actif et
   cocher **Prevent Storing of IP Addresses**.
4. Créer une alerte e-mail « nouvelle issue » (*Alerts → Create alert → Issues*).
5. Vérifier après déploiement, depuis le Shell du service web ou worker :

   ```bash
   node build/bin/console.js error-tracking:test
   ```

   L'erreur « Test du suivi des erreurs (error-tracking:test) » doit apparaître
   dans Sentry avec sa stack, l'environnement et la release. Sans DSN, la
   commande échoue avec « SENTRY_DSN non défini ».

